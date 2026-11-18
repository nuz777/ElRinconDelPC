import { FileJson, Moon, Plus, SlidersHorizontal, Sun } from "lucide-react";

interface CatalogBannerProps {
  isLight: boolean;
  isAdmin: boolean;
  hasActiveGenreFilter: boolean;
  onOpenAdd: () => void;
  onOpenBulkJson: () => void;
  onOpenFilterDrawer: () => void;
  onToggleTheme: () => void;
}

export default function CatalogBanner({
  isLight,
  isAdmin,
  hasActiveGenreFilter,
  onOpenAdd,
  onOpenBulkJson,
  onOpenFilterDrawer,
  onToggleTheme,
}: CatalogBannerProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <div
        className={`relative  p-6 sm:p-10 border shadow-xl overflow-hidden transition-colors ${
          isLight
            ? "bg-white border-zinc-200 shadow-zinc-200/50"
            : "bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800"
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1
              className={`text-3xl sm:text-5xl font-extrabold uppercase tracking-wide drop-shadow-sm ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              El Sótano del PC
            </h1>

            <p
              className={`text-sm sm:text-base mt-2 max-w-xl leading-relaxed ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              Juegos, mods y herramientas de PC organizados por género. Toca cualquier ficha para ver sus especificaciones y descargar en pantalla completa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={onOpenAdd}
                  className={`inline-flex items-center gap-2 px-5 py-3  font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  <Plus className="size-4" />
                  <span>Agregar Item</span>
                </button>

                <button
                  onClick={onOpenBulkJson}
                  className="inline-flex items-center gap-2 px-4 py-3  font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  title="Cargar masivamente juegos o elementos desde un archivo JSON"
                >
                  <FileJson className="size-4" />
                  <span>Carga Masiva (JSON)</span>
                </button>
              </>
            )}

            <button
              onClick={onOpenFilterDrawer}
              className={`inline-flex items-center gap-2 px-5 py-3  border font-medium text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span>Géneros &amp; Menú</span>
              {hasActiveGenreFilter && (
                <span
                  className={`size-2  ${
                    isLight ? "bg-zinc-950" : "bg-white"
                  }`}
                />
              )}
            </button>

            <button
              onClick={onToggleTheme}
              title="Cambiar tema (claro / oscuro)"
              className={`p-3  border transition-colors cursor-pointer flex items-center justify-center ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700"
              }`}
              aria-label="Alternar modo claro / oscuro"
            >
              {isLight ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
