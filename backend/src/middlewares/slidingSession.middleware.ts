// Re-issue auth cookie when the JWT is close to expiry (sliding session).

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AUTH_COOKIE_NAME, maybeRotateAuthCookie } from "../utils/authCookie";

export function slidingSessionMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token === "string" && token.length > 0) {
    maybeRotateAuthCookie(res, token);
  }
  next();
}
