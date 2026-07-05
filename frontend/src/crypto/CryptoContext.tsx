// Crypto context — derived key in memory only; cleared on lock/logout.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { VerificationBlob } from "@password-manager/shared";
import { useAuth } from "../features/auth/context/AuthContext";
import { deriveKey, decrypt } from "./index";
import {
  createVerificationBlob,
  verifyVerificationBlob,
} from "./verification";
import * as vaultApi from "../features/vault/api/vaultApi";
import * as verificationApi from "../features/auth/api/verificationApi";

interface UnlockSession {
  encryptionSalt: string;
  verificationBlob: VerificationBlob | null;
}

interface CryptoContextValue {
  cryptoKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (masterPassword: string, session?: UnlockSession) => Promise<void>;
  lock: () => void;
  setupVerification: (key: CryptoKey) => Promise<VerificationBlob>;
  replaceKey: (key: CryptoKey) => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

async function validateMasterPassword(
  key: CryptoKey,
  verificationBlob: VerificationBlob | null
): Promise<void> {
  if (verificationBlob) {
    const valid = await verifyVerificationBlob(verificationBlob, key);
    if (!valid) {
      throw new Error("Incorrect master password");
    }
    return;
  }

  const entries = await vaultApi.listVaultEntries();
  if (entries.length > 0) {
    const first = entries[0];
    try {
      await decrypt(first.encryptedData.ciphertext, first.encryptedData.iv, key);
    } catch {
      throw new Error("Incorrect master password");
    }
    return;
  }

  // Legacy user with empty vault and no verification blob — accept key.
}

export function CryptoProvider({ children }: { children: ReactNode }) {
  const { encryptionSalt, verificationBlob, setVerificationBlob } = useAuth();
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const setupVerification = useCallback(async (key: CryptoKey) => {
    const blob = await createVerificationBlob(key);
    const saved = await verificationApi.setupVerificationBlob(blob);
    setVerificationBlob(saved);
    return saved;
  }, [setVerificationBlob]);

  const unlock = useCallback(
    async (masterPassword: string, session?: UnlockSession) => {
      const salt = session?.encryptionSalt ?? encryptionSalt;
      const blob = session?.verificationBlob ?? verificationBlob;

      if (!salt) {
        throw new Error("No encryption salt available");
      }

      const key = await deriveKey(masterPassword, salt);
      await validateMasterPassword(key, blob);

      if (!blob) {
        await setupVerification(key);
      }

      setCryptoKey(key);
    },
    [encryptionSalt, verificationBlob, setupVerification]
  );

  const lock = useCallback(() => {
    setCryptoKey(null);
  }, []);

  const replaceKey = useCallback((key: CryptoKey) => {
    setCryptoKey(key);
  }, []);

  const value = useMemo(
    () => ({
      cryptoKey,
      isUnlocked: cryptoKey !== null,
      unlock,
      lock,
      setupVerification,
      replaceKey,
    }),
    [cryptoKey, unlock, lock, setupVerification, replaceKey]
  );

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCrypto(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) {
    throw new Error("useCrypto must be used within CryptoProvider");
  }
  return ctx;
}
