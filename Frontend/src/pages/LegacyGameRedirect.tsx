import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { catalogService } from "../services/catalog.service";
import { gamesService } from "../services/games.service";
import { buildItemPath } from "../utils/catalogUrl";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Compatibilidad con las URLs antiguas /juegos/:id (UUID o slug) y /juegos/:id/subir-mod:
 * busca el juego y redirige (sin dejar rastro en el historial) a /juego/{slug}-{codigo},
 * que abre el modal de detalle en el catálogo.
 */
export default function LegacyGameRedirect() {
  const [, navigate] = useLocation();
  const [, detailParams] = useRoute("/juegos/:id");
  const [, uploadParams] = useRoute("/juegos/:id/subir-mod");
  const legacyId = detailParams?.id ?? uploadParams?.id ?? "";
  const suffix = uploadParams ? "/subir-mod" : "";

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      let uuid = UUID_REGEX.test(legacyId) ? legacyId : null;
      if (!uuid && legacyId) {
        // Las URLs antiguas también aceptaban el slug del juego
        const game = await gamesService.getGameById(legacyId).catch(() => null);
        uuid = game?.id ?? null;
      }
      const item = uuid ? await catalogService.getItemById(uuid).catch(() => null) : null;
      const path = item ? buildItemPath(item) : null;
      if (cancelled) return;
      navigate(path ? `${path}${suffix}` : "/catalogo", { replace: true });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [legacyId, suffix, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <Loader2 className="size-12 animate-spin" />
    </div>
  );
}
