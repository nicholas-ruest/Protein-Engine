// 2D projection of ESM-2 embeddings — coloured by Yamanaka factor.
import { For, Show } from "solid-js";
import type { ProjectedPoint } from "../transport/types";

const FACTOR_COLOR: Record<string, string> = {
  OCT4: "#7c9cff",
  SOX2: "#4fd1c5",
  KLF4: "#fbbf24",
  CMYC: "#f87171",
};

export function EmbeddingScatter(props: {
  points: ProjectedPoint[];
  highlight?: string;
}) {
  const W = 560, H = 320, PAD = 36;
  const tx = (x: number) => PAD + ((x + 1) / 2) * (W - 2 * PAD);
  const ty = (y: number) => H - PAD - ((y + 1) / 2) * (H - 2 * PAD);

  return (
    <div class="card span-8">
      <h2>ESM-2 Embedding Space · 320-dim projected to 2D</h2>
      <Show
        when={props.points.length > 0}
        fallback={<div class="muted">no embeddings to project</div>}
      >
        <svg viewBox={`0 0 ${W} ${H}`} class="scatter">
          {[0.25, 0.5, 0.75].map((f) => (
            <>
              <line x1={PAD} x2={W - PAD} y1={PAD + f * (H - 2 * PAD)} y2={PAD + f * (H - 2 * PAD)} stroke="rgba(154,163,196,0.12)" />
              <line y1={PAD} y2={H - PAD} x1={PAD + f * (W - 2 * PAD)} x2={PAD + f * (W - 2 * PAD)} stroke="rgba(154,163,196,0.12)" />
            </>
          ))}
          <text x={PAD} y={H - 6} class="scatter-axis">PC1</text>
          <text x={W - PAD} y={H - 6} class="scatter-axis" text-anchor="end">→</text>
          <text x={6} y={PAD} class="scatter-axis">↑ PC2</text>

          <For each={props.points}>
            {(p) => (
              <circle
                cx={tx(p.x)}
                cy={ty(p.y)}
                r={props.highlight === p.sequence ? 8 : 4}
                fill={FACTOR_COLOR[p.factor] ?? "var(--accent)"}
                stroke={props.highlight === p.sequence ? "white" : "transparent"}
                stroke-width={props.highlight === p.sequence ? 2 : 0}
              />
            )}
          </For>
        </svg>
        <div class="row" style="gap:18px; margin-top:8px">
          <For each={Object.entries(FACTOR_COLOR)}>
            {([k, c]) => (
              <span class="legend-chip">
                <span class="legend-dot" style={`background:${c}`} />
                {k}
              </span>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
