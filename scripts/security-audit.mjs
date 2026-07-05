#!/usr/bin/env node
/**
 * Local security audit — simulates common attacker techniques against YOUR running API.
 *
 * Usage (backend must be running on :3000):
 *   node scripts/security-audit.mjs
 *   node scripts/security-audit.mjs --base http://localhost:3000
 *
 * Warning: rate-limit tests send 11+ login requests and may temporarily block your IP
 * until the 15-minute window resets (or restart the backend).
 */

const args = process.argv.slice(2);
const baseFlag = args.indexOf("--base");
const BASE = baseFlag >= 0 ? args[baseFlag + 1] : "http://localhost:3000";

const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function warn(name, detail) {
  console.log(`  ⚠ ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseCookies(setCookieHeader) {
  const jar = new Map();
  if (!setCookieHeader) return jar;
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const header of headers) {
    const [pair] = header.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, body, headers: res.headers, setCookie, cookies: parseCookies(setCookie) };
}

async function registerUser(email, password = "attacker-test-pass123") {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// --- Tests ---

async function testHealthReachable() {
  const res = await request("/health");
  if (res.status === 200) pass("API reachable", BASE);
  else fail("API reachable", `HTTP ${res.status}`);
}

async function testSecurityHeaders() {
  const res = await request("/health");
  const nosniff = res.headers.get("x-content-type-options");
  if (nosniff === "nosniff") pass("Helmet X-Content-Type-Options", "nosniff");
  else fail("Helmet X-Content-Type-Options", `got ${nosniff ?? "missing"}`);
}

async function testVaultRequiresAuth() {
  const res = await request("/vault");
  if (res.status === 401) pass("Vault rejects unauthenticated access", "401");
  else fail("Vault rejects unauthenticated access", `HTTP ${res.status}`);
}

async function testFakeBearerRejected() {
  const res = await request("/vault", {
    headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.fake" },
  });
  if (res.status === 401) pass("Fake Bearer JWT rejected", "401");
  else fail("Fake Bearer JWT rejected", `HTTP ${res.status} (ALLOW_BEARER_AUTH may be true)`);
}

async function testFakeCookieRejected() {
  const res = await request("/vault", {
    headers: { Cookie: "auth_token=not-a-valid-jwt" },
  });
  if (res.status === 401) pass("Invalid auth cookie rejected", "401");
  else fail("Invalid auth cookie rejected", `HTTP ${res.status}`);
}

async function testRegisterNoTokenInBody() {
  const email = `audit-${Date.now()}@security-test.local`;
  const res = await registerUser(email);
  if (res.status !== 201) {
    fail("Register returns session without JWT in body", `register failed HTTP ${res.status}`);
    return null;
  }
  if (res.body?.token === undefined) pass("Register omits JWT from JSON body");
  else fail("Register omits JWT from JSON body", "token field present — XSS could steal it");

  const cookie = res.setCookie.find((c) => c.startsWith("auth_token="));
  if (cookie?.includes("HttpOnly")) pass("Register sets HttpOnly auth cookie");
  else fail("Register sets HttpOnly auth cookie", cookie ?? "no Set-Cookie");

  return { email, cookies: res.cookies };
}

async function testCookieAuthWorks(cookies) {
  const res = await request("/auth/me", {
    headers: { Cookie: cookieHeader(cookies) },
  });
  if (res.status === 200 && res.body?.user?.email) {
    pass("Valid cookie grants session", res.body.user.email);
  } else {
    fail("Valid cookie grants session", `HTTP ${res.status}`);
  }
}

async function testIdorVaultIsolation() {
  const emailA = `victim-a-${Date.now()}@security-test.local`;
  const emailB = `attacker-b-${Date.now()}@security-test.local`;

  const regA = await registerUser(emailA);
  const regB = await registerUser(emailB);
  if (regA.status !== 201 || regB.status !== 201) {
    fail("IDOR vault isolation", "could not register test users");
    return;
  }

  const jarA = regA.cookies;
  const jarB = regB.cookies;

  const create = await request("/vault", {
    method: "POST",
    headers: { Cookie: cookieHeader(jarA) },
    body: JSON.stringify({ encryptedData: { ciphertext: "secret-cipher", iv: "ivvalue1234" } }),
  });

  if (create.status !== 201) {
    fail("IDOR vault isolation", `victim create failed HTTP ${create.status}`);
    return;
  }

  const entryId = create.body?.id;
  const attackUpdate = await request(`/vault/${entryId}`, {
    method: "PUT",
    headers: { Cookie: cookieHeader(jarB) },
    body: JSON.stringify({ encryptedData: { ciphertext: "hacked-cipher", iv: "ivvalue1234" } }),
  });

  if (attackUpdate.status === 404 || attackUpdate.status === 403) {
    pass("IDOR blocked — attacker cannot modify victim entry", `HTTP ${attackUpdate.status}`);
  } else {
    fail("IDOR blocked", `attacker update HTTP ${attackUpdate.status}`);
  }

  const attackList = await request("/vault", {
    headers: { Cookie: cookieHeader(jarB) },
  });
  const victimVisible = Array.isArray(attackList.body) && attackList.body.some((e) => e.id === entryId);
  if (!victimVisible) pass("IDOR blocked — attacker vault list excludes victim entries");
  else fail("IDOR blocked — attacker vault list excludes victim entries", "victim entry visible");
}

async function testLoginRateLimit() {
  warn("Rate-limit test", "sending 11 login attempts — may trigger 429 for 15 min");
  const email = `ratelimit-${Date.now()}@security-test.local`;
  await registerUser(email);

  let lastStatus = 0;
  let got429 = false;
  for (let i = 1; i <= 11; i++) {
    const res = await loginUser(email, "wrong-password");
    lastStatus = res.status;
    if (res.status === 429) {
      got429 = true;
      break;
    }
  }

  if (got429) pass("Auth rate limit triggers 429", "after repeated login attempts");
  else fail("Auth rate limit triggers 429", `11 attempts, last HTTP ${lastStatus}`);
}

async function testUserEnumeration() {
  const resBad = await loginUser("nonexistent-user@security-test.local", "wrongpass123");
  const email = `enum-${Date.now()}@security-test.local`;
  await registerUser(email);
  const resGood = await loginUser(email, "wrongpass123");

  const msgA = resBad.body?.message ?? "";
  const msgB = resGood.body?.message ?? "";
  if (resBad.status === resGood.status && msgA === msgB) {
    pass("Login error messages consistent", "harder to enumerate valid emails");
  } else {
    warn("Login enumeration", `different responses: ${resBad.status}/${resGood.status} — consider uniform errors`);
  }
}

async function testLogoutInvalidatesSession(cookies) {
  const logout = await request("/auth/logout", {
    method: "POST",
    headers: { Cookie: cookieHeader(cookies) },
  });
  if (logout.status !== 204) {
    fail("Logout invalidates session", `logout HTTP ${logout.status}`);
    return;
  }

  const me = await request("/auth/me", {
    headers: { Cookie: cookieHeader(cookies) },
  });
  if (me.status === 401) pass("Session invalid after logout", "401 on /auth/me");
  else fail("Session invalid after logout", `HTTP ${me.status}`);
}

async function testServerNeverSeesMasterPassword() {
  pass(
    "Master password client-only (manual)",
    "confirm in DevTools Network: register/login bodies have account password only, never master password"
  );
}

async function testEncryptedVaultOnWire(cookies) {
  const res = await request("/vault", {
    method: "POST",
    headers: { Cookie: cookieHeader(cookies) },
    body: JSON.stringify({
      encryptedData: { ciphertext: "YWJj", iv: "xyziv1234567" },
    }),
  });
  if (res.status !== 201) {
    warn("Encrypted vault on wire", `create failed HTTP ${res.status}`);
    return;
  }
  const stored = res.body?.encryptedData;
  if (stored?.ciphertext && !stored.plaintext && !stored.password) {
    pass("Vault stores ciphertext only", "no plaintext fields in API response");
  } else {
    fail("Vault stores ciphertext only", JSON.stringify(stored));
  }
}

// --- Main ---

async function main() {
  console.log("\n🔐 Password Manager — local security audit");
  console.log(`   Target: ${BASE}\n`);

  try {
    await testHealthReachable();
  } catch (err) {
    console.error(`\n✗ Cannot reach ${BASE} — start the backend: npm run dev:backend\n`);
    process.exit(1);
  }

  console.log("\n[ Headers & auth boundaries ]");
  await testSecurityHeaders();
  await testVaultRequiresAuth();
  await testFakeBearerRejected();
  await testFakeCookieRejected();

  console.log("\n[ Session & cookie security ]");
  const session = await testRegisterNoTokenInBody();
  if (session) {
    await testCookieAuthWorks(session.cookies);
    await testEncryptedVaultOnWire(session.cookies);
    await testLogoutInvalidatesSession(session.cookies);
  }

  console.log("\n[ Authorization & data isolation ]");
  await testIdorVaultIsolation();

  console.log("\n[ Abuse resistance ]");
  await testUserEnumeration();
  await testLoginRateLimit();

  console.log("\n[ Zero-knowledge reminders ]");
  await testServerNeverSeesMasterPassword();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log("\n" + "─".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log("Failed checks:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  • ${r.name}: ${r.detail}`);
    }
    console.log("");
    process.exit(1);
  }

  console.log("All automated checks passed. Also verify manually in the browser:\n");
  console.log("  1. DevTools → Application: no token in localStorage/sessionStorage");
  console.log("  2. DevTools → Cookies: auth_token is HttpOnly");
  console.log("  3. Console: document.cookie does not show auth_token");
  console.log("  4. CSP blocks injected external scripts on the frontend\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
