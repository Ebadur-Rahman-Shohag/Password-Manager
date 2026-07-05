// HttpOnly auth cookie helpers — JWT not exposed to JavaScript.

import { Response } from "express";
import { env } from "../config/env";
import { decodeToken, getTokenMaxAgeMs, signToken } from "./jwt";

const COOKIE_NAME = "auth_token";

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: getTokenMaxAgeMs(),
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
  });
}

export function maybeRotateAuthCookie(res: Response, token: string): void {
  const decoded = decodeToken(token);
  if (!decoded) return;

  const msRemaining = decoded.exp * 1000 - Date.now();
  if (msRemaining < env.jwtSlidingThresholdMs) {
    const freshToken = signToken(decoded.userId, decoded.tokenVersion);
    setAuthCookie(res, freshToken);
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
