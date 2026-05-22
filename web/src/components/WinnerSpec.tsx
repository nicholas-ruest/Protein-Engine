// WinnerSpec — the post-search scientific spec sheet for the chosen variant.
// Renders alongside a side-by-side 3D comparison with the seed.

import { createResource, For, Show } from "solid-js";
import { useEngine } from "../stores/engine";
import { brief } from "../stores/brief";
import { ProteinViewer3D } from "./ProteinViewer3D";
import type { MassiveSearchResult } from "../transport/types";

export function WinnerSpec(props: { result: MassiveSearchResult; seed: string }) {
  const engine = useEngine();
  const winner = () => props.result.top[0];
  const [spec] = createResource(() => winner().sequence, (s) => engine.computeSpecification(s));
  const [seedSpec] = createResource(() => props.seed, (s) => engine.computeSpecification(s));
  const [compliance] = createResource(
    () => winner().sequence,
    (s) => engine.complianceCheck(s, brief),
  );

  return (
    <>
      {/* ── Hero: winner identity + headline numbers ── */}
      <div class="card span-12 winner-hero">
        <div class="row" style="justify-content:space-between; align-items:flex-start; gap:18px; flex-wrap:wrap">
          <div>
            <div class="row" style="gap:10px; align-items:center; flex-wrap:wrap">
              <span class="pill winner-pill">★ winner</span>
              <h2 style="margin:0; font-size:18px">{winner().name}</h2>
              <span class="muted">selected from {fmtNumber(props.result.budget_explored)} candidates · runtime {(props.result.duration_ms / 1000).toFixed(1)}s · backend pe-swarm</span>
            </div>
            <div class="muted" style="margin-top:6px">
              brief: {brief.target_factor} · {brief.use_case.replace(/_/g, " ")} · {brief.host_organism} · {brief.delivery_modality}
            </div>
          </div>
          <div class="row" style="gap:18px; flex-wrap:wrap">
            <Kpi v={winner().composite.toFixed(4)} l="composite" accent />
            <Kpi v={String(winner().mutations_count)} l="mutations vs seed" />
            <Kpi v={spec()?.length ? `${spec()!.length} aa` : "—"} l="length" />
            <Kpi v={spec() ? `${(spec()!.mw_da / 1000).toFixed(2)} kDa` : "—"} l="molecular wt" />
            <Kpi v={spec() ? spec()!.pI.toFixed(2) : "—"} l="isoelectric pt" />
          </div>
        </div>
      </div>

      {/* ── 3D side-by-side comparison ── */}
      <div class="card span-6">
        <h2>Seed · WT reference</h2>
        <ProteinViewer3D sequence={props.seed} factor={brief.target_factor} height={300} />
        <div class="muted" style="margin-top:6px">{props.seed.length} aa · canonical {brief.target_factor} N-terminal fragment</div>
      </div>
      <div class="card span-6">
        <h2>Winner · {winner().mutations_count} mutated residues highlighted</h2>
        <ProteinViewer3D sequence={winner().sequence} parent={props.seed} factor={brief.target_factor} height={300} />
        <div class="muted" style="margin-top:6px">yellow spheres = positions of substitution vs seed</div>
      </div>

      {/* ── Scientific specification ── */}
      <Show when={spec()} fallback={<div class="card span-12 muted">computing biochemistry…</div>}>
        <div class="card span-7">
          <h2>Physicochemical Properties</h2>
          <table class="spec-table">
            <tbody>
              <Row k="Length" v={`${spec()!.length} residues`} />
              <Row k="Molecular weight" v={`${spec()!.mw_da.toFixed(2)} Da · ${(spec()!.mw_da / 1000).toFixed(2)} kDa`} />
              <Row k="Theoretical pI" v={spec()!.pI.toFixed(3)} />
              <Row k="Net charge at pH 7" v={spec()!.charge_pH7.toFixed(2)} />
              <Row k="Mean Kyte-Doolittle hydropathy" v={spec()!.avg_hydropathy.toFixed(3)} />
              <Row k="Predicted melting Tm" v={`${spec()!.predictions.melting_temp_c.toFixed(1)} °C`} />
              <Row k="Predicted t½ · mammalian reticulocyte" v={`${spec()!.predictions.half_life_mammalian_h.toFixed(1)} h`} />
              <Row k="Predicted t½ · E. coli" v={`${spec()!.predictions.half_life_ecoli_min.toFixed(1)} min`} />
              <Row k="DNA binding Kd (canonical motif)" v={`${spec()!.predictions.dna_binding_kd_nM.toFixed(2)} nM`} />
              <Row k="Aggregation propensity" v={fmtRisk(spec()!.predictions.aggregation_propensity)} />
              <Row k="Intrinsic disorder fraction" v={spec()!.predictions.intrinsic_disorder.toFixed(3)} />
              <Row k="Off-target risk" v={fmtRisk(spec()!.predictions.off_target_risk)} />
              <Row k="Immunogenicity risk" v={fmtRisk(spec()!.predictions.immunogenicity_risk)} />
            </tbody>
          </table>
        </div>

        <div class="card span-5">
          <h2>Secondary Structure (predicted)</h2>
          <div class="ss-bar">
            <div class="ss-seg ss-helix" style={`width:${spec()!.secondary_structure.helix_pct}%`} title={`α-helix ${spec()!.secondary_structure.helix_pct}%`}>α-helix {spec()!.secondary_structure.helix_pct.toFixed(0)}%</div>
            <div class="ss-seg ss-sheet" style={`width:${spec()!.secondary_structure.sheet_pct}%`} title={`β-sheet ${spec()!.secondary_structure.sheet_pct}%`}>β-sheet {spec()!.secondary_structure.sheet_pct.toFixed(0)}%</div>
            <div class="ss-seg ss-coil" style={`width:${spec()!.secondary_structure.coil_pct}%`} title={`coil ${spec()!.secondary_structure.coil_pct}%`}>coil {spec()!.secondary_structure.coil_pct.toFixed(0)}%</div>
          </div>

          <h2 style="margin-top:18px">Domain Organisation</h2>
          <table>
            <thead><tr><th>name</th><th>span</th><th>role</th><th>cov</th></tr></thead>
            <tbody>
              <For each={spec()!.domains}>
                {(d) => (
                  <tr>
                    <td>{d.name}</td>
                    <td class="mono">{d.start}–{d.end}</td>
                    <td class="muted">{d.role}</td>
                    <td>{d.coverage_pct}%</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <h2 style="margin-top:18px">Hydropathy Profile</h2>
          <HydroProfile profile={spec()!.hydropathy_profile} />
        </div>
      </Show>

      {/* ── Composition + Mutations vs seed ── */}
      <Show when={spec() && seedSpec()}>
        <div class="card span-6">
          <h2>Amino-acid Composition (winner vs seed)</h2>
          <CompositionTable winner={spec()!.composition} seed={seedSpec()!.composition} />
        </div>
        <div class="card span-6">
          <h2>Substitutions vs Seed · HGVS-style notation</h2>
          <Show when={winner().mutations.length > 0} fallback={<div class="muted">no substitutions (identical to seed)</div>}>
            <div class="mutation-grid">
              <For each={winner().mutations}>
                {(m) => (
                  <div class="mutation-chip">
                    <span class="mut-from">{m.from}</span>
                    <span class="mut-pos">{m.position}</span>
                    <span class="mut-to">{m.to}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      {/* ── Brief compliance ── */}
      <Show when={compliance()}>
        <div class="card span-12">
          <h2>Brief Compliance · {compliance()!.passed}/{compliance()!.total} rules satisfied</h2>
          <div class="compliance-grid">
            <For each={compliance()!.checks}>
              {(c) => (
                <div class={`compliance-row ${c.passed ? "ok" : "bad"}`}>
                  <span class={`pill ${c.passed ? "" : "warn"}`}>{c.passed ? "PASS" : "FAIL"}</span>
                  <span class="comp-rule">{c.rule}</span>
                  <span class="muted comp-detail">{c.detail}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* ── FASTA download ── */}
      <div class="card span-12">
        <div class="row" style="justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
          <div>
            <h2 style="margin-bottom:4px">Export</h2>
            <div class="muted">FASTA for ordering, JSON for pipelines, signed receipt for the ledger.</div>
          </div>
          <div class="row" style="gap:8px">
            <button class="btn-ghost" onClick={() => downloadFasta(winner().name, winner().sequence)}>FASTA</button>
            <button class="btn-ghost" onClick={() => downloadJson(`${winner().name}.json`, { winner: winner(), spec: spec(), brief, compliance: compliance() })}>JSON</button>
            <button class="btn-ghost" onClick={() => copyHGVS(winner().sequence, props.seed, brief.target_factor)}>Copy HGVS list</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi(props: { v: string; l: string; accent?: boolean }) {
  return (
    <div class={`kpi ${props.accent ? "kpi-accent" : ""}`}>
      <div class="v">{props.v}</div>
      <div class="l">{props.l}</div>
    </div>
  );
}

function Row(props: { k: string; v: string }) {
  return (
    <tr>
      <td class="spec-k">{props.k}</td>
      <td class="spec-v">{props.v}</td>
    </tr>
  );
}

function HydroProfile(props: { profile: number[] }) {
  const W = 360, H = 70, PAD = 6;
  const min = -4.5, max = 4.5;
  const pts = props.profile
    .map((v, i) => {
      const x = PAD + (i / Math.max(props.profile.length - 1, 1)) * (W - 2 * PAD);
      const y = H - PAD - ((v - min) / (max - min)) * (H - 2 * PAD);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="hydro-profile">
      <line x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} stroke="rgba(154,163,196,0.18)" stroke-dasharray="2 3" />
      <polyline points={pts} fill="none" stroke="var(--accent-2)" stroke-width="1.6" />
    </svg>
  );
}

function CompositionTable(props: { winner: Record<string, number>; seed: Record<string, number> }) {
  const aas = Object.keys(props.winner).sort();
  return (
    <div class="comp-grid">
      <For each={aas}>
        {(aa) => {
          const w = props.winner[aa] ?? 0;
          const s = props.seed[aa] ?? 0;
          const diff = w - s;
          return (
            <div class={`comp-cell ${diff !== 0 ? "comp-diff" : ""}`}>
              <span class="comp-aa">{aa}</span>
              <span class="comp-w">{w}</span>
              <span class={`comp-diff-val ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`}>
                {diff > 0 ? `+${diff}` : (diff < 0 ? String(diff) : "·")}
              </span>
            </div>
          );
        }}
      </For>
    </div>
  );
}

function fmtRisk(v: number): string {
  const label = v < 0.25 ? "low" : v < 0.5 ? "moderate" : v < 0.75 ? "elevated" : "high";
  return `${v.toFixed(3)} (${label})`;
}

function fmtNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function downloadFasta(name: string, seq: string): void {
  const lines = [`>${name} | protein-engine winner | ${seq.length} aa`];
  for (let i = 0; i < seq.length; i += 60) lines.push(seq.slice(i, i + 60));
  triggerDownload(`${name}.fasta`, lines.join("\n"), "text/x-fasta");
}

function downloadJson(name: string, payload: unknown): void {
  triggerDownload(name, JSON.stringify(payload, null, 2), "application/json");
}

function triggerDownload(name: string, body: string, mime: string): void {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function copyHGVS(child: string, parent: string, _factor: string): void {
  const out: string[] = [];
  const n = Math.min(child.length, parent.length);
  for (let i = 0; i < n; i++) if (child[i] !== parent[i]) out.push(`p.${parent[i]}${i + 1}${child[i]}`);
  navigator.clipboard?.writeText(out.join(";"));
}
