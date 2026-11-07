/**
 * Convierte un texto en un slug URL-friendly.
 * Normaliza acentos/tildes, elimina caracteres especiales y reemplaza espacios por guiones.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, diéresis)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
