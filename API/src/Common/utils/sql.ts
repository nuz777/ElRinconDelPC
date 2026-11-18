const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Escapa los comodines de LIKE/ILIKE (\, %, _) para que la búsqueda sea literal. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Indica si el valor tiene formato UUID (evita errores de casteo en PostgreSQL). */
export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/** Convierte un valor de fecha devuelto por `pg` (Date o string) en Date. */
export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
