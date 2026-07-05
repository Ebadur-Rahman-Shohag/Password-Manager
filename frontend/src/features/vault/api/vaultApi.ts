// Vault API calls — CRUD on encrypted entries.

import type {
  CreateVaultRequest,
  UpdateVaultRequest,
  VaultEntry,
} from "@password-manager/shared";
import { API_ROUTES } from "../../../constants/api";
import { apiClient } from "../../../api/client";

export async function listVaultEntries(): Promise<VaultEntry[]> {
  return apiClient<VaultEntry[]>(API_ROUTES.VAULT.LIST);
}

export async function createVaultEntry(data: CreateVaultRequest): Promise<VaultEntry> {
  return apiClient<VaultEntry>(API_ROUTES.VAULT.CREATE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVaultEntry(
  id: string,
  data: UpdateVaultRequest
): Promise<VaultEntry> {
  return apiClient<VaultEntry>(API_ROUTES.VAULT.BY_ID(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVaultEntry(id: string): Promise<void> {
  await apiClient<void>(API_ROUTES.VAULT.BY_ID(id), { method: "DELETE" });
}
