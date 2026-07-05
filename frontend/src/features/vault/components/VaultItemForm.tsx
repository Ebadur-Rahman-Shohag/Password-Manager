import { useEffect, useState } from "react";
import type { VaultItemPlaintext } from "@password-manager/shared";
import { Button, Input, PasswordInput } from "../../../components/ui";
import { generatePassword } from "../../../utils/passwordGenerator";

interface VaultItemFormProps {
  initialData?: VaultItemPlaintext;
  editingId?: string | null;
  onSubmit: (data: VaultItemPlaintext) => Promise<void>;
  onCancel?: () => void;
}

const emptyForm: VaultItemPlaintext = {
  title: "",
  email: "",
  password: "",
  notes: "",
  category: "",
};

export function VaultItemForm({
  initialData,
  editingId,
  onSubmit,
  onCancel,
}: VaultItemFormProps) {
  const [form, setForm] = useState<VaultItemPlaintext>(initialData ?? emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData, editingId]);

  const handleGeneratePassword = () => {
    setForm({ ...form, password: generatePassword() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const payload: VaultItemPlaintext = {
        ...form,
        category: form.category?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };
      await onSubmit(payload);
      if (!editingId) {
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Title"
        type="text"
        placeholder="e.g. GitHub"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <PasswordInput
            label="Password"
            id="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="button" onClick={handleGeneratePassword}>
          Generate
        </Button>
      </div>
      <Input
        label="Category"
        type="text"
        placeholder="e.g. Work, Personal"
        value={form.category ?? ""}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
      <Input
        label="Notes"
        type="text"
        placeholder="Optional notes"
        value={form.notes ?? ""}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : editingId ? "Update entry" : "Save entry"}
        </Button>
        {editingId && onCancel && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
