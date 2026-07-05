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
//# sourceMappingURL=vault.d.ts.map