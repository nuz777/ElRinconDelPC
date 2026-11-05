import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  HardDrive,
  Cpu,
  Layers,
  Calendar,
  CheckCircle2,
  Shield,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import type { CatalogItem } from "../data/catalog";
import { useTheme } from "../ThemeContext";
import { NativeBannerAd } from "./ads/NativeBannerAd";

interface FullscreenDetailModalProps {
  item: CatalogItem | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (item: CatalogItem) => void;
}

export default function FullscreenDetailModal({
  item,
  onClose,
  isAdmin,
  onDelete,
}: FullscreenDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getApartadoLabel = (ap: string) => {
    if (ap === "juegos") return "Juegos de PC";
    if (ap === "mods") return "Mods & Mejoras";
    return "Herramientas de PC";
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 z-[100] h-screen w-screen overflow-y-auto flex flex-col font-share select-text transition-colors duration-150 ${
          isLight
            ? "bg-zinc-100 text-zinc-900"
            : "bg-zinc-950 text-zinc-100"
        }`}
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Top Floating Action Bar */}
        <div
          className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 backdrop-blur-xl border-b transition-colors ${
            isLight
              ? "bg-white/90 border-zinc-200 shadow-sm"
              : "bg-zinc-950/85 border-zinc-800"
          }`}
        >
          <button
            onClick={onClose}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer group ${
              isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Catálogo</span>
          </button>

          <div
            className={`hidden md:flex items-center gap-2 text-xs uppercase tracking-widest ${
              isLight ? "text-zinc-500" : "text-zinc-500"
            }`}
          >
            <span>El sótano</span>
            <span>/</span>
            <span className={isLight ? "text-zinc-700" : "text-zinc-400"}>
              {getApartadoLabel(item.apartado)}
            </span>
            <span>/</span>
            <span className={isLight ? "text-zinc-700" : "text-zinc-400"}>{item.genre}</span>
            <span>/</span>
            <span className={`font-medium truncate max-w-xs ${isLight ? "text-black" : "text-white"}`}>
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(item)}
                title="Eliminar este ítem"
                className="px-3 py-1.5 rounded-xl border border-red-600/40 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline font-semibold">Eliminar</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              title="Copiar enlace"
              className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                isLight
                  ? "text-zinc-600 hover:text-black hover:bg-zinc-100 border-zinc-300"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-zinc-800"
              }`}
            >
              {copied ? <Check className="size-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-4" />}
              <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Compartir"}</span>
            </button>

            <button
              onClick={onClose}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700"
              }`}
              aria-label="Cerrar modal"
            >
              <X size={18} />
              <span className="text-xs uppercase tracking-wider hidden sm:inline">Cerrar [ESC]</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
          {/* Hero Section */}
          <div
            className={`relative rounded-3xl overflow-hidden border shadow-2xl transition-colors ${
              isLight
                ? "border-zinc-200 bg-white"
                : "border-zinc-800 bg-zinc-950"
            }`}
          >
            {/* Background Image Banner */}
            <div className="relative h-72 sm:h-96 w-full overflow-hidden">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover object-center grayscale contrast-125 filter brightness-75 scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("/img/SN-tools.jpg")) {
                    target.src = "/img/SN-tools.jpg";
                  }
                }}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${
                  isLight
                    ? "from-white via-white/80 to-transparent"
                    : "from-zinc-950 via-zinc-950/70 to-transparent"
                }`}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-r ${
                  isLight
                    ? "from-white/90 via-transparent to-white/40"
                    : "from-zinc-950/90 via-transparent to-zinc-950/50"
                }`}
              />
            </div>

            {/* Hero Details Overlay */}
            <div className="relative -mt-28 sm:-mt-36 p-6 sm:p-10 z-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-md text-[11px] uppercase tracking-widest font-bold shadow-md ${
                    isLight
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-950"
                  }`}
                >
                  {getApartadoLabel(item.apartado)}
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-[11px] uppercase tracking-widest font-semibold border ${
                    isLight
                      ? "bg-zinc-100 border-zinc-300 text-zinc-700"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {item.genre}
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-[11px] uppercase tracking-widest font-semibold flex items-center gap-1 ${
                    isLight
                      ? "bg-zinc-200 text-zinc-800"
                      : "bg-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <Sparkles className="size-3" />
                  {item.tag}
                </span>
              </div>

              <h1
                className={`text-3xl sm:text-5xl font-extrabold tracking-wide leading-tight mb-4 drop-shadow-sm ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                {item.title}
              </h1>

              <p
                className={`text-sm sm:text-lg max-w-3xl leading-relaxed mb-6 font-normal ${
                  isLight ? "text-zinc-600" : "text-zinc-300"
                }`}
              >
                {item.shortDesc}
              </p>

              {/* Meta Grid */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t ${
                  isLight ? "border-zinc-200" : "border-zinc-800/80"
                }`}
              >
                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Versión</span>
                  <span className={`text-sm font-semibold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                    {item.version}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Tamaño / Peso</span>
                  <span
                    className={`text-sm font-semibold flex items-center gap-1.5 ${
                      isLight ? "text-zinc-800" : "text-zinc-200"
                    }`}
                  >
                    <HardDrive className="size-3.5 text-zinc-400" />
                    {item.size}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Lanzamiento</span>
                  <span
                    className={`text-sm font-semibold flex items-center gap-1.5 ${
                      isLight ? "text-zinc-800" : "text-zinc-200"
                    }`}
                  >
                    <Calendar className="size-3.5 text-zinc-400" />
                    {item.releaseDate}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800"
                  }`}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Desarrollador</span>
                  <span className={`text-sm font-semibold truncate block ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                    {item.developer}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Description, Features, Installation */}
            <div className="lg:col-span-2 space-y-8">
              {/* Full Description */}
              <section
                className={`p-6 sm:p-8 rounded-2xl border shadow-xl space-y-4 transition-colors ${
                  isLight
                    ? "bg-white border-zinc-200"
                    : "bg-zinc-950 border-zinc-800"
                }`}
              >
                <h2
                  className={`text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  <Layers className="size-5 text-zinc-400" />
                  Descripción General
                </h2>
                <div className={`w-12 h-0.5 ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`} />
                <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>
                  {item.fullDesc}
                </p>
              </section>

              {/* Highlights / Features */}
              {item.features && item.features.length > 0 && (
                <section
                  className={`p-6 sm:p-8 rounded-2xl border shadow-xl space-y-4 transition-colors ${
                    isLight
                      ? "bg-white border-zinc-200"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                >
                  <h2
                    className={`text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    <CheckCircle2 className="size-5 text-zinc-400" />
                    Características Principales
                  </h2>
                  <div className={`w-12 h-0.5 ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {item.features.map((feat, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm ${
                          isLight
                            ? "bg-zinc-50 border-zinc-200 text-zinc-700"
                            : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300"
                        }`}
                      >
                        <Check className={`size-4 shrink-0 mt-0.5 ${isLight ? "text-zinc-950" : "text-white"}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Installation Steps */}
              <section
                className={`p-6 sm:p-8 rounded-2xl border shadow-xl space-y-4 transition-colors ${
                  isLight
                    ? "bg-white border-zinc-200"
                    : "bg-zinc-950 border-zinc-800"
                }`}
              >
                <h2
                  className={`text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? "text-zinc-950" : "text-white"
                  }`}
                >
                  <Cpu className="size-5 text-zinc-400" />
                  Instrucciones de Instalación
                </h2>
                <div className={`w-12 h-0.5 ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`} />
                <ol className="space-y-3 pt-2">
                  {item.installationSteps.map((step, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border ${
                        isLight
                          ? "bg-zinc-50 border-zinc-200"
                          : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center size-6 rounded-lg font-bold text-xs shrink-0 mt-0.5 ${
                          isLight
                            ? "bg-zinc-900 text-white"
                            : "bg-white text-zinc-950"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            {/* Right Column: Download Box & System Requirements */}
            <div className="space-y-8">
              {/* Primary Download Box */}
              <section
                className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl relative overflow-hidden transition-colors ${
                  isLight
                    ? "bg-white border-zinc-300"
                    : "bg-zinc-950 border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-lg font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    <Download className={`size-5 ${isLight ? "text-zinc-900" : "text-white"}`} />
                    Zona de Descarga
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                      isLight
                        ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {item.size}
                  </span>
                </div>

                <p className={`text-xs mb-6 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                  Descarga garantizada y libre de adware. Selecciona el servidor de tu preferencia:
                </p>

                <div className="space-y-3">
                  {item.downloadLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer text-left group ${
                        idx === 0
                          ? isLight
                            ? "bg-zinc-900 text-white hover:bg-black font-bold shadow-md"
                            : "bg-white text-zinc-950 hover:bg-zinc-200 font-bold shadow-lg border border-white"
                          : isLight
                          ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200"
                          : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                          {link.name}
                        </div>
                        <div
                          className={`text-[11px] ${
                            idx === 0
                              ? isLight
                                ? "text-zinc-300"
                                : "text-zinc-700"
                              : "text-zinc-500"
                          }`}
                        >
                          {link.server}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {link.badge && (
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                              idx === 0
                                ? isLight
                                  ? "bg-white text-zinc-950"
                                  : "bg-zinc-950 text-white"
                                : isLight
                                ? "bg-zinc-200 text-zinc-700"
                                : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                            }`}
                          >
                            {link.badge}
                          </span>
                        )}
                        <Download className="size-4 group-hover:translate-y-0.5 transition-transform" />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Safety Seal */}
                <div
                  className={`mt-6 pt-4 border-t flex items-center gap-2.5 text-xs ${
                    isLight ? "border-zinc-200 text-zinc-500" : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  <Shield className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verificado contra malware · Sin contraseñas ocultas</span>
                </div>
              </section>

              {/* Requirements Box */}
              {item.requirements && (
                <section
                  className={`p-6 sm:p-8 rounded-2xl border shadow-xl space-y-4 transition-colors ${
                    isLight
                      ? "bg-white border-zinc-200"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                >
                  <h2
                    className={`text-base font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-950" : "text-white"
                    }`}
                  >
                    <Cpu className="size-4 text-zinc-400" />
                    Requisitos del Sistema
                  </h2>
                  <div className={`w-12 h-0.5 ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`} />

                  <div className="space-y-3 pt-2 text-xs">
                    <div
                      className={`p-3 rounded-lg border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Sistema Operativo</span>
                      <span className={`font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {item.requirements.os}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Procesador (CPU)</span>
                      <span className={`font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {item.requirements.cpu}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Memoria RAM</span>
                      <span className={`font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {item.requirements.ram}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Tarjeta Gráfica (GPU)</span>
                      <span className={`font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {item.requirements.gpu}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-lg border ${
                        isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/60 border-zinc-800/80"
                      }`}
                    >
                      <span className="text-zinc-500 uppercase tracking-wider block text-[10px]">Almacenamiento</span>
                      <span className={`font-medium ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {item.requirements.storage}
                      </span>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Native Ad Banner dentro del detalle de descarga */}
          <NativeBannerAd />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
