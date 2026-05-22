// Single transport interface backing the WASM-local, HTTP-server, and RVF-replay
// modes (see ADR-011). Views never call transports directly — they read stores
// that are populated from this interface.

import type {
  FitnessScore,
  ProteinVariant,
  CycleResult,
  VqeResult,
} from "../types";

export type TransportMode = "wasm" | "http" | "rvf";

export type FactorName = "OCT4" | "SOX2" | "KLF4" | "CMYC";

export interface YamanakaFactor {
  name: FactorName;
  full_name: string;
  target_residues: number;
  target_sequence: string;
  role: string;
}

export interface SimilarHit {
  id: string;
  similarity: number;
  target_factor?: string;
  generation?: number;
}

export interface LedgerStatus {
  valid: boolean;
  head?: string;
  entry_count?: number;
}

export interface LedgerEntry {
  index: number;
  hash: string;
  parent_hash: string | null;
  label: string;
  ts: number;
  witness_signature: string;
  witnessed_by: string[];
  tee_attestation: { vendor: string; valid: boolean };
}

export interface CycleConfig {
  generation: number;
  population_size: number;
  mutation_rate: number;
  crossover_rate: number;
  quantum_enabled: boolean;
  top_k: number;
}

export interface Population {
  variants: Array<Pick<ProteinVariant, "name" | "sequence" | "target_factor">>;
}

export interface RvfManifest {
  vectors_loaded: number;
  journal_entries: number;
  segments?: Array<{ id: number; name: string; size_bytes: number }>;
  bytes_received?: number;
}

export interface RvfSegmentRow {
  id: number;
  name: string;
  size: number;
  summary: string;
}

export interface RvfSegmentDetail {
  id: number;
  name: string;
  size: number;
  summary: string;
  detail: unknown;
}

export interface HamiltonianTerm {
  coefficient: number;
  pauli_string: string;
}
export interface Hamiltonian {
  num_qubits: number;
  terms: HamiltonianTerm[];
}

export interface QuantumResult extends VqeResult {
  convergence?: Array<{ iter: number; energy: number }>;
  backend?: string;
  qubits?: number;
}

export interface Embedding {
  dim: number;
  values: number[];
}

export interface ProjectedPoint {
  sequence: string;
  x: number;
  y: number;
  factor: string;
}

export interface HnswGraph {
  query: string;
  layers: Array<{
    layer: number;
    nodes: Array<{ id: string; x: number; y: number; is_visit: boolean }>;
  }>;
}

export interface Policy {
  id: string;
  name: string;
  rule: string;
  active: boolean;
  severity: string;
}

export interface AuditEvent {
  ts: number;
  policy: string;
  action: string;
  subject: string;
  reason: string;
}

export interface SidecarHealth {
  url: string;
  reachable: boolean;
  version: string;
  backends_available: string[];
  last_ping_ms: number;
}

export type EngineEvent =
  | { kind: "cycle.started"; generation: number }
  | { kind: "cycle.progress"; generation: number; scored: number; created: number }
  | { kind: "cycle.completed"; result: CycleResult }
  | { kind: "ledger.appended"; head: string; entry_count: number }
  | { kind: "live"; label: string; topic: string }
  | { kind: "transport.error"; message: string };

export type Unsubscribe = () => void;

export interface ProteinSpecification {
  sequence: string;
  length: number;
  factor: string;
  mw_da: number;
  pI: number;
  charge_pH7: number;
  avg_hydropathy: number;
  hydropathy_profile: number[];
  composition: Record<string, number>;
  secondary_structure: { helix_pct: number; sheet_pct: number; coil_pct: number };
  predictions: {
    melting_temp_c: number;
    half_life_mammalian_h: number;
    half_life_ecoli_min: number;
    aggregation_propensity: number;
    intrinsic_disorder: number;
    off_target_risk: number;
    immunogenicity_risk: number;
    dna_binding_kd_nM: number;
  };
  domains: Array<{ name: string; start: number; end: number; role: string; coverage_pct: number }>;
}

export interface ComplianceReport {
  total: number;
  passed: number;
  failed: number;
  checks: Array<{ rule: string; passed: boolean; detail: string }>;
}

export interface MassiveSearchSeed {
  sequence: string;
  target_factor?: string;
}

export interface MassiveSearchResult {
  budget_planned: number;
  budget_explored: number;
  histogram: number[];
  best_so_far_curve: Array<{ at_n: number; composite: number }>;
  top: Array<{
    rank: number;
    name: string;
    sequence: string;
    composite: number;
    mutations_count: number;
    mutations: Array<{ position: number; from: string; to: string }>;
  }>;
  duration_ms: number;
  variants_per_sec: number;
  factor: string;
}

export interface EngineClient {
  readonly mode: TransportMode;

  scoreSequence(sequence: string): Promise<FitnessScore>;
  runEvolutionStep(pop: Population, cfg: CycleConfig): Promise<CycleResult>;
  runMassiveSearch(seed: MassiveSearchSeed, budget: number): Promise<MassiveSearchResult>;
  computeSpecification(sequence: string): Promise<ProteinSpecification>;
  complianceCheck(sequence: string, brief: unknown): Promise<ComplianceReport>;
  runLocalQuantumSim(h: Hamiltonian): Promise<QuantumResult>;
  searchSimilar(sequence: string, k: number): Promise<SimilarHit[]>;
  verifyLedger(): Promise<LedgerStatus>;
  ledgerEntries(limit: number, offset: number): Promise<LedgerEntry[]>;
  loadRvf(bytes: Uint8Array): Promise<RvfManifest>;
  rvfSegments(): Promise<RvfSegmentRow[]>;
  rvfSegmentDetail(id: number): Promise<RvfSegmentDetail | null>;
  embed(sequence: string): Promise<Embedding>;
  projectEmbeddings(sequences: string[]): Promise<ProjectedPoint[]>;
  hnswNeighbours(sequence: string, k: number): Promise<HnswGraph>;
  listPolicies(): Promise<Policy[]>;
  listAuditEvents(limit?: number): Promise<AuditEvent[]>;
  sidecarHealth(): Promise<SidecarHealth>;
  yamanakaFactors(): Promise<YamanakaFactor[]>;

  /** Subscribe to async events. Returns an unsubscribe handle. */
  subscribe(listener: (e: EngineEvent) => void): Unsubscribe;

  /** Start a 1-Hz synthetic live event ticker (for the Live Stream card). */
  startLiveTicker(): void;
  stopLiveTicker(): void;

  /** Hint that cached results should be discarded after a write path. */
  invalidate(): void;
}
