import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../ThemeContext";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#intro", label: "Intro" },
  { href: "/#about", label: "Sobre Nosotros" },
  { href: "/#team", label: "Equipo" },
  { href: "/#video", label: "Video" },
  { href: "/#contact", label: "Contacto" },
];

interface HeaderProps {
  onNavSectionClick?: (sectionId: string) => void;
}

export default function Header({ onNavSectionClick }: HeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location !== "/") {
        setLocation("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        onNavSectionClick?.(id);
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      setLocation(href);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <>
      <header
        className={`fixed top-2 md:top-4 left-1/2 z-50 w-[calc(100vw-0.75rem)] md:w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 rounded-xl md:rounded-2xl border backdrop-blur-md shadow-lg transition-colors ${
          isLight
            ? "border-zinc-200 bg-white/80 shadow-zinc-200/50 text-zinc-900"
            : "border-zinc-800 bg-zinc-950/75 shadow-black/40 text-zinc-100"
        }`}
      >
        <div className="px-3 md:px-5 flex items-center justify-between h-14 md:h-16">
          <Link
            href="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`text-base md:text-xl font-bold uppercase font-share tracking-wider flex items-center gap-2 transition-colors ${
              isLight ? "text-zinc-950 hover:text-black" : "text-zinc-100 hover:text-white"
            }`}
          >
            <span
              className={`size-2 rounded-full animate-pulse ${
                isLight ? "bg-zinc-900" : "bg-zinc-300"
              }`}
            />
            El sótano del pc
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) =>
              link.href.startsWith("/#") ? (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`relative text-xs lg:text-sm uppercase tracking-wider cursor-pointer group pb-1 transition-colors ${
                    isLight
                      ? "text-zinc-600 hover:text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-px left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${
                      isLight ? "bg-zinc-900" : "bg-zinc-300"
                    }`}
                  />
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className={`relative text-xs lg:text-sm uppercase tracking-wider group pb-1 transition-colors ${
                    location === link.href
                      ? isLight
                        ? "text-zinc-950 font-bold"
                        : "text-white font-semibold"
                      : isLight
                      ? "text-zinc-600 hover:text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-px left-0 h-px transition-all duration-300 ${
                      isLight ? "bg-zinc-900" : "bg-zinc-300"
                    } ${
                      location === link.href ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ),
            )}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? "text-zinc-600 hover:text-black hover:bg-zinc-100"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/80"
              }`}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight
                  ? "text-zinc-700 hover:text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors border ${
                isLight
                  ? "text-zinc-800 border-zinc-200 bg-zinc-100"
                  : "text-zinc-300 border-zinc-800 bg-zinc-900/60"
              }`}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        role="button"
        tabIndex={0}
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setSidebarOpen(false);
        }}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 backdrop-blur-xl border-l transform transition-transform duration-300 ease-in-out md:hidden ${
          isLight
            ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-2xl"
            : "bg-zinc-950/95 border-zinc-800 text-zinc-100"
        } ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          className={`flex items-center justify-between px-6 h-16 border-b ${
            isLight ? "border-zinc-200" : "border-zinc-800"
          }`}
        >
          <span
            className={`text-sm uppercase tracking-widest font-semibold font-share ${
              isLight ? "text-zinc-900" : "text-zinc-200"
            }`}
          >
            El sótano
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? "text-zinc-500 hover:text-black"
                : "text-zinc-400 hover:text-white"
            }`}
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-col py-4">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className={`px-6 py-3.5 text-sm uppercase tracking-wider text-left border-l-2 transition-all cursor-pointer ${
                location === link.href
                  ? isLight
                    ? "text-zinc-950 bg-zinc-100 border-zinc-900 font-bold"
                    : "text-white bg-zinc-900/80 border-zinc-300 font-semibold"
                  : isLight
                  ? "text-zinc-600 hover:text-black hover:bg-zinc-50 border-transparent hover:border-zinc-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent hover:border-zinc-500"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
