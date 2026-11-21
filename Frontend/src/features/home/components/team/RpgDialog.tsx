import { useEffect, useState } from "react";
import { teamSfx } from "./retroSfx";

interface RpgDialogProps {
  text: string;
  active: boolean;
  className?: string;
  /** Milisegundos por letra. */
  speed?: number;
}

/** Cuadro de diálogo estilo UNDERTALE/DELTARUNE: escribe letra por letra con sonido (solo Nicholas). */
export default function RpgDialog({ text, active, className = "", speed = 38 }: RpgDialogProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!active) return;
    let i = 0;
    const timer = window.setInterval(() => {
      i++;
      setShown(i);
      if (text[i - 1] && text[i - 1] !== " ") teamSfx.text();
      if (i >= text.length) window.clearInterval(timer);
    }, speed);
    return () => {
      window.clearInterval(timer);
      setShown(0);
    };
  }, [active, text, speed]);

  return (
    <div className={`dossier-rpg ${className}`} aria-hidden={!active}>
      <span className="dossier-rpg-soul" aria-hidden />
      <p>
        {text.slice(0, active ? shown : 0)}
        {active && shown < text.length && <span className="animate-pulse">▌</span>}
      </p>
    </div>
  );
}
