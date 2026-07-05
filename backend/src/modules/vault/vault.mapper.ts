// Maps Mongoose vault documents to shared VaultEntry type.

import type { VaultEntry } from "@password-manager/shared";
import type { IVaultEntry } from "./vault.model";

export function toVaultEntry(doc: IVaultEntry): VaultEntry {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    encryptedData: {
      ciphertext: doc.ciphertext,
      iv: doc.iv,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
