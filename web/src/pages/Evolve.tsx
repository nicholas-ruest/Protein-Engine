import { createSignal, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { cycle, setCycle } from "../stores/cycle";
import { population } from "../stores/population";
import { EvolutionTimeline } from "../components/EvolutionTimeline";
import { MutationDiff } from "../components/MutationDiff";
import { HotspotHeatmap } from "../components/HotspotHeatmap";
import { LiveEventStream } from "../components/LiveEventStream";
import { ProteinViewer3D } from "../components/ProteinViewer3D";
import { MassiveSearch } from "../components/MassiveSearch";
import { ResearchBriefForm } from "../components/ResearchBriefForm";
import { WinnerSpec } from "../components/WinnerSpec";
import type { MassiveSearchResult } from "../transport/types";

export function EvolvePage() {
  const engine = useEngine();
  const [generation, setGeneration] = createSignal(1);
  const [popSize, setPopSize] = createSignal(8);
  const [mutationRate, setMutationRate] = createSignal(0.05);
  const [crossover, setCrossover] = createSignal(0.5);
  const [topK, setTopK] = createSignal(3);
  const [quantum, setQuantum] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [winner, setWinner] = createSignal<MassiveSearchResult | undefined>();

  async function launch(): Promise<void> {
    setError(null);
    setCycle("running", true);
    try {
      const seed = population.current.length
        ? population.current.map((v) => v.variant)
        : [{ name: "seed", sequence: population.selectedSeq, target_factor: "OCT4" }];
      const result = await engine.runEvolutionStep(
        { variants: seed },
        {
          generation: generation(),
          population_size: popSize(),
          mutation_rate: mutationRate(),
          crossover_rate: crossover(),
          quantum_enabled: quantum(),
          top_k: topK(),
        },
      );
      setCycle({
        running: false,
        generation: result.generation,
        variants_created: result.variants_created,
        variants_scored: result.variants_scored,
        promoted: result.promoted,
        history: [...cycle.history, result],
      });
      setGeneration((g) => g + 1);
    } catch (e) {
      setError(String(e));
      setCycle("running", false);
    }
  }

  const lastPromoted = () => cycle.promoted[0];

  return (
    <section class="grid">
      <ResearchBriefForm />

      <MassiveSearch onComplete={(r) => setWinner(r)} />

      <Show when={winner()}>
        <WinnerSpec result={winner()!} seed={population.selectedSeq} />
      </Show>

      <div class="card span-4">
        <h2>Cycle Parameters · single generation</h2>
        <Param label="generation" value={generation()} set={setGeneration} step="1" />
        <Param label="population_size" value={popSize()} set={setPopSize} step="1" />
        <Param label="mutation_rate" value={mutationRate()} set={setMutationRate} step="0.01" />
        <Param label="crossover_rate" value={crossover()} set={setCrossover} step="0.05" />
        <Param label="top_k" value={topK()} set={setTopK} step="1" />
        <label class="row" style="gap:8px; margin:10px 0; align-items:center">
          <input type="checkbox" checked={quantum()} onChange={(e) => setQuantum(e.currentTarget.checked)} />
          <span>quantum-enabled · routes via VQE</span>
        </label>
        <button class="btn" disabled={cycle.running} onClick={launch}>
          {cycle.running ? "running…" : "Launch Cycle"}
        </button>
        <Show when={error()}>
          <div class="pill warn" style="margin-top:10px">{error()}</div>
        </Show>
        <div class="kpi-row" style="margin-top:18px; border-top:1px solid var(--border); padding-top:14px">
          <div class="kpi"><div class="v">{cycle.generation}</div><div class="l">last gen</div></div>
          <div class="kpi"><div class="v">{cycle.variants_created}</div><div class="l">created</div></div>
          <div class="kpi"><div class="v">{cycle.variants_scored}</div><div class="l">scored</div></div>
          <div class="kpi"><div class="v">{cycle.promoted.length}</div><div class="l">promoted</div></div>
        </div>
      </div>

      <EvolutionTimeline />
      <LiveEventStream />

      <Show when={lastPromoted()}>
        <div class="card span-6">
          <h2>Promoted Variant · mutations highlighted</h2>
          <ProteinViewer3D sequence={lastPromoted()!.sequence} parent={population.selectedSeq} factor="OCT4" height={300} />
          <div class="muted" style="margin-top:6px">
            {lastPromoted()!.name} · composite {lastPromoted()!.composite.toFixed(3)} · yellow = mutated residues
          </div>
        </div>
        <MutationDiff parent={population.selectedSeq} child={lastPromoted()!.sequence} title={`Mutation Diff · ${lastPromoted()!.name}`} />
        <HotspotHeatmap cycles={cycle.history} />
      </Show>
    </section>
  );
}

function Param(props: { label: string; value: number; set: (n: number) => void; step: string }) {
  return (
    <label class="param">
      <span class="l">{props.label}</span>
      <input
        type="number"
        value={props.value}
        step={props.step}
        onInput={(e) => {
          const n = Number(e.currentTarget.value);
          if (Number.isFinite(n)) props.set(n);
        }}
      />
    </label>
  );
}
