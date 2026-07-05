// Re-export shared types for frontend convenience.

export type {
  RegisterRequest,
  LoginRequest,
  SessionResponse,
  VerificationBlob,
  User,
  VaultEntry,
  EncryptedVaultPayload,
  CreateVaultRequest,
  UpdateVaultRequest,
  VaultItemPlaintext,
} from "@password-manager/shared";

export { API_ROUTES } from "@password-manager/shared";
