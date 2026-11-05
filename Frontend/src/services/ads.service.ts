/**
 * AdService – Servicio de infraestructura para la gestión de scripts publicitarios (Adsterra).
 *
 * Centraliza la inyección y limpieza del Popunder y del Native Banner en el DOM,
 * evitando duplicados durante la navegación SPA y manejando el doble montaje
 * de React 18 en modo estricto (StrictMode).
 */

export interface AdServiceConstants {
  readonly POPUNDER_SCRIPT_SRC: string;
  readonly NATIVE_BANNER_SCRIPT_SRC: string;
  readonly NATIVE_BANNER_CONTAINER_ID: string;
}

const CONSTANTS: AdServiceConstants = {
  POPUNDER_SCRIPT_SRC: "https://abscloud.org/1/66b80c533ef796a55f08e31e12fb7cdb",
  NATIVE_BANNER_SCRIPT_SRC: "https://bauval.org/21/ee778cdd56afa932f4e2a029285bada5",
  NATIVE_BANNER_CONTAINER_ID: "container-ee778cdd56afa932f4e2a029285bada5",
} as const;

let isPopunderLoaded = false;

export class AdService {
  public static readonly constants: AdServiceConstants = CONSTANTS;

  /**
   * Inyecta dinámicamente el script de Popunder una única vez en toda la sesión.
   * Verifica tanto una bandera en memoria como la existencia real en el DOM.
   */
  public static initPopunder(): void {
    if (typeof document === "undefined") return;

    const src = AdService.constants.POPUNDER_SCRIPT_SRC;
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (isPopunderLoaded && existingScript) {
      return;
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-cfasync", "false");

      const target = document.head ?? document.body;
      target?.appendChild(script);
    }

    isPopunderLoaded = true;
  }

  /**
   * Carga el script del Banner Nativo asociado al contenedor indicado y devuelve
   * una función de limpieza (cleanup) segura para `useEffect` y React 18 `StrictMode`.
   *
   * El script de Adsterra (`bauval.org`) bloquea ejecuciones repetidas mediante
   * `invoke_init.skip.max_widgets`, pero registra un listener en `window` para el
   * evento `popstate` con el fin de volver a inyectar los anuncios en el contenedor
   * cuando cambia la vista en una SPA.
   *
   * @param containerId ID del contenedor HTML (`container-ee778cdd56afa932f4e2a029285bada5`).
   * @param scriptSrc URL del script del banner nativo.
   * @returns Función de limpieza para ejecutar al desmontar el componente.
   */
  public static loadNativeBanner(containerId: string, scriptSrc: string): () => void {
    if (typeof document === "undefined") {
      return () => undefined;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.setAttribute("async", "async");
      script.setAttribute("data-cfasync", "false");

      const target = document.body ?? document.head;
      target?.appendChild(script);
    } else if (typeof window !== "undefined") {
      // Si el script ya está cargado en la sesión SPA, notificamos al listener
      // interno de Adsterra tras el montaje del nuevo contenedor en el DOM.
      const rafId = window.requestAnimationFrame(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      return () => {
        window.cancelAnimationFrame(rafId);
        const currentContainer = document.getElementById(containerId);
        if (currentContainer) {
          currentContainer.innerHTML = "";
        }
      };
    }

    return () => {
      const currentContainer = document.getElementById(containerId);
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
    };
  }
}
