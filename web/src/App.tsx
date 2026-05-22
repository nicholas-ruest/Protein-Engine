import { createSignal, onMount, Show } from "solid-js";
import { Router, route, navigate, type RouteId } from "./router";
import { WorkbenchPage } from "./pages/Workbench";
import { EvolvePage } from "./pages/Evolve";
import { EmbeddingPage } from "./pages/Embedding";
import { QuantumPage } from "./pages/Quantum";
import { LineagePage } from "./pages/Lineage";
import { GovernancePage } from "./pages/Governance";
import { useEngine } from "./stores/engine";
import { session, setSession } from "./stores/session";

const TABS: Array<{ id: RouteId; label: string; sub: string }> = [
  { id: "workbench", label: "Workbench", sub: "Yamanaka factors" },
  { id: "evolve", label: "Evolve", sub: "directed evolution" },
  { id: "embedding", label: "Embedding", sub: "ESM-2 · HNSW" },
  { id: "quantum", label: "Quantum", sub: "VQE" },
  { id: "lineage", label: "Lineage", sub: "witness chain" },
  { id: "governance", label: "Governance", sub: "policies · RVF" },
];

// One-line, single-label tabs; sub-text shown only as tooltip on hover.

export function App() {
  const engine = useEngine();
  const [bootError, setBootError] = createSignal<string | null>(null);

  onMount(() => {
    setSession("mode", engine.mode);
    engine.subscribe((e) => {
      if (e.kind === "transport.error") setBootError(e.message);
    });
  });

  return (
    <>
      <header class="topbar">
        <div class="brand">
          <div class="logo" />
          <div>
            <h1>Protein-Engine</h1>
            <small>directed-evolution platform · v0.1.0</small>
          </div>
        </div>
        <nav class="tabs">
          {TABS.map((t) => (
            <button
              class={`tab ${route() === t.id ? "active" : ""}`}
              onClick={() => navigate(t.id)}
              title={t.sub}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div class="badges">
          <span class={`badge mode mode-${session.mode}`}>
            <span class="dot" /> {session.mode}
          </span>
        </div>
      </header>
      <main>
        <Show when={bootError()}>
          <div class="card span-12 pill warn">{bootError()}</div>
        </Show>
        <Router>
          {(r) => {
            switch (r) {
              case "workbench": return <WorkbenchPage />;
              case "evolve": return <EvolvePage />;
              case "embedding": return <EmbeddingPage />;
              case "quantum": return <QuantumPage />;
              case "lineage": return <LineagePage />;
              case "governance": return <GovernancePage />;
            }
          }}
        </Router>
      </main>
      <div class="footer">© Protein-Engine · {session.mode} runtime · ledger-verified · 2026</div>
    </>
  );
}
