import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Joystick, SlidersHorizontal, X } from "lucide-react";
import { APARTADOS_CONFIG } from "../domain/catalogViews";
import type { Apartado, CatalogItem } from "../domain/catalog.types";
import type { CatalogView } from "../utils/catalogUrl";
import RomBrandMenu from "./RomBrandMenu";
import { playCategorySelectSound } from "../../../shared/utils/playDetailOpenSound";

interface CatalogFilterDrawerProps {
  isOpen: boolean;
  activeView: CatalogView;
  selectedGenre: string;
  availableGenres: string[];
  allItems: CatalogItem[];
  romCounts: Record<string, number>;
  totalRoms: number;
  isLight: boolean;
  onClose: () => void;
  onSelectApartado: (apartado: "todos" | Exclude<Apartado, "roms">) => void;
  onSelectGenre: (genre: string) => void;
  onSelectRomConsole: (brand: string, consoleName: string) => void;
  onResetAll: () => void;
}

export default function CatalogFilterDrawer({
  isOpen,
  activeView,
  selectedGenre,
  availableGenres,
  allItems,
  romCounts,
  totalRoms,
  isLight,
  onClose,
  onSelectApartado,
  onSelectGenre,
  onSelectRomConsole,
  onResetAll,
}: CatalogFilterDrawerProps) {
  const [drawerRomsOpen, setDrawerRomsOpen] = useState(false);

  const selectedApartado = activeView.apartado;
  const romFilter = activeView.apartado === "roms" ? activeView : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75"
          />

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
                onClick={onClose}
                className={`p-1.5  transition-colors cursor-pointer ${
                  isLight
                    ? "text-zinc-500 hover:text-black hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                aria-label="Cerrar filtros"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest block mb-3 font-semibold text-zinc-500">
                1. Seleccionar Apartado
              </span>
              <div className="grid grid-cols-1 gap-2">
                {APARTADOS_CONFIG.map((ap) => {
                  const Icon = ap.icon;
                  const isActive = selectedApartado === ap.id;
                  const count =
                    ap.id === "todos"
                      ? allItems.filter((it) => it.apartado !== "adultos").length
                      : allItems.filter((it) => it.apartado === ap.id).length;

                  return (
                    <button
                      key={ap.id}
                      onClick={() => {
                        playCategorySelectSound();
                        onSelectApartado(ap.id);
                      }}
                      className={`flex items-center justify-between p-3.5  border transition-colors cursor-pointer text-left ${
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
                        className={`text-xs px-2 py-0.5  font-mono ${
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

                <button
                  type="button"
                  aria-expanded={drawerRomsOpen || selectedApartado === "roms"}
                  onClick={() => setDrawerRomsOpen((open) => !open)}
                  className={`flex items-center justify-between p-3.5  border transition-colors cursor-pointer text-left ${
                    selectedApartado === "roms"
                      ? isLight
                        ? "bg-zinc-900 text-white border-zinc-900 font-bold shadow-md"
                        : "bg-white text-zinc-950 border-white font-bold shadow-md"
                      : isLight
                        ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200"
                        : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Joystick className="size-4" />
                    <span className="text-sm uppercase tracking-wide">
                      {romFilter ? `ROMs · ${romFilter.console}` : "ROMs"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5  font-mono ${
                        selectedApartado === "roms"
                          ? isLight
                            ? "bg-white text-zinc-950"
                            : "bg-zinc-950 text-white"
                          : isLight
                            ? "bg-zinc-200 text-zinc-700"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {totalRoms}
                    </span>
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        drawerRomsOpen || selectedApartado === "roms" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {(drawerRomsOpen || selectedApartado === "roms") && (
                  <div
                    className={`p-3  border ${
                      isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
                    }`}
                  >
                    <RomBrandMenu
                      variant="drawer"
                      isLight={isLight}
                      counts={romCounts}
                      activeBrand={romFilter?.brand}
                      activeConsole={romFilter?.console}
                      onSelect={(brand, consoleName) => {
                        playCategorySelectSound();
                        onSelectRomConsole(brand, consoleName);
                        onClose();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-zinc-500">
                  2. Filtrar por Género
                </span>
                {selectedGenre !== "todos" && (
                  <button
                    onClick={() => onSelectGenre("todos")}
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
                    playCategorySelectSound();
                    onSelectGenre("todos");
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3  border transition-colors cursor-pointer text-left text-xs uppercase tracking-wider ${
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
                  const genreCount = allItems.filter(
                    (it) =>
                      it.genre === g &&
                      (selectedApartado === "todos" || it.apartado === selectedApartado),
                  ).length;

                  return (
                    <button
                      key={g}
                      onClick={() => {
                        playCategorySelectSound();
                        onSelectGenre(g);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3  border transition-colors cursor-pointer text-left text-xs uppercase tracking-wider ${
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
                          className={`text-[10px] font-mono px-1.5 py-0.5  ${
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

            <div
              className={`pt-4 border-t flex items-center gap-3 ${
                isLight ? "border-zinc-200" : "border-zinc-800"
              }`}
            >
              <button
                onClick={() => {
                  onResetAll();
                  onClose();
                }}
                className={`w-1/2 py-3  text-xs uppercase tracking-wider border transition-colors text-center cursor-pointer ${
                  isLight
                    ? "text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 border-zinc-300"
                    : "text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-800"
                }`}
              >
                Restablecer
              </button>
              <button
                onClick={onClose}
                className={`w-1/2 py-3  text-xs uppercase tracking-wider font-bold transition-colors text-center shadow-md cursor-pointer ${
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
  );
}
