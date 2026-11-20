import { ArrowUpDown, LayoutGrid, PanelLeftClose, Search, X } from "lucide-react";
import type { Apartado, CatalogItem } from "../../domain/catalog.types";
import { APARTADO_BADGE } from "../../domain/catalogViews";
import { playCategorySelectSound } from "../../../../shared/utils/playDetailOpenSound";
import FramedCover from "../FramedCover";
import type {
  LibrarySectionFilter,
  LibrarySortMode,
} from "../../utils/libraryHelpers";

interface LibrarySidebarProps {
  items: CatalogItem[];
  allItemsCount: number;
  byApartado: Record<Apartado, number>;
  selectedId: string | null;
  searchQuery: string;
  sectionFilter: LibrarySectionFilter;
  sortMode: LibrarySortMode;
  isLight: boolean;
  onSelectHome: () => void;
  onSelectItem: (item: CatalogItem) => void;
  onSearchChange: (value: string) => void;
  onSectionChange: (section: LibrarySectionFilter) => void;
  onSortChange: (sort: LibrarySortMode) => void;
  onCollapseDesktop?: () => void;
}

const SECTION_TABS: Array<{ id: LibrarySectionFilter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "juegos", label: "Juegos" },
  { id: "mods", label: "Mods" },
  { id: "herramientas", label: "Tools" },
  { id: "roms", label: "ROMs" },
  { id: "adultos", label: "+18" },
];

const SORT_LABELS: Record<LibrarySortMode, string> = {
  recent: "Recientes",
  title: "A–Z",
  size: "Peso",
};

const SORT_ORDER: LibrarySortMode[] = ["recent", "title", "size"];

export default function LibrarySidebar({
  items,
  allItemsCount,
  byApartado,
  selectedId,
  searchQuery,
  sectionFilter,
  sortMode,
  isLight,
  onSelectHome,
  onSelectItem,
  onSearchChange,
  onSectionChange,
  onSortChange,
  onCollapseDesktop,
}: LibrarySidebarProps) {
  const isHomeActive = selectedId === null;

  const cycleSort = () => {
    const nextIdx = (SORT_ORDER.indexOf(sortMode) + 1) % SORT_ORDER.length;
    onSortChange(SORT_ORDER[nextIdx]);
  };

  return (
    <aside
      aria-label="Lista de juegos de tu biblioteca"
      className={`flex flex-col h-full border-r transition-colors ${
        isLight
          ? "bg-white border-zinc-200 text-zinc-900"
          : "bg-[#0d0f13] border-zinc-800/90 text-zinc-100"
      }`}
    >
      {/* Cabecera estilo Steam: botón Inicio + contador */}
      <div
        className={`p-4 border-b space-y-3 shrink-0 ${
          isLight ? "border-zinc-200 bg-zinc-50/70" : "border-zinc-800/80 bg-zinc-950/60"
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playCategorySelectSound();
              onSelectHome();
            }}
            className={`flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 border text-sm uppercase tracking-wider font-bold transition-colors cursor-pointer ${
              isHomeActive
                ? isLight
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-zinc-800 text-white border-zinc-600 shadow-inner"
                : isLight
                  ? "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                  : "bg-zinc-900/70 text-zinc-300 border-zinc-800 hover:bg-zinc-800/80 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-emerald-400" />
              <span>Inicio</span>
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-mono ${
                isHomeActive
                  ? isLight
                    ? "bg-white/15 text-white"
                    : "bg-emerald-500/20 text-emerald-300"
                  : isLight
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {allItemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={cycleSort}
            title={`Ordenar por: ${SORT_LABELS[sortMode]} (clic para cambiar)`}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 border text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer shrink-0 ${
              isLight
                ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <ArrowUpDown className="size-4" />
            <span>{SORT_LABELS[sortMode]}</span>
          </button>

          {onCollapseDesktop && (
            <button
              type="button"
              onClick={onCollapseDesktop}
              title="Ocultar menú lateral"
              aria-label="Ocultar menú lateral"
              className={`hidden lg:inline-flex items-center justify-center p-2.5 border transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? "bg-white border-zinc-300 text-zinc-600 hover:text-black hover:bg-zinc-100"
                  : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <PanelLeftClose className="size-4" />
            </button>
          )}
        </div>

        {/* Buscador instantáneo */}
        <div className="relative">
          <Search
            className={`size-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isLight ? "text-zinc-400" : "text-zinc-500"
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, género..."
            aria-label="Buscar en tu biblioteca"
            className={`w-full pl-9 pr-8 py-2 text-sm border outline-none transition-colors ${
              isLight
                ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                : "bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500"
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${
                isLight ? "text-zinc-400 hover:text-zinc-800" : "text-zinc-500 hover:text-white"
              }`}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filtros rápidos por categoría */}
        <div className="flex flex-wrap gap-1.5">
          {SECTION_TABS.filter(
            (tab) => tab.id === "todos" || byApartado[tab.id] > 0 || sectionFilter === tab.id,
          ).map((tab) => {
            const active = sectionFilter === tab.id;
            const count = tab.id === "todos" ? allItemsCount : byApartado[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSectionChange(tab.id)}
                className={`px-2.5 py-1 text-xs uppercase tracking-wider font-semibold border transition-colors cursor-pointer ${
                  active
                    ? isLight
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : isLight
                      ? "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {tab.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista vertical densa estilo Steam */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent py-1.5">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className={`text-sm ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
              {allItemsCount === 0
                ? "Tu biblioteca está vacía."
                : "Ningún título coincide con el filtro."}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playCategorySelectSound();
                  onSelectItem(item);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer border-l-[3px] ${
                  isSelected
                    ? isLight
                      ? "bg-zinc-100 border-l-zinc-900 text-zinc-950"
                      : "bg-zinc-800/80 border-l-emerald-400 text-white"
                    : isLight
                      ? "border-l-transparent hover:bg-zinc-50 text-zinc-700"
                      : "border-l-transparent hover:bg-zinc-900/90 text-zinc-300 hover:text-white"
                }`}
              >
                <div className="relative w-9 aspect-[3/4] shrink-0 overflow-hidden border border-zinc-700/60 bg-zinc-900">
                  <FramedCover
                    src={item.img}
                    alt=""
                    framing={item.coverFraming}
                    showLoader={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm truncate ${
                      isSelected ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`text-xs truncate font-mono mt-0.5 ${
                      isSelected
                        ? isLight
                          ? "text-zinc-600"
                          : "text-emerald-300/80"
                        : isLight
                          ? "text-zinc-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {APARTADO_BADGE[item.apartado]} · {item.size}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
