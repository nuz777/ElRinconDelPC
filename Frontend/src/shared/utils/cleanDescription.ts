/**
 * Elimina textos genéricos heredados en descripciones del catálogo.
 */
export function cleanDescription(desc?: string | null): string {
  if (!desc) return "";
  return desc
    .replace(
      /(?:\s*(?:Añadido recientemente a la biblioteca de El s[oó]tano del pc por la comunidad|Publicado oficialmente en la biblioteca de El S[oó]tano del PC)\.?)+/gi,
      "",
    )
    .trim();
}
