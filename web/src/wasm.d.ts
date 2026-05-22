declare module "pe-wasm" {
  export function init(): void;

  export function score_sequence(sequence: string): {
    reprogramming_efficiency: number;
    expression_stability: number;
    structural_plausibility: number;
    safety_score: number;
    composite: number;
    target_factor: string;
  };

  export function run_evolution_step(
    population_json: string,
    config_json: string,
  ): {
    generation: number;
    variants_created: number;
    variants_scored: number;
    variants_validated: number;
    variants_screened: number;
    promoted: Array<{
      name: string;
      sequence: string;
      composite: number;
      mutations?: Array<{ position: number; from: string; to: string }>;
    }>;
  };

  export function run_local_quantum_sim(hamiltonian_json: string): {
    ground_state_energy: number;
    optimal_parameters: number[];
    converged: boolean;
    iterations: number;
    convergence?: Array<{ iter: number; energy: number }>;
    backend?: string;
    qubits?: number;
  };

  export function search_similar(
    sequence: string,
    k: number,
  ): Array<{
    id: string;
    similarity: number;
    target_factor?: string;
    generation?: number;
  }>;

  export function verify_ledger(): { valid: boolean; head?: string; entry_count?: number };

  export function ledger_entries(limit: number, offset: number): Array<{
    index: number;
    hash: string;
    parent_hash: string | null;
    label: string;
    ts: number;
    witness_signature: string;
    witnessed_by: string[];
    tee_attestation: { vendor: string; valid: boolean };
  }>;

  export function embed_sequence(sequence: string): {
    dim: number;
    values: number[];
  };

  export function project_embeddings(sequences: string[]): Array<{
    sequence: string;
    x: number;
    y: number;
    factor: string;
  }>;

  export function hnsw_neighbours(sequence: string, k: number): {
    query: string;
    layers: Array<{
      layer: number;
      nodes: Array<{ id: string; x: number; y: number; is_visit: boolean }>;
    }>;
  };

  export function load_rvf(data: Uint8Array): {
    vectors_loaded: number;
    journal_entries: number;
    segments?: Array<{ id: number; name: string; size_bytes: number }>;
    bytes_received?: number;
  };

  export function rvf_segments(): Array<{
    id: number;
    name: string;
    size: number;
    summary: string;
  }>;

  export function rvf_segment_detail(id: number): {
    id: number;
    name: string;
    size: number;
    summary: string;
    detail: unknown;
  } | null;

  export function list_policies(): Array<{
    id: string;
    name: string;
    rule: string;
    active: boolean;
    severity: string;
  }>;

  export function list_audit_events(limit?: number): Array<{
    ts: number;
    policy: string;
    action: string;
    subject: string;
    reason: string;
  }>;

  export function sidecar_health(): {
    url: string;
    reachable: boolean;
    version: string;
    backends_available: string[];
    last_ping_ms: number;
  };

  export function yamanaka_factors(): Array<{
    name: string;
    full_name: string;
    target_residues: number;
    target_sequence: string;
    role: string;
  }>;

  export function next_live_event(): {
    kind: string;
    label: string;
    ts: number;
  };

  export function compute_specification(sequence: string): {
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
  };

  export function compliance_check(sequence: string, brief_json: string): {
    total: number;
    passed: number;
    failed: number;
    checks: Array<{ rule: string; passed: boolean; detail: string }>;
  };

  export function run_massive_search(seed_json: string, budget: number): {
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
  };
}
