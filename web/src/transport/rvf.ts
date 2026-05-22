// RvfClient — replays a .rvf file in-browser. Delegates non-RVF operations to
// an inner WasmClient so the same component tree can render against either.

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
import { WasmClient } from "./wasm";

interface RvfSegment {
  id: number;
  name: string;
  offset: number;
  size_bytes: number;
}

const SEGMENT_NAMES: Record<number, string> = {
  0x00: "MANIFEST_SEG", 0x01: "VEC_SEG", 0x02: "INDEX_SEG", 0x03: "OVERLAY_SEG",
  0x04: "JOURNAL_SEG", 0x05: "GRAPH_SEG", 0x06: "QUANT_SEG", 0x07: "META_SEG",
  0x08: "HOT_SEG", 0x09: "SKETCH_SEG", 0x0a: "WASM_SEG", 0x0b: "WITNESS_SEG",
  0x0c: "CRYPTO_SEG", 0x0d: "META_IDX_SEG", 0x0e: "KERNEL_SEG",
};

export class RvfClient implements EngineClient {
  readonly mode: TransportMode = "rvf";

  private inner = new WasmClient();
  private bytes: Uint8Array | null = null;
  private segments: RvfSegment[] = [];
  private listeners = new Set<(e: EngineEvent) => void>();

  scoreSequence(seq: string): Promise<FitnessScore> { return this.inner.scoreSequence(seq); }
  runEvolutionStep(p: Population, c: CycleConfig): Promise<CycleResult> { return this.inner.runEvolutionStep(p, c); }
  runMassiveSearch(s: MassiveSearchSeed, b: number): Promise<MassiveSearchResult> { return this.inner.runMassiveSearch(s, b); }
  computeSpecification(s: string): Promise<ProteinSpecification> { return this.inner.computeSpecification(s); }
  complianceCheck(s: string, b: unknown): Promise<ComplianceReport> { return this.inner.complianceCheck(s, b); }
  runLocalQuantumSim(h: Hamiltonian): Promise<QuantumResult> { return this.inner.runLocalQuantumSim(h); }
  searchSimilar(s: string, k: number): Promise<SimilarHit[]> { return this.inner.searchSimilar(s, k); }
  verifyLedger(): Promise<LedgerStatus> { return this.inner.verifyLedger(); }
  ledgerEntries(limit: number, offset: number): Promise<LedgerEntry[]> { return this.inner.ledgerEntries(limit, offset); }
  embed(s: string): Promise<Embedding> { return this.inner.embed(s); }
  projectEmbeddings(s: string[]): Promise<ProjectedPoint[]> { return this.inner.projectEmbeddings(s); }
  hnswNeighbours(s: string, k: number): Promise<HnswGraph> { return this.inner.hnswNeighbours(s, k); }
  listPolicies(): Promise<Policy[]> { return this.inner.listPolicies(); }
  listAuditEvents(l?: number): Promise<AuditEvent[]> { return this.inner.listAuditEvents(l); }
  sidecarHealth(): Promise<SidecarHealth> { return this.inner.sidecarHealth(); }
  yamanakaFactors(): Promise<YamanakaFactor[]> { return this.inner.yamanakaFactors(); }
  rvfSegments(): Promise<RvfSegmentRow[]> { return this.inner.rvfSegments(); }
  rvfSegmentDetail(id: number): Promise<RvfSegmentDetail | null> { return this.inner.rvfSegmentDetail(id); }

  async loadRvf(bytes: Uint8Array): Promise<RvfManifest> {
    this.bytes = bytes;
    this.segments = parseSegmentHeaders(bytes);
    const inner = await this.inner.loadRvf(bytes);
    const manifest: RvfManifest = {
      ...inner,
      segments: this.segments.length
        ? this.segments.map((s) => ({ id: s.id, name: s.name, size_bytes: s.size_bytes }))
        : inner.segments,
    };
    this.emit({ kind: "ledger.appended", head: "rvf-loaded", entry_count: inner.journal_entries });
    return manifest;
  }

  listSegments(): RvfSegment[] { return this.segments; }
  readSegment(id: number): Uint8Array | null {
    if (!this.bytes) return null;
    const s = this.segments.find((x) => x.id === id);
    if (!s) return null;
    return this.bytes.subarray(s.offset, s.offset + s.size_bytes);
  }

  subscribe(listener: (e: EngineEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    const inner = this.inner.subscribe(listener);
    return () => { this.listeners.delete(listener); inner(); };
  }

  startLiveTicker(): void { this.inner.startLiveTicker(); }
  stopLiveTicker(): void { this.inner.stopLiveTicker(); }
  invalidate(): void { this.inner.invalidate(); }

  private emit(e: EngineEvent): void { for (const l of this.listeners) l(e); }
}

function parseSegmentHeaders(bytes: Uint8Array): RvfSegment[] {
  if (bytes.length < 8) return [];
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
  if (magic !== "RVF") return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const segCount = view.getUint16(6, true);
  const entries: RvfSegment[] = [];
  let cursor = 8;
  for (let i = 0; i < segCount; i++) {
    if (cursor + 10 > bytes.length) break;
    const id = view.getUint8(cursor);
    const offset = view.getUint32(cursor + 2, true);
    const size = view.getUint32(cursor + 6, true);
    entries.push({ id, name: SEGMENT_NAMES[id] ?? `SEG_${id.toString(16)}`, offset, size_bytes: size });
    cursor += 10;
  }
  return entries;
}
