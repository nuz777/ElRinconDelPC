import { useEffect, useMemo, useRef, useState } from "react";
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
    coverFraming: item.coverFraming ?? null,
    bannerUrl: item.bannerImg,
    bannerFraming: item.bannerFraming ?? null,
    // La API solo acepta URLs http(s): sin enlace se omite (antes se mandaba "#" y la API rechazaba el ítem)
    downloadUrl: /^https?:\/\//i.test(item.downloadLinks[0]?.url ?? "") ? item.downloadLinks[0].url : undefined,
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

const PUBLIC_SECTIONS: CatalogSectionApi[] = [
  "JUEGOS",
  "MODS",
  "HERRAMIENTAS",
  "ROMS",
];

async function fetchAllPagesForSection(
  section: CatalogSectionApi,
  genre?: string,
  search?: string,
): Promise<CatalogItem[]> {
  const firstPage = await catalogService.getPaginatedItems({
    section,
    genre,
    search,
    page: 1,
    limit: 100,
    view: "summary",
  });
  if (firstPage.totalPages <= 1) {
    return firstPage.items;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, idx) =>
      catalogService.getPaginatedItems({
        section,
        genre,
        search,
        page: idx + 2,
        limit: 100,
        view: "summary",
      }),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((p) => p.items);
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
  const [publicIndexItems, setPublicIndexItems] = useState<CatalogItem[]>([]);

  const section: CatalogSectionApi | undefined =
    activeView.apartado === "todos" ? undefined : mapApartadoToSection(activeView.apartado);

  const isRomView = activeView.apartado === "roms";
  const isAllView = activeView.apartado === "todos";
  const limit = isRomView || isAllView ? 100 : 24;
  const genreParam = !isRomView && selectedGenre !== "todos" ? selectedGenre : undefined;

  const queryKey = JSON.stringify({
    section: section ?? "ALL",
    genre: genreParam ?? "ALL",
    search: debouncedSearch,
    page: isRomView || isAllView ? 1 : page,
    limit,
    reloadNonce,
  });

  useEffect(() => {
    if (isAdultBlocked) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        if (!section) {
          // En "Todo el Catálogo" traemos TODOS los ítems públicos (JUEGOS, MODS, HERRAMIENTAS, ROMS)
          // excluyendo siempre +18 (ADULTOS).
          const sectionLists = await Promise.all(
            PUBLIC_SECTIONS.map((sec) =>
              fetchAllPagesForSection(sec, genreParam, debouncedSearch || undefined),
            ),
          );
          if (cancelled) return;
          const mergedItems = sectionLists.flat();
          if (!genreParam && !debouncedSearch) {
            setPublicIndexItems(mergedItems);
          }
          setSnapshot({
            queryKey,
            items: mergedItems,
            total: mergedItems.length,
            page: 1,
            totalPages: 1,
            error: null,
          });
          return;
        }

        const res = await catalogService.getPaginatedItems({
          section,
          genre: genreParam,
          search: debouncedSearch || undefined,
          page: isRomView ? 1 : page,
          limit,
          view: "summary",
        });
        if (cancelled) return;
        setSnapshot({
          queryKey,
          items: res.items,
          total: res.total,
          page: res.page,
          totalPages: res.totalPages,
          error: null,
        });
      } catch (err) {
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
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [isAdultBlocked, section, isAllView, genreParam, debouncedSearch, isRomView, page, limit, queryKey]);

  // Mantener cargada la base de ítems públicos (sin +18) para los conteos de ROMs,
  // conteos del drawer de filtros y autocompletado incluso desde otras pestañas.
  // Solo depende de reloadNonce/section: el índice es global (sin filtros) y no debe
  // refetchearse al cambiar búsqueda/género para evitar ráfagas y 429.
  const indexLoadedForReload = useRef(-1);
  useEffect(() => {
    const needsGlobalIndex = Boolean(section) || Boolean(genreParam) || Boolean(debouncedSearch);
    if (!needsGlobalIndex) {
      // Vista "todos" sin filtros: loadData ya llena publicIndexItems.
      indexLoadedForReload.current = reloadNonce;
      return;
    }
    if (indexLoadedForReload.current === reloadNonce) return;
    let cancelled = false;
    Promise.all(PUBLIC_SECTIONS.map((sec) => fetchAllPagesForSection(sec)))
      .then((lists) => {
        if (!cancelled) {
          setPublicIndexItems(lists.flat());
          indexLoadedForReload.current = reloadNonce;
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reloadNonce, section, genreParam, debouncedSearch]);

  const rawItems = useMemo(() => snapshot?.items ?? [], [snapshot]);
  const indexSource = useMemo(
    () => (publicIndexItems.length > 0 ? publicIndexItems : rawItems),
    [publicIndexItems, rawItems],
  );

  const romCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of indexSource) {
      if (it.apartado === "roms" && it.brand && it.console) {
        const key = romCountKey(it.brand, it.console);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [indexSource]);

  const totalRoms = useMemo(
    () => indexSource.filter((it) => it.apartado === "roms").length,
    [indexSource],
  );

  const allKnownItems = useMemo(() => {
    if (publicIndexItems.length === 0) return rawItems;
    const byId = new Map<string, CatalogItem>();
    for (const it of publicIndexItems) byId.set(it.id, it);
    for (const it of rawItems) byId.set(it.id, it);
    return Array.from(byId.values());
  }, [publicIndexItems, rawItems]);

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
    setPublicIndexItems((prev) =>
      prev.map((it) => (it.id === saved.id ? saved : it)),
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
    setPublicIndexItems((prev) => prev.filter((it) => it.id !== item.id));
  };

  const isLoading = !isAdultBlocked && snapshot?.queryKey !== queryKey;

  return {
    items: visibleItems,
    allFetchedItems: allKnownItems,
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
