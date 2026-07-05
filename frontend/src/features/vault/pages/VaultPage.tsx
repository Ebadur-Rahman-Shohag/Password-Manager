import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { VaultItemPlaintext } from "@password-manager/shared";
import { useAuth } from "../../auth/context/AuthContext";
import { useCrypto } from "../../../crypto/CryptoContext";
import { VaultList } from "../components/VaultList";
import { VaultItemForm } from "../components/VaultItemForm";
import { useVault, type DecryptedVaultEntry } from "../hooks/useVault";
import { filterEntries, getUniqueCategories } from "../utils/filterEntries";
import { Button, Input } from "../../../components/ui";

export function VaultPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lock } = useCrypto();
  const { entries, isLoading, error, createEntry, updateEntry, deleteEntry } = useVault();
  const [editingEntry, setEditingEntry] = useState<DecryptedVaultEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => getUniqueCategories(entries), [entries]);

  const filteredEntries = useMemo(
    () => filterEntries(entries, searchQuery, categoryFilter),
    [entries, searchQuery, categoryFilter]
  );

  const listEmptyMessage =
    entries.length > 0 && filteredEntries.length === 0
      ? `No results for "${searchQuery || categoryFilter}".`
      : "No vault entries yet.";

  const handleLogout = async () => {
    lock();
    await logout();
    navigate("/login");
  };

  const handleLock = () => {
    lock();
    navigate("/unlock");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
  };

  const handleDelete = async (id: string) => {
    const wasLastFiltered =
      filteredEntries.length === 1 && filteredEntries[0].id === id;

    await deleteEntry(id);

    if (wasLastFiltered) {
      clearFilters();
    }
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
  };

  const handleSubmit = async (data: VaultItemPlaintext) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, data);
      setEditingEntry(null);
    } else {
      await createEntry(data);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          {user && <p className="text-sm text-gray-600">{user.email}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/settings">
            <Button type="button">Settings</Button>
          </Link>
          <Button type="button" onClick={handleLock}>
            Lock
          </Button>
          <Button type="button" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          label="Search"
          type="text"
          placeholder="Search title, email, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div>
          <label htmlFor="category-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading vault...</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {entries.length > 0 && filteredEntries.length === 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>No entries match your filters.</span>
          <Button type="button" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      <VaultList
        entries={filteredEntries}
        onEdit={setEditingEntry}
        onDelete={handleDelete}
        emptyMessage={listEmptyMessage}
      />

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          {editingEntry ? "Edit entry" : "Add entry"}
        </h2>
        <VaultItemForm
          key={editingEntry?.id ?? "new"}
          initialData={editingEntry?.data}
          editingId={editingEntry?.id ?? null}
          onSubmit={handleSubmit}
          onCancel={() => setEditingEntry(null)}
        />
      </div>
    </div>
  );
}
