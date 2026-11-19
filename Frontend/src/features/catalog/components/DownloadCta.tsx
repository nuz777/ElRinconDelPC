import type { CSSProperties } from "react";
import { Download, Link2Off } from "lucide-react";
import type { Apartado } from "../domain/catalog.types";
import { APARTADO_NOUN } from "../domain/catalogViews";


// Partículas alrededor del botón: posición (%), tamaño, retardo y dirección del estallido en hover
const SPARKS = [
  { x: "4%", y: "-6%", s: 14, d: 0, dx: "-18px", dy: "-16px" },
  { x: "22%", y: "108%", s: 11, d: 0.7, dx: "-8px", dy: "18px" },
  { x: "38%", y: "-10%", s: 12, d: 1.6, dx: "0px", dy: "-20px" },
  { x: "58%", y: "110%", s: 15, d: 0.3, dx: "6px", dy: "20px" },
  { x: "74%", y: "-8%", s: 11, d: 2.1, dx: "10px", dy: "-18px" },
  { x: "96%", y: "20%", s: 13, d: 1.1, dx: "20px", dy: "-8px" },
  { x: "98%", y: "86%", s: 11, d: 1.9, dx: "18px", dy: "12px" },
  { x: "-2%", y: "70%", s: 12, d: 2.6, dx: "-20px", dy: "10px" },
  { x: "86%", y: "112%", s: 9, d: 0.9, dx: "14px", dy: "22px" },
  { x: "50%", y: "-14%", s: 8, d: 1.4, dx: "-24px", dy: "0px" },
];

interface DownloadCtaProps {
  href: string;
  apartado: Apartado;
  /** Línea secundaria (servidor, peso...). */
  detail?: string;
  isLight: boolean;
  size?: "lg" | "md";
}

/** Botón de descarga principal con borde luminoso, destello y partículas de brillo. */
export default function DownloadCta({ href, apartado, detail, isLight, size = "lg" }: DownloadCtaProps) {
  const noun = APARTADO_NOUN[apartado];
  const available = Boolean(href) && href !== "#";
  const pad = size === "lg" ? "px-6 py-4 sm:py-5" : "px-5 py-3.5";
  const text = size === "lg" ? "text-base sm:text-lg" : "text-sm sm:text-base";

  if (!available) {
    return (
      <div className="dl-cta" aria-disabled="true">
        <div
          className={`flex items-center justify-center gap-2.5 border border-dashed ${pad} ${
            isLight ? "border-zinc-300 text-zinc-500 bg-zinc-50" : "border-zinc-700 text-zinc-500 bg-zinc-900/60"
          }`}
        >
          <Link2Off className="size-5 shrink-0" aria-hidden />
          <span className="text-sm font-semibold">Enlace de descarga no disponible todavía</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dl-cta" data-tone={apartado === "adultos" ? "adult" : undefined}>
      {SPARKS.map((p, i) => (
        <span
          key={i}
          className="dl-spark"
          aria-hidden
          style={
            {
              "--x": p.x,
              "--y": p.y,
              "--s": `${p.s}px`,
              "--d": `${p.d}s`,
              "--hd": `${(i % 4) * 0.12}s`,
              "--dx": p.dx,
              "--dy": p.dy,
            } as CSSProperties
          }
        />
      ))}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`dl-cta-btn flex items-center justify-between gap-4 font-bold no-underline outline-none ${pad} ${
          apartado === "adultos"
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : isLight
              ? "bg-zinc-900 text-white hover:bg-black"
              : "bg-white text-zinc-950 hover:bg-zinc-100"
        }`}
      >
        <span className="min-w-0">
          <span className={`block uppercase tracking-wider ${text}`}>Descargar {noun}</span>
          {detail && (
            <span
              className={`block text-[11px] font-normal tracking-wide mt-0.5 truncate ${
                apartado === "adultos" ? "text-rose-100" : isLight ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              {detail}
            </span>
          )}
        </span>
        <span
          className={`dl-cta-icon shrink-0 grid place-items-center size-10 border ${
            apartado === "adultos"
              ? "border-rose-300/50 bg-rose-500/40"
              : isLight
                ? "border-zinc-700 bg-zinc-800"
                : "border-zinc-300 bg-zinc-100"
          }`}
        >
          <Download className="size-5" aria-hidden />
        </span>
      </a>
    </div>
  );
}
