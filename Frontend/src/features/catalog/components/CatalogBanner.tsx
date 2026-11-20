import { FileJson, Moon, Plus, Settings, SlidersHorizontal, Sun, UserCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ROUTES } from "../../../app/routes";
import { useAuth } from "../../auth/context/useAuth";
import { playProfileSettingsOpenSound } from "../../../shared/utils/playDetailOpenSound";

interface CatalogBannerProps {
  isLight: boolean;
  isAdmin: boolean;
  hasActiveGenreFilter: boolean;
  /** Texto del botón de subir según el apartado actual (ej. "Subir a +18"). */
  addLabel?: string;
  onOpenAdd: () => void;
  onOpenBulkJson: () => void;
  onOpenFilterDrawer: () => void;
  onToggleTheme: () => void;
}

export default function CatalogBanner({
  isLight,
  isAdmin,
  hasActiveGenreFilter,
  addLabel = "Agregar Item",
  onOpenAdd,
  onOpenBulkJson,
  onOpenFilterDrawer,
  onToggleTheme,
}: CatalogBannerProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!settingsOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <div
        className={`relative  p-6 sm:p-10 border shadow-xl overflow-visible transition-colors ${
          isLight
            ? "bg-white border-zinc-200 shadow-zinc-200/50"
            : "bg-gradient-to-b from-zinc-900/90 to-zinc-950 border-zinc-800"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end lg:flex-nowrap shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onOpenAdd}
                  className={`inline-flex items-center gap-2 px-5 py-3  font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                    isLight
                      ? "bg-zinc-900 text-white hover:bg-black"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  <Plus className="size-4" />
                  <span>{addLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenBulkJson}
                  className="inline-flex items-center gap-2 px-4 py-3  font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  title="Cargar masivamente juegos o elementos desde un archivo JSON"
                >
                  <FileJson className="size-4" />
                  <span className="hidden sm:inline">Carga Masiva (JSON)</span>
                  <span className="sm:hidden">JSON</span>
                </button>
              </>
            )}

            <button
              type="button"
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

            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                title="Ajustes"
                aria-label="Abrir ajustes"
                aria-expanded={settingsOpen}
                aria-haspopup="menu"
                className={`p-3  border transition-colors cursor-pointer flex items-center justify-center ${
                  isLight
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700"
                }`}
              >
                <Settings size={18} />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`absolute right-0 mt-2 w-56 border shadow-lg z-50 overflow-hidden origin-top-right ${
                      isLight
                        ? "bg-white border-zinc-200 text-zinc-900"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100"
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onToggleTheme}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-zinc-800/60"
                      }`}
                    >
                      {isLight ? <Moon size={16} /> : <Sun size={16} />}
                      <span>{isLight ? "Modo oscuro" : "Modo claro"}</span>
                    </button>
                    {isAuthenticated && (
                      <Link
                        href={ROUTES.PROFILE}
                        role="menuitem"
                        onClick={() => {
                          playProfileSettingsOpenSound();
                          setSettingsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider transition-colors border-t ${
                          isLight
                            ? "hover:bg-zinc-50 border-zinc-200"
                            : "hover:bg-zinc-800/60 border-zinc-800"
                        }`}
                      >
                        <UserCircle size={16} />
                        <span>Editar perfil</span>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
