import { describe, it, expect } from "vitest";
import { normalizeVaultItem } from "./normalizeVaultItem";

describe("normalizeVaultItem", () => {
  it("maps legacy username to email", () => {
    const result = normalizeVaultItem({
      title: "GitHub",
      username: "dev@example.com",
      password: "secret",
    });
    expect(result.email).toBe("dev@example.com");
    expect(result).not.toHaveProperty("username");
  });

  it("prefers email over legacy username", () => {
    const result = normalizeVaultItem({
      title: "GitHub",
      email: "new@example.com",
      username: "old@example.com",
      password: "secret",
    });
    expect(result.email).toBe("new@example.com");
  });
});
