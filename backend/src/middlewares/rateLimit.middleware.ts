// Rate limiters — stricter on auth endpoints; relaxed in test env.

import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

const limiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again later." },
};

export const authRateLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 10,
});

export const apiRateLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 100,
});
