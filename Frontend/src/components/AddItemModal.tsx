import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Pencil,
  Upload,
  Link as LinkIcon,
  Check,
  RefreshCw,
  Trash2,
  FileJson,
} from "lucide-react";
import type { Apartado, CatalogItem } from "../data/catalog";
import {
  NO_STABLE_EMULATOR,
  ROM_BRANDS,
  ROM_GENRE_SUGGESTIONS,
  findRomConsole,
} from "../data/romPlatforms";
import { useTheme } from "../ThemeContext";
import { authService } from "../services/auth.service";
import BulkJsonImportModal from "./BulkJsonImportModal";
import { cleanDescription } from "../utils/cleanDescription";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem?: (item: CatalogItem) => Promise<void>;
  onEditItem?: (item: CatalogItem) => Promise<void>;
  onBulkImported?: (items: CatalogItem[]) => void;
  itemToEdit?: CatalogItem | null;
}

const GENRE_SUGGESTIONS: Record<Apartado, string[]> = {
  juegos: [
    "Acción / Shooter",
    "Lucha / Fighting",
    "Aventura / RPG",
    "Terror / Supervivencia",
    "Estrategia",
    "Carreras / Simulación",
  ],
  mods: [
    "Gráficos & Shaders",
    "Expansión & Jugabilidad",
    "Optimización & FPS",
    "Skins & Texturas",
  ],
  herramientas: [
    "Optimización del Sistema",
    "Diagnóstico & Monitoreo",
    "Drivers & Mantenimiento",
    "Seguridad & Limpieza",
  ],
  roms: ROM_GENRE_SUGGESTIONS,
  adultos: [
    "Novela Visual / Eroge",
    "RPG / Aventura H",
    "Simulador / Dating Sim",
    "Acción / Plataformas H",
    "3D / Animación",
    "Puzzle / Casual H",
  ],
};

const APARTADO_LABEL: Record<Apartado, string> = {
  juegos: "Juegos",
  mods: "Mods",
  herramientas: "Herramientas",
  roms: "ROMs",
  adultos: "+18 Adultos",
};

// Optimiza la imagen de forma cliente para no saturar memoria y mantener 120 FPS
async function optimizeImageFile(file: File, maxDimension = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL("image/webp", 0.85);
          resolve(compressed);
        } catch {
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          resolve(compressed);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function AddItemModal({
  isOpen,
  onClose,
  onAddItem,
  onEditItem,
  onBulkImported,
  itemToEdit,
}: AddItemModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isEditMode = Boolean(itemToEdit);
  const [isBulkJsonOpen, setIsBulkJsonOpen] = useState(false);

  const [apartado, setApartado] = useState<Apartado>("juegos");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRE_SUGGESTIONS.juegos[0]);
  const [tag, setTag] = useState("Nuevo");
  const [size, setSize] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [developer, setDeveloper] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // Solo ROMs: marca, consola y emulador recomendado
  const [romBrand, setRomBrand] = useState(ROM_BRANDS[0].name);
  const [romConsole, setRomConsole] = useState(ROM_BRANDS[0].consoles[0].name);
  const [emulator, setEmulator] = useState("");

  // Requisitos mínimos del sistema
  const [minOs, setMinOs] = useState("");
  const [minCpu, setMinCpu] = useState("");
  const [minRam, setMinRam] = useState("");
  const [minStorage, setMinStorage] = useState("");
  const [minGpu, setMinGpu] = useState("");

  // Portada (Vertical 3:4)
  const [coverMode, setCoverMode] = useState<"device" | "url">("device");
  const [deviceCover, setDeviceCover] = useState<string | null>(null);
  const [deviceCoverFileName, setDeviceCoverFileName] = useState("");
  const [deviceCoverFileSize, setDeviceCoverFileSize] = useState("");
  const [urlCover, setUrlCover] = useState("");
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [isCoverDragOver, setIsCoverDragOver] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Banner (Horizontal 16:9)
  const [bannerMode, setBannerMode] = useState<"device" | "url">("device");
  const [deviceBanner, setDeviceBanner] = useState<string | null>(null);
  const [deviceBannerFileName, setDeviceBannerFileName] = useState("");
  const [deviceBannerFileSize, setDeviceBannerFileSize] = useState("");
  const [urlBanner, setUrlBanner] = useState("");
  const [isProcessingBanner, setIsProcessingBanner] = useState(false);
  const [isBannerDragOver, setIsBannerDragOver] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setGenre(GENRE_SUGGESTIONS.juegos[0]);
    setTag("Nuevo");
    setSize("");
    setVersion("v1.0");
    setDeveloper("");
    setDeviceCover(null);
    setDeviceCoverFileName("");
    setDeviceCoverFileSize("");
    setUrlCover("");
    setCoverMode("device");
    setDeviceBanner(null);
    setDeviceBannerFileName("");
    setDeviceBannerFileSize("");
    setUrlBanner("");
    setBannerMode("device");
    setShortDesc("");
    setDownloadUrl("");
    setMinOs("");
    setMinCpu("");
    setMinRam("");
    setMinStorage("");
    setMinGpu("");
    setRomBrand(ROM_BRANDS[0].name);
    setRomConsole(ROM_BRANDS[0].consoles[0].name);
    setEmulator("");
    setSubmitError(null);
  };

  const handleLoadSingleItemIntoForm = (loadedItem: CatalogItem) => {
    setTitle(loadedItem.title || "");
    const ap = loadedItem.apartado || "juegos";
    setApartado(ap);
    setGenre(loadedItem.genre || GENRE_SUGGESTIONS[ap]?.[0] || "");
    setTag(loadedItem.tag || "Nuevo");
    setSize(loadedItem.size || "");
    setVersion(loadedItem.version || "v1.0");
    setDeveloper(loadedItem.developer || "");
    setShortDesc(cleanDescription(loadedItem.shortDesc || ""));
    setMinOs(loadedItem.requirements?.os || "");
    setMinCpu(loadedItem.requirements?.cpu || "");
    setMinRam(loadedItem.requirements?.ram || "");
    setMinStorage(loadedItem.requirements?.storage || "");
    setMinGpu(loadedItem.requirements?.gpu || "");

    if (ap === "roms") {
      setRomBrand(loadedItem.brand || ROM_BRANDS[0].name);
      setRomConsole(loadedItem.console || ROM_BRANDS[0].consoles[0].name);
      setEmulator(loadedItem.emulator || "");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (itemToEdit) {
      const ap = itemToEdit.apartado || "juegos";
      setApartado(ap);
      setTitle(itemToEdit.title || "");
      setGenre(itemToEdit.genre || GENRE_SUGGESTIONS[ap]?.[0] || "");
      setTag(itemToEdit.tag || "Nuevo");
      setSize(itemToEdit.size || "");
      setVersion(itemToEdit.version || "v1.0");
      setDeveloper(itemToEdit.developer || "");
      setShortDesc(cleanDescription(itemToEdit.shortDesc || ""));
      const link = itemToEdit.downloadLinks?.[0]?.url;
      setDownloadUrl(link && link !== "#" ? link : "");
      setMinOs(itemToEdit.requirements?.os || "");
      setMinCpu(itemToEdit.requirements?.cpu || "");
      setMinRam(itemToEdit.requirements?.ram || "");
      setMinStorage(itemToEdit.requirements?.storage || "");
      setMinGpu(itemToEdit.requirements?.gpu || "");

      if (ap === "roms") {
        setRomBrand(itemToEdit.brand || ROM_BRANDS[0].name);
        setRomConsole(itemToEdit.console || ROM_BRANDS[0].consoles[0].name);
        setEmulator(itemToEdit.emulator || "");
      } else {
        setRomBrand(ROM_BRANDS[0].name);
        setRomConsole(ROM_BRANDS[0].consoles[0].name);
        setEmulator("");
      }

      // Portada
      if (itemToEdit.img) {
        setUrlCover(itemToEdit.img);
        setCoverMode("url");
      } else {
        setUrlCover("");
        setCoverMode("device");
      }
      setDeviceCover(null);
      setDeviceCoverFileName("");
      setDeviceCoverFileSize("");

      // Banner
      if (itemToEdit.bannerImg) {
        setUrlBanner(itemToEdit.bannerImg);
        setBannerMode("url");
      } else {
        setUrlBanner("");
        setBannerMode("device");
      }
      setDeviceBanner(null);
      setDeviceBannerFileName("");
      setDeviceBannerFileSize("");

      setSubmitError(null);
    } else {
      resetForm();
    }
  }, [itemToEdit, isOpen]);

  /** Precarga el emulador y los requisitos sugeridos para la consola elegida. */
  const applyConsoleDefaults = (brand: string, consoleName: string) => {
    const entry = findRomConsole(brand, consoleName);
    if (!entry) return;
    setEmulator(entry.emulator);
    setMinOs(entry.requirements.os);
    setMinCpu(entry.requirements.cpu);
    setMinRam(entry.requirements.ram);
    setMinGpu(entry.requirements.gpu);
    setMinStorage(entry.requirements.storage);
  };

  const handleApartadoChange = (newAp: Apartado) => {
    const wasRoms = apartado === "roms";
    setApartado(newAp);
    setGenre(GENRE_SUGGESTIONS[newAp][0]);
    if (newAp === "roms") {
      applyConsoleDefaults(romBrand, romConsole);
    } else if (wasRoms) {
      // Los requisitos precargados de emulación no aplican a otros apartados
      setEmulator("");
      setMinOs("");
      setMinCpu("");
      setMinRam("");
      setMinGpu("");
      setMinStorage("");
    }
  };

  const handleRomBrandChange = (brand: string) => {
    const firstConsole = ROM_BRANDS.find((b) => b.name === brand)?.consoles[0]?.name ?? "";
    setRomBrand(brand);
    setRomConsole(firstConsole);
    applyConsoleDefaults(brand, firstConsole);
  };

  const handleRomConsoleChange = (consoleName: string) => {
    setRomConsole(consoleName);
    applyConsoleDefaults(romBrand, consoleName);
  };

  const isRom = apartado === "roms";
  const romBrandConsoles = ROM_BRANDS.find((b) => b.name === romBrand)?.consoles ?? [];

  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, etc.).");
      return;
    }
    try {
      setIsProcessingCover(true);
      const optimized = await optimizeImageFile(file);
      setDeviceCover(optimized);
      setDeviceCoverFileName(file.name);
      const kb = (file.size / 1024).toFixed(0);
      setDeviceCoverFileSize(`${kb} KB`);
    } catch (err) {
      console.error("Error optimizando portada:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDeviceCover(e.target?.result as string);
        setDeviceCoverFileName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingCover(false);
    }
  };

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, etc.).");
      return;
    }
    try {
      setIsProcessingBanner(true);
      const optimized = await optimizeImageFile(file);
      setDeviceBanner(optimized);
      setDeviceBannerFileName(file.name);
      const kb = (file.size / 1024).toFixed(0);
      setDeviceBannerFileSize(`${kb} KB`);
    } catch (err) {
      console.error("Error optimizando banner:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDeviceBanner(e.target?.result as string);
        setDeviceBannerFileName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingBanner(false);
    }
  };

  const handleRemoveDeviceCover = () => {
    setDeviceCover(null);
    setDeviceCoverFileName("");
    setDeviceCoverFileSize("");
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  };

  const handleRemoveDeviceBanner = () => {
    setDeviceBanner(null);
    setDeviceBannerFileName("");
    setDeviceBannerFileSize("");
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authService.isAdmin() || isSubmitting) return;
    const cleanedDesc = cleanDescription(shortDesc);
    if (!title.trim() || !cleanedDesc) return;

    let finalCover = "/img/indicado.webp";
    if (coverMode === "device" && deviceCover) {
      finalCover = deviceCover;
    } else if (coverMode === "url" && urlCover.trim()) {
      finalCover = urlCover.trim();
    } else if (deviceCover) {
      finalCover = deviceCover;
    } else if (urlCover.trim()) {
      finalCover = urlCover.trim();
    }

    let finalBanner: string | undefined = undefined;
    if (bannerMode === "device" && deviceBanner) {
      finalBanner = deviceBanner;
    } else if (bannerMode === "url" && urlBanner.trim()) {
      finalBanner = urlBanner.trim();
    } else if (deviceBanner) {
      finalBanner = deviceBanner;
    } else if (urlBanner.trim()) {
      finalBanner = urlBanner.trim();
    }

    const finalEmulator = emulator.trim() || NO_STABLE_EMULATOR;
    const newItem: CatalogItem = {
      id: "",
      title: title.trim(),
      apartado,
      ...(isRom ? { brand: romBrand, console: romConsole, emulator: finalEmulator } : {}),
      genre: genre.trim(),
      tag: tag.trim() || "Añadido",
      version: version.trim() || "v1.0",
      size: size.trim() || "1.0 GB",
      releaseDate: new Date().getFullYear().toString(),
      developer: developer.trim() || "Comunidad El Sótano",
      img: finalCover,
      bannerImg: finalBanner,
      shortDesc: cleanedDesc,
      fullDesc: cleanedDesc,
      features: isRom
        ? [`ROM de ${romConsole} (${romBrand})`, `Probada con ${finalEmulator}`, "Descarga directa"]
        : [
            "Probado y verificado en Windows 10 y Windows 11",
            "Optimizado para bajo consumo de recursos",
            "Instalación limpia y rápida",
          ],
      requirements: {
        os: minOs.trim() || "Windows 10 / 11 64-bit",
        cpu: minCpu.trim() || "Procesador de 2 o 4 núcleos",
        ram: minRam.trim() || "4 GB RAM",
        gpu: minGpu.trim() || "GPU compatible con DirectX 11",
        storage: minStorage.trim() || size.trim() || "2 GB libres",
      },
      downloadLinks: [
        {
          name: "Descarga Directa",
          type: "direct",
          url: downloadUrl.trim() || "#",
          server: "Servidor Principal",
          badge: "Directo",
        },
      ],
      installationSteps: [
        "Descarga el archivo desde el enlace provisto.",
        "Descomprime con WinRAR o 7-Zip si viene comprimido.",
        "Ejecuta el instalador o ejecutable principal como Administrador.",
      ],
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (isEditMode && onEditItem && itemToEdit) {
        await onEditItem({
          ...itemToEdit,
          ...newItem,
          id: itemToEdit.id,
        });
      } else if (onAddItem) {
        await onAddItem(newItem);
      }
      resetForm();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isEditMode
          ? "No se pudo actualizar el ítem en la base de datos PostgreSQL."
          : "No se pudo guardar el ítem en la base de datos PostgreSQL.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
      {isOpen && (
        <motion.div
          key={itemToEdit ? `edit-${itemToEdit.id}` : "create-item"}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm font-share select-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 border transition-colors ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-900 shadow-xl"
                : "bg-zinc-900 border-zinc-700 text-zinc-100 shadow-2xl"
            }`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-4 border-b mb-6 ${
              isLight ? "border-zinc-200" : "border-zinc-800"
            }`}
          >
            {isEditMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <Pencil className="size-5 text-amber-500 shrink-0" />
                <h2
                  className={`text-xl font-bold uppercase tracking-wider truncate ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  Editar: <span className="text-amber-500">{itemToEdit?.title}</span>
                </h2>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className={`size-5 ${isLight ? "text-zinc-950" : "text-white"}`} />
                <h2
                  className={`text-xl font-bold uppercase tracking-wider ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  Agregar al Catálogo
                </h2>
              </div>
            )}
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => setIsBulkJsonOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Cargar o autocompletar datos desde un archivo JSON"
                >
                  <FileJson className="size-3.5" />
                  <span className="hidden sm:inline">Importar JSON</span>
                </button>
              )}
              <button
                onClick={handleClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight
                    ? "text-zinc-500 hover:text-black hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Apartado Selector */}
            <div>
              <label
                className={`block text-xs uppercase tracking-wider mb-2 font-semibold ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                Apartado Principal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(["juegos", "mods", "herramientas", "roms", "adultos"] as Apartado[]).map((ap) => (
                  <button
                    key={ap}
                    type="button"
                    onClick={() => handleApartadoChange(ap)}
                    className={`py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all cursor-pointer ${
                      apartado === ap
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                          : "bg-white text-zinc-950 border-white shadow-md"
                        : isLight
                        ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {APARTADO_LABEL[ap]}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Título del Item *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Dark Souls Remastered"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Género / Categoría *
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500"
                  }`}
                >
                  {(Array.from(
                    new Set([
                      ...((apartado && GENRE_SUGGESTIONS[apartado]) || GENRE_SUGGESTIONS.juegos),
                      ...(genre ? [genre] : []),
                    ])
                  )).map((g) => (
                    <option key={g} value={g} className={isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100"}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Solo ROMs: Marca → Consola (filtrada por marca) + emulador recomendado */}
            {isRom && (
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      Marca *
                    </label>
                    <select
                      value={romBrand}
                      onChange={(e) => handleRomBrandChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                        isLight
                          ? "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500"
                      }`}
                    >
                      {ROM_BRANDS.map((b) => (
                        <option
                          key={b.name}
                          value={b.name}
                          className={isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100"}
                        >
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                        isLight ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      Consola *
                    </label>
                    <select
                      value={romConsole}
                      onChange={(e) => handleRomConsoleChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                        isLight
                          ? "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-500"
                      }`}
                    >
                      {romBrandConsoles.map((co) => (
                        <option
                          key={co.name}
                          value={co.name}
                          className={isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100"}
                        >
                          {co.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Emulador recomendado
                  </label>
                  <input
                    type="text"
                    value={emulator}
                    onChange={(e) => setEmulator(e.target.value)}
                    placeholder="Ej: PCSX2"
                    maxLength={150}
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                  <p className="text-[11px] mt-1 text-zinc-500">
                    Se precarga según la consola, igual que los requisitos de abajo. Puedes editarlos.
                  </p>
                </div>
              </div>
            )}

            {/* Size, Version, Tag */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Tamaño / Peso
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Ej: 14.5 GB"
                  className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Versión
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="Ej: v1.0.4"
                  className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Etiqueta
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Ej: Popular"
                  className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>

            {/* 1. Portada Vertical (Carátula Principal 3:4) */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className={`block text-xs uppercase tracking-wider font-bold ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      1. Portada del Item (Vertical 3:4) *
                    </label>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Carátula
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                    Formato vertical (póster tipo Steam/Epic). Se muestra en las tarjetas y ficha del juego.
                  </p>
                </div>

                {/* Selector de modo: Dispositivo vs URL */}
                <div
                  className={`inline-flex p-0.5 rounded-lg border text-xs font-semibold shrink-0 self-start sm:self-auto ${
                    isLight
                      ? "bg-zinc-100 border-zinc-200"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCoverMode("device")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      coverMode === "device"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Upload className="size-3.5" />
                    <span>Dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      coverMode === "url"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <LinkIcon className="size-3.5" />
                    <span>URL</span>
                  </button>
                </div>
              </div>

              {/* Subir archivo desde PC / Dispositivo */}
              {coverMode === "device" && (
                <div>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverFile(file);
                    }}
                    className="hidden"
                  />

                  {deviceCover ? (
                    <div
                      className={`relative flex items-center gap-4 p-3 rounded-xl border ${
                        isLight
                          ? "bg-white border-zinc-200"
                          : "bg-zinc-900/90 border-zinc-800"
                      }`}
                    >
                      {/* Vista previa miniatura vertical */}
                      <div className="relative w-16 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border border-zinc-700/40 bg-black/40 shadow">
                        <img
                          src={deviceCover}
                          alt="Portada vertical"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold truncate">
                            {deviceCoverFileName || "Portada cargada"}
                          </p>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            isLight ? "text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          {deviceCoverFileSize ? `${deviceCoverFileSize} • ` : ""}Póster vertical optimizado
                        </p>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isLight
                              ? "border-zinc-300 hover:bg-zinc-200 text-zinc-700"
                              : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          }`}
                          title="Cambiar portada"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDeviceCover}
                          className="p-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                          title="Quitar portada"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsCoverDragOver(true);
                      }}
                      onDragLeave={() => setIsCoverDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsCoverDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCoverFile(file);
                      }}
                      onClick={() => coverFileInputRef.current?.click()}
                      className={`group flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isCoverDragOver
                          ? isLight
                            ? "border-zinc-900 bg-zinc-100"
                            : "border-white bg-zinc-900"
                          : isLight
                          ? "border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-100/70"
                          : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full mb-1.5 transition-transform group-hover:scale-110 ${
                          isLight ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        <Upload className="size-4" />
                      </div>
                      <p className="text-xs font-semibold text-center mb-0.5">
                        {isProcessingCover
                          ? "Procesando portada..."
                          : "Subir imagen vertical (Portada / Carátula)"}
                      </p>
                      <p
                        className={`text-[11px] text-center ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        Arrastra o haz clic para seleccionar (Recomendado relación 3:4 o 2:3)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subir vía URL */}
              {coverMode === "url" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlCover}
                      onChange={(e) => setUrlCover(e.target.value)}
                      placeholder="https://.../portada-vertical.jpg o /img/indicado.webp"
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                        isLight
                          ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                      }`}
                    />
                    {urlCover.trim() && (
                      <button
                        type="button"
                        onClick={() => setUrlCover("")}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          isLight
                            ? "border-zinc-300 hover:bg-zinc-200 text-zinc-600"
                            : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                        }`}
                        title="Borrar URL"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  {urlCover.trim() && (
                    <div
                      className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                        isLight
                          ? "bg-white border-zinc-200"
                          : "bg-zinc-900/60 border-zinc-800"
                      }`}
                    >
                      <div className="w-14 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border border-zinc-700/30 bg-black/40">
                        <img
                          src={urlCover}
                          alt="Previsualización Portada"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/img/indicado.webp";
                          }}
                        />
                      </div>
                      <div className="text-[11px] truncate flex-1">
                        <span className="font-semibold block">Vista previa portada</span>
                        <span className={isLight ? "text-zinc-500" : "text-zinc-400"}>
                          {urlCover}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Banner Horizontal (Cabecera 16:9 - Opcional) */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className={`block text-xs uppercase tracking-wider font-bold ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      2. Banner de Cabecera (Horizontal 16:9 - Opcional)
                    </label>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Cabecera
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                    Imagen panorámica de fondo que se mostrará en la parte superior del modal de detalle.
                  </p>
                </div>

                {/* Selector de modo: Dispositivo vs URL */}
                <div
                  className={`inline-flex p-0.5 rounded-lg border text-xs font-semibold shrink-0 self-start sm:self-auto ${
                    isLight
                      ? "bg-zinc-100 border-zinc-200"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBannerMode("device")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      bannerMode === "device"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Upload className="size-3.5" />
                    <span>Dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerMode("url")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      bannerMode === "url"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <LinkIcon className="size-3.5" />
                    <span>URL</span>
                  </button>
                </div>
              </div>

              {/* Subir banner desde PC / Dispositivo */}
              {bannerMode === "device" && (
                <div>
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBannerFile(file);
                    }}
                    className="hidden"
                  />

                  {deviceBanner ? (
                    <div
                      className={`relative flex items-center gap-4 p-3 rounded-xl border ${
                        isLight
                          ? "bg-white border-zinc-200"
                          : "bg-zinc-900/90 border-zinc-800"
                      }`}
                    >
                      {/* Vista previa miniatura horizontal */}
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 border border-zinc-700/40 bg-black/40 shadow">
                        <img
                          src={deviceBanner}
                          alt="Banner horizontal"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold truncate">
                            {deviceBannerFileName || "Banner cargado"}
                          </p>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            isLight ? "text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          {deviceBannerFileSize ? `${deviceBannerFileSize} • ` : ""}Banner panorámico optimizado
                        </p>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isLight
                              ? "border-zinc-300 hover:bg-zinc-200 text-zinc-700"
                              : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          }`}
                          title="Cambiar banner"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDeviceBanner}
                          className="p-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                          title="Quitar banner"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsBannerDragOver(true);
                      }}
                      onDragLeave={() => setIsBannerDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsBannerDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleBannerFile(file);
                      }}
                      onClick={() => bannerFileInputRef.current?.click()}
                      className={`group flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isBannerDragOver
                          ? isLight
                            ? "border-zinc-900 bg-zinc-100"
                            : "border-white bg-zinc-900"
                          : isLight
                          ? "border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-100/70"
                          : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full mb-1.5 transition-transform group-hover:scale-110 ${
                          isLight ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        <Upload className="size-4" />
                      </div>
                      <p className="text-xs font-semibold text-center mb-0.5">
                        {isProcessingBanner
                          ? "Procesando banner..."
                          : "Subir imagen horizontal (Banner panorámico)"}
                      </p>
                      <p
                        className={`text-[11px] text-center ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        Arrastra o haz clic para seleccionar (Recomendado 16:9 o 21:9 panorámico)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subir banner vía URL */}
              {bannerMode === "url" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlBanner}
                      onChange={(e) => setUrlBanner(e.target.value)}
                      placeholder="https://.../banner-horizontal.jpg (Opcional)"
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                        isLight
                          ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                      }`}
                    />
                    {urlBanner.trim() && (
                      <button
                        type="button"
                        onClick={() => setUrlBanner("")}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          isLight
                            ? "border-zinc-300 hover:bg-zinc-200 text-zinc-600"
                            : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                        }`}
                        title="Borrar URL"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  {urlBanner.trim() && (
                    <div
                      className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                        isLight
                          ? "bg-white border-zinc-200"
                          : "bg-zinc-900/60 border-zinc-800"
                      }`}
                    >
                      <div className="w-24 aspect-video rounded-lg overflow-hidden shrink-0 border border-zinc-700/30 bg-black/40">
                        <img
                          src={urlBanner}
                          alt="Previsualización Banner"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/img/SN-tools.jpg";
                          }}
                        />
                      </div>
                      <div className="text-[11px] truncate flex-1">
                        <span className="font-semibold block">Vista previa banner</span>
                        <span className={isLight ? "text-zinc-500" : "text-zinc-400"}>
                          {urlBanner}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Download URL & Developer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Enlace de Descarga
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-1 font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Desarrollador / Creador
                </label>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="Ej: FromSoftware"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label
                className={`block text-xs uppercase tracking-wider mb-1 font-semibold ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                Descripción Corta *
              </label>
              <textarea
                required
                rows={3}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Breve resumen del juego, mod o herramienta..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border resize-none ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>

            {/* Requisitos Mínimos del Sistema */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <h3
                className={`text-xs uppercase tracking-wider font-bold ${
                  isLight ? "text-zinc-800" : "text-zinc-200"
                }`}
              >
                {isRom
                  ? "Requisitos para emular (emulador + juego)"
                  : "Requisitos Mínimos del Sistema"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Procesador (CPU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={minCpu}
                    onChange={(e) => setMinCpu(e.target.value)}
                    placeholder="Ej: Intel Core i5-8400 / Ryzen 5 2600"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Memoria RAM *
                  </label>
                  <input
                    type="text"
                    required
                    value={minRam}
                    onChange={(e) => setMinRam(e.target.value)}
                    placeholder="Ej: 8 GB RAM"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Memoria ROM (Almacenamiento) *
                  </label>
                  <input
                    type="text"
                    required
                    value={minStorage}
                    onChange={(e) => setMinStorage(e.target.value)}
                    placeholder="Ej: 50 GB libres"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Sistema Operativo (OS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={minOs}
                    onChange={(e) => setMinOs(e.target.value)}
                    placeholder="Ej: Windows 10 / 11 64-bit"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    className={`block text-[11px] uppercase tracking-wider mb-1 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Tarjeta Gráfica (GPU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={minGpu}
                    onChange={(e) => setMinGpu(e.target.value)}
                    placeholder="Ej: NVIDIA GTX 1060 6GB / AMD RX 580"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium">
                Error al guardar en la Base de Datos: {submitError}
              </div>
            )}

            {/* Submit & Cancel */}
            <div
              className={`pt-4 border-t flex items-center justify-end gap-3 ${
                isLight ? "border-zinc-200" : "border-zinc-800"
              }`}
            >
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClose}
                className={`px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? "text-zinc-600 hover:text-black hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isProcessingCover || isProcessingBanner}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                  isLight
                    ? "bg-zinc-900 text-white hover:bg-black"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    {isEditMode ? "Guardando Cambios..." : "Guardando en Base de Datos..."}
                  </>
                ) : isEditMode ? (
                  <>
                    <Check className="size-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Guardar en el Catálogo
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Modal de Carga Masiva JSON */}
  <BulkJsonImportModal
    isOpen={isBulkJsonOpen}
    onClose={() => setIsBulkJsonOpen(false)}
    onLoadSingleItemIntoForm={handleLoadSingleItemIntoForm}
    onItemsImported={(items) => {
      setIsBulkJsonOpen(false);
      if (onBulkImported) {
        onBulkImported(items);
      }
      handleClose();
    }}
  />
  </>,
  document.body
);
}
