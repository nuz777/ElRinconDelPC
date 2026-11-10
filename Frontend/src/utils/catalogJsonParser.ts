import type { Apartado, CatalogItem } from "../data/catalog";
import type { CreateCatalogItemPayload, CatalogSectionApi } from "../services/catalog.service";
import { ROM_BRANDS } from "../data/romPlatforms";

export interface ParsedItemResult {
  isValid: boolean;
  item: CatalogItem;
  payload: CreateCatalogItemPayload;
  errors: string[];
}

export interface ParseCatalogJsonResult {
  total: number;
  validCount: number;
  invalidCount: number;
  items: ParsedItemResult[];
  errors: string[];
}

/** Mapea variantes de texto de apartado a la sección válida de la API */
export function normalizeApartado(raw: unknown): { apartado: Apartado; section: CatalogSectionApi } {
  if (typeof raw !== "string") {
    return { apartado: "juegos", section: "JUEGOS" };
  }
  const clean = raw.trim().toLowerCase();
  if (clean.startsWith("mod")) {
    return { apartado: "mods", section: "MODS" };
  }
  if (clean.startsWith("herramienta") || clean.startsWith("tool") || clean.startsWith("util")) {
    return { apartado: "herramientas", section: "HERRAMIENTAS" };
  }
  if (clean.startsWith("rom") || clean.startsWith("emula")) {
    return { apartado: "roms", section: "ROMS" };
  }
  return { apartado: "juegos", section: "JUEGOS" };
}

/** Extrae un string seguro de múltiples claves posibles */
function getFirstString(obj: Record<string, any>, keys: string[], defaultValue = ""): string {
  for (const k of keys) {
    const val = obj[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      return String(val).trim();
    }
  }
  return defaultValue;
}

/**
 * Normaliza un objeto JSON arbitrario de un juego/elemento a una estructura
 * válida para el formulario y la API de El Sótano.
 *
 * Regla del usuario:
 * - NO lee portadas (se asigna el placeholder por defecto para que el usuario las edite).
 * - NO lee links (se asigna el link por defecto "#").
 */
export function parseSingleCatalogJson(raw: any, index = 0): ParsedItemResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return {
      isValid: false,
      item: {} as CatalogItem,
      payload: {} as CreateCatalogItemPayload,
      errors: [`Elemento #${index + 1}: El elemento no es un objeto JSON válido.`],
    };
  }

  // 1. Título
  const title = getFirstString(raw, ["titulo", "title", "nombre", "name"]);
  if (!title) {
    errors.push(`Elemento #${index + 1}: El campo "titulo" (o "title") es obligatorio.`);
  }

  // 2. Apartado / Sección
  const rawApartado = getFirstString(raw, [
    "apartado",
    "seccion",
    "sección",
    "section",
    "categoria_principal",
    "tipo",
  ], "juegos");
  const { apartado, section } = normalizeApartado(rawApartado);

  // 3. Género / Categoría
  const defaultGenreBySection: Record<Apartado, string> = {
    juegos: "Acción / Shooter",
    mods: "Gráficos & Shaders",
    herramientas: "Optimización del Sistema",
    roms: "Acción",
  };
  const genre = getFirstString(
    raw,
    ["genero", "género", "genre", "categoria", "categoría", "category"],
    defaultGenreBySection[apartado]
  );

  // 4. Peso / Tamaño
  const size = getFirstString(raw, [
    "peso",
    "tamano",
    "tamaño",
    "size",
    "tamano_descarga",
    "file_size",
    "fileSize",
  ], "1.0 GB");

  // 5. Versión
  const version = getFirstString(raw, ["version", "versión", "ver"], "v1.0");

  // 6. Desarrollador / Estudio
  const developer = getFirstString(
    raw,
    ["desarrollador", "developer", "dev", "estudio", "autor", "author"],
    "Comunidad El Sótano"
  );

  // 7. Etiqueta / Badge
  const tag = getFirstString(raw, ["etiqueta", "tag", "badge"], "Nuevo");

  // 8. Descripción general
  const shortDesc = getFirstString(
    raw,
    [
      "descripcion",
      "descripción",
      "descripcion_general",
      "descripción_general",
      "shortDesc",
      "shortDescription",
      "description",
      "resumen",
      "detalles",
    ],
    title ? `${title} en El Sótano.` : ""
  );
  if (!shortDesc) {
    errors.push(`Elemento #${index + 1}: Debe tener una "descripcion" (o "shortDescription").`);
  }

  // 9. Especificaciones de PC (Requisitos mínimos para que lo pueda correr)
  const specsRaw =
    (raw.especificaciones && typeof raw.especificaciones === "object" ? raw.especificaciones : null) ||
    (raw.especificaciones_pc && typeof raw.especificaciones_pc === "object" ? raw.especificaciones_pc : null) ||
    (raw.requisitos && typeof raw.requisitos === "object" ? raw.requisitos : null) ||
    (raw.requirements && typeof raw.requirements === "object" ? raw.requirements : null) ||
    (raw.minimumRequirements && typeof raw.minimumRequirements === "object" ? raw.minimumRequirements : null) ||
    (raw.specs && typeof raw.specs === "object" ? raw.specs : null) ||
    raw; // Soporta también si los campos vienen directamente en la raíz

  const minOs = getFirstString(
    specsRaw,
    ["so", "os", "sistema_operativo", "sistema", "operative_system"],
    "Windows 10 / 11 64-bit"
  );
  const minCpu = getFirstString(
    specsRaw,
    ["cpu", "procesador", "processor", "proc"],
    "Intel Core i5 / AMD Ryzen 5"
  );
  const minRam = getFirstString(
    specsRaw,
    ["ram", "memoria_ram", "memoria", "memory"],
    "8 GB RAM"
  );
  const minStorage = getFirstString(
    specsRaw,
    ["almacenamiento", "storage", "disco", "rom_storage", "espacio_disco", "espacio"],
    size ? `${size} libres` : "50 GB libres"
  );
  const minGpu = getFirstString(
    specsRaw,
    ["gpu", "tarjeta_grafica", "tarjeta_gráfica", "grafica", "gráfica", "video", "graphics"],
    "NVIDIA GTX 1060 / AMD RX 580"
  );

  // 10. Datos opcionales para ROMs
  const brand = apartado === "roms" ? getFirstString(raw, ["marca", "brand"], ROM_BRANDS[0].name) : undefined;
  const consoleName =
    apartado === "roms"
      ? getFirstString(raw, ["consola", "console"], ROM_BRANDS[0].consoles[0].name)
      : undefined;
  const emulator =
    apartado === "roms"
      ? getFirstString(raw, ["emulador", "emulator", "emulador_recomendado"], "")
      : undefined;

  // 11. Portadas y links (Regla del usuario: NO se leen del JSON, el usuario los edita manualmente)
  const coverUrl = "/img/indicado.webp";
  const bannerUrl = undefined;
  const downloadUrl = undefined;

  const minimumRequirements = {
    os: minOs,
    cpu: minCpu,
    ram: minRam,
    storage: minStorage,
    gpu: minGpu,
  };

  const payload: CreateCatalogItemPayload = {
    section,
    title,
    genre,
    size,
    version,
    badge: tag,
    coverUrl,
    bannerUrl,
    downloadUrl,
    developer,
    shortDescription: shortDesc,
    minimumRequirements,
    ...(apartado === "roms"
      ? {
          brand,
          console: consoleName,
          emulator: emulator || undefined,
        }
      : {}),
  };

  const tempId = `temp-${Date.now()}-${index}`;
  const item: CatalogItem = {
    id: tempId,
    title,
    apartado,
    genre,
    tag,
    version,
    size,
    releaseDate: new Date().getFullYear().toString(),
    developer,
    img: coverUrl,
    bannerImg: bannerUrl,
    shortDesc,
    fullDesc: `${shortDesc} Publicado oficialmente en la biblioteca de El Sótano del PC.`,
    features:
      apartado === "roms"
        ? [
            `ROM de ${consoleName ?? "consola"} (${brand ?? "—"})`,
            emulator ? `Probada con ${emulator}` : "Compatible con los emuladores más usados",
            "Descarga directa de alta velocidad",
          ]
        : [
            "Verificado y probado en Windows 10 y 11",
            "Descarga directa de alta velocidad",
            "Sin software malicioso ni añadidos innecesarios",
          ],
    requirements: minimumRequirements,
    downloadLinks: [
      {
        name: "Descarga Directa",
        type: "direct",
        url: "#",
        server: "Servidor Principal",
      },
    ],
    installationSteps: [
      "Descargar el archivo desde el enlace provisto.",
      "Descomprimir con WinRAR o 7-Zip si está empaquetado.",
      "Ejecutar el instalador o lanzador principal.",
    ],
    ...(apartado === "roms"
      ? {
          brand: brand ?? null,
          console: consoleName ?? null,
          emulator: emulator ?? null,
        }
      : {}),
  };

  return {
    isValid: errors.length === 0,
    item,
    payload,
    errors,
  };
}

/**
 * Procesa un archivo o texto JSON completo (puede ser un array `[...]`
 * o un único objeto `{...}`) y extrae todos los elementos normalizados.
 */
export function parseCatalogJson(jsonInput: string | unknown): ParseCatalogJsonResult {
  const globalErrors: string[] = [];
  let parsedRaw: any;

  if (typeof jsonInput === "string") {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      return {
        total: 0,
        validCount: 0,
        invalidCount: 0,
        items: [],
        errors: ["El contenido JSON está vacío."],
      };
    }
    try {
      parsedRaw = JSON.parse(trimmed);
    } catch (err) {
      return {
        total: 0,
        validCount: 0,
        invalidCount: 0,
        items: [],
        errors: [
          `Error de sintaxis JSON: ${err instanceof Error ? err.message : "El texto no es un JSON válido."}`,
        ],
      };
    }
  } else {
    parsedRaw = jsonInput;
  }

  // Detecta si es un objeto contenedor como { items: [...] } o { juegos: [...] }
  let rawList: any[] = [];
  if (Array.isArray(parsedRaw)) {
    rawList = parsedRaw;
  } else if (parsedRaw && typeof parsedRaw === "object") {
    if (Array.isArray(parsedRaw.items)) {
      rawList = parsedRaw.items;
    } else if (Array.isArray(parsedRaw.juegos)) {
      rawList = parsedRaw.juegos;
    } else if (Array.isArray(parsedRaw.games)) {
      rawList = parsedRaw.games;
    } else if (Array.isArray(parsedRaw.catalog)) {
      rawList = parsedRaw.catalog;
    } else {
      // Es un único elemento
      rawList = [parsedRaw];
    }
  } else {
    return {
      total: 0,
      validCount: 0,
      invalidCount: 0,
      items: [],
      errors: ["El JSON debe ser un objeto o una lista de objetos."],
    };
  }

  const items = rawList.map((entry, idx) => parseSingleCatalogJson(entry, idx));
  const validCount = items.filter((it) => it.isValid).length;
  const invalidCount = items.length - validCount;

  return {
    total: items.length,
    validCount,
    invalidCount,
    items,
    errors: globalErrors,
  };
}
