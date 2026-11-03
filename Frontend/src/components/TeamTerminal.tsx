import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { team } from "../data/team";
import PortfolioModal from "./PortfolioModal";

interface Member {
  name: string;
  role: string;
  img: string;
  bio: string;
  github: string;
}

type Line =
  | { type: "text"; text: string; color?: string }
  | { type: "member"; member: Member };

const bootTexts = [
  "Inicializando sistema de terminal...",
  "Cargando perfil del creador...",
  "Conexión con El sótano establecida.",
];
const bootColors = ["text-zinc-400", "text-zinc-300", "text-zinc-100"];

export default function TeamTerminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [bootLine, setBootLine] = useState(0);
  const lsCount = useRef(0);
  const [locked, setLocked] = useState(false);
  const [bootChars, setBootChars] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    let lineIdx = 0;
    let charIdx = 0;

    const t = setInterval(() => {
      if (lineIdx >= bootTexts.length) {
        clearInterval(t);
        return;
      }

      const text = bootTexts[lineIdx];
      if (charIdx < text.length) {
        charIdx++;
        setBootChars(text.substring(0, charIdx));
      } else {
        setLines(prev => [...prev, { type: "text", text, color: bootColors[lineIdx] }]);
        lineIdx++;
        charIdx = 0;
        setBootLine(lineIdx);
        setBootChars("");
      }
    }, 25);

    return () => clearInterval(t);
  }, []);

  const focusInput = () => inputRef.current?.focus();

  const openMember = (member: Member) => {
    inputRef.current?.blur();
    setSelectedMember(member);
  };

  const addLine = (text: string, color?: string) => {
    setLines(prev => [...prev, { type: "text", text, color }]);
  };

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    addLine(`$ ${trimmed}`, "text-zinc-200");

    if (trimmed === "ls" || trimmed === "list") {
      if (lsCount.current > 3) return;
      if (lsCount.current === 3) {
        lsCount.current++;
        setLocked(true);
        addLine(`✖ Comando pausado por exceso de consultas.`, "text-zinc-500");
        return;
      }
      lsCount.current++;
      addLine(`total ${team.length}`, "text-zinc-500");
      team.forEach((m, i) => {
        setTimeout(() => {
          setLines(prev => [...prev, { type: "member", member: m }]);
        }, i * 60);
      });
    } else if (trimmed === "help" || trimmed === "comandos") {
      addLine(`Comandos disponibles:`, "text-zinc-200");
      addLine(`  ls / list        → Ver información del creador`, "text-zinc-400");
      addLine(`  catalogo         → Ir al catálogo de juegos y herramientas`, "text-zinc-400");
      addLine(`  clear            → Limpiar terminal`, "text-zinc-400");
    } else if (trimmed === "catalogo" || trimmed === "juegos") {
      addLine(`Abriendo catálogo...`, "text-zinc-200");
      setTimeout(() => {
        window.location.href = "/catalogo";
      }, 400);
    } else if (trimmed === "clear") {
      setLines([]);
    } else if (trimmed !== "") {
      addLine(`✖ Comando no reconocido: '${trimmed}'`, "text-zinc-500");
      addLine(`Escribe 'help' para ver los comandos disponibles.`, "text-zinc-600");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      processCommand(input);
      setInput("");
    }
  };

  return (
    <>
      {selectedMember &&
        createPortal(
          <PortfolioModal
            isOpen={!!selectedMember}
            onClose={() => { setSelectedMember(null); }}
            name={selectedMember.name}
            role={selectedMember.role}
            img={selectedMember.img}
            bio={selectedMember.bio}
            github={selectedMember.github}
          />,
          document.body
        )}

      <div className="max-w-4xl mx-auto px-4" onClick={focusInput}>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl font-share">
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-zinc-700" />
              <div className="size-3 rounded-full bg-zinc-600" />
              <div className="size-3 rounded-full bg-zinc-500" />
            </div>
            <span className="text-xs text-zinc-400 ml-2">nuz@el-sotano:~/equipo</span>
          </div>

          <div className="p-5 min-h-[300px] max-h-[440px] overflow-y-auto text-sm leading-relaxed select-text">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-zinc-300 mb-3 whitespace-pre leading-tight font-share"
            >
{`╔═══════════════════════════════════════════════════╗
║        EL SÓTANO DEL PC · TERMINAL v2.0          ║
║      'ls' creador  ·  'catalogo'  ·  'help'       ║
╚═══════════════════════════════════════════════════╝`}
            </motion.div>

            {bootLine < bootTexts.length && bootChars && (
              <div className={bootColors[bootLine]}>
                {bootChars}<span className="animate-pulse">▌</span>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {lines.map((line, i) =>
                line.type === "text" ? (
                  <motion.div
                    key={`text-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={line.color || "text-zinc-300"}
                  >
                    {line.text}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`member-${line.member.name}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={(e) => { e.stopPropagation(); openMember(line.member); }}
                    className="text-zinc-200 hover:text-white cursor-pointer py-1 transition-colors flex items-center gap-3 group"
                  >
                    <span className="text-zinc-600 font-mono text-xs">drwxr-xr-x</span>
                    <span className="font-semibold text-white underline decoration-zinc-600 group-hover:decoration-white underline-offset-4">
                      {line.member.name}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      · {line.member.role} (Toca para ver perfil)
                    </span>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-900">
              <span className={`shrink-0 ${locked ? "text-zinc-600" : "text-zinc-400"}`}>
                {locked ? "✖" : "$"}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={locked}
                className="flex-1 bg-transparent border-none outline-none text-zinc-100 font-share text-sm p-0 caret-zinc-200 placeholder:text-zinc-600 disabled:cursor-not-allowed"
                placeholder={locked ? "terminal bloqueada temporalmente" : "escribe 'help' o 'ls'..."}
                spellCheck={false}
                autoComplete="off"
              />
              {!locked && <span className="inline-block w-2 h-4 bg-zinc-200 animate-pulse" />}
            </div>
            <div ref={endRef} />
          </div>
        </div>
      </div>
    </>
  );
}
