// Shared auth request/response contracts between frontend and backend.

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerificationBlob {
  ciphertext: string;
  iv: string;
}

export interface SessionResponse {
  encryptionSalt: string;
  verificationBlob: VerificationBlob | null;
  user: {
    id: string;
    email: string;
  };
}
