/** Sesión de 30 días; el frontend la renueva (/auth/refresh) mientras el usuario esté activo. */
export const DEFAULT_JWT_EXPIRES_IN = '30d';
export const DEFAULT_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Lee el secreto desde JWT_SECRET. En producción es obligatorio;
 * en desarrollo se usa un valor por defecto para no bloquear el arranque.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET no está definido');
  }
  return 'dev-only-insecure-secret-change-me';
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
}
