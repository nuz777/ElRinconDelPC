import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  MapPin,
} from "lucide-react";
import {
  DEFAULT_COVER_FRAMING,
  type Apartado,
  type CatalogItem,
  type CoverFraming,
} from "../domain/catalog.types";
import {
  NO_STABLE_EMULATOR,
  ROM_BRANDS,
  ROM_GENRE_SUGGESTIONS,
  findRomConsole,
} from "../domain/romPlatforms";
import { useTheme } from "../../../shared/context/useTheme";
import { authService } from "../../auth/services/auth.service";
import BulkJsonImportModal from "./BulkJsonImportModal";
import CoverFramingEditor from "./CoverFramingEditor";
import { cleanDescription } from "../../../shared/utils/cleanDescription";
import { dialog, isDialogOpen } from "../../../shared/ui/dialog";
import { isDefaultFraming, normalizeFraming } from "../utils/coverFraming";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem?: (item: CatalogItem) => Promise<void>;
  onEditItem?: (item: CatalogItem) => Promise<void>;
  onBulkImported?: (items: CatalogItem[]) => void;
  itemToEdit?: CatalogItem | null;
  /** Apartado en el que está el admin (ej. /adultos → "adultos"). Se usa como apartado principal al crear. */
  defaultApartado?: Apartado;
  /** Si se crea desde /rom/:marca/:consola, precarga esa marca y consola. */
  defaultRomBrand?: string;
  defaultRomConsole?: string;
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

const APARTADO_PATH: Record<Apartado, string> = {
  juegos: "/juegos",
  mods: "/mods-shaders",
  herramientas: "/herramientas",
  roms: "/rom",
  adultos: "/adultos",
};

const APARTADOS: Apartado[] = ["juegos", "mods", "herramientas", "roms", "adultos"];

// Optimiza la imagen en el cliente para no saturar memoria ni la base de datos
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
          resolve(canvas.toDataURL("image/webp", 0.85));
        } catch {
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function ItemFormModal(props: AddItemModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {props.isOpen && (
        <AddItemModalInner
          key={props.itemToEdit ? `edit-${props.itemToEdit.id}` : "create-item"}
          {...props}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- Piezas de formulario reutilizables (mismo estilo original) ---------- */

function useFieldStyles(isLight: boolean) {
  return {
    label: `block text-[11px] uppercase tracking-wider mb-1.5 font-semibold ${
      isLight ? "text-zinc-600" : "text-zinc-400"
    }`,
    input: `w-full px-3.5 py-2.5 text-sm transition-colors border outline-none focus-visible:ring-1 ${
      isLight
        ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700 focus-visible:ring-zinc-700"
        : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus-visible:ring-zinc-500"
    }`,
    option: isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100",
    hint: `text-[11px] mt-1 leading-snug ${isLight ? "text-zinc-500" : "text-zinc-500"}`,
    muted: isLight ? "text-zinc-500" : "text-zinc-400",
  };
}

function Section({
  title,
  description,
  aside,
  isLight,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  isLight: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`p-4 sm:p-5 border space-y-4 ${
        isLight ? "bg-zinc-50/70 border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
      }`}
    >
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`text-xs uppercase tracking-wider font-bold ${isLight ? "text-zinc-900" : "text-white"}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-[11px] mt-0.5 leading-snug ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
              {description}
            </p>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function SourceToggle({
  mode,
  onChange,
  isLight,
  label,
}: {
  mode: "device" | "url";
  onChange: (mode: "device" | "url") => void;
  isLight: boolean;
  label: string;
}) {
  const btn = (active: boolean) =>
    `px-2.5 py-1 transition-all flex items-center gap-1.5 cursor-pointer ${
      active
        ? isLight
          ? "bg-white text-zinc-950 shadow-sm"
          : "bg-zinc-800 text-white shadow-sm"
        : isLight
          ? "text-zinc-500 hover:text-zinc-900"
          : "text-zinc-400 hover:text-white"
    }`;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex p-0.5 border text-xs font-semibold shrink-0 self-start ${
        isLight ? "bg-zinc-100 border-zinc-200" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <button type="button" role="radio" aria-checked={mode === "device"} onClick={() => onChange("device")} className={btn(mode === "device")}>
        <Upload className="size-3.5" />
        <span>Dispositivo</span>
      </button>
      <button type="button" role="radio" aria-checked={mode === "url"} onClick={() => onChange("url")} className={btn(mode === "url")}>
        <LinkIcon className="size-3.5" />
        <span>URL</span>
      </button>
    </div>
  );
}

interface ImageSourceFieldProps {
  isLight: boolean;
  mode: "device" | "url";
  deviceImage: string | null;
  deviceFileName: string;
  deviceFileSize: string;
  url: string;
  onUrlChange: (url: string) => void;
  onFile: (file: File) => void;
  onRemoveDevice: () => void;
  isProcessing: boolean;
  aspect: "cover" | "banner";
  dropLabel: string;
  dropHint: string;
  urlPlaceholder: string;
  fallback: string;
}

function ImageSourceField({
  isLight,
  mode,
  deviceImage,
  deviceFileName,
  deviceFileSize,
  url,
  onUrlChange,
  onFile,
  onRemoveDevice,
  isProcessing,
  aspect,
  dropLabel,
  dropHint,
  urlPlaceholder,
  fallback,
}: ImageSourceFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const s = useFieldStyles(isLight);
  const thumb = aspect === "cover" ? "w-12 aspect-[3/4]" : "w-24 aspect-video";

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = "";
      }}
      className="hidden"
    />
  );

  if (mode === "url") {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlPlaceholder}
            className={`${s.input} flex-1`}
          />
          {url.trim() && (
            <button
              type="button"
              onClick={() => onUrlChange("")}
              aria-label="Borrar URL"
              title="Borrar URL"
              className={`p-2.5 border transition-colors cursor-pointer ${
                isLight ? "border-zinc-300 hover:bg-zinc-200 text-zinc-600" : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        {aspect === "banner" && url.trim() && (
          <div className={`flex items-center gap-3 p-2.5 border ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900/60 border-zinc-800"}`}>
            <div className={`${thumb} overflow-hidden shrink-0 border border-zinc-700/30 bg-black/40`}>
              <img
                src={url}
                alt="Vista previa del banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallback;
                }}
              />
            </div>
            <span className={`text-[11px] truncate ${s.muted}`}>{url}</span>
          </div>
        )}
      </div>
    );
  }

  if (deviceImage) {
    return (
      <div className={`flex items-center gap-4 p-3 border ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900/90 border-zinc-800"}`}>
        {fileInput}
        <div className={`${thumb} overflow-hidden shrink-0 border border-zinc-700/40 bg-black/40`}>
          <img src={deviceImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Check className="size-4 text-emerald-500 shrink-0" />
            <span className="truncate">{deviceFileName || "Imagen cargada"}</span>
          </p>
          <p className={`text-[11px] mt-0.5 ${s.muted}`}>
            {deviceFileSize ? `${deviceFileSize}, optimizada` : "Optimizada"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Cambiar imagen"
            title="Cambiar imagen"
            className={`p-2 border transition-colors cursor-pointer ${
              isLight ? "border-zinc-300 hover:bg-zinc-200 text-zinc-700" : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemoveDevice}
            aria-label="Quitar imagen"
            title="Quitar imagen"
            className="p-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {fileInput}
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className={`group w-full flex flex-col items-center justify-center p-5 border-2 border-dashed cursor-pointer transition-all disabled:cursor-wait ${
          isDragOver
            ? isLight
              ? "border-zinc-900 bg-zinc-100"
              : "border-white bg-zinc-900"
            : isLight
              ? "border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-100/70"
              : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/30 hover:bg-zinc-900/70"
        }`}
      >
        <span className={`p-2 mb-2 transition-transform group-hover:scale-110 ${isLight ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-200"}`}>
          {isProcessing ? <RefreshCw className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </span>
        <span className="text-xs font-semibold text-center mb-0.5">
          {isProcessing ? "Optimizando imagen..." : isDragOver ? "Suelta la imagen aquí" : dropLabel}
        </span>
        <span className={`text-[11px] text-center ${s.muted}`}>{dropHint}</span>
      </button>
    </div>
  );
}

/* ---------- Modal ---------- */

function AddItemModalInner({
  onClose,
  onAddItem,
  onEditItem,
  onBulkImported,
  itemToEdit,
  defaultApartado,
  defaultRomBrand,
  defaultRomConsole,
}: AddItemModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const s = useFieldStyles(isLight);
  const reduceMotion = useReducedMotion();
  const isEditMode = Boolean(itemToEdit);
  const [isBulkJsonOpen, setIsBulkJsonOpen] = useState(false);

  const initialApartado: Apartado = itemToEdit?.apartado || defaultApartado || "juegos";
  const initialDownloadLink = itemToEdit?.downloadLinks?.[0]?.url;

  // Marca/consola inicial: la del ítem, la de la vista /rom/:marca/:consola o la primera disponible
  const initialRom = useMemo(() => {
    if (initialApartado === "roms" && itemToEdit?.brand && itemToEdit?.console) {
      return { brand: itemToEdit.brand, console: itemToEdit.console };
    }
    if (defaultRomBrand && defaultRomConsole && findRomConsole(defaultRomBrand, defaultRomConsole)) {
      return { brand: defaultRomBrand, console: defaultRomConsole };
    }
    return { brand: ROM_BRANDS[0].name, console: ROM_BRANDS[0].consoles[0].name };
  }, [initialApartado, itemToEdit, defaultRomBrand, defaultRomConsole]);

  // Al crear una ROM, se precargan emulador y requisitos sugeridos para la consola
  const romDefaults =
    !itemToEdit && initialApartado === "roms" ? findRomConsole(initialRom.brand, initialRom.console) : null;

  const [apartado, setApartado] = useState<Apartado>(initialApartado);
  const [title, setTitle] = useState(itemToEdit?.title || "");
  const [genre, setGenre] = useState(itemToEdit?.genre || GENRE_SUGGESTIONS[initialApartado]?.[0] || "");
  const [tag, setTag] = useState(itemToEdit?.tag || "Nuevo");
  const [size, setSize] = useState(itemToEdit?.size || "");
  const [version, setVersion] = useState(itemToEdit?.version || "v1.0");
  const [developer, setDeveloper] = useState(itemToEdit?.developer || "");
  const [shortDesc, setShortDesc] = useState(itemToEdit?.shortDesc ? cleanDescription(itemToEdit.shortDesc) : "");
  const [downloadUrl, setDownloadUrl] = useState(
    initialDownloadLink && initialDownloadLink !== "#" ? initialDownloadLink : "",
  );

  // Solo ROMs
  const [romBrand, setRomBrand] = useState(initialRom.brand);
  const [romConsole, setRomConsole] = useState(initialRom.console);
  const [emulator, setEmulator] = useState(
    initialApartado === "roms" ? itemToEdit?.emulator || romDefaults?.emulator || "" : "",
  );

  // Requisitos mínimos
  const [minOs, setMinOs] = useState(itemToEdit?.requirements?.os || romDefaults?.requirements.os || "");
  const [minCpu, setMinCpu] = useState(itemToEdit?.requirements?.cpu || romDefaults?.requirements.cpu || "");
  const [minRam, setMinRam] = useState(itemToEdit?.requirements?.ram || romDefaults?.requirements.ram || "");
  const [minStorage, setMinStorage] = useState(
    itemToEdit?.requirements?.storage || romDefaults?.requirements.storage || "",
  );
  const [minGpu, setMinGpu] = useState(itemToEdit?.requirements?.gpu || romDefaults?.requirements.gpu || "");

  // Portada (vertical 3:4) + encuadre
  const [coverMode, setCoverMode] = useState<"device" | "url">(itemToEdit?.img ? "url" : "device");
  const [deviceCover, setDeviceCover] = useState<string | null>(null);
  const [deviceCoverFileName, setDeviceCoverFileName] = useState("");
  const [deviceCoverFileSize, setDeviceCoverFileSize] = useState("");
  const [urlCover, setUrlCover] = useState(itemToEdit?.img || "");
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [coverFraming, setCoverFraming] = useState<CoverFraming>(
    normalizeFraming(itemToEdit?.coverFraming ?? DEFAULT_COVER_FRAMING),
  );

  // Banner (horizontal 16:9)
  const [bannerMode, setBannerMode] = useState<"device" | "url">(itemToEdit?.bannerImg ? "url" : "device");
  const [deviceBanner, setDeviceBanner] = useState<string | null>(null);
  const [deviceBannerFileName, setDeviceBannerFileName] = useState("");
  const [deviceBannerFileSize, setDeviceBannerFileSize] = useState("");
  const [urlBanner, setUrlBanner] = useState(itemToEdit?.bannerImg || "");
  const [isProcessingBanner, setIsProcessingBanner] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Cualquier cambio en el formulario lo marca como "con cambios sin guardar"
  const markDirty = <T,>(setter: (v: T) => void) => (v: T) => {
    setIsDirty(true);
    setter(v);
  };

  useEffect(() => {
    titleInputRef.current?.focus({ preventScroll: true });
  }, []);

  const isRom = apartado === "roms";
  const isAdult = apartado === "adultos";
  const romBrandConsoles = ROM_BRANDS.find((b) => b.name === romBrand)?.consoles ?? [];
  const isContextApartado = !isEditMode && Boolean(defaultApartado) && apartado === defaultApartado;

  const coverPreview =
    coverMode === "device" ? deviceCover || (urlCover.trim() || null) : urlCover.trim() || deviceCover;

  const handleLoadSingleItemIntoForm = (loadedItem: CatalogItem) => {
    setIsDirty(true);
    setTitle(loadedItem.title || "");
    const ap = loadedItem.apartado || apartado;
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
    dialog.toast("success", "Datos cargados desde el JSON", "Revisa el formulario y agrega la portada.");
  };

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
    if (newAp === apartado) return;
    setIsDirty(true);
    const wasRoms = apartado === "roms";
    setApartado(newAp);
    setGenre(GENRE_SUGGESTIONS[newAp][0]);
    if (newAp === "roms") {
      applyConsoleDefaults(romBrand, romConsole);
    } else if (wasRoms || newAp === "adultos") {
      // Los requisitos de emulación no aplican a otros apartados y los juegos H no tienen requisitos
      setEmulator("");
      setMinOs("");
      setMinCpu("");
      setMinRam("");
      setMinGpu("");
      setMinStorage("");
    }
  };

  const handleRomBrandChange = (brand: string) => {
    setIsDirty(true);
    const firstConsole = ROM_BRANDS.find((b) => b.name === brand)?.consoles[0]?.name ?? "";
    setRomBrand(brand);
    setRomConsole(firstConsole);
    applyConsoleDefaults(brand, firstConsole);
  };

  const handleRomConsoleChange = (consoleName: string) => {
    setIsDirty(true);
    setRomConsole(consoleName);
    applyConsoleDefaults(romBrand, consoleName);
  };

  const readImage = async (
    file: File,
    maxDimension: number,
    setProcessing: (v: boolean) => void,
  ): Promise<{ data: string; name: string; size: string } | null> => {
    if (!file.type.startsWith("image/")) {
      void dialog.warning(
        "Ese archivo no es una imagen",
        `"${file.name}" no se puede usar. Elige un JPG, PNG o WebP.`,
      );
      return null;
    }
    setProcessing(true);
    try {
      const data = await optimizeImageFile(file, maxDimension);
      return { data, name: file.name, size: `${(file.size / 1024).toFixed(0)} KB` };
    } catch {
      void dialog.error("No se pudo procesar la imagen", "Prueba con otro archivo o usa una URL.");
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const handleCoverFile = async (file: File) => {
    const result = await readImage(file, 900, setIsProcessingCover);
    if (!result) return;
    setIsDirty(true);
    setDeviceCover(result.data);
    setDeviceCoverFileName(result.name);
    setDeviceCoverFileSize(result.size);
    setCoverMode("device");
    // Imagen nueva: el encuadre anterior ya no aplica
    setCoverFraming({ ...DEFAULT_COVER_FRAMING });
  };

  const handleBannerFile = async (file: File) => {
    const result = await readImage(file, 1280, setIsProcessingBanner);
    if (!result) return;
    setIsDirty(true);
    setDeviceBanner(result.data);
    setDeviceBannerFileName(result.name);
    setDeviceBannerFileSize(result.size);
    setBannerMode("device");
  };

  const requestClose = async () => {
    if (isSubmitting) return;
    if (isDirty) {
      const discard = await dialog.confirm({
        title: "¿Descartar los cambios?",
        text: isEditMode
          ? "Hiciste cambios que todavía no guardaste. Si sales ahora se pierden."
          : "Lo que llenaste en el formulario se perderá.",
        confirmText: "Descartar",
        cancelText: "Seguir editando",
        danger: true,
      });
      if (!discard) return;
    }
    onClose();
  };

  // Escape cierra (pidiendo confirmación si hay cambios); se ignora si hay un popup o el JSON abierto
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isDialogOpen() || isBulkJsonOpen) return;
      e.stopPropagation();
      void requestCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBulkJsonOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!authService.isAdmin()) {
      void dialog.error("Necesitas ser administrador", "Inicia sesión con una cuenta de admin para publicar.");
      return;
    }
    const cleanedDesc = cleanDescription(shortDesc);
    if (!title.trim() || !cleanedDesc) {
      void dialog.warning("Faltan datos", "El título y la descripción son obligatorios.");
      return;
    }

    if (downloadUrl.trim() && !/^https?:\/\/\S+$/i.test(downloadUrl.trim())) {
      void dialog.warning(
        "El enlace de descarga no es válido",
        "Debe empezar con http:// o https://. Déjalo vacío si todavía no lo tienes.",
      );
      return;
    }

    let finalCover = "/img/indicado.webp";
    if (coverMode === "device" && deviceCover) finalCover = deviceCover;
    else if (coverMode === "url" && urlCover.trim()) finalCover = urlCover.trim();
    else if (deviceCover) finalCover = deviceCover;
    else if (urlCover.trim()) finalCover = urlCover.trim();

    let finalBanner: string | undefined;
    if (bannerMode === "device" && deviceBanner) finalBanner = deviceBanner;
    else if (bannerMode === "url" && urlBanner.trim()) finalBanner = urlBanner.trim();
    else if (deviceBanner) finalBanner = deviceBanner;
    else if (urlBanner.trim()) finalBanner = urlBanner.trim();

    const finalEmulator = emulator.trim() || NO_STABLE_EMULATOR;
    const finalFraming =
      finalCover === "/img/indicado.webp" || isDefaultFraming(coverFraming) ? null : normalizeFraming(coverFraming);

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
      coverFraming: finalFraming,
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
      ...(isAdult
        ? { requirements: undefined }
        : {
            requirements: {
              os: minOs.trim() || "Windows 10 / 11 64-bit",
              cpu: minCpu.trim() || "Procesador de 2 o 4 núcleos",
              ram: minRam.trim() || "4 GB RAM",
              gpu: minGpu.trim() || "GPU compatible con DirectX 11",
              storage: minStorage.trim() || size.trim() || "2 GB libres",
            },
          }),
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

    const destination = isRom ? `ROMs de ${romConsole}` : APARTADO_LABEL[apartado];
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (isEditMode && onEditItem && itemToEdit) {
        await onEditItem({ ...itemToEdit, ...newItem, id: itemToEdit.id });
      } else if (onAddItem) {
        await onAddItem(newItem);
      }
      onClose();
      void dialog.success(
        isEditMode ? "Cambios guardados" : "Publicado en el catálogo",
        isEditMode ? undefined : `Ya aparece en ${destination}:`,
        { highlight: newItem.title, timer: 2600 },
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isEditMode
            ? "No se pudo actualizar el ítem."
            : "No se pudo guardar el ítem.";
      setSubmitError(msg);
      void dialog.error(isEditMode ? "No se guardaron los cambios" : "No se pudo publicar", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isProcessingCover || isProcessingBanner;

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm font-share select-text"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) void requestClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-form-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative w-full sm:max-w-3xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col border shadow-2xl transition-colors ${
          isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-900 border-zinc-700 text-zinc-100"
        }`}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Cabecera fija */}
        <div
          className={`flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b shrink-0 ${
            isLight ? "border-zinc-200" : "border-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isEditMode ? (
              <Pencil className="size-5 text-amber-500 shrink-0" />
            ) : (
              <Plus className={`size-5 shrink-0 ${isLight ? "text-zinc-950" : "text-white"}`} />
            )}
            <h2
              id="item-form-title"
              className={`text-lg sm:text-xl font-bold uppercase tracking-wider truncate ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              {isEditMode ? (
                <>
                  Editar: <span className="text-amber-500">{itemToEdit?.title}</span>
                </>
              ) : (
                `Subir a ${APARTADO_LABEL[apartado]}`
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditMode && (
              <button
                type="button"
                onClick={() => setIsBulkJsonOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 transition-colors cursor-pointer"
                title="Cargar o autocompletar datos desde un archivo JSON"
              >
                <FileJson className="size-3.5" />
                <span className="hidden sm:inline">Importar JSON</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void requestClose()}
              aria-label="Cerrar formulario"
              className={`p-1.5 transition-colors cursor-pointer ${
                isLight ? "text-zinc-500 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form id="item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7 py-5 space-y-5">
          {/* Apartado principal */}
          <Section
            isLight={isLight}
            title="Apartado principal"
            description={
              isContextApartado
                ? `Se publica en ${isRom ? `ROMs de ${romConsole}` : APARTADO_PATH[apartado]}, donde estás ahora. Puedes cambiarlo.`
                : "Dónde aparecerá este elemento dentro del catálogo."
            }
            aside={
              isContextApartado ? (
                <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                  <MapPin className="size-3" />
                  {APARTADO_PATH[apartado]}
                </span>
              ) : undefined
            }
          >
            <div role="radiogroup" aria-label="Apartado principal" className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {APARTADOS.map((ap) => (
                <button
                  key={ap}
                  type="button"
                  role="radio"
                  aria-checked={apartado === ap}
                  onClick={() => handleApartadoChange(ap)}
                  className={`relative py-2.5 px-3 text-xs uppercase tracking-wider font-semibold border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                    isLight ? "focus-visible:ring-zinc-900" : "focus-visible:ring-zinc-200 focus-visible:ring-offset-zinc-900"
                  } ${
                    apartado === ap
                      ? isLight
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                        : "bg-white text-zinc-950 border-white shadow-md"
                      : isLight
                        ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                  } ${ap === "roms" ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  {APARTADO_LABEL[ap]}
                  {!isEditMode && defaultApartado === ap && apartado !== ap && (
                    <span className="absolute -top-1 -right-1 size-2 bg-emerald-500" title="Apartado en el que estás" />
                  )}
                </button>
              ))}
            </div>

            {isRom && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="block">
                  <span className={s.label}>Marca *</span>
                  <select value={romBrand} onChange={(e) => handleRomBrandChange(e.target.value)} className={s.input}>
                    {ROM_BRANDS.map((b) => (
                      <option key={b.name} value={b.name} className={s.option}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={s.label}>Consola *</span>
                  <select value={romConsole} onChange={(e) => handleRomConsoleChange(e.target.value)} className={s.input}>
                    {romBrandConsoles.map((co) => (
                      <option key={co.name} value={co.name} className={s.option}>
                        {co.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={s.label}>Emulador recomendado</span>
                  <input
                    type="text"
                    value={emulator}
                    onChange={(e) => markDirty(setEmulator)(e.target.value)}
                    placeholder="Ej: PCSX2"
                    maxLength={150}
                    className={s.input}
                  />
                </label>
                <p className={`${s.hint} sm:col-span-3 -mt-1`}>
                  El emulador y los requisitos se precargan según la consola. Puedes editarlos.
                </p>
              </div>
            )}
          </Section>

          {/* Información */}
          <Section isLight={isLight} title="Información" description="Lo que verá la gente en la card y en la ficha.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className={s.label}>Título *</span>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => markDirty(setTitle)(e.target.value)}
                  placeholder="Ej: Dark Souls Remastered"
                  className={s.input}
                />
              </label>
              <label className="block">
                <span className={s.label}>Género / Categoría *</span>
                <select value={genre} onChange={(e) => markDirty(setGenre)(e.target.value)} className={s.input}>
                  {Array.from(new Set([...(GENRE_SUGGESTIONS[apartado] || GENRE_SUGGESTIONS.juegos), ...(genre ? [genre] : [])])).map(
                    (g) => (
                      <option key={g} value={g} className={s.option}>
                        {g}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className={s.label}>Tamaño / Peso</span>
                <input type="text" value={size} onChange={(e) => markDirty(setSize)(e.target.value)} placeholder="Ej: 14.5 GB" className={s.input} />
              </label>
              <label className="block">
                <span className={s.label}>Versión</span>
                <input type="text" value={version} onChange={(e) => markDirty(setVersion)(e.target.value)} placeholder="Ej: v1.0.4" className={s.input} />
              </label>
              <label className="block">
                <span className={s.label}>Etiqueta</span>
                <input type="text" value={tag} onChange={(e) => markDirty(setTag)(e.target.value)} placeholder="Ej: Popular" className={s.input} />
              </label>
            </div>

            <label className="block">
              <span className={`${s.label} flex justify-between`}>
                <span>Descripción corta *</span>
                <span className="font-mono normal-case">{shortDesc.length}/2000</span>
              </span>
              <textarea
                required
                rows={3}
                maxLength={2000}
                value={shortDesc}
                onChange={(e) => markDirty(setShortDesc)(e.target.value)}
                placeholder="Breve resumen del juego, mod o herramienta..."
                className={`${s.input} resize-y min-h-[84px]`}
              />
            </label>
          </Section>

          {/* Portada + encuadre */}
          <Section
            isLight={isLight}
            title="Portada (vertical 3:4) *"
            description="Se muestra en las cards y en la ficha. Después de subirla puedes moverla y ajustar el zoom."
            aside={<SourceToggle mode={coverMode} onChange={setCoverMode} isLight={isLight} label="Origen de la portada" />}
          >
            <ImageSourceField
              isLight={isLight}
              mode={coverMode}
              deviceImage={deviceCover}
              deviceFileName={deviceCoverFileName}
              deviceFileSize={deviceCoverFileSize}
              url={urlCover}
              onUrlChange={markDirty(setUrlCover)}
              onFile={(f) => void handleCoverFile(f)}
              onRemoveDevice={() => {
                setIsDirty(true);
                setDeviceCover(null);
                setDeviceCoverFileName("");
                setDeviceCoverFileSize("");
              }}
              isProcessing={isProcessingCover}
              aspect="cover"
              dropLabel="Subir portada vertical"
              dropHint="Arrastra la imagen o haz clic. Ideal 3:4 o 2:3."
              urlPlaceholder="https://.../portada.jpg o /img/indicado.webp"
              fallback="/img/indicado.webp"
            />

            {coverPreview && (
              <CoverFramingEditor
                src={coverPreview}
                framing={coverFraming}
                onChange={(f) => {
                  setIsDirty(true);
                  setCoverFraming(f);
                }}
                isLight={isLight}
                apartado={apartado}
                title={title}
                version={version}
              />
            )}
          </Section>

          {/* Banner */}
          <Section
            isLight={isLight}
            title="Banner de cabecera (16:9, opcional)"
            description="Imagen panorámica de fondo en la parte superior de la ficha."
            aside={<SourceToggle mode={bannerMode} onChange={setBannerMode} isLight={isLight} label="Origen del banner" />}
          >
            <ImageSourceField
              isLight={isLight}
              mode={bannerMode}
              deviceImage={deviceBanner}
              deviceFileName={deviceBannerFileName}
              deviceFileSize={deviceBannerFileSize}
              url={urlBanner}
              onUrlChange={markDirty(setUrlBanner)}
              onFile={(f) => void handleBannerFile(f)}
              onRemoveDevice={() => {
                setIsDirty(true);
                setDeviceBanner(null);
                setDeviceBannerFileName("");
                setDeviceBannerFileSize("");
              }}
              isProcessing={isProcessingBanner}
              aspect="banner"
              dropLabel="Subir banner horizontal"
              dropHint="Arrastra la imagen o haz clic. Ideal 16:9 o 21:9."
              urlPlaceholder="https://.../banner.jpg"
              fallback="/img/SN-tools.jpg"
            />
          </Section>

          {/* Descarga */}
          <Section isLight={isLight} title="Descarga" description="El enlace se acorta automáticamente al guardar.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className={s.label}>Enlace de descarga</span>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => markDirty(setDownloadUrl)(e.target.value)}
                  placeholder="https://..."
                  className={s.input}
                />
              </label>
              <label className="block">
                <span className={s.label}>Desarrollador / Creador</span>
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => markDirty(setDeveloper)(e.target.value)}
                  placeholder="Ej: FromSoftware"
                  className={s.input}
                />
              </label>
            </div>
          </Section>

          {/* Requisitos (no aplica a +18) */}
          {!isAdult && (
            <Section
              isLight={isLight}
              title={isRom ? "Requisitos para emular" : "Requisitos mínimos del sistema"}
              description={isRom ? "Emulador + juego." : undefined}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    ["Procesador (CPU) *", minCpu, setMinCpu, "Ej: Intel Core i5-8400 / Ryzen 5 2600"],
                    ["Memoria RAM *", minRam, setMinRam, "Ej: 8 GB RAM"],
                    ["Almacenamiento *", minStorage, setMinStorage, "Ej: 50 GB libres"],
                    ["Sistema operativo *", minOs, setMinOs, "Ej: Windows 10 / 11 64-bit"],
                  ] as const
                ).map(([label, value, setter, placeholder]) => (
                  <label key={label} className="block">
                    <span className={s.label}>{label}</span>
                    <input
                      type="text"
                      required
                      value={value}
                      onChange={(e) => markDirty(setter)(e.target.value)}
                      placeholder={placeholder}
                      className={s.input}
                    />
                  </label>
                ))}
                <label className="block sm:col-span-2">
                  <span className={s.label}>Tarjeta gráfica (GPU) *</span>
                  <input
                    type="text"
                    required
                    value={minGpu}
                    onChange={(e) => markDirty(setMinGpu)(e.target.value)}
                    placeholder="Ej: NVIDIA GTX 1060 6GB / AMD RX 580"
                    className={s.input}
                  />
                </label>
              </div>
            </Section>
          )}

          {submitError && (
            <div role="alert" className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-medium">
              {submitError}
            </div>
          )}
        </form>

        {/* Pie fijo con acciones */}
        <div
          className={`flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-t shrink-0 ${
            isLight ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <span className={`hidden sm:inline text-[11px] ${s.muted}`}>
            {isDirty ? "Cambios sin guardar" : isEditMode ? "Sin cambios" : "Los campos con * son obligatorios"}
          </span>
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void requestClose()}
              className={`px-5 py-2.5 text-sm transition-colors cursor-pointer disabled:opacity-50 ${
                isLight ? "text-zinc-600 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="item-form"
              disabled={isBusy}
              className={`flex-1 sm:flex-none justify-center px-6 py-2.5 text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait ${
                isLight ? "bg-zinc-900 text-white hover:bg-black" : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  {isEditMode ? "Guardando..." : "Publicando..."}
                </>
              ) : isEditMode ? (
                <>
                  <Check className="size-4" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Publicar en {APARTADO_LABEL[apartado]}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <BulkJsonImportModal
        isOpen={isBulkJsonOpen}
        onClose={() => setIsBulkJsonOpen(false)}
        onLoadSingleItemIntoForm={handleLoadSingleItemIntoForm}
        onItemsImported={(items) => {
          setIsBulkJsonOpen(false);
          onBulkImported?.(items);
          onClose();
        }}
      />
    </motion.div>
  );
}
