import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Navbar from "../../../shared/ui/Navbar";
import Footer from "../../../shared/ui/Footer";
import { useTheme } from "../../../shared/context/useTheme";
import { useAuth } from "../../auth/context/useAuth";
import { NativeBannerAd } from "../../ads/NativeBannerAd";
import type { CatalogItem } from "../domain/catalog.types";
import { catalogService } from "../api/catalog.service";
import { useCatalogFilter } from "../hooks/useCatalogFilter";
import { useCatalogData } from "../hooks/useCatalogData";
import CatalogBanner from "../components/CatalogBanner";
import CatalogToolbar from "../components/CatalogToolbar";
import CatalogCard from "../components/CatalogCard";
import CatalogFilterDrawer from "../components/CatalogFilterDrawer";
import FullscreenDetailModal from "../components/FullscreenDetailModal";
import ItemFormModal from "../components/ItemFormModal";
import BulkJsonImportModal from "../components/BulkJsonImportModal";
import AgeGateModal from "../components/AgeGateModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function CatalogPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const filter = useCatalogFilter();
  const data = useCatalogData({
    activeView: filter.view,
    selectedGenre: filter.selectedGenre,
    debouncedSearch: filter.debouncedSearch,
    page: filter.page,
    isAdultBlocked: filter.showAgeGate,
  });

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkJsonModalOpen, setIsBulkJsonModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CatalogItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [fetchedItem, setFetchedItem] = useState<CatalogItem | null>(null);
  const [localItem, setLocalItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sotano_catalog_items");
      localStorage.removeItem("sotano_custom_catalog_items");
    }
  }, []);

  const detailCode = filter.detailRoute ? filter.routeCode : null;
  const itemFromList = detailCode
    ? data.allFetchedItems.find((it) => it.publicCode === detailCode) ?? null
    : null;

  useEffect(() => {
    if (!filter.detailRoute || !detailCode) return;
    if (itemFromList || fetchedItem?.publicCode === detailCode) return;

    let cancelled = false;
    catalogService
      .getItemByCode(detailCode)
      .then((found) => {
        if (!cancelled && found) {
          setFetchedItem(found);
        }
      })
      .catch((err) => {
        console.error("No se pudo cargar el ítem del enlace:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [filter.detailRoute, detailCode, itemFromList, fetchedItem]);

  const selectedItem: CatalogItem | null = filter.detailRoute
    ? (itemFromList ?? (fetchedItem?.publicCode === detailCode ? fetchedItem : null))
    : localItem;

  const openItem = (item: CatalogItem) => {
    if (!filter.openDetailUrl(item)) {
      setLocalItem(item);
    }
  };

  const closeItem = () => {
    setLocalItem(null);
    filter.closeDetailUrl();
  };

  const handleOpenEdit = async (item: CatalogItem) => {
    try {
      const fullItem = item.publicCode
        ? await catalogService.getItemByCode(item.publicCode)
        : await catalogService.getItemById(item.id);
      setItemToEdit(fullItem ?? item);
    } catch {
      setItemToEdit(item);
    }
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = async (item: CatalogItem) => {
    if (!isAdmin) return;
    try {
      setIsDeleting(true);
      await data.deleteItem(item);
      if (selectedItem?.id === item.id) {
        closeItem();
      }
      setItemToDelete(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Hubo un error al eliminar el ítem del servidor.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const isRomView = filter.view.apartado === "roms";

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <Navbar />

      <main className="flex-1 pt-24 md:pt-32 pb-24">
        <CatalogBanner
          isLight={isLight}
          isAdmin={isAdmin}
          hasActiveGenreFilter={filter.selectedGenre !== "todos"}
          onOpenAdd={() => {
            setItemToEdit(null);
            setIsAddModalOpen(true);
          }}
          onOpenBulkJson={() => setIsBulkJsonModalOpen(true)}
          onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <CatalogToolbar
          activeView={filter.view}
          selectedGenre={filter.selectedGenre}
          searchQuery={filter.searchQuery}
          debouncedSearch={filter.debouncedSearch}
          isSearchActive={filter.isSearchActive}
          allItemsForSuggestions={data.allFetchedItems}
          ageVerified={filter.ageVerified}
          romCounts={data.romCounts}
          totalRoms={data.totalRoms}
          isLight={isLight}
          isModalBlockingRomMenu={isAddModalOpen || filterDrawerOpen || Boolean(selectedItem)}
          onSelectApartado={filter.handleApartadoSwitch}
          onSelectRomConsole={filter.handleRomConsoleSelect}
          onSelectItemFromSuggestion={openItem}
          onSearchChange={filter.setSearchQuery}
          onClearGenre={() => filter.setSelectedGenre("todos")}
          onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
        />

        {/* Catalog Items Section */}
        <section
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 transition-all ${
            filter.showAgeGate ? "blur-xl pointer-events-none select-none opacity-30" : ""
          }`}
        >
          {data.error ? (
            <div
              className={`flex flex-col items-center justify-center py-20 text-center border border-dashed  p-8 ${
                isLight ? "border-red-300 bg-white" : "border-red-900/50 bg-zinc-950/50"
              }`}
            >
              <p className="text-sm text-red-500 font-semibold mb-4">{data.error}</p>
              <button
                type="button"
                onClick={data.reload}
                className={`px-5 py-2.5  border text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                  isLight
                    ? "bg-zinc-900 text-white border-zinc-900 hover:bg-black"
                    : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
                }`}
              >
                Reintentar conexión
              </button>
            </div>
          ) : data.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`  border overflow-hidden animate-pulse ${
                    isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <div
                    className={`aspect-[3/4] w-full ${
                      isLight ? "bg-zinc-200" : "bg-zinc-800"
                    }`}
                  />
                  <div className="p-4 space-y-3">
                    <div className={`h-3 w-1/3  ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                    <div className={`h-4 w-3/4  ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                    <div className={`h-3 w-full  ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-24 text-center border border-dashed  p-8 ${
                isLight ? "border-zinc-300 bg-white shadow-sm" : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <div
                className={`size-16  border flex items-center justify-center mb-4 ${
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
                {data.allFetchedItems.length === 0
                  ? "Catálogo limpio"
                  : "No se encontraron elementos"}
              </h3>
              <p
                className={`text-sm max-w-md mb-6 leading-relaxed ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                {data.allFetchedItems.length === 0
                  ? "No hay juegos, mods ni herramientas añadidas aún. Puedes agregar tus propios elementos con el botón de abajo."
                  : "No hay juegos, mods o herramientas que coincidan con los criterios seleccionados. Prueba con otro término o restablece los filtros."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    filter.setSearchQuery("");
                    filter.setSelectedGenre("todos");
                    filter.goToView({ apartado: "todos" });
                  }}
                  className={`px-5 py-2.5  border text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white"
                  }`}
                >
                  Restablecer Filtros
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    className={`px-5 py-2.5  font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      isLight
                        ? "bg-zinc-900 text-white hover:bg-black"
                        : "bg-white text-zinc-950 hover:bg-zinc-200"
                    }`}
                  >
                    Agregar este elemento
                  </button>
                )}
              </div>
            </div>
          ) : filter.isSearchActive ? (
            <div className="space-y-6">
              <div
                className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? "border-zinc-300" : "border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-2.5  ${isLight ? "bg-zinc-900" : "bg-white"}`}
                  />
                  <h2
                    className={`text-xl sm:text-2xl font-bold uppercase tracking-wider ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    Resultados de búsqueda
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5  border ${
                      isLight
                        ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {data.items.length} {data.items.length === 1 ? "resultado" : "resultados"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {data.items.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    isLight={isLight}
                    isAdmin={isAdmin}
                    onSelect={openItem}
                    onEdit={(target) => void handleOpenEdit(target)}
                    onDelete={(target) => setItemToDelete(target)}
                  />
                ))}
              </div>
            </div>
          ) : (
            Object.entries(data.itemsByGenre).map(([genreTitle, genreItems]) => (
              <div key={genreTitle} className="space-y-6 scroll-mt-28">
                <div
                  className={`flex items-center justify-between border-b pb-3 ${
                    isLight ? "border-zinc-300" : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-2.5  ${isLight ? "bg-zinc-900" : "bg-white"}`}
                    />
                    <h2
                      className={`text-xl sm:text-2xl font-bold uppercase tracking-wider ${
                        isLight ? "text-zinc-950" : "text-white"
                      }`}
                    >
                      {genreTitle}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5  border ${
                        isLight
                          ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {genreItems.length} {genreItems.length === 1 ? "card" : "cards"}
                    </span>
                  </div>

                  <span className="text-xs uppercase tracking-widest hidden sm:inline text-zinc-500">
                    Plantillas verificadas
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {genreItems.map((item) => (
                    <CatalogCard
                      key={item.id}
                      item={item}
                      isLight={isLight}
                      isAdmin={isAdmin}
                      onSelect={openItem}
                      onEdit={(target) => void handleOpenEdit(target)}
                      onDelete={(target) => setItemToDelete(target)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Paginación del servidor */}
          {!isRomView && data.totalPages > 1 && !data.isLoading && (
            <nav
              aria-label="Paginación del catálogo"
              className={`flex items-center justify-between pt-6 border-t ${
                isLight ? "border-zinc-200" : "border-zinc-800"
              }`}
            >
              <button
                type="button"
                disabled={filter.page <= 1}
                onClick={() => {
                  filter.setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2  border text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                  isLight
                    ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                    : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <ChevronLeft className="size-4" />
                <span>Anterior</span>
              </button>

              <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                Página {filter.page} de {data.totalPages}
              </span>

              <button
                type="button"
                disabled={filter.page >= data.totalPages}
                onClick={() => {
                  filter.setPage((p) => Math.min(data.totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2  border text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                  isLight
                    ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                    : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </section>

        {!selectedItem && <NativeBannerAd />}
      </main>

      <CatalogFilterDrawer
        isOpen={filterDrawerOpen}
        activeView={filter.view}
        selectedGenre={filter.selectedGenre}
        availableGenres={data.availableGenres}
        allItems={data.allFetchedItems}
        romCounts={data.romCounts}
        totalRoms={data.totalRoms}
        isLight={isLight}
        onClose={() => setFilterDrawerOpen(false)}
        onSelectApartado={filter.handleApartadoSwitch}
        onSelectGenre={filter.setSelectedGenre}
        onSelectRomConsole={(brand, consoleName) => {
          filter.handleRomConsoleSelect(brand, consoleName);
          setFilterDrawerOpen(false);
        }}
        onResetAll={() => {
          filter.setSelectedGenre("todos");
          filter.setSearchQuery("");
          filter.goToView({ apartado: "todos" });
        }}
      />

      <FullscreenDetailModal
        item={filter.showAgeGate ? null : selectedItem}
        onClose={closeItem}
        isAdmin={isAdmin}
        disableEscape={isAddModalOpen || Boolean(itemToDelete) || filter.showAgeGate}
        onDelete={(item) => setItemToDelete(item)}
        onEdit={(item) => void handleOpenEdit(item)}
        onNavigateRoot={filter.navigateFromBreadcrumbRoot}
        onNavigateApartado={filter.navigateFromBreadcrumbApartado}
        onNavigateGenre={filter.navigateFromBreadcrumbGenre}
      />

      <AgeGateModal
        isOpen={filter.showAgeGate}
        isLight={isLight}
        onConfirm={filter.handleConfirmAge}
        onCancel={() => {
          setLocalItem(null);
          filter.handleRejectAge();
        }}
      />

      {isAdmin && (
        <ItemFormModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setItemToEdit(null);
          }}
          onAddItem={async (newItem) => {
            await data.createItem(newItem);
          }}
          onEditItem={async (updatedItem) => {
            const saved = await data.editItem(updatedItem);
            if (fetchedItem?.id === saved.id) setFetchedItem(saved);
            if (localItem?.id === saved.id) setLocalItem(saved);
          }}
          onBulkImported={() => data.reload()}
          itemToEdit={itemToEdit}
        />
      )}

      {isAdmin && (
        <BulkJsonImportModal
          isOpen={isBulkJsonModalOpen}
          onClose={() => setIsBulkJsonModalOpen(false)}
          onItemsImported={() => data.reload()}
        />
      )}

      {isAdmin && (
        <DeleteConfirmModal
          item={itemToDelete}
          isDeleting={isDeleting}
          isLight={isLight}
          onConfirm={() => {
            if (itemToDelete) void handleDeleteItem(itemToDelete);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      <Footer />
    </div>
  );
}
