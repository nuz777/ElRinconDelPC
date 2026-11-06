import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { modsService } from "../../services/mods.service";

export default function UploadModPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setNavLocation] = useLocation();
  const [, params] = useRoute("/juegos/:id/subir-mod");
  const gameId = params?.id ?? "";

  const [form, setForm] = useState({
    title: "",
    description: "",
    version: "",
    downloadUrl: "",
    thumbnailUrl: "",
    fileSize: "",
    minimumRequirements: {
      os: "",
      storage: "",
      ram: "",
      cpu: "",
      gpu: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleChangeNested = (key: keyof typeof form.minimumRequirements) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      minimumRequirements: { ...prev.minimumRequirements, [key]: e.target.value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await modsService.createMod({
        title: form.title.trim(),
        description: form.description.trim(),
        version: form.version.trim(),
        downloadUrl: form.downloadUrl.trim(),
        gameId: gameId || "",
        thumbnailUrl: form.thumbnailUrl.trim() || undefined,
        fileSize: form.fileSize.trim() || undefined,
        minimumRequirements: {
          os: form.minimumRequirements.os.trim(),
          storage: form.minimumRequirements.storage.trim(),
          ram: form.minimumRequirements.ram.trim(),
          cpu: form.minimumRequirements.cpu.trim(),
          gpu: form.minimumRequirements.gpu.trim(),
        },
      });
      setSuccess("Mod publicado correctamente. Está pendiente de revisión por un administrador.");
      setForm({
        title: "",
        description: "",
        version: "",
        downloadUrl: "",
        thumbnailUrl: "",
        fileSize: "",
        minimumRequirements: {
          os: "",
          storage: "",
          ram: "",
          cpu: "",
          gpu: "",
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado al publicar el mod.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setNavLocation(`/juegos/${gameId}`);

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <header className="border-b">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b">
          <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-colors ${
              isLight
                ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
            }`}
          >
            <ArrowLeft size={18} /> <span>Volver al Juego</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
            Subir Nuevo Mod
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-emerald-900/20 border-emerald-900/30 text-emerald-300"
            }`}
          >
            <CheckCircle className="size-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Mod publicado</h3>
              <p className="text-xs">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"
              aria-label="Cerrar notificación"
            >
              <CheckCircle size={16} />
            </button>
          </div>
        )}

        {error && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              isLight
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-red-900/20 border-red-900/30 text-red-300"
            }`}
          >
            <AlertCircle className="size-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Error</h3>
              <p className="text-xs">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1.5 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Cerrar notificación"
            >
              <AlertCircle size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
              Título del Mod *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={handleChange("title")}
              placeholder="Ej: Sodium Optimización Gráfica"
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                isLight
                  ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                  : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
              }`}
            />
          </div>

          {/* Versión */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
              Versión *
            </label>
            <input
              type="text"
              required
              value={form.version}
              onChange={handleChange("version")}
              placeholder="Ej: v0.5.8"
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                isLight
                  ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                  : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
              }`}
            />
          </div>

          {/* Descripción / Guía de instalación */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
              Descripción y Guía de Instalación *
            </label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Explica qué hace el mod, cómo instalarlo y requisitos de compatibilidad..."
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border resize-none ${
                isLight
                  ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                  : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
              }`}
            />
          </div>

          {/* URL de descarga */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
              URL de Descarga *
            </label>
            <input
              type="url"
              required
              value={form.downloadUrl}
              onChange={handleChange("downloadUrl")}
              placeholder="https://modrinth.com/mod/sodium o https://github.com/..."
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                isLight
                  ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                  : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
              }`}
            />
          </div>

          {/* Imagen miniatura y tamaño */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                URL Imagen Miniatura
              </label>
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={handleChange("thumbnailUrl")}
                placeholder="https://ejemplo.com/thumb.png"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
              <p className="text-[11px] mt-1 text-zinc-400">
                Opcional. Imagen previa del mod.
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Tamaño del Archivo
              </label>
              <input
                type="text"
                value={form.fileSize}
                onChange={handleChange("fileSize")}
                placeholder="Ej: 150 MB"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
              <p className="text-[11px] mt-1 text-zinc-400">
                Opcional. Tamaño del archivo del mod.
              </p>
            </div>
          </div>

          {/* Requisitos Mínimos del Sistema */}
          <div className={`p-4 rounded-xl border transition-colors ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
          }`}>
            <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${
              isLight ? "text-zinc-700" : "text-zinc-200"
            }`}>
              Requisitos Mínimos del Sistema
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                  Sistema Operativo *
                </label>
                <input
                  type="text"
                  required
                  value={form.minimumRequirements.os}
                  onChange={handleChangeNested("os")}
                  placeholder="Ej: Windows 10 64-bit"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                  Almacenamiento (ROM) *
                </label>
                <input
                  type="text"
                  required
                  value={form.minimumRequirements.storage}
                  onChange={handleChangeNested("storage")}
                  placeholder="Ej: 50 GB"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                  Memoria RAM *
                </label>
                <input
                  type="text"
                  required
                  value={form.minimumRequirements.ram}
                  onChange={handleChangeNested("ram")}
                  placeholder="Ej: 8 GB"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                  Procesador *
                </label>
                <input
                  type="text"
                  required
                  value={form.minimumRequirements.cpu}
                  onChange={handleChangeNested("cpu")}
                  placeholder="Ej: Intel Core i5"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                  Tarjeta Gráfica *
                </label>
                <input
                  type="text"
                  required
                  value={form.minimumRequirements.gpu}
                  onChange={handleChangeNested("gpu")}
                  placeholder="Ej: NVIDIA GTX 1060"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Aviso de revisión */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              isLight
                ? "bg-zinc-50 border-zinc-200"
                : "bg-zinc-900/40 border-zinc-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="size-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.572 2.98H4.72c-1.356 0-2.324-1.646-1.573-2.98l5.58-9.92zM9 11a1 1 0 100-2 1 1 0 000 2zm0-1a1 1 0 100-2 1 1 0 000 2zm0-7a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 100-2 1 1 0 000 2zM9.5 7a1 1 0 100-2 1 1 0 000 2zm0-1a1 1 0 100-2 1 1 0 000 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  El mod quedará pendiente de revisión
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Un administrador deberá aprobar tu mod antes de que sea visible públicamente en el catálogo.
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 disabled:opacity-50"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 disabled:opacity-50"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                isLight
                  ? "bg-zinc-900 text-white hover:bg-black disabled:bg-zinc-400"
                  : "bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-700"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin size-4 border-2 border-current rounded-full" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Publicar Mod</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
