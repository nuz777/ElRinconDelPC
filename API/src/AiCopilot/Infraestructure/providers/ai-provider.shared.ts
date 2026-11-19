import {
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { AiAutocompleteResult } from '../../Domain/ai-provider-strategy.interface.js';

export const AI_PROVIDER_TIMEOUT_MS = 25_000;

export const METADATA_FIELD_SPECS: Record<
  keyof AiAutocompleteResult,
  string
> = {
  genre:
    'Género principal en español (ej. "Acción / Shooter", "Aventura / RPG", "Terror / Supervivencia", "Estrategia", "Carreras / Simulación", "Optimización del Sistema", "Gráficos & Shaders")',
  tag: 'Etiqueta corta destacada de 1 o 2 palabras en español (ej. "Clásico", "Popular", "Nuevo", "Recomendado")',
  size: 'Peso aproximado en disco/descarga (ej. "14.5 GB", "850 MB")',
  version: 'Versión estable conocida o sugerida (ej. "v1.0", "v1.12", "Remastered")',
  developer: 'Estudio desarrollador o creador principal (ej. "FromSoftware")',
  description:
    'Descripción atractiva y concisa en español (2 a 4 oraciones, máx. 600 caracteres, sin markdown ni URLs)',
  minCpu: 'Procesador mínimo recomendado para PC (ej. "Intel Core i5-8400 / Ryzen 5 2600")',
  minRam: 'Memoria RAM mínima (ej. "8 GB RAM")',
  minStorage: 'Espacio mínimo libre en disco (ej. "50 GB libres")',
  minOs: 'Sistema operativo mínimo compatible (ej. "Windows 10 / 11 64-bit")',
  minGpu: 'Tarjeta gráfica mínima compatible (ej. "NVIDIA GTX 1060 6GB / AMD RX 580")',
};

export const METADATA_REQUIRED_KEYS = Object.keys(
  METADATA_FIELD_SPECS,
) as (keyof AiAutocompleteResult)[];

const SECTION_CONTEXT_MAP: Record<string, string> = {
  JUEGOS: 'un videojuego para PC',
  MODS: 'un mod o paquete de shaders para PC',
  HERRAMIENTAS: 'una herramienta o software de utilidad para PC',
  ROMS: 'una ROM de consola clásica/moderna para emulación en PC',
  ADULTOS: 'un juego o novela visual (+18)',
};

/**
 * Construye el prompt del sistema/usuario para generar fichas técnicas estructuradas.
 */
export function buildAutocompletePrompt(
  title: string,
  section = 'JUEGOS',
): string {
  const normalizedSection = section.trim().toUpperCase();
  const contextLabel =
    SECTION_CONTEXT_MAP[normalizedSection] ?? 'un título del catálogo de PC';

  return [
    `Genera la ficha técnica completa para ${contextLabel} llamado "${title.trim()}".`,
    'Responde exclusivamente con un objeto JSON válido en español con exactamente estas propiedades string:',
    ...METADATA_REQUIRED_KEYS.map(
      (key) => `- "${key}": ${METADATA_FIELD_SPECS[key]}`,
    ),
    'Reglas estrictas:',
    '- Usa información técnica precisa y realista.',
    '- No incluyas enlaces, HTML, markdown ni texto fuera del JSON.',
    '- Todos los campos deben ser cadenas de texto no vacías.',
  ].join('\n');
}

function stripMarkdownFences(rawText: string): string {
  return rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function asCleanString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Parsea y normaliza la respuesta JSON de cualquier proveedor al contrato exacto esperado por el frontend.
 */
export function parseAndNormalizeMetadata(raw: unknown): AiAutocompleteResult {
  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    const cleaned = stripMarkdownFences(raw);
    try {
      parsed = JSON.parse(cleaned) as unknown;
    } catch {
      throw new BadGatewayException(
        'El proveedor de IA devolvió un JSON inválido.',
      );
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new BadGatewayException(
      'El proveedor de IA no devolvió un objeto estructurado válido.',
    );
  }

  const record = parsed as Record<string, unknown>;

  return {
    genre: asCleanString(record.genre, 'Acción / Aventura'),
    tag: asCleanString(record.tag, 'Nuevo'),
    size: asCleanString(record.size, '2.0 GB'),
    version: asCleanString(record.version, 'v1.0'),
    developer: asCleanString(record.developer, 'Comunidad El Sótano'),
    description: asCleanString(
      record.description,
      'Título disponible para PC en El Sótano.',
    ),
    minCpu: asCleanString(record.minCpu, 'Intel Core i5 / AMD Ryzen 5'),
    minRam: asCleanString(record.minRam, '8 GB RAM'),
    minStorage: asCleanString(record.minStorage, '10 GB libres'),
    minOs: asCleanString(record.minOs, 'Windows 10 / 11 64-bit'),
    minGpu: asCleanString(
      record.minGpu,
      'NVIDIA GTX 1050 Ti / AMD RX 570',
    ),
  };
}

function extractNumericStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const rec = err as Record<string, unknown>;
  if (typeof rec.status === 'number') return rec.status;
  if (typeof rec.statusCode === 'number') return rec.statusCode;
  if (rec.response && typeof rec.response === 'object') {
    const resp = rec.response as Record<string, unknown>;
    if (typeof resp.status === 'number') return resp.status;
  }
  return undefined;
}

function extractErrorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown provider error';
    }
  }
  return 'Unknown provider error';
}

/**
 * Traduce errores de SDKs upstream (Gemini, OpenAI/NVIDIA, Anthropic) a HttpExceptions NestJS
 * sin exponer nunca la API Key del administrador.
 */
export function mapProviderError(providerLabel: string, err: unknown): never {
  if (err instanceof HttpException) {
    throw err;
  }

  const status = extractNumericStatus(err);
  const text = extractErrorText(err).toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    /api[_ -]?key|invalid x-api-key|unauthorized|authentication|permission_denied|\b401\b|\b403\b/.test(
      text,
    )
  ) {
    throw new HttpException(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'AI_PROVIDER_AUTH_ERROR',
        message: 'Tu API Key falló o sin cuota, actualízala aquí.',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (
    status === 429 ||
    /rate[_ -]?limit|quota|resource_exhausted|too many requests|credit balance|\b429\b/.test(
      text,
    )
  ) {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'AI_PROVIDER_QUOTA_ERROR',
        message: 'Tu API Key falló o sin cuota, actualízala aquí.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  throw new BadGatewayException(
    `No se pudo completar la ficha técnica con ${providerLabel}. Intenta de nuevo en unos momentos.`,
  );
}
