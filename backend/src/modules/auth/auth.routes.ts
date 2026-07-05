// Auth routes — POST /register, POST /login, POST /logout, GET /me, PUT /verification.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateMiddleware } from "../../middlewares/validate.middleware";
import { authRateLimiter, apiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { slidingSessionMiddleware } from "../../middlewares/slidingSession.middleware";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema, setVerificationSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.use(apiRateLimiter);

authRouter.post(
  "/register",
  authRateLimiter,
  validateMiddleware(registerSchema),
  authController.register
);
authRouter.post(
  "/login",
  authRateLimiter,
  validateMiddleware(loginSchema),
  authController.login
);
authRouter.post("/logout", authMiddleware, authController.logout);
authRouter.get("/me", authMiddleware, slidingSessionMiddleware, authController.me);
authRouter.put(
  "/verification",
  authMiddleware,
  slidingSessionMiddleware,
  validateMiddleware(setVerificationSchema),
  authController.setVerification
);
