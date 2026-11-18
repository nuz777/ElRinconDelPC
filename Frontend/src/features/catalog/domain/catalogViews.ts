import { Cpu, Flame, FolderOpen, Gamepad2, Wrench } from "lucide-react";
import type { Apartado } from "./catalog.types";

export type CatalogTabId = "todos" | Apartado;

export const APARTADOS_CONFIG: Array<{
  id: "todos" | Exclude<Apartado, "roms">;
  label: string;
  icon: typeof Gamepad2;
}> = [
  { id: "todos", label: "Todo el Catálogo", icon: FolderOpen },
  { id: "juegos", label: "Juegos de PC", icon: Gamepad2 },
  { id: "mods", label: "Mods & Shaders", icon: Cpu },
  { id: "herramientas", label: "Herramientas de PC", icon: Wrench },
  { id: "adultos", label: "+18 Para Adultos", icon: Flame },
];

export const APARTADO_BADGE: Record<Apartado, string> = {
  juegos: "Juego",
  mods: "Mod",
  herramientas: "Tool",
  roms: "ROM",
  adultos: "+18",
};
