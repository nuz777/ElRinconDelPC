/**
 * Marcas y consolas (3.ª generación hasta la actual, incluidas portátiles) válidas
 * para las ROMs del catálogo. Debe mantenerse sincronizado con
 * Frontend/src/data/romPlatforms.ts, que añade el emulador y los requisitos sugeridos.
 */
export const ROM_PLATFORMS: Readonly<Record<string, readonly string[]>> = {
  Nintendo: [
    'NES',
    'Game Boy',
    'Super Nintendo',
    'Virtual Boy',
    'Nintendo 64',
    'Game Boy Color',
    'Game Boy Advance',
    'GameCube',
    'Nintendo DS',
    'Wii',
    'Nintendo 3DS',
    'Wii U',
    'Nintendo Switch',
    'Nintendo Switch 2',
  ],
  Sega: ['Master System', 'Mega Drive / Genesis', 'Game Gear', 'Sega Saturn', 'Dreamcast'],
  PlayStation: [
    'PlayStation',
    'PlayStation 2',
    'PSP',
    'PlayStation 3',
    'PS Vita',
    'PlayStation 4',
    'PlayStation 5',
  ],
  Xbox: ['Xbox', 'Xbox 360', 'Xbox One', 'Xbox Series X|S'],
  Atari: ['Atari 7800', 'Atari Lynx', 'Atari Jaguar'],
  NEC: ['TurboGrafx-16 / PC Engine'],
  SNK: ['Neo Geo AES', 'Neo Geo Pocket'],
  Panasonic: ['3DO'],
};

/** Indica si la combinación marca + consola existe en el catálogo de plataformas. */
export function isValidRomPlatform(brand: string, console: string): boolean {
  return ROM_PLATFORMS[brand]?.includes(console) ?? false;
}
