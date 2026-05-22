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
import type { FitnessScore, CycleResult, ProteinVariant } from "../types";
import { memoised } from "./cache";

export interface HttpClientOptions {
  baseUrl?: string;
  pollIntervalMs?: number;
}

export class HttpClient implements EngineClient {
  readonly mode: TransportMode = "http";

  private baseUrl: string;
  private pollMs: number;
  private listeners = new Set<(e: EngineEvent) => void>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;
  private lastEntryCount = -1;

  private scoreCache = new Map<string, Promise<FitnessScore>>();
  private similarCache = new Map<string, Promise<SimilarHit[]>>();

  constructor(opts: HttpClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? "/api";
    this.pollMs = opts.pollIntervalMs ?? 2000;
  }

  scoreSequence = memoised(async (sequence: string): Promise<FitnessScore> => {
    return this.post<FitnessScore>("/variants/score", {
      name: "ad-hoc",
      sequence,
      target_factor: "OCT4",
    });
  }, this.scoreCache);

  searchSimilar = memoised(
    async (sequence: string, k: number): Promise<SimilarHit[]> => {
      const q = new URLSearchParams({ sequence, k: String(k) }).toString();
      return this.get<SimilarHit[]>(`/variants/search?${q}`);
    },
    this.similarCache,
  );

  async runEvolutionStep(pop: Population, cfg: CycleConfig): Promise<CycleResult> {
    this.emit({ kind: "cycle.started", generation: cfg.generation });
    const result = await this.post<CycleResult>("/evolution/cycle", { ...cfg, population: pop.variants });
    this.emit({ kind: "cycle.completed", result });
    this.invalidate();
    return result;
  }

  async runMassiveSearch(_seed: MassiveSearchSeed, _budget: number): Promise<MassiveSearchResult> {
    throw new Error("HttpClient: massive search not exposed by pe-api — switch to wasm transport");
  }
  async computeSpecification(_seq: string): Promise<ProteinSpecification> {
    throw new Error("HttpClient: specification endpoint not exposed by pe-api");
  }
  async complianceCheck(_seq: string, _brief: unknown): Promise<ComplianceReport> {
    throw new Error("HttpClient: compliance endpoint not exposed by pe-api");
  }

  async runLocalQuantumSim(_h: Hamiltonian): Promise<QuantumResult> {
    throw new Error("HttpClient: quantum sim not exposed by pe-api — switch to wasm transport");
  }

  async verifyLedger(): Promise<LedgerStatus> {
    const verify = await this.get<{ valid: boolean }>("/ledger/verify");
    const entries = await this.get<{ entry_count: number }>(
      "/ledger/entries?limit=1&offset=0",
    );
    return { valid: verify.valid, entry_count: entries.entry_count };
  }

  async ledgerEntries(_limit: number, _offset: number): Promise<LedgerEntry[]> {
    throw new Error("HttpClient: full ledger-entry surface not exposed by pe-api yet");
  }

  async loadRvf(_bytes: Uint8Array): Promise<RvfManifest> {
    throw new Error("HttpClient: RVF upload not exposed by pe-api — switch to wasm or rvf transport");
  }

  async rvfSegments(): Promise<RvfSegmentRow[]> {
    throw new Error("HttpClient: rvf segments require wasm or rvf transport");
  }

  async rvfSegmentDetail(_id: number): Promise<RvfSegmentDetail | null> {
    throw new Error("HttpClient: rvf segment detail requires wasm or rvf transport");
  }

  async embed(_sequence: string): Promise<Embedding> {
    throw new Error("HttpClient: embedding endpoint not exposed by pe-api");
  }

  async projectEmbeddings(_sequences: string[]): Promise<ProjectedPoint[]> {
    throw new Error("HttpClient: projection endpoint not exposed by pe-api");
  }

  async hnswNeighbours(_seq: string, _k: number): Promise<HnswGraph> {
    throw new Error("HttpClient: HNSW graph endpoint not exposed by pe-api");
  }

  async listPolicies(): Promise<Policy[]> {
    throw new Error("HttpClient: governance endpoint not exposed by pe-api");
  }

  async listAuditEvents(_limit?: number): Promise<AuditEvent[]> {
    throw new Error("HttpClient: audit endpoint not exposed by pe-api");
  }

  async sidecarHealth(): Promise<SidecarHealth> {
    throw new Error("HttpClient: sidecar health endpoint not exposed by pe-api");
  }

  async yamanakaFactors(): Promise<YamanakaFactor[]> {
    throw new Error("HttpClient: factor list endpoint not exposed by pe-api");
  }

  async createVariant(
    payload: { name: string; sequence: string; target_factor: string },
  ): Promise<ProteinVariant> {
    return this.post<ProteinVariant>("/variants", payload);
  }

  subscribe(listener: (e: EngineEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    this.ensurePolling();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopPolling();
    };
  }

  startLiveTicker(): void {
    if (this.liveTimer) return;
    this.liveTimer = setInterval(() => {
      this.emit({ kind: "live", topic: "http.poll", label: "polled pe-api" });
    }, 1500);
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

  private ensurePolling(): void {
    if (this.pollTimer) return;
    const tick = async () => {
      try {
        const status = await this.verifyLedger();
        const count = status.entry_count ?? 0;
        if (count !== this.lastEntryCount) {
          this.lastEntryCount = count;
          this.emit({
            kind: "ledger.appended",
            head: status.head ?? "—",
            entry_count: count,
          });
        }
      } catch (err) {
        this.emit({ kind: "transport.error", message: String(err) });
      }
    };
    void tick();
    this.pollTimer = setInterval(tick, this.pollMs);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }

  private async get<T>(path: string): Promise<T> {
    const r = await fetch(this.baseUrl + path);
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }
}
