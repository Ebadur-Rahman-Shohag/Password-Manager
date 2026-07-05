// Auth business logic — registration and login with bcrypt + JWT.

import crypto from "crypto";
import bcrypt from "bcrypt";
import type {
  LoginRequest,
  RegisterRequest,
  SessionResponse,
  VerificationBlob,
} from "@password-manager/shared";
import { AppError } from "../../utils/AppError";
import { signToken } from "../../utils/jwt";
import { User } from "./user.model";

const SALT_ROUNDS = 12;

function generateEncryptionSalt(): string {
  return crypto.randomBytes(16).toString("base64");
}

function toVerificationBlob(user: {
  verificationCiphertext?: string | null;
  verificationIv?: string | null;
}): VerificationBlob | null {
  if (user.verificationCiphertext && user.verificationIv) {
    return {
      ciphertext: user.verificationCiphertext,
      iv: user.verificationIv,
    };
  }
  return null;
}

export function toSessionPayload(user: {
  _id: { toString(): string };
  email: string;
  encryptionSalt: string;
  verificationCiphertext?: string | null;
  verificationIv?: string | null;
}): SessionResponse {
  return {
    encryptionSalt: user.encryptionSalt,
    verificationBlob: toVerificationBlob(user),
    user: {
      id: user._id.toString(),
      email: user.email,
    },
  };
}

export function createAuthToken(userId: string, tokenVersion: number): string {
  return signToken(userId, tokenVersion);
}

export async function revokeSession(userId: string): Promise<void> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true }
  );
  if (!user) {
    throw new AppError(401, "Unauthorized");
  }
}

export async function registerUser(data: RegisterRequest): Promise<SessionResponse> {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const encryptionSalt = generateEncryptionSalt();
  const user = await User.create({ email: data.email, passwordHash, encryptionSalt });

  return toSessionPayload(user);
}

export async function loginUser(data: LoginRequest): Promise<SessionResponse> {
  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw new AppError(401, "Unauthorized");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Unauthorized");
  }

  if (!user.encryptionSalt) {
    user.encryptionSalt = generateEncryptionSalt();
    await user.save();
  }

  return toSessionPayload(user);
}

export async function getSessionForUser(userId: string): Promise<SessionResponse> {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(401, "Unauthorized");
  }

  if (!user.encryptionSalt) {
    user.encryptionSalt = generateEncryptionSalt();
    await user.save();
  }

  return toSessionPayload(user);
}

export async function setVerificationBlob(
  userId: string,
  blob: VerificationBlob
): Promise<VerificationBlob> {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      verificationCiphertext: blob.ciphertext,
      verificationIv: blob.iv,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(404, "Not found");
  }

  return {
    ciphertext: user.verificationCiphertext!,
    iv: user.verificationIv!,
  };
}
