// JWT authentication middleware — HttpOnly cookie; Bearer only when allowed.

import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";
import { User } from "../modules/auth/user.model";

export interface AuthRequest extends Request {
  userId?: string;
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  if (env.allowBearerAuth) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const token = header.slice(7);
      if (token) return token;
    }
  }

  return null;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const { userId, tokenVersion } = verifyToken(token);
    const user = await User.findById(userId).select("tokenVersion");
    if (!user || (user.tokenVersion ?? 0) !== tokenVersion) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    req.userId = userId;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
      return;
    }
    res.status(401).json({ message: "Unauthorized" });
  }
}
