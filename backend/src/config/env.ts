// Loads and validates environment variables.

import dotenv from "dotenv";
import { parseDurationToMs } from "../utils/duration";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/password-manager",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  cookieSecure: process.env.COOKIE_SECURE === "true" || isProduction,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  jwtSlidingThresholdMs: parseDurationToMs(process.env.JWT_SLIDING_THRESHOLD ?? "6h"),
  allowBearerAuth:
    process.env.ALLOW_BEARER_AUTH === "true" || process.env.NODE_ENV === "test",
  isProduction,
};
