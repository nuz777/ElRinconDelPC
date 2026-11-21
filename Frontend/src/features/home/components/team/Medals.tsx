import { useId } from "react";

interface MedalProps {
  className?: string;
}

/** Contorno de una cruz pattée (brazos que se ensanchan hacia afuera), centrada en 0,0. */
const crossPath = (inner: number, outer: number, halfIn: number, halfOut: number) =>
  [
    `M ${-halfIn} ${-inner}`,
    `L ${-halfOut} ${-outer}`,
    `L ${halfOut} ${-outer}`,
    `L ${halfIn} ${-inner}`,
    `L ${inner} ${-halfIn}`,
    `L ${outer} ${-halfOut}`,
    `L ${outer} ${halfOut}`,
    `L ${inner} ${halfIn}`,
    `L ${halfIn} ${inner}`,
    `L ${halfOut} ${outer}`,
    `L ${-halfOut} ${outer}`,
    `L ${-halfIn} ${inner}`,
    `L ${-inner} ${halfIn}`,
    `L ${-outer} ${halfOut}`,
    `L ${-outer} ${-halfOut}`,
    `L ${-inner} ${-halfIn}`,
    "Z",
  ].join(" ");

/** Hoja de roble apuntando hacia arriba, con la base en 0,0. */
const OAK_LEAF =
  "M0 0 C-4 -3 -7 -6 -5 -9 C-8 -11 -8 -14 -5 -15 C-7 -18 -5 -21 -2 -21 C-2 -24 0 -26 0 -26 C0 -26 2 -24 2 -21 C5 -21 7 -18 5 -15 C8 -14 8 -11 5 -9 C7 -6 4 -3 0 0Z";

/** Corazón pixelado (7x6). */
const HEART_PIXELS = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];

function PixelHeart({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <g transform={`translate(${x - (7 * size) / 2} ${y - (6 * size) / 2})`}>
      {HEART_PIXELS.flatMap((row, r) =>
        [...row].map((c, col) =>
          c === "X" ? <rect key={`${r}-${col}`} x={col * size} y={r * size} width={size} height={size} fill={color} /> : null,
        ),
      )}
    </g>
  );
}

/** Rango más alto: cruz de hierro de plata con hojas de roble, en cinta roja y blanca. */
export function OakLeavesCross({ className }: MedalProps) {
  const id = useId().replace(/:/g, "");
  const silver = `silver-${id}`;
  const ribbed = `ribbed-${id}`;
  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-label="Cruz con hojas de roble">
      <defs>
        <linearGradient id={silver} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.35" stopColor="#a1a1aa" />
          <stop offset="0.6" stopColor="#fafafa" />
          <stop offset="1" stopColor="#71717a" />
        </linearGradient>
        <pattern id={ribbed} width="2" height="4" patternUnits="userSpaceOnUse">
          <rect width="1" height="4" fill="#000" opacity="0.14" />
        </pattern>
      </defs>
      {/* Cinta */}
      <path d="M4 4 L116 2 L118 38 L2 40 Z" fill="#fafafa" />
      <path d="M4 10 L116 8 L117 32 L3 34 Z" fill="#c8102e" />
      <path d="M4 4 L116 2 L118 38 L2 40 Z" fill={`url(#${ribbed})`} />
      {/* Hojas de roble */}
      <g transform="translate(60 42)" fill={`url(#${silver})`} stroke="#52525b" strokeWidth="0.7">
        {[-52, -26, 0, 26, 52].map((deg) => (
          <path key={deg} d={OAK_LEAF} transform={`rotate(${deg}) scale(${deg === 0 ? 1.15 : 1})`} />
        ))}
      </g>
      {/* Argolla */}
      <circle cx="60" cy="50" r="4" fill="none" stroke={`url(#${silver})`} strokeWidth="2.5" />
      {/* Cruz */}
      <g transform="translate(60 102)">
        <path d={crossPath(10, 44, 7, 16)} fill={`url(#${silver})`} stroke="#3f3f46" strokeWidth="1" />
        <path d={crossPath(8, 38, 5, 12.5)} fill="#18181b" stroke="#d4d4d8" strokeWidth="1.2" strokeDasharray="1.2 1" />
        {/* Emblema central: la cruz de honor (forma de la medalla del Teniente General) en plata */}
        <g transform="scale(0.36)">
          <path d={crossPath(12, 46, 9, 17)} fill={`url(#${silver})`} stroke="#3f3f46" strokeWidth="2" />
          <circle r="17" fill={`url(#${silver})`} stroke="#3f3f46" strokeWidth="2" />
          <circle r="13" fill="none" stroke="#52525b" strokeWidth="2.5" strokeDasharray="3 2" />
          <g fill="#3f3f46">
            <circle cx="0" cy="-7" r="2.6" />
            <path d="M-1.5 -5 L1.5 -5 L2.5 6 L0 9 L-2.5 6 Z" />
            <path d="M-2 -3 L-11 -6 L-12 -3 L-10 -1 L-11 1 L-8 2 L-8 4 L-3 3 Z" />
            <path d="M2 -3 L11 -6 L12 -3 L10 -1 L11 1 L8 2 L8 4 L3 3 Z" />
          </g>
        </g>
        <text x="0" y="33" textAnchor="middle" fontSize="8" fontWeight="700" fill="#d4d4d8" fontFamily="serif">
          2016
        </text>
      </g>
    </svg>
  );
}

/** Segundo rango: cruz de honor dorada con águila y barra de hojas de roble. */
export function GoldHonorCross({ className }: MedalProps) {
  const id = useId().replace(/:/g, "");
  const gold = `gold-${id}`;
  const ribbed = `ribbed-${id}`;
  return (
    <svg viewBox="0 0 120 170" className={className} role="img" aria-label="Cruz de honor dorada">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.4" stopColor="#b45309" />
          <stop offset="0.65" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <pattern id={ribbed} width="4" height="2" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000" opacity="0.16" />
        </pattern>
      </defs>
      {/* Cinta vertical: dorado, rojo, negro, rojo, dorado */}
      <path d="M30 0 H90 V54 L60 64 L30 54 Z" fill="#d4a017" />
      <path d="M38 0 H82 V56.7 L60 64 L38 56.7 Z" fill="#c8102e" />
      <path d="M46 0 H74 V59.3 L60 64 L46 59.3 Z" fill="#111" />
      <path d="M30 0 H90 V54 L60 64 L30 54 Z" fill={`url(#${ribbed})`} />
      {/* Barra de hojas de roble */}
      <g fill={`url(#${gold})`} stroke="#78350f" strokeWidth="0.6">
        <path d={OAK_LEAF} transform="translate(60 22) rotate(-80) scale(0.75)" />
        <path d={OAK_LEAF} transform="translate(60 22) rotate(-100) scale(0.6)" />
        <path d={OAK_LEAF} transform="translate(60 22) rotate(80) scale(0.75)" />
        <path d={OAK_LEAF} transform="translate(60 22) rotate(100) scale(0.6)" />
      </g>
      <circle cx="60" cy="68" r="4" fill="none" stroke={`url(#${gold})`} strokeWidth="2.5" />
      {/* Cruz */}
      <g transform="translate(60 118)">
        <path d={crossPath(12, 46, 9, 17)} fill={`url(#${gold})`} stroke="#78350f" strokeWidth="1" />
        <path d={crossPath(14, 40, 6, 12)} fill="none" stroke="#92400e" strokeWidth="1.2" opacity="0.7" />
        <circle r="17" fill={`url(#${gold})`} stroke="#78350f" strokeWidth="1" />
        <circle r="14" fill="none" stroke="#92400e" strokeWidth="2" strokeDasharray="2 1.4" />
        {/* Águila */}
        <g fill="#92400e">
          <circle cx="0" cy="-7" r="2.6" />
          <path d="M-1.5 -5 L1.5 -5 L2.5 6 L0 9 L-2.5 6 Z" />
          <path d="M-2 -3 L-11 -6 L-12 -3 L-10 -1 L-11 1 L-8 2 L-8 4 L-3 3 Z" />
          <path d="M2 -3 L11 -6 L12 -3 L10 -1 L11 1 L8 2 L8 4 L3 3 Z" />
        </g>
      </g>
    </svg>
  );
}

/** Tercer rango: broche de águila de plata con corona de laurel, el corazón pixelado y la barra del año. */
export function EagleClasp({ className }: MedalProps) {
  const id = useId().replace(/:/g, "");
  const silver = `silver-${id}`;
  const leftWing = "M74 36 L10 18 L6 23 L12 26 L8 30 L16 31 L13 35 L24 35 L22 39 L40 39 L60 44 Z";
  return (
    <svg viewBox="0 0 160 110" className={className} role="img" aria-label="Broche de águila">
      <defs>
        <linearGradient id={silver} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.4" stopColor="#8a8f99" />
          <stop offset="0.7" stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#52525b" />
        </linearGradient>
      </defs>
      <g fill={`url(#${silver})`} stroke="#3f3f46" strokeWidth="0.8">
        {/* Alas */}
        <path d={leftWing} />
        <path d={leftWing} transform="translate(160 0) scale(-1 1)" />
        {/* Cuerpo y cabeza */}
        <ellipse cx="80" cy="38" rx="8" ry="12" />
        <circle cx="80" cy="20" r="7" />
        <path d="M86 18 L93 20 L86 23 Z" />
      </g>
      {/* Plumas */}
      <g stroke="#3f3f46" strokeWidth="0.6" opacity="0.7">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line x1={66 - i * 12} y1={38 - i * 2} x2={24 - i * 3} y2={24 + i * 3} />
            <line x1={94 + i * 12} y1={38 - i * 2} x2={136 + i * 3} y2={24 + i * 3} />
          </g>
        ))}
      </g>
      {/* Corona de laurel */}
      <circle cx="80" cy="62" r="17" fill="#3f2d1d" stroke={`url(#${silver})`} strokeWidth="5" />
      <circle cx="80" cy="62" r="17" fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 2" />
      <PixelHeart x={80} y={62} size={2.6} color="#ef233c" />
      {/* Barra del año */}
      <path d="M34 82 L126 82 L117 104 L43 104 Z" fill={`url(#${silver})`} stroke="#3f3f46" strokeWidth="0.8" />
      <path d="M40 86 L120 86 L113 100 L47 100 Z" fill="#3f2d1d" />
      <text x="80" y="98" textAnchor="middle" fontSize="13" fontWeight="700" fill="#e4e4e7" fontFamily="serif" letterSpacing="2">
        0826
      </text>
    </svg>
  );
}
