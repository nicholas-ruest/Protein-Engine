import { createStore } from "solid-js/store";
import type { CycleResult } from "../types";

export interface CycleState {
  running: boolean;
  generation: number;
  variants_created: number;
  variants_scored: number;
  promoted: CycleResult["promoted"];
  history: CycleResult[];
}

export const [cycle, setCycle] = createStore<CycleState>({
  running: false,
  generation: 0,
  variants_created: 0,
  variants_scored: 0,
  promoted: [],
  history: [],
});
