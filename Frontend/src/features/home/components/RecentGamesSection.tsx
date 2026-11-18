import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Gamepad2, RefreshCw, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ROUTES } from "../../../app/routes";
import { useTheme } from "../../../shared/context/useTheme";
import {
  catalogService,
  type CatalogSectionApi,
} from "../../catalog/api/catalog.service";
import CatalogCard from "../../catalog/components/CatalogCard";
import type { CatalogItem } from "../../catalog/domain/catalog.types";

const HOME_TABS: Array<{ id: CatalogSectionApi; label: string; route: string }> = [
  { id: "JUEGOS", label: "Juegos PC", route: ROUTES.GAMES },
  { id: "ROMS", label: "ROMs", route: "/rom/nintendo/nintendo-64" },
  { id: "MODS", label: "Mods & Shaders", route: ROUTES.MODS },
  { id: "HERRAMIENTAS", label: "Herramientas", route: ROUTES.TOOLS },
];

const PAGE_LIMIT = 12;

interface ShowcaseFeed {
  section: CatalogSectionApi;
  nonce: number;
  items: CatalogItem[];
  page: number;
  total: number;
  totalPages: number;
  error: string | null;
}

interface RecentGamesSectionProps {
  onSelectItem: (item: CatalogItem) => void;
}

export default function RecentGamesSection({ onSelectItem }: RecentGamesSectionProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();

  const [activeSection, setActiveSection] = useState<CatalogSectionApi>("JUEGOS");
  const [reloadNonce, setReloadNonce] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const [feed, setFeed] = useState<ShowcaseFeed | null>(() => {
    const cached = catalogService.getCachedRecentPage("JUEGOS", PAGE_LIMIT);
    if (!cached) return null;
    return {
      section: "JUEGOS",
      nonce: 0,
      items: cached.items,
      page: cached.page,
      total: cached.total,
      totalPages: cached.totalPages,
      error: null,
    };
  });

  useEffect(() => {
    const cached = catalogService.getCachedRecentPage(activeSection, PAGE_LIMIT);
    if (cached && reloadNonce === 0) {
      return;
    }

    let cancelled = false;
    catalogService
      .prefetchRecentPage(activeSection, PAGE_LIMIT)
      .then((res) => {
        if (cancelled) return;
        setFeed({
          section: activeSection,
          nonce: reloadNonce,
          items: res.items,
          page: res.page,
          total: res.total,
          totalPages: res.totalPages,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setFeed({
          section: activeSection,
          nonce: reloadNonce,
          items: [],
          page: 1,
          total: 0,
          totalPages: 1,
          error:
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los títulos recientes.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeSection, reloadNonce]);

  const handleTabSwitch = (nextSection: CatalogSectionApi) => {
    setActiveSection(nextSection);
    const cached = catalogService.getCachedRecentPage(nextSection, PAGE_LIMIT);
    if (cached) {
      setFeed({
        section: nextSection,
        nonce: reloadNonce,
        items: cached.items,
        page: cached.page,
        total: cached.total,
        totalPages: cached.totalPages,
        error: null,
      });
    }
  };

  const handleLoadMore = async () => {
    if (!feed || loadingMore || feed.page >= feed.totalPages) return;
    const nextPage = feed.page + 1;
    try {
      setLoadingMore(true);
      const res = await catalogService.getPaginatedItems({
        section: activeSection,
        page: nextPage,
        limit: PAGE_LIMIT,
        view: "summary",
      });
      setFeed((prev) => {
        if (!prev || prev.section !== activeSection) return prev;
        const existingIds = new Set(prev.items.map((it) => it.id));
        const merged = [...prev.items, ...res.items.filter((it) => !existingIds.has(it.id))];
        return {
          ...prev,
          items: merged,
          page: res.page,
          total: res.total,
          totalPages: res.totalPages,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      setLocation(`${ROUTES.CATALOG}?search=${encodeURIComponent(q)}`);
    } else {
      setLocation(ROUTES.CATALOG);
    }
    window.scrollTo({ top: 0 });
  };

  const activeFeed =
    feed && feed.section === activeSection && feed.nonce === reloadNonce ? feed : null;
  const isLoading = activeFeed === null;
  const currentTab = HOME_TABS.find((t) => t.id === activeSection) ?? HOME_TABS[0];

  return (
    <section
      id="recent-games"
      className={`py-20 md:py-24 scroll-mt-16 border-b ${
        isLight ? "bg-[#f4f4f5] border-zinc-200" : "bg-zinc-950 border-zinc-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Cabecera estilo portal de juegos */}
        <div
          className={`p-5 sm:p-6 border shadow-lg space-y-5 ${
            isLight
              ? "bg-white border-zinc-200 shadow-zinc-200/50"
              : "bg-zinc-900/90 border-zinc-800 shadow-black/50"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 font-mono">
                <Gamepad2 className="size-4" />
                <span>Últimos Aportes · Precargados del Servidor</span>
              </div>
              <h2 className="font-share text-2xl sm:text-4xl text-theme-title uppercase font-extrabold tracking-wide">
                {activeSection === "JUEGOS"
                  ? "Juegos Recientes"
                  : `${currentTab.label} Recientes`}
              </h2>
            </div>

            <form onSubmit={handleSearchSubmit} className="w-full lg:w-96 flex">
              <div className="relative flex-1">
                <Search className="size-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar juego en el catálogo..."
                  className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm border border-r-0 focus:outline-none transition-colors ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500"
                  }`}
                />
              </div>
              <button
                type="submit"
                className={`px-4 py-2.5 text-xs uppercase tracking-wider font-bold border transition-colors cursor-pointer ${
                  isLight
                    ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                    : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
                }`}
              >
                Buscar
              </button>
            </form>
          </div>

          <div
            className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
              isLight ? "border-zinc-200" : "border-zinc-800"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {HOME_TABS.map((tab) => {
                const active = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabSwitch(tab.id)}
                    className={`px-3.5 py-2 border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                      active
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-950 border-white"
                        : isLight
                          ? "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
                          : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeFeed && !activeFeed.error && (
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                Mostrando {activeFeed.items.length} de {activeFeed.total}
              </span>
            )}
          </div>
        </div>

        {/* Grilla de tarjetas 3:4 estilo BlizzBoyGames */}
        {activeFeed?.error ? (
          <div
            className={`p-8 border border-dashed text-center space-y-4 ${
              isLight ? "bg-white border-red-300" : "bg-zinc-900/50 border-red-900/50"
            }`}
          >
            <p className="text-sm text-red-500 font-semibold">{activeFeed.error}</p>
            <button
              type="button"
              onClick={() => {
                catalogService.clearRecentCache();
                setReloadNonce((n) => n + 1);
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 border text-xs uppercase tracking-wider font-bold cursor-pointer ${
                isLight
                  ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                  : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
              }`}
            >
              <RefreshCw className="size-3.5" />
              <span>Reintentar carga</span>
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`border overflow-hidden animate-pulse ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <div
                  className={`aspect-[3/4] w-full ${
                    isLight ? "bg-zinc-200" : "bg-zinc-800"
                  }`}
                />
                <div className="p-4 space-y-3">
                  <div className={`h-3 w-1/3 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                  <div className={`h-4 w-3/4 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                  <div className={`h-3 w-full ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : activeFeed.items.length === 0 ? (
          <div
            className={`p-12 border border-dashed text-center text-sm text-zinc-500 ${
              isLight ? "bg-white border-zinc-300" : "bg-zinc-900/40 border-zinc-800"
            }`}
          >
            No hay elementos publicados en esta categoría todavía.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {activeFeed.items.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                isLight={isLight}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        )}

        {/* Acciones inferiores: Cargar más / Ir al catálogo */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {activeFeed && activeFeed.page < activeFeed.totalPages && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void handleLoadMore()}
              className={`inline-flex items-center gap-2 px-6 py-3 border text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 ${
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-zinc-900 text-zinc-100 border-zinc-700 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {loadingMore ? "Cargando más..." : "Cargar más recientes"}
            </button>
          )}

          <Link
            href={currentTab.route}
            onClick={() => window.scrollTo({ top: 0 })}
            className={`inline-flex items-center gap-2 px-6 py-3 border text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
              isLight
                ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
            }`}
          >
            <span>Explorar todos en {currentTab.label}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
