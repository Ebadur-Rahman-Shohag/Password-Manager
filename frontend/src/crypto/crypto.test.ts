import { describe, it, expect } from "vitest";
import { deriveKey } from "./keyDerivation";
import { encrypt } from "./encrypt";
import { decrypt } from "./decrypt";
import {
  createVerificationBlob,
  verifyVerificationBlob,
  VERIFICATION_PLAINTEXT,
} from "./verification";

const SALT = Buffer.from("testsalt1234567").toString("base64");
const MASTER = "testmasterpass";

describe("crypto", () => {
  it("derives the same key from the same password and salt", async () => {
    const key1 = await deriveKey(MASTER, SALT);
    const key2 = await deriveKey(MASTER, SALT);
    const { ciphertext, iv } = await encrypt("same-input", key1);
    const plaintext = await decrypt(ciphertext, iv, key2);
    expect(plaintext).toBe("same-input");
  });

  it("encrypts and decrypts plaintext round-trip", async () => {
    const key = await deriveKey(MASTER, SALT);
    const { ciphertext, iv } = await encrypt('{"title":"GitHub"}', key);
    const plaintext = await decrypt(ciphertext, iv, key);
    expect(plaintext).toBe('{"title":"GitHub"}');
  });

  it("creates and verifies verification blob", async () => {
    const key = await deriveKey(MASTER, SALT);
    const blob = await createVerificationBlob(key);
    const valid = await verifyVerificationBlob(blob, key);
    expect(valid).toBe(true);
  });

  it("rejects verification blob with wrong master password", async () => {
    const key = await deriveKey(MASTER, SALT);
    const wrongKey = await deriveKey("wrongpassword", SALT);
    const blob = await createVerificationBlob(key);
    const valid = await verifyVerificationBlob(blob, wrongKey);
    expect(valid).toBe(false);
  });

  it("uses unique IVs per encryption", async () => {
    const key = await deriveKey(MASTER, SALT);
    const first = await encrypt(VERIFICATION_PLAINTEXT, key);
    const second = await encrypt(VERIFICATION_PLAINTEXT, key);
    expect(first.iv).not.toBe(second.iv);
  });
});
