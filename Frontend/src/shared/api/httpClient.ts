import { API_BASE_URL } from "../config/env";

/** Se emite cuando una petición autenticada recibe 401: la sesión ya no es válida. */
export const UNAUTHORIZED_EVENT = "sotano-unauthorized";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data !== undefined && record.data !== null) {
    return record.data as T;
  }
  return payload as T;
}

export function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  const message = record.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
}

export function extractErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const code = (payload as Record<string, unknown>).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : undefined;
}

/** Resuelve rutas relativas servidas por la API (ej. `/catalog/:id/media/cover`). */
export function resolveApiMediaUrl(
  url: string | null | undefined,
  fallback?: string,
): string | undefined {
  if (!url) return fallback;
  if (url.startsWith("/catalog/")) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

export interface RequestJsonOptions extends RequestInit {
  fallbackError?: string;
  /** Evita disparar UNAUTHORIZED_EVENT ante respuestas 401 (ej. errores de API Keys externas). */
  skipUnauthorizedEvent?: boolean;
}

export async function requestJson<T>(
  pathOrUrl: string,
  options: RequestJsonOptions = {},
): Promise<T | null> {
  const {
    fallbackError = "Error al comunicarse con el servidor.",
    skipUnauthorizedEvent = false,
    headers,
    ...init
  } = options;
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`;

  const res = await fetch(url, {
    credentials: "include",
    headers,
    ...init,
  });

  const rawJson: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const errorCode = extractErrorCode(rawJson);
    const sentAuth =
      headers && typeof headers === "object" && !Array.isArray(headers) && !(headers instanceof Headers)
        ? "Authorization" in headers
        : false;
    if (
      res.status === 401 &&
      sentAuth &&
      !skipUnauthorizedEvent &&
      errorCode !== "AI_PROVIDER_AUTH_ERROR" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    if (res.status >= 500 || res.status === 0) {
      throw new ApiError(
        res.status === 502 || res.status === 503
          ? "El servidor está despertando. Espera unos segundos y vuelve a intentarlo."
          : extractErrorMessage(rawJson, fallbackError),
        res.status,
        errorCode,
      );
    }
    throw new ApiError(extractErrorMessage(rawJson, fallbackError), res.status, errorCode);
  }

  return unwrapApiData<T>(rawJson);
}
