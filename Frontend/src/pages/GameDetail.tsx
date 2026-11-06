import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Download, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../context/AuthContext";
import { gamesService } from "../services/games.service";
import { modsService } from "../services/mods.service";
import { NativeBannerAd } from "../components/ads/NativeBannerAd";

export interface ModCardData {
  id: string;
  title: string;
  slug: string;
  description: string;
  version: string;
  downloadUrl: string;
  thumbnailUrl: string | null;
  authorEmail?: string;
  downloadsCount: number;
  createdAt: string;
}

export default function GameDetail() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setNavLocation] = useLocation();
  const [, params] = useRoute("/juegos/:id");
  const gameId = params?.id ?? "";
  const [tab, setTab] = useState<"detalle" | "mods">("detalle");

  const [game, setGame] = useState<any>(null);
  const [mods, setMods] = useState<ModCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    gamesService
      .getGameById(gameId)
      .then((g) => setGame(g))
      .catch(() => setError("No se pudo cargar el juego."))
      .finally(() => setLoading(false));

    modsService
      .getModsByGame(gameId, { limit: 50 })
      .then((data) => setMods(data.items))
      .catch(() => {
        // Los mods pueden no existir aún; no es un error crítico
        setMods([]);
      });
  }, [gameId]);

  const handleDownload = async (mod: ModCardData) => {
    if (!isAuthenticated) {
      setError("Debes iniciar sesión para descargar mods.");
      return;
    }
    try {
      const result = await modsService.downloadMod(mod.id);
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar el mod.");
    }
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100">
        <Loader2 className="size-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-100 p-6">
        <div className="max-w-md text-center border rounded-xl p-6 bg-zinc-950 border-zinc-800">
          <AlertCircle className="size-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-lg font-bold uppercase tracking-wider mb-2">Error</h2>
          <p className="text-xs text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => setNavLocation("/catalogo")}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <header className="border-b">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b">
          <button
            onClick={() => setNavLocation("/catalogo")}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-colors ${
              isLight
                ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
            }`}
          >
            <ArrowLeft size={18} /> <span>Volver al Catálogo</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
            {game.title}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Header */}
        <section className="mb-10">
          <div
            className={`rounded-3xl p-6 sm:p-10 border shadow-xl overflow-hidden transition-colors ${
              isLight
                ? "bg-white border-zinc-200 shadow-zinc-200/50"
                : "bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide drop-shadow-sm">
                  {game.title}
                </h2>
                <p className="text-sm sm:text-base mt-2 max-w-2xl leading-relaxed text-zinc-400">
                  {game.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                      : "bg-zinc-900 border-zinc-800 text-zinc-200 border-zinc-700"
                  }`}>
                    {game.version}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                      : "bg-zinc-900 border-zinc-800 text-zinc-200 border-zinc-700"
                  }`}>
                    Desarrollador: {game.developer}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                      : "bg-zinc-900 border-zinc-800 text-zinc-200 border-zinc-700"
                  }`}>
                    Editor: {game.publisher}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                      : "bg-zinc-900 border-zinc-800 text-zinc-200 border-zinc-700"
                  }`}>
                    {typeof game.price === "number" ? `$${game.price.toFixed(2)}` : `Stock: ${game.stock ?? 0}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <img
                  src={game.coverImage || "/img/SN-tools.jpg"}
                  alt={game.title}
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover border shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/img/SN-tools.jpg";
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-8">
          <div className="flex gap-1 border-b pb-2">
            <button
              onClick={() => setTab("detalle")}
              className={`px-6 py-2 text-xs sm:text-sm uppercase tracking-wider font-bold transition-colors border-b-2 ${
                tab === "detalle"
                  ? isLight
                    ? "bg-zinc-900 text-white shadow-md"
                    : "bg-white text-zinc-950 shadow-md font-bold"
                  : isLight
                  ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              Detalle del Juego
            </button>
            <button
              onClick={() => setTab("mods")}
              className={`px-6 py-2 text-xs sm:text-sm uppercase tracking-wider font-bold transition-colors border-b-2 ${
                tab === "mods"
                  ? isLight
                    ? "bg-zinc-900 text-white shadow-md"
                    : "bg-white text-zinc-950 shadow-md font-bold"
                  : isLight
                  ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
              }`}
            >
              Mods ({mods.length})
            </button>
          </div>
        </section>

        {/* Tab: Detalle del Juego */}
        {tab === "detalle" && (
          <section className="space-y-6">
            <div
              className={`p-6 sm:p-8 rounded-2xl border shadow-xl transition-colors ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"
              }`}
            >
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider mb-4">
                Requisitos Mínimos del Sistema
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-zinc-500 uppercase tracking-wider block text-[11px] mb-1">
                    Procesador (CPU)
                  </span>
                  <span className="font-semibold">
                    {game.minimumRequirements?.cpu || "No especificado"}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-zinc-500 uppercase tracking-wider block text-[11px] mb-1">
                    Memoria RAM
                  </span>
                  <span className="font-semibold">
                    {game.minimumRequirements?.ram || "No especificado"}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-zinc-500 uppercase tracking-wider block text-[11px] mb-1">
                    Memoria ROM (Almacenamiento)
                  </span>
                  <span className="font-semibold">
                    {game.minimumRequirements?.storage || "No especificado"}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-zinc-500 uppercase tracking-wider block text-[11px] mb-1">
                    Sistema Operativo (OS)
                  </span>
                  <span className="font-semibold">
                    {game.minimumRequirements?.os || "No especificado"}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border sm:col-span-2 lg:col-span-2 ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-zinc-500 uppercase tracking-wider block text-[11px] mb-1">
                    Tarjeta Gráfica (GPU)
                  </span>
                  <span className="font-semibold">
                    {game.minimumRequirements?.gpu || "No especificado"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab: Mods */}
        {tab === "mods" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">
                Mods Disponibles
              </h3>
              {isAuthenticated && (
                <button
                  onClick={() => setNavLocation(`/juegos/${game.id}/subir-mod`)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  <Download className="size-4" /> <span>Subir Mod</span>
                </button>
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => setNavLocation("/login")}
                  className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                >
                  Inicia sesión para subir mods
                </button>
              )}
            </div>

            {mods.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-3xl p-8 ${
                  isLight
                    ? "border-zinc-300 bg-white shadow-sm"
                    : "border-zinc-800 bg-zinc-950/50"
                }`}
              >
                <Download className="size-12 mb-4 text-zinc-400" />
                <h4 className="text-xl font-bold uppercase tracking-wider mb-2">
                  Sin mods aún
                </h4>
                <p className="text-sm max-w-md mb-6 text-zinc-400">
                  No hay mods publicados para este juego. Sé el primero en subir uno.
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => setNavLocation(`/juegos/${game.id}/subir-mod`)}
                    className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer bg-zinc-900 hover:bg-black text-white"
                  >
                    Subir Primer Mod
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mods.map((mod) => (
                  <div
                    key={mod.id}
                    className={`group flex flex-col rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1.5 cursor-pointer will-change-transform transform-gpu ${
                      isLight
                        ? "bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900"
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-500 text-zinc-100"
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                      <img
                        src={mod.thumbnailUrl || "/img/SN-tools.jpg"}
                        alt={mod.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/img/SN-tools.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t opacity-70 pointer-events-none from-zinc-950 via-transparent to-transparent" />
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 pointer-events-none">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-950/90 text-zinc-200 border border-zinc-700 shadow-sm">
                            {mod.version}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white text-zinc-950 shadow-sm">
                            {mod.downloadsCount} descargas
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(mod);
                          }}
                          title="Descargar mod"
                          className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span
                          className={`text-[11px] uppercase tracking-wider block mb-1 text-zinc-400`}
                        >
                          {mod.authorEmail ? `por ${mod.authorEmail}` : "Autor desconocido"}
                        </span>
                        <h3
                          className={`text-base font-bold line-clamp-1 transition-colors ${
                            isLight
                              ? "text-zinc-900 group-hover:text-black"
                              : "text-white group-hover:text-zinc-200"
                          }`}
                        >
                          {mod.title}
                        </h3>
                        <p
                          className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                            isLight ? "text-zinc-600" : "text-zinc-400"
                          }`}
                        >
                          {mod.description}
                        </p>
                      </div>
                      <div className="pt-3 border-t flex items-center justify-between text-xs">
                        <span
                          className={`flex items-center gap-1.5 font-mono ${
                            isLight ? "text-zinc-600" : "text-zinc-400"
                          }`}
                        >
                          <Download className="size-3.5 text-zinc-400" />
                          {new Date(mod.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Banner publicitario nativo */}
      <NativeBannerAd />
    </div>
  );
}
