import { useRef, useState, type ComponentType, type PointerEvent } from "react";
import { Star } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { teamMembers, type TeamMember, type TeamRank } from "../../data/team";
import { EagleClasp, GoldHonorCross, OakLeavesCross } from "./Medals";
import { teamSfx } from "./retroSfx";
import RpgDialog from "./RpgDialog";
import DossierModal from "./DossierModal";

const RANK_STARS: Record<TeamRank, number> = { general: 4, "teniente-general": 3, "general-division": 2 };

const RANK_MEDAL: Record<TeamRank, { Medal: ComponentType<{ className?: string }>; className: string }> = {
  general: { Medal: OakLeavesCross, className: "w-16 sm:w-24" },
  "teniente-general": { Medal: GoldHonorCross, className: "w-14 sm:w-20" },
  "general-division": { Medal: EagleClasp, className: "w-24 sm:w-32" },
};

/** Orden en pantalla: el de mayor rango al centro (en móvil va primero). */
const DISPLAY_ORDER: TeamRank[] = ["teniente-general", "general", "general-division"];

/** Nota normal (los demás): ficha del expediente con el texto completo. */
function DossierNote({ member }: { member: TeamMember }) {
  return (
    <div className="dossier-bubble dossier-note">
      <span className="dossier-note-label">Informe · Exp. Nº {member.serial}</span>
      <p>{member.bio}</p>
    </div>
  );
}

function DossierCard({ member, onOpen }: { member: TeamMember; onOpen: (m: TeamMember) => void }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const isNicholas = member.rank === "general-division";
  const isNuz = member.rank === "general";
  const isDozenApollo = member.rank === "teniente-general";
  const { Medal, className: medalClass } = RANK_MEDAL[member.rank];

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || reduceMotion || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const activate = () => {
    setActive(true);
    teamSfx.unlock();
    if (isNicholas) teamSfx.move();
    if (isNuz) teamSfx.trophy();
    if (isDozenApollo) teamSfx.doom();
  };

  const deactivate = () => {
    setActive(false);
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <article
      ref={ref}
      tabIndex={0}
      data-rank={member.rank}
      role="button"
      aria-haspopup="dialog"
      aria-label={`${member.rankTitle} ${member.name}, ${member.post}. Abrir expediente`}
      className={`dossier group ${active ? "is-active" : ""}`}
      onPointerMove={onMove}
      onPointerEnter={(e) => e.pointerType === "mouse" && activate()}
      onPointerLeave={(e) => e.pointerType === "mouse" && deactivate()}
      onFocus={activate}
      onBlur={deactivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isNicholas) teamSfx.select();
          if (isDozenApollo) teamSfx.doom();
          onOpen(member);
        }
      }}
      onClick={(e) => {
        // En táctil no hay hover: el primer toque muestra la ficha y el segundo abre el expediente
        const touch = (e.nativeEvent as globalThis.PointerEvent).pointerType !== "mouse";
        if (touch && !active) return activate();
        if (isNicholas) teamSfx.select();
        if (isDozenApollo) teamSfx.doom();
        onOpen(member);
      }}
    >
      <div className="dossier-frame">
        {/* Remaches */}
        {["top-1.5 left-1.5", "top-1.5 right-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"].map((pos) => (
          <span key={pos} className={`dossier-rivet ${pos}`} aria-hidden />
        ))}

        <div className="dossier-inner">
          {/* Cabecera del expediente */}
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <span>Exp. Nº {member.serial}</span>
            <span className="flex gap-0.5 dossier-stars" aria-label={`${RANK_STARS[member.rank]} estrellas`}>
              {Array.from({ length: RANK_STARS[member.rank] }).map((_, i) => (
                <Star key={i} className="size-3 fill-current" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </span>
          </div>

          {/* Retrato */}
          <div className="dossier-portrait">
            <img src={member.img} alt={`Retrato de ${member.name}`} loading="lazy" decoding="async" draggable={false} />
            <span className="dossier-portrait-grain" aria-hidden />
            <span className="dossier-shine" aria-hidden />
            {["tl", "tr", "bl", "br"].map((c) => (
              <span key={c} className={`dossier-bracket dossier-bracket-${c}`} aria-hidden />
            ))}
            <span className="dossier-stamp" aria-hidden>
              Condecorado
            </span>
          </div>

          {/* Placa del rango */}
          <div className="dossier-plaque">{member.rankTitle}</div>

          <div className="px-4 pt-3 pb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {isNicholas && <span className="dossier-soul" aria-hidden />}
              <h3 className="dossier-name">{member.name}</h3>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-zinc-400">{member.post}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500 truncate">{member.role}</p>
          </div>
        </div>
      </div>

      {/* Medalla prendida en el costado */}
      <span className={`dossier-medal ${medalClass}`} aria-hidden>
        <Medal className="w-full h-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]" />
      </span>

      {isNicholas ? (
        <RpgDialog text={member.bio} active={active} className="dossier-bubble" />
      ) : (
        <DossierNote member={member} />
      )}
    </article>
  );
}

/** "Equipo de desarrollo": recuadros de retrato militar con marco, rango y medalla. */
export default function TeamRoster() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const ordered = DISPLAY_ORDER.map((rank) => teamMembers.find((m) => m.rank === rank)).filter(
    (m): m is TeamMember => Boolean(m),
  );

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-4 font-share">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 items-end md:pb-40">
        {ordered.map((member) => (
          <div key={member.name} className={member.rank === "general" ? "order-first md:order-none md:-translate-y-8" : ""}>
            <DossierCard member={member} onOpen={setSelected} />
          </div>
        ))}
      </div>
      <DossierModal member={selected} onClose={() => setSelected(null)} stars={RANK_STARS} medals={RANK_MEDAL} />
    </div>
  );
}
