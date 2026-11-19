import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "../../../shared/config/env";
import { ApiError } from "../../../shared/api/httpClient";
import { authService } from "../../auth/services/auth.service";
import { aiCopilotService } from "./aiCopilot.service";

describe("aiCopilot.service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getConfig consulta GET /ai-copilot/config y retorna estado enmascarado", async () => {
    vi.spyOn(authService, "authHeaders").mockReturnValue({
      Authorization: "Bearer admin-jwt",
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: { hasKey: true, provider: "gemini", maskedKey: "AIzaSy••••9xQ" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await aiCopilotService.getConfig();

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/ai-copilot/config`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: { Authorization: "Bearer admin-jwt" },
      }),
    );
    expect(res).toEqual({
      hasKey: true,
      provider: "gemini",
      maskedKey: "AIzaSy••••9xQ",
    });
  });

  it("saveConfig envía PUT /ai-copilot/config con la clave recortada", async () => {
    vi.spyOn(authService, "authHeaders").mockReturnValue({
      Authorization: "Bearer admin-jwt",
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "API Key guardada",
            provider: "claude",
            maskedKey: "sk-ant••••abc",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await aiCopilotService.saveConfig({
      provider: "claude",
      apiKey: "  sk-ant-test-abc  ",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/ai-copilot/config`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ provider: "claude", apiKey: "sk-ant-test-abc" }),
      }),
    );
    expect(res.maskedKey).toBe("sk-ant••••abc");
  });

  it("autocomplete envía POST /ai-copilot/autocomplete y propaga ApiError 429 si falta cuota", async () => {
    vi.spyOn(authService, "authHeaders").mockReturnValue({
      Authorization: "Bearer admin-jwt",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 429,
          code: "AI_PROVIDER_QUOTA_ERROR",
          message: "Tu API Key falló o sin cuota, actualízala aquí.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      aiCopilotService.autocomplete("Hollow Knight", "JUEGOS"),
    ).rejects.toSatisfy(
      (err: unknown) => err instanceof ApiError && err.status === 429,
    );
  });
});
