import { randomInt } from 'node:crypto';

/** Alfabeto URL-safe (minúsculas + dígitos) para los códigos públicos. */
export const PUBLIC_CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const PUBLIC_CODE_LENGTH = 6;

const PUBLIC_CODE_REGEX = new RegExp(`^[a-z0-9]{${PUBLIC_CODE_LENGTH}}$`);

/**
 * Genera un código público aleatorio de 6 caracteres alfanuméricos
 * (ej. `a3f9k2`). Se usa en las URLs compartibles del catálogo
 * (`/juego/{slug}-{codigo}`) y se guarda una única vez por ítem.
 */
export function generatePublicCode(): string {
  let code = '';
  for (let i = 0; i < PUBLIC_CODE_LENGTH; i++) {
    code += PUBLIC_CODE_ALPHABET[randomInt(PUBLIC_CODE_ALPHABET.length)];
  }
  return code;
}

/** Indica si un texto tiene el formato de un código público válido. */
export function isValidPublicCode(code: string): boolean {
  return PUBLIC_CODE_REGEX.test(code);
}
