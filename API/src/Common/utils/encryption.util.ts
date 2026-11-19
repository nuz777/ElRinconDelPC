import {
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const SECRET_KEY_LENGTH_BYTES = 32;
const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;
const HEX_PAIR_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Enmascara una API Key para mostrarla de forma segura al administrador
 * (por ejemplo: `AIzaSy••••9xQ`). Nunca devuelve la clave completa.
 */
export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 4) return '••••';
  if (trimmed.length < 10) {
    return `••••${trimmed.slice(-3)}`;
  }
  return `${trimmed.slice(0, 6)}••••${trimmed.slice(-3)}`;
}

/**
 * Normaliza la variable `ENCRYPTION_SECRET_KEY` a un Buffer de exactamente 32 bytes.
 * Acepta:
 * - 64 caracteres hexadecimales (32 bytes, ej. `openssl rand -hex 32`)
 * - Cadena UTF-8 de exactamente 32 bytes
 * - Cadena Base64 que decodifique exactamente a 32 bytes
 */
export function resolveEncryptionSecretKey(rawKey?: string): Buffer {
  const raw = rawKey?.trim();
  if (!raw) {
    throw new InternalServerErrorException(
      'ENCRYPTION_SECRET_KEY no está configurada en el servidor.',
    );
  }

  if (HEX_64_REGEX.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  if (Buffer.byteLength(raw, 'utf8') === SECRET_KEY_LENGTH_BYTES) {
    return Buffer.from(raw, 'utf8');
  }

  const base64Buf = Buffer.from(raw, 'base64');
  if (
    base64Buf.length === SECRET_KEY_LENGTH_BYTES &&
    base64Buf.toString('base64').replace(/=+$/, '') === raw.replace(/=+$/, '')
  ) {
    return base64Buf;
  }

  throw new InternalServerErrorException(
    'ENCRYPTION_SECRET_KEY debe tener exactamente 32 bytes (64 hex, 32 bytes UTF-8 o Base64 de 32 bytes).',
  );
}

@Injectable()
export class EncryptionUtil {
  constructor(@Optional() private readonly configService?: ConfigService) {}

  private getSecretKey(): Buffer {
    const raw =
      this.configService?.get<string>('ENCRYPTION_SECRET_KEY') ??
      process.env.ENCRYPTION_SECRET_KEY;
    return resolveEncryptionSecretKey(raw);
  }

  /**
   * Cifra una API Key usando AES-256-GCM con IV aleatorio por operación.
   * Formato retornado: `<ivHex>:<authTagHex>:<cipherHex>`.
   */
  encrypt(apiKey: string): string {
    const normalized = apiKey?.trim();
    if (!normalized) {
      throw new InternalServerErrorException(
        'No se puede cifrar una API Key vacía.',
      );
    }

    const key = this.getSecretKey();
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(normalized, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Descifra una API Key cifrada con `encrypt()` validando el AuthTag de GCM.
   */
  decrypt(encryptedKey: string): string {
    const parts = encryptedKey?.split(':') ?? [];
    if (parts.length !== 3 || parts.some((p) => !p || !HEX_PAIR_REGEX.test(p))) {
      throw new InternalServerErrorException(
        'Formato inválido de API Key cifrada.',
      );
    }

    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    if (
      iv.length !== IV_LENGTH_BYTES ||
      authTag.length !== AUTH_TAG_LENGTH_BYTES ||
      ciphertext.length === 0
    ) {
      throw new InternalServerErrorException(
        'Metadatos de cifrado inválidos en la API Key.',
      );
    }

    const key = this.getSecretKey();
    try {
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'No se pudo descifrar la API Key almacenada.',
      );
    }
  }
}
