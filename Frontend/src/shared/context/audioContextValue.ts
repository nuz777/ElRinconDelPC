import { createContext } from "react";

export interface AudioCtxType {
  isPlaying: boolean;
  toggleAudio: () => void;
  intensity: number;
}

export const AudioCtx = createContext<AudioCtxType>({
  isPlaying: false,
  toggleAudio: () => {},
  intensity: 0,
});
