import { Download, HardDrive, Pencil, Trash2 } from "lucide-react";
import { APARTADO_BADGE } from "../domain/catalogViews";
import type { CatalogItem } from "../domain/catalog.types";
import FramedCover from "./FramedCover";
import { playDetailOpenSound } from "../../../shared/utils/playDetailOpenSound";

interface CatalogCardProps {
  item: CatalogItem;
  isLight: boolean;
  isAdmin?: boolean;
  onSelect: (item: CatalogItem) => void;
  onEdit?: (item: CatalogItem) => void;
  onDelete?: (item: CatalogItem) => void;
}

export default function CatalogCard({
  item,
  isLight,
  isAdmin = false,
  onSelect,
  onEdit,
  onDelete,
}: CatalogCardProps) {
  const handleOpen = () => {
    playDetailOpenSound();
    onSelect(item);
  };

  return (
    <div
      onClick={handleOpen}
      aria-label={`Ver detalles de ${item.title}`}
      className={`group flex flex-col border overflow-hidden shadow-sm hover:shadow-md transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isLight ? "focus-visible:ring-zinc-900 focus-visible:ring-offset-white" : "focus-visible:ring-zinc-200 focus-visible:ring-offset-zinc-950"
      } ${
        isLight
          ? "bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-100"
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      {/* Card Image Thumbnail (Portada Vertical 3:4) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        <FramedCover
          src={item.img}
          alt={item.title}
          framing={item.coverFraming}
          hoverClassName="transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
              className={`px-1.5 sm:px-2 py-0.5  text-[9px] sm:text-[10px] uppercase font-bold tracking-wider border shadow-sm ${
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
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  title="Editar este elemento"
                  aria-label={`Editar ${item.title}`}
                  className="p-1 sm:p-1.5  bg-amber-500/90 hover:bg-amber-500 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                >
                  <Pencil className="size-3 sm:size-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  title="Eliminar elemento del catálogo"
                  aria-label={`Eliminar ${item.title}`}
                  className="p-1 sm:p-1.5  bg-red-600/90 hover:bg-red-600 text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                >
                  <Trash2 className="size-3 sm:size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Tag */}
        <div className="absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 pointer-events-none max-w-[85%]">
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 bg-black/85 px-1.5 sm:px-2 py-0.5  truncate inline-block max-w-full">
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
}
