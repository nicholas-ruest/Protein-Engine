import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import type { Policy } from "../transport/types";

const SEVERITY_CLASS: Record<string, string> = {
  block: "pill warn",
  throttle: "pill",
  warn: "pill",
};

export function PolicyPanel() {
  const engine = useEngine();
  const [policies] = createResource(() => engine.listPolicies().catch(() => [] as Policy[]));

  return (
    <div class="card span-7">
      <h2>Governance Policies · pe-governance</h2>
      <Show when={policies()} fallback={<div class="muted">loading…</div>}>
        <table>
          <thead>
            <tr><th>name</th><th>rule</th><th>severity</th><th>status</th></tr>
          </thead>
          <tbody>
            <For each={policies()}>
              {(p) => (
                <tr>
                  <td>{p.name}</td>
                  <td class="mono" style="font-size:11px">{p.rule}</td>
                  <td><span class={SEVERITY_CLASS[p.severity] ?? "pill"}>{p.severity}</span></td>
                  <td>
                    <span class={`pill ${p.active ? "" : "warn"}`}>
                      {p.active ? "active" : "inactive"}
                    </span>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
