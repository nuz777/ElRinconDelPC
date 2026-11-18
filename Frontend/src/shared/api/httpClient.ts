import { API_BASE_URL } from "../config/env";

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
}

export async function requestJson<T>(
  pathOrUrl: string,
  options: RequestJsonOptions = {},
): Promise<T | null> {
  const { fallbackError = "Error al comunicarse con el servidor.", headers, ...init } = options;
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`;

  const res = await fetch(url, {
    credentials: "include",
    headers,
    ...init,
  });

  const rawJson: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(extractErrorMessage(rawJson, fallbackError), res.status);
  }

  return unwrapApiData<T>(rawJson);
}
