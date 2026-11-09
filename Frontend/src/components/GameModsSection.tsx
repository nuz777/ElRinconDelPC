import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Download, Loader2, Puzzle, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { modsService, type ModApiResponse } from "../services/mods.service";

interface GameModsSectionProps {
  /** UUID del juego (mismo id en catalog_items y games). */
  gameId: string;
  /** Ruta canónica del juego (/juego/{slug}-{codigo}); null si no tiene código público. */
  gamePath: string | null;
  isLight: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mods de la comunidad asociados a un juego, con descarga y botón para subir uno nuevo. */
export default function GameModsSection({ gameId, gamePath, isLight }: GameModsSectionProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  // Resultado asociado al juego que lo pidió; si no coincide con el actual, está cargando
  const [result, setResult] = useState<{ gameId: string; mods: ModApiResponse[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasValidId = UUID_REGEX.test(gameId);
  const loading = hasValidId && result?.gameId !== gameId;
  const mods = hasValidId && result?.gameId === gameId ? result.mods : [];

  useEffect(() => {
    if (!UUID_REGEX.test(gameId)) return;
    let cancelled = false;
    modsService
      .getModsByGame(gameId, { limit: 50 })
      .then((data) => {
        if (!cancelled) setResult({ gameId, mods: data.items ?? [] });
      })
      .catch(() => {
        // El juego puede no tener mods todavía; no es un error crítico
        if (!cancelled) setResult({ gameId, mods: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const goToUpload = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (gamePath) navigate(`${gamePath}/subir-mod`);
  };

  const handleDownload = async (mod: ModApiResponse) => {
    if (!isAuthenticated) {
      setError("Debes iniciar sesión para descargar mods.");
      return;
    }
    setError(null);
    try {
      const result = await modsService.downloadMod(mod.id);
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar el mod.");
    }
  };

  const uploadButton = gamePath && (
    <button
      type="button"
      onClick={goToUpload}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
        isLight
          ? "bg-zinc-900 text-white hover:bg-black"
          : "bg-white text-zinc-950 hover:bg-zinc-200"
      }`}
    >
      <Upload className="size-4" />
      <span>{isAuthenticated ? "Subir mod" : "Inicia sesión para subir mods"}</span>
    </button>
  );

  return (
    <section
      className={`p-6 sm:p-8 rounded-2xl border shadow-xl space-y-4 transition-colors ${
        isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className={`text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-2 ${
            isLight ? "text-zinc-950" : "text-white"
          }`}
        >
          <Puzzle className="size-5 text-zinc-400" />
          Mods de la Comunidad
          {!loading && (
            <span className="text-sm font-semibold text-zinc-500">({mods.length})</span>
          )}
        </h2>
        {uploadButton}
      </div>
      <div className={`w-12 h-0.5 ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`} />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-600/40 bg-red-600/10 text-red-500 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-8 animate-spin text-zinc-400" />
        </div>
      ) : mods.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-2xl ${
            isLight ? "border-zinc-300 bg-zinc-50" : "border-zinc-800 bg-zinc-900/40"
          }`}
        >
          <Puzzle className="size-10 mb-3 text-zinc-400" />
          <p className={`text-sm font-semibold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
            Sin mods aún
          </p>
          <p className="text-xs mt-1 text-zinc-500">
            No hay mods publicados para este juego. Sé el primero en subir uno.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {mods.map((mod) => (
            <div
              key={mod.id}
              className={`flex flex-col rounded-xl border overflow-hidden ${
                isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={mod.thumbnailUrl || "/img/SN-tools.jpg"}
                  alt={mod.title}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/img/SN-tools.jpg")) {
                      target.src = "/img/SN-tools.jpg";
                    }
                  }}
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-950/90 text-zinc-200 border border-zinc-700">
                    {mod.version}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white text-zinc-950">
                    {mod.downloadsCount} descargas
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex-1">
                  <span className="text-[11px] uppercase tracking-wider block mb-1 text-zinc-500">
                    {mod.authorEmail ? `por ${mod.authorEmail}` : "Autor desconocido"}
                  </span>
                  <h3
                    className={`text-sm font-bold line-clamp-1 ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}
                  >
                    {mod.title}
                  </h3>
                  <p
                    className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    {mod.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(mod)}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  <Download className="size-3.5" />
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
