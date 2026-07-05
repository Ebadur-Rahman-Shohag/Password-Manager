/**
 * Decrypts AES-GCM ciphertext using the derived key.
 */

import { base64ToUint8Array, uint8ArrayToString } from "./base64";

export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const ivBytes = base64ToUint8Array(iv);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    base64ToUint8Array(ciphertext)
  );

  return uint8ArrayToString(new Uint8Array(decrypted));
}
