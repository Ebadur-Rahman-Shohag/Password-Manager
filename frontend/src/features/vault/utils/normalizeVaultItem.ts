// Normalize decrypted vault JSON — supports legacy username/tags fields.

import type { VaultItemPlaintext } from "@password-manager/shared";

type LegacyVaultItem = Partial<VaultItemPlaintext> & {
  username?: string;
  tags?: string[];
  title?: string;
  password?: string;
};

export function normalizeVaultItem(raw: LegacyVaultItem): VaultItemPlaintext {
  return {
    title: raw.title ?? "",
    email: raw.email ?? raw.username ?? "",
    password: raw.password ?? "",
    notes: raw.notes,
    category: raw.category,
  };
}
