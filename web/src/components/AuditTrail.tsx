import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import type { AuditEvent } from "../transport/types";

const ACTION_CLASS: Record<string, string> = {
  allowed: "pill",
  blocked: "pill warn",
  throttled: "pill",
};

export function AuditTrail() {
  const engine = useEngine();
  const [events] = createResource(() => engine.listAuditEvents(40).catch(() => [] as AuditEvent[]));

  return (
    <div class="card span-5">
      <h2>Audit Trail</h2>
      <Show when={events()} fallback={<div class="muted">loading…</div>}>
        <div class="audit">
          <For each={events()}>
            {(e) => (
              <div class="audit-row">
                <span class={ACTION_CLASS[e.action] ?? "pill"}>{e.action}</span>
                <div class="audit-meat">
                  <div class="audit-subject mono">{e.subject}</div>
                  <div class="muted">{e.policy} · {e.reason}</div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
