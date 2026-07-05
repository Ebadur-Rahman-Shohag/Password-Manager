// Zod validation schemas for auth routes.

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

const verificationBlobSchema = z.object({
  ciphertext: z.string().min(1, "Ciphertext is required"),
  iv: z.string().min(1, "IV is required"),
});

export const setVerificationSchema = z.object({
  verificationBlob: verificationBlobSchema,
});
