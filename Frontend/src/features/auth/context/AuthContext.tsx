import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./authContextValue";
import {
  authService,
  AUTH_STATE_EVENT,
  type AuthUser,
} from "../services/auth.service";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(authService.getStoredUser()),
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => authService.hasSessionHint());

  const checkSession = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.checkSession();
      setIsAuthenticated(result.authenticated);
      setUser(result.user ?? null);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logoutRemote();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    let active = true;

    const handleAuthChange = () => {
      const stored = authService.getStoredUser();
      setUser(stored);
      setIsAuthenticated(Boolean(stored));
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthChange);

    if (authService.hasSessionHint()) {
      void authService
        .checkSession()
        .then((result) => {
          if (!active) return;
          setIsAuthenticated(result.authenticated);
          setUser(result.user ?? null);
        })
        .catch(() => {
          if (!active) return;
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }

    return () => {
      active = false;
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, checkSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
