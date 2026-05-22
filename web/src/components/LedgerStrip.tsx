import { For, Show } from "solid-js";
import { ledger } from "../stores/ledger";

export function LedgerStrip() {
  return (
    <div class="card span-12">
      <h2>Ledger Integrity</h2>
      <div class="row" style="align-items:center; gap:12px; margin-bottom:10px">
        <span class={`pill ${ledger.valid ? "" : "warn"}`}>
          {ledger.valid ? "verified" : "BROKEN"}
        </span>
        <span class="muted">head <code>{ledger.head}</code></span>
        <span class="muted">{ledger.entry_count} entries</span>
      </div>
      <Show
        when={ledger.recent.length > 0}
        fallback={<div class="muted">no recent journal entries</div>}
      >
        <div class="ledger-strip">
          <For each={ledger.recent.slice(-12)}>
            {(e, i) => (
              <div class={`block ${i() === ledger.recent.slice(-12).length - 1 ? "head" : ""}`}>
                <div class="block-hash">{e.hash.slice(0, 8)}</div>
                <div class="block-label">{e.label}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
