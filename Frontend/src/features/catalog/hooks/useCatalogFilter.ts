import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import type { Apartado, CatalogItem } from "../domain/catalog.types";
import {
  buildItemPath,
  buildViewPath,
  parseCatalogRoute,
  viewForItem,
  type CatalogRoute,
  type CatalogView,
} from "../utils/catalogUrl";

const AGE_STORAGE_KEY = "sotano_age_verified";

function readInitialAgeConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(AGE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useCatalogFilter() {
  const [location, navigate] = useLocation();
  const rawSearch = useSearch();

  const urlSearchQuery = new URLSearchParams(rawSearch).get("search") ?? "";
  const [searchState, setSearchState] = useState<{ syncUrl: string; value: string }>({
    syncUrl: urlSearchQuery,
    value: urlSearchQuery,
  });

  const searchQuery =
    searchState.syncUrl === urlSearchQuery ? searchState.value : urlSearchQuery;

  const setSearchQuery = (next: string) => {
    setSearchState({ syncUrl: urlSearchQuery, value: next });
  };

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery.trim());
  const [genreFilter, setGenreFilter] = useState<{ viewPath: string; genre: string }>({
    viewPath: "",
    genre: "todos",
  });
  const [page, setPage] = useState(1);
  const [ageVerified, setAgeVerified] = useState(readInitialAgeConsent);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const parsedRoute = parseCatalogRoute(location);
  const isAdminCatalogPath = location === "/publish" || location === "/dashboard/crear";
  const route: CatalogRoute | null =
    parsedRoute ??
    (isAdminCatalogPath ? { view: { apartado: "todos" }, detailCode: null, isDetail: false } : null);

  const isInvalidRoute = route === null;
  useEffect(() => {
    if (isInvalidRoute) {
      navigate("/catalogo", { replace: true });
    }
  }, [isInvalidRoute, navigate]);

  const detailRoute = route?.isDetail ?? false;
  const routeCode = route?.detailCode ?? null;

  const historyState = (typeof window !== "undefined" ? window.history.state : null) as {
    fromCatalog?: boolean;
    bg?: string;
  } | null;
  const backgroundRoute =
    detailRoute && historyState?.bg ? parseCatalogRoute(historyState.bg) : null;

  const view: CatalogView =
    backgroundRoute && !backgroundRoute.isDetail
      ? backgroundRoute.view
      : (route?.view ?? { apartado: "todos" });
  const viewPath = buildViewPath(view);

  const selectedGenre = genreFilter.viewPath === viewPath ? genreFilter.genre : "todos";
  const setSelectedGenre = (genre: string) => {
    setGenreFilter({ viewPath, genre });
    setPage(1);
  };

  const goToView = (target: CatalogView) => {
    const targetPath = buildViewPath(target);
    setPage(1);
    if (targetPath !== location) {
      navigate(targetPath);
    }
  };

  const handleApartadoSwitch = (ap: "todos" | Exclude<Apartado, "roms">) => {
    goToView({ apartado: ap });
  };

  const handleRomConsoleSelect = (brand: string, consoleName: string) => {
    goToView({ apartado: "roms", brand, console: consoleName });
  };

  const openDetailUrl = (item: CatalogItem) => {
    const targetPath = buildItemPath(item);
    if (!targetPath) return false;
    window.history.pushState({ fromCatalog: true, bg: viewPath }, "", targetPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return true;
  };

  const closeDetailUrl = () => {
    if (detailRoute) {
      if (window.history.state?.fromCatalog) {
        window.history.back();
      } else {
        navigate(viewPath, { replace: true });
      }
    }
  };

  const navigateFromBreadcrumbRoot = () => {
    setSelectedGenre("todos");
    goToView({ apartado: "todos" });
  };

  const navigateFromBreadcrumbApartado = (
    apartado: Apartado,
    brand?: string | null,
    consoleName?: string | null,
  ) => {
    setSelectedGenre("todos");
    goToView(
      apartado === "roms" && brand && consoleName
        ? { apartado: "roms", brand, console: consoleName }
        : viewForItem({ apartado, brand: brand ?? null, console: consoleName ?? null }),
    );
  };

  const navigateFromBreadcrumbGenre = (
    genre: string,
    apartado: Apartado,
    brand?: string | null,
    consoleName?: string | null,
  ) => {
    const targetView: CatalogView =
      apartado === "roms" && brand && consoleName
        ? { apartado: "roms", brand, console: consoleName }
        : viewForItem({ apartado, brand: brand ?? null, console: consoleName ?? null });
    const targetPath = buildViewPath(targetView);
    setGenreFilter({ viewPath: targetPath, genre });
    setPage(1);
    if (targetPath !== location) {
      navigate(targetPath);
    }
  };

  const isAdultContext = view.apartado === "adultos" || route?.view.apartado === "adultos";
  const showAgeGate = isAdultContext && !ageVerified;

  const handleConfirmAge = () => {
    try {
      sessionStorage.setItem(AGE_STORAGE_KEY, "true");
    } catch {
      // Ignorar si sessionStorage no está disponible
    }
    setAgeVerified(true);
  };

  const handleRejectAge = () => {
    navigate("/catalogo", { replace: true });
  };

  return {
    route,
    view,
    viewPath,
    detailRoute,
    routeCode,
    selectedGenre,
    searchQuery,
    debouncedSearch,
    isSearchActive: Boolean(searchQuery.trim()),
    page,
    ageVerified,
    showAgeGate,
    setPage,
    setSearchQuery,
    setSelectedGenre,
    goToView,
    handleApartadoSwitch,
    handleRomConsoleSelect,
    openDetailUrl,
    closeDetailUrl,
    navigateFromBreadcrumbRoot,
    navigateFromBreadcrumbApartado,
    navigateFromBreadcrumbGenre,
    handleConfirmAge,
    handleRejectAge,
  };
}
