import { Link } from "wouter";
import {
  Bookmark,
  Clock,
  Compass,
  HardDrive,
  Heart,
  Layers,
  Play,
  UserPen,
} from "lucide-react";
import { ROUTES } from "../../../../app/routes";
import type { CatalogItem } from "../../domain/catalog.types";
import { APARTADO_BADGE } from "../../domain/catalogViews";
import { playDetailOpenSound } from "../../../../shared/utils/playDetailOpenSound";
import type { LibraryStats } from "../../utils/libraryHelpers";
import FramedCover from "../FramedCover";

interface LibraryHomeViewProps {
  displayName: string;
  email?: string;
  avatarSrc?: string;
  allItems: CatalogItem[];
  filteredItems: CatalogItem[];
  stats: LibraryStats;
  hasActiveFilter: boolean;
  isLoading: boolean;
  error: string | null;
  favoriteBusyId: string | null;
  isLight: boolean;
  onSelectItem: (item: CatalogItem) => void;
  onRemoveFavorite: (item: CatalogItem) => void;
  onClearFilters: () => void;
  onRetry: () => void;
}

export default function LibraryHomeView({
  displayName,
  email,
  avatarSrc,
  allItems,
  filteredItems,
  stats,
  hasActiveFilter,
  isLoading,
  error,
  favoriteBusyId,
  isLight,
  onSelectItem,
  onRemoveFavorite,
  onClearFilters,
  onRetry,
}: LibraryHomeViewProps) {
  const recentItems = !hasActiveFilter ? allItems.slice(0, 4) : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Cabecera compacta estilo perfil de Steam Library */}
      <header
        className={`border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight
            ? "bg-white border-zinc-200 shadow-sm"
            : "bg-gradient-to-r from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-zinc-800"
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`size-14 sm:size-16 border overflow-hidden shrink-0 ${
              isLight ? "border-zinc-300 bg-zinc-100" : "border-zinc-700 bg-zinc-900"
            }`}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="size-full grid place-items-center text-zinc-400 text-xl font-bold">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="size-2 bg-emerald-500 shrink-0" aria-hidden />
              <p
                className={`text-[11px] uppercase tracking-widest ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                Biblioteca de Steam · El Sótano
              </p>
            </div>
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-wide truncate ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              {displayName}
            </h1>
            <div
              className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1 ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-3.5 text-emerald-400" />
                <strong className={isLight ? "text-zinc-900" : "text-zinc-200"}>
                  {stats.total}
                </strong>{" "}
                {stats.total === 1 ? "título" : "títulos"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="size-3.5 text-sky-400" />
                <strong className={isLight ? "text-zinc-900" : "text-zinc-200"}>
                  {stats.totalSizeLabel}
                </strong>{" "}
                aprox.
              </span>
              {email && <span className="hidden sm:inline opacity-75">{email}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={ROUTES.CATALOG}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors ${
              isLight
                ? "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200"
                : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <Compass className="size-3.5" />
            <span>Catálogo</span>
          </Link>
          <Link
            href={ROUTES.PROFILE}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors ${
              isLight
                ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black"
                : "bg-white border-white text-zinc-950 hover:bg-zinc-200"
            }`}
          >
            <UserPen className="size-3.5" />
            <span>Perfil</span>
          </Link>
        </div>
      </header>

      {error ? (
        <div
          className={`p-8 border border-dashed text-center ${
            isLight ? "bg-white border-red-300" : "bg-zinc-950/50 border-red-900/50"
          }`}
        >
          <p className="text-sm text-red-500 font-semibold mb-4">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`px-5 py-2.5 border text-xs uppercase tracking-wider cursor-pointer ${
              isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-950 border-white"
            }`}
          >
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className={`border overflow-hidden animate-pulse ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
              }`}
            >
              <div className={`aspect-[3/4] ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
            </div>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div
          className={`p-10 sm:p-14 border border-dashed text-center ${
            isLight ? "bg-white border-zinc-300" : "bg-zinc-900/40 border-zinc-800"
          }`}
        >
          <Bookmark
            className={`size-12 mx-auto mb-3 ${
              isLight ? "text-zinc-400" : "text-zinc-600"
            }`}
          />
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider mb-2">
            Tu biblioteca está vacía
          </h2>
          <p
            className={`text-sm max-w-md mx-auto mb-6 ${
              isLight ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            Explora el catálogo y marca con el corazón los juegos, mods, herramientas o ROMs que quieras tener organizados aquí.
          </p>
          <Link
            href={ROUTES.CATALOG}
            className={`inline-flex items-center gap-2 px-5 py-2.5 border text-xs uppercase tracking-wider font-bold ${
              isLight
                ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black"
                : "bg-emerald-500 border-emerald-400 text-zinc-950 hover:bg-emerald-400"
            }`}
          >
            <Compass className="size-4" />
            <span>Explorar catálogo</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Estantería "Recientes" (solo cuando no hay filtro activo) */}
          {recentItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2
                  className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  <Clock className="size-3.5 text-emerald-400" />
                  <span>Agregados recientemente</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      playDetailOpenSound();
                      onSelectItem(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playDetailOpenSound();
                        onSelectItem(item);
                      }
                    }}
                    className={`group relative flex items-center gap-3.5 p-2.5 border transition-all cursor-pointer overflow-hidden ${
                      isLight
                        ? "bg-white border-zinc-200 hover:border-zinc-500 shadow-sm"
                        : "bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-800/90"
                    }`}
                  >
                    <div className="relative w-14 aspect-[3/4] shrink-0 overflow-hidden border border-zinc-700/50 bg-zinc-950">
                      <FramedCover
                        src={item.img}
                        alt={item.title}
                        framing={item.coverFraming}
                        hoverClassName="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold border mb-1 ${
                          isLight
                            ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                            : "bg-zinc-950 border-zinc-700 text-zinc-300"
                        }`}
                      >
                        {APARTADO_BADGE[item.apartado]}
                      </span>
                      <h3 className="text-sm font-bold truncate">{item.title}</h3>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        {item.genre} · {item.size}
                      </p>
                    </div>
                    <span
                      className={`size-8 grid place-items-center border opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
                        isLight
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-emerald-500 text-zinc-950 border-emerald-400"
                      }`}
                      aria-hidden
                    >
                      <Play className="size-3.5 fill-current" />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Estantería principal de portadas estilo Steam Shelf */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                className={`text-xs uppercase tracking-widest font-bold ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                {hasActiveFilter
                  ? `Resultados filtrados (${filteredItems.length})`
                  : `Toda tu colección (${filteredItems.length})`}
              </h2>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div
                className={`p-8 border border-dashed text-center ${
                  isLight ? "bg-white border-zinc-300" : "bg-zinc-900/40 border-zinc-800"
                }`}
              >
                <p className={`text-sm mb-3 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                  No hay títulos que coincidan con tu búsqueda o filtro actual.
                </p>
                <button
                  type="button"
                  onClick={onClearFilters}
                  className={`px-4 py-2 border text-xs uppercase tracking-wider font-semibold cursor-pointer ${
                    isLight
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-950 border-white"
                  }`}
                >
                  Mostrar toda la biblioteca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir ${item.title} en biblioteca`}
                    onClick={() => {
                      playDetailOpenSound();
                      onSelectItem(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        playDetailOpenSound();
                        onSelectItem(item);
                      }
                    }}
                    className={`group relative aspect-[3/4] overflow-hidden border shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${
                      isLight
                        ? "bg-white border-zinc-300 hover:border-zinc-900"
                        : "bg-zinc-900 border-zinc-800 hover:border-emerald-400/70"
                    }`}
                  >
                    <FramedCover
                      src={item.img}
                      alt={item.title}
                      framing={item.coverFraming}
                      hoverClassName="transition-transform duration-300 ease-out group-hover:scale-105"
                    />

                    {/* Degradado inferior para legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/30 opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Insignia superior izquierda + quitar rápido */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold border ${
                          item.apartado === "adultos"
                            ? "bg-rose-600/95 text-white border-rose-500"
                            : "bg-black/80 text-zinc-200 border-zinc-700"
                        }`}
                      >
                        {APARTADO_BADGE[item.apartado]}
                      </span>

                      <button
                        type="button"
                        disabled={favoriteBusyId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite(item);
                        }}
                        title="Quitar de biblioteca"
                        aria-label={`Quitar ${item.title} de biblioteca`}
                        className="p-1.5 bg-black/75 hover:bg-rose-600 text-rose-400 hover:text-white border border-zinc-700 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Heart className="size-3.5 fill-current" />
                      </button>
                    </div>

                    {/* Pie de portada estilo Steam */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 pointer-events-none">
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-mono text-zinc-300">
                        <span className="truncate">{item.version}</span>
                        <span className="shrink-0 text-emerald-300">{item.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
