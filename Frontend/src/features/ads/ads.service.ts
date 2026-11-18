export interface AdServiceConstants {
  readonly NATIVE_BANNER_SCRIPT_SRC: string;
  readonly NATIVE_BANNER_CONTAINER_ID: string;
}

const CONSTANTS: AdServiceConstants = {
  NATIVE_BANNER_SCRIPT_SRC: "https://bauval.org/21/ee778cdd56afa932f4e2a029285bada5",
  NATIVE_BANNER_CONTAINER_ID: "container-ee778cdd56afa932f4e2a029285bada5",
} as const;

export class AdService {
  public static readonly constants: AdServiceConstants = CONSTANTS;

  public static loadNativeBanner(containerId: string, scriptSrc: string): () => void {
    if (typeof document === "undefined") return () => undefined;

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      (document.body ?? document.head)?.appendChild(script);
    } else if (typeof window !== "undefined") {
      const rafId = window.requestAnimationFrame(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      return () => {
        window.cancelAnimationFrame(rafId);
        const currentContainer = document.getElementById(containerId);
        if (currentContainer) currentContainer.innerHTML = "";
      };
    }

    return () => {
      const currentContainer = document.getElementById(containerId);
      if (currentContainer) currentContainer.innerHTML = "";
    };
  }
}
