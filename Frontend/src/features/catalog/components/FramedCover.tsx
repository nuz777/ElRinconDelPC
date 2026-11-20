import { useEffect, useRef, useState } from "react";
import type { CoverFraming } from "../domain/catalog.types";
import { coverFramingStyle } from "../utils/coverFraming";

const FALLBACK_COVER = "/img/SN-tools.jpg";

interface FramedCoverProps {
  src: string;
  alt: string;
  framing?: CoverFraming | null;
  className?: string;
  /** Clases del contenedor que recibe el zoom de hover (separado del zoom del encuadre). */
  hoverClassName?: string;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  /** Muestra el indicador SVG de carga integrado mientras la imagen no está lista. */
  showLoader?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Portada con el encuadre (posición + zoom) que eligió el admin al subirla.
 * El zoom del hover vive en un contenedor aparte para no pisar el `transform` del encuadre.
 * Muestra un indicador SVG de carga mientras la imagen se descarga.
 */
export default function FramedCover({
  src,
  alt,
  framing,
  className = "",
  hoverClassName = "",
  loading = "lazy",
  draggable = false,
  showLoader = true,
  onLoad,
  onError,
}: FramedCoverProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [src]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${hoverClassName}`}>
      {showLoader && !isLoaded && (
        <div
          className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-zinc-700/20 animate-pulse" />
          <svg
            className="relative size-8 sm:size-9 animate-spin text-zinc-300/80"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M12 2a10 10 0 00-10 10h3.2A6.8 6.8 0 0112 5.2V2z"
            />
          </svg>
          <svg
            className="relative size-4 sm:size-5 text-zinc-400/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="M21 15l-4.5-4.5a1.2 1.2 0 00-1.7 0L6 19" />
          </svg>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={draggable}
        className={`w-full h-full object-cover object-center select-none transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={coverFramingStyle(framing)}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith(FALLBACK_COVER)) {
            setIsLoaded(false);
            target.src = FALLBACK_COVER;
          } else {
            setIsLoaded(true);
            onError?.();
          }
        }}
      />
    </div>
  );
}
