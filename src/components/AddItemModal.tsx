import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus } from "lucide-react";
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
  const [imgUrl, setImgUrl] = useState("/img/indicado.webp");
  const [shortDesc, setShortDesc] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  if (!isOpen) return null;

  const handleApartadoChange = (newAp: Apartado) => {
    setApartado(newAp);
    setGenre(GENRE_SUGGESTIONS[newAp][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDesc.trim()) return;

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
      img: imgUrl.trim() || "/img/indicado.webp",
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
              onClick={onClose}
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

            {/* Download URL & Image URL */}
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
                  Imagen URL (opcional)
                </label>
                <input
                  type="text"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="/img/indicado.webp"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                    isLight
                      ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>

            {/* Developer */}
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
                onClick={onClose}
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
