// Drag-and-drop RVF reader. Surfaces segment table after load.

import { createSignal, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { RvfClient } from "../transport/rvf";
import type { RvfManifest } from "../transport/types";

export function RvfInspector() {
  const engine = useEngine();
  const [manifest, setManifest] = createSignal<RvfManifest | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [dragging, setDragging] = createSignal(false);

  async function ingest(file: File): Promise<void> {
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const m = await engine.loadRvf(bytes);
      setManifest(m);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div class="card span-12">
      <h2>RVF Inspector</h2>
      <div
        class={`drop ${dragging() ? "drop-hot" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) await ingest(f);
        }}
      >
        <div class="drop-text">
          drag <code>.rvf</code> here · or <label class="link"><input
            type="file"
            accept=".rvf"
            style="display:none"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) void ingest(f);
            }}
          />browse</label>
        </div>
        <Show when={engine.mode === "rvf"}>
          <div class="muted">transport: rvf-replay</div>
        </Show>
      </div>
      <Show when={error()}>
        <div class="pill warn" style="margin-top:10px">{error()}</div>
      </Show>
      <Show when={manifest()}>
        <div class="kpi-row" style="margin-top:14px">
          <div class="kpi"><div class="v">{manifest()!.vectors_loaded}</div><div class="l">vectors</div></div>
          <div class="kpi"><div class="v">{manifest()!.journal_entries}</div><div class="l">journal entries</div></div>
          <div class="kpi"><div class="v">{manifest()!.segments?.length ?? 0}</div><div class="l">segments</div></div>
        </div>
        <Show when={(manifest()!.segments?.length ?? 0) > 0}>
          <table style="margin-top:12px">
            <thead><tr><th>id</th><th>name</th><th>size</th></tr></thead>
            <tbody>
              <For each={manifest()!.segments}>
                {(s) => (
                  <tr>
                    <td class="mono">0x{s.id.toString(16).padStart(2, "0")}</td>
                    <td>{s.name}</td>
                    <td>{fmtBytes(s.size_bytes)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
        <Show when={engine instanceof RvfClient && manifest()!.segments?.length === 0}>
          <div class="muted" style="margin-top:10px">
            segment table not parseable from this file · scoring still works through pe-wasm
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
