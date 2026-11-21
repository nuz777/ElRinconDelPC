import { useEffect, useRef, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Star, X } from "lucide-react";
import type { TeamMember, TeamRank } from "../../data/team";
import RpgDialog from "./RpgDialog";

interface DossierModalProps {
  member: TeamMember | null;
  onClose: () => void;
  stars: Record<TeamRank, number>;
  medals: Record<TeamRank, { Medal: ComponentType<{ className?: string }> }>;
}

const MEDAL_NAME: Record<TeamRank, string> = {
  general: "Cruz de Plata con Hojas de Roble",
  "teniente-general": "Cruz de Honor de Oro",
  "general-division": "Broche del Águila · 0826",
};

function GitHubIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/** Expediente completo de un miembro, con el marco, colores y medalla de su rango. */
export default function DossierModal({ member, onClose, stars, medals }: DossierModalProps) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!member) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [member, onClose]);

  if (typeof document === "undefined") return null;

  const isNicholas = member?.rank === "general-division";
  const Medal = member ? medals[member.rank].Medal : null;

  return createPortal(
    <AnimatePresence>
      {member && Medal && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-share"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Expediente de ${member.name}`}
            data-rank={member.rank}
            className="dossier-modal"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 24 }}
          >
            <div className="dossier-modal-frame">
              {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
                <span key={pos} className={`dossier-rivet ${pos}`} aria-hidden />
              ))}

              <div className="dossier-modal-inner">
                {/* Barra superior */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-zinc-400">
                    Expediente clasificado · Nº {member.serial}
                  </span>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar expediente"
                    className="dossier-modal-close"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,17rem)_1fr] gap-6 md:gap-8 p-4 sm:p-6 md:p-8">
                  {/* Retrato */}
                  <div className="mx-auto w-full max-w-[15rem] md:max-w-none">
                    <div className="dossier-modal-portrait">
                      <img src={member.img} alt={`Retrato de ${member.name}`} decoding="async" draggable={false} />
                      {["tl", "tr", "bl", "br"].map((c) => (
                        <span key={c} className={`dossier-bracket dossier-bracket-${c}`} aria-hidden />
                      ))}
                      <span className="dossier-modal-stamp" aria-hidden>
                        Condecorado
                      </span>
                    </div>
                    <div className="dossier-plaque dossier-modal-plaque">{member.rankTitle}</div>
                  </div>

                  {/* Datos */}
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1 dossier-modal-stars" aria-label={`${stars[member.rank]} estrellas`}>
                      {Array.from({ length: stars[member.rank] }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <h2 className="mt-2 flex items-center gap-3 text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-white">
                      {isNicholas && <span className="dossier-soul" aria-hidden />}
                      {member.name}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] dossier-modal-accent">{member.post}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">{member.role}</p>

                    <div className="my-5 h-px bg-gradient-to-r from-white/25 via-white/10 to-transparent" />

                    {isNicholas ? (
                      <RpgDialog text={member.bio} active className="dossier-modal-rpg" speed={45} />
                    ) : (
                      <div className="dossier-note dossier-modal-note">
                        <span className="dossier-note-label">Informe del expediente</span>
                        <p>{member.bio}</p>
                      </div>
                    )}

                    {/* Condecoración */}
                    <div className="mt-6 flex items-center gap-4">
                      <div className="dossier-modal-medal">
                        <Medal className="w-full h-auto drop-shadow-[0_8px_14px_rgba(0,0,0,0.6)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Condecoración</p>
                        <p className="text-sm font-bold text-zinc-200">{MEDAL_NAME[member.rank]}</p>
                      </div>
                    </div>

                    {member.github && (
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="dossier-modal-link">
                        <GitHubIcon />
                        Ver perfil de GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
