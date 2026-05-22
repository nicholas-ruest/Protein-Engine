// Line chart: composite-vs-generation. Pure SVG, no library.

import { Show } from "solid-js";
import { cycle } from "../stores/cycle";

export function EvolutionTimeline() {
  const series = () => {
    return cycle.history
      .map((h) => {
        const top = h.promoted[0]?.composite ?? 0;
        return { gen: h.generation, top };
      })
      .sort((a, b) => a.gen - b.gen);
  };

  const W = 640, H = 220, PAD = 32;
  const points = () => {
    const s = series();
    if (s.length === 0) return "";
    const xs = s.map((d) => d.gen);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs, minX + 1);
    return s
      .map((d) => {
        const x = PAD + ((d.gen - minX) / (maxX - minX)) * (W - 2 * PAD);
        const y = H - PAD - d.top * (H - 2 * PAD);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div class="card span-8">
      <h2>Evolution Timeline</h2>
      <Show
        when={series().length > 0}
        fallback={<div class="muted">no cycles run yet · launch an evolution step on the Evolve page</div>}
      >
        <svg viewBox={`0 0 ${W} ${H}`} class="timeline">
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              x1={PAD}
              x2={W - PAD}
              y1={H - PAD - f * (H - 2 * PAD)}
              y2={H - PAD - f * (H - 2 * PAD)}
              stroke="rgba(154,163,196,0.18)"
              stroke-dasharray="3 4"
            />
          ))}
          <polyline
            points={points()}
            fill="none"
            stroke="rgb(124,156,255)"
            stroke-width="2"
          />
        </svg>
      </Show>
    </div>
  );
}
