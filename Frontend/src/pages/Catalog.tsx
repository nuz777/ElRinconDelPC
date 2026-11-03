import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Plus,
  Gamepad2,
  Cpu,
  Wrench,
  Download,
  Check,
  HardDrive,
  FolderOpen,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FullscreenDetailModal from "../components/FullscreenDetailModal";
import AddItemModal from "../components/AddItemModal";
import {
  initialCatalogItems,
  type CatalogItem,
  type Apartado,
} from "../data/catalog";
import { useTheme } from "../ThemeContext";

const APARTADOS_CONFIG: {
  id: "todos" | Apartado;
  label: string;
  icon: typeof Gamepad2;
}[] = [
  { id: "todos", label: "Todo el Catálogo", icon: FolderOpen },
  { id: "juegos", label: "Juegos de PC", icon: Gamepad2 },
  { id: "mods", label: "Mods & Shaders", icon: Cpu },
  { id: "herramientas", label: "Herramientas de PC", icon: Wrench },
];

export default function Catalog() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  // Only store custom items added through UI; base items always read directly from catalog.ts
  const [customItems, setCustomItems] = useState<CatalogItem[]>(() => {
    if (typeof window !== "undefined") {
      // Remove obsolete cache key that locked outdated base catalog items
      localStorage.removeItem("sotano_catalog_items");

      const stored = localStorage.getItem("sotano_custom_catalog_items");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore error
        }
      }
    }
    return [];
  });

  const items = useMemo(() => {
    return [...customItems, ...initialCatalogItems];
  }, [customItems]);

  const [search, setSearch] = useState("");
  const [selectedApartado, setSelectedApartado] = useState<"todos" | Apartado>("todos");
  const [selectedGenre, setSelectedGenre] = useState<string>("todos");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync custom added items to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sotano_custom_catalog_items", JSON.stringify(customItems));
      } catch (err) {
        console.error("No se pudo guardar en localStorage:", err);
      }
    }
  }, [customItems]);

  // Handle adding custom items
  const handleAddItem = (newItem: CatalogItem) => {
    setCustomItems((prev) => [newItem, ...prev]);
    setSelectedApartado(newItem.apartado);
    setSelectedGenre(newItem.genre);
  };

  // Get list of genres based on active apartado
  const availableGenres = useMemo(() => {
    const relevantItems =
      selectedApartado === "todos"
        ? items
        : items.filter((it) => it.apartado === selectedApartado);

    const genresSet = new Set<string>();
    relevantItems.forEach((it) => genresSet.add(it.genre));
    return Array.from(genresSet);
  }, [items, selectedApartado]);

  // Filter items based on Search, Apartado, and Genre
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (selectedApartado !== "todos" && item.apartado !== selectedApartado) {
        return false;
      }
      if (selectedGenre !== "todos" && item.genre !== selectedGenre) {
        return false;
      }
      if (!q) return true;

      return (
        item.title.toLowerCase().includes(q) ||
        item.shortDesc.toLowerCase().includes(q) ||
        item.genre.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.developer.toLowerCase().includes(q)
      );
    });
  }, [items, selectedApartado, selectedGenre, search]);

  // Group items by genre for clean ordering
  const itemsByGenre = useMemo(() => {
    const groups: Record<string, CatalogItem[]> = {};
    for (let i = 0; i < filteredItems.length; i++) {
      const it = filteredItems[i];
      if (!groups[it.genre]) {
        groups[it.genre] = [];
      }
      groups[it.genre].push(it);
    }
    return groups;
  }, [filteredItems]);

  const handleApartadoSwitch = (ap: "todos" | Apartado) => {
    setSelectedApartado(ap);
    setSelectedGenre("todos");
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <Header />

      <main className="flex-1 pt-24 md:pt-32 pb-24">
        {/* Hero Banner for Catalog */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div
            className={`relative rounded-3xl p-6 sm:p-10 border shadow-xl overflow-hidden transition-colors ${
              isLight
                ? "bg-white border-zinc-200 shadow-zinc-200/50"
                : "bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800"
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-3 border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                      : "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isLight ? "bg-zinc-900" : "bg-white"
                    }`}
                  />
                  Biblioteca Oficial
                </div>

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

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  <Plus className="size-4" />
                  <span>Agregar Item</span>
                </button>

                <button
                  onClick={() => setFilterDrawerOpen(true)}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border font-medium text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700"
                  }`}
                >
                  <SlidersHorizontal className="size-4" />
                  <span>Géneros &amp; Menú</span>
                  {selectedGenre !== "todos" && (
                    <span
                      className={`size-2 rounded-full ${
                        isLight ? "bg-zinc-950" : "bg-white"
                      }`}
                    />
                  )}
                </button>

                <button
                  onClick={toggleTheme}
                  title="Cambiar tema (claro / oscuro)"
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
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

        {/* Filter Bar & Search Controls (Optimized: No heavy backdrop-filter blur on scroll) */}
        <section className="sticky top-16 md:top-20 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div
            className={`p-3 sm:p-4 rounded-2xl border shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
              isLight
                ? "bg-white/95 border-zinc-200 shadow-zinc-200/40"
                : "bg-zinc-950/95 border-zinc-800"
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
                    onClick={() => handleApartadoSwitch(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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
            </div>

            {/* Search Input & Hamburger Filter Trigger */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none ${
                    isLight ? "text-zinc-400" : "text-zinc-500"
                  }`}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar juegos, mods, herramientas..."
                  className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500"
                  }`}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                      isLight ? "text-zinc-400 hover:text-black" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Hamburger Button for Genres */}
              <button
                onClick={() => setFilterDrawerOpen(true)}
                title="Abrir menú de géneros y apartados"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs shrink-0 ${
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

          {/* Active Filter Tags */}
          {(selectedGenre !== "todos" || search) && (
            <div className="flex items-center gap-2 mt-3 px-2 flex-wrap">
              <span className={`text-xs uppercase tracking-widest ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
                Filtros activos:
              </span>
              {selectedGenre !== "todos" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                    isLight
                      ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                      : "bg-zinc-900 border-zinc-700 text-zinc-200"
                  }`}
                >
                  <span>Género: {selectedGenre}</span>
                  <button
                    onClick={() => setSelectedGenre("todos")}
                    className={isLight ? "hover:text-black text-zinc-500" : "hover:text-white text-zinc-400"}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {search && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                    isLight
                      ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                      : "bg-zinc-900 border-zinc-700 text-zinc-200"
                  }`}
                >
                  <span>Búsqueda: "{search}"</span>
                  <button
                    onClick={() => setSearch("")}
                    className={isLight ? "hover:text-black text-zinc-500" : "hover:text-white text-zinc-400"}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedGenre("todos");
                  setSearch("");
                }}
                className={`text-xs underline underline-offset-2 ml-2 ${
                  isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                Limpiar todo
              </button>
            </div>
          )}
        </section>

        {/* Catalog Items Section: Grouped by Genre */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {Object.keys(itemsByGenre).length === 0 ? (
            /* Empty State */
            <div
              className={`flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-3xl p-8 ${
                isLight
                  ? "border-zinc-300 bg-white shadow-sm"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <div
                className={`size-16 rounded-2xl border flex items-center justify-center mb-4 ${
                  isLight ? "bg-zinc-100 border-zinc-300" : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <Search className={`size-6 ${isLight ? "text-zinc-400" : "text-zinc-500"}`} />
              </div>
              <h3
                className={`text-xl font-bold uppercase tracking-wider mb-2 ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                {items.length === 0 ? "Catálogo limpio" : "No se encontraron elementos"}
              </h3>
              <p
                className={`text-sm max-w-md mb-6 leading-relaxed ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                {items.length === 0
                  ? "No hay juegos, mods ni herramientas añadidas aún. Puedes agregar tus propios elementos con el botón de abajo."
                  : "No hay juegos, mods o herramientas que coincidan con los criterios seleccionados. Prueba con otro término o restablece los filtros."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedGenre("todos");
                    setSelectedApartado("todos");
                  }}
                  className={`px-5 py-2.5 rounded-xl border text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white"
                  }`}
                >
                  Restablecer Filtros
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  Agregar este elemento
                </button>
              </div>
            </div>
          ) : (
            /* Render Grouped by Genre */
            Object.entries(itemsByGenre).map(([genreTitle, genreItems]) => (
              <div key={genreTitle} className="space-y-6">
                {/* Genre Header */}
                <div
                  className={`flex items-center justify-between border-b pb-3 ${
                    isLight ? "border-zinc-300" : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-2.5 rounded-full ${
                        isLight ? "bg-zinc-900" : "bg-white"
                      }`}
                    />
                    <h2
                      className={`text-xl sm:text-2xl font-bold uppercase tracking-wider ${
                        isLight ? "text-zinc-950" : "text-white"
                      }`}
                    >
                      {genreTitle}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        isLight
                          ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {genreItems.length} {genreItems.length === 1 ? "card" : "cards"}
                    </span>
                  </div>

                  <span
                    className={`text-xs uppercase tracking-widest hidden sm:inline ${
                      isLight ? "text-zinc-500" : "text-zinc-500"
                    }`}
                  >
                    Plantillas verificadas
                  </span>
                </div>

                {/* Cards Grid (Optimized: Hardware accelerated GPU CSS transforms, zero JS motion overhead) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {genreItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`group flex flex-col rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1.5 cursor-pointer will-change-transform transform-gpu ${
                        isLight
                          ? "bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-500 text-zinc-100"
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedItem(item);
                      }}
                    >
                      {/* Card Image Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith("/img/SN-tools.jpg")) {
                              target.src = "/img/SN-tools.jpg";
                            }
                          }}
                        />
                        <div
                          className={`absolute inset-0 bg-gradient-to-t opacity-70 pointer-events-none ${
                            isLight
                              ? "from-zinc-900 via-transparent to-transparent"
                              : "from-zinc-950 via-transparent to-transparent"
                          }`}
                        />

                        {/* Top Badges (Solid background instead of heavy backdrop-blur) */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-950/90 text-zinc-200 border border-zinc-700 shadow-sm">
                            {item.apartado === "juegos"
                              ? "Juego"
                              : item.apartado === "mods"
                              ? "Mod"
                              : "Tool"}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white text-zinc-950 shadow-sm">
                            {item.tag}
                          </span>
                        </div>

                        {/* Bottom Tag */}
                        <div className="absolute bottom-2 left-2.5 pointer-events-none">
                          <span className="text-[11px] font-mono text-zinc-300 bg-black/85 px-2 py-0.5 rounded">
                            {item.version}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span
                            className={`text-[11px] uppercase tracking-wider block mb-1 ${
                              isLight ? "text-zinc-500" : "text-zinc-500"
                            }`}
                          >
                            {item.genre}
                          </span>
                          <h3
                            className={`text-base font-bold line-clamp-1 transition-colors ${
                              isLight ? "text-zinc-900 group-hover:text-black" : "text-white group-hover:text-zinc-200"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <p
                            className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                              isLight ? "text-zinc-600" : "text-zinc-400"
                            }`}
                          >
                            {item.shortDesc}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div
                          className={`pt-3 border-t flex items-center justify-between text-xs ${
                            isLight ? "border-zinc-200" : "border-zinc-800/80"
                          }`}
                        >
                          <span
                            className={`flex items-center gap-1.5 font-mono ${
                              isLight ? "text-zinc-600" : "text-zinc-400"
                            }`}
                          >
                            <HardDrive className="size-3.5 text-zinc-400" />
                            {item.size}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform ${
                              isLight ? "text-zinc-900" : "text-white"
                            }`}
                          >
                            <span>Ver info</span>
                            <Download className="size-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Hamburger Menu Drawer for Changing Apartado & Genres */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/75"
            />

            {/* Slide-out Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed top-0 right-0 z-50 h-full w-full max-w-md border-l shadow-2xl p-6 overflow-y-auto flex flex-col font-share transition-colors ${
                isLight
                  ? "bg-white border-zinc-200 text-zinc-900"
                  : "bg-zinc-950 border-zinc-800 text-zinc-100"
              }`}
            >
              <div
                className={`flex items-center justify-between pb-4 border-b mb-6 ${
                  isLight ? "border-zinc-200" : "border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className={`size-5 ${isLight ? "text-zinc-950" : "text-white"}`} />
                  <h3
                    className={`text-lg font-bold uppercase tracking-wider ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    Categorías &amp; Géneros
                  </h3>
                </div>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? "text-zinc-500 hover:text-black hover:bg-zinc-100"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  aria-label="Cerrar filtros"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Section 1: Apartados (Juegos, Mods, Herramientas) */}
              <div className="mb-8">
                <span
                  className={`text-xs uppercase tracking-widest block mb-3 font-semibold ${
                    isLight ? "text-zinc-500" : "text-zinc-500"
                  }`}
                >
                  1. Seleccionar Apartado
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {APARTADOS_CONFIG.map((ap) => {
                    const Icon = ap.icon;
                    const isActive = selectedApartado === ap.id;
                    const count =
                      ap.id === "todos"
                        ? items.length
                        : items.filter((it) => it.apartado === ap.id).length;

                    return (
                      <button
                        key={ap.id}
                        onClick={() => {
                          handleApartadoSwitch(ap.id);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer text-left ${
                          isActive
                            ? isLight
                              ? "bg-zinc-900 text-white border-zinc-900 font-bold shadow-md"
                              : "bg-white text-zinc-950 border-white font-bold shadow-md"
                            : isLight
                            ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                            : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          <span className="text-sm uppercase tracking-wide">{ap.label}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono ${
                            isActive
                              ? isLight
                                ? "bg-white text-zinc-950"
                                : "bg-zinc-950 text-white"
                              : isLight
                              ? "bg-zinc-200 text-zinc-700"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Genres */}
              <div className="flex-1 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs uppercase tracking-widest font-semibold ${
                      isLight ? "text-zinc-500" : "text-zinc-500"
                    }`}
                  >
                    2. Filtrar por Género
                  </span>
                  {selectedGenre !== "todos" && (
                    <button
                      onClick={() => setSelectedGenre("todos")}
                      className={`text-xs underline ${
                        isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Ver todos
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedGenre("todos");
                      setFilterDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer text-left text-xs uppercase tracking-wider ${
                      selectedGenre === "todos"
                        ? isLight
                          ? "bg-zinc-900 text-white font-bold border-zinc-900"
                          : "bg-zinc-100 text-zinc-950 font-bold border-zinc-200"
                        : isLight
                        ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
                        : "bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800/80"
                    }`}
                  >
                    <span>Todos los géneros</span>
                    {selectedGenre === "todos" && <Check className="size-4" />}
                  </button>

                  {availableGenres.map((g) => {
                    const isGenActive = selectedGenre === g;
                    const genreCount = items.filter(
                      (it) =>
                        it.genre === g &&
                        (selectedApartado === "todos" ||
                          it.apartado === selectedApartado),
                    ).length;

                    return (
                      <button
                        key={g}
                        onClick={() => {
                          setSelectedGenre(g);
                          setFilterDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer text-left text-xs uppercase tracking-wider ${
                          isGenActive
                            ? isLight
                              ? "bg-zinc-900 text-white font-bold border-zinc-900 shadow-sm"
                              : "bg-zinc-100 text-zinc-950 font-bold border-zinc-200 shadow-sm"
                            : isLight
                            ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                            : "bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800/80"
                        }`}
                      >
                        <span className="truncate pr-2">{g}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isLight ? "bg-zinc-200 text-zinc-700" : "bg-zinc-800/80 text-zinc-400"
                            }`}
                          >
                            {genreCount}
                          </span>
                          {isGenActive && (
                            <Check
                              className={`size-4 ${isLight ? "text-white" : "text-zinc-950"}`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Buttons */}
              <div
                className={`pt-4 border-t flex items-center gap-3 ${
                  isLight ? "border-zinc-200" : "border-zinc-800"
                }`}
              >
                <button
                  onClick={() => {
                    setSelectedApartado("todos");
                    setSelectedGenre("todos");
                    setSearch("");
                    setFilterDrawerOpen(false);
                  }}
                  className={`w-1/2 py-3 rounded-xl text-xs uppercase tracking-wider border transition-colors text-center cursor-pointer ${
                    isLight
                      ? "text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 border-zinc-300"
                      : "text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-800"
                  }`}
                >
                  Restablecer
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className={`w-1/2 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-colors text-center shadow-md cursor-pointer ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  Aplicar Filtro
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Info & Download Modal (Takes whole screen with animation) */}
      <FullscreenDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
      />

      <Footer />
    </div>
  );
}
