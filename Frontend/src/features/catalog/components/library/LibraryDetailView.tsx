import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  Copy,
  Cpu,
  Database,
  Gamepad2,
  HardDrive,
  Heart,
  ListChecks,
  Maximize2,
  MemoryStick,
  MonitorCog,
  Puzzle,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import type { CatalogItem } from "../../domain/catalog.types";
import { APARTADO_BADGE } from "../../domain/catalogViews";
import { buildItemPath } from "../../utils/catalogUrl";
import { cleanDescription } from "../../../../shared/utils/cleanDescription";
import { dialog } from "../../../../shared/ui/dialog";
import GameModsSection from "../../../games/components/GameModsSection";
import DownloadCta from "../DownloadCta";
import DownloadHostInfo from "../DownloadHostBadge";
import FramedCover from "../FramedCover";

type DetailTab = "overview" | "requirements" | "mods";

interface LibraryDetailViewProps {
  item: CatalogItem;
  isHydrating: boolean;
  favoriteBusy: boolean;
  isLight: boolean;
  onBackToHome: () => void;
  onRemoveFavorite: (item: CatalogItem) => void;
  onOpenFullscreen: (item: CatalogItem) => void;
}

export default function LibraryDetailView({
  item,
  isHydrating,
  favoriteBusy,
  isLight,
  onBackToHome,
  onRemoveFavorite,
  onOpenFullscreen,
}: LibraryDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [copied, setCopied] = useState(false);

  const isRom = item.apartado === "roms";
  const isAdult = item.apartado === "adultos";
  const isGame = item.apartado === "juegos";
  const primaryLink = item.downloadLinks[0];
  const itemPath = buildItemPath(item);
  const backdrop = item.bannerImg || item.img;
  const description = cleanDescription(item.fullDesc || item.shortDesc);

  const resolvedTab: DetailTab =
    activeTab === "mods" && !isGame
      ? "overview"
      : activeTab === "requirements" && isAdult
        ? "overview"
        : activeTab;

  const handleCopyShareLink = async () => {
    const shareUrl = itemPath
      ? `${window.location.origin}${itemPath}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      dialog.toast("success", "Enlace copiado", "Ya puedes compartir este título.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      dialog.toast("error", "No se pudo copiar", "Inténtalo desde la ficha completa.");
    }
  };

  const stats: Array<{ icon: ReactNode; label: string; value: string }> = [
    { icon: <HardDrive className="size-4" />, label: "Peso", value: item.size },
    { icon: <Tag className="size-4" />, label: "Versión", value: item.version },
    { icon: <Calendar className="size-4" />, label: "Año", value: item.releaseDate },
    {
      icon: <User className="size-4" />,
      label: isRom ? "Consola" : "Creador",
      value: isRom ? item.console || "—" : item.developer,
    },
  ];

  const requirementRows = item.requirements
    ? [
        ...(isRom
          ? [
              {
                icon: <Gamepad2 className="size-4" />,
                label: "Emulador",
                value: item.emulator || "No especificado",
              },
            ]
          : []),
        { icon: <MonitorCog className="size-4" />, label: "Sistema Operativo", value: item.requirements.os },
        { icon: <Cpu className="size-4" />, label: "Procesador (CPU)", value: item.requirements.cpu },
        { icon: <MemoryStick className="size-4" />, label: "Memoria RAM", value: item.requirements.ram },
        { icon: <Sparkles className="size-4" />, label: "Tarjeta Gráfica", value: item.requirements.gpu },
        { icon: <Database className="size-4" />, label: "Almacenamiento", value: item.requirements.storage },
      ]
    : [];

  const actionBtn = `inline-flex items-center gap-2 px-4 py-2.5 border text-xs sm:text-sm uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
    isLight
      ? "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-black"
      : "bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white"
  }`;

  return (
    <div className="min-h-full flex flex-col">
      {/* Hero panorámico estilo Steam */}
      <header className="relative overflow-hidden border-b border-zinc-800/80">
        <div className="absolute inset-0">
          {backdrop && (
            <FramedCover
              key={backdrop}
              src={backdrop}
              alt=""
              framing={item.bannerImg ? item.bannerFraming : null}
              loading="eager"
              showLoader={false}
              className="opacity-70"
            />
          )}
          <div
            className={`absolute inset-0 ${
              isLight
                ? "bg-gradient-to-t from-[#f4f4f5] via-white/75 to-black/25"
                : "bg-gradient-to-t from-[#13161c] via-[#13161c]/70 to-black/40"
            }`}
          />
        </div>

        {/* Barra superior dentro del Hero */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-5 sm:px-8 lg:px-10 pt-5">
          <button
            type="button"
            onClick={onBackToHome}
            className={`inline-flex items-center gap-2 px-3.5 py-2 border text-xs sm:text-sm uppercase tracking-wider font-semibold backdrop-blur-md transition-colors cursor-pointer ${
              isLight
                ? "bg-white/85 border-zinc-300 text-zinc-800 hover:bg-white"
                : "bg-black/60 border-zinc-700 text-zinc-200 hover:bg-black/85 hover:text-white"
            }`}
          >
            <ArrowLeft className="size-4" />
            <span>Inicio de Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFullscreen(item)}
            title="Abrir ficha en pantalla completa"
            className={`inline-flex items-center gap-2 px-3.5 py-2 border text-xs sm:text-sm uppercase tracking-wider font-semibold backdrop-blur-md transition-colors cursor-pointer ${
              isLight
                ? "bg-white/85 border-zinc-300 text-zinc-800 hover:bg-white"
                : "bg-black/60 border-zinc-700 text-zinc-200 hover:bg-black/85 hover:text-white"
            }`}
          >
            <Maximize2 className="size-4" />
            <span className="hidden sm:inline">Pantalla completa</span>
          </button>
        </div>

        {/* Portada + Título sobre el Hero */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 pt-16 sm:pt-28 lg:pt-36 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div
              className={`relative w-36 sm:w-44 lg:w-52 aspect-[3/4] shrink-0 overflow-hidden border-2 shadow-2xl ${
                isLight ? "border-white bg-white" : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <FramedCover
                src={item.img}
                alt={`Portada de ${item.title}`}
                framing={item.coverFraming}
                loading="eager"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider font-bold border ${
                    isAdult
                      ? "bg-rose-600 text-white border-rose-500"
                      : isLight
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {APARTADO_BADGE[item.apartado]}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider border ${
                    isLight
                      ? "bg-white/80 border-zinc-300 text-zinc-700"
                      : "bg-black/50 border-zinc-700 text-zinc-300"
                  }`}
                >
                  {isRom && item.console ? `${item.brand} · ${item.console}` : item.genre}
                </span>
                {item.tag && (
                  <span
                    className={`px-2.5 py-1 text-xs uppercase tracking-wider border ${
                      isLight
                        ? "bg-white/80 border-zinc-300 text-zinc-600"
                        : "bg-black/50 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {item.tag}
                  </span>
                )}
              </div>

              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-wide leading-tight ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                {item.title}
              </h1>

              {isHydrating && (
                <p className="text-xs font-mono text-emerald-400 animate-pulse">
                  Sincronizando detalles completos...
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Acción Steam (Descarga + Stats + Botones) */}
      <section
        className={`border-b ${
          isLight
            ? "bg-white border-zinc-200"
            : "bg-[#191d26]/90 border-zinc-800/90"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="w-full lg:w-auto lg:min-w-[300px] lg:max-w-md">
            <DownloadCta
              href={primaryLink?.url ?? "#"}
              apartado={item.apartado}
              detail={primaryLink ? `${primaryLink.server} · ${item.size}` : item.size}
              isLight={isLight}
              size="lg"
            />
            <DownloadHostInfo hosts={item.downloadHosts} isLight={isLight} />
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {stats.map((st) => (
              <div key={st.label} className="min-w-[84px]">
                <span
                  className={`flex items-center gap-1.5 text-xs uppercase tracking-widest ${
                    isLight ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {st.icon}
                  {st.label}
                </span>
                <p
                  className={`text-sm sm:text-base font-bold mt-0.5 ${
                    isLight ? "text-zinc-900" : "text-zinc-100"
                  }`}
                >
                  {st.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={favoriteBusy}
              onClick={() => onRemoveFavorite(item)}
              title="Quitar de tu biblioteca"
              className={`${actionBtn} border-rose-500/40 text-rose-500 hover:bg-rose-500/10 disabled:opacity-50`}
            >
              <Heart className="size-4 fill-current" />
              <span>En biblioteca</span>
            </button>

            <button type="button" onClick={() => void handleCopyShareLink()} className={actionBtn}>
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
              <span>{copied ? "Copiado" : "Compartir"}</span>
            </button>
          </div>
        </div>

        {/* Pestañas internas estilo Steam */}
        <div
          className={`max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 flex items-center gap-2 border-t ${
            isLight ? "border-zinc-200" : "border-zinc-800/80"
          }`}
        >
          {(
            [
              { id: "overview", label: "Resumen" },
              ...(!isAdult ? [{ id: "requirements", label: "Requisitos" }] : []),
              ...(isGame ? [{ id: "mods", label: "Mods de la comunidad" }] : []),
            ] as Array<{ id: DetailTab; label: string }>
          ).map((tab) => {
            const active = resolvedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm uppercase tracking-wider font-bold border-b-2 transition-colors cursor-pointer ${
                  active
                    ? isLight
                      ? "border-zinc-900 text-zinc-950"
                      : "border-emerald-400 text-white"
                    : isLight
                      ? "border-transparent text-zinc-500 hover:text-zinc-900"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Contenido de la pestaña activa */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-6">
        {resolvedTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <section
                className={`p-6 sm:p-7 border ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
                }`}
              >
                <h2 className="flex items-center gap-2.5 text-base sm:text-lg uppercase tracking-wider font-bold mb-4">
                  <BookOpen className="size-5 text-emerald-400" />
                  <span>Acerca de este título</span>
                </h2>
                <p
                  className={`text-base leading-relaxed whitespace-pre-line ${
                    isLight ? "text-zinc-700" : "text-zinc-300"
                  }`}
                >
                  {description || "Sin descripción disponible."}
                </p>
              </section>

              {item.features.length > 0 && (
                <section
                  className={`p-6 sm:p-7 border ${
                    isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
                  }`}
                >
                  <h2 className="flex items-center gap-2.5 text-base sm:text-lg uppercase tracking-wider font-bold mb-4">
                    <Sparkles className="size-5 text-emerald-400" />
                    <span>Características destacadas</span>
                  </h2>
                  <ul className="space-y-2.5 text-base">
                    {item.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-3 ${
                          isLight ? "text-zinc-700" : "text-zinc-300"
                        }`}
                      >
                        <span className="mt-2 size-2 bg-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className="lg:col-span-5 space-y-6">
              {item.installationSteps.length > 0 && (
                <section
                  className={`p-6 sm:p-7 border ${
                    isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
                  }`}
                >
                  <h2 className="flex items-center gap-2.5 text-base sm:text-lg uppercase tracking-wider font-bold mb-4">
                    <ListChecks className="size-5 text-sky-400" />
                    <span>Guía rápida de instalación</span>
                  </h2>
                  <ol className="space-y-3 text-base">
                    {item.installationSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-3 ${
                          isLight ? "text-zinc-700" : "text-zinc-300"
                        }`}
                      >
                        <span
                          className={`grid place-items-center size-6 text-xs font-bold font-mono shrink-0 border ${
                            isLight
                              ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                              : "bg-zinc-950 border-zinc-700 text-emerald-300"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        )}

        {resolvedTab === "requirements" && !isAdult && (
          <section
            className={`p-6 sm:p-7 border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
            }`}
          >
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg uppercase tracking-wider font-bold mb-5">
              <Cpu className="size-5 text-emerald-400" />
              <span>{isRom ? "Requisitos de emulación" : "Requisitos mínimos del sistema"}</span>
            </h2>

            {requirementRows.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requirementRows.map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-start gap-3.5 p-4 border ${
                      isLight
                        ? "bg-zinc-50 border-zinc-200"
                        : "bg-zinc-950/70 border-zinc-800"
                    }`}
                  >
                    <span className="mt-0.5 text-emerald-400 shrink-0">{row.icon}</span>
                    <div className="min-w-0">
                      <span
                        className={`block text-xs uppercase tracking-widest ${
                          isLight ? "text-zinc-500" : "text-zinc-400"
                        }`}
                      >
                        {row.label}
                      </span>
                      <p
                        className={`text-base font-semibold mt-0.5 break-words ${
                          isLight ? "text-zinc-900" : "text-zinc-100"
                        }`}
                      >
                        {row.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-base ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                {isHydrating
                  ? "Cargando requisitos mínimos..."
                  : "No hay requisitos específicos registrados para este título."}
              </p>
            )}
          </section>
        )}

        {resolvedTab === "mods" && isGame && (
          <section
            className={`p-6 sm:p-7 border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
            }`}
          >
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg uppercase tracking-wider font-bold mb-5">
              <Puzzle className="size-5 text-emerald-400" />
              <span>Mods compatibles</span>
            </h2>
            <GameModsSection gameId={item.id} gamePath={itemPath} isLight={isLight} />
          </section>
        )}
      </div>
    </div>
  );
}
