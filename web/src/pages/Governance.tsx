import { PolicyPanel } from "../components/PolicyPanel";
import { AuditTrail } from "../components/AuditTrail";
import { SegmentExplorer } from "../components/SegmentExplorer";
import { RvfInspector } from "../components/RvfInspector";

export function GovernancePage() {
  return (
    <section class="grid">
      <div class="card span-12 hero">
        <div>
          <div class="hero-title">Governance & RVF Audit</div>
          <div class="hero-sub">
            Active policies from pe-governance, the audit trail of decisions, and the RVF segment explorer
            for inspecting any artifact's contents.
          </div>
        </div>
        <div class="hero-meta">
          <span class="badge">pe-governance</span>
          <span class="badge">pe-rvf · 15 segments</span>
        </div>
      </div>

      <PolicyPanel />
      <AuditTrail />
      <SegmentExplorer />
      <RvfInspector />
    </section>
  );
}
