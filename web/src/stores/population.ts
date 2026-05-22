import { createStore } from "solid-js/store";
import type { FitnessScore, ProteinVariant } from "../types";

export interface ScoredVariant {
  variant: Pick<ProteinVariant, "name" | "sequence" | "target_factor"> & {
    id?: string;
    generation?: number;
    parent_id?: string | null;
  };
  score: FitnessScore;
}

export interface PopulationState {
  current: ScoredVariant[];
  history: Array<{ generation: number; best: FitnessScore; median: FitnessScore }>;
  selectedSeq: string;
}

export const [population, setPopulation] = createStore<PopulationState>({
  current: [],
  history: [],
  selectedSeq: "MAGHLASDFAFSPPPGGGGDGPGGPEPGWVD",
});
