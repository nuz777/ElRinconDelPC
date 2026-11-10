import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../context/AuthContext";

const isCatalogRoute = (path: string) => path === "/catalogo" || path === "/sotano";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user, isAuthenticated, logout: authLogout } = useAuth();

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = useCallback(() => {
    authLogout();
  }, [authLogout]);

  const handleNavClick = (href: string) => {
    setDropdownOpen(false);
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

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const linkClass = (active: boolean) => `
    block px-4 py-2.5 text-xs lg:text-sm uppercase tracking-wider transition-colors ${
      active
        ? isLight
          ? "text-zinc-950 font-bold bg-zinc-100"
          : "text-white font-semibold bg-zinc-800/50"
        : isLight
          ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
    }
  `;

  const inCatalogWithSession = isCatalogRoute(location) && isAuthenticated;
  const displayName = user?.name || user?.username || user?.email;

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
          {/* En catálogo con sesión activa: sin logo ni menú desplegable */}
          <div ref={dropdownContainerRef} className="flex items-center gap-2 relative group">
            {inCatalogWithSession ? (
              <div />
            ) : (
              <button
                onClick={toggleDropdown}
                className={`flex items-center gap-2 transition-colors cursor-pointer ${
                  isLight
                    ? "text-zinc-950 hover:text-black"
                    : "text-zinc-100 hover:text-white"
                }`}
                aria-label="Abrir menú de navegación"
              >
                <span
                  className={`size-2 rounded-full animate-pulse ${
                    isLight ? "bg-zinc-900" : "bg-zinc-300"
                  }`}
                />
                <span className="text-base md:text-xl font-bold uppercase font-share tracking-wider">
                  El sótano del pc
                </span>
                {dropdownOpen ? (
                  <ChevronUp size={16} className="transition-transform duration-200" />
                ) : (
                  <ChevronDown size={16} className="transition-transform duration-200" />
                )}
              </button>
            )}

            {/* Menú desplegable con animación de bajada (solo cuando NO está en catálogo con sesión activa) */}
            <AnimatePresence>
              {!inCatalogWithSession && dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-lg z-50 overflow-hidden origin-top-left ${
                    isLight
                      ? "bg-white border-zinc-200 text-zinc-900"
                      : "bg-zinc-900 border-zinc-800 text-zinc-100"
                  }`}
                >
                  {navLinks
                    .filter((link) => link.href !== "/catalogo")
                    .map((link) => (
                      <button
                        key={link.href}
                        onClick={() => handleNavClick(link.href)}
                        className={`w-full text-left cursor-pointer ${linkClass(location === link.href)}`}
                      >
                        {link.label}
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Área derecha:
              - En catálogo con sesión activa: SOLO nombre de usuario y botón "Cerrar sesión".
              - En cualquier otra ruta (o catálogo sin sesión): link a Catálogo + botones "Iniciar sesión" y "Crear cuenta". */}
          {inCatalogWithSession ? (
            <div className="flex items-center gap-3 text-xs sm:text-sm font-share tracking-wider">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span
                  className="font-bold uppercase max-w-[180px] truncate"
                  title={displayName}
                >
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLight
                    ? "border-zinc-300 text-zinc-700 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                    : "border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-800/60 hover:bg-red-950/30"
                }`}
                title="Cerrar sesión"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Right Area (sin sesión o fuera de catálogo) */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/catalogo"
                  onClick={() => window.scrollTo({ top: 0 })}
                  className={`text-xs lg:text-sm uppercase tracking-wider group relative pb-1 transition-colors ${
                    location === "/catalogo"
                      ? isLight
                        ? "text-zinc-950 font-bold"
                        : "text-white font-semibold"
                      : isLight
                        ? "text-zinc-600 hover:text-black"
                        : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Catálogo
                  <span
                    className={`absolute -bottom-px left-0 h-px transition-all duration-300 ${
                      isLight ? "bg-zinc-900" : "bg-zinc-300"
                    } ${
                      location === "/catalogo" ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={`text-xs lg:text-sm uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors border ${
                      isLight
                        ? "border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50"
                        : "border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/30"
                    }`}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className={`text-xs lg:text-sm uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                      isLight
                        ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                        : "bg-white text-zinc-950 hover:bg-zinc-100"
                    }`}
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>

              {/* Mobile Right Area (fuera de catálogo o sin sesión) */}
              <div className="flex items-center gap-2 md:hidden">
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
            </>
          )}
        </div>
      </header>

      {/* Mobile Backdrop & Drawer (solo cuando NO estamos en catálogo con sesión activa) */}
      {!inCatalogWithSession && (
        <>
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

            <div
              className={`mt-auto p-4 border-t flex flex-col gap-2 shrink-0 ${
                isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <Link
                href="/login"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-center text-xs uppercase tracking-wider py-2 rounded-lg transition-colors border ${
                  isLight
                    ? "border-zinc-300 text-zinc-700 hover:text-black hover:bg-zinc-100"
                    : "border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                }`}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setSidebarOpen(false)}
                className={`w-full text-center text-xs uppercase tracking-wider py-2 rounded-lg transition-colors ${
                  isLight
                    ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                    : "bg-white text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
