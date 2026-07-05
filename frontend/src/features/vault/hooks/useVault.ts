import { useCallback, useEffect, useState } from "react";
import type { VaultItemPlaintext } from "@password-manager/shared";
import { useCrypto } from "../../../crypto/CryptoContext";
import { decrypt, encrypt } from "../../../crypto";
import * as vaultApi from "../api/vaultApi";
import { normalizeVaultItem } from "../utils/normalizeVaultItem";

export interface DecryptedVaultEntry {
  id: string;
  userId: string;
  data: VaultItemPlaintext;
  createdAt: string;
  updatedAt: string;
}

export function useVault() {
  const { cryptoKey } = useCrypto();
  const [entries, setEntries] = useState<DecryptedVaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cryptoKey) return;

    setIsLoading(true);
    setError(null);
    try {
      const encrypted = await vaultApi.listVaultEntries();
      const decrypted = await Promise.all(
        encrypted.map(async (entry) => {
          const plaintext = await decrypt(
            entry.encryptedData.ciphertext,
            entry.encryptedData.iv,
            cryptoKey
          );
          return {
            id: entry.id,
            userId: entry.userId,
            data: normalizeVaultItem(JSON.parse(plaintext)),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          };
        })
      );
      setEntries(decrypted);
    } catch {
      setError("Failed to load vault entries");
    } finally {
      setIsLoading(false);
    }
  }, [cryptoKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEntry = useCallback(
    async (data: VaultItemPlaintext) => {
      if (!cryptoKey) throw new Error("Vault is locked");

      const encryptedData = await encrypt(JSON.stringify(data), cryptoKey);
      await vaultApi.createVaultEntry({ encryptedData });
      await refresh();
    },
    [cryptoKey, refresh]
  );

  const updateEntry = useCallback(
    async (id: string, data: VaultItemPlaintext) => {
      if (!cryptoKey) throw new Error("Vault is locked");

      const encryptedData = await encrypt(JSON.stringify(data), cryptoKey);
      await vaultApi.updateVaultEntry(id, { encryptedData });
      await refresh();
    },
    [cryptoKey, refresh]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await vaultApi.deleteVaultEntry(id);
      await refresh();
    },
    [refresh]
  );

  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    refresh,
  };
}
