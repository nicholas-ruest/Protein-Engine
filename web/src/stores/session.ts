import { createStore } from "solid-js/store";
import type { TransportMode } from "../transport/types";

export interface SessionState {
  mode: TransportMode;
  online: boolean;
  startedAt: number;
}

export const [session, setSession] = createStore<SessionState>({
  mode: "wasm",
  online: true,
  startedAt: Date.now(),
});
