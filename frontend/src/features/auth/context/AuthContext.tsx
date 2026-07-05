// Auth context — session in memory only; JWT in HttpOnly cookie.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionResponse, VerificationBlob } from "@password-manager/shared";
import { setOnUnauthorized } from "../../../api/client";
import * as authApi from "../api/authApi";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  encryptionSalt: string | null;
  verificationBlob: VerificationBlob | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SessionResponse>;
  register: (email: string, password: string) => Promise<SessionResponse>;
  logout: () => Promise<void>;
  setSession: (response: SessionResponse) => void;
  setVerificationBlob: (blob: VerificationBlob | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function clearSessionState(
  setters: {
    setUser: (user: AuthUser | null) => void;
    setEncryptionSalt: (salt: string | null) => void;
    setVerificationBlobState: (blob: VerificationBlob | null) => void;
    setIsAuthenticated: (value: boolean) => void;
  }
): void {
  setters.setUser(null);
  setters.setEncryptionSalt(null);
  setters.setVerificationBlobState(null);
  setters.setIsAuthenticated(false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [encryptionSalt, setEncryptionSalt] = useState<string | null>(null);
  const [verificationBlob, setVerificationBlobState] = useState<VerificationBlob | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((response: SessionResponse) => {
    setUser(response.user);
    setEncryptionSalt(response.encryptionSalt);
    setVerificationBlobState(response.verificationBlob);
    setIsAuthenticated(true);
  }, []);

  const setVerificationBlob = useCallback((blob: VerificationBlob | null) => {
    setVerificationBlobState(blob);
  }, []);

  const setSession = useCallback(
    (response: SessionResponse) => {
      applySession(response);
    },
    [applySession]
  );

  const clearSession = useCallback(() => {
    clearSessionState({
      setUser,
      setEncryptionSalt,
      setVerificationBlobState,
      setIsAuthenticated,
    });
  }, []);

  useEffect(() => {
    setOnUnauthorized(clearSession);
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const session = await authApi.getSession();
        if (!cancelled) {
          applySession(session);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      applySession(response);
      return response;
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.register({ email, password });
      applySession(response);
      return response;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if cookie was already invalid.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      encryptionSalt,
      verificationBlob,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      setSession,
      setVerificationBlob,
    }),
    [
      user,
      encryptionSalt,
      verificationBlob,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      setSession,
      setVerificationBlob,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
