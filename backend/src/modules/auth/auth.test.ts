import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app";
import { getTokenMaxAgeMs } from "../../utils/jwt";

function expectAuthCookie(res: request.Response): void {
  const cookieHeader = res.headers["set-cookie"];
  expect(cookieHeader).toBeDefined();
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  const authCookie = cookies.find((c) => c.startsWith("auth_token="));
  expect(authCookie).toBeDefined();
  expect(authCookie).toContain("HttpOnly");

  const maxAgeSeconds = Math.floor(getTokenMaxAgeMs() / 1000);
  expect(authCookie).toContain(`Max-Age=${maxAgeSeconds}`);
}

describe("auth API", () => {
  it("registers a new user with encryption salt and HttpOnly cookie", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "newuser@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.encryptionSalt).toBeDefined();
    expect(res.body.verificationBlob).toBeNull();
    expect(res.body.user.email).toBe("newuser@test.com");
    expectAuthCookie(res);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("rejects duplicate email registration", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "dup@test.com", password: "password123" });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "dup@test.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("logs in with valid credentials and sets HttpOnly cookie", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "login@test.com", password: "password123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.encryptionSalt).toBeDefined();
    expectAuthCookie(res);
  });

  it("returns session from GET /auth/me when cookie is present", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/register")
      .send({ email: "me@test.com", password: "password123" });

    const res = await agent.get("/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("me@test.com");
    expect(res.body.encryptionSalt).toBeDefined();
    expect(res.body.token).toBeUndefined();
  });

  it("rotates auth cookie on GET /auth/me when token is near expiry", async () => {
    const register = await request(app)
      .post("/auth/register")
      .send({ email: "slide@test.com", password: "password123" });

    const userId = register.body.user.id;
    const nearExpiryToken = jwt.sign({ userId, tokenVersion: 0 }, process.env.JWT_SECRET!, {
      expiresIn: "30s",
    });

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `auth_token=${nearExpiryToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    const cookies = Array.isArray(res.headers["set-cookie"])
      ? res.headers["set-cookie"]
      : [res.headers["set-cookie"]];
    expect(cookies.some((c) => c.startsWith("auth_token="))).toBe(true);
  });

  it("clears session on POST /auth/logout", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/register")
      .send({ email: "logout@test.com", password: "password123" });

    const logout = await agent.post("/auth/logout");
    expect(logout.status).toBe(204);

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(401);
  });

  it("rejects a stolen token after logout even when cookie is replayed", async () => {
    const register = await request(app)
      .post("/auth/register")
      .send({ email: "stolen-token@test.com", password: "password123" });

    const setCookie = register.headers["set-cookie"] as string[] | undefined;
    const authCookie = setCookie?.find((c) => c.startsWith("auth_token="));
    expect(authCookie).toBeDefined();
    const stolenToken = authCookie!.split(";")[0].replace("auth_token=", "");

    const logout = await request(app)
      .post("/auth/logout")
      .set("Cookie", `auth_token=${stolenToken}`);
    expect(logout.status).toBe(204);

    const replay = await request(app)
      .get("/auth/me")
      .set("Cookie", `auth_token=${stolenToken}`);
    expect(replay.status).toBe(401);
  });

  it("stores verification blob for authenticated user", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/register")
      .send({ email: "verify@test.com", password: "password123" });

    const blob = { ciphertext: "abc", iv: "xyz" };

    const res = await agent
      .put("/auth/verification")
      .send({ verificationBlob: blob });

    expect(res.status).toBe(200);
    expect(res.body.verificationBlob).toEqual(blob);

    const login = await agent
      .post("/auth/login")
      .send({ email: "verify@test.com", password: "password123" });

    expect(login.body.verificationBlob).toEqual(blob);
  });
});
