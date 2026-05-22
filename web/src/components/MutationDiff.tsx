import { For, Show } from "solid-js";

export interface Mutation {
  position: number;
  from: string;
  to: string;
}

export function MutationDiff(props: {
  parent: string;
  child: string;
  title?: string;
}) {
  const mutations = (): Mutation[] => {
    const out: Mutation[] = [];
    const n = Math.min(props.parent.length, props.child.length);
    for (let i = 0; i < n; i++) {
      if (props.parent[i] !== props.child[i]) {
        out.push({ position: i + 1, from: props.parent[i], to: props.child[i] });
      }
    }
    return out;
  };

  const muts = mutations();
  const positions = new Set(muts.map((m) => m.position));

  return (
    <div class="card span-8">
      <h2>{props.title ?? "Mutation Diff"}</h2>
      <div class="row" style="gap:18px; margin-bottom:12px">
        <span class="badge">{muts.length} mutations</span>
        <span class="muted">parent length {props.parent.length} → child length {props.child.length}</span>
      </div>
      <div class="diff-strip">
        <For each={[...props.child]}>
          {(aa, i) => (
            <span
              class={`aa ${positions.has(i() + 1) ? "aa-mut" : ""}`}
              title={
                positions.has(i() + 1)
                  ? `${props.parent[i()]}→${aa} @${i() + 1}`
                  : `${aa}@${i() + 1}`
              }
            >
              {aa}
            </span>
          )}
        </For>
      </div>
      <Show when={muts.length > 0}>
        <table style="margin-top:14px">
          <thead><tr><th>position</th><th>from</th><th>to</th><th>notation</th></tr></thead>
          <tbody>
            <For each={muts}>
              {(m) => (
                <tr>
                  <td class="mono">{m.position}</td>
                  <td class="mono">{m.from}</td>
                  <td class="mono">{m.to}</td>
                  <td class="mono">{m.from}{m.position}{m.to}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
