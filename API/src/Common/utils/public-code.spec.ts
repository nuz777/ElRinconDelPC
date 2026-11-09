import { describe, expect, it } from 'vitest';
import { generatePublicCode, isValidPublicCode } from './public-code.js';

describe('public-code (Unit)', () => {
  it('genera códigos de 6 caracteres en minúsculas y dígitos', () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePublicCode()).toMatch(/^[a-z0-9]{6}$/);
    }
  });

  it('genera códigos distintos entre llamadas', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generatePublicCode()));
    expect(codes.size).toBeGreaterThan(195);
  });

  it('valida el formato del código', () => {
    expect(isValidPublicCode('a3f9k2')).toBe(true);
    expect(isValidPublicCode('A3F9K2')).toBe(false);
    expect(isValidPublicCode('a3f9k')).toBe(false);
    expect(isValidPublicCode('a3f9k2x')).toBe(false);
    expect(isValidPublicCode('a3-9k2')).toBe(false);
  });
});
