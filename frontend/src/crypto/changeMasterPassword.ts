// Re-encrypt all vault data when the master password changes.

import type { VaultEntry, VaultItemPlaintext, VerificationBlob } from "@password-manager/shared";
import { decrypt, deriveKey, encrypt } from "./index";
import { createVerificationBlob, verifyVerificationBlob } from "./verification";
import * as vaultApi from "../features/vault/api/vaultApi";
import * as verificationApi from "../features/auth/api/verificationApi";

export async function changeMasterPassword(params: {
  encryptionSalt: string;
  currentMasterPassword: string;
  newMasterPassword: string;
  verificationBlob: VerificationBlob;
}): Promise<{ verificationBlob: VerificationBlob }> {
  const { encryptionSalt, currentMasterPassword, newMasterPassword, verificationBlob } =
    params;

  const oldKey = await deriveKey(currentMasterPassword, encryptionSalt);
  const isValid = await verifyVerificationBlob(verificationBlob, oldKey);
  if (!isValid) {
    throw new Error("Incorrect current master password");
  }

  const newKey = await deriveKey(newMasterPassword, encryptionSalt);
  const encryptedEntries = await vaultApi.listVaultEntries();

  for (const entry of encryptedEntries) {
    const plaintext = await decrypt(
      entry.encryptedData.ciphertext,
      entry.encryptedData.iv,
      oldKey
    );
    const reencrypted = await encrypt(plaintext, newKey);
    await vaultApi.updateVaultEntry(entry.id, { encryptedData: reencrypted });
  }

  const newVerificationBlob = await createVerificationBlob(newKey);
  const savedBlob = await verificationApi.setupVerificationBlob(newVerificationBlob);

  return { verificationBlob: savedBlob };
}

export async function decryptEntry(
  entry: VaultEntry,
  key: CryptoKey
): Promise<VaultItemPlaintext> {
  const plaintext = await decrypt(
    entry.encryptedData.ciphertext,
    entry.encryptedData.iv,
    key
  );
  return JSON.parse(plaintext) as VaultItemPlaintext;
}
