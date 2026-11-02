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
import { Link } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import Hero from "../components/Hero";
import TeamTerminal from "../components/TeamTerminal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import YouTubeEmbed from "../components/YouTubeEmbed";
import Reveal from "../components/Reveal";
import { useAudio } from "../AudioContext";

export default function Home() {
  const [showMusicMsg, setShowMusicMsg] = useState(false);
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
      <Hero />

      <main id="main" className="bg-canvas text-ink overflow-hidden transition-colors duration-200">
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
                            className="text-xs md:text-sm text-theme-title font-share uppercase tracking-widest bg-zinc-200/90 dark:bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-sm"
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
                              className="max-md:hidden absolute size-56 rounded-full border-2 animate-wave-ring"
                              style={{ animationDelay: "0s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56 rounded-full border-2 animate-wave-ring"
                              style={{ animationDelay: "0.6s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56 rounded-full border-2 animate-wave-ring"
                              style={{ animationDelay: "1.2s", borderColor: `rgba(161,161,170,${0.25 + intensity * 0.6})` }}
                            />
                            <div
                              className="max-md:hidden absolute size-56 rounded-full border-2 animate-wave-ring"
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
                    desc: "Títulos emblemáticos organizados por géneros, listos con sus especificaciones completas y descargas sin complicaciones.",
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
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
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
                className="inline-flex items-center justify-center px-8 py-4 bg-zinc-100 text-zinc-950 font-bold text-sm uppercase tracking-wider rounded-xl border border-zinc-300 shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
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
              <a
                href="mailto:ivandavidmejiamendez@gmail.com"
                className="inline-flex items-center h-12 px-6 bg-zinc-100 text-zinc-950 font-semibold text-sm uppercase tracking-wider rounded-xl border border-zinc-200 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Contactar a Nuz
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
