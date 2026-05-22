import { createResource, createSignal, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import type { RvfSegmentRow } from "../transport/types";

export function SegmentExplorer() {
  const engine = useEngine();
  const [segments] = createResource(() => engine.rvfSegments().catch(() => [] as RvfSegmentRow[]));
  const [openId, setOpenId] = createSignal<number | null>(null);
  const [detail] = createResource(openId, async (id) => {
    if (id == null) return null;
    return engine.rvfSegmentDetail(id);
  });

  return (
    <div class="card span-12">
      <h2>RVF Segment Explorer</h2>
      <Show when={segments()} fallback={<div class="muted">loading segments…</div>}>
        <div class="segments">
          <For each={segments()!}>
            {(s) => (
              <button
                class={`segment ${openId() === s.id ? "open" : ""}`}
                onClick={() => setOpenId(openId() === s.id ? null : s.id)}
              >
                <div class="seg-id mono">0x{s.id.toString(16).padStart(2, "0")}</div>
                <div class="seg-name">{s.name}</div>
                <div class="seg-summary muted">{s.summary}</div>
                <div class="seg-size muted">{fmtBytes(s.size)}</div>
              </button>
            )}
          </For>
        </div>
        <Show when={detail()}>
          <div class="seg-detail">
            <div class="row" style="justify-content:space-between">
              <div>
                <strong>{detail()!.name}</strong>
                <span class="muted"> · 0x{detail()!.id.toString(16).padStart(2, "0")} · {fmtBytes(detail()!.size)}</span>
              </div>
              <button class="btn-ghost" onClick={() => setOpenId(null)}>close</button>
            </div>
            <pre class="seg-pre mono">{JSON.stringify(detail()!.detail ?? { summary: detail()!.summary }, null, 2)}</pre>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
