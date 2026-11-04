import { describe, it, expect } from 'vitest';
import { HashingService } from './hashing.service.js';

describe('HashingService (Unit)', () => {
  const hashingService = new HashingService();

  it('debe hashear y verificar contraseñas correctamente', async () => {
    const plain = 'SuperClave2026!';
    const hash = await hashingService.hash(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2b$10$') || hash.startsWith('$2a$10$')).toBe(true);

    const valid = await hashingService.compare(plain, hash);
    expect(valid).toBe(true);

    const invalid = await hashingService.compare('OtraClave', hash);
    expect(invalid).toBe(false);
  });
});
