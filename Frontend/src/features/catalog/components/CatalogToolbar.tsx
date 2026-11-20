import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, CornerDownLeft, HardDrive, Joystick, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { APARTADOS_CONFIG, APARTADO_BADGE } from "../domain/catalogViews";
import type { Apartado, CatalogItem } from "../domain/catalog.types";
import type { CatalogView } from "../utils/catalogUrl";
import RomBrandMenu from "./RomBrandMenu";
import FramedCover from "./FramedCover";

const MAX_SUGGESTIONS = 8;

/** Colores de la insignia de cada apartado en el buscador. */
function badgeTone(apartado: Apartado, isLight: boolean) {
  const tones: Record<Apartado, [string, string]> = {
    juegos: ["bg-zinc-100 text-zinc-700 border-zinc-300", "bg-zinc-950 text-zinc-300 border-zinc-700"],
    mods: ["bg-blue-50 text-blue-700 border-blue-200", "bg-blue-950/60 text-blue-300 border-blue-800"],
    roms: ["bg-violet-50 text-violet-700 border-violet-200", "bg-violet-950/60 text-violet-300 border-violet-800"],
    adultos: ["bg-rose-50 text-rose-700 border-rose-200", "bg-rose-950/60 text-rose-300 border-rose-800"],
    herramientas: ["bg-emerald-50 text-emerald-700 border-emerald-200", "bg-emerald-950/60 text-emerald-300 border-emerald-800"],
  };
  return tones[apartado][isLight ? 0 : 1];
}

const ROM_MENU_WIDTH = 600;
const ROM_MENU_IDEAL_HEIGHT = 310;

type RomMenuPosition = {
  left: number;
  width: number;
  maxHeight: number;
} & ({ top: number; bottom?: undefined } | { bottom: number; top?: undefined });

function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  const qLower = q.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === qLower ? (
          <strong key={i} className="font-extrabold text-blue-500 dark:text-blue-400">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface CatalogToolbarProps {
  activeView: CatalogView;
  selectedGenre: string;
  searchQuery: string;
  debouncedSearch: string;
  isSearchActive: boolean;
  allItemsForSuggestions: CatalogItem[];
  ageVerified: boolean;
  romCounts: Record<string, number>;
  totalRoms: number;
  isLight: boolean;
  isModalBlockingRomMenu: boolean;
  onSelectApartado: (apartado: "todos" | Exclude<Apartado, "roms">) => void;
  onSelectRomConsole: (brand: string, consoleName: string) => void;
  onSelectItemFromSuggestion: (item: CatalogItem) => void;
  onSearchChange: (value: string) => void;
  onClearGenre: () => void;
  onOpenFilterDrawer: () => void;
}

export default function CatalogToolbar({
  activeView,
  selectedGenre,
  searchQuery,
  debouncedSearch,
  isSearchActive,
  allItemsForSuggestions,
  ageVerified,
  romCounts,
  totalRoms,
  isLight,
  isModalBlockingRomMenu,
  onSelectApartado,
  onSelectRomConsole,
  onSelectItemFromSuggestion,
  onSearchChange,
  onClearGenre,
  onOpenFilterDrawer,
}: CatalogToolbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [romMenuOpen, setRomMenuOpen] = useState(false);
  const [romMenuPos, setRomMenuPos] = useState<RomMenuPosition>({
    left: 16,
    width: ROM_MENU_WIDTH,
    top: 0,
    maxHeight: 400,
  });
  const romTabRef = useRef<HTMLButtonElement>(null);
  const romMenuRef = useRef<HTMLDivElement>(null);
  const romCloseTimer = useRef<number | null>(null);

  const isSearching = searchQuery.trim().length >= 2 && searchQuery.trim() !== debouncedSearch;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (q.length < 2) return [];
    return allItemsForSuggestions
      .filter((item) => {
        if (
          item.apartado === "adultos" &&
          activeView.apartado !== "adultos" &&
          !ageVerified
        ) {
          return false;
        }
        return (
          item.title.toLowerCase().includes(q) ||
          item.genre.toLowerCase().includes(q) ||
          item.tag.toLowerCase().includes(q) ||
          item.developer.toLowerCase().includes(q)
        );
      });
  }, [allItemsForSuggestions, debouncedSearch, activeView.apartado, ageVerified]);
  const suggestions = useMemo(() => matches.slice(0, MAX_SUGGESTIONS), [matches]);

  const handleSearchInputChange = (val: string) => {
    onSearchChange(val);
    setSelectedIndex(-1);
    setIsDropdownOpen(val.trim().length >= 2);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || debouncedSearch.trim().length < 2) {
      if (e.key === "Enter") {
        setIsDropdownOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        onSelectItemFromSuggestion(suggestions[selectedIndex]);
        setIsDropdownOpen(false);
      } else {
        setIsDropdownOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  const positionRomMenu = () => {
    const rect = romTabRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 16;
    const width = Math.min(ROM_MENU_WIDTH, window.innerWidth - margin * 2);
    const left = Math.max(
      margin,
      Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin),
    );
    const edge = 8;
    const spaceBelow = window.innerHeight - rect.bottom - edge;
    const spaceAbove = rect.top - edge;
    const openBelow =
      spaceBelow >= ROM_MENU_IDEAL_HEIGHT ||
      (spaceAbove < ROM_MENU_IDEAL_HEIGHT && spaceBelow >= spaceAbove);
    setRomMenuPos(
      openBelow
        ? { left, width, top: rect.bottom, maxHeight: spaceBelow }
        : { left, width, bottom: window.innerHeight - rect.top, maxHeight: spaceAbove },
    );
  };

  const cancelCloseRomMenu = () => {
    if (romCloseTimer.current) window.clearTimeout(romCloseTimer.current);
    romCloseTimer.current = null;
  };

  const openRomMenu = () => {
    cancelCloseRomMenu();
    positionRomMenu();
    setRomMenuOpen(true);
  };

  const scheduleCloseRomMenu = () => {
    cancelCloseRomMenu();
    romCloseTimer.current = window.setTimeout(() => setRomMenuOpen(false), 300);
  };

  useEffect(() => {
    if (!romMenuOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (romMenuRef.current?.contains(target) || romTabRef.current?.contains(target)) return;
      setRomMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRomMenuOpen(false);
    };
    const onViewportChange = () => positionRomMenu();
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [romMenuOpen]);

  const selectedApartado = activeView.apartado;
  const romFilter = activeView.apartado === "roms" ? activeView : null;
  const kbdTone = isLight ? "border-zinc-300 bg-white" : "border-zinc-700 bg-zinc-950";

  return (
    <>
      <section
        className={`sticky top-16 z-40 w-full py-3 mb-6 transition-colors shadow-sm ${
          isLight ? "bg-[#f4f4f5]" : "bg-zinc-950"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`p-3 sm:p-4  border shadow-md flex flex-col items-stretch justify-between gap-3 transition-colors ${
              isLight ? "bg-white border-zinc-200 shadow-zinc-200/50" : "bg-zinc-900 border-zinc-800"
            }`}
          >
            {/* Desktop Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none [mask-image:linear-gradient(to_right,black_92%,transparent)] sm:[mask-image:none]">
              {APARTADOS_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedApartado === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onSelectApartado(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2  text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? isLight
                          ? "bg-zinc-900 text-white shadow font-bold"
                          : "bg-white text-zinc-950 shadow-md font-bold"
                        : isLight
                          ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 border border-transparent"
                          : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <button
                ref={romTabRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={romMenuOpen}
                onMouseEnter={openRomMenu}
                onMouseLeave={scheduleCloseRomMenu}
                onPointerUp={(e) => {
                  if (e.pointerType === "mouse") openRomMenu();
                  else if (romMenuOpen) setRomMenuOpen(false);
                  else openRomMenu();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                    e.preventDefault();
                    openRomMenu();
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2  text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedApartado === "roms" || romMenuOpen
                    ? isLight
                      ? "bg-zinc-900 text-white shadow font-bold"
                      : "bg-white text-zinc-950 shadow-md font-bold"
                    : isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 border border-transparent"
                      : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700"
                }`}
              >
                <Joystick className="size-3.5" />
                <span>ROMs</span>
                <ChevronDown
                  className={`size-3.5 transition-transform ${romMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Search Input & Hamburger Filter Trigger */}
            <div className="flex items-center gap-2.5 w-full">
              <div ref={searchContainerRef} className="relative flex-1">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none ${
                    isLight ? "text-zinc-400" : "text-zinc-500"
                  }`}
                />
                <input
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isDropdownOpen && searchQuery.trim().length >= 2}
                  aria-haspopup="listbox"
                  aria-controls="catalog-search-listbox"
                  aria-activedescendant={
                    selectedIndex >= 0 ? `suggestion-item-${selectedIndex}` : undefined
                  }
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
                  }}
                  placeholder="Buscar juegos, mods, herramientas..."
                  className={`w-full pl-9 pr-8 py-2  text-xs sm:text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange("");
                      setIsDropdownOpen(false);
                    }}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${
                      isLight ? "text-zinc-400 hover:text-black" : "text-zinc-500 hover:text-white"
                    }`}
                    aria-label="Limpiar campo de búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}

                <AnimatePresence>
                  {isDropdownOpen && searchQuery.trim().length >= 2 && (
                    <motion.div
                      id="catalog-search-listbox"
                      role="listbox"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute top-full left-0 right-0 mt-2 border shadow-2xl overflow-hidden z-50 backdrop-blur-md ${
                        isLight
                          ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-400/40"
                          : "bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-black/90"
                      }`}
                    >
                      {/* Cabecera */}
                      <div
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b text-[11px] uppercase tracking-widest ${
                          isLight ? "border-zinc-200 text-zinc-500" : "border-zinc-800 text-zinc-400"
                        }`}
                      >
                        <span className="truncate">
                          {isSearching ? (
                            "Buscando…"
                          ) : (
                            <>
                              <span className={`font-bold ${isLight ? "text-zinc-900" : "text-white"}`}>{matches.length}</span>{" "}
                              {matches.length === 1 ? "resultado" : "resultados"} para &quot;{debouncedSearch}&quot;
                            </>
                          )}
                        </span>
                        {!isSearching && matches.length > MAX_SUGGESTIONS && (
                          <span className="shrink-0 normal-case tracking-normal">Mostrando {MAX_SUGGESTIONS}</span>
                        )}
                      </div>

                      {isSearching ? (
                        <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex items-center gap-3 p-2 animate-pulse">
                              <div className={`w-12 aspect-[3/4] shrink-0 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                              <div className="flex-1 space-y-2">
                                <div className={`h-3 w-3/4 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                                <div className={`h-2.5 w-1/2 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                                <div className={`h-2.5 w-1/3 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : suggestions.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 px-4 py-8 text-center ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                          <SearchX className="size-7 opacity-60" aria-hidden />
                          <p className="text-sm">
                            No encontramos nada para &quot;
                            <span className={isLight ? "text-zinc-900" : "text-white"}>{debouncedSearch}</span>&quot;
                          </p>
                          <p className="text-[11px]">Prueba con otro nombre, un género o el creador.</p>
                        </div>
                      ) : (
                        <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[min(26rem,60vh)] overflow-y-auto overscroll-contain">
                          {suggestions.map((item, idx) => {
                            const isSelected = selectedIndex === idx;
                            const isAdult = item.apartado === "adultos";
                            return (
                              <div
                                key={item.id}
                                id={`suggestion-item-${idx}`}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  onSelectItemFromSuggestion(item);
                                  setIsDropdownOpen(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`group relative flex items-center gap-3 p-2 border cursor-pointer transition-colors ${
                                  isSelected
                                    ? isLight
                                      ? "bg-zinc-100 border-zinc-300"
                                      : "bg-zinc-900 border-zinc-700"
                                    : "border-transparent"
                                }`}
                              >
                                {/* Acento lateral del ítem activo */}
                                <span
                                  className={`absolute left-0 top-2 bottom-2 w-0.5 transition-opacity ${
                                    isSelected ? "opacity-100" : "opacity-0"
                                  } ${isAdult ? "bg-rose-500" : isLight ? "bg-zinc-900" : "bg-white"}`}
                                  aria-hidden
                                />
                                <div
                                  className={`relative w-12 sm:w-14 aspect-[3/4] shrink-0 overflow-hidden border ${
                                    isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"
                                  }`}
                                >
                                  <FramedCover
                                    src={item.img}
                                    alt=""
                                    framing={item.coverFraming}
                                    showLoader={false}
                                    hoverClassName="transition-transform duration-300 group-hover:scale-110"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`text-[9px] uppercase px-1.5 py-0.5 font-mono font-bold tracking-wider shrink-0 border ${badgeTone(
                                        item.apartado,
                                        isLight,
                                      )}`}
                                    >
                                      {APARTADO_BADGE[item.apartado]}
                                    </span>
                                    {item.tag && (
                                      <span
                                        className={`text-[10px] uppercase tracking-wider truncate ${
                                          isLight ? "text-amber-700" : "text-amber-400"
                                        }`}
                                      >
                                        {item.tag}
                                      </span>
                                    )}
                                  </div>
                                  <div className={`mt-1 text-sm font-semibold truncate ${isLight ? "text-zinc-900" : "text-white"}`}>
                                    {highlightMatch(item.title, debouncedSearch)}
                                  </div>
                                  <div
                                    className={`mt-0.5 flex items-center gap-1.5 text-[11px] min-w-0 ${
                                      isLight ? "text-zinc-500" : "text-zinc-400"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {item.apartado === "roms" && item.console ? item.console : item.genre}
                                    </span>
                                    {item.size && item.size !== "N/A" && (
                                      <>
                                        <span aria-hidden>·</span>
                                        <HardDrive className="size-3 shrink-0" aria-hidden />
                                        <span className="shrink-0">{item.size}</span>
                                      </>
                                    )}
                                    <span aria-hidden>·</span>
                                    <span className="shrink-0 font-mono">{item.version}</span>
                                  </div>
                                </div>
                                <ArrowRight
                                  className={`size-4 shrink-0 transition-all ${
                                    isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                                  } ${isLight ? "text-zinc-700" : "text-zinc-300"}`}
                                  aria-hidden
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Pie con atajos */}
                      <div
                        className={`hidden sm:flex items-center justify-between gap-3 px-4 py-2 border-t text-[11px] ${
                          isLight ? "border-zinc-200 text-zinc-500 bg-zinc-50/80" : "border-zinc-800 text-zinc-500 bg-zinc-900/60"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <kbd className={`px-1 border font-mono ${kbdTone}`}>↑</kbd>
                            <kbd className={`px-1 border font-mono ${kbdTone}`}>↓</kbd>
                            navegar
                          </span>
                          <span className="flex items-center gap-1">
                            <kbd className={`px-1 border ${kbdTone}`}>
                              <CornerDownLeft className="size-3 inline" aria-hidden />
                            </kbd>
                            abrir
                          </span>
                          <span className="flex items-center gap-1">
                            <kbd className={`px-1 border font-mono ${kbdTone}`}>Esc</kbd>
                            cerrar
                          </span>
                        </span>
                        {matches.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(false)}
                            className={`inline-flex items-center gap-1 uppercase tracking-wider font-semibold cursor-pointer ${
                              isLight ? "text-zinc-700 hover:text-black" : "text-zinc-300 hover:text-white"
                            }`}
                          >
                            Ver todos en el catálogo
                            <ArrowRight className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={onOpenFilterDrawer}
                title="Abrir menú de géneros y apartados"
                className={`p-2 sm:px-3 sm:py-2  border transition-colors cursor-pointer flex items-center gap-1.5 text-xs shrink-0 ${
                  isLight
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                    : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Menú Filtros</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Encabezado del listado de ROMs */}
      {romFilter && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div
            className={`flex flex-wrap items-center justify-between gap-3 p-4  border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Joystick className={`size-5 shrink-0 ${isLight ? "text-zinc-700" : "text-zinc-300"}`} />
              <div className="min-w-0">
                <span className="block text-[11px] uppercase tracking-widest text-zinc-500">
                  ROMs · {romFilter.brand}
                </span>
                <h2
                  className={`text-lg sm:text-xl font-bold uppercase tracking-wider truncate ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  {romFilter.console}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={openRomMenu}
              className={`text-xs underline underline-offset-2 cursor-pointer ${
                isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Cambiar consola
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {(selectedGenre !== "todos" || isSearchActive) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs uppercase tracking-widest ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
              Filtros activos:
            </span>
            {selectedGenre !== "todos" && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1  border text-xs font-medium ${
                  isLight
                    ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                    : "bg-zinc-900 border-zinc-700 text-zinc-200"
                }`}
              >
                <span>Género: {selectedGenre}</span>
                <button
                  type="button"
                  onClick={onClearGenre}
                  className={`cursor-pointer ${isLight ? "hover:text-black text-zinc-500" : "hover:text-white text-zinc-400"}`}
                  aria-label="Quitar filtro de género"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {isSearchActive && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1  border text-xs font-medium ${
                  isLight
                    ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                    : "bg-zinc-900 border-zinc-700 text-zinc-200"
                }`}
              >
                <span>Búsqueda: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className={`cursor-pointer ${isLight ? "hover:text-black text-zinc-500" : "hover:text-white text-zinc-400"}`}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onClearGenre();
                onSearchChange("");
              }}
              className={`text-xs underline underline-offset-2 ml-2 cursor-pointer transition-colors ${
                isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      {/* Hoverable ROM Popover Portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {romMenuOpen && !isModalBlockingRomMenu && (
              <motion.div
                ref={romMenuRef}
                role="menu"
                initial={{ opacity: 0, y: romMenuPos.top !== undefined ? -6 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: romMenuPos.top !== undefined ? -6 : 6 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={cancelCloseRomMenu}
                onMouseLeave={scheduleCloseRomMenu}
                style={{
                  left: romMenuPos.left,
                  width: romMenuPos.width,
                  top: romMenuPos.top,
                  bottom: romMenuPos.bottom,
                  maxHeight: romMenuPos.maxHeight,
                }}
                className={`fixed z-[70] flex flex-col font-share ${romMenuPos.top !== undefined ? "pt-2" : "pb-2"}`}
              >
                <div
                  className={`flex flex-col min-h-0  border shadow-2xl transition-colors ${
                    isLight
                      ? "bg-white border-zinc-200 shadow-zinc-400/40"
                      : "bg-zinc-900 border-zinc-800 shadow-black/90"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${
                      isLight ? "border-zinc-200" : "border-zinc-800"
                    }`}
                  >
                    <span
                      className={`text-xs uppercase tracking-widest font-bold ${
                        isLight ? "text-zinc-800" : "text-zinc-200"
                      }`}
                    >
                      Elige una consola
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">{totalRoms} ROMs</span>
                  </div>
                  <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
                    <RomBrandMenu
                      variant="popover"
                      isLight={isLight}
                      counts={romCounts}
                      activeBrand={romFilter?.brand}
                      activeConsole={romFilter?.console}
                      onSelect={(brand, consoleName) => {
                        onSelectRomConsole(brand, consoleName);
                        setRomMenuOpen(false);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
