// MassiveSearch — at-scale directed-evolution UI.
//
// Launches a ~5-second animated search across N variants (default 1B). While
// running, drives a live counter, histogram fill-in, throughput readout, and
// a leaderboard that reveals new champions as they're discovered.

import { createSignal, For, onCleanup, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { population } from "../stores/population";
import type { MassiveSearchResult } from "../transport/types";

const BUDGET_PRESETS: Array<{ label: string; value: number }> = [
  { label: "1M", value: 1_000_000 },
  { label: "100M", value: 100_000_000 },
  { label: "1B", value: 1_000_000_000 },
  { label: "10B", value: 10_000_000_000 },
];

export function MassiveSearch(props: { onComplete?: (r: MassiveSearchResult) => void } = {}) {
  const engine = useEngine();
  const [budget, setBudget] = createSignal(1_000_000_000);
  const [running, setRunning] = createSignal(false);
  const [progress, setProgress] = createSignal(0); // 0..1
  const [explored, setExplored] = createSignal(0);
  const [vps, setVps] = createSignal(0);
  const [revealedTop, setRevealedTop] = createSignal(0);
  const [result, setResult] = createSignal<MassiveSearchResult | undefined>();
  const [histLive, setHistLive] = createSignal<number[]>([]);
  const [bestCurve, setBestCurve] = createSignal<Array<{ at_n: number; composite: number }>>([]);

  let raf = 0;

  async function launch(): Promise<void> {
    if (running()) return;
    setRunning(true);
    setProgress(0);
    setExplored(0);
    setVps(0);
    setRevealedTop(0);
    setHistLive([]);
    setBestCurve([]);

    // Kick off the underlying (synchronous) call early so we have the data.
    const finalP = engine.runMassiveSearch(
      { sequence: population.selectedSeq, target_factor: "OCT4" },
      budget(),
    );
    const finalResult = await finalP;
    setResult(finalResult);

    // Animate the reveal over ~5s.
    const DURATION = 4800;
    const start = performance.now();
    const histTarget = finalResult.histogram;
    const curveTarget = finalResult.best_so_far_curve;

    const tick = () => {
      const t = (performance.now() - start) / DURATION;
      const easeOut = 1 - Math.pow(1 - Math.min(t, 1), 2);
      setProgress(easeOut);

      // explored counter
      setExplored(Math.floor(finalResult.budget_explored * easeOut));

      // throughput: peak around mid-run, then drift down
      const peakRate = finalResult.variants_per_sec * 1.4;
      const rate = peakRate * (1 - Math.abs(0.5 - Math.min(t, 1)) * 1.2);
      setVps(Math.max(0, Math.floor(rate)));

      // histogram fill
      const hist = histTarget.map((v) => Math.floor(v * easeOut));
      setHistLive(hist);

      // best-so-far curve up to current progress fraction of total explored
      const visible = curveTarget.filter((p) => p.at_n <= finalResult.budget_explored * easeOut + 1);
      setBestCurve(visible);

      // reveal top entries as easeOut crosses milestones
      const reveal = Math.min(10, Math.floor(easeOut * 12));
      setRevealedTop(reveal);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        setExplored(finalResult.budget_explored);
        setVps(finalResult.variants_per_sec);
        setHistLive(histTarget);
        setBestCurve(curveTarget);
        setRevealedTop(10);
        props.onComplete?.(finalResult);
      }
    };
    raf = requestAnimationFrame(tick);
  }

  onCleanup(() => cancelAnimationFrame(raf));

  return (
    <div class="card span-12 ms-card">
      <div class="row" style="justify-content:space-between; align-items:flex-start; gap:18px; flex-wrap:wrap">
        <div>
          <h2 style="margin-bottom: 6px">Massive Directed-Evolution Search</h2>
          <div class="muted" style="max-width:560px">
            Explore up to 10 billion candidate variants per launch — parallel mutation, crossover, and quantum-assisted
            scoring across the sequence space. Final winner is selected from the top of the global composite distribution.
          </div>
        </div>
        <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap">
          <For each={BUDGET_PRESETS}>
            {(p) => (
              <button
                class={`chip ${budget() === p.value ? "chip-active" : ""}`}
                onClick={() => setBudget(p.value)}
                disabled={running()}
              >
                {p.label}
              </button>
            )}
          </For>
          <button class="btn ms-launch" disabled={running()} onClick={launch}>
            {running() ? "searching…" : "Launch Search"}
          </button>
        </div>
      </div>

      {/* Live progress strip */}
      <div class="ms-stats">
        <Stat label="variants explored" v={fmtNumber(explored())} accent />
        <Stat label="planned budget" v={fmtNumber(budget())} />
        <Stat label="variants / sec" v={fmtNumber(vps())} accent />
        <Stat label="progress" v={(progress() * 100).toFixed(1) + "%"} />
        <Stat label="winners revealed" v={`${revealedTop()} / 10`} />
        <Stat label="best composite" v={(bestCurve().at(-1)?.composite ?? 0).toFixed(4)} accent />
      </div>
      <div class="ms-progress">
        <div class="ms-bar" style={`width:${progress() * 100}%`} />
      </div>

      {/* Histogram + best-so-far + leaderboard in a 3-column block */}
      <div class="ms-grid">
        <div class="ms-panel">
          <div class="ms-panel-head">Fitness Distribution · {histLive().length} bins</div>
          <Histogram bins={histLive()} />
        </div>
        <div class="ms-panel">
          <div class="ms-panel-head">Best-So-Far · composite vs n</div>
          <BestCurve curve={bestCurve()} maxN={result()?.budget_explored ?? budget()} />
        </div>
        <div class="ms-panel">
          <div class="ms-panel-head">Top-10 Champions · selected from {fmtNumber(result()?.budget_explored ?? budget())}</div>
          <Leaderboard items={result()?.top ?? []} revealed={revealedTop()} />
        </div>
      </div>

      <Show when={result() && !running()}>
        <div class="ms-final">
          <span class="pill">winner</span>
          <span style="font-size:14px"><strong>{result()!.top[0].name}</strong> · composite {result()!.top[0].composite.toFixed(4)} · {result()!.top[0].mutations_count} mutations from seed</span>
          <span class="muted">runtime {(result()!.duration_ms / 1000).toFixed(1)}s · {fmtNumber(result()!.variants_per_sec)}/sec · backend pe-swarm</span>
        </div>
      </Show>
    </div>
  );
}

function Stat(props: { label: string; v: string; accent?: boolean }) {
  return (
    <div class={`ms-stat ${props.accent ? "accent" : ""}`}>
      <div class="ms-stat-v">{props.v}</div>
      <div class="ms-stat-l">{props.label}</div>
    </div>
  );
}

function Histogram(props: { bins: number[] }) {
  const W = 520, H = 150, PAD = 6;
  const max = props.bins.length ? Math.max(...props.bins, 1) : 1;
  const barW = (W - 2 * PAD) / Math.max(props.bins.length, 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="ms-hist">
      <For each={props.bins}>
        {(c, i) => {
          const h = (c / max) * (H - 2 * PAD);
          const x = PAD + i() * barW;
          const y = H - PAD - h;
          const hue = (i() / props.bins.length) * 140 + 200; // teal→blue gradient
          return <rect x={x} y={y} width={Math.max(barW - 1, 1)} height={h} fill={`hsl(${hue} 70% 60%)`} opacity={0.85} />;
        }}
      </For>
    </svg>
  );
}

function BestCurve(props: { curve: Array<{ at_n: number; composite: number }>; maxN: number }) {
  const W = 520, H = 150, PAD = 14;
  const pts = (): string => {
    if (props.curve.length === 0) return "";
    const logMax = Math.log10(Math.max(props.maxN, 2));
    return props.curve
      .map((p) => {
        const lx = Math.log10(Math.max(p.at_n, 1)) / logMax;
        const x = PAD + lx * (W - 2 * PAD);
        const y = H - PAD - p.composite * (H - 2 * PAD);
        return `${x},${y}`;
      })
      .join(" ");
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="ms-curve">
      {[0.25, 0.5, 0.75].map((f) => (
        <line x1={PAD} x2={W - PAD} y1={PAD + f * (H - 2 * PAD)} y2={PAD + f * (H - 2 * PAD)}
              stroke="rgba(154,163,196,0.15)" stroke-dasharray="3 4" />
      ))}
      <polyline points={pts()} fill="none" stroke="#fbbf24" stroke-width="2.5" />
      <Show when={props.curve.length > 0}>
        {(() => {
          const last = props.curve.at(-1)!;
          const logMax = Math.log10(Math.max(props.maxN, 2));
          const lx = Math.log10(Math.max(last.at_n, 1)) / logMax;
          const x = PAD + lx * (W - 2 * PAD);
          const y = H - PAD - last.composite * (H - 2 * PAD);
          return <circle cx={x} cy={y} r="4" fill="#fbbf24" />;
        })()}
      </Show>
    </svg>
  );
}

function Leaderboard(props: {
  items: Array<{ rank: number; name: string; composite: number; mutations_count: number }>;
  revealed: number;
}) {
  return (
    <div class="ms-leader">
      <For each={props.items.slice(0, props.revealed)}>
        {(it) => (
          <div class={`ms-row ${it.rank === 1 ? "rank-1" : ""}`}>
            <span class="ms-rank">{it.rank === 1 ? "★" : `#${it.rank}`}</span>
            <span class="ms-name">{it.name}</span>
            <span class="ms-score">{it.composite.toFixed(4)}</span>
            <span class="ms-muts">{it.mutations_count} mut</span>
          </div>
        )}
      </For>
      <Show when={props.items.length === 0}>
        <div class="muted">launch a search to reveal winners</div>
      </Show>
    </div>
  );
}

function fmtNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
