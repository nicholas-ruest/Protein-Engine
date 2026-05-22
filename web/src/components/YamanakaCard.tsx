import { createResource, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import type { YamanakaFactor } from "../transport/types";
import type { FitnessScore } from "../types";
import { ProteinViewer3D } from "./ProteinViewer3D";

export function YamanakaCard(props: { factor: YamanakaFactor }) {
  const engine = useEngine();
  const [score] = createResource(
    () => props.factor.target_sequence,
    (seq) => engine.scoreSequence(seq) as Promise<FitnessScore>,
  );

  return (
    <div class="card factor-card span-6">
      <div class="factor-head">
        <div class="factor-badge" data-factor={props.factor.name}>{props.factor.name}</div>
        <div class="factor-name">
          <div class="full">{props.factor.full_name}</div>
          <div class="muted">{props.factor.role} · {props.factor.target_residues} aa</div>
        </div>
      </div>

      <ProteinViewer3D
        sequence={props.factor.target_sequence}
        factor={props.factor.name}
        height={260}
        spin
      />

      <Show when={score()} fallback={<div class="muted">scoring…</div>}>
        <div class="factor-grid">
          <FactorBar label="reprogramming" v={score()!.reprogramming_efficiency} />
          <FactorBar label="stability" v={score()!.expression_stability} />
          <FactorBar label="structure" v={score()!.structural_plausibility} />
          <FactorBar label="safety" v={score()!.safety_score} />
        </div>
        <div class="row" style="justify-content:space-between; margin-top:10px; align-items:center">
          <div class="kpi"><div class="v">{score()!.composite.toFixed(3)}</div><div class="l">composite</div></div>
          <button class="btn-ghost" onclick={() => navigator.clipboard?.writeText(props.factor.target_sequence)}>
            copy sequence
          </button>
        </div>
      </Show>
    </div>
  );
}

function FactorBar(props: { label: string; v: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, props.v)) * 100);
  return (
    <div class="bar">
      <div class="bar-label">{props.label}</div>
      <div class="bar-track"><div class="bar-fill" style={`width:${pct}%`} /></div>
      <div class="bar-val">{props.v.toFixed(2)}</div>
    </div>
  );
}
