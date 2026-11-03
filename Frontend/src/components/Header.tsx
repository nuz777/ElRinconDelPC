import { useEffect, useState, useCallback } from "react";
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

interface CurrentUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
}

const getStoredUser = (): CurrentUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const rawToken = localStorage.getItem("sotano_token");
    const rawUser = localStorage.getItem("sotano_user");
    if (!rawToken && !rawUser) return null;
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && typeof parsed === "object") return parsed;
    }
    if (rawToken) {
      return { name: "Usuario" };
    }
    return null;
  } catch {
    return null;
  }
};

export default function Header({ onNavSectionClick }: HeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getStoredUser);

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("sotano_token");
      localStorage.removeItem("sotano_user");
    } catch {
      // ignore
    }
    setCurrentUser(null);
    window.location.reload();
  }, []);

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
        className={`fixed top-0 left-0 w-full z-50 border-b backdrop-blur-md shadow-sm transition-colors rounded-none ${
          isLight
            ? "border-zinc-200/80 bg-white/90 shadow-zinc-200/40 text-zinc-900"
            : "border-zinc-800/80 bg-zinc-950/90 shadow-black/40 text-zinc-100"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
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

          {/* Desktop Right Area */}
          <div className="hidden md:flex items-center gap-5">
            <nav className="flex items-center gap-5">
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

            {/* Logged-in user in top-right corner. Strictly nothing if not logged in. */}
            {currentUser ? (
              <div
                className={`flex items-center gap-2 pl-3 border-l text-xs font-share tracking-wider ${
                  isLight
                    ? "border-zinc-300 text-zinc-900"
                    : "border-zinc-800 text-zinc-100"
                }`}
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span
                  className="font-bold uppercase max-w-[140px] truncate"
                  title={currentUser.name || currentUser.username || currentUser.email}
                >
                  {currentUser.name || currentUser.username || currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[10px] text-zinc-400 hover:text-red-400 cursor-pointer ml-1 font-mono transition-colors"
                  title="Cerrar sesión"
                >
                  [Salir]
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Right Area */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile user indicator: strictly nothing if not logged in */}
            {currentUser ? (
              <div
                className={`flex items-center gap-1.5 text-xs font-share font-semibold uppercase tracking-wider max-w-[110px] truncate mr-1 ${
                  isLight ? "text-zinc-900" : "text-zinc-100"
                }`}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">
                  {currentUser.name || currentUser.username || currentUser.email}
                </span>
              </div>
            ) : null}

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
        className={`fixed top-0 right-0 z-50 h-full w-64 backdrop-blur-xl border-l flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          isLight
            ? "bg-white/95 border-zinc-200 text-zinc-900 shadow-2xl"
            : "bg-zinc-950/95 border-zinc-800 text-zinc-100"
        } ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div
          className={`flex items-center justify-between px-6 h-16 border-b shrink-0 ${
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

        <nav className="flex flex-col py-4 flex-1 overflow-y-auto">
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

        {/* Mobile drawer: user info and logout at bottom if logged in; strictly nothing if not logged in */}
        {currentUser ? (
          <div
            className={`mt-auto p-4 border-t flex items-center justify-between text-xs font-share shrink-0 ${
              isLight
                ? "border-zinc-200 bg-zinc-50 text-zinc-900"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-bold uppercase truncate max-w-[120px]">
                {currentUser.name || currentUser.username || currentUser.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                handleLogout();
              }}
              className="text-[11px] text-zinc-400 hover:text-red-400 cursor-pointer font-mono shrink-0 ml-2"
            >
              [Cerrar sesión]
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
