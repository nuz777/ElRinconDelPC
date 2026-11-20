import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  X,
  HardDrive,
  Cpu,
  Calendar,
  Shield,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Pencil,
  Tag,
  User,
  MemoryStick,
  MonitorCog,
  Database,
  Gamepad2,
  BookOpen,
  ListChecks,
  Wrench,
  ChevronRight,
} from "lucide-react";
import type { Apartado, CatalogItem } from "../domain/catalog.types";
import { useTheme } from "../../../shared/context/useTheme";
import { catalogService } from "../api/catalog.service";
import { NativeBannerAd } from "../../ads/NativeBannerAd";
import GameModsSection from "../../games/components/GameModsSection";
import { buildItemPath } from "../utils/catalogUrl";
import FramedCover from "./FramedCover";
import DownloadCta from "./DownloadCta";
import { APARTADO_NOUN } from "../domain/catalogViews";
import { dialog, isDialogOpen } from "../../../shared/ui/dialog";

interface FullscreenDetailModalProps {
  item: CatalogItem | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (item: CatalogItem) => void;
  onEdit?: (item: CatalogItem) => void;
  disableEscape?: boolean;
  onNavigateRoot?: () => void;
  onNavigateApartado?: (apartado: Apartado, brand?: string | null, consoleName?: string | null) => void;
  onNavigateGenre?: (
    genre: string,
    apartado: Apartado,
    brand?: string | null,
    consoleName?: string | null,
  ) => void;
}

const APARTADO_LABEL: Record<Apartado, string> = {
  juegos: "Juegos de PC",
  mods: "Mods & Mejoras",
  herramientas: "Herramientas de PC",
  roms: "ROMs",
  adultos: "+18 Para Adultos",
};

/** Tarjeta de sección de la ficha: mismo lenguaje visual del sitio (bordes rectos, zinc). */
function Panel({
  icon,
  title,
  isLight,
  children,
  id,
}: {
  icon: ReactNode;
  title: string;
  isLight: boolean;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`p-5 sm:p-7 border transition-colors ${
        isLight ? "bg-white/90 border-zinc-200" : "bg-zinc-950/70 border-zinc-800 backdrop-blur-sm"
      }`}
    >
      <h2
        className={`flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-wide mb-4 ${
          isLight ? "text-zinc-950" : "text-white"
        }`}
      >
        <span
          className={`grid place-items-center size-8 border ${
            isLight ? "bg-zinc-100 border-zinc-200 text-zinc-700" : "bg-zinc-900 border-zinc-800 text-zinc-300"
          }`}
        >
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function FullscreenDetailModal({
  item: baseItem,
  onClose,
  isAdmin,
  onDelete,
  onEdit,
  disableEscape,
  onNavigateRoot,
  onNavigateApartado,
  onNavigateGenre,
}: FullscreenDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [hydratedState, setHydratedState] = useState<{ id: string; item: CatalogItem } | null>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!baseItem) return;
    let cancelled = false;
    const loader = baseItem.publicCode
      ? catalogService.getItemByCode(baseItem.publicCode)
      : catalogService.getItemById(baseItem.id);

    loader
      .then((fullItem) => {
        if (!cancelled && fullItem) setHydratedState({ id: baseItem.id, item: fullItem });
      })
      .catch(() => {
        // Se mantiene la ficha base si falla la hidratación
      });

    return () => {
      cancelled = true;
    };
  }, [baseItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableEscape && !isDialogOpen()) onClose();
    };
    if (baseItem) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [baseItem, onClose, disableEscape]);

  if (!baseItem) return null;

  const item = hydratedState && hydratedState.id === baseItem.id ? hydratedState.item : baseItem;
  const noun = APARTADO_NOUN[item.apartado];
  const isAdult = item.apartado === "adultos";
  const isRom = item.apartado === "roms";
  const primaryLink = item.downloadLinks[0];
  const backdrop = item.bannerImg || item.img;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      dialog.toast("success", "Enlace copiado", "Ya puedes pegarlo donde quieras.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      dialog.toast("error", "No se pudo copiar el enlace", "Cópialo desde la barra de direcciones.");
    }
  };

  const muted = isLight ? "text-zinc-500" : "text-zinc-400";
  const strong = isLight ? "text-zinc-950" : "text-white";
  const body = isLight ? "text-zinc-700" : "text-zinc-300";

  const stats: Array<{ icon: ReactNode; label: string; value: string }> = [
    { icon: <HardDrive className="size-4" />, label: "Peso", value: item.size },
    { icon: <Tag className="size-4" />, label: "Versión", value: item.version },
    { icon: <Calendar className="size-4" />, label: "Año", value: item.releaseDate },
    { icon: <User className="size-4" />, label: isRom ? "Consola" : "Creador", value: isRom ? item.console || "—" : item.developer },
  ];

  const requirementRows = item.requirements
    ? [
        ...(isRom ? [{ icon: <Gamepad2 className="size-4" />, label: "Emulador", value: item.emulator || "No especificado" }] : []),
        { icon: <MonitorCog className="size-4" />, label: "Sistema", value: item.requirements.os },
        { icon: <Cpu className="size-4" />, label: "Procesador", value: item.requirements.cpu },
        { icon: <MemoryStick className="size-4" />, label: "Memoria RAM", value: item.requirements.ram },
        { icon: <Sparkles className="size-4" />, label: "Gráfica", value: item.requirements.gpu },
        { icon: <Database className="size-4" />, label: "Espacio", value: item.requirements.storage },
      ]
    : [];

  const iconButton = `inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors cursor-pointer ${
    isLight
      ? "text-zinc-700 hover:text-black hover:bg-zinc-100 border-zinc-300 bg-white/70"
      : "text-zinc-300 hover:text-white hover:bg-zinc-800/80 border-zinc-700 bg-zinc-950/60"
  }`;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${item.title}`}
        className={`fixed inset-0 z-[100] h-dvh w-screen overflow-y-auto overflow-x-hidden flex flex-col font-share select-text ${
          isLight ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-zinc-100"
        }`}
        // Solo opacidad: un transform en este contenedor rompería el fondo `fixed`
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
      >
        {/* Fondo inmersivo: el banner difuminado ocupa toda la vista */}
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
          <img
            src={backdrop}
            alt=""
            className={`w-full h-full object-cover scale-110 blur-3xl ${isLight ? "opacity-25" : "opacity-30"}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div
            className={`absolute inset-0 ${
              isLight ? "bg-gradient-to-b from-zinc-100/40 via-zinc-100/80 to-zinc-100" : "bg-gradient-to-b from-zinc-950/30 via-zinc-950/80 to-zinc-950"
            }`}
          />
        </div>

        {/* Barra superior */}
        <div
          className={`sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 backdrop-blur-xl border-b ${
            isLight ? "bg-white/80 border-zinc-200" : "bg-zinc-950/70 border-zinc-800/80"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer group shrink-0 ${
              isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Volver al catálogo</span>
            <span className="sm:hidden">Volver</span>
          </button>

          <nav aria-label="Ruta de navegación" className={`hidden lg:flex items-center gap-1.5 text-xs min-w-0 ${muted}`}>
            <button type="button" onClick={onNavigateRoot} className="hover:underline cursor-pointer shrink-0">
              El sótano
            </button>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <button
              type="button"
              onClick={() => onNavigateApartado?.(item.apartado, item.brand, item.console)}
              className="hover:underline cursor-pointer shrink-0"
            >
              {APARTADO_LABEL[item.apartado]}
            </button>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            {isRom && item.console ? (
              <button
                type="button"
                onClick={() => onNavigateApartado?.("roms", item.brand, item.console)}
                className="hover:underline cursor-pointer shrink-0"
              >
                {item.brand} / {item.console}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateGenre?.(item.genre, item.apartado, item.brand, item.console)}
                className="hover:underline cursor-pointer shrink-0"
              >
                {item.genre}
              </button>
            )}
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            <span className={`font-bold truncate ${strong}`}>{item.title}</span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                title="Editar este ítem"
                className="px-3 py-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Pencil className="size-4" />
                <span className="hidden sm:inline font-semibold">Editar</span>
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                title="Eliminar este ítem"
                className="px-3 py-1.5 border border-red-600/40 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline font-semibold">Eliminar</span>
              </button>
            )}
            <button type="button" onClick={() => void handleCopyLink()} title="Copiar enlace" className={iconButton}>
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              <span className="hidden sm:inline">{copied ? "Copiado" : "Compartir"}</span>
            </button>
            <button type="button" onClick={onClose} aria-label="Cerrar ficha" className={iconButton}>
              <X className="size-4" />
              <span className="hidden md:inline uppercase tracking-wider">Esc</span>
            </button>
          </div>
        </div>

        {/* Hero: banner + portada + datos + descarga, todo a la vista */}
        <header className="relative z-10">
          <div className="absolute inset-x-0 top-0 h-[22rem] sm:h-[28rem] overflow-hidden" aria-hidden>
            <FramedCover
              src={backdrop}
              alt=""
              framing={item.bannerImg ? item.bannerFraming : null}
              loading="eager"
              showLoader={false}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                isLight ? "from-zinc-100 via-zinc-100/70 to-zinc-100/10" : "from-zinc-950 via-zinc-950/70 to-zinc-950/10"
              }`}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-40 sm:pt-56 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,15rem)_1fr] lg:grid-cols-[minmax(0,16rem)_1fr] gap-6 lg:gap-10 items-end">
              {/* Portada */}
              <div
                className={`relative group w-40 sm:w-52 md:w-full aspect-[3/4] overflow-hidden border-2 shadow-2xl mx-auto md:mx-0 ${
                  isLight ? "bg-white border-white shadow-zinc-400/50" : "bg-zinc-900 border-zinc-700 shadow-black/70"
                }`}
              >
                <FramedCover
                  src={item.img}
                  alt={`Portada de ${item.title}`}
                  framing={item.coverFraming}
                  loading="eager"
                  hoverClassName="transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Título y datos */}
              <div className="min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 text-[11px] uppercase tracking-widest font-bold ${
                      isAdult ? "bg-rose-600 text-white" : isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
                    }`}
                  >
                    {APARTADO_LABEL[item.apartado]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateGenre?.(item.genre, item.apartado, item.brand, item.console)}
                    className={`px-2.5 py-1 text-[11px] uppercase tracking-widest font-semibold border cursor-pointer transition-colors ${
                      isLight
                        ? "bg-white/80 border-zinc-300 text-zinc-700 hover:border-zinc-500"
                        : "bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {item.genre}
                  </button>
                  {item.tag && (
                    <span
                      className={`px-2.5 py-1 text-[11px] uppercase tracking-widest font-semibold inline-flex items-center gap-1 ${
                        isLight ? "bg-amber-100 text-amber-800" : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      <Sparkles className="size-3" aria-hidden />
                      {item.tag}
                    </span>
                  )}
                </div>

                <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-wide leading-[1.05] text-balance ${strong}`}>
                  {item.title}
                </h1>

                <p className={`mt-3 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto md:mx-0 line-clamp-3 ${body}`}>
                  {item.shortDesc}
                </p>

                <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className={`px-3 py-2.5 border text-left ${
                        isLight ? "bg-white/80 border-zinc-200" : "bg-zinc-900/70 border-zinc-800 backdrop-blur-sm"
                      }`}
                    >
                      <dt className={`flex items-center gap-1.5 text-[11px] ${muted}`}>
                        {s.icon}
                        {s.label}
                      </dt>
                      <dd className={`mt-0.5 text-sm font-semibold truncate ${strong}`} title={s.value}>
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 lg:gap-10 items-start">
          <div className="space-y-6 min-w-0">
            <Panel isLight={isLight} icon={<BookOpen className="size-4" />} title={`Acerca de este ${noun}`}>
              <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${body}`}>{item.fullDesc}</p>
            </Panel>

            {item.features && item.features.length > 0 && (
              <Panel isLight={isLight} icon={<ListChecks className="size-4" />} title="Lo que incluye">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {item.features.map((feat, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2.5 p-3 border text-sm ${
                        isLight ? "bg-zinc-50 border-zinc-200 text-zinc-700" : "bg-zinc-900/50 border-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span className="grid place-items-center size-5 shrink-0 bg-emerald-500/15 text-emerald-500 mt-px">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel isLight={isLight} icon={<Wrench className="size-4" />} title="Cómo instalarlo">
              <ol className="relative">
                {item.installationSteps.map((step, idx) => {
                  const last = idx === item.installationSteps.length - 1;
                  return (
                    <li key={idx} className="relative flex gap-4 pb-5 last:pb-0">
                      {!last && (
                        <span
                          className={`absolute left-[13px] top-8 bottom-1 w-px ${isLight ? "bg-zinc-300" : "bg-zinc-700"}`}
                          aria-hidden
                        />
                      )}
                      <span
                        className={`relative grid place-items-center size-7 shrink-0 text-xs font-bold ${
                          isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p className={`pt-1 text-sm leading-relaxed ${body}`}>{step}</p>
                    </li>
                  );
                })}
              </ol>
            </Panel>

            {item.apartado === "juegos" && (
              <GameModsSection gameId={item.id} gamePath={buildItemPath(item)} isLight={isLight} />
            )}
          </div>

          {/* Columna lateral fija */}
          <aside className="order-first lg:order-none space-y-6 lg:sticky lg:top-20">
            <section
              className={`p-5 sm:p-6 border transition-colors ${
                isLight ? "bg-white/90 border-zinc-200" : "bg-zinc-950/70 border-zinc-800 backdrop-blur-sm"
              }`}
            >
              <h2 className={`text-base font-bold tracking-wide ${strong}`}>Zona de descarga</h2>
              <p className={`mt-1 mb-5 text-xs leading-relaxed ${muted}`}>
                Descarga directa desde nuestro servidor. Si el enlace falla, avísanos en el chat.
              </p>
              <DownloadCta
                href={primaryLink?.url ?? "#"}
                apartado={item.apartado}
                detail={`${item.size}, ${item.version}`}
                isLight={isLight}
                size="md"
              />
              <p className={`mt-3 flex items-center gap-1.5 text-[11px] ${muted}`}>
                <Shield className="size-3.5 text-emerald-500 shrink-0" aria-hidden />
                Revisado contra malware, sin contraseñas ocultas
              </p>
              {item.downloadLinks.slice(1).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 flex items-center justify-between p-3 border text-sm transition-colors ${
                    isLight ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-200" : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800"
                  }`}
                >
                  <span>{link.name}</span>
                  <span className={`text-[11px] ${muted}`}>{link.server}</span>
                </a>
              ))}
            </section>

            {!isAdult && requirementRows.length > 0 && (
              <section
                id="requisitos"
                className={`p-5 sm:p-6 border transition-colors ${
                  isLight ? "bg-white/90 border-zinc-200" : "bg-zinc-950/70 border-zinc-800 backdrop-blur-sm"
                }`}
              >
                <h2 className={`text-base font-bold tracking-wide mb-4 ${strong}`}>
                  {isRom ? "Requisitos para emular" : "Requisitos mínimos"}
                </h2>
                <dl className={`divide-y ${isLight ? "divide-zinc-200" : "divide-zinc-800"}`}>
                  {requirementRows.map((r) => (
                    <div key={r.label} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className={`mt-0.5 shrink-0 ${muted}`}>{r.icon}</span>
                      <div className="min-w-0">
                        <dt className={`text-[11px] ${muted}`}>{r.label}</dt>
                        <dd className={`text-sm font-medium break-words ${strong}`}>{r.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </aside>
        </div>

        <div className="relative z-10">
          <NativeBannerAd />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
