import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Upload,
  Link as LinkIcon,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { Apartado, CatalogItem } from "../data/catalog";
import { useTheme } from "../ThemeContext";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: CatalogItem) => void;
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
};

// Optimiza la imagen de forma cliente para no saturar localStorage y mantener 120 FPS
async function optimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
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
}: AddItemModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [apartado, setApartado] = useState<Apartado>("juegos");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(GENRE_SUGGESTIONS.juegos[0]);
  const [tag, setTag] = useState("Nuevo");
  const [size, setSize] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [developer, setDeveloper] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // Portada (dispositivo local o url)
  const [imageMode, setImageMode] = useState<"device" | "url">("device");
  const [deviceImage, setDeviceImage] = useState<string | null>(null);
  const [deviceFileName, setDeviceFileName] = useState("");
  const [deviceFileSize, setDeviceFileSize] = useState("");
  const [urlImage, setUrlImage] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setGenre(GENRE_SUGGESTIONS.juegos[0]);
    setTag("Nuevo");
    setSize("");
    setVersion("v1.0");
    setDeveloper("");
    setDeviceImage(null);
    setDeviceFileName("");
    setDeviceFileSize("");
    setUrlImage("");
    setImageMode("device");
    setShortDesc("");
    setDownloadUrl("");
  };

  const handleApartadoChange = (newAp: Apartado) => {
    setApartado(newAp);
    setGenre(GENRE_SUGGESTIONS[newAp][0]);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP, etc.).");
      return;
    }
    try {
      setIsProcessingImage(true);
      const optimized = await optimizeImageFile(file);
      setDeviceImage(optimized);
      setDeviceFileName(file.name);
      const kb = (file.size / 1024).toFixed(0);
      setDeviceFileSize(`${kb} KB`);
    } catch (err) {
      console.error("Error optimizando imagen:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDeviceImage(e.target?.result as string);
        setDeviceFileName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveDeviceImage = () => {
    setDeviceImage(null);
    setDeviceFileName("");
    setDeviceFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDesc.trim()) return;

    let finalImg = "/img/indicado.webp";
    if (imageMode === "device" && deviceImage) {
      finalImg = deviceImage;
    } else if (imageMode === "url" && urlImage.trim()) {
      finalImg = urlImage.trim();
    } else if (deviceImage) {
      finalImg = deviceImage;
    } else if (urlImage.trim()) {
      finalImg = urlImage.trim();
    }

    const newItem: CatalogItem = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      apartado,
      genre: genre.trim(),
      tag: tag.trim() || "Añadido",
      version: version.trim() || "v1.0",
      size: size.trim() || "1.0 GB",
      releaseDate: new Date().getFullYear().toString(),
      developer: developer.trim() || "Comunidad El Sótano",
      img: finalImg,
      shortDesc: shortDesc.trim(),
      fullDesc: `${shortDesc.trim()} Añadido recientemente a la biblioteca de El sótano del pc por la comunidad.`,
      features: [
        "Probado y verificado en Windows 10 y Windows 11",
        "Optimizado para bajo consumo de recursos",
        "Instalación limpia y rápida",
      ],
      requirements: {
        os: "Windows 10 / 11 64-bit",
        cpu: "Procesador de 2 o 4 núcleos",
        ram: "4 GB RAM",
        gpu: "GPU compatible con DirectX 11",
        storage: size.trim() || "2 GB libres",
      },
      downloadLinks: [
        {
          name: "Descarga Directa",
          type: "direct",
          url: downloadUrl.trim() || "https://supertools-k.vercel.app/games",
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

    onAddItem(newItem);
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-share">
        <motion.div
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 sm:p-8 border transition-colors ${
            isLight
              ? "bg-white border-zinc-200 text-zinc-900"
              : "bg-zinc-950 border-zinc-800 text-zinc-100"
          }`}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-4 border-b mb-6 ${
              isLight ? "border-zinc-200" : "border-zinc-800"
            }`}
          >
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
              <div className="grid grid-cols-3 gap-2">
                {(["juegos", "mods", "herramientas"] as Apartado[]).map((ap) => (
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
                    {ap === "juegos" ? "Juegos" : ap === "mods" ? "Mods" : "Herramientas"}
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
                  {GENRE_SUGGESTIONS[apartado].map((g) => (
                    <option key={g} value={g} className={isLight ? "bg-white text-zinc-900" : "bg-zinc-900 text-zinc-100"}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            {/* Portada / Subir imagen o URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className={`block text-xs uppercase tracking-wider font-semibold ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  Portada del Item
                </label>
                {/* Selector de modo: Dispositivo vs URL */}
                <div
                  className={`inline-flex p-0.5 rounded-lg border text-xs font-semibold ${
                    isLight
                      ? "bg-zinc-100 border-zinc-200"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setImageMode("device")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      imageMode === "device"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Upload className="size-3.5" />
                    <span>Mi Dispositivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      imageMode === "url"
                        ? isLight
                          ? "bg-white text-zinc-950 shadow-sm"
                          : "bg-zinc-800 text-white shadow-sm"
                        : isLight
                        ? "text-zinc-500 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <LinkIcon className="size-3.5" />
                    <span>Enlace URL</span>
                  </button>
                </div>
              </div>

              {/* Subir archivo desde PC / Dispositivo */}
              {imageMode === "device" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {deviceImage ? (
                    <div
                      className={`relative flex items-center gap-4 p-3 rounded-xl border ${
                        isLight
                          ? "bg-zinc-50 border-zinc-200"
                          : "bg-zinc-900/80 border-zinc-800"
                      }`}
                    >
                      {/* Vista previa miniatura */}
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-zinc-700/40 bg-black/40">
                        <img
                          src={deviceImage}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Detalles */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Check className="size-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold truncate">
                            {deviceFileName || "Imagen cargada"}
                          </p>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            isLight ? "text-zinc-500" : "text-zinc-400"
                          }`}
                        >
                          {deviceFileSize ? `${deviceFileSize} • ` : ""}Optimizada para alto rendimiento
                        </p>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isLight
                              ? "border-zinc-300 hover:bg-zinc-200 text-zinc-700"
                              : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          }`}
                          title="Cambiar imagen"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDeviceImage}
                          className="p-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs transition-colors cursor-pointer"
                          title="Quitar imagen"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`group flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isDragOver
                          ? isLight
                            ? "border-zinc-900 bg-zinc-100"
                            : "border-white bg-zinc-900"
                          : isLight
                          ? "border-zinc-300 hover:border-zinc-500 bg-zinc-50/70 hover:bg-zinc-100/70"
                          : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/40 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-full mb-2 transition-transform group-hover:scale-110 ${
                          isLight ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        <Upload className="size-4" />
                      </div>
                      <p className="text-xs font-semibold text-center mb-0.5">
                        {isProcessingImage
                          ? "Procesando imagen..."
                          : "Haz clic para subir desde tu PC o arrastra la imagen aquí"}
                      </p>
                      <p
                        className={`text-[11px] text-center ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        PNG, JPG, WEBP o GIF (Optimizada automáticamente)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subir vía URL */}
              {imageMode === "url" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlImage}
                      onChange={(e) => setUrlImage(e.target.value)}
                      placeholder="/img/indicado.webp o https://ejemplo.com/portada.jpg"
                      className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                        isLight
                          ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                          : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                      }`}
                    />
                    {urlImage.trim() && (
                      <button
                        type="button"
                        onClick={() => setUrlImage("")}
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

                  {urlImage.trim() && (
                    <div
                      className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                        isLight
                          ? "bg-zinc-50 border-zinc-200"
                          : "bg-zinc-900/60 border-zinc-800"
                      }`}
                    >
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-700/30 bg-black/40">
                        <img
                          src={urlImage}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/img/indicado.webp";
                          }}
                        />
                      </div>
                      <div className="text-[11px] truncate flex-1">
                        <span className="font-semibold block">Vista previa de enlace</span>
                        <span className={isLight ? "text-zinc-500" : "text-zinc-400"}>
                          {urlImage}
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

            {/* Submit & Cancel */}
            <div
              className={`pt-4 border-t flex items-center justify-end gap-3 ${
                isLight ? "border-zinc-200" : "border-zinc-800"
              }`}
            >
              <button
                type="button"
                onClick={handleClose}
                className={`px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                  isLight
                    ? "text-zinc-600 hover:text-black hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? "bg-zinc-900 text-white hover:bg-black"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
                }`}
              >
                <Plus className="size-4" />
                Guardar en el Catálogo
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
