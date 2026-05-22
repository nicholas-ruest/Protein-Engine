import { For, onCleanup, onMount, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { live, pushLive } from "../stores/live";

const KIND_COLOR: Record<string, string> = {
  "score.start": "var(--accent)",
  "score.done": "var(--good)",
  "evolve.tick": "var(--accent)",
  "promote": "var(--good)",
  "ledger.append": "var(--accent-2)",
  "witness.attest": "var(--accent-2)",
  "vqe.iter": "var(--accent)",
  "vqe.done": "var(--good)",
  "policy.allow": "var(--good)",
  "policy.block": "var(--warn)",
};

export function LiveEventStream() {
  const engine = useEngine();
  let unsub: (() => void) | null = null;

  onMount(() => {
    unsub = engine.subscribe((e) => {
      if (e.kind === "live") pushLive({ ts: Date.now(), topic: e.topic, label: e.label });
    });
    engine.startLiveTicker();
  });

  onCleanup(() => {
    unsub?.();
    engine.stopLiveTicker();
  });

  return (
    <div class="card span-4">
      <h2>Live Event Stream</h2>
      <Show
        when={live.events.length > 0}
        fallback={<div class="muted">waiting for events…</div>}
      >
        <div class="stream">
          <For each={[...live.events].reverse().slice(0, 20)}>
            {(e) => (
              <div class="stream-row">
                <span class="stream-dot" style={`background:${KIND_COLOR[e.topic] ?? "var(--text-dim)"}`} />
                <span class="stream-topic mono">{e.topic}</span>
                <span class="stream-label">{e.label}</span>
                <span class="stream-ts muted">{fmtTime(e.ts)}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}
