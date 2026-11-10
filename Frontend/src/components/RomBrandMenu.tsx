import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { ROM_BRANDS, romCountKey, type RomBrand } from "../data/romPlatforms";

interface RomBrandMenuProps {
  /** Consola activa (si la vista actual es un listado de ROMs). */
  activeBrand?: string | null;
  activeConsole?: string | null;
  /** Cantidad de ROMs por "Marca::Consola" para mostrar al lado de cada consola. */
  counts: Record<string, number>;
  onSelect: (brand: string, consoleName: string) => void;
  isLight: boolean;
  /** popover: marcas a la izquierda y consolas a la derecha · drawer: lista vertical. */
  variant: "popover" | "drawer";
}

/** Marcas con sus consolas; al elegir una consola se muestran sus ROMs. */
export default function RomBrandMenu(props: RomBrandMenuProps) {
  return props.variant === "popover" ? <PopoverMenu {...props} /> : <DrawerMenu {...props} />;
}

function ConsoleButton({
  brand,
  consoleName,
  isActive,
  count,
  isLight,
  onSelect,
}: {
  brand: string;
  consoleName: string;
  isActive: boolean;
  count: number;
  isLight: boolean;
  onSelect: (brand: string, consoleName: string) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(brand, consoleName)}
      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
        isActive
          ? isLight
            ? "bg-zinc-900 text-white font-bold"
            : "bg-white text-zinc-950 font-bold"
          : isLight
          ? "text-zinc-700 hover:bg-zinc-100 hover:text-black"
          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      <span className="truncate">{consoleName}</span>
      <span className="flex items-center gap-1 shrink-0">
        {count > 0 && (
          <span
            className={`text-[10px] font-mono px-1.5 rounded ${
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
        )}
        {isActive && <Check className="size-3.5" />}
      </span>
    </button>
  );
}

const brandRomCount = (brand: RomBrand, counts: Record<string, number>) =>
  brand.consoles.reduce((sum, co) => sum + (counts[romCountKey(brand.name, co.name)] ?? 0), 0);

/** Escritorio: columna de marcas (hover/click) + consolas de la marca en dos columnas. */
function PopoverMenu({ activeBrand, activeConsole, counts, onSelect, isLight }: RomBrandMenuProps) {
  const [hoveredBrand, setHoveredBrand] = useState(activeBrand ?? ROM_BRANDS[0].name);
  const brand = ROM_BRANDS.find((b) => b.name === hoveredBrand) ?? ROM_BRANDS[0];

  return (
    <div className="flex gap-3">
      {/* Marcas */}
      <div
        className={`w-36 shrink-0 space-y-0.5 pr-3 border-r ${
          isLight ? "border-zinc-200" : "border-zinc-800"
        }`}
      >
        {ROM_BRANDS.map((b) => {
          const isHovered = b.name === brand.name;
          const total = brandRomCount(b, counts);
          return (
            <button
              key={b.name}
              type="button"
              onMouseEnter={() => setHoveredBrand(b.name)}
              onFocus={() => setHoveredBrand(b.name)}
              onClick={() => setHoveredBrand(b.name)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                isHovered
                  ? isLight
                    ? "bg-zinc-100 text-zinc-950"
                    : "bg-zinc-800 text-white"
                  : isLight
                  ? "text-zinc-600 hover:bg-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              <span className="truncate">{b.name}</span>
              <span className="flex items-center gap-1 shrink-0">
                {total > 0 && <span className="text-[10px] font-mono text-zinc-500">{total}</span>}
                <ChevronRight className={`size-3.5 ${isHovered ? "opacity-100" : "opacity-30"}`} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Consolas de la marca */}
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 px-2.5 text-zinc-500">
          Consolas de {brand.name}
        </span>
        <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
          {brand.consoles.map((co) => (
            <ConsoleButton
              key={co.name}
              brand={brand.name}
              consoleName={co.name}
              isActive={activeBrand === brand.name && activeConsole === co.name}
              count={counts[romCountKey(brand.name, co.name)] ?? 0}
              isLight={isLight}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Menú lateral (móvil): cada marca con sus consolas debajo. */
function DrawerMenu({ activeBrand, activeConsole, counts, onSelect, isLight }: RomBrandMenuProps) {
  return (
    <div className="space-y-4">
      {ROM_BRANDS.map((b) => (
        <div key={b.name} className="min-w-0">
          <span className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 px-2 text-zinc-500">
            {b.name}
          </span>
          <div className="space-y-0.5">
            {b.consoles.map((co) => (
              <ConsoleButton
                key={co.name}
                brand={b.name}
                consoleName={co.name}
                isActive={activeBrand === b.name && activeConsole === co.name}
                count={counts[romCountKey(b.name, co.name)] ?? 0}
                isLight={isLight}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
