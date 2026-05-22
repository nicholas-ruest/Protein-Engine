import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";

export function SidecarHealth() {
  const engine = useEngine();
  const [health] = createResource(() => engine.sidecarHealth().catch(() => null));

  return (
    <div class="card span-4">
      <h2>chemiq Sidecar</h2>
      <Show when={health()} fallback={<div class="muted">probing…</div>}>
        <div class="kpi-row">
          <div class="kpi">
            <div class="v">{health()!.last_ping_ms}<span class="l-inline">ms</span></div>
            <div class="l">round-trip</div>
          </div>
          <div class="kpi">
            <div class="v">{health()!.version}</div>
            <div class="l">version</div>
          </div>
        </div>
        <div class="muted mono" style="margin-top:10px; font-size:11px">
          {health()!.url}
        </div>
        <div class="row" style="gap:6px; flex-wrap:wrap; margin-top:10px">
          <For each={health()!.backends_available}>
            {(b) => <span class="chip chip-active">{b}</span>}
          </For>
        </div>
      </Show>
    </div>
  );
}
