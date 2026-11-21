import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AudioCtx, PLAYLIST, type Track } from "./audioContextValue";

/** Elige una canción al azar distinta de la anterior (si hay más de una). */
function pickRandomTrack(previous: Track | null): Track {
  const options = PLAYLIST.length > 1 ? PLAYLIST.filter((t) => t !== previous) : PLAYLIST;
  return options[Math.floor(Math.random() * options.length)];
}

const WebAudioCtx = window.AudioContext;

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const currentTrackRef = useRef<Track | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);

  const setupAudio = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    const ctx = new WebAudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function update() {
      analyser!.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setIntensity(Math.min(1, avg / 128));
      rafRef.current = requestAnimationFrame(update);
    }
    update();

    return () => {
      cancelAnimationFrame(rafRef.current);
      setIntensity(0);
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (!audioCtxRef.current) setupAudio();
      if (audioCtxRef.current?.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      // Cada play suena una canción al azar
      const track = pickRandomTrack(currentTrackRef.current);
      currentTrackRef.current = track;
      setCurrentTrack({ ...track }); // objeto nuevo en cada reproducción
      audio.src = track.src;
      audio.currentTime = 0;
      audio.volume = 0.7;
      void audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
      setIntensity(0);
    }
  }, [setupAudio]);

  // Al terminar una canción sigue otra al azar
  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = pickRandomTrack(currentTrackRef.current);
    currentTrackRef.current = track;
    setCurrentTrack({ ...track });
    audio.src = track.src;
    void audio.play().catch(() => setIsPlaying(false));
  }, []);

  return (
    <AudioCtx.Provider value={{ isPlaying, toggleAudio, intensity, currentTrack }}>
      {children}
      <audio ref={audioRef} preload="none" onEnded={handleEnded} />
    </AudioCtx.Provider>
  );
}
