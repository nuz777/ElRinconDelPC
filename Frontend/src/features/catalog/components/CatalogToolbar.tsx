import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Joystick, Search, SlidersHorizontal, X } from "lucide-react";
import { APARTADOS_CONFIG, APARTADO_BADGE } from "../domain/catalogViews";
import type { Apartado, CatalogItem } from "../domain/catalog.types";
import type { CatalogView } from "../utils/catalogUrl";
import RomBrandMenu from "./RomBrandMenu";

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

  const suggestions = useMemo(() => {
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
      })
      .slice(0, 6);
  }, [allItemsForSuggestions, debouncedSearch, activeView.apartado, ageVerified]);

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

  return (
    <>
      <section
        className={`sticky top-16 z-40 w-full py-3 mb-6 transition-colors shadow-sm ${
          isLight ? "bg-[#f4f4f5]" : "bg-zinc-950"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`p-3 sm:p-4  border shadow-md flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
              isLight ? "bg-white border-zinc-200 shadow-zinc-200/50" : "bg-zinc-900 border-zinc-800"
            }`}
          >
            {/* Desktop Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {APARTADOS_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedApartado === tab.id;
                return (
                  <button
                    key={tab.id}
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
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div ref={searchContainerRef} className="relative flex-1 md:w-80">
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

                {isDropdownOpen && searchQuery.trim().length >= 2 && (
                  <div
                    id="catalog-search-listbox"
                    role="listbox"
                    className={`absolute top-full left-0 mt-2 w-full md:w-96  border shadow-2xl overflow-hidden z-50 transition-colors ${
                      isLight
                        ? "bg-white border-zinc-200 text-zinc-900 shadow-zinc-400/40"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black/90"
                    }`}
                  >
                    {isSearching ? (
                      <div className="p-2 space-y-2">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex items-center gap-3 p-2  animate-pulse">
                            <div
                              className={`w-[60px] h-[28px]  shrink-0 ${
                                isLight ? "bg-zinc-200" : "bg-zinc-800"
                              }`}
                            />
                            <div className="flex-1 space-y-1.5">
                              <div
                                className={`h-3 w-3/4  ${
                                  isLight ? "bg-zinc-200" : "bg-zinc-800"
                                }`}
                              />
                              <div
                                className={`h-2.5 w-1/3  ${
                                  isLight ? "bg-zinc-200" : "bg-zinc-800"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div
                        className={`p-4 text-center text-xs ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        Sin resultados para &quot;{debouncedSearch}&quot;
                      </div>
                    ) : (
                      <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
                        {suggestions.map((item, idx) => {
                          const isSelected = selectedIndex === idx;
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
                              className={`flex items-center gap-3 p-2  cursor-pointer transition-colors ${
                                isSelected
                                  ? isLight
                                    ? "bg-zinc-100 text-black font-medium"
                                    : "bg-zinc-800 text-white font-medium"
                                  : isLight
                                    ? "hover:bg-zinc-50 text-zinc-800"
                                    : "hover:bg-zinc-800/60 text-zinc-200"
                              }`}
                            >
                              <img
                                src={item.img}
                                alt={item.title}
                                loading="lazy"
                                className="w-[60px] h-[28px] object-cover  shrink-0 bg-zinc-950 border border-zinc-700/50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/img/SN-tools.jpg";
                                }}
                              />
                              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                <div className="text-xs sm:text-sm truncate">
                                  {highlightMatch(item.title, debouncedSearch)}
                                </div>
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.5  font-mono font-bold tracking-wider shrink-0 border ${
                                    item.apartado === "juegos"
                                      ? isLight
                                        ? "bg-zinc-100 text-zinc-700 border-zinc-300"
                                        : "bg-zinc-950 text-zinc-300 border-zinc-700"
                                      : item.apartado === "mods"
                                        ? isLight
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-blue-950/60 text-blue-300 border-blue-800"
                                        : item.apartado === "roms"
                                          ? isLight
                                            ? "bg-violet-50 text-violet-700 border-violet-200"
                                            : "bg-violet-950/60 text-violet-300 border-violet-800"
                                          : item.apartado === "adultos"
                                            ? isLight
                                              ? "bg-rose-50 text-rose-700 border-rose-200"
                                              : "bg-rose-950/60 text-rose-300 border-rose-800"
                                            : isLight
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                                  }`}
                                >
                                  {APARTADO_BADGE[item.apartado]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
