// HNSW layered graph view. Visited nodes (traversal path) are highlighted.
import { For, Show } from "solid-js";
import type { HnswGraph as HnswGraphData } from "../transport/types";

export function HnswGraph(props: { data?: HnswGraphData }) {
  const W = 540;
  const layerH = 100;

  return (
    <div class="card span-4">
      <h2>HNSW Traversal</h2>
      <Show when={props.data} fallback={<div class="muted">run a similarity search to populate</div>}>
        <div class="muted" style="margin-bottom:10px">
          query <code>{props.data!.query}…</code>
        </div>
        <svg viewBox={`0 0 ${W} ${props.data!.layers.length * layerH + 30}`} class="hnsw">
          <For each={props.data!.layers}>
            {(layer, lIdx) => (
              <>
                <text x={10} y={lIdx() * layerH + 20} class="hnsw-label">L{layer.layer}</text>
                <line
                  x1={0} x2={W}
                  y1={lIdx() * layerH + layerH * 0.5 + 14}
                  y2={lIdx() * layerH + layerH * 0.5 + 14}
                  stroke="rgba(154,163,196,0.12)"
                />
                <For each={layer.nodes}>
                  {(n) => {
                    const cx = 40 + (n.x / 100) * (W - 60);
                    const cy = lIdx() * layerH + 30 + (n.y / 100) * 50;
                    return (
                      <circle
                        cx={cx} cy={cy}
                        r={n.is_visit ? 7 : 4}
                        fill={n.is_visit ? "var(--accent)" : "rgba(124,156,255,0.3)"}
                        stroke={n.is_visit ? "white" : "transparent"}
                        stroke-width={n.is_visit ? 1.5 : 0}
                      />
                    );
                  }}
                </For>
              </>
            )}
          </For>
        </svg>
        <div class="row" style="gap:14px; margin-top:6px">
          <span class="legend-chip"><span class="legend-dot" style="background:var(--accent)" /> visited</span>
          <span class="legend-chip"><span class="legend-dot" style="background:rgba(124,156,255,0.3)" /> indexed</span>
        </div>
      </Show>
    </div>
  );
}
