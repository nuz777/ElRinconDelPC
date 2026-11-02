import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  role: string;
  img: string;
  bio: string;
  github: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function TypingEffect({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    const startTimer = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.substring(0, currentIndex));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [text, delay]);

  return (
    <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-share">
      {displayText}
      {!isComplete && <span className="animate-pulse text-zinc-100 font-bold">|</span>}
    </p>
  );
}

export default function PortfolioModal({
  isOpen,
  onClose,
  name,
  role,
  img,
  bio,
  github,
}: PortfolioModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          initial={isMobile ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={isMobile ? undefined : { opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 p-0 rounded-2xl shadow-2xl border border-zinc-800 font-share"
            initial={isMobile ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
            transition={isMobile ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 22 }}
          >
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800 rounded-t-2xl">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-zinc-700" />
                <div className="size-3 rounded-full bg-zinc-600" />
                <div className="size-3 rounded-full bg-zinc-500" />
              </div>
              <span className="text-xs text-zinc-400 ml-2">perfil@{name.toLowerCase().replace(/\s+/g, "-")}:~</span>
              <button
                onClick={onClose}
                className="ml-auto text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center p-6 md:p-8">
              <motion.div
                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={isMobile ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 20, delay: 0.15 }}
                className="flex justify-center"
              >
                <div className="relative w-44 h-44 md:w-64 md:h-64 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900">
                  <img
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={isMobile ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={isMobile ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 20, delay: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">{name}</h2>
                  <p className="text-sm uppercase tracking-wider text-zinc-400 font-medium">{role}</p>
                </div>

                <div className="w-16 h-px bg-zinc-700" />

                <TypingEffect text={bio} delay={isMobile ? 0 : 300} />

                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium transition-all text-sm shadow-md"
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Ver Perfil de GitHub
                </a>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
