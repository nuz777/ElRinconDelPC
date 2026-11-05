import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";

/**
 * ProtectedRoute: Solo para usuarios autenticados.
 * Si no hay sesión válida, lo redirige a /login.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const [, setNavLocation] = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setNavLocation(redirectTo);
    }
  }, [isLoading, isAuthenticated, setNavLocation, redirectTo]);

  // Mientras se verifica la cookie, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
