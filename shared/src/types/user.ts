// User entity shape (server-side identity only; no master password).

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
