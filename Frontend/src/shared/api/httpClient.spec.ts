import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  extractErrorMessage,
  requestJson,
  resolveApiMediaUrl,
  UNAUTHORIZED_EVENT,
  unwrapApiData,
} from "./httpClient";
import { API_BASE_URL } from "../config/env";

describe("httpClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("desenvuelve data cuando la API usa el sobre estándar", () => {
    expect(unwrapApiData<{ id: string }>({ success: true, data: { id: "1" } })).toEqual({
      id: "1",
    });
    expect(unwrapApiData<{ id: string }>({ id: "2" })).toEqual({ id: "2" });
    expect(unwrapApiData(null)).toBeNull();
  });

  it("extrae mensajes de error tipo string o array y usa fallback cuando falta", () => {
    expect(extractErrorMessage({ message: "No autorizado" }, "Fallback")).toBe("No autorizado");
    expect(extractErrorMessage({ message: ["Campo 1 inválido", "Campo 2 inválido"] }, "Fallback")).toBe(
      "Campo 1 inválido, Campo 2 inválido",
    );
    expect(extractErrorMessage({ message: "   " }, "Fallback")).toBe("Fallback");
    expect(extractErrorMessage(null, "Fallback")).toBe("Fallback");
  });

  it("resuelve URLs relativas de media de catálogo hacia API_BASE_URL", () => {
    expect(resolveApiMediaUrl("/catalog/abc/media/cover?v=123")).toBe(
      `${API_BASE_URL}/catalog/abc/media/cover?v=123`,
    );
    expect(resolveApiMediaUrl("https://cdn.example.com/cover.webp")).toBe(
      "https://cdn.example.com/cover.webp",
    );
    expect(resolveApiMediaUrl(null, "/img/indicado.webp")).toBe("/img/indicado.webp");
  });

  it("requestJson envía credentials include y lanza ApiError en respuestas no exitosas", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Acceso denegado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      requestJson("/catalog", { fallbackError: "Error de prueba" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Acceso denegado",
    } satisfies Partial<ApiError>);

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/catalog`,
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("no dispara UNAUTHORIZED_EVENT ante 401 de proveedor IA (AI_PROVIDER_AUTH_ERROR)", async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 401,
            code: "AI_PROVIDER_AUTH_ERROR",
            message: "Tu API Key falló o sin cuota, actualízala aquí.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await expect(
      requestJson("/ai-copilot/autocomplete", {
        method: "POST",
        headers: { Authorization: "Bearer jwt-admin" },
      }),
    ).rejects.toMatchObject({
      status: 401,
      code: "AI_PROVIDER_AUTH_ERROR",
    } satisfies Partial<ApiError>);

    expect(dispatchEvent).not.toHaveBeenCalled();

    await expect(
      requestJson("/ai-copilot/config", {
        method: "GET",
        headers: { Authorization: "Bearer jwt-expired" },
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect((dispatchEvent.mock.calls[0][0] as Event).type).toBe(UNAUTHORIZED_EVENT);
    vi.unstubAllGlobals();
  });
});
