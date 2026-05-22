// Yamanaka factor workbench — 4-up cards (OCT4, SOX2, KLF4, CMYC).
import { createResource, For, Show } from "solid-js";
import { YamanakaCard } from "../components/YamanakaCard";
import { useEngine } from "../stores/engine";

export function WorkbenchPage() {
  const engine = useEngine();
  const [factors] = createResource(() => engine.yamanakaFactors());

  return (
    <section class="grid">
      <div class="card span-12 hero">
        <div>
          <div class="hero-title">Yamanaka Factor Workbench</div>
          <div class="hero-sub">
            OCT4 · SOX2 · KLF4 · CMYC — the four-factor cocktail for somatic-cell reprogramming.
            Each card scores its canonical target sequence on the live pe-wasm runtime.
          </div>
        </div>
        <div class="hero-meta">
          <span class="badge">ESM-2 320-dim</span>
          <span class="badge">HNSW M=16</span>
          <span class="badge">pe-core fitness</span>
        </div>
      </div>

      <Show when={factors()} fallback={<div class="card span-12 muted">loading factors…</div>}>
        <For each={factors()}>
          {(f) => <YamanakaCard factor={f} />}
        </For>
      </Show>
    </section>
  );
}
