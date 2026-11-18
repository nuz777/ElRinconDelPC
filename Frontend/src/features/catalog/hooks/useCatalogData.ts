import { useEffect, useMemo, useState } from "react";
import { cleanDescription } from "../../../shared/utils/cleanDescription";
import {
  catalogService,
  mapApartadoToSection,
  type CatalogSectionApi,
  type CreateCatalogItemPayload,
} from "../api/catalog.service";
import type { CatalogItem } from "../domain/catalog.types";
import { NO_STABLE_EMULATOR, romCountKey } from "../domain/romPlatforms";
import type { CatalogView } from "../utils/catalogUrl";

interface UseCatalogDataParams {
  activeView: CatalogView;
  selectedGenre: string;
  debouncedSearch: string;
  page: number;
  isAdultBlocked: boolean;
}

interface CatalogQuerySnapshot {
  queryKey: string;
  items: CatalogItem[];
  total: number;
  page: number;
  totalPages: number;
  error: string | null;
}

export function buildCatalogPayload(item: CatalogItem): CreateCatalogItemPayload {
  const isAdult = item.apartado === "adultos";
  const isRom = item.apartado === "roms";
  return {
    section: mapApartadoToSection(item.apartado),
    title: item.title,
    genre: item.genre,
    size: item.size,
    version: item.version,
    badge: item.tag,
    coverUrl: item.img,
    bannerUrl: item.bannerImg,
    downloadUrl: item.downloadLinks[0]?.url || "#",
    developer: item.developer,
    shortDescription: cleanDescription(item.shortDesc),
    ...(isAdult ? {} : { minimumRequirements: item.requirements }),
    ...(isRom
      ? {
          brand: item.brand ?? undefined,
          console: item.console ?? undefined,
          emulator: item.emulator ?? NO_STABLE_EMULATOR,
        }
      : {}),
  };
}

export function useCatalogData({
  activeView,
  selectedGenre,
  debouncedSearch,
  page,
  isAdultBlocked,
}: UseCatalogDataParams) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<CatalogQuerySnapshot | null>(null);

  const section: CatalogSectionApi | undefined =
    activeView.apartado === "todos" ? undefined : mapApartadoToSection(activeView.apartado);

  const isRomView = activeView.apartado === "roms";
  const limit = isRomView ? 100 : 24;
  const genreParam = !isRomView && selectedGenre !== "todos" ? selectedGenre : undefined;

  const queryKey = JSON.stringify({
    section: section ?? "ALL",
    genre: genreParam ?? "ALL",
    search: debouncedSearch,
    page: isRomView ? 1 : page,
    limit,
    reloadNonce,
  });

  useEffect(() => {
    if (isAdultBlocked) return;

    let cancelled = false;
    catalogService
      .getPaginatedItems({
        section,
        genre: genreParam,
        search: debouncedSearch || undefined,
        page: isRomView ? 1 : page,
        limit,
        view: "summary",
      })
      .then((res) => {
        if (cancelled) return;
        setSnapshot({
          queryKey,
          items: res.items,
          total: res.total,
          page: res.page,
          totalPages: res.totalPages,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setSnapshot({
          queryKey,
          items: [],
          total: 0,
          page: 1,
          totalPages: 1,
          error:
            err instanceof Error
              ? err.message
              : "No se pudo conectar con la API del catálogo.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isAdultBlocked, section, genreParam, debouncedSearch, isRomView, page, limit, queryKey]);

  const rawItems = useMemo(() => snapshot?.items ?? [], [snapshot]);

  const romCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of rawItems) {
      if (it.apartado === "roms" && it.brand && it.console) {
        const key = romCountKey(it.brand, it.console);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [rawItems]);

  const totalRoms = useMemo(
    () => rawItems.filter((it) => it.apartado === "roms").length,
    [rawItems],
  );

  const visibleItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (item.apartado === "adultos" && activeView.apartado !== "adultos") {
        return false;
      }
      if (activeView.apartado === "roms") {
        if (item.brand !== activeView.brand || item.console !== activeView.console) {
          return false;
        }
        if (selectedGenre !== "todos" && item.genre !== selectedGenre) {
          return false;
        }
      }
      return true;
    });
  }, [rawItems, activeView, selectedGenre]);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const it of rawItems) {
      if (it.apartado === "adultos" && activeView.apartado !== "adultos") continue;
      if (
        activeView.apartado === "roms" &&
        (it.brand !== activeView.brand || it.console !== activeView.console)
      ) {
        continue;
      }
      if (it.genre) set.add(it.genre);
    }
    return Array.from(set);
  }, [rawItems, activeView]);

  const itemsByGenre = useMemo(() => {
    const groups: Record<string, CatalogItem[]> = {};
    for (const it of visibleItems) {
      if (!groups[it.genre]) {
        groups[it.genre] = [];
      }
      groups[it.genre].push(it);
    }
    return groups;
  }, [visibleItems]);

  const reload = () => setReloadNonce((n) => n + 1);

  const createItem = async (newItem: CatalogItem) => {
    const created = await catalogService.createItem(buildCatalogPayload(newItem));
    reload();
    return created;
  };

  const editItem = async (updatedItem: CatalogItem) => {
    const saved = await catalogService.updateItem(updatedItem.id, buildCatalogPayload(updatedItem));
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) => (it.id === saved.id ? saved : it)),
          }
        : prev,
    );
    return saved;
  };

  const deleteItem = async (item: CatalogItem) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      item.id,
    );
    if (isUuid) {
      await catalogService.deleteItem(item.id);
    }
    setSnapshot((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((it) => it.id !== item.id),
            total: Math.max(0, prev.total - 1),
          }
        : prev,
    );
  };

  const isLoading = !isAdultBlocked && snapshot?.queryKey !== queryKey;

  return {
    items: visibleItems,
    allFetchedItems: rawItems,
    itemsByGenre,
    availableGenres,
    romCounts,
    totalRoms,
    total: snapshot?.total ?? 0,
    totalPages: snapshot?.totalPages ?? 1,
    isLoading,
    error: snapshot?.queryKey === queryKey ? snapshot.error : null,
    reload,
    createItem,
    editItem,
    deleteItem,
  };
}
