/**
 * Sonidos del equipo de desarrollo:
 * - Nicholas: efectos de DELTARUNE (Toby Fox), los mismos de su portfolio.
 * - Nuz: el trofeo de PlayStation que ya usa la página.
 * - Dozen Apollo: escopeta de doble cañón de Doom.
 * Se reproducen con Web Audio para que suenen al instante, incluso varios seguidos (las letras del diálogo).
 */
type Effect = "move" | "select" | "text" | "trophy" | "doom";

const EFFECTS: Record<Effect, { src: string; volume: number }> = {
  move: { src: "/sounds/deltarune/menumove.wav", volume: 0.5 }, // pasar el mouse
  select: { src: "/sounds/deltarune/select.wav", volume: 0.5 }, // hacer clic
  text: { src: "/sounds/deltarune/text.wav", volume: 0.35 }, // letra del cuadro de diálogo
  trophy: { src: "/sounds/ps4-trophy.mp3", volume: 0.45 }, // pasar el mouse por Nuz
  doom: {
    src: encodeURI("/audio/Doom original double barrell shotgun sound.mp3"),
    volume: 0.55,
  }, // pasar el mouse / seleccionar a Dozen Apollo
};

/** Mínimo entre dos reproducciones del mismo sonido, para que no suene en ráfaga. */
const COOLDOWN_MS: Partial<Record<Effect, number>> = {
  move: 45,
  trophy: 1200,
  doom: 1500,
};

let ctx: AudioContext | null = null;
const buffers = new Map<Effect, Promise<AudioBuffer | null>>();
const lastPlayed: Partial<Record<Effect, number>> = {};

/** Antes del primer clic o tecla el navegador no deja sonar nada: ni se intenta. */
function audioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  try {
    ctx ??= new window.AudioContext();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function load(effect: Effect, ac: AudioContext) {
  let buffer = buffers.get(effect);
  if (!buffer) {
    buffer = fetch(EFFECTS[effect].src)
      .then((r) => r.arrayBuffer())
      .then((data) => ac.decodeAudioData(data))
      .catch(() => null);
    buffers.set(effect, buffer);
  }
  return buffer;
}

function play(effect: Effect) {
  const now = performance.now();
  if (now - (lastPlayed[effect] ?? -Infinity) < (COOLDOWN_MS[effect] ?? 0)) return;
  lastPlayed[effect] = now;

  const ac = audioContext();
  if (!ac) return;
  void load(effect, ac).then((buffer) => {
    if (!buffer) return;
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    source.buffer = buffer;
    gain.gain.value = EFFECTS[effect].volume;
    source.connect(gain).connect(ac.destination);
    source.start();
  });
}

export const teamSfx = {
  move: () => play("move"),
  select: () => play("select"),
  text: () => play("text"),
  trophy: () => play("trophy"),
  doom: () => play("doom"),
  /** Precarga los sonidos tras el primer gesto, para que la primera letra no llegue tarde. */
  unlock() {
    const ac = audioContext();
    if (ac) (Object.keys(EFFECTS) as Effect[]).forEach((e) => void load(e, ac));
  },
};
