// API route paths — mirrored from @password-manager/shared for Vite bundling.

export const API_ROUTES = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  VAULT: {
    LIST: "/vault",
    CREATE: "/vault",
    BY_ID: (id: string) => `/vault/${id}`,
  },
} as const;
