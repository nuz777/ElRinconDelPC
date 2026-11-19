import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../auth/context/useAuth";
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDER_MODELS,
  aiCopilotService,
  type AiCopilotConfigResponse,
  type AiProvider,
} from "../api/aiCopilot.service";
import { dialog } from "../../../shared/ui/dialog";

interface AdminAiKeyBoxProps {
  isLight: boolean;
  config: AiCopilotConfigResponse | null;
  isLoadingConfig: boolean;
  isEditorOpen: boolean;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
  errorMessage: string | null;
  onClearError: () => void;
  onConfigUpdated: (next: AiCopilotConfigResponse) => void;
}

const PROVIDERS: AiProvider[] = ["gemini", "nvidia", "claude"];

const PROVIDER_PLACEHOLDERS: Record<AiProvider, string> = {
  gemini: "AIzaSy...",
  nvidia: "nvapi-...",
  claude: "sk-ant-...",
};

export function AdminAiKeyBox({
  isLight,
  config,
  isLoadingConfig,
  isEditorOpen,
  onOpenEditor,
  onCloseEditor,
  errorMessage,
  onClearError,
  onConfigUpdated,
}: AdminAiKeyBoxProps) {
  const { isAuthenticated, user } = useAuth();
  const [providerOverride, setProviderOverride] = useState<AiProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedProvider: AiProvider = providerOverride ?? config?.provider ?? "gemini";

  // Renderizado condicional estricto por rol: nunca se monta en el DOM para usuarios o invitados
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const hasKey = Boolean(config?.hasKey && config?.maskedKey);
  const showSetupCard = !hasKey || isEditorOpen;
  const activeError = errorMessage || localError;

  const handleSave = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setLocalError("Pega tu API Key antes de guardar.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    onClearError();

    try {
      const saved = await aiCopilotService.saveConfig({
        provider: selectedProvider,
        apiKey: trimmed,
      });
      setApiKeyInput("");
      setShowKey(false);
      onConfigUpdated({
        hasKey: true,
        provider: saved.provider,
        maskedKey: saved.maskedKey,
      });
      onCloseEditor();
      dialog.toast(
        "success",
        "Copiloto IA activado",
        `Clave de ${AI_PROVIDER_LABELS[saved.provider]} (${saved.maskedKey}) guardada de forma cifrada.`,
      );
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "No se pudo guardar la API Key.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setLocalError(null);
    onClearError();

    try {
      await aiCopilotService.deleteConfig();
      setApiKeyInput("");
      setShowKey(false);
      onConfigUpdated({
        hasKey: false,
        provider: selectedProvider,
        maskedKey: null,
      });
      onCloseEditor();
      dialog.toast("info", "API Key eliminada", "El Copiloto IA quedó desactivado.");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "No se pudo eliminar la API Key.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingConfig && !config) {
    return (
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 border text-xs ${
          isLight
            ? "bg-zinc-50 border-zinc-200 text-zinc-500"
            : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
        }`}
      >
        <RefreshCw className="size-3.5 animate-spin shrink-0" />
        <span>Verificando estado del Copiloto IA...</span>
      </div>
    );
  }

  // Estado B: Admin con API Key ya guardada -> insignia discreta + botón pequeño "Cambiar clave"
  if (!showSetupCard && config) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border text-xs ${
          isLight
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            : "bg-emerald-950/20 border-emerald-500/25 text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center size-5 bg-emerald-500/15 text-emerald-500 shrink-0">
            <Sparkles className="size-3.5" />
          </span>
          <span className="font-semibold tracking-wide truncate">
            Copiloto activo{" "}
            <span className="font-mono font-normal opacity-90">
              ({AI_PROVIDER_LABELS[config.provider]} {config.maskedKey})
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setLocalError(null);
            onClearError();
            setProviderOverride(null);
            setIsCollapsed(false);
            onOpenEditor();
          }}
          className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border transition-colors cursor-pointer ${
            isLight
              ? "bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              : "bg-zinc-900 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60"
          }`}
        >
          Cambiar clave
        </button>
      </div>
    );
  }

  // Estado A (o edición abierta): tarjeta colapsable/destacada para configurar la API Key
  return (
    <section
      className={`border transition-colors ${
        activeError
          ? "border-amber-500/50 bg-amber-500/5"
          : isLight
            ? "bg-zinc-50 border-zinc-300"
            : "bg-zinc-950/50 border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`p-1.5 border shrink-0 ${
              activeError
                ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                : isLight
                  ? "bg-white border-zinc-300 text-zinc-800"
                  : "bg-zinc-900 border-zinc-700 text-amber-400"
            }`}
          >
            <KeyRound className="size-4" />
          </span>
          <div className="min-w-0">
            <h3
              className={`text-xs uppercase tracking-wider font-bold truncate ${
                isLight ? "text-zinc-900" : "text-white"
              }`}
            >
              {hasKey
                ? "Actualizar API Key del Copiloto IA"
                : "Configura tu API Key para activar el Copiloto IA"}
            </h3>
            <p
              className={`text-[11px] leading-snug ${
                isLight ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              Se guarda cifrada (AES-256-GCM) asociada solo a tu cuenta de administrador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasKey && (
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                onClearError();
                setApiKeyInput("");
                onCloseEditor();
              }}
              className={`px-2 py-1 text-[11px] uppercase tracking-wider border transition-colors cursor-pointer ${
                isLight
                  ? "border-zinc-300 text-zinc-600 hover:bg-zinc-200"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expandir configuración de API Key" : "Colapsar configuración de API Key"}
            className={`p-1.5 border transition-colors cursor-pointer ${
              isLight
                ? "border-zinc-300 text-zinc-600 hover:bg-zinc-200"
                : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div
          className={`px-4 pb-4 pt-2 border-t space-y-3 ${
            isLight ? "border-zinc-200" : "border-zinc-800"
          }`}
        >
          {activeError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/35 text-amber-500 text-xs"
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <span
                className={`block text-[11px] uppercase tracking-wider mb-1.5 font-semibold ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                Proveedor IA
              </span>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setProviderOverride(e.target.value as AiProvider);
                  setLocalError(null);
                }}
                aria-label="Proveedor de IA"
                className={`w-full px-3 py-2 text-sm border outline-none transition-colors ${
                  isLight
                    ? "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500"
                }`}
              >
                {PROVIDERS.map((p) => (
                  <option
                    key={p}
                    value={p}
                    className={isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100"}
                  >
                    {AI_PROVIDER_LABELS[p]} ({AI_PROVIDER_MODELS[p]})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <span
                className={`block text-[11px] uppercase tracking-wider mb-1.5 font-semibold ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                API Key
              </span>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleSave();
                    }
                  }}
                  autoComplete="new-password"
                  placeholder={PROVIDER_PLACEHOLDERS[selectedProvider]}
                  aria-label="API Key"
                  className={`w-full pl-3 pr-9 py-2 text-sm border outline-none transition-colors font-mono ${
                    isLight
                      ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? "Ocultar clave" : "Mostrar clave"}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 cursor-pointer ${
                    isLight ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving || isDeleting}
                onClick={() => void handleSave()}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? "bg-zinc-900 text-white hover:bg-black"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Guardar clave</span>
                  </>
                )}
              </button>

              {hasKey && (
                <button
                  type="button"
                  disabled={isSaving || isDeleting}
                  onClick={() => void handleDelete()}
                  title="Borrar API Key guardada"
                  aria-label="Borrar API Key guardada"
                  className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminAiKeyBox;
