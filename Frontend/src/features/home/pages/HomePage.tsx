import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  MessageCircle,
  Check,
  List,
  Download,
  Settings,
  ShieldCheck,
  Gamepad2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import Hero from "../components/Hero";
import RecentGamesSection from "../components/RecentGamesSection";
import TeamTerminal from "../components/TeamTerminal";
import Header from "../../../shared/ui/Navbar";
import Footer from "../../../shared/ui/Footer";
import YouTubeEmbed from "../../../shared/ui/YouTubeEmbed";
import Reveal from "../../../shared/ui/Reveal";
import { NativeBannerAd } from "../../ads/NativeBannerAd";
import FullscreenDetailModal from "../../catalog/components/FullscreenDetailModal";
import type { CatalogItem } from "../../catalog/domain/catalog.types";
import { buildViewPath, viewForItem } from "../../catalog/utils/catalogUrl";
import { ROUTES } from "../../../app/routes";
import { useAudio } from "../../../shared/context/useAudio";

function DiscordIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.454.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.085 2.875 1.253 3.286.149.372 2.135 5.886 2.329 6.248.049.098.079.198.099.298.02.099.02.198.02.297 0 .373-.149.943-.616 1.342-.482.413-1.064 1.176-1.182 1.418-.07.148-.225.224-.424.1-.198-.1-.742-.373-1.359-.723-.57-.32-1.206-.668-1.38-.833-.173-.164-.272-.223-.471-.074-.198.149-.446.373-.693.547-.248.174-.52.149-.818.074-.298-.074-.617-.373-.79-1.113-.272-.74-.396-1.31-.209-1.81.149-.422.523-1.03.692-1.257.169-.227.222-.371.116-.522-.105-.149-.25-.174-.524.074-.273.248-1.004.823-1.187 1.023-.172.198-.272.372-.165.52.099.149.322.25.522.248.209 0 .666-.346.99-.548.572-.347 1.527-.923 1.849-.996.322-.074.644-.074.976-.074.198 0 .693.248.975.472.282.224.497.69.497 1.117 0 .346-.002.52-.025.547-.024.024-.125.248-.373.373-.248.123-.497.248-.794.198-.474-.074-1.27-.42-1.77-.997z" />
    </svg>
  );
}

export default function Home() {
  const [showMusicMsg, setShowMusicMsg] = useState(false);
  const [selectedGame, setSelectedGame] = useState<CatalogItem | null>(null);
  const [, setLocation] = useLocation();
  const { isPlaying, toggleAudio, intensity } = useAudio();
  const prevPlaying = useRef(false);

  useEffect(() => {
    if (isPlaying && !prevPlaying.current) {
      setShowMusicMsg(true);
      setTimeout(() => setShowMusicMsg(false), 2500);
    }
    prevPlaying.current = isPlaying;
  }, [isPlaying]);

  return (
    <>
      <Header />
      <Hero onSelectGame={setSelectedGame} />

      <main id="main" className="bg-canvas text-ink overflow-hidden transition-colors duration-200">
        {/* Recent Games Showcase (estilo portal BlizzBoyGames) */}
        <RecentGamesSection onSelectItem={setSelectedGame} />

        {/* Hello section */}
        <section id="intro" className="py-24 md:py-28 scroll-mt-20">
          <Reveal>
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="font-share text-3xl md:text-4xl text-theme-title text-center uppercase mb-2 font-bold tracking-wide">
                HOLA &amp; ¡BIENVENIDO!
              </h2>
              <p className="font-share text-center text-sm text-theme-desc uppercase tracking-widest mb-12">
                <span className="relative inline-block before:absolute before:-left-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-px before:bg-zinc-400 dark:before:bg-zinc-700 after:absolute after:-right-8 after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-px after:bg-zinc-400 dark:after:bg-zinc-700">
                  ¿Qué es El sótano del pc?
                </span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 items-start mt-16">
                <Reveal variant="fadeLeft" delay={0.1}>
                  <div className="space-y-8">
                    <div className="text-right relative pr-24">
                      <div className="absolute right-1.25 top-1/2 -translate-y-1/2 size-12 border border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 rotate-45 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_#27272a] flex items-center justify-center">
                        <Calendar className="size-5 -rotate-45 text-theme-title" />
                      </div>
                      <h3 className="text-sm font-semibold text-theme-title uppercase tracking-wider">
                        Enfocado en tu PC
                      </h3>
                      <p className="text-xs text-theme-desc mt-4 leading-relaxed">
                        Es frustrante perder tiempo buscando juegos, mods o utilidades limpias. En El sótano del pc todo está curado y listo para descargar.
                      </p>
                    </div>
                    <div className="text-right relative pr-24">
                      <div className="absolute right-1.25 top-1/2 -translate-y-1/2 size-12 border border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 rotate-45 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_#27272a] flex items-center justify-center">
                        <MessageCircle className="size-5 -rotate-45 text-theme-title" />
                      </div>
                      <h3 className="text-sm font-semibold text-theme-title uppercase tracking-wider">
                        Optimización y Soporte
                      </h3>
                      <p className="text-xs text-theme-desc mt-4 leading-relaxed">
                        Herramientas probadas para exprimir hasta el último frame de tu computadora.
                      </p>
                    </div>
                  </div>
                </Reveal>

                <Reveal variant="scaleIn" delay={0.2}>
                  <div className="flex flex-col items-center md:-mt-16 relative">
                    <div className="h-10 flex items-center justify-center">
                      <AnimatePresence>
                        {showMusicMsg && (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs md:text-sm text-theme-title font-share uppercase tracking-widest bg-zinc-200/90 dark:bg-zinc-900/80 px-3 py-1  border border-zinc-300 dark:border-zinc-700 shadow-sm"
                          >
                            ¡Música Desbloqueada!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <AnimatePresence>
                        {isPlaying && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div
                              className="max-md:hidden absolute size-56  border-2 animate-wave-ring"
                              style={{ animationDelay: "0s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56  border-2 animate-wave-ring"
                              style={{ animationDelay: "0.6s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56  border-2 animate-wave-ring"
                              style={{ animationDelay: "1.2s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56  border-2 animate-wave-ring"
                              style={{ animationDelay: "1.8s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div
                        className="relative size-56 shadow-[10px_10px_0_0_transparent] animate-spin-slow cursor-pointer"
                        onClick={toggleAudio}
                        title="Toca para reproducir audio"
                      >
                        <img
                          src="/img/icon12.png"
                          alt="Vinilo"
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-48 md:w-56 filter grayscale contrast-125"
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal variant="fadeRight" delay={0.1}>
                  <div className="space-y-8">
                    <div className="text-left relative pl-24">
                      <div className="absolute left-1.25 top-1/2 -translate-y-1/2 size-12 border border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 rotate-45 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_#27272a] flex items-center justify-center">
                        <Check className="size-5 -rotate-45 text-theme-title" />
                      </div>
                      <h3 className="text-sm font-semibold text-theme-title uppercase tracking-wider">
                        Calidad y Seguridad
                      </h3>
                      <p className="text-xs text-theme-desc mt-4 leading-relaxed">
                        Cada juego, mod y programa publicado ha sido verificado para garantizar una instalación segura y sin sorpresas.
                      </p>
                    </div>
                    <div className="text-left relative pl-24">
                      <div className="absolute left-1.25 top-1/2 -translate-y-1/2 size-12 border border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 rotate-45 shadow-[4px_4px_0_0_#cbd5e1] dark:shadow-[4px_4px_0_0_#27272a] flex items-center justify-center">
                        <List className="size-5 -rotate-45 text-theme-title" />
                      </div>
                      <h3 className="text-sm font-semibold text-theme-title uppercase tracking-wider">
                        Colección Organizada
                      </h3>
                      <p className="text-xs text-theme-desc mt-4 leading-relaxed">
                        Catálogo ordenado por géneros con buscador instantáneo, fichas completas y enlaces directos de descarga.
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Quote section */}
        <section className="py-32 bg-[url('/img/indicado.webp')] sm:bg-fixed bg-cover bg-center text-center relative">
          <div className="absolute inset-0 bg-black/75" />
          <Reveal variant="scaleIn">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <p className="text-2xl md:text-3xl text-zinc-100 font-light leading-relaxed font-share">
                "Programar es perseverancia; al crear, usas tu imaginación, y tu
                código se convierte en el reflejo de tus ideas."
              </p>
              <p className="mt-4 text-xl text-zinc-300 font-mono italic">- Nuz</p>
            </div>
          </Reveal>
        </section>

        {/* About section */}
        <section id="about" className="py-24 scroll-mt-20">
          <Reveal>
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="font-share text-3xl md:text-4xl text-theme-title uppercase mb-2 font-bold tracking-wide">
                Sobre El sótano del pc
              </h2>
              <p className="font-share text-sm text-theme-desc uppercase tracking-widest mb-16">
                <span className="relative inline-block before:absolute before:-left-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-px before:bg-zinc-400 dark:before:bg-zinc-700 after:absolute after:-right-8 after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-px after:bg-zinc-400 dark:after:bg-zinc-700">
                  Juegos, mods y herramientas de PC en un solo rincón
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Gamepad2,
                    title: "Juegos de PC",
                    desc: "Títulos emblemáticos organizados por géneros, listos con sus especificaciones completas y descargas.",
                  },
                  {
                    icon: Download,
                    title: "Mods & Shaders",
                    desc: "Mejoras gráficas, shaders de última generación y expansiones de jugabilidad para transformar tus juegos favoritos.",
                  },
                  {
                    icon: Settings,
                    title: "Herramientas de PC",
                    desc: "Utilidades de diagnóstico, desinstaladores limpios y herramientas de optimización para poner a punto Windows.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Comunidad Limpia",
                    desc: "Recursos seleccionados por Nuz para entusiastas del hardware y gamers que buscan rendimiento real.",
                  },
                ].map((item, i) => (
                  <Reveal key={item.title} variant="fadeUp" delay={i * 0.1}>
                    <div className="p-6  bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
                      <div className="size-16 mx-auto border border-zinc-400 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 rotate-45 shadow-[3px_3px_0_0_#cbd5e1] dark:shadow-[3px_3px_0_0_#27272a] flex items-center justify-center mb-6">
                        <item.icon className="size-6 -rotate-45 text-theme-title" />
                      </div>
                      <h3 className="text-sm font-semibold text-theme-title uppercase mt-6 tracking-wider">
                        {item.title}
                      </h3>
                      <p className="text-xs text-theme-desc mt-4 leading-relaxed">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Creator / Team section */}
        <section id="team" className="py-24 scroll-mt-20">
          <Reveal>
            <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="font-share text-3xl md:text-4xl text-theme-title uppercase mb-2 font-bold tracking-wide">
                EQUIPO DE DESARROLLO
              </h2>
              <p className="font-share text-sm text-theme-desc uppercase tracking-widest mb-12">
                <span className="relative inline-block before:absolute before:-left-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-px before:bg-zinc-400 dark:before:bg-zinc-700 after:absolute after:-right-8 after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-px after:bg-zinc-400 dark:after:bg-zinc-700">
                  Desarrollado y mantenido por Nuz
                </span>
              </p>
            </div>
          </Reveal>
          <TeamTerminal />
        </section>

        {/* Catalog CTA */}
        <section id="works" className="py-32 bg-[url('/img/SN-tools.jpg')] sm:bg-fixed bg-cover bg-center text-center relative scroll-mt-20">
          <div className="absolute inset-0 bg-black/80" />
          <Reveal>
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
              <h2 className="font-share text-3xl md:text-5xl text-white uppercase mb-4 tracking-wider font-extrabold">
                El Catálogo del Sótano
              </h2>
              <p className="font-share text-sm text-zinc-300 uppercase tracking-widest mb-8 max-w-xl mx-auto">
                <span className="relative inline-block before:absolute before:-left-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-px before:bg-zinc-500 after:absolute after:-right-8 after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-px after:bg-zinc-500">
                  Juegos, mods y herramientas ordenados por género con buscador y descarga en pantalla completa
                </span>
              </p>
              <Link
                href="/catalogo"
                onClick={() => window.scrollTo({ top: 0 })}
                className="inline-flex items-center justify-center px-8 py-4 bg-zinc-100 text-zinc-950 font-bold text-sm uppercase tracking-wider  border border-zinc-300 shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Explorar Catálogo Completo →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Video section */}
        <section id="video" className="py-24 scroll-mt-20">
          <Reveal>
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="font-share text-3xl md:text-4xl text-theme-title text-center uppercase mb-2 font-bold tracking-wide">
                Introducción
              </h2>
              <p className="font-share text-center text-sm text-theme-desc uppercase tracking-widest mb-12">
                <span className="relative inline-block before:absolute before:-left-8 before:top-1/2 before:-translate-y-1/2 before:w-5 before:h-px before:bg-zinc-400 dark:before:bg-zinc-700 after:absolute after:-right-8 after:top-1/2 after:-translate-y-1/2 after:w-5 after:h-px after:bg-zinc-400 dark:after:bg-zinc-700">
                  Video Demostrativo
                </span>
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <Reveal variant="fadeLeft">
                  <div className=" overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <YouTubeEmbed videoId="-XraHbRlwwo" />
                  </div>
                </Reveal>

                <Reveal variant="fadeRight" delay={0.15}>
                  <div className="space-y-6">
                    <h3 className="font-share text-2xl md:text-3xl text-theme-title uppercase font-bold">
                      Sé bienvenido a <span className="underline decoration-zinc-400 dark:decoration-zinc-500 underline-offset-4">El sótano del pc</span>, tu rincón para juegos y optimización.
                    </h3>
                    <p className="text-sm text-theme-desc leading-relaxed">
                      Una introducción al proyecto, sus características y cómo navegar por el catálogo. Te invitamos a explorar las distintas categorías de juegos, mods y herramientas seleccionadas.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Native Ad Banner */}
        {!selectedGame && <NativeBannerAd />}

        {/* Contact section */}
        <section
          id="contact"
          className="py-32 bg-[url('/img/fotter.jpg')] sm:bg-fixed bg-cover bg-center text-center relative"
        >
          <div className="absolute inset-0 bg-black/80" />
          <Reveal>
            <div className="relative z-10 max-w-xl mx-auto px-4">
              <h2 className="font-share text-3xl md:text-4xl text-white mb-4 uppercase font-bold">
                ¿Tienes sugerencias o dudas?
              </h2>
              <p className="text-zinc-300 mb-8 text-sm">
                Envía tus peticiones de nuevos juegos, mods o reporta enlaces caídos.
              </p>
              <div className="flex items-center gap-3">
              <a
                href="https://discord.gg/MnDpU7hNV"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 h-12 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm uppercase tracking-wider  border border-[#7983f5]/40 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#5865F2]/30 cursor-pointer"
              >
                <DiscordIcon className="size-5" />
                Servidor de Discord
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbA0chM8qIzvBEMFcF3z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 h-12 px-6 bg-[#25D366] hover:bg-[#1DB954] text-white font-semibold text-sm uppercase tracking-wider  border border-[#4ADE80]/40 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#25D366]/30 cursor-pointer"
              >
                <WhatsAppIcon className="size-5" />
                Canal de WhatsApp
              </a>
            </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />

      <FullscreenDetailModal
        item={selectedGame}
        onClose={() => setSelectedGame(null)}
        onNavigateRoot={() => {
          setSelectedGame(null);
          setLocation(ROUTES.CATALOG);
          window.scrollTo({ top: 0 });
        }}
        onNavigateApartado={(apartado, brand, consoleName) => {
          setSelectedGame(null);
          const targetView =
            apartado === "roms" && brand && consoleName
              ? { apartado: "roms" as const, brand, console: consoleName }
              : viewForItem({
                  apartado,
                  brand: brand ?? null,
                  console: consoleName ?? null,
                });
          setLocation(buildViewPath(targetView));
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
