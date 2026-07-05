// Verification blob — proves correct master password even with an empty vault.

import type { VerificationBlob } from "@password-manager/shared";
import { decrypt, encrypt } from "./index";

export const VERIFICATION_PLAINTEXT = "vault-verified-v1";

export async function createVerificationBlob(key: CryptoKey): Promise<VerificationBlob> {
  return encrypt(VERIFICATION_PLAINTEXT, key);
}

export async function verifyVerificationBlob(
  blob: VerificationBlob,
  key: CryptoKey
): Promise<boolean> {
  try {
    const plaintext = await decrypt(blob.ciphertext, blob.iv, key);
    return plaintext === VERIFICATION_PLAINTEXT;
  } catch {
    return false;
  }
}
