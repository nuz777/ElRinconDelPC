import { InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  EncryptionUtil,
  maskApiKey,
  resolveEncryptionSecretKey,
} from './encryption.util.js';

describe('EncryptionUtil & maskApiKey (Unit)', () => {
  const originalEnvKey = process.env.ENCRYPTION_SECRET_KEY;

  afterEach(() => {
    if (originalEnvKey === undefined) {
      delete process.env.ENCRYPTION_SECRET_KEY;
    } else {
      process.env.ENCRYPTION_SECRET_KEY = originalEnvKey;
    }
  });

  it('cifra y descifra correctamente usando una clave hexadecimal de 32 bytes (64 hex)', () => {
    process.env.ENCRYPTION_SECRET_KEY = randomBytes(32).toString('hex');
    const util = new EncryptionUtil();
    const plain = 'AIzaSyD-ExampleSecretKey123459xQ';

    const encrypted1 = util.encrypt(plain);
    const encrypted2 = util.encrypt(plain);

    expect(encrypted1).not.toBe(plain);
    expect(encrypted1).not.toBe(encrypted2); // IV aleatorio diferente en cada cifrado
    expect(encrypted1.split(':')).toHaveLength(3);
    expect(util.decrypt(encrypted1)).toBe(plain);
    expect(util.decrypt(encrypted2)).toBe(plain);
  });

  it('acepta claves UTF-8 de 32 bytes y Base64 de 32 bytes', () => {
    const utf8Key = '12345678901234567890123456789012';
    expect(resolveEncryptionSecretKey(utf8Key)).toHaveLength(32);

    const b64Key = randomBytes(32).toString('base64');
    expect(resolveEncryptionSecretKey(b64Key)).toHaveLength(32);
  });

  it('falla cuando ENCRYPTION_SECRET_KEY falta o tiene longitud incorrecta', () => {
    expect(() => resolveEncryptionSecretKey(undefined)).toThrowError(
      InternalServerErrorException,
    );
    expect(() => resolveEncryptionSecretKey('clave-corta')).toThrowError(
      InternalServerErrorException,
    );
  });

  it('detecta manipulación del ciphertext o authTag en AES-256-GCM', () => {
    process.env.ENCRYPTION_SECRET_KEY = randomBytes(32).toString('hex');
    const util = new EncryptionUtil();
    const encrypted = util.encrypt('sk-ant-api03-secret-token-xyz');
    const [iv, tag, payload] = encrypted.split(':');
    const tamperedPayload =
      (payload.startsWith('00') ? 'ff' : '00') + payload.slice(2);

    expect(() =>
      util.decrypt(`${iv}:${tag}:${tamperedPayload}`),
    ).toThrowError(InternalServerErrorException);
  });

  it('enmascara API Keys sin exponer el contenido completo', () => {
    expect(maskApiKey('AIzaSyABCDEFGHIJK9xQ')).toBe('AIzaSy••••9xQ');
    expect(maskApiKey('nvapi-12345678')).toBe('nvapi-••••678');
    expect(maskApiKey('short12')).toBe('••••t12');
    expect(maskApiKey('abcd')).toBe('••••');
    expect(maskApiKey('   ')).toBe('');
  });
});
