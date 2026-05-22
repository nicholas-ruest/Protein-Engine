import { createSignal, For, Show } from "solid-js";
import type { Hamiltonian } from "../transport/types";

const PRESETS: Array<{ name: string; ham: Hamiltonian }> = [
  {
    name: "H₂ (sto-3g, R=0.74Å)",
    ham: {
      num_qubits: 4,
      terms: [
        { coefficient: -1.0523, pauli_string: "IIII" },
        { coefficient: 0.3979, pauli_string: "IIIZ" },
        { coefficient: -0.3979, pauli_string: "IIZI" },
        { coefficient: -0.0112, pauli_string: "IZII" },
        { coefficient: 0.1812, pauli_string: "IIZZ" },
        { coefficient: 0.1659, pauli_string: "IZIZ" },
        { coefficient: 0.1659, pauli_string: "ZIIZ" },
      ],
    },
  },
  {
    name: "LiH (sto-3g, R=1.5Å)",
    ham: {
      num_qubits: 6,
      terms: [
        { coefficient: -7.882, pauli_string: "IIIIII" },
        { coefficient: 0.171, pauli_string: "IIIIIZ" },
        { coefficient: 0.171, pauli_string: "IIIIZI" },
        { coefficient: -0.223, pauli_string: "IIIZII" },
        { coefficient: 0.122, pauli_string: "IIIIZZ" },
        { coefficient: 0.167, pauli_string: "IIIZIZ" },
      ],
    },
  },
];

export function HamiltonianEditor(props: { onRun: (h: Hamiltonian) => void; busy?: boolean }) {
  const [ham, setHam] = createSignal<Hamiltonian>(PRESETS[0].ham);
  const [selected, setSelected] = createSignal(PRESETS[0].name);
  const [raw, setRaw] = createSignal(JSON.stringify(PRESETS[0].ham, null, 2));
  const [err, setErr] = createSignal<string | null>(null);

  function pick(name: string) {
    setSelected(name);
    const p = PRESETS.find((x) => x.name === name);
    if (p) {
      setHam(p.ham);
      setRaw(JSON.stringify(p.ham, null, 2));
      setErr(null);
    }
  }

  function parseRaw() {
    try {
      const v = JSON.parse(raw()) as Hamiltonian;
      if (!v.num_qubits || !Array.isArray(v.terms)) throw new Error("missing num_qubits/terms");
      setHam(v);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <div class="card span-7">
      <h2>Hamiltonian Editor</h2>
      <div class="row" style="gap:8px; flex-wrap:wrap; margin-bottom:10px">
        <For each={PRESETS}>
          {(p) => (
            <button
              class={`chip ${selected() === p.name ? "chip-active" : ""}`}
              onClick={() => pick(p.name)}
            >
              {p.name}
            </button>
          )}
        </For>
      </div>
      <textarea
        class="seq-input mono"
        rows={10}
        value={raw()}
        onInput={(e) => setRaw(e.currentTarget.value)}
      />
      <div class="row" style="justify-content:space-between; margin-top:10px; gap:8px">
        <span class="muted">
          {ham().num_qubits} qubits · {ham().terms.length} Pauli term{ham().terms.length === 1 ? "" : "s"}
        </span>
        <div class="row" style="gap:8px">
          <button class="btn-ghost" onClick={parseRaw}>parse</button>
          <button
            class="btn"
            disabled={!!props.busy}
            onClick={() => { parseRaw(); if (!err()) props.onRun(ham()); }}
          >
            {props.busy ? "running…" : "Run VQE"}
          </button>
        </div>
      </div>
      <Show when={err()}>
        <div class="pill warn" style="margin-top:8px">{err()}</div>
      </Show>
    </div>
  );
}
