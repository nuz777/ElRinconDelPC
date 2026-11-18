import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { FilterCatalogDto } from '../Catalog/Application/DTOs/filter-catalog.dto.js';
import { FilterGamesDto } from '../Games/Application/DTOs/filter-games.dto.js';
import { FilterModsDto } from '../Mods/Application/DTOs/filter-mods.dto.js';
import { FilterToolsDto } from '../Tools/Application/DTOs/filter-tools.dto.js';

describe('Filter DTOs Validation (Unit)', () => {
  it('todos los DTOs de listado rechazan limit > 100', async () => {
    const catalogDto = plainToInstance(FilterCatalogDto, { page: 1, limit: 999999 });
    const gamesDto = plainToInstance(FilterGamesDto, { page: 1, limit: 999999 });
    const modsDto = plainToInstance(FilterModsDto, { page: 1, limit: 999999 });
    const toolsDto = plainToInstance(FilterToolsDto, { page: 1, limit: 999999 });

    for (const dto of [catalogDto, gamesDto, modsDto, toolsDto]) {
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    }
  });

  it('aceptan valores válidos y transforman booleanos en FilterToolsDto', async () => {
    const gamesDto = plainToInstance(FilterGamesDto, { page: 1, limit: 24 });
    const modsDto = plainToInstance(FilterModsDto, { page: 1, limit: 50 });
    const toolsDto = plainToInstance(FilterToolsDto, {
      page: 1,
      limit: 20,
      isActive: 'false',
    });

    await expect(validate(gamesDto)).resolves.toHaveLength(0);
    await expect(validate(modsDto)).resolves.toHaveLength(0);
    await expect(validate(toolsDto)).resolves.toHaveLength(0);
    expect(toolsDto.isActive).toBe(false);
  });
});
