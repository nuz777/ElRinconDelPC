import type { CSSProperties } from "react";
import { DEFAULT_COVER_FRAMING, type CoverFraming } from "../domain/catalog.types";

export const COVER_SCALE_MIN = 1;
export const COVER_SCALE_MAX = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/** Normaliza un encuadre (valores fuera de rango o ausentes vuelven al centro). */
export function normalizeFraming(framing?: CoverFraming | null): CoverFraming {
  if (!framing) return { ...DEFAULT_COVER_FRAMING };
  return {
    x: Math.round(clamp(framing.x, 0, 100) * 10) / 10,
    y: Math.round(clamp(framing.y, 0, 100) * 10) / 10,
    scale: Math.round(clamp(framing.scale, COVER_SCALE_MIN, COVER_SCALE_MAX) * 100) / 100,
  };
}

export function isDefaultFraming(framing?: CoverFraming | null): boolean {
  const f = normalizeFraming(framing);
  return f.x === 50 && f.y === 50 && f.scale === 1;
}

/**
 * Estilos para un <img class="object-cover"> que respetan el encuadre guardado.
 * `object-position` mueve el recorte y `scale` (con origen en el mismo punto) aplica el zoom.
 */
export function coverFramingStyle(framing?: CoverFraming | null): CSSProperties {
  if (!framing || isDefaultFraming(framing)) return {};
  const f = normalizeFraming(framing);
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transform: f.scale !== 1 ? `scale(${f.scale})` : undefined,
    transformOrigin: `${f.x}% ${f.y}%`,
  };
}
