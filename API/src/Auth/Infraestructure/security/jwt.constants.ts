export const DEFAULT_JWT_EXPIRES_IN = '1d';

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
