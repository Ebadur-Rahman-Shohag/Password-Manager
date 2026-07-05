import { useState } from "react";
import type { DecryptedVaultEntry } from "../hooks/useVault";
import { Button, ConfirmDialog } from "../../../components/ui";

interface VaultListProps {
  entries: DecryptedVaultEntry[];
  onEdit: (entry: DecryptedVaultEntry) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

export function VaultList({
  entries,
  onEdit,
  onDelete,
  emptyMessage = "No vault entries yet.",
}: VaultListProps) {
  const [deleteTarget, setDeleteTarget] = useState<DecryptedVaultEntry | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <VaultListItem
            key={entry.id}
            entry={entry}
            onEdit={() => onEdit(entry)}
            onDelete={() => setDeleteTarget(entry)}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete entry"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.data.title}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function VaultListItem({
  entry,
  onEdit,
  onDelete,
}: {
  entry: DecryptedVaultEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const copyLabel =
    copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy";

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{entry.data.title}</h3>
            {entry.data.category && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {entry.data.category}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{entry.data.email}</p>
          <p className="mt-1 font-mono text-sm">
            {revealed ? entry.data.password : "••••••••"}
          </p>
          {entry.data.notes && (
            <p className="mt-2 text-sm text-gray-500">{entry.data.notes}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button type="button" onClick={() => setRevealed(!revealed)}>
            {revealed ? "Hide" : "Reveal"}
          </Button>
          <Button type="button" onClick={() => copy(entry.data.password)}>
            {copyLabel}
          </Button>
          <Button type="button" onClick={onEdit}>
            Edit
          </Button>
          <Button type="button" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
}
