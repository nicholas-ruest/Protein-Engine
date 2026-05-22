import type {
  EngineClient,
  EngineEvent,
  Hamiltonian,
  LedgerStatus,
  LedgerEntry,
  Population,
  CycleConfig,
  RvfManifest,
  RvfSegmentRow,
  RvfSegmentDetail,
  SimilarHit,
  TransportMode,
  Unsubscribe,
  Embedding,
  ProjectedPoint,
  HnswGraph,
  Policy,
  AuditEvent,
  SidecarHealth,
  YamanakaFactor,
  QuantumResult,
  MassiveSearchSeed,
  MassiveSearchResult,
  ProteinSpecification,
  ComplianceReport,
} from "./types";
import type { FitnessScore, CycleResult } from "../types";
import { memoised } from "./cache";

interface PeWasm {
  init?: () => void;
  score_sequence(seq: string): FitnessScore;
  run_evolution_step(populationJson: string, configJson: string): CycleResult;
  run_local_quantum_sim(hamiltonianJson: string): QuantumResult;
  search_similar(seq: string, k: number): SimilarHit[];
  verify_ledger(): LedgerStatus;
  ledger_entries(limit: number, offset: number): LedgerEntry[];
  load_rvf(data: Uint8Array): RvfManifest;
  rvf_segments(): RvfSegmentRow[];
  rvf_segment_detail(id: number): RvfSegmentDetail | null;
  embed_sequence(sequence: string): Embedding;
  project_embeddings(sequences: string[]): ProjectedPoint[];
  hnsw_neighbours(sequence: string, k: number): HnswGraph;
  list_policies(): Policy[];
  list_audit_events(limit?: number): AuditEvent[];
  sidecar_health(): SidecarHealth;
  yamanaka_factors(): YamanakaFactor[];
  next_live_event(): { kind: string; label: string; ts: number };
  run_massive_search(seed_json: string, budget: number): MassiveSearchResult;
  compute_specification(sequence: string): ProteinSpecification;
  compliance_check(sequence: string, brief_json: string): ComplianceReport;
}

export class WasmClient implements EngineClient {
  readonly mode: TransportMode = "wasm";

  private listeners = new Set<(e: EngineEvent) => void>();
  private modulePromise: Promise<PeWasm> | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  private scoreCache = new Map<string, Promise<FitnessScore>>();
  private similarCache = new Map<string, Promise<SimilarHit[]>>();
  private embedCache = new Map<string, Promise<Embedding>>();

  scoreSequence = memoised(
    (seq: string) => this.module().then((m) => m.score_sequence(seq)),
    this.scoreCache,
  );

  searchSimilar = memoised(
    (seq: string, k: number) =>
      this.module().then((m) => m.search_similar(seq, k)),
    this.similarCache,
  );

  embed = memoised(
    (seq: string) => this.module().then((m) => m.embed_sequence(seq)),
    this.embedCache,
  );

  async projectEmbeddings(sequences: string[]): Promise<ProjectedPoint[]> {
    const m = await this.module();
    return m.project_embeddings(sequences);
  }

  async hnswNeighbours(sequence: string, k: number): Promise<HnswGraph> {
    const m = await this.module();
    return m.hnsw_neighbours(sequence, k);
  }

  async runEvolutionStep(pop: Population, cfg: CycleConfig): Promise<CycleResult> {
    const m = await this.module();
    this.emit({ kind: "cycle.started", generation: cfg.generation });
    const result = m.run_evolution_step(JSON.stringify(pop.variants), JSON.stringify(cfg));
    this.emit({ kind: "cycle.progress", generation: cfg.generation, scored: result.variants_scored, created: result.variants_created });
    this.emit({ kind: "cycle.completed", result });
    this.invalidate();
    return result;
  }

  async runMassiveSearch(seed: MassiveSearchSeed, budget: number): Promise<MassiveSearchResult> {
    const m = await this.module();
    return m.run_massive_search(JSON.stringify(seed), budget);
  }

  async computeSpecification(sequence: string): Promise<ProteinSpecification> {
    const m = await this.module();
    return m.compute_specification(sequence);
  }

  async complianceCheck(sequence: string, brief: unknown): Promise<ComplianceReport> {
    const m = await this.module();
    return m.compliance_check(sequence, JSON.stringify(brief));
  }

  async runLocalQuantumSim(h: Hamiltonian): Promise<QuantumResult> {
    const m = await this.module();
    return m.run_local_quantum_sim(JSON.stringify(h));
  }

  async verifyLedger(): Promise<LedgerStatus> {
    const m = await this.module();
    return m.verify_ledger();
  }

  async ledgerEntries(limit: number, offset: number): Promise<LedgerEntry[]> {
    const m = await this.module();
    return m.ledger_entries(limit, offset);
  }

  async loadRvf(bytes: Uint8Array): Promise<RvfManifest> {
    const m = await this.module();
    const out = m.load_rvf(bytes);
    this.emit({
      kind: "ledger.appended",
      head: "rvf-import",
      entry_count: out.journal_entries,
    });
    this.invalidate();
    return out;
  }

  async rvfSegments(): Promise<RvfSegmentRow[]> {
    const m = await this.module();
    return m.rvf_segments();
  }

  async rvfSegmentDetail(id: number): Promise<RvfSegmentDetail | null> {
    const m = await this.module();
    return m.rvf_segment_detail(id);
  }

  async listPolicies(): Promise<Policy[]> {
    const m = await this.module();
    return m.list_policies();
  }

  async listAuditEvents(limit?: number): Promise<AuditEvent[]> {
    const m = await this.module();
    return m.list_audit_events(limit);
  }

  async sidecarHealth(): Promise<SidecarHealth> {
    const m = await this.module();
    return m.sidecar_health();
  }

  async yamanakaFactors(): Promise<YamanakaFactor[]> {
    const m = await this.module();
    return m.yamanaka_factors();
  }

  subscribe(listener: (e: EngineEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  startLiveTicker(): void {
    if (this.liveTimer) return;
    this.liveTimer = setInterval(async () => {
      try {
        const m = await this.module();
        const ev = m.next_live_event();
        this.emit({ kind: "live", topic: ev.kind, label: ev.label });
      } catch {
        // ignore tick errors
      }
    }, 1100);
  }

  stopLiveTicker(): void {
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  }

  invalidate(): void {
    this.scoreCache.clear();
    this.similarCache.clear();
  }

  private async module(): Promise<PeWasm> {
    if (!this.modulePromise) {
      this.modulePromise = import("pe-wasm").then((m) => {
        m.init?.();
        return m as unknown as PeWasm;
      });
    }
    return this.modulePromise;
  }

  private emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }
}
