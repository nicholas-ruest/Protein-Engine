// Engine context — exposes the selected transport to every component as a
// Solid context. Set once at boot in main.tsx.

import { createContext, useContext } from "solid-js";
import type { EngineClient } from "../transport/types";

export const EngineContext = createContext<EngineClient>();

export function useEngine(): EngineClient {
  const e = useContext(EngineContext);
  if (!e) throw new Error("useEngine() called outside <EngineContext.Provider>");
  return e;
}
