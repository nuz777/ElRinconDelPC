import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, Library, PanelLeftOpen } from "lucide-react";
import Navbar from "../../../shared/ui/Navbar";
import { useTheme } from "../../../shared/context/useTheme";
import { useAuth } from "../../auth/context/useAuth";
import type { CatalogItem } from "../domain/catalog.types";
import { catalogService } from "../api/catalog.service";
import FullscreenDetailModal from "../components/FullscreenDetailModal";
import LibrarySidebar from "../components/library/LibrarySidebar";
import LibraryHomeView from "../components/library/LibraryHomeView";
import LibraryDetailView from "../components/library/LibraryDetailView";
import {
  computeLibraryStats,
  filterLibraryItems,
  type LibrarySectionFilter,
  type LibrarySortMode,
} from "../utils/libraryHelpers";
import { dialog } from "../../../shared/ui/dialog";

const SIDEBAR_STORAGE_KEY = "sotano_library_sidebar_width";
const DEFAULT_SIDEBAR_WIDTH = 296;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;

function readSavedSidebarWidth(): number {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  try {
    const raw = Number(localStorage.getItem(SIDEBAR_STORAGE_KEY));
    if (Number.isFinite(raw) && raw >= MIN_SIDEBAR_WIDTH && raw <= MAX_SIDEBAR_WIDTH) {
      return raw;
    }
  } catch {
    // noop
  }
  return DEFAULT_SIDEBAR_WIDTH;
}

export default function LibraryPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [hydratedById, setHydratedById] = useState<Record<string, CatalogItem>>({});
  const [hydratingId, setHydratingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<LibrarySectionFilter>("todos");
  const [sortMode, setSortMode] = useState<LibrarySortMode>("recent");
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => readSavedSidebarWidth());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [fullscreenItem, setFullscreenItem] = useState<CatalogItem | null>(null);

  const displayName = user?.name || user?.username || user?.email || "Mi perfil";
  const avatarSrc = user?.picture;

  const fetchAllFavorites = useCallback(async (): Promise<CatalogItem[]> => {
    const firstPage = await catalogService.getFavoriteItems({
      page: 1,
      limit: 100,
      view: "summary",
    });
    let collected = [...firstPage.items];

    if (firstPage.totalPages > 1) {
      const restPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
          catalogService.getFavoriteItems({
            page: i + 2,
            limit: 100,
            view: "summary",
          }),
        ),
      );
      for (const p of restPages) {
        collected = collected.concat(p.items);
      }
    }

    return collected;
  }, []);

  const loadAllFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await fetchAllFavorites());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar tu biblioteca.",
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllFavorites]);

  useEffect(() => {
    let cancelled = false;
    fetchAllFavorites()
      .then((collected) => {
        if (!cancelled) {
          setError(null);
          setItems(collected);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar tu biblioteca.",
          );
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAllFavorites]);

  const hydrateItem = useCallback(
    async (item: CatalogItem) => {
      if (hydratedById[item.id]) return;
      setHydratingId(item.id);
      try {
        const fullItem = item.publicCode
          ? await catalogService.getItemByCode(item.publicCode)
          : await catalogService.getItemById(item.id);
        if (fullItem) {
          setHydratedById((prev) => ({ ...prev, [item.id]: fullItem }));
        }
      } catch {
        // Conserva el resumen si la hidratación falla
      } finally {
        setHydratingId((current) => (current === item.id ? null : current));
      }
    },
    [hydratedById],
  );

  const handleSelectItem = useCallback(
    (item: CatalogItem) => {
      setSelectedId(item.id);
      setMobileListOpen(false);
      void hydrateItem(item);
    },
    [hydrateItem],
  );

  const handleRemoveFavorite = async (item: CatalogItem) => {
    if (favoriteBusyId) return;
    setFavoriteBusyId(item.id);
    try {
      await catalogService.removeFavorite(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      if (selectedId === item.id) {
        setSelectedId(null);
      }
      if (fullscreenItem?.id === item.id) {
        setFullscreenItem(null);
      }
      dialog.toast("info", "Quitado de biblioteca", `"${item.title}" se eliminó de tu colección.`);
    } catch (err) {
      dialog.toast(
        "error",
        "Biblioteca",
        err instanceof Error ? err.message : "No se pudo quitar de tu biblioteca.",
      );
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const stats = useMemo(() => computeLibraryStats(items), [items]);
  const filteredItems = useMemo(
    () =>
      filterLibraryItems(items, {
        search: searchQuery,
        section: sectionFilter,
        sort: sortMode,
      }),
    [items, searchQuery, sectionFilter, sortMode],
  );

  const selectedSummary = useMemo(
    () => (selectedId ? items.find((it) => it.id === selectedId) ?? null : null),
    [items, selectedId],
  );
  const selectedItem = selectedSummary
    ? hydratedById[selectedSummary.id] ?? selectedSummary
    : null;

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
    } catch {
      // noop
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = resizeDragRef.current;
      if (!drag) return;
      const delta = e.clientX - drag.startX;
      const clamped = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, Math.round(drag.startWidth + delta)),
      );
      setSidebarWidth(clamped);
    };

    const stopResizing = () => {
      resizeDragRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizing]);

  const startResizing = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    resizeDragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    setIsResizing(true);
  };

  const hasActiveFilter = Boolean(searchQuery.trim()) || sectionFilter !== "todos";

  return (
    <div
      className={`min-h-dvh lg:h-dvh flex flex-col font-share transition-colors duration-150 ${
        isResizing ? "select-none cursor-col-resize" : ""
      } ${isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-[#13161c] text-zinc-100"}`}
    >
      <Navbar />

      {/* Shell Split-Pane estilo Steam debajo del Navbar fijo (h-16) */}
      <div className="flex-1 pt-16 flex flex-col lg:flex-row lg:min-h-0">
        {/* Barra toggle en móvil/tablet (< lg) */}
        <div
          className={`lg:hidden border-b px-4 py-2.5 flex items-center justify-between gap-3 ${
            isLight ? "bg-white border-zinc-200" : "bg-[#0d0f13] border-zinc-800"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileListOpen((prev) => !prev)}
            className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold cursor-pointer"
          >
            <Library className="size-4 text-emerald-400" />
            <span>
              {selectedItem ? selectedItem.title : `Mi Biblioteca (${stats.total})`}
            </span>
            {mobileListOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {selectedItem && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 cursor-pointer"
            >
              Inicio
            </button>
          )}
        </div>

        {/* Sidebar izquierdo (redimensionable y colapsable en desktop, desplegable en móvil) */}
        <div
          style={{ "--sidebar-w": `${sidebarWidth}px` } as CSSProperties}
          className={`${
            mobileListOpen ? "block max-h-[60vh] border-b border-zinc-800" : "hidden"
          } ${
            isSidebarCollapsed ? "lg:hidden" : "lg:block lg:w-[var(--sidebar-w)]"
          } lg:h-full shrink-0 overflow-hidden`}
        >
          <LibrarySidebar
            items={filteredItems}
            allItemsCount={items.length}
            byApartado={stats.byApartado}
            selectedId={selectedId}
            searchQuery={searchQuery}
            sectionFilter={sectionFilter}
            sortMode={sortMode}
            isLight={isLight}
            onSelectHome={() => {
              setSelectedId(null);
              setMobileListOpen(false);
            }}
            onSelectItem={handleSelectItem}
            onSearchChange={setSearchQuery}
            onSectionChange={setSectionFilter}
            onSortChange={setSortMode}
            onCollapseDesktop={() => setIsSidebarCollapsed(true)}
          />
        </div>

        {/* Divisor arrastrable para agrandar / achicar el sidebar en desktop */}
        {!isSidebarCollapsed && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Redimensionar menú lateral de biblioteca"
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
            aria-valuenow={sidebarWidth}
            title="Arrastra para agrandar o achicar (doble clic para restablecer)"
            onPointerDown={startResizing}
            onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setSidebarWidth((w) => Math.max(MIN_SIDEBAR_WIDTH, w - 16));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setSidebarWidth((w) => Math.min(MAX_SIDEBAR_WIDTH, w + 16));
              }
            }}
            className={`hidden lg:flex w-1.5 h-full shrink-0 items-center justify-center cursor-col-resize transition-colors group outline-none ${
              isResizing
                ? "bg-emerald-500/70"
                : isLight
                  ? "bg-transparent hover:bg-zinc-300/80"
                  : "bg-transparent hover:bg-emerald-500/40"
            }`}
          >
            <span
              aria-hidden
              className={`w-0.5 h-10 transition-opacity ${
                isResizing
                  ? "bg-emerald-300 opacity-100"
                  : isLight
                    ? "bg-zinc-500 opacity-0 group-hover:opacity-100"
                    : "bg-emerald-400 opacity-0 group-hover:opacity-100"
              }`}
            />
          </div>
        )}

        {/* Riel compacto cuando el menú lateral está colapsado en desktop */}
        {isSidebarCollapsed && (
          <div
            className={`hidden lg:flex flex-col items-center gap-2 py-3 w-11 h-full shrink-0 border-r ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-700"
                : "bg-[#0d0f13] border-zinc-800/90 text-zinc-300"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Mostrar menú lateral de biblioteca"
              aria-label="Mostrar menú lateral de biblioteca"
              className={`p-2 border transition-colors cursor-pointer ${
                isLight
                  ? "border-zinc-300 hover:bg-zinc-100 text-zinc-800"
                  : "border-zinc-800 hover:bg-zinc-800 text-emerald-400"
              }`}
            >
              <PanelLeftOpen className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              title="Ir a Inicio de Biblioteca"
              aria-label="Ir a Inicio de Biblioteca"
              className={`p-2 border transition-colors cursor-pointer ${
                selectedId === null
                  ? isLight
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-zinc-800 border-zinc-600 text-emerald-300"
                  : isLight
                    ? "border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                    : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        )}

        {/* Panel derecho principal con scroll independiente */}
        <main className="flex-1 lg:h-full lg:overflow-y-auto">
          {selectedItem ? (
            <LibraryDetailView
              key={selectedItem.id}
              item={selectedItem}
              isHydrating={hydratingId === selectedItem.id}
              favoriteBusy={favoriteBusyId === selectedItem.id}
              isLight={isLight}
              onBackToHome={() => setSelectedId(null)}
              onRemoveFavorite={(target) => void handleRemoveFavorite(target)}
              onOpenFullscreen={setFullscreenItem}
            />
          ) : (
            <LibraryHomeView
              displayName={displayName}
              email={user?.email}
              avatarSrc={avatarSrc}
              allItems={items}
              filteredItems={filteredItems}
              stats={stats}
              hasActiveFilter={hasActiveFilter}
              isLoading={isLoading}
              error={error}
              favoriteBusyId={favoriteBusyId}
              isLight={isLight}
              onSelectItem={handleSelectItem}
              onRemoveFavorite={(target) => void handleRemoveFavorite(target)}
              onClearFilters={() => {
                setSearchQuery("");
                setSectionFilter("todos");
              }}
              onRetry={() => {
                void loadAllFavorites();
              }}
            />
          )}
        </main>
      </div>

      <FullscreenDetailModal
        item={fullscreenItem}
        onClose={() => setFullscreenItem(null)}
        isFavorite={Boolean(fullscreenItem)}
        onToggleFavorite={
          fullscreenItem ? (target) => void handleRemoveFavorite(target) : undefined
        }
        favoriteDisabled={
          fullscreenItem ? favoriteBusyId === fullscreenItem.id : false
        }
      />
    </div>
  );
}
