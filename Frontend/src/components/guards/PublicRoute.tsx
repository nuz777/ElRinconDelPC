import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";

/**
 * PublicRoute: Solo para usuarios NO autenticados.
 * Si el usuario ya tiene sesión activa, lo redirige al catálogo.
 * Ideal para: /login, /register, /recuperar
 */
export function PublicRoute({
  children,
  redirectTo = "/catalogo",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const [, setNavLocation] = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  // Si ya está autenticado, redirigir al catálogo sin mostrar el formulario
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setNavLocation(redirectTo);
    }
  }, [isLoading, isAuthenticated, setNavLocation, redirectTo]);

  // 1. Mientras se verifica la cookie, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-500" />
      </div>
    );
  }

  // 2. Si ya está autenticado, no renderizar el formulario mientras redirige
  if (isAuthenticated) {
    return null;
  }

  // 3. Si no tiene sesión, mostrar el contenido (login/register)
  return <>{children}</>;
}
