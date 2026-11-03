import { ChevronsUp } from "lucide-react";
import { Link, useLocation } from "wouter";

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#intro", label: "Intro" },
  { href: "/#about", label: "Sobre Nosotros" },
  { href: "/#team", label: "Equipo" },
  { href: "/#contact", label: "Contacto" },
];

export default function Footer() {
  const [location, setLocation] = useLocation();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSectionClick = (href: string) => {
    const id = href.slice(2);
    if (location !== "/") {
      setLocation("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-900">
      <div className="relative border-b border-zinc-800/80 px-5 py-20 text-center">
        <ul className="list-none flex flex-wrap justify-center gap-6 mb-5">
          {footerLinks.map((link) =>
            link.href.startsWith("/#") ? (
              <li key={link.href}>
                <button
                  onClick={() => handleSectionClick(link.href)}
                  className="text-sm uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="text-sm uppercase tracking-wider text-zinc-400 hover:text-white transition"
                >
                  {link.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        <button
          onClick={scrollToTop}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 size-11 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 shadow-lg shadow-black/50 transition-all cursor-pointer"
          aria-label="Volver arriba"
        >
          <ChevronsUp size={18} />
        </button>
      </div>

      <div className="py-10 text-center">
        <p className="text-sm text-zinc-500 font-share">
          &copy; <span className="text-zinc-300 font-medium">El sótano del pc</span> - 2026 · Hecho por Nuz
        </p>
      </div>
    </footer>
  );
}
