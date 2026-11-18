import { describe, expect, it } from "vitest";
import { parseCatalogJson, parseSingleCatalogJson } from "./catalogJsonParser";

describe("catalogJsonParser", () => {
  it("normaliza un objeto de juego y fuerza portada y enlace por defecto", () => {
    const result = parseSingleCatalogJson({
      titulo: "Celeste",
      apartado: "juegos",
      genero: "Plataformas / Indie",
      peso: "1.2 GB",
      etiqueta: "Popular",
      descripcion: "Plataformas exigente en la montaña Celeste.",
      coverUrl: "https://debe-ignorarse.com/cover.png",
      downloadUrl: "https://debe-ignorarse.com/file.zip",
      especificaciones: {
        so: "Windows 10",
        cpu: "Dual Core 2.4 GHz",
        ram: "2 GB RAM",
        almacenamiento: "2 GB",
        gpu: "OpenGL 3.0+",
      },
    });

    expect(result.isValid).toBe(true);
    expect(result.item.title).toBe("Celeste");
    expect(result.item.apartado).toBe("juegos");
    expect(result.item.img).toBe("/img/indicado.webp");
    expect(result.item.downloadLinks[0].url).toBe("#");
    expect(result.payload.section).toBe("JUEGOS");
    expect(result.payload.minimumRequirements?.ram).toBe("2 GB RAM");
  });

  it("parsea listas JSON o contenedores con propiedad items", () => {
    const json = JSON.stringify({
      items: [
        {
          title: "Reshade Pro",
          section: "mods",
          description: "Preset de iluminación HDR para PC.",
        },
        {
          title: "",
          section: "juegos",
          description: "Sin título debe marcar error.",
        },
      ],
    });

    const parsed = parseCatalogJson(json);
    expect(parsed.total).toBe(2);
    expect(parsed.validCount).toBe(1);
    expect(parsed.invalidCount).toBe(1);
    expect(parsed.items[0].payload.section).toBe("MODS");
  });

  it("reporta error global en JSON inválido o vacío", () => {
    expect(parseCatalogJson("   ").errors.length).toBeGreaterThan(0);
    expect(parseCatalogJson("{json roto").errors[0]).toContain("Error de sintaxis JSON");
  });
});
