import { createContext } from "react";

export interface Track {
  src: string;
  title: string;
  artist?: string;
}

/** Canciones del reproductor de la portada. Al darle play suena una al azar. */
export const PLAYLIST: Track[] = [
  { src: "/audio/mussicSong.mp3", title: "In Search of Legends", artist: "SMASH LEGENDS OST" },
  { src: "/audio/one-remastered.mp3", title: "One (Remastered)" },
  { src: "/audio/core.mp3", title: "CORE", artist: "Toby Fox · UNDERTALE" },
];

export interface AudioCtxType {
  isPlaying: boolean;
  toggleAudio: () => void;
  intensity: number;
  /** Canción que está sonando (o la última que sonó). */
  currentTrack: Track | null;
}

export const AudioCtx = createContext<AudioCtxType>({
  isPlaying: false,
  toggleAudio: () => {},
  intensity: 0,
  currentTrack: null,
});
