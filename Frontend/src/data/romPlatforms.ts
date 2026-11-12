import type { CatalogItem } from "./catalog";

/**
 * Marcas y consolas para el apartado ROMs (3.ª generación hasta la actual, con portátiles).
 * Los nombres deben coincidir con API/src/Catalog/Domain/Entities/rom-platforms.ts.
 * El emulador y los requisitos son sugerencias que se precargan al subir una ROM
 * (el admin puede editarlos).
 */

type Requirements = NonNullable<CatalogItem["requirements"]>;

export interface RomConsole {
  name: string;
  emulator: string;
  requirements: Requirements;
}

export interface RomBrand {
  name: string;
  consoles: RomConsole[];
}

export const NO_STABLE_EMULATOR = "Sin emulador estable aún";

// Niveles de exigencia del emulador sobre el PC
const TIER: Record<"low" | "mid" | "high" | "ultra" | "none", Requirements> = {
  low: {
    os: "Windows 7 / 10 / 11, Linux o macOS",
    cpu: "Cualquier CPU de doble núcleo",
    ram: "2 GB RAM",
    gpu: "Gráficos integrados",
    storage: "Menos de 100 MB (emulador + ROM)",
  },
  mid: {
    os: "Windows 10 / 11, Linux o macOS",
    cpu: "Intel Core i3 / Ryzen 3 (2 núcleos, 2.5 GHz+)",
    ram: "4 GB RAM",
    gpu: "Gráficos integrados con OpenGL 3.3 / Vulkan",
    storage: "1 GB libre",
  },
  high: {
    os: "Windows 10 / 11 64-bit",
    cpu: "Intel Core i5 (4.ª gen) / Ryzen 3 1200 o superior",
    ram: "8 GB RAM",
    gpu: "NVIDIA GTX 750 / AMD RX 550 (Vulkan)",
    storage: "10 GB libres",
  },
  ultra: {
    os: "Windows 10 / 11 64-bit",
    cpu: "Intel Core i5-8400 / Ryzen 5 3600 (con AVX2)",
    ram: "16 GB RAM",
    gpu: "NVIDIA GTX 1060 / AMD RX 580 (Vulkan)",
    storage: "50 GB libres",
  },
  none: {
    os: "No disponible",
    cpu: "No disponible",
    ram: "No disponible",
    gpu: "No disponible",
    storage: "No disponible",
  },
};

const c = (name: string, emulator: string, tier: keyof typeof TIER): RomConsole => ({
  name,
  emulator,
  requirements: TIER[tier],
});

export const ROM_BRANDS: RomBrand[] = [
  {
    name: "Nintendo",
    consoles: [
      c("NES", "Mesen", "low"),
      c("Game Boy", "mGBA / SameBoy", "low"),
      c("Super Nintendo", "Snes9x / bsnes", "low"),
      c("Virtual Boy", "Mednafen", "low"),
      c("Nintendo 64", "simple64 / Project64", "mid"),
      c("Game Boy Color", "mGBA / SameBoy", "low"),
      c("Game Boy Advance", "mGBA", "low"),
      c("GameCube", "Dolphin", "high"),
      c("Nintendo DS", "melonDS", "mid"),
      c("Wii", "Dolphin", "high"),
      c("Nintendo 3DS", "Azahar (sucesor de Citra)", "high"),
      c("Wii U", "Cemu", "ultra"),
      c("Nintendo Switch", "Ryubing (fork de Ryujinx)", "ultra"),
      c("Nintendo Switch 2", NO_STABLE_EMULATOR, "none"),
    ],
  },
  {
    name: "Sega",
    consoles: [
      c("Master System", "Genesis Plus GX", "low"),
      c("Mega Drive / Genesis", "Genesis Plus GX / BlastEm", "low"),
      c("Game Gear", "Genesis Plus GX", "low"),
      c("Sega Saturn", "Mednafen (Beetle Saturn)", "mid"),
      c("Dreamcast", "Flycast", "mid"),
    ],
  },
  {
    name: "PlayStation",
    consoles: [
      c("PlayStation", "DuckStation", "mid"),
      c("PlayStation 2", "PCSX2", "high"),
      c("PSP", "PPSSPP", "mid"),
      c("PlayStation 3", "RPCS3", "ultra"),
      c("PS Vita", "Vita3K", "high"),
      c("PlayStation 4", "shadPS4 (experimental)", "ultra"),
      c("PlayStation 5", NO_STABLE_EMULATOR, "none"),
    ],
  },
  {
    name: "Atari",
    consoles: [
      c("Atari 7800", "A7800 / ProSystem", "low"),
      c("Atari Lynx", "Mednafen (Beetle Lynx)", "low"),
      c("Atari Jaguar", "BigPEmu", "mid"),
    ],
  },
  {
    name: "NEC",
    consoles: [c("TurboGrafx-16 / PC Engine", "Mednafen (Beetle PCE)", "low")],
  },
  {
    name: "SNK",
    consoles: [
      c("Neo Geo AES", "FinalBurn Neo", "low"),
      c("Neo Geo Pocket", "Mednafen (Beetle NeoPop)", "low"),
    ],
  },
  {
    name: "Panasonic",
    consoles: [c("3DO", "Opera (núcleo de RetroArch)", "mid")],
  },
];

export const ROM_GENRE_SUGGESTIONS = [
  "Plataformas",
  "Acción / Aventura",
  "RPG",
  "Lucha",
  "Carreras",
  "Deportes",
  "Shooter",
  "Puzzle",
  "Estrategia",
  "Terror",
];

export function findRomConsole(brand: string, consoleName: string): RomConsole | null {
  return (
    ROM_BRANDS.find((b) => b.name === brand)?.consoles.find((co) => co.name === consoleName) ??
    null
  );
}

/** Clave "Marca::Consola" para contar ROMs por consola. */
export const romCountKey = (brand: string, consoleName: string) => `${brand}::${consoleName}`;
