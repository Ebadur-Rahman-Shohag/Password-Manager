// Client-side vault entry filtering — runs on decrypted data only.

import type { DecryptedVaultEntry } from "../hooks/useVault";

export function filterEntries(
  entries: DecryptedVaultEntry[],
  query: string,
  category?: string
): DecryptedVaultEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category?.trim().toLowerCase();

  return entries.filter((entry) => {
    if (normalizedCategory && normalizedCategory !== "all") {
      const entryCategory = entry.data.category?.toLowerCase() ?? "";
      if (entryCategory !== normalizedCategory) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      entry.data.title,
      entry.data.email,
      entry.data.notes ?? "",
      entry.data.category ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getUniqueCategories(entries: DecryptedVaultEntry[]): string[] {
  const categories = new Set<string>();
  for (const entry of entries) {
    if (entry.data.category?.trim()) {
      categories.add(entry.data.category.trim());
    }
  }
  return Array.from(categories).sort();
}
