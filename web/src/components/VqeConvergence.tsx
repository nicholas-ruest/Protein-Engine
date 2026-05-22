import { Show } from "solid-js";
import type { QuantumResult } from "../transport/types";

export function VqeConvergence(props: { result?: QuantumResult }) {
  const W = 560, H = 280, PAD = 36;

  const points = (): string => {
    const conv = props.result?.convergence ?? [];
    if (conv.length === 0) return "";
    const minE = Math.min(...conv.map((c) => c.energy));
    const maxE = Math.max(...conv.map((c) => c.energy));
    const range = Math.max(maxE - minE, 1e-6);
    return conv
      .map((c, i) => {
        const x = PAD + (i / (conv.length - 1 || 1)) * (W - 2 * PAD);
        const y = PAD + ((c.energy - minE) / range) * (H - 2 * PAD);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div class="card span-5">
      <h2>VQE Convergence</h2>
      <Show
        when={props.result}
        fallback={<div class="muted">launch a VQE run from the Hamiltonian editor</div>}
      >
        <div class="row" style="gap:18px; flex-wrap:wrap; margin-bottom:10px">
          <div class="kpi"><div class="v">{props.result!.ground_state_energy.toFixed(4)}</div><div class="l">ground (Ha)</div></div>
          <div class="kpi"><div class="v">{props.result!.iterations}</div><div class="l">iterations</div></div>
          <div class="kpi"><div class="v">{props.result!.qubits ?? "—"}</div><div class="l">qubits</div></div>
          <div class="kpi">
            <div class="v" style="font-size:14px">{props.result!.backend ?? "—"}</div>
            <div class="l">backend</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} class="timeline">
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              x1={PAD} x2={W - PAD}
              y1={PAD + f * (H - 2 * PAD)} y2={PAD + f * (H - 2 * PAD)}
              stroke="rgba(154,163,196,0.12)" stroke-dasharray="3 4"
            />
          ))}
          <polyline points={points()} fill="none" stroke="rgb(124,156,255)" stroke-width="2" />
          <text x={PAD} y={H - 8} class="scatter-axis">iter →</text>
          <text x={6} y={PAD} class="scatter-axis">↑ energy</text>
        </svg>
        <div class="muted" style="margin-top:8px">
          parameters: <code class="mono">[{(props.result!.optimal_parameters ?? []).map((x) => x.toFixed(3)).join(", ")}]</code>
        </div>
      </Show>
    </div>
  );
}
