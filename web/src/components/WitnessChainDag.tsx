import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import type { LedgerEntry } from "../transport/types";

const TEE_BADGE: Record<string, string> = {
  "intel-sgx": "SGX",
  "amd-sev": "SEV",
  "arm-cca": "CCA",
};

export function WitnessChainDag() {
  const engine = useEngine();
  const [entries] = createResource(() => engine.ledgerEntries(20, 0).catch(() => [] as LedgerEntry[]));

  return (
    <div class="card span-12">
      <h2>Witness Chain · cryptographically-linked journal</h2>
      <Show when={entries()} fallback={<div class="muted">loading chain…</div>}>
        <div class="chain">
          <For each={entries()!}>
            {(e, idx) => (
              <>
                <div class={`chain-node ${idx() === entries()!.length - 1 ? "head" : ""}`}>
                  <div class="chain-hash mono">{e.hash.slice(0, 10)}</div>
                  <div class="chain-label">{e.label}</div>
                  <div class="chain-meta">
                    <span class="muted">e{e.index}</span>
                    <span class={`tee-badge ${e.tee_attestation.valid ? "" : "bad"}`}>
                      {TEE_BADGE[e.tee_attestation.vendor] ?? e.tee_attestation.vendor}
                    </span>
                  </div>
                  <div class="chain-witness mono" title={e.witness_signature}>
                    σ {e.witness_signature.slice(0, 12)}
                  </div>
                  <div class="chain-witnesses">
                    <For each={e.witnessed_by}>
                      {(w) => <span class="witness-chip">{w}</span>}
                    </For>
                  </div>
                </div>
                <Show when={idx() < entries()!.length - 1}>
                  <div class="chain-edge" />
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
