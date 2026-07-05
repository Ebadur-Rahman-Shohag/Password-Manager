import { describe, it, expect } from "vitest";
import { generatePassword } from "./passwordGenerator";

describe("passwordGenerator", () => {
  it("generates password of requested length", () => {
    const password = generatePassword({ length: 20 });
    expect(password).toHaveLength(20);
  });

  it("includes character types when enabled", () => {
    const password = generatePassword({
      length: 32,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });
});
