// Vault business logic — CRUD scoped by userId, stores encrypted blobs only.

import type {
  CreateVaultRequest,
  UpdateVaultRequest,
  VaultEntry,
} from "@password-manager/shared";
import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { toVaultEntry } from "./vault.mapper";
import { VaultEntry as VaultEntryModel } from "./vault.model";

export async function listVaultEntries(userId: string): Promise<VaultEntry[]> {
  const entries = await VaultEntryModel.find({ userId: new Types.ObjectId(userId) });
  return entries.map(toVaultEntry);
}

export async function createVaultEntry(
  userId: string,
  data: CreateVaultRequest
): Promise<VaultEntry> {
  const entry = await VaultEntryModel.create({
    userId: new Types.ObjectId(userId),
    ciphertext: data.encryptedData.ciphertext,
    iv: data.encryptedData.iv,
  });
  return toVaultEntry(entry);
}

export async function updateVaultEntry(
  userId: string,
  id: string,
  data: UpdateVaultRequest
): Promise<VaultEntry> {
  const entry = await VaultEntryModel.findOneAndUpdate(
    { _id: id, userId: new Types.ObjectId(userId) },
    {
      ciphertext: data.encryptedData.ciphertext,
      iv: data.encryptedData.iv,
    },
    { new: true }
  );

  if (!entry) {
    throw new AppError(404, "Not found");
  }

  return toVaultEntry(entry);
}

export async function deleteVaultEntry(userId: string, id: string): Promise<void> {
  const result = await VaultEntryModel.deleteOne({
    _id: id,
    userId: new Types.ObjectId(userId),
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, "Not found");
  }
}
