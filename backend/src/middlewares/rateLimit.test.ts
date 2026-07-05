import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";

describe("rate limiting", () => {
  it("returns 429 after exceeding the auth attempt limit", async () => {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests. Try again later." },
    });

    const testApp = express();
    testApp.use(express.json());
    testApp.post("/auth/login", limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });

    for (let i = 0; i < 10; i++) {
      const res = await request(testApp)
        .post("/auth/login")
        .send({ email: "test@test.com", password: "password123" });
      expect(res.status).toBe(200);
    }

    const blocked = await request(testApp)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe("Too many requests. Try again later.");
  });
});
