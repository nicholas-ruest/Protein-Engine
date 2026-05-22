// Heatmap of mutation frequency by sequence position across generations.

import { For, Show } from "solid-js";
import type { CycleResult } from "../types";

export function HotspotHeatmap(props: { cycles: CycleResult[] }) {
  const positions = () => {
    const counts: number[] = [];
    let maxLen = 0;
    for (const c of props.cycles) {
      for (const p of c.promoted) {
        const ms = (p as any).mutations as Array<{ position: number }> | undefined;
        if (!ms) continue;
        for (const m of ms) {
          counts[m.position] = (counts[m.position] ?? 0) + 1;
          if (m.position > maxLen) maxLen = m.position;
        }
      }
    }
    return { counts, maxLen };
  };

  const { counts, maxLen } = positions();
  const max = counts.length ? Math.max(...counts.filter((x) => Number.isFinite(x))) : 0;

  return (
    <div class="card span-4">
      <h2>Mutation Hotspots</h2>
      <Show
        when={maxLen > 0}
        fallback={<div class="muted">no mutations recorded yet</div>}
      >
        <div class="heatmap">
          <For each={Array.from({ length: Math.max(maxLen, 40) }, (_, i) => i + 1)}>
            {(pos) => {
              const c = counts[pos] ?? 0;
              const t = max > 0 ? c / max : 0;
              return (
                <div
                  class="cell"
                  title={`pos ${pos} · ${c} mutations`}
                  style={`background: rgba(124,156,255,${t * 0.9 + (c > 0 ? 0.1 : 0)})`}
                >
                  {c > 0 ? c : ""}
                </div>
              );
            }}
          </For>
        </div>
        <div class="muted" style="margin-top:8px">
          observed across {props.cycles.length} cycle{props.cycles.length === 1 ? "" : "s"}
        </div>
      </Show>
    </div>
  );
}
