import { ChevronsDown } from "lucide-react";
import { Link } from "wouter";

function Background() {
  return (
    <div className="hidden sm:block absolute -left-30 right-0 top-0 w-full z-10">
      <div className="absolute left-30 bg-zinc-950 h-dvh w-dvw z-1" />
      <img
        src="/hero/yui.png"
        alt="Hero visual"
        className="absolute left-30 fade-in-left-right object-cover h-dvh z-10 grayscale contrast-125"
      />
      <img
        src="/hero/blue.png"
        alt="Hero shadow"
        className="absolute right-1 left-199 object-cover h-dvh z-5 grayscale opacity-40"
      />
      <img
        src="/hero/white.png"
        alt="Hero aura"
        className="absolute inset-0 object-cover h-dvh w-full z-1 grayscale opacity-50"
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black"
    >
      <Background />
      {/* Mobile fallback image */}
      <div
        className="mobile-bg absolute inset-0 bg-cover bg-center grayscale brightness-75"
        style={{ backgroundImage: "url(/img/ryoya.jpg)", zIndex: 2 }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" style={{ zIndex: 3 }} />

      <div className="relative z-10 text-center px-4">
        <h1 className="typing-animate font-share font-bold text-3xl sm:text-4xl md:text-5xl text-zinc-100 inline-block overflow-hidden whitespace-nowrap border-r-3 border-zinc-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          &lt; El sótano del pc /&gt;
        </h1>
        <p className="font-share text-zinc-300 mt-5 text-sm sm:text-base uppercase tracking-wider opacity-0 animate-[fadeUp_1s_ease_0.6s_forwards] max-w-xl mx-auto">
          Todo para tu PC, juegos, mods, herramientas y mucho más!
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5 opacity-0 animate-[fadeUp_1s_ease_0.8s_forwards]">
          <a
            href="/login"
            className="px-6 py-2.5 rounded-xl font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-white text-zinc-950 border border-white hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 cursor-pointer inline-flex items-center justify-center no-underline"
          >
            Iniciar Sesión
          </a>
          <a
            href="/register"
            className="px-6 py-2.5 rounded-xl font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-zinc-900/90 text-zinc-100 border border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-500 hover:text-white hover:scale-105 active:scale-95 transition-all backdrop-blur-md shadow-lg cursor-pointer inline-flex items-center justify-center no-underline"
          >
            Crear Cuenta
          </a>
        </div>
        <p className="font-share text-xs sm:text-sm text-zinc-400 mt-5 opacity-0 animate-[fadeUp_1s_ease_1s_forwards]">
          ¿Vienes solo a echar un vistazo?,{" "}
          <Link
            href="/catalogo"
            onClick={() => window.scrollTo({ top: 0 })}
            className="text-zinc-200 underline decoration-zinc-500 underline-offset-4 hover:text-white hover:decoration-white transition-colors cursor-pointer"
          >
            mira nuestro catálogo
          </Link>
        </p>
      </div>

      <div
        className="absolute bottom-8 left-0 right-0 mx-auto w-5 text-center hero-arrow-bounce"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => document.getElementById("intro")?.scrollIntoView({ behavior: "smooth" })}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Desplazarse abajo"
        >
          <ChevronsDown className="size-6 mx-auto" />
        </button>
      </div>
    </section>
  );
}
