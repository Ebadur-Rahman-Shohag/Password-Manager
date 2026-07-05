/**
 * Derives an encryption key from the master password using PBKDF2 (Web Crypto).
 * Master password is never persisted — only used in memory during derivation.
 */

import { base64ToUint8Array, stringToUint8Array } from "./base64";

const PBKDF2_ITERATIONS = 310_000;

export async function deriveKey(
  masterPassword: string,
  saltBase64: string
): Promise<CryptoKey> {
  const salt = base64ToUint8Array(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    stringToUint8Array(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
