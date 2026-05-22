// Research brief — the scientist's intent that drives the search.
//
// Fields match what a wet-lab principal investigator would specify in
// a project requisition: target, application, constraints, hypothesis.

import { createStore } from "solid-js/store";
import type { FactorName } from "../transport/types";

export type UseCase =
  | "in_vitro_screening"
  | "in_vivo_delivery"
  | "therapeutic_candidate"
  | "basic_research";

export type Host = "human" | "mouse" | "ecoli" | "yeast" | "insect";
export type Delivery = "mrna" | "aav" | "lentiviral" | "protein" | "naked_dna";

export interface ResearchBrief {
  // Identity
  pi_name: string;
  project_id: string;

  // What protein
  target_factor: FactorName;
  research_categories: string[]; // e.g. "iPSC reprogramming", "cardiomyocyte induction"
  use_case: UseCase;

  // Optimization priorities (sliders 0..1 — auto-normalised in scoring)
  priority_efficiency: number;
  priority_stability: number;
  priority_safety: number;

  // Constraints
  host_organism: Host;
  delivery_modality: Delivery;
  max_length: number;
  required_motifs: string;     // comma-separated regex/AA sequences
  forbidden_residues: string;  // e.g. "C,M" — cysteines/methionines excluded

  // Hypothesis (free text)
  hypothesis: string;
}

const DEFAULT_BRIEF: ResearchBrief = {
  pi_name: "",
  project_id: "PE-2026-001",
  target_factor: "OCT4",
  research_categories: ["iPSC reprogramming"],
  use_case: "in_vitro_screening",
  priority_efficiency: 0.5,
  priority_stability: 0.3,
  priority_safety: 0.2,
  host_organism: "human",
  delivery_modality: "mrna",
  max_length: 360,
  required_motifs: "POU,HOX",
  forbidden_residues: "",
  hypothesis:
    "Variants with elevated reprogramming efficiency while maintaining baseline expression stability. " +
    "Hypothesis: targeted substitutions in the POU-specific subdomain (residues 1–30) will improve DNA-binding affinity without destabilising the homeodomain.",
};

export const [brief, setBrief] = createStore<ResearchBrief>({ ...DEFAULT_BRIEF });

export function resetBrief(): void {
  setBrief(DEFAULT_BRIEF);
}
