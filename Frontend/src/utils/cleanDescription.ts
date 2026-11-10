/**
 * Elimina cualquier texto genérico appendado automáticamente a las descripciones,
 * como "Añadido recientemente a la biblioteca de El sótano del pc por la comunidad."
 * o "Publicado oficialmente en la biblioteca de El Sótano del PC.".
 */
export function cleanDescription(desc?: string | null): string {
  if (!desc) return "";
  return desc
    .replace(
      /(?:\s*(?:Añadido recientemente a la biblioteca de El s[oó]tano del pc por la comunidad|Publicado oficialmente en la biblioteca de El S[oó]tano del PC)\.?)+/gi,
      ""
    )
    .trim();
}
