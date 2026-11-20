import { Check, Minus, Plus } from "lucide-react";
import {
  DOWNLOAD_HOSTS,
  DOWNLOAD_HOST_IDS,
  MAX_DOWNLOAD_PARTS,
  type DownloadHostId,
} from "../domain/downloadHosts";
import { HostLogo } from "./DownloadHostBadge";

interface DownloadHostPickerProps {
  /** Un sitio por parte. Vacío = sin medio elegido. */
  value: DownloadHostId[];
  onChange: (value: DownloadHostId[]) => void;
  isLight: boolean;
}

/** Fichas con logo y color para elegir un sitio. */
function HostChips({
  selected,
  onSelect,
  isLight,
}: {
  selected: DownloadHostId | null;
  onSelect: (host: DownloadHostId) => void;
  isLight: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Medio de descarga">
      {DOWNLOAD_HOST_IDS.map((id) => {
        const info = DOWNLOAD_HOSTS[id];
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(id)}
            className={`relative flex items-center gap-2 px-2.5 py-2 border text-left text-xs font-semibold cursor-pointer transition-colors ${
              active
                ? isLight
                  ? "bg-zinc-50 text-zinc-900"
                  : "bg-zinc-900 text-white"
                : isLight
                  ? "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
            style={active ? { borderColor: info.color, boxShadow: `inset 3px 0 0 ${info.color}` } : undefined}
          >
            <HostLogo host={id} className="size-4" />
            <span className="truncate">{info.label}</span>
            {active && <Check className="size-3.5 ml-auto shrink-0" style={{ color: info.color }} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * "Medio de descarga": número de partes y el sitio de cada una.
 * Con varias partes se puede elegir un solo sitio para todas o uno distinto por parte.
 */
export default function DownloadHostPicker({ value, onChange, isLight }: DownloadHostPickerProps) {
  const parts = Math.max(1, value.length);
  const sameHost = value.length <= 1 || value.every((h) => h === value[0]);
  const first = value[0] ?? null;

  const setParts = (n: number) => {
    const count = Math.min(MAX_DOWNLOAD_PARTS, Math.max(1, Math.round(n) || 1));
    if (!first) return onChange([]);
    const next = Array.from({ length: count }, (_, i) => value[i] ?? (sameHost ? first : value[value.length - 1]));
    onChange(next);
  };

  const label = `block text-[11px] uppercase tracking-wider font-semibold mb-1.5 ${isLight ? "text-zinc-500" : "text-zinc-400"}`;
  const stepper = `grid place-items-center size-9 border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
    isLight ? "border-zinc-300 hover:bg-zinc-100" : "border-zinc-700 hover:bg-zinc-800"
  }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <span className={label}>Partes</span>
          <div className="flex items-center gap-1.5">
            <button type="button" className={stepper} onClick={() => setParts(parts - 1)} disabled={!first || parts <= 1} aria-label="Quitar una parte">
              <Minus className="size-4" />
            </button>
            <input
              type="number"
              min={1}
              max={MAX_DOWNLOAD_PARTS}
              value={parts}
              disabled={!first}
              onChange={(e) => setParts(Number(e.target.value))}
              aria-label="Número de partes"
              className={`w-16 h-9 text-center border text-sm font-semibold focus:outline-none disabled:opacity-50 ${
                isLight ? "bg-white border-zinc-300 focus:border-zinc-700" : "bg-zinc-900 border-zinc-700 focus:border-zinc-400"
              }`}
            />
            <button
              type="button"
              className={stepper}
              onClick={() => setParts(parts + 1)}
              disabled={!first || parts >= MAX_DOWNLOAD_PARTS}
              aria-label="Agregar una parte"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {parts > 1 && (
          <div className={`flex border text-xs ${isLight ? "border-zinc-300" : "border-zinc-700"}`} role="group" aria-label="Sitio de las partes">
            {[
              { same: true, text: "Todas en el mismo sitio" },
              { same: false, text: "Un sitio por parte" },
            ].map((opt) => (
              <button
                key={String(opt.same)}
                type="button"
                aria-pressed={sameHost === opt.same}
                onClick={() => {
                  if (opt.same) onChange(Array.from({ length: parts }, () => first as DownloadHostId));
                  else if (sameHost && first) {
                    // Se marca la última parte como "Otro sitio" para que se note el modo por parte
                    onChange(value.map((h, i) => (i === value.length - 1 ? (h === "other" ? "mediafire" : "other") : h)));
                  }
                }}
                className={`px-3 h-9 font-semibold cursor-pointer transition-colors ${
                  sameHost === opt.same
                    ? isLight
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-950"
                    : isLight
                      ? "text-zinc-600 hover:bg-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {first && (
          <button
            type="button"
            onClick={() => onChange([])}
            className={`ml-auto text-xs underline underline-offset-2 cursor-pointer ${isLight ? "text-zinc-500 hover:text-black" : "text-zinc-400 hover:text-white"}`}
          >
            Quitar medio
          </button>
        )}
      </div>

      {sameHost ? (
        <div>
          <span className={label}>{parts > 1 ? `Sitio de las ${parts} partes` : "Sitio donde está alojado"}</span>
          <HostChips
            selected={first}
            isLight={isLight}
            onSelect={(host) => onChange(Array.from({ length: parts }, () => host))}
          />
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {value.map((host, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 px-2.5 py-1.5 border-l-[3px] border ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-950/60 border-zinc-800"
              }`}
              style={{ borderLeftColor: DOWNLOAD_HOSTS[host].color }}
            >
              <span className={`w-16 shrink-0 text-xs font-semibold ${isLight ? "text-zinc-700" : "text-zinc-300"}`}>Parte {idx + 1}</span>
              <HostLogo host={host} className="size-4" />
              <select
                value={host}
                onChange={(e) => onChange(value.map((h, i) => (i === idx ? (e.target.value as DownloadHostId) : h)))}
                className={`flex-1 min-w-0 h-8 px-2 border text-xs cursor-pointer focus:outline-none ${
                  isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-900 border-zinc-700 text-zinc-100"
                }`}
              >
                {DOWNLOAD_HOST_IDS.map((id) => (
                  <option key={id} value={id}>
                    {DOWNLOAD_HOSTS[id].label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {!first && (
        <p className={`text-[11px] ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
          Elige dónde está alojado el archivo real que hay detrás del enlace de exe.io. Si es un .txt con varios enlaces, elige el sitio de esos enlaces y el número de partes.
        </p>
      )}
    </div>
  );
}
