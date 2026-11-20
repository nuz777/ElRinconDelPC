import { Globe, Link2 } from "lucide-react";
import { DOWNLOAD_HOSTS, summarizeDownloadHosts, type DownloadHostId } from "../domain/downloadHosts";

/** Logo del sitio (o un ícono genérico si no tiene). */
export function HostLogo({ host, className = "size-5" }: { host: DownloadHostId; className?: string }) {
  const info = DOWNLOAD_HOSTS[host];
  if (info.logo) {
    return <img src={info.logo} alt="" aria-hidden className={`${className} shrink-0 object-contain`} draggable={false} />;
  }
  const Icon = host === "official" ? Globe : Link2;
  return <Icon className={`${className} shrink-0`} style={{ color: info.color }} aria-hidden />;
}

/** Nombre del sitio con su color. */
function HostName({ host }: { host: DownloadHostId }) {
  const info = DOWNLOAD_HOSTS[host];
  return (
    <span className="font-bold" style={{ color: info.color }}>
      {info.label}
    </span>
  );
}

interface DownloadHostInfoProps {
  hosts: DownloadHostId[] | null | undefined;
  isLight: boolean;
}

/**
 * Dónde está alojado el archivo, debajo del botón de descarga:
 * 1 parte → "Alojado en Y"; varias en el mismo sitio → "X partes en Y"; mezcladas → "Parte X en Y".
 */
export default function DownloadHostInfo({ hosts, isLight }: DownloadHostInfoProps) {
  const summary = summarizeDownloadHosts(hosts);
  if (!summary) return null;

  const muted = isLight ? "text-zinc-600" : "text-zinc-400";

  if (summary.kind !== "mixed") {
    const info = DOWNLOAD_HOSTS[summary.host];
    return (
      <div
        className={`mt-3 flex items-center gap-3 px-3 py-2.5 border-l-[3px] border ${
          isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"
        }`}
        style={{ borderLeftColor: info.color, backgroundImage: `linear-gradient(90deg, ${info.color}1f, transparent 70%)` }}
      >
        <span className={`grid place-items-center size-8 shrink-0 border ${isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"}`}>
          <HostLogo host={summary.host} />
        </span>
        <p className={`text-xs leading-snug ${muted}`}>
          {summary.kind === "single" ? (
            <>
              Alojado en <HostName host={summary.host} />
            </>
          ) : (
            <>
              <span className={`font-bold ${isLight ? "text-zinc-900" : "text-white"}`}>{summary.parts} partes</span> en{" "}
              <HostName host={summary.host} />
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-3 border ${isLight ? "bg-white border-zinc-200" : "bg-zinc-900/70 border-zinc-800"}`}>
      <p className={`px-3 pt-2.5 pb-1.5 text-[11px] uppercase tracking-widest ${muted}`}>
        {summary.parts.length} partes en distintos sitios
      </p>
      <ol className="max-h-56 overflow-y-auto">
        {summary.parts.map((host, idx) => (
          <li
            key={idx}
            className={`flex items-center gap-2.5 px-3 py-1.5 text-xs border-t border-l-[3px] ${muted} ${
              isLight ? "border-t-zinc-100" : "border-t-zinc-800/70"
            }`}
            style={{ borderLeftColor: DOWNLOAD_HOSTS[host].color }}
          >
            <HostLogo host={host} className="size-4" />
            <span>
              Parte {idx + 1} en <HostName host={host} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
