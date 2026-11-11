import { useState, useMemo, useEffect, useRef } from "react";
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
  Trash2,
  Pencil,
  Joystick,
  ChevronDown,
  FileJson,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import {
  buildItemPath,
  buildViewPath,
  parseCatalogRoute,
  viewForItem,
  type CatalogRoute,
  type CatalogView,
} from "../utils/catalogUrl";
import RomBrandMenu from "../components/RomBrandMenu";
import { romCountKey } from "../data/romPlatforms";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FullscreenDetailModal from "../components/FullscreenDetailModal";
import AddItemModal from "../components/AddItemModal";
import BulkJsonImportModal from "../components/BulkJsonImportModal";
import { NativeBannerAd } from "../components/ads/NativeBannerAd";
import { cleanDescription } from "../utils/cleanDescription";
import {
  initialCatalogItems,
  type CatalogItem,
  type Apartado,
} from "../data/catalog";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  catalogService,
  mapApartadoToSection,
} from "../services/catalog.service";

const APARTADOS_CONFIG: {
  id: "todos" | Exclude<Apartado, "roms">;
  label: string;
  icon: typeof Gamepad2;
}[] = [
  { id: "todos", label: "Todo el Catálogo", icon: FolderOpen },
  { id: "juegos", label: "Juegos de PC", icon: Gamepad2 },
  { id: "mods", label: "Mods & Shaders", icon: Cpu },
  { id: "herramientas", label: "Herramientas de PC", icon: Wrench },
  { id: "adultos", label: "+18 Para Adultos", icon: Flame },
];

/** Panel de ROMs (pestaña): ancho máximo y alto con el que cabe sin scroll. */
const ROM_MENU_WIDTH = 600;
const ROM_MENU_IDEAL_HEIGHT = 310;

type RomMenuPosition = {
  left: number;
  width: number;
  maxHeight: number;
} & ({ top: number; bottom?: undefined } | { bottom: number; top?: undefined });

const APARTADO_BADGE: Record<Apartado, string> = {
  juegos: "Juego",
  mods: "Mod",
  herramientas: "Tool",
  roms: "ROM",
  adultos: "+18",
};

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
        )
      )}
    </>
  );
}

export default function Catalog() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  // Items persistidos exclusivamente en PostgreSQL
  const [customItems, setCustomItems] = useState<CatalogItem[]>([]);

  // Limpieza de residuos antiguos de localStorage y carga desde PostgreSQL via API
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sotano_catalog_items");
      localStorage.removeItem("sotano_custom_catalog_items");
    }

    let isMounted = true;
    catalogService
      .getItems()
      .then((dbItems) => {
        if (!isMounted) return;
        setCustomItems(dbItems ?? []);
      })
      .catch((err) => {
        console.error("No se pudo sincronizar el catálogo con la DB:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo(() => {
    return [...customItems, ...initialCatalogItems];
  }, [customItems]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce de ~250ms para sugerencias de búsqueda
  useEffect(() => {
    if (search.trim().length >= 2) {
      setIsSearching(true);
      setIsDropdownOpen(true);
    } else {
      setIsSearching(false);
      setIsDropdownOpen(false);
      setDebouncedSearch("");
      setSelectedIndex(-1);
    }

    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
      setSelectedIndex(-1);
    }, 250);

    return () => clearTimeout(handler);
  }, [search]);

  // Cerrar el panel al hacer clic fuera
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

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // ── Ruta actual → vista del catálogo y detalle abierto ───────────────────────
  // Listados: /catalogo, /juegos, /mods-shaders, /herramientas, /adultos, /rom/{marca}/{consola}
  // Detalle:  /juego/{slug}-{codigo}, ..., /rom/{marca}/{consola}/{slug}-{codigo}
  const [location, navigate] = useLocation();
  const parsedRoute = parseCatalogRoute(location);
  const isAdminCatalogPath = location === "/publish" || location === "/dashboard/crear";
  const route: CatalogRoute | null =
    parsedRoute ??
    (isAdminCatalogPath ? { view: { apartado: "todos" }, detailCode: null, isDetail: false } : null);
  const detailRoute = route?.isDetail ?? false;
  const routeCode = route?.detailCode ?? null;

  // Detrás del modal se mantiene el listado desde el que se abrió (guardado en history.state)
  const historyState = (typeof window !== "undefined" ? window.history.state : null) as
    | { fromCatalog?: boolean; bg?: string }
    | null;
  const backgroundRoute =
    detailRoute && historyState?.bg ? parseCatalogRoute(historyState.bg) : null;
  const view: CatalogView =
    backgroundRoute && !backgroundRoute.isDetail
      ? backgroundRoute.view
      : route?.view ?? { apartado: "todos" };
  const viewPath = buildViewPath(view);
  const selectedApartado = view.apartado;
  const romFilter = view.apartado === "roms" ? view : null;

  // ── Estado de confirmación de mayoría de edad (+18)
  const [ageVerified, setAgeVerified] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("sotano_age_verified") === "true";
  });

  // Coincidencias de autocompletado (hasta 6 sugerencias)
  const suggestions = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (q.length < 2) return [];
    return items
      .filter((item) => {
        if (item.apartado === "adultos" && selectedApartado !== "adultos" && !ageVerified) {
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
  }, [items, debouncedSearch, selectedApartado, ageVerified]);

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
        openItem(suggestions[selectedIndex]);
        setIsDropdownOpen(false);
      } else {
        // Enter sin selección activa: aplica el filtro normal en la cuadrícula y cierra sugerencias
        setIsDropdownOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  // Ruta inválida (/rom, /rom/{marca}, consola inexistente...) → catálogo completo
  const isInvalidRoute = route === null;
  useEffect(() => {
    if (isInvalidRoute) navigate("/catalogo", { replace: true });
  }, [isInvalidRoute, navigate]);

  // El filtro de género pertenece a la vista en la que se eligió
  const [genreFilter, setGenreFilter] = useState<{ viewPath: string; genre: string }>({
    viewPath: "",
    genre: "todos",
  });
  const selectedGenre = genreFilter.viewPath === viewPath ? genreFilter.genre : "todos";
  const setSelectedGenre = (genre: string) => setGenreFilter({ viewPath, genre });

  /** Cambia de listado (apartado o consola de ROMs) actualizando la URL. */
  const goToView = (target: CatalogView) => {
    const path = buildViewPath(target);
    if (path !== location) navigate(path);
  };

  // Ítem traído por código cuando no está en el listado cargado (enlace directo)
  const [fetchedItem, setFetchedItem] = useState<CatalogItem | null>(null);
  // Respaldo para ítems sin código público (no deberían existir tras el backfill)
  const [localItem, setLocalItem] = useState<CatalogItem | null>(null);

  const itemFromList = routeCode
    ? items.find((it) => it.publicCode === routeCode) ?? null
    : null;
  const selectedItem: CatalogItem | null = detailRoute
    ? itemFromList ?? (fetchedItem?.publicCode === routeCode ? fetchedItem : null)
    : localItem;

  // Enlace directo a un ítem que no está en el listado: buscarlo por código
  useEffect(() => {
    if (!detailRoute) return;
    if (!routeCode) {
      navigate("/catalogo", { replace: true });
      return;
    }
    if (itemFromList || fetchedItem?.publicCode === routeCode) return;

    let cancelled = false;
    catalogService
      .getItemByCode(routeCode)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setFetchedItem(found);
        } else {
          navigate("/catalogo", { replace: true });
        }
      })
      .catch((err) => {
        console.error("No se pudo cargar el ítem del enlace:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [detailRoute, routeCode, itemFromList, fetchedItem, navigate]);

  // Normalizar la URL (slug desactualizado, prefijo o consola equivocados) a la canónica
  useEffect(() => {
    if (!detailRoute || !selectedItem) return;
    const canonical = buildItemPath(selectedItem);
    if (canonical && canonical !== location) {
      navigate(canonical, { replace: true, state: window.history.state });
    }
  }, [detailRoute, selectedItem, location, navigate]);

  const openItem = (item: CatalogItem) => {
    const path = buildItemPath(item);
    if (path) {
      navigate(path, { state: { fromCatalog: true, bg: viewPath } });
    } else {
      setLocalItem(item);
    }
  };

  const closeItem = () => {
    if (!detailRoute) {
      setLocalItem(null);
      return;
    }
    if (historyState?.fromCatalog) {
      // Se abrió desde el catálogo: volver atrás deja el historial limpio
      window.history.back();
    } else {
      // Enlace directo: ir al listado al que pertenece el ítem
      const target = selectedItem ? viewForItem(selectedItem) : view;
      navigate(buildViewPath(target), { replace: true });
    }
  };

  /** Navegación desde las migas de pan (breadcrumb) del modal de detalle */
  const handleNavigateRoot = () => {
    setLocalItem(null);
    goToView({ apartado: "todos" });
    setGenreFilter({ viewPath: "/catalogo", genre: "todos" });
    setSearch("");
  };

  const handleNavigateApartado = (
    ap: Apartado,
    brand?: string | null,
    consoleName?: string | null
  ) => {
    setLocalItem(null);
    setSearch("");
    if (ap === "roms" && brand && consoleName) {
      const targetView: CatalogView = { apartado: "roms", brand, console: consoleName };
      goToView(targetView);
      setGenreFilter({ viewPath: buildViewPath(targetView), genre: "todos" });
    } else if (ap !== "roms") {
      const targetView: CatalogView = { apartado: ap };
      goToView(targetView);
      setGenreFilter({ viewPath: buildViewPath(targetView), genre: "todos" });
    } else {
      goToView({ apartado: "todos" });
      setGenreFilter({ viewPath: "/catalogo", genre: "todos" });
    }
  };

  const handleNavigateGenre = (
    genre: string,
    ap: Apartado,
    brand?: string | null,
    consoleName?: string | null
  ) => {
    setLocalItem(null);
    setSearch("");
    let targetView: CatalogView;
    if (ap === "roms" && brand && consoleName) {
      targetView = { apartado: "roms", brand, console: consoleName };
    } else if (ap !== "roms") {
      targetView = { apartado: ap };
    } else {
      targetView = { apartado: "todos" };
    }
    const path = buildViewPath(targetView);
    goToView(targetView);
    setGenreFilter({ viewPath: path, genre });
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkJsonModalOpen, setIsBulkJsonModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CatalogItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      setIsAddModalOpen(false);
      setIsBulkJsonModalOpen(false);
      setItemToEdit(null);
    }
  }, [isAdmin]);

  // Handle adding custom items (guarda exclusivamente en PostgreSQL mediante catalogService)
  const handleAddItem = async (newItem: CatalogItem): Promise<void> => {
    if (!isAdmin) return;

    const section = mapApartadoToSection(newItem.apartado);
    const download = newItem.downloadLinks[0]?.url;
    const validDownloadUrl =
      download && (download.startsWith("http://") || download.startsWith("https://"))
        ? download
        : undefined;

    const createdInDb = await catalogService.createItem({
      section,
      title: newItem.title,
      genre: newItem.genre,
      size: newItem.size,
      version: newItem.version,
      badge: newItem.tag,
      coverUrl: newItem.img,
      bannerUrl: newItem.bannerImg,
      downloadUrl: validDownloadUrl,
      developer: newItem.developer,
      shortDescription: cleanDescription(newItem.shortDesc || newItem.fullDesc),
      minimumRequirements: newItem.requirements,
      ...(newItem.apartado === "roms"
        ? {
            brand: newItem.brand ?? undefined,
            console: newItem.console ?? undefined,
            emulator: newItem.emulator ?? undefined,
          }
        : {}),
    });

    // Añadir al estado únicamente cuando PostgreSQL confirme y devuelva el UUID real
    setCustomItems((prev) => [createdInDb, ...prev]);
    const targetView = viewForItem(createdInDb);
    goToView(targetView);
    setGenreFilter({ viewPath: buildViewPath(targetView), genre: createdInDb.genre });
  };

  // Handle editing custom items (actualiza exclusivamente en PostgreSQL mediante catalogService)
  const handleEditItem = async (updatedItem: CatalogItem): Promise<void> => {
    if (!isAdmin) return;

    const section = mapApartadoToSection(updatedItem.apartado);
    const download = updatedItem.downloadLinks[0]?.url;
    const validDownloadUrl =
      download && (download.startsWith("http://") || download.startsWith("https://"))
        ? download
        : undefined;

    const savedInDb = await catalogService.updateItem(updatedItem.id, {
      section,
      title: updatedItem.title,
      genre: updatedItem.genre,
      size: updatedItem.size,
      version: updatedItem.version,
      badge: updatedItem.tag,
      coverUrl: updatedItem.img,
      bannerUrl: updatedItem.bannerImg,
      downloadUrl: validDownloadUrl,
      developer: updatedItem.developer,
      shortDescription: cleanDescription(updatedItem.shortDesc || updatedItem.fullDesc),
      ...(updatedItem.apartado === "roms"
        ? {
            brand: updatedItem.brand ?? undefined,
            console: updatedItem.console ?? undefined,
            emulator: updatedItem.emulator ?? undefined,
          }
        : {}),
      minimumRequirements: updatedItem.requirements,
    });

    // Actualizar en el estado de items locales
    setCustomItems((prev) =>
      prev.map((item) => (item.id === savedInDb.id ? savedInDb : item))
    );

    // Si el modal de detalle del ítem está abierto, actualizarlo con los nuevos datos
    if (fetchedItem?.id === savedInDb.id) {
      setFetchedItem(savedInDb);
    }
    if (localItem?.id === savedInDb.id) {
      setLocalItem(savedInDb);
    }
  };

  // Handle removing items from Database and local view
  const handleDeleteItem = async (item: CatalogItem) => {
    if (!isAdmin) return;
    try {
      setIsDeleting(true);
      // Si el id es un UUID (proveniente de la base de datos), llamar al backend
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
      if (isUuid) {
        await catalogService.deleteItem(item.id);
      }
      setCustomItems((prev) => prev.filter((it) => it.id !== item.id));
      if (selectedItem?.id === item.id) {
        closeItem();
      }
      setItemToDelete(null);
    } catch (err) {
      console.error("Error al eliminar el ítem:", err);
      const msg = err instanceof Error ? err.message : "Hubo un error al eliminar el ítem del servidor.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Confirmación de mayoría de edad (+18) para /adultos y /adulto/...
  const isAdultContext =
    selectedApartado === "adultos" ||
    route?.view.apartado === "adultos" ||
    selectedItem?.apartado === "adultos";
  const showAgeGate = isAdultContext && !ageVerified;

  const handleConfirmAge = () => {
    sessionStorage.setItem("sotano_age_verified", "true");
    setAgeVerified(true);
  };

  const handleRejectAge = () => {
    setLocalItem(null);
    navigate("/catalogo", { replace: true });
  };

  // Get list of genres based on active apartado
  /** El ítem pertenece a la vista actual (apartado y, en ROMs, marca + consola). */
  const matchesView = (it: CatalogItem) => {
    if (selectedApartado === "todos") return it.apartado !== "adultos";
    if (it.apartado !== selectedApartado) return false;
    if (romFilter) return it.brand === romFilter.brand && it.console === romFilter.console;
    return true;
  };

  const availableGenres = useMemo(() => {
    const relevantItems = items.filter(matchesView);

    const genresSet = new Set<string>();
    relevantItems.forEach((it) => genresSet.add(it.genre));
    return Array.from(genresSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, viewPath]);

  // Filter items based on Search, Apartado, and Genre
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      if (!matchesView(item)) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, viewPath, selectedGenre, search]);

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

  const isSearchActive = Boolean(search.trim());

  const handleApartadoSwitch = (ap: "todos" | Exclude<Apartado, "roms">) => {
    goToView({ apartado: ap });
  };

  const handleRomConsoleSelect = (brand: string, consoleName: string) => {
    goToView({ apartado: "roms", brand, console: consoleName });
    setRomMenuOpen(false);
    setFilterDrawerOpen(false);
  };

  // ROMs por consola (para los contadores del menú)
  const romCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) {
      if (it.apartado === "roms" && it.brand && it.console) {
        const key = romCountKey(it.brand, it.console);
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [items]);
  const totalRoms = items.filter((it) => it.apartado === "roms").length;

  // ── Panel de marcas/consolas de la pestaña "ROMs" (hover en escritorio, click en móvil)
  const [romMenuOpen, setRomMenuOpen] = useState(false);
  const [romMenuPos, setRomMenuPos] = useState<RomMenuPosition>({
    left: 16,
    width: ROM_MENU_WIDTH,
    top: 0,
    maxHeight: 400,
  });
  const [drawerRomsOpen, setDrawerRomsOpen] = useState(false);
  const romTabRef = useRef<HTMLButtonElement>(null);
  const romMenuRef = useRef<HTMLDivElement>(null);
  const romCloseTimer = useRef<number | null>(null);

  /**
   * Coloca el panel pegado a la pestaña: debajo si cabe completo, si no arriba si cabe,
   * y si no cabe en ningún lado, en el más amplio (con scroll interno). Siempre dentro
   * de la ventana. Es `fixed` para que no lo recorte la barra de pestañas (overflow-x-auto).
   */
  const positionRomMenu = () => {
    const rect = romTabRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 16;
    const width = Math.min(ROM_MENU_WIDTH, window.innerWidth - margin * 2);
    const left = Math.max(
      margin,
      Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin),
    );
    const edge = 8; // separación mínima con el borde superior/inferior de la ventana
    const spaceBelow = window.innerHeight - rect.bottom - edge;
    const spaceAbove = rect.top - edge;
    // Nada se mueve bajo el cursor: solo se elige el lado donde cabe el panel completo
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
  /** Se cierra solo cuando el mouse sale de la pestaña y del panel (con un margen de gracia). */
  const scheduleCloseRomMenu = () => {
    cancelCloseRomMenu();
    romCloseTimer.current = window.setTimeout(() => setRomMenuOpen(false), 300);
  };

  // Mientras está abierto: seguir a la pestaña al hacer scroll/redimensionar;
  // cerrar con click fuera o Escape
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

  const renderCard = (item: CatalogItem) => (
    <div
      key={item.id}
      onClick={() => openItem(item)}
      className={`group flex flex-col rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-colors cursor-pointer ${
        isLight
          ? "bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-100"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openItem(item);
      }}
    >
      {/* Card Image Thumbnail (Portada Vertical 3:4) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        <img
          src={item.img}
          alt={item.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
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

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 pointer-events-none">
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-bold tracking-wider border shadow-sm ${
                item.apartado === "adultos"
                  ? "bg-rose-600/95 text-white border-rose-500"
                  : "bg-zinc-950/90 text-zinc-200 border-zinc-700"
              }`}
            >
              {APARTADO_BADGE[item.apartado]}
            </span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 sm:gap-1.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToEdit(item);
                  setIsAddModalOpen(true);
                }}
                title="Editar este elemento"
                className="p-1 sm:p-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Pencil className="size-3 sm:size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(item);
                }}
                title="Eliminar elemento del catálogo"
                className="p-1 sm:p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Trash2 className="size-3 sm:size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Tag */}
        <div className="absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 pointer-events-none max-w-[85%]">
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 bg-black/85 px-1.5 sm:px-2 py-0.5 rounded truncate inline-block max-w-full">
            {item.version}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
        <div>
          <span
            className={`text-[10px] sm:text-[11px] uppercase tracking-wider block mb-0.5 sm:mb-1 truncate ${
              isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            {item.apartado === "roms" && item.console
              ? `${item.console} · ${item.genre}`
              : item.genre}
          </span>
          <h3
            className={`text-sm sm:text-base font-bold line-clamp-1 transition-colors ${
              isLight ? "text-zinc-900 group-hover:text-black" : "text-white group-hover:text-zinc-200"
            }`}
          >
            {item.title}
          </h3>
          <p
            className={`text-[11px] sm:text-xs mt-1 sm:mt-2 line-clamp-2 leading-snug sm:leading-relaxed ${
              isLight ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            {item.shortDesc}
          </p>
        </div>

        {/* Card Footer */}
        <div
          className={`pt-2 sm:pt-3 border-t flex items-center justify-between text-[10px] sm:text-xs ${
            isLight ? "border-zinc-200" : "border-zinc-800/80"
          }`}
        >
          <span
            className={`flex items-center gap-1 sm:gap-1.5 font-mono truncate mr-1 ${
              isLight ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            <HardDrive className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{item.size}</span>
          </span>

          <span
            className={`inline-flex items-center gap-0.5 sm:gap-1 font-semibold shrink-0 group-hover:translate-x-1 transition-transform ${
              isLight ? "text-zinc-900" : "text-white"
            }`}
          >
            <span>Ver info</span>
            <Download className="size-3 sm:size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );

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
                {isAdmin && (
                  <>
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
                      onClick={() => setIsBulkJsonModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-transform shadow-md cursor-pointer hover:scale-105 active:scale-95 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      title="Cargar masivamente juegos o elementos desde un archivo JSON"
                    >
                      <FileJson className="size-4" />
                      <span>Carga Masiva (JSON)</span>
                    </button>
                  </>
                )}

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

        {/* Filter Bar & Search Controls: sticky con z-40 y fondo sólido para que el contenido pase por debajo sin solaparse */}
        <section
          className={`sticky top-16 z-40 w-full py-3 mb-6 transition-colors shadow-sm ${
            isLight ? "bg-[#f4f4f5]" : "bg-zinc-950"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`p-3 sm:p-4 rounded-2xl border shadow-md flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
                isLight
                  ? "bg-white border-zinc-200 shadow-zinc-200/50"
                  : "bg-zinc-900 border-zinc-800"
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

                {/* Pestaña ROMs: no tiene listado general, abre el panel de marcas/consolas */}
                <button
                  ref={romTabRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={romMenuOpen}
                  onMouseEnter={openRomMenu}
                  onMouseLeave={scheduleCloseRomMenu}
                  onPointerUp={(e) => {
                    // Mouse: la pestaña solo abre (se cierra al salir). Táctil: alterna.
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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
                    aria-expanded={isDropdownOpen && search.trim().length >= 2}
                    aria-haspopup="listbox"
                    aria-controls="catalog-search-listbox"
                    aria-activedescendant={
                      selectedIndex >= 0 ? `suggestion-item-${selectedIndex}` : undefined
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                      if (search.trim().length >= 2) setIsDropdownOpen(true);
                    }}
                    placeholder="Buscar juegos, mods, herramientas..."
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500"
                    }`}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
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

                  {/* Autocomplete Suggestions Dropdown (estilo Steam) */}
                  {isDropdownOpen && search.trim().length >= 2 && (
                    <div
                      id="catalog-search-listbox"
                      role="listbox"
                      className={`absolute top-full left-0 mt-2 w-full md:w-96 rounded-xl border shadow-2xl overflow-hidden z-50 transition-colors ${
                        isLight
                          ? "bg-white border-zinc-200 text-zinc-900 shadow-zinc-400/40"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black/90"
                      }`}
                    >
                      {isSearching ? (
                        /* Skeletons mientras carga/debounce */
                        <div className="p-2 space-y-2">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                              <div
                                className={`w-[60px] h-[28px] rounded shrink-0 ${
                                  isLight ? "bg-zinc-200" : "bg-zinc-800"
                                }`}
                              />
                              <div className="flex-1 space-y-1.5">
                                <div
                                  className={`h-3 w-3/4 rounded ${
                                    isLight ? "bg-zinc-200" : "bg-zinc-800"
                                  }`}
                                />
                                <div
                                  className={`h-2.5 w-1/3 rounded ${
                                    isLight ? "bg-zinc-200" : "bg-zinc-800"
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : suggestions.length === 0 ? (
                        /* Estado vacío */
                        <div
                          className={`p-4 text-center text-xs ${
                            isLight ? "text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          Sin resultados para &quot;{debouncedSearch}&quot;
                        </div>
                      ) : (
                        /* Lista de sugerencias */
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
                                  openItem(item);
                                  setIsDropdownOpen(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
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
                                  className="w-[60px] h-[28px] object-cover rounded shrink-0 bg-zinc-950 border border-zinc-700/50"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/img/SN-tools.jpg";
                                  }}
                                />
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                  <div className="text-xs sm:text-sm truncate">
                                    {highlightMatch(item.title, debouncedSearch)}
                                  </div>
                                  <span
                                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold tracking-wider shrink-0 border ${
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
          </div>
        </section>

        {/* Encabezado del listado de ROMs: marca y consola actuales */}
        {romFilter && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${
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

        {/* Active Filter Tags (en el flujo normal, entre la barra y la cuadrícula, con margen inferior de ~16px) */}
        {(selectedGenre !== "todos" || isSearchActive) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs uppercase tracking-widest ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                Filtros activos:
              </span>
              {selectedGenre !== "todos" && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                    isLight
                      ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                      : "bg-zinc-900 border-zinc-700 text-zinc-200"
                  }`}
                >
                  <span>Género: {selectedGenre}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedGenre("todos")}
                    className={`cursor-pointer ${isLight ? "hover:text-black text-zinc-500" : "hover:text-white text-zinc-400"}`}
                    aria-label="Quitar filtro de género"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {isSearchActive && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                    isLight
                      ? "bg-white border-zinc-300 text-zinc-800 shadow-sm"
                      : "bg-zinc-900 border-zinc-700 text-zinc-200"
                  }`}
                >
                  <span>Búsqueda: "{search}"</span>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
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
                  setSelectedGenre("todos");
                  setSearch("");
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

        {/* Catalog Items Section */}
        <section
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 transition-all ${
            showAgeGate ? "blur-xl pointer-events-none select-none opacity-30" : ""
          }`}
        >
          {filteredItems.length === 0 ? (
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
                    goToView({ apartado: "todos" });
                  }}
                  className={`px-5 py-2.5 rounded-xl border text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white"
                  }`}
                >
                  Restablecer Filtros
                </button>
                {isAdmin && (
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
                )}
              </div>
            </div>
          ) : isSearchActive ? (
            /* Search Active: Unified grid without category headers to prevent overlap */
            <div className="space-y-6">
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
                    Resultados de búsqueda
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      isLight
                        ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {filteredItems.length} {filteredItems.length === 1 ? "resultado" : "resultados"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {filteredItems.map(renderCard)}
              </div>
            </div>
          ) : (
            /* Normal Mode (No search): Grouped by genre with scroll-margin-top */
            Object.entries(itemsByGenre).map(([genreTitle, genreItems]) => (
              <div key={genreTitle} className="space-y-6 scroll-mt-28">
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

                {/* Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {genreItems.map(renderCard)}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Native Banner Ad (se oculta cuando el modal de detalle está abierto para evitar duplicar el ID del contenedor) */}
        {!selectedItem && <NativeBannerAd />}
      </main>

      {/* Panel de marcas y consolas de la pestaña ROMs.
          Va en un portal a <body>: dentro del contenedor animado de la app su z-index
          no compite con elementos fijos como la burbuja de ayuda y quedaba tapado. */}
      {createPortal(
      <AnimatePresence>
        {romMenuOpen && !isAddModalOpen && !filterDrawerOpen && !selectedItem && (
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
            // El padding hace de "puente" invisible con la pestaña: el mouse no sale al cruzar
            className={`fixed z-[70] flex flex-col font-share ${romMenuPos.top !== undefined ? "pt-2" : "pb-2"}`}
          >
            <div
              className={`flex flex-col min-h-0 rounded-2xl border shadow-2xl transition-colors ${
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
                  onSelect={handleRomConsoleSelect}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
        document.body,
      )}

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
                        ? items.filter((it) => it.apartado !== "adultos").length
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

                  {/* ROMs: se despliegan las marcas y sus consolas */}
                  <button
                    type="button"
                    aria-expanded={drawerRomsOpen || selectedApartado === "roms"}
                    onClick={() => setDrawerRomsOpen((open) => !open)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer text-left ${
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
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
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
                      className={`p-3 rounded-xl border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
                      }`}
                    >
                      <RomBrandMenu
                        variant="drawer"
                        isLight={isLight}
                        counts={romCounts}
                        activeBrand={romFilter?.brand}
                        activeConsole={romFilter?.console}
                        onSelect={handleRomConsoleSelect}
                      />
                    </div>
                  )}
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
                    setSelectedGenre("todos");
                    setSearch("");
                    goToView({ apartado: "todos" });
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
        item={showAgeGate ? null : selectedItem}
        onClose={closeItem}
        isAdmin={isAdmin}
        disableEscape={isAddModalOpen || Boolean(itemToDelete) || showAgeGate}
        onDelete={(item) => setItemToDelete(item)}
        onEdit={(item) => {
          setItemToEdit(item);
          setIsAddModalOpen(true);
        }}
        onNavigateRoot={handleNavigateRoot}
        onNavigateApartado={handleNavigateApartado}
        onNavigateGenre={handleNavigateGenre}
      />

      {/* Modal de Confirmación de Mayoría de Edad (+18) al entrar a /adultos */}
      {createPortal(
        <AnimatePresence>
          {showAgeGate && (
            <motion.div
              key="age-gate-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl font-share select-text"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl text-center transition-colors ${
                  isLight
                    ? "bg-white border-zinc-200 text-zinc-900"
                    : "bg-zinc-950 border-zinc-800 text-zinc-100"
                }`}
              >
                <div className="mx-auto mb-5 size-16 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
                  <span className="text-2xl font-extrabold tracking-tight">+18</span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl font-extrabold uppercase tracking-wider mb-2 ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  Contenido para Adultos
                </h2>

                <p
                  className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Esta sección contiene juegos y material exclusivo para mayores de edad (+18).
                  Por favor, confirma que tienes al menos 18 años para continuar.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRejectAge}
                    className={`w-full sm:w-1/2 py-3 px-4 rounded-xl border text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors ${
                      isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                    }`}
                  >
                    Salir
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAge}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                  >
                    Tengo +18 años
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Add / Edit Item Modal (Rendered strictly for Admins) */}
      {isAdmin && (
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setItemToEdit(null);
          }}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
          onBulkImported={(newItems) => {
            setCustomItems((prev) => [...newItems, ...prev]);
          }}
          itemToEdit={itemToEdit}
        />
      )}

      {/* Bulk JSON Import Modal (Rendered strictly for Admins) */}
      {isAdmin && (
        <BulkJsonImportModal
          isOpen={isBulkJsonModalOpen}
          onClose={() => setIsBulkJsonModalOpen(false)}
          onItemsImported={(newItems) => {
            setCustomItems((prev) => [...newItems, ...prev]);
          }}
        />
      )}

      {/* Delete Confirmation Modal for Admins */}
      {isAdmin && itemToDelete && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors ${
                isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-800 text-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
                  <Trash2 className="size-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg uppercase tracking-wide">¿Eliminar elemento?</h3>
                  <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <p className={`text-sm mb-6 ${isLight ? "text-zinc-600" : "text-zinc-300"}`}>
                ¿Estás seguro de que deseas eliminar permanentemente{" "}
                <span className="font-bold text-red-400">"{itemToDelete.title}"</span> de la biblioteca y de la base de datos?
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteItem(itemToDelete)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs uppercase tracking-wider font-bold shadow-lg transition-transform cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      <Footer />
    </div>
  );
}
