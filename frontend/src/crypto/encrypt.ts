/**
 * Encrypts plaintext with AES-GCM. A new IV is generated per record.
 * Master password is never sent to the server.
 */

import { arrayBufferToBase64, stringToUint8Array } from "./base64";

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    stringToUint8Array(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
}
