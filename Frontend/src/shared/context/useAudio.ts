import { useContext } from "react";
import { AudioCtx } from "./audioContextValue";

export function useAudio() {
  return useContext(AudioCtx);
}
