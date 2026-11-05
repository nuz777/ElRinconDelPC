import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";

/**
 * AdminRoute: Solo para usuarios con rol de administrador.
 * Si el usuario no es admin (o no hay sesión), lo redirige al catálogo público.
 */
export function AdminRoute({
  children,
  redirectTo = "/catalogo",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const [, setNavLocation] = useLocation();
  const { isLoading, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Mientras se verifica la cookie, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-500" />
      </div>
    );
  }

  // Si no está autenticado ni es admin, redirigir al catálogo
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setNavLocation(redirectTo);
    }
  }, [isLoading, isAuthenticated, user, isAdmin, setNavLocation, redirectTo]);

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
