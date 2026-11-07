import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.js';

describe('slugify (Unit)', () => {
  it('debe convertir un título simple a minúsculas y separar por guiones', () => {
    expect(slugify('Hollow Knight')).toBe('hollow-knight');
  });

  it('debe normalizar tildes y caracteres acentuados', () => {
    expect(slugify('Optimización Gráfica para Minecraft')).toBe(
      'optimizacion-grafica-para-minecraft',
    );
  });

  it('debe eliminar caracteres especiales no válidos en URLs', () => {
    expect(slugify('7-Zip: Versión #24.08 (Full!)')).toBe(
      '7-zip-version-2408-full',
    );
  });

  it('debe recortar espacios y guiones en los extremos', () => {
    expect(slugify('  --- Sodium Mod ---  ')).toBe('sodium-mod');
  });

  it('debe colapsar múltiples espacios o guiones consecutivos', () => {
    expect(slugify('Mod    con     muchos    espacios')).toBe(
      'mod-con-muchos-espacios',
    );
  });
});
