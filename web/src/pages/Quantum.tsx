import { createSignal, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { HamiltonianEditor } from "../components/HamiltonianEditor";
import { VqeConvergence } from "../components/VqeConvergence";
import { BackendRouting } from "../components/BackendRouting";
import { SidecarHealth } from "../components/SidecarHealth";
import { BlochSphere } from "../components/BlochSphere";
import type { Hamiltonian, QuantumResult } from "../transport/types";

export function QuantumPage() {
  const engine = useEngine();
  const [result, setResult] = createSignal<QuantumResult | undefined>();
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function runVqe(h: Hamiltonian): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const r = await engine.runLocalQuantumSim(h);
      setResult(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section class="grid">
      <div class="card span-12 hero">
        <div>
          <div class="hero-title">Quantum VQE Workbench</div>
          <div class="hero-sub">
            Variational Quantum Eigensolver against a molecular Hamiltonian.
            Routing follows ADR-006 — local statevector for ≤4 qubits, chemiq sidecar otherwise.
          </div>
        </div>
        <div class="hero-meta">
          <span class="badge">pe-quantum-wasm</span>
          <span class="badge">pyscf · qiskit-nature</span>
          <span class="badge">ADR-006</span>
        </div>
      </div>

      <HamiltonianEditor onRun={runVqe} busy={busy()} />
      <VqeConvergence result={result()} />

      <div class="card span-6">
        <h2>Bloch Sphere · qubit state</h2>
        <BlochSphere result={result()} height={340} />
        <div class="muted" style="margin-top:8px">
          state vector derived from VQE optimal parameters · drag to rotate, wheel to zoom
        </div>
      </div>

      <BackendRouting lastBackend={result()?.backend} />
      <SidecarHealth />

      <Show when={error()}>
        <div class="card span-12 pill warn">{error()}</div>
      </Show>
    </section>
  );
}
