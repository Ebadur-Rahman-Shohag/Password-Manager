// JWT sign, verify, and decode utilities.

import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { parseDurationToMs } from "./duration";
import { AppError } from "./AppError";

export interface TokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface DecodedToken {
  userId: string;
  tokenVersion: number;
  exp: number;
}

export function getTokenMaxAgeMs(): number {
  return parseDurationToMs(env.jwtExpiresIn);
}

export function signToken(userId: string, tokenVersion: number): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ userId, tokenVersion }, env.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      userId?: string;
      tokenVersion?: number;
    };
    if (!payload.userId) {
      throw new AppError(401, "Unauthorized");
    }
    return {
      userId: payload.userId,
      tokenVersion: payload.tokenVersion ?? 0,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Unauthorized");
  }
}

export function decodeToken(token: string): DecodedToken | null {
  const payload = jwt.decode(token) as {
    userId?: string;
    tokenVersion?: number;
    exp?: number;
  } | null;
  if (!payload?.userId || !payload?.exp) {
    return null;
  }
  return {
    userId: payload.userId,
    tokenVersion: payload.tokenVersion ?? 0,
    exp: payload.exp,
  };
}
