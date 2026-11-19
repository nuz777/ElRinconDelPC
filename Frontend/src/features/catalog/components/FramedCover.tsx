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
}

/**
 * Portada con el encuadre (posición + zoom) que eligió el admin al subirla.
 * El zoom del hover vive en un contenedor aparte para no pisar el `transform` del encuadre.
 */
export default function FramedCover({
  src,
  alt,
  framing,
  className = "",
  hoverClassName = "",
  loading = "lazy",
  draggable = false,
}: FramedCoverProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${hoverClassName}`}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={draggable}
        className={`w-full h-full object-cover object-center select-none ${className}`}
        style={coverFramingStyle(framing)}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith(FALLBACK_COVER)) target.src = FALLBACK_COVER;
        }}
      />
    </div>
  );
}
