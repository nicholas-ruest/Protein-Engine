// ResearchBriefForm — scientist intake. Two-column compact form that captures
// what they want the engine to optimise for and any constraints.

import { For, Show, createSignal } from "solid-js";
import { brief, setBrief, type UseCase, type Host, type Delivery } from "../stores/brief";
import type { FactorName } from "../transport/types";

const FACTORS: FactorName[] = ["OCT4", "SOX2", "KLF4", "CMYC"];
const CATEGORY_OPTIONS = [
  "iPSC reprogramming",
  "cardiomyocyte induction",
  "neuronal differentiation",
  "pancreatic β-cell",
  "hepatocyte",
  "cancer suppressor",
  "regenerative medicine",
  "directed evolution",
  "synthetic biology",
];
const USE_CASES: Array<{ id: UseCase; label: string; sub: string }> = [
  { id: "in_vitro_screening", label: "In-vitro screening", sub: "lab bench, no animals" },
  { id: "in_vivo_delivery", label: "In-vivo delivery", sub: "animal model" },
  { id: "therapeutic_candidate", label: "Therapeutic", sub: "regulatory pathway" },
  { id: "basic_research", label: "Basic research", sub: "discovery-stage" },
];
const HOSTS: Host[] = ["human", "mouse", "ecoli", "yeast", "insect"];
const DELIVERY: Array<{ id: Delivery; label: string }> = [
  { id: "mrna", label: "mRNA-LNP" },
  { id: "aav", label: "AAV" },
  { id: "lentiviral", label: "Lentiviral" },
  { id: "protein", label: "Direct protein" },
  { id: "naked_dna", label: "Naked DNA" },
];

export function ResearchBriefForm(props: { onSubmit?: () => void; compact?: boolean }) {
  const [collapsed, setCollapsed] = createSignal(false);

  function toggleCategory(c: string) {
    const cur = new Set(brief.research_categories);
    if (cur.has(c)) cur.delete(c); else cur.add(c);
    setBrief("research_categories", [...cur]);
  }

  function normalise() {
    const sum = brief.priority_efficiency + brief.priority_stability + brief.priority_safety;
    if (sum === 0) return;
    setBrief({
      priority_efficiency: Number((brief.priority_efficiency / sum).toFixed(2)),
      priority_stability: Number((brief.priority_stability / sum).toFixed(2)),
      priority_safety: Number((brief.priority_safety / sum).toFixed(2)),
    });
  }

  const summary = () => {
    return `${brief.target_factor} · ${brief.use_case.replace(/_/g, " ")} · ${brief.host_organism} · ${brief.delivery_modality} · ${brief.research_categories.length} categor${brief.research_categories.length === 1 ? "y" : "ies"}`;
  };

  return (
    <div class="card span-12 brief-card">
      <div class="row" style="justify-content:space-between; align-items:flex-start">
        <div>
          <h2 style="margin-bottom:4px">Research Brief · scientist intake</h2>
          <div class="muted" style="max-width:680px">
            Tell the engine what you're optimising for. The brief shapes mutation strategy, scoring weights, and the
            compliance check on each candidate before promotion.
          </div>
        </div>
        <div class="row" style="gap:8px; align-items:center">
          <span class="muted">{summary()}</span>
          <button class="btn-ghost" onClick={() => setCollapsed(!collapsed())}>
            {collapsed() ? "expand" : "collapse"}
          </button>
        </div>
      </div>

      <Show when={!collapsed()}>
        <div class="brief-grid">
          {/* ── Identity ── */}
          <div class="brief-col">
            <FieldLabel label="Principal investigator">
              <input type="text" placeholder="Dr. Jane Liu, Whitehead Institute"
                value={brief.pi_name}
                onInput={(e) => setBrief("pi_name", e.currentTarget.value)} />
            </FieldLabel>
            <FieldLabel label="Project ID">
              <input type="text" value={brief.project_id}
                onInput={(e) => setBrief("project_id", e.currentTarget.value)} />
            </FieldLabel>

            <FieldLabel label="Target Yamanaka factor">
              <div class="chip-row">
                <For each={FACTORS}>
                  {(f) => (
                    <button
                      class={`chip ${brief.target_factor === f ? "chip-active" : ""}`}
                      onClick={() => setBrief("target_factor", f)}
                    >{f}</button>
                  )}
                </For>
              </div>
            </FieldLabel>

            <FieldLabel label="Research categories · multi-select">
              <div class="chip-row">
                <For each={CATEGORY_OPTIONS}>
                  {(c) => (
                    <button
                      class={`chip ${brief.research_categories.includes(c) ? "chip-active" : ""}`}
                      onClick={() => toggleCategory(c)}
                    >{c}</button>
                  )}
                </For>
              </div>
            </FieldLabel>

            <FieldLabel label="Use case">
              <div class="usecase-grid">
                <For each={USE_CASES}>
                  {(u) => (
                    <button
                      class={`usecase ${brief.use_case === u.id ? "usecase-active" : ""}`}
                      onClick={() => setBrief("use_case", u.id)}
                    >
                      <div class="uc-label">{u.label}</div>
                      <div class="uc-sub muted">{u.sub}</div>
                    </button>
                  )}
                </For>
              </div>
            </FieldLabel>
          </div>

          {/* ── Optimization + Constraints ── */}
          <div class="brief-col">
            <FieldLabel label="Optimization priorities · click 'normalise' to scale to 1">
              <PrioritySlider label="reprogramming efficiency" v={brief.priority_efficiency}
                set={(n) => setBrief("priority_efficiency", n)} />
              <PrioritySlider label="expression stability" v={brief.priority_stability}
                set={(n) => setBrief("priority_stability", n)} />
              <PrioritySlider label="safety / off-target avoidance" v={brief.priority_safety}
                set={(n) => setBrief("priority_safety", n)} />
              <button class="btn-ghost" onClick={normalise} style="margin-top:4px">normalise to Σ=1</button>
            </FieldLabel>

            <div class="row" style="gap:10px">
              <FieldLabel label="Host organism" inline>
                <select value={brief.host_organism}
                  onChange={(e) => setBrief("host_organism", e.currentTarget.value as Host)}>
                  <For each={HOSTS}>
                    {(h) => <option value={h}>{h}</option>}
                  </For>
                </select>
              </FieldLabel>
              <FieldLabel label="Delivery" inline>
                <select value={brief.delivery_modality}
                  onChange={(e) => setBrief("delivery_modality", e.currentTarget.value as Delivery)}>
                  <For each={DELIVERY}>
                    {(d) => <option value={d.id}>{d.label}</option>}
                  </For>
                </select>
              </FieldLabel>
              <FieldLabel label="Max length (aa)" inline>
                <input type="number" min="20" max="2000" value={brief.max_length}
                  onInput={(e) => setBrief("max_length", Number(e.currentTarget.value))} />
              </FieldLabel>
            </div>

            <FieldLabel label="Required motifs · comma-separated (regex or aa)">
              <input type="text" value={brief.required_motifs}
                placeholder="POU,HOX,RRR.{2,4}KR"
                onInput={(e) => setBrief("required_motifs", e.currentTarget.value)} />
            </FieldLabel>

            <FieldLabel label="Forbidden residues · comma-separated">
              <input type="text" value={brief.forbidden_residues}
                placeholder="e.g. C, M (disables disulfides, oxidation hotspots)"
                onInput={(e) => setBrief("forbidden_residues", e.currentTarget.value)} />
            </FieldLabel>

            <FieldLabel label="Research hypothesis · what should the winner achieve?">
              <textarea rows={4} value={brief.hypothesis}
                onInput={(e) => setBrief("hypothesis", e.currentTarget.value)} />
            </FieldLabel>
          </div>
        </div>

        <Show when={props.onSubmit}>
          <div class="row" style="justify-content:flex-end; margin-top:14px">
            <button class="btn" onClick={() => props.onSubmit?.()}>Save brief & launch search</button>
          </div>
        </Show>
      </Show>
    </div>
  );
}

function FieldLabel(props: { label: string; inline?: boolean; children: any }) {
  return (
    <label class={`brief-field ${props.inline ? "inline" : ""}`}>
      <span class="brief-field-label">{props.label}</span>
      <div class="brief-field-input">{props.children}</div>
    </label>
  );
}

function PrioritySlider(props: { label: string; v: number; set: (n: number) => void }) {
  return (
    <div class="priority">
      <div class="row" style="justify-content:space-between">
        <span class="priority-label">{props.label}</span>
        <span class="priority-val">{props.v.toFixed(2)}</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.01"
        value={String(props.v)}
        onInput={(e) => props.set(Number(e.currentTarget.value))}
      />
    </div>
  );
}
