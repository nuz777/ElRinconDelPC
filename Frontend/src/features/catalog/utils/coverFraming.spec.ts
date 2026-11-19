import { describe, expect, it } from "vitest";
import { coverFramingStyle, isDefaultFraming, normalizeFraming } from "./coverFraming";

describe("coverFraming", () => {
  it("normaliza valores fuera de rango y ausentes", () => {
    expect(normalizeFraming(null)).toEqual({ x: 50, y: 50, scale: 1 });
    expect(normalizeFraming({ x: -20, y: 140, scale: 9 })).toEqual({ x: 0, y: 100, scale: 3 });
    expect(normalizeFraming({ x: Number.NaN, y: 33.333, scale: 0.2 })).toEqual({ x: 0, y: 33.3, scale: 1 });
  });

  it("detecta el encuadre por defecto", () => {
    expect(isDefaultFraming(undefined)).toBe(true);
    expect(isDefaultFraming({ x: 50, y: 50, scale: 1 })).toBe(true);
    expect(isDefaultFraming({ x: 50, y: 40, scale: 1 })).toBe(false);
  });

  it("genera estilos solo cuando hay encuadre", () => {
    expect(coverFramingStyle(null)).toEqual({});
    expect(coverFramingStyle({ x: 20, y: 70, scale: 1.5 })).toEqual({
      objectPosition: "20% 70%",
      transform: "scale(1.5)",
      transformOrigin: "20% 70%",
    });
    expect(coverFramingStyle({ x: 10, y: 50, scale: 1 }).transform).toBeUndefined();
  });
});
