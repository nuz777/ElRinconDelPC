import { describe, expect, it } from "vitest";
import {
  buildItemPath,
  buildRomListPath,
  buildViewPath,
  parseCatalogRoute,
  slugify,
} from "./catalogUrl";

describe("catalogUrl", () => {
  it("normaliza slugs eliminando acentos y caracteres especiales", () => {
    expect(slugify("The Legend of Zelda: Ocarina of Time!")).toBe(
      "the-legend-of-zelda-ocarina-of-time",
    );
    expect(slugify("Edición Año 2026")).toBe("edicion-ano-2026");
  });

  it("construye rutas de listado y detalle canónicas", () => {
    expect(buildViewPath({ apartado: "juegos" })).toBe("/juegos");
    expect(buildRomListPath("Nintendo", "Nintendo 64")).toBe("/rom/nintendo/nintendo-64");

    expect(
      buildItemPath({
        title: "Hollow Knight",
        publicCode: "hk2026",
        apartado: "juegos",
        brand: null,
        console: null,
      }),
    ).toBe("/juego/hollow-knight-hk2026");

    expect(
      buildItemPath({
        title: "Super Mario 64",
        publicCode: "sm6401",
        apartado: "roms",
        brand: "Nintendo",
        console: "Nintendo 64",
      }),
    ).toBe("/rom/nintendo/nintendo-64/super-mario-64-sm6401");
  });

  it("parsea listados, detalles y rutas de ROM válidas o devuelve null en rutas inválidas", () => {
    expect(parseCatalogRoute("/juegos")).toEqual({
      view: { apartado: "juegos" },
      detailCode: null,
      isDetail: false,
    });

    expect(parseCatalogRoute("/juego/hollow-knight-hk2026")).toEqual({
      view: { apartado: "juegos" },
      detailCode: "hk2026",
      isDetail: true,
    });

    expect(parseCatalogRoute("/rom/nintendo/nintendo-64/mario-sm6401")).toEqual({
      view: { apartado: "roms", brand: "Nintendo", console: "Nintendo 64" },
      detailCode: "sm6401",
      isDetail: true,
    });

    expect(parseCatalogRoute("/rom/nintendo")).toBeNull();
    expect(parseCatalogRoute("/ruta-desconocida")).toBeNull();
  });
});
