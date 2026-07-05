// Vault types — server stores encrypted payloads only; plaintext lives on client.

export interface EncryptedVaultPayload {
  ciphertext: string;
  iv: string;
}

export interface VaultEntry {
  id: string;
  userId: string;
  encryptedData: EncryptedVaultPayload;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultRequest {
  encryptedData: EncryptedVaultPayload;
}

export interface UpdateVaultRequest {
  encryptedData: EncryptedVaultPayload;
}

export interface VaultItemPlaintext {
  title: string;
  email: string;
  password: string;
  notes?: string;
  category?: string;
}
