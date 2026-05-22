import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";

export function BackendRouting(props: { lastBackend?: string }) {
  const engine = useEngine();
  const [health] = createResource(() => engine.sidecarHealth().catch(() => null));

  const lanes = [
    { id: "local-statevector", label: "local statevector", lat: "≤4 qubits · sync", notes: "default for ≤ 4-qubit Hamiltonians" },
    { id: "chemiq-sidecar", label: "chemiq sidecar", lat: "5–12 qubits · async", notes: "Python · pyscf / qiskit-nature" },
    { id: "cloud-qpu", label: "cloud QPU (not configured)", lat: "13+ qubits", notes: "ADR-006 routing tier 3" },
  ];

  return (
    <div class="card span-4">
      <h2>Quantum Backend Routing</h2>
      <div class="routing">
        <For each={lanes}>
          {(l) => (
            <div class={`lane ${props.lastBackend === l.id ? "lane-hot" : ""}`}>
              <div class="lane-head">
                <span class="lane-label">{l.label}</span>
                <Show when={props.lastBackend === l.id}>
                  <span class="pill">routed</span>
                </Show>
              </div>
              <div class="muted">{l.lat}</div>
              <div class="muted">{l.notes}</div>
            </div>
          )}
        </For>
      </div>
      <Show when={health()}>
        <div class="row" style="margin-top:14px; gap:10px; align-items:center">
          <span class={`pill ${health()!.reachable ? "" : "warn"}`}>
            {health()!.reachable ? "sidecar online" : "sidecar offline"}
          </span>
          <span class="muted">{health()!.version} · {health()!.last_ping_ms}ms</span>
        </div>
      </Show>
    </div>
  );
}
