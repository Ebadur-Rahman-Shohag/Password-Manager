/**
 * E2E verification script for Phase 3 crypto + API flow.
 * Run: npx tsx scripts/verify-phase3.mjs (from repo root)
 */

const BASE = "http://localhost:3000";
const email = `phase3-${Date.now()}@example.com`;
const accountPassword = "accountpass123";
const masterPassword = "masterpass123";

// --- Web Crypto helpers (mirrors frontend/src/crypto) ---

function stringToUint8Array(value) {
  return new TextEncoder().encode(value);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function deriveKey(masterPassword, saltBase64) {
  const salt = base64ToUint8Array(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    stringToUint8Array(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    stringToUint8Array(plaintext)
  );
  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

async function decrypt(ciphertext, iv, key) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToUint8Array(iv) },
    key,
    base64ToUint8Array(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}

async function api(path, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...optionHeaders },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body };
}

async function main() {
  console.log("1. Register...");
  const reg = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: accountPassword }),
  });
  if (reg.status !== 201 || !reg.body.encryptionSalt) {
    throw new Error(`Register failed: ${JSON.stringify(reg)}`);
  }
  const { token, encryptionSalt } = reg.body;
  console.log("   OK — encryptionSalt present");

  console.log("2. Derive key + create encrypted entry...");
  const key = await deriveKey(masterPassword, encryptionSalt);
  const plaintext = JSON.stringify({
    title: "GitHub",
    username: "devuser",
    password: "secret123",
    notes: "work account",
  });
  const encryptedData = await encrypt(plaintext, key);

  const create = await api("/vault", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ encryptedData }),
  });
  if (create.status !== 201) throw new Error(`Create failed: ${JSON.stringify(create)}`);
  const entryId = create.body.id;
  console.log("   OK — stored ciphertext+iv only");

  console.log("3. Login + decrypt with correct master password...");
  const login = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: accountPassword }),
  });
  const loginKey = await deriveKey(masterPassword, login.body.encryptionSalt);
  const list = await api("/vault", {
    headers: { Authorization: `Bearer ${login.body.token}` },
  });
  const decrypted = await decrypt(
    list.body[0].encryptedData.ciphertext,
    list.body[0].encryptedData.iv,
    loginKey
  );
  if (JSON.parse(decrypted).title !== "GitHub") throw new Error("Decrypt mismatch");
  console.log("   OK — round-trip decrypt works");

  console.log("4. Wrong master password fails decrypt...");
  const wrongKey = await deriveKey("wrongmasterpass", login.body.encryptionSalt);
  let failed = false;
  try {
    await decrypt(list.body[0].encryptedData.ciphertext, list.body[0].encryptedData.iv, wrongKey);
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Wrong password should fail decrypt");
  console.log("   OK — GCM rejects wrong key");

  console.log("5. Vault without token → 401...");
  const noAuth = await api("/vault");
  if (noAuth.status !== 401) throw new Error("Expected 401");
  console.log("   OK");

  console.log("6. Update + delete...");
  const updatedPlain = JSON.stringify({ title: "GitLab", username: "dev", password: "new" });
  const updatedEnc = await encrypt(updatedPlain, loginKey);
  const upd = await api(`/vault/${entryId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${login.body.token}` },
    body: JSON.stringify({ encryptedData: updatedEnc }),
  });
  if (upd.status !== 200) throw new Error("Update failed");
  const del = await api(`/vault/${entryId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${login.body.token}` },
  });
  if (del.status !== 204) throw new Error("Delete failed");
  console.log("   OK");

  console.log("\nAll Phase 3 verification checks passed.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
