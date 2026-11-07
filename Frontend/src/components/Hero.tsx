import { ChevronsDown } from "lucide-react";
import { Link } from "wouter";

function DiscordIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

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
        <div className="mt-3.5 flex items-center justify-center opacity-0 animate-[fadeUp_1s_ease_0.9s_forwards]">
          <a
            href="https://discord.gg/MnDpU7hNV"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl font-share font-bold text-xs sm:text-sm uppercase tracking-wider bg-[#5865F2] hover:bg-[#4752C4] text-white border border-[#7983f5]/40 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#5865F2]/25 cursor-pointer inline-flex items-center justify-center gap-2 no-underline"
          >
            <DiscordIcon className="size-4 sm:size-5" />
            Servidor de Discord
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
