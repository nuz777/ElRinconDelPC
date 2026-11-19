import { useEffect, useState } from "react";
import { ArrowRight, ChevronsDown, Download, Gamepad2 } from "lucide-react";
import { Link } from "wouter";
import { ROUTES } from "../../../app/routes";
import { catalogService } from "../../catalog/api/catalog.service";
import type { CatalogItem } from "../../catalog/domain/catalog.types";
import { useAuth } from "../../auth/context/useAuth";

function DiscordIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.454.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.085 2.875 1.253 3.286.149.372 2.135 5.886 2.329 6.248.049.098.079.198.099.298.02.099.02.198.02.297 0 .373-.149.943-.616 1.342-.482.413-1.064 1.176-1.182 1.418-.07.148-.225.224-.424.1-.198-.1-.742-.373-1.359-.723-.57-.32-1.206-.668-1.38-.833-.173-.164-.272-.223-.471-.074-.198.149-.446.373-.693.547-.248.174-.52.149-.818.074-.298-.074-.617-.373-.79-1.113-.272-.74-.396-1.31-.209-1.81.149-.422.523-1.03.692-1.257.169-.227.222-.371.116-.522-.105-.149-.25-.174-.524.074-.273.248-1.004.823-1.187 1.023-.172.198-.272.372-.165.52.099.149.322.25.522.248.209 0 .666-.346.99-.548.572-.347 1.527-.923 1.849-.996.322-.074.644-.074.976-.074.198 0 .693.248.975.472.282.224.497.69.497 1.117 0 .346-.002.52-.025.547-.024.024-.125.248-.373.373-.248.123-.497.248-.794.198-.474-.074-1.27-.42-1.77-.997z" />
    </svg>
  );
}

function Background() {
  return (
    <div className="hidden sm:block absolute -left-30 right-0 top-0 w-full z-10 pointer-events-none select-none opacity-65">
      <div className="absolute left-30 bg-zinc-950 h-dvh w-dvw z-1" />
      <img
        src="/hero/yui.png"
        alt="Hero visual"
        className="absolute left-30 fade-in-left-right object-cover h-dvh z-10 grayscale contrast-125 opacity-60"
      />
      <img
        src="/hero/blue.png"
        alt="Hero shadow"
        className="absolute right-1 left-199 object-cover h-dvh z-5 grayscale opacity-25"
      />
      <img
        src="/hero/white.png"
        alt="Hero aura"
        className="absolute inset-0 object-cover h-dvh w-full z-1 grayscale opacity-30"
      />
    </div>
  );
}

interface HeroProps {
  onSelectGame?: (game: CatalogItem) => void;
}

export default function Hero({ onSelectGame }: HeroProps) {
  const { isAuthenticated, user } = useAuth();
  const firstName = (user?.name || user?.username || "").trim().split(/\s+/)[0];
  const [recentGames, setRecentGames] = useState<CatalogItem[] | null>(() => {
    const cached = catalogService.getCachedRecentPage("JUEGOS", 12);
    return cached ? cached.items.slice(0, 4) : null;
  });

  useEffect(() => {
    if (recentGames !== null) return;

    let cancelled = false;
    catalogService
      .prefetchRecentPage("JUEGOS", 12)
      .then((res) => {
        if (!cancelled) {
          setRecentGames(res.items.slice(0, 4));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentGames([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [recentGames]);

  return (
    <section
      id="top"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black pt-24 pb-20 lg:py-24"
    >
      <Background />
      {/* Mobile fallback image */}
      <div
        className="mobile-bg absolute inset-0 bg-cover bg-center grayscale brightness-75 opacity-60 pointer-events-none"
        style={{ backgroundImage: "url(/img/ryoya.jpg)", zIndex: 2 }}
      />

      {/* Dark overlay encima del fondo para contrastar textos, botones y tarjetas */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" style={{ zIndex: 15 }} />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Columna izquierda: título y botones de acceso */}
        <div className="lg:col-span-6 text-center lg:text-left">
          <h1 className="typing-animate font-share font-bold text-3xl sm:text-4xl md:text-5xl text-white inline-block overflow-hidden whitespace-nowrap border-r-3 border-zinc-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            &lt; El sótano del pc /&gt;
          </h1>
          <p className="font-share text-zinc-200 mt-5 text-sm sm:text-base uppercase tracking-wider opacity-0 animate-[fadeUp_1s_ease_0.6s_forwards] max-w-xl mx-auto lg:mx-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Todo para tu PC, juegos, mods, herramientas y mucho más!
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 opacity-0 animate-[fadeUp_1s_ease_0.8s_forwards]">
            {isAuthenticated ? (
              <>
                {/* Con sesión iniciada no tiene sentido ofrecer login: se lleva directo al catálogo */}
                <Link
                  href={ROUTES.CATALOG}
                  className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-white text-zinc-950 border border-white hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer inline-flex items-center justify-center gap-2 no-underline"
                >
                  {firstName ? `Hola ${firstName}, ir al catálogo` : "Ir al catálogo"}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href={ROUTES.GAMES}
                  className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-zinc-950/85 text-white border border-zinc-500 hover:bg-zinc-900 hover:border-zinc-300 hover:scale-105 active:scale-95 transition-all backdrop-blur-md shadow-lg cursor-pointer inline-flex items-center justify-center gap-2 no-underline"
                >
                  <Gamepad2 className="size-4" aria-hidden />
                  Juegos de PC
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.LOGIN}
                  className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-white text-zinc-950 border border-white hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer inline-flex items-center justify-center no-underline"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-zinc-950/85 text-white border border-zinc-500 hover:bg-zinc-900 hover:border-zinc-300 hover:scale-105 active:scale-95 transition-all backdrop-blur-md shadow-lg cursor-pointer inline-flex items-center justify-center no-underline"
                >
                  Crear Cuenta
                </Link>
              </>
            )}
            <a
              href="https://discord.gg/MnDpU7hNV"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-[#5865F2] hover:bg-[#4752C4] text-white border border-[#7983f5]/60 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#5865F2]/25 cursor-pointer inline-flex items-center justify-center gap-2 no-underline"
            >
              <DiscordIcon className="size-4 sm:size-5" />
              Servidor de Discord
            </a>
            <a
              href="https://whatsapp.com/channel/0029VbA0chM8qIzvBEMFcF3z"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-[#25D366] hover:bg-[#1DB954] text-white border border-[#4ADE80]/60 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#25D366]/25 cursor-pointer inline-flex items-center justify-center gap-2 no-underline"
            >
              <WhatsAppIcon className="size-4 sm:size-5" />
              Canal de WhatsApp
            </a>
          </div>
          {!isAuthenticated && (
          <p className="font-share text-xs sm:text-sm text-zinc-200 mt-5 opacity-0 animate-[fadeUp_1s_ease_1s_forwards] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            ¿Vienes solo a echar un vistazo?,{" "}
            <Link
              href={ROUTES.CATALOG}
              onClick={() => window.scrollTo({ top: 0 })}
              className="text-white underline decoration-zinc-400 underline-offset-4 hover:text-white hover:decoration-white transition-colors cursor-pointer"
            >
              mira nuestro catálogo
            </Link>
          </p>
          )}
        </div>

        {/* Columna derecha: los 4 juegos más recientes precargados al lado de los botones */}
        <aside
          aria-label="Los 4 juegos más recientes"
          className="lg:col-span-6 opacity-0 animate-[fadeUp_1s_ease_0.8s_forwards]"
        >
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Gamepad2 className="size-4 text-zinc-200 shrink-0" />
                <h2 className="font-share text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                  Juegos más recientes
                </h2>
              </div>
              <Link
                href={ROUTES.GAMES}
                onClick={() => window.scrollTo({ top: 0 })}
                className="inline-flex items-center gap-1 text-[11px] font-share uppercase tracking-wider text-zinc-200 hover:text-white shrink-0 no-underline"
              >
                <span>Ver todos</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {recentGames === null ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-zinc-800 bg-zinc-900/90 animate-pulse overflow-hidden"
                  >
                    <div className="aspect-[16/10] w-full bg-zinc-800" />
                    <div className="p-2.5 space-y-2">
                      <div className="h-3 w-3/4 bg-zinc-800" />
                      <div className="h-2.5 w-1/2 bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentGames.length === 0 ? (
              <div className="py-10 px-4 border border-dashed border-zinc-700/80 bg-zinc-950/70 text-center space-y-3">
                <p className="font-share text-xs text-zinc-200">
                  No hay juegos cargados en este momento.
                </p>
                <Link
                  href={ROUTES.CATALOG}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-zinc-950 font-share font-bold text-xs uppercase tracking-wider no-underline"
                >
                  <span>Ir al catálogo</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => onSelectGame?.(game)}
                    className="group text-left border border-zinc-800 hover:border-zinc-500 bg-zinc-900/90 hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 border-b border-zinc-800">
                      <img
                        src={game.img}
                        alt={game.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith("/img/SN-tools.jpg")) {
                            target.src = "/img/SN-tools.jpg";
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-share font-bold uppercase tracking-wider bg-zinc-950/90 text-zinc-100 border border-zinc-700">
                        {game.tag}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-mono text-zinc-200 bg-black/85">
                        {game.size}
                      </span>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-1">
                      <h3 className="font-share text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-zinc-200">
                        {game.title}
                      </h3>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-400">
                        <span className="truncate uppercase tracking-wider">{game.genre}</span>
                        <Download className="size-3 shrink-0 text-zinc-300 group-hover:translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div
        className="absolute bottom-6 left-0 right-0 mx-auto w-5 text-center hero-arrow-bounce"
        style={{ zIndex: 20 }}
      >
        <button
          onClick={() => document.getElementById("recent-games")?.scrollIntoView({ behavior: "smooth" })}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Desplazarse abajo"
        >
          <ChevronsDown className="size-6 mx-auto" />
        </button>
      </div>
    </section>
  );
}
