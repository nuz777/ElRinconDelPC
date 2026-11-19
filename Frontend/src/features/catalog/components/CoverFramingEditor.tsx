import { useEffect, useRef, useState } from "react";
import { Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { Apartado, CoverFraming } from "../domain/catalog.types";
import { APARTADO_BADGE } from "../domain/catalogViews";
import {
  COVER_SCALE_MAX,
  COVER_SCALE_MIN,
  isDefaultFraming,
  normalizeFraming,
} from "../utils/coverFraming";
import FramedCover from "./FramedCover";

interface CoverFramingEditorProps {
  src: string;
  framing: CoverFraming;
  onChange: (framing: CoverFraming) => void;
  isLight: boolean;
  apartado: Apartado;
  title: string;
  version: string;
}

/**
 * Editor del encuadre de la portada. La vista previa replica la card del catálogo
 * (3:4, degradado, insignia y versión) para que el admin vea exactamente cómo quedará.
 */
export default function CoverFramingEditor({
  src,
  framing,
  onChange,
  isLight,
  apartado,
  title,
  version,
}: CoverFramingEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; start: CoverFraming } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const f = normalizeFraming(framing);
  const latest = useRef(f);
  useEffect(() => {
    latest.current = f;
  });

  const update = (patch: Partial<CoverFraming>) => {
    const next = normalizeFraming({ ...latest.current, ...patch });
    latest.current = next;
    onChange(next);
  };

  // Rueda del mouse = zoom. Listener nativo no pasivo para poder evitar el scroll del modal.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.08 : 0.08;
      const next = normalizeFraming({ ...latest.current, scale: latest.current.scale + step });
      latest.current = next;
      onChange(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, start: f };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = frameRef.current;
    if (!drag || !el) return;
    const rect = el.getBoundingClientRect();
    // Arrastrar a la derecha muestra la parte izquierda de la imagen (x baja), como en cualquier recortador.
    const sensitivity = 140 / Math.max(1, drag.start.scale);
    update({
      x: drag.start.x - ((e.clientX - drag.x) / rect.width) * sensitivity,
      y: drag.start.y - ((e.clientY - drag.y) / rect.height) * sensitivity,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, Partial<CoverFraming>> = {
      ArrowLeft: { x: f.x - step },
      ArrowRight: { x: f.x + step },
      ArrowUp: { y: f.y - step },
      ArrowDown: { y: f.y + step },
      "+": { scale: f.scale + 0.1 },
      "=": { scale: f.scale + 0.1 },
      "-": { scale: f.scale - 0.1 },
      "0": { x: 50, y: 50, scale: 1 },
    };
    const patch = moves[e.key];
    if (patch) {
      e.preventDefault();
      update(patch);
    }
  };

  const muted = isLight ? "text-zinc-500" : "text-zinc-400";
  const sliderClass = `w-full h-1.5 cursor-pointer appearance-none ${
    isLight ? "bg-zinc-200 accent-zinc-900" : "bg-zinc-800 accent-white"
  }`;

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[minmax(0,180px)_1fr] gap-4 sm:gap-5 p-3 sm:p-4 border ${
        isLight ? "bg-white border-zinc-200" : "bg-zinc-950/60 border-zinc-800"
      }`}
    >
      {/* Vista previa con forma de card */}
      <div className="mx-auto w-full max-w-[180px]">
        <div
          ref={frameRef}
          role="application"
          tabIndex={0}
          aria-label="Encuadre de la portada. Arrastra o usa las flechas para mover, rueda o + y - para el zoom, 0 para centrar."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className={`relative aspect-[3/4] w-full overflow-hidden border touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } ${
            isLight
              ? "bg-zinc-100 border-zinc-300 focus-visible:ring-zinc-900 focus-visible:ring-offset-white"
              : "bg-zinc-900 border-zinc-700 focus-visible:ring-zinc-200 focus-visible:ring-offset-zinc-950"
          }`}
        >
          <FramedCover src={src} alt="Vista previa de la portada" framing={f} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-70 pointer-events-none" />
          <span
            className={`absolute top-2 left-2 px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider border pointer-events-none ${
              apartado === "adultos"
                ? "bg-rose-600/95 text-white border-rose-500"
                : "bg-zinc-950/90 text-zinc-200 border-zinc-700"
            }`}
          >
            {APARTADO_BADGE[apartado]}
          </span>
          <span className="absolute bottom-1.5 left-2 max-w-[85%] truncate text-[10px] font-mono text-zinc-300 bg-black/85 px-1.5 py-0.5 pointer-events-none">
            {version || "v1.0"}
          </span>
          {/* Guías de tercios mientras se arrastra */}
          {isDragging && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3" aria-hidden>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/15" />
              ))}
            </div>
          )}
        </div>
        <p className={`mt-1.5 text-[11px] text-center truncate ${muted}`} title={title}>
          {title.trim() || "Así se verá la card"}
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-col justify-center gap-3.5 min-w-0">
        <p className={`flex items-start gap-1.5 text-[11px] leading-snug ${muted}`}>
          <Move className="size-3.5 shrink-0 mt-px" aria-hidden />
          <span>Arrastra la imagen para elegir qué parte se ve. Usa la rueda del mouse o el control de zoom para acercarla.</span>
        </p>

        <label className="block">
          <span className={`flex justify-between text-[11px] uppercase tracking-wider font-semibold mb-1.5 ${muted}`}>
            <span>Zoom</span>
            <span className="font-mono normal-case">{f.scale.toFixed(2)}×</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => update({ scale: f.scale - 0.1 })}
              disabled={f.scale <= COVER_SCALE_MIN}
              aria-label="Alejar"
              className={`p-1 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? "border-zinc-300 hover:bg-zinc-100" : "border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              <ZoomOut className="size-3.5" />
            </button>
            <input
              type="range"
              min={COVER_SCALE_MIN}
              max={COVER_SCALE_MAX}
              step={0.01}
              value={f.scale}
              onChange={(e) => update({ scale: Number(e.target.value) })}
              className={sliderClass}
            />
            <button
              type="button"
              onClick={() => update({ scale: f.scale + 0.1 })}
              disabled={f.scale >= COVER_SCALE_MAX}
              aria-label="Acercar"
              className={`p-1 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? "border-zinc-300 hover:bg-zinc-100" : "border-zinc-700 hover:bg-zinc-800"
              }`}
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={`flex justify-between text-[11px] uppercase tracking-wider font-semibold mb-1.5 ${muted}`}>
              <span>Horizontal</span>
              <span className="font-mono">{Math.round(f.x)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={f.x}
              onChange={(e) => update({ x: Number(e.target.value) })}
              className={sliderClass}
            />
          </label>
          <label className="block">
            <span className={`flex justify-between text-[11px] uppercase tracking-wider font-semibold mb-1.5 ${muted}`}>
              <span>Vertical</span>
              <span className="font-mono">{Math.round(f.y)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={f.y}
              onChange={(e) => update({ y: Number(e.target.value) })}
              className={sliderClass}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 50, scale: 1 })}
          disabled={isDefaultFraming(f)}
          className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 border text-[11px] uppercase tracking-wider font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isLight
              ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <RotateCcw className="size-3.5" />
          Centrar de nuevo
        </button>
      </div>
    </div>
  );
}
