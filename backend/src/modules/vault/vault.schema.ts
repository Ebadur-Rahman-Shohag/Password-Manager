// Zod validation schemas for vault routes.

import { z } from "zod";

const encryptedVaultPayloadSchema = z.object({
  ciphertext: z.string().min(1, "Ciphertext is required"),
  iv: z.string().min(1, "IV is required"),
});

export const createVaultSchema = z.object({
  encryptedData: encryptedVaultPayloadSchema,
});

export const updateVaultSchema = z.object({
  encryptedData: encryptedVaultPayloadSchema,
});
