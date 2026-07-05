// Auth HTTP handlers — request/response layer only.

import { Request, Response, NextFunction } from "express";
import type { LoginRequest, RegisterRequest, VerificationBlob } from "@password-manager/shared";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { setAuthCookie, clearAuthCookie } from "../../utils/authCookie";
import * as authService from "./auth.service";
import { User } from "./user.model";

async function issueAuthCookie(
  res: Response,
  userId: string
): Promise<void> {
  const user = await User.findById(userId).select("tokenVersion");
  if (!user) {
    throw new Error("User not found");
  }
  const token = authService.createAuthToken(userId, user.tokenVersion ?? 0);
  setAuthCookie(res, token);
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await authService.registerUser(req.body as RegisterRequest);
    await issueAuthCookie(res, session.user.id);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await authService.loginUser(req.body as LoginRequest);
    await issueAuthCookie(res, session.user.id);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authService.revokeSession(req.userId!);
    clearAuthCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await authService.getSessionForUser(req.userId!);
    res.status(200).json(session);
  } catch (err) {
    next(err);
  }
}

export async function setVerification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { verificationBlob } = req.body as { verificationBlob: VerificationBlob };
    const result = await authService.setVerificationBlob(req.userId!, verificationBlob);
    res.status(200).json({ verificationBlob: result });
  } catch (err) {
    next(err);
  }
}
