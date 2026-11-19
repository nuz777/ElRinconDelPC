import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./authContextValue";
import {
  authService,
  AUTH_STATE_EVENT,
  SESSION_EXPIRED_EVENT,
  type AuthUser,
} from "../services/auth.service";
import { dialog } from "../../../shared/ui/dialog";
import { UNAUTHORIZED_EVENT } from "../../../shared/api/httpClient";

/** Tiempo mínimo entre revalidaciones al volver a la pestaña. */
const REVALIDATE_ON_FOCUS_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(authService.getStoredUser()),
  );
  // Solo se bloquea la UI si hay un token pero no hay usuario guardado.
  // Con un usuario guardado se entra al instante y la sesión se verifica en segundo plano.
  const [isLoading, setIsLoading] = useState<boolean>(
    () => authService.hasSessionHint() && !authService.getStoredUser(),
  );

  const applyResult = useCallback((result: { authenticated: boolean; user: AuthUser | null }) => {
    setIsAuthenticated(result.authenticated);
    setUser(result.user ?? null);
  }, []);

  const checkSession = useCallback(async (): Promise<void> => {
    try {
      applyResult(await authService.checkSession());
    } catch {
      // Error inesperado: se conserva la sesión local
      const stored = authService.getStoredUser();
      applyResult({ authenticated: Boolean(stored), user: stored });
    } finally {
      setIsLoading(false);
    }
  }, [applyResult]);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logoutRemote();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    let lastCheck = Date.now();

    const handleAuthChange = () => {
      const stored = authService.getStoredUser();
      setUser(stored);
      setIsAuthenticated(Boolean(stored));
    };

    const handleExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      void dialog.warning(
        "Tu sesión expiró",
        "Pasaron más de 30 días sin actividad o tus permisos cambiaron. Inicia sesión otra vez para seguir.",
        { confirmText: "Iniciar sesión" },
      ).then((goLogin) => {
        if (goLogin) {
          authService.rememberReturnPath(window.location.pathname);
          window.location.href = "/login";
        }
      });
    };

    // Revalida al volver a la pestaña (y renueva el token si toca)
    const handleVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!authService.hasSessionHint()) return;
      if (Date.now() - lastCheck < REVALIDATE_ON_FOCUS_MS) return;
      lastCheck = Date.now();
      void checkSession();
    };

    // Otra pestaña inició o cerró sesión
    const handleStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("sotano_")) handleAuthChange();
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthChange);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    const handleUnauthorized = () => authService.expireSession();
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisible);

    if (authService.hasSessionHint()) {
      void authService
        .checkSession()
        .then(applyResult)
        .catch(() => {
          const stored = authService.getStoredUser();
          applyResult({ authenticated: Boolean(stored), user: stored });
        })
        .finally(() => setIsLoading(false));
    }

    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthChange);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [checkSession, applyResult]);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, checkSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
