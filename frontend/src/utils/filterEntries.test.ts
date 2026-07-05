import { describe, it, expect } from "vitest";
import { filterEntries, getUniqueCategories } from "../features/vault/utils/filterEntries";
import type { DecryptedVaultEntry } from "../features/vault/hooks/useVault";

const entries: DecryptedVaultEntry[] = [
  {
    id: "1",
    userId: "u1",
    data: {
      title: "GitHub",
      email: "dev@example.com",
      password: "x",
      category: "Work",
    },
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    userId: "u1",
    data: {
      title: "Netflix",
      email: "home@example.com",
      password: "y",
      category: "Personal",
    },
    createdAt: "",
    updatedAt: "",
  },
];

describe("filterEntries", () => {
  it("filters by search query", () => {
    const result = filterEntries(entries, "github");
    expect(result).toHaveLength(1);
    expect(result[0].data.title).toBe("GitHub");
  });

  it("filters by email in search query", () => {
    const result = filterEntries(entries, "dev@example.com");
    expect(result).toHaveLength(1);
    expect(result[0].data.email).toBe("dev@example.com");
  });

  it("filters by category", () => {
    const result = filterEntries(entries, "", "Work");
    expect(result).toHaveLength(1);
    expect(result[0].data.category).toBe("Work");
  });

  it("returns unique sorted categories", () => {
    expect(getUniqueCategories(entries)).toEqual(["Personal", "Work"]);
  });
});
