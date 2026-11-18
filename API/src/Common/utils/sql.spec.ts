import { describe, expect, it } from 'vitest';
import { escapeLike, isUuid, toDate } from './sql.js';

describe('sql utils (Unit)', () => {
  it('escapeLike escapa \\, % y _', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });

  it('isUuid valida el formato UUID', () => {
    expect(isUuid('11111111-2222-3333-4444-555555555555')).toBe(true);
    expect(isUuid('hollow-knight')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });

  it('toDate acepta Date o string', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    expect(toDate(d)).toBe(d);
    expect(toDate('2026-01-01T00:00:00Z').getTime()).toBe(d.getTime());
  });
});
