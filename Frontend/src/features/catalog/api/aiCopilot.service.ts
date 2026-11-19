import { requestJson } from "../../../shared/api/httpClient";
import { authService } from "../../auth/services/auth.service";
import type { CatalogSectionApi } from "./catalog.service";

export type AiProvider = "gemini" | "claude" | "nvidia";

export interface AiCopilotConfigResponse {
  hasKey: boolean;
  provider: AiProvider;
  maskedKey: string | null;
}

export interface SaveAiConfigPayload {
  provider: AiProvider;
  apiKey: string;
}

export interface SaveAiConfigResponse {
  message: string;
  provider: AiProvider;
  maskedKey: string;
}

export interface DeleteAiConfigResponse {
  message: string;
  hasKey: boolean;
}

export interface AiAutocompleteMetadata {
  genre: string;
  tag: string;
  size: string;
  version: string;
  developer: string;
  description: string;
  minCpu: string;
  minRam: string;
  minStorage: string;
  minOs: string;
  minGpu: string;
}

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Gemini",
  nvidia: "NVIDIA",
  claude: "Claude",
};

export const AI_PROVIDER_MODELS: Record<AiProvider, string> = {
  gemini: "gemini-2.5-flash",
  nvidia: "llama-3.3-70b-instruct",
  claude: "claude-3.5-haiku",
};

export const aiCopilotService = {
  async getConfig(): Promise<AiCopilotConfigResponse> {
    const data = await requestJson<AiCopilotConfigResponse>("/ai-copilot/config", {
      method: "GET",
      headers: {
        ...authService.authHeaders(),
      },
      fallbackError: "No se pudo consultar la configuración del Copiloto IA.",
    });

    return (
      data ?? {
        hasKey: false,
        provider: "gemini",
        maskedKey: null,
      }
    );
  },

  async saveConfig(payload: SaveAiConfigPayload): Promise<SaveAiConfigResponse> {
    const data = await requestJson<SaveAiConfigResponse>("/ai-copilot/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authService.authHeaders(),
      },
      body: JSON.stringify({
        provider: payload.provider,
        apiKey: payload.apiKey.trim(),
      }),
      fallbackError: "No se pudo guardar la API Key.",
    });

    if (!data) {
      throw new Error("Respuesta inválida al guardar la API Key.");
    }
    return data;
  },

  async deleteConfig(): Promise<DeleteAiConfigResponse> {
    const data = await requestJson<DeleteAiConfigResponse>("/ai-copilot/config", {
      method: "DELETE",
      headers: {
        ...authService.authHeaders(),
      },
      fallbackError: "No se pudo eliminar la API Key.",
    });

    return (
      data ?? {
        message: "API Key eliminada",
        hasKey: false,
      }
    );
  },

  async autocomplete(
    title: string,
    section?: CatalogSectionApi,
  ): Promise<AiAutocompleteMetadata> {
    const data = await requestJson<AiAutocompleteMetadata>("/ai-copilot/autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.authHeaders(),
      },
      body: JSON.stringify({
        title: title.trim(),
        ...(section ? { section } : {}),
      }),
      fallbackError: "No se pudo generar la ficha técnica con IA.",
    });

    if (!data) {
      throw new Error("Respuesta vacía del Copiloto IA.");
    }
    return data;
  },
};
