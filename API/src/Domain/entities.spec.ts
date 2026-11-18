import { describe, expect, it } from 'vitest';
import { Role } from '../Auth/Domain/Entities/roles.enum.js';
import { User } from '../Auth/Domain/Entities/user.entity.js';
import { isValidRomPlatform } from '../Catalog/Domain/Entities/rom-platforms.js';
import { Game } from '../Games/Domain/Entities/game.entity.js';
import { Mod } from '../Mods/Domain/Entities/mod.entity.js';
import { Tool } from '../Tools/Domain/Entities/tool.entity.js';

describe('Domain Entities & Helpers (Unit)', () => {
  it('User valida roles y ciclo de vida del token de reseteo', () => {
    const admin = new User({ id: '1', email: 'a@b.com', role: Role.ADMIN });
    expect(admin.hasRole(Role.ADMIN)).toBe(true);
    expect(admin.isAdmin()).toBe(true);

    const now = new Date('2026-01-01T12:00:00Z');
    admin.setResetToken('123456', new Date('2026-01-01T12:15:00Z'));
    expect(admin.isResetTokenValid(now)).toBe(true);
    expect(admin.isResetTokenValid(new Date('2026-01-01T12:20:00Z'))).toBe(false);

    admin.clearResetToken();
    expect(admin.isResetTokenValid(now)).toBe(false);
  });

  it('Game calcula descuentos, precio efectivo, stock y desactivación', () => {
    const game = new Game({
      id: 'g-1',
      title: 'Juego',
      slug: 'Juego',
      description: 'Desc',
      price: 20,
      discountPrice: 12,
      stock: 3,
      genres: ['RPG'],
      coverImage: 'c.jpg',
      developer: 'Dev',
      publisher: 'Pub',
    });

    expect(game.hasDiscount()).toBe(true);
    expect(game.effectivePrice()).toBe(12);
    expect(game.hasStock(3)).toBe(true);
    expect(game.hasStock(4)).toBe(false);

    game.deactivate();
    expect(game.isActive).toBe(false);
  });

  it('Mod y Tool validan propiedad, aprobación, descargas y desactivación', () => {
    const mod = new Mod({
      id: 'm-1',
      title: 'Mod',
      slug: 'Mod',
      description: 'Desc',
      version: '1.0',
      downloadUrl: 'https://x.com',
      authorId: 'u-1',
    });

    expect(mod.canBeModifiedBy('u-1', 'user')).toBe(true);
    expect(mod.canBeModifiedBy('u-2', 'admin')).toBe(true);
    expect(mod.canBeModifiedBy('u-2', 'user')).toBe(false);
    mod.approve();
    mod.incrementDownloads();
    mod.deactivate();
    expect(mod.isApproved).toBe(true);
    expect(mod.downloadsCount).toBe(1);
    expect(mod.isActive).toBe(false);

    const tool = new Tool({
      id: 't-1',
      title: 'Tool',
      slug: 'Tool',
      description: 'Desc',
      category: 'Utilidades',
      version: '1.0',
      size: null,
      downloadUrl: 'https://x.com',
      imageUrl: null,
      tags: [],
      authorId: 'u-1',
    });

    expect(tool.canBeModifiedBy('u-1', 'user')).toBe(true);
    tool.incrementDownloads();
    tool.deactivate();
    expect(tool.downloadsCount).toBe(1);
    expect(tool.isActive).toBe(false);
  });

  it('isValidRomPlatform valida marca y consola', () => {
    expect(isValidRomPlatform('Nintendo', 'Nintendo 64')).toBe(true);
    expect(isValidRomPlatform('Nintendo', 'PlayStation 2')).toBe(false);
    expect(isValidRomPlatform('Desconocida', 'Consola')).toBe(false);
  });
});
