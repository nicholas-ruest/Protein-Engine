import { WitnessChainDag } from "../components/WitnessChainDag";
import { LedgerStrip } from "../components/LedgerStrip";

export function LineagePage() {
  return (
    <section class="grid">
      <div class="card span-12 hero">
        <div>
          <div class="hero-title">Lineage & Witness Chain</div>
          <div class="hero-sub">
            Append-only journal from pe-ledger. Each entry carries its parent_hash, a witness signature from the
            QuDAG committee, and a TEE attestation (Intel SGX, AMD SEV, or Arm CCA).
          </div>
        </div>
        <div class="hero-meta">
          <span class="badge">pe-ledger</span>
          <span class="badge">QuDAG witness</span>
          <span class="badge">TEE attested</span>
        </div>
      </div>

      <LedgerStrip />
      <WitnessChainDag />
    </section>
  );
}
