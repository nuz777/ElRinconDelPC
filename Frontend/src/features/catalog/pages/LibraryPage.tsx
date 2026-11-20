import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../../../shared/ui/Navbar";
import Footer from "../../../shared/ui/Footer";
import { useTheme } from "../../../shared/context/useTheme";
import { useAuth } from "../../auth/context/useAuth";
import { ROUTES } from "../../../app/routes";
import type { CatalogItem } from "../domain/catalog.types";
import { catalogService } from "../api/catalog.service";
import CatalogCard from "../components/CatalogCard";
import FullscreenDetailModal from "../components/FullscreenDetailModal";
import { dialog } from "../../../shared/ui/dialog";
import { playProfileSaveSound } from "../../../shared/utils/playDetailOpenSound";

export default function LibraryPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  const displayName = user?.name || user?.username || user?.email || "Mi perfil";
  const avatarSrc = user?.picture;

  const loadFavorites = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [pageData, ids] = await Promise.all([
        catalogService.getFavoriteItems({ page: targetPage, limit: 24, view: "summary" }),
        catalogService.getFavoriteIds(),
      ]);
      setItems(pageData.items);
      setPage(pageData.page);
      setTotalPages(pageData.totalPages);
      setFavoriteIds(new Set(ids));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar tu biblioteca.");
      setItems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites(1);
  }, [loadFavorites]);

  const handleToggleFavorite = async (item: CatalogItem) => {
    if (favoriteBusyId) return;
    setFavoriteBusyId(item.id);
    const isFavorite = favoriteIds.has(item.id);
    try {
      if (isFavorite) {
        await catalogService.removeFavorite(item.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        if (selectedItem?.id === item.id) setSelectedItem(null);
      } else {
        await catalogService.addFavorite(item.id);
        setFavoriteIds((prev) => new Set(prev).add(item.id));
        playProfileSaveSound();
        dialog.toast("success", "Guardado en biblioteca", "Se agregó a tus favoritos.");
      }
    } catch (err) {
      dialog.toast("error", "Favoritos", err instanceof Error ? err.message : "No se pudo actualizar el favorito.");
    } finally {
      setFavoriteBusyId(null);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <Navbar />

      <main className="flex-1 pt-24 md:pt-32 pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div
            className={`border p-6 sm:p-8 ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-950/70 border-zinc-800"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="size-20 sm:size-24 border overflow-hidden bg-zinc-900 shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
                ) : (
                  <div className="size-full grid place-items-center text-zinc-400 text-2xl font-bold">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs uppercase tracking-widest ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                  Biblioteca personal
                </p>
                <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-wide mt-1 ${isLight ? "text-zinc-950" : "text-white"}`}>
                  {displayName}
                </h1>
                <p className={`text-sm mt-2 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                  {user?.email || "Tus favoritos guardados del catálogo"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={ROUTES.CATALOG}
                  className={`px-4 py-2 border text-xs uppercase tracking-wider font-semibold ${
                    isLight ? "bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200" : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  Ir al catálogo
                </Link>
                <Link
                  href={ROUTES.PROFILE}
                  className={`px-4 py-2 border text-xs uppercase tracking-wider font-semibold ${
                    isLight ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black" : "bg-white border-white text-zinc-950 hover:bg-zinc-200"
                  }`}
                >
                  Editar perfil
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bookmark className="size-5" />
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">Favoritos</h2>
              <span className={`text-xs px-2 py-0.5 border ${isLight ? "border-zinc-300 text-zinc-600" : "border-zinc-700 text-zinc-400"}`}>
                {items.length}
              </span>
            </div>
          </div>

          {error ? (
            <div className={`p-8 border border-dashed text-center ${isLight ? "bg-white border-red-300" : "bg-zinc-950/50 border-red-900/50"}`}>
              <p className="text-sm text-red-500 font-semibold mb-4">{error}</p>
              <button
                type="button"
                onClick={() => void loadFavorites(page)}
                className={`px-5 py-2.5 border text-xs uppercase tracking-wider cursor-pointer ${
                  isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-950 border-white"
                }`}
              >
                Reintentar
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className={`border overflow-hidden animate-pulse ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"}`}>
                  <div className={`aspect-[3/4] ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                  <div className="p-4 space-y-3">
                    <div className={`h-3 w-1/3 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                    <div className={`h-4 w-3/4 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={`p-10 border border-dashed text-center ${isLight ? "bg-white border-zinc-300" : "bg-zinc-950/50 border-zinc-800"}`}>
              <Bookmark className={`size-10 mx-auto mb-3 ${isLight ? "text-zinc-400" : "text-zinc-600"}`} />
              <h3 className="text-lg font-bold uppercase tracking-wider mb-2">Aún no tienes favoritos</h3>
              <p className={`text-sm mb-5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                Marca ítems del catálogo con el corazón para verlos aquí.
              </p>
              <Link
                href={ROUTES.CATALOG}
                className={`inline-flex px-5 py-2.5 border text-xs uppercase tracking-wider font-semibold ${
                  isLight ? "bg-zinc-900 border-zinc-900 text-white hover:bg-black" : "bg-white border-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {items.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    isLight={isLight}
                    onSelect={setSelectedItem}
                    isFavorite={favoriteIds.has(item.id)}
                    onToggleFavorite={(target) => void handleToggleFavorite(target)}
                    favoriteDisabled={favoriteBusyId === item.id}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className={`mt-8 flex items-center justify-between pt-6 border-t ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      const next = Math.max(1, page - 1);
                      setPage(next);
                      void loadFavorites(next);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 border text-xs uppercase tracking-wider font-semibold disabled:opacity-40 ${
                      isLight ? "bg-white border-zinc-300 text-zinc-800" : "bg-zinc-900 border-zinc-700 text-zinc-200"
                    }`}
                  >
                    <ChevronLeft className="size-4" /> Anterior
                  </button>
                  <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Página {page} de {totalPages}</span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const next = Math.min(totalPages, page + 1);
                      setPage(next);
                      void loadFavorites(next);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 border text-xs uppercase tracking-wider font-semibold disabled:opacity-40 ${
                      isLight ? "bg-white border-zinc-300 text-zinc-800" : "bg-zinc-900 border-zinc-700 text-zinc-200"
                    }`}
                  >
                    Siguiente <ChevronRight className="size-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      <FullscreenDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        isFavorite={selectedItem ? favoriteIds.has(selectedItem.id) : false}
        onToggleFavorite={selectedItem ? (item) => void handleToggleFavorite(item) : undefined}
        favoriteDisabled={selectedItem ? favoriteBusyId === selectedItem.id : false}
      />

      <Footer />
    </div>
  );
}
