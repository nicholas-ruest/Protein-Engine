import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { EmbeddingScatter3D } from "../components/EmbeddingScatter3D";
import { HnswGraph3D } from "../components/HnswGraph3D";
import type { HnswGraph as HnswGraphData, ProjectedPoint, SimilarHit } from "../transport/types";
import { population } from "../stores/population";

export function EmbeddingPage() {
  const engine = useEngine();
  const [query, setQuery] = createSignal(population.selectedSeq);
  const [hnsw, setHnsw] = createSignal<HnswGraphData | undefined>();
  const [hits, setHits] = createSignal<SimilarHit[]>([]);

  const [points] = createResource(async (): Promise<ProjectedPoint[]> => {
    const factors = await engine.yamanakaFactors();
    const sequences = factors.flatMap((f) => [
      f.target_sequence,
      f.target_sequence.slice(0, -2) + "AA",
      f.target_sequence.slice(0, -4) + "PPGG",
      f.target_sequence.slice(0, -6) + "VWILMY",
    ]);
    return engine.projectEmbeddings(sequences);
  });

  async function runSearch(): Promise<void> {
    const [g, h] = await Promise.all([
      engine.hnswNeighbours(query(), 6),
      engine.searchSimilar(query(), 8),
    ]);
    setHnsw(g);
    setHits(h);
  }

  onMount(() => void runSearch());

  return (
    <section class="grid">
      <div class="card span-12 hero">
        <div>
          <div class="hero-title">Embedding-space Workbench</div>
          <div class="hero-sub">
            ESM-2 320-dim embeddings projected to 3D. HNSW M=16 traversal rendered in WebGL across three layers.
          </div>
        </div>
        <div class="hero-meta">
          <span class="badge">pe-neural · ESM-2</span>
          <span class="badge">pe-vector · HNSW</span>
        </div>
      </div>

      <div class="card span-12">
        <div class="row" style="gap:10px; align-items:center; flex-wrap:wrap">
          <input
            class="seq-input mono"
            style="flex:1; min-width:300px"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value.toUpperCase())}
          />
          <button class="btn" onClick={runSearch}>Search</button>
        </div>
      </div>

      <div class="card span-7">
        <h2>3D Embedding Space</h2>
        <Show when={points() && points()!.length > 0} fallback={<div class="muted">computing embeddings…</div>}>
          <EmbeddingScatter3D points={points()!} highlight={query()} height={400} />
        </Show>
        <div class="row" style="gap:18px; margin-top:8px; flex-wrap:wrap">
          <span class="legend-chip"><span class="legend-dot" style="background:#7c9cff" />OCT4</span>
          <span class="legend-chip"><span class="legend-dot" style="background:#4fd1c5" />SOX2</span>
          <span class="legend-chip"><span class="legend-dot" style="background:#fbbf24" />KLF4</span>
          <span class="legend-chip"><span class="legend-dot" style="background:#f87171" />CMYC</span>
        </div>
      </div>

      <div class="card span-5">
        <h2>HNSW Traversal · 3 layers</h2>
        <HnswGraph3D data={hnsw()} height={400} />
      </div>

      <div class="card span-12">
        <h2>Nearest Neighbours · k=8</h2>
        <Show when={hits().length > 0} fallback={<div class="muted">no hits yet</div>}>
          <table>
            <thead><tr><th>id</th><th>factor</th><th>generation</th><th>similarity</th><th>distance</th></tr></thead>
            <tbody>
              <For each={hits()}>
                {(h) => (
                  <tr>
                    <td class="mono">{h.id}</td>
                    <td><span class={`factor-dot factor-${h.target_factor ?? "OCT4"}`} />{h.target_factor ?? "—"}</td>
                    <td>{h.generation ?? "—"}</td>
                    <td>{(h.similarity * 100).toFixed(2)}%</td>
                    <td class="mono">{(1 - h.similarity).toFixed(4)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>
    </section>
  );
}
