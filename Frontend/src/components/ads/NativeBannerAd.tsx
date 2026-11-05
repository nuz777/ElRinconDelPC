import { useEffect } from "react";
import { AdService } from "../../services/ads.service";

interface NativeBannerAdProps {
  className?: string;
}

/**
 * NativeBannerAd – Componente de UI reutilizable para el Banner Nativo de Adsterra.
 *
 * Delega la inyección y limpieza del script en `AdService`, manteniendo el componente
 * desacoplado de la manipulación directa del DOM y compatible con React 18 StrictMode.
 */
export function NativeBannerAd({ className = "" }: NativeBannerAdProps) {
  const { NATIVE_BANNER_CONTAINER_ID, NATIVE_BANNER_SCRIPT_SRC } = AdService.constants;

  useEffect(() => {
    const cleanup = AdService.loadNativeBanner(
      NATIVE_BANNER_CONTAINER_ID,
      NATIVE_BANNER_SCRIPT_SRC,
    );

    return () => {
      cleanup();
    };
  }, [NATIVE_BANNER_CONTAINER_ID, NATIVE_BANNER_SCRIPT_SRC]);

  return (
    <aside
      aria-label="Espacio publicitario"
      className={`w-full max-w-6xl mx-auto my-8 px-4 sm:px-6 ${className}`.trim()}
    >
      <div className="w-full min-h-[90px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-900/40 p-4 flex flex-col items-center justify-center transition-colors">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 select-none">
          Publicidad
        </span>
        <div
          id={NATIVE_BANNER_CONTAINER_ID}
          className="w-full flex items-center justify-center overflow-hidden"
        />
      </div>
    </aside>
  );
}

export default NativeBannerAd;
