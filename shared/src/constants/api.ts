// API route path constants matching the blueprint.

export const API_ROUTES = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
  },
  VAULT: {
    LIST: "/vault",
    CREATE: "/vault",
    BY_ID: (id: string) => `/vault/${id}`,
  },
} as const;
