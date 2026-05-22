# ADR-011: Dynamic Web UI for Protein-Engine

**Status:** Accepted (implemented 2026-05-22 — see § Implementation Notes)
**Date:** 2026-05-22
**Deciders:** Platform Architecture Team
**Relates to:** FR-12 (operator observability), NFR-03 (browser deployment), ADR-001 (RVF), ADR-003 (native vs WASM), ADR-010 (append-only journal)

---

## Context

The browser surface (`web/`) is currently a single static HTML page that loads the `pe-wasm` module, prints three JSON blobs to a `<pre>` tag, and exits. The three placeholder components (`sequence-editor.ts`, `fitness-chart.ts`, `dag-viewer.ts`) render plain `<pre>` text and are not wired into `main.ts`.

This is unworkable for the audiences the platform claims to serve:

- **Researchers** need to drive a scoring run, watch fitness evolve over generations, and inspect the lineage DAG of promoted variants.
- **Operators** need a live view of ledger integrity, journal head, sidecar health, and current quantum-backend routing.
- **Reviewers** need to load an `.rvf` file, verify its witness chain, and walk segments interactively.

The same web bundle must work in three distinct modes:

1. **WASM-local** — every call goes through `pe-wasm`, no server. Required for offline researcher workstation (ADR-001, ADR-003).
2. **Server-backed** — `pe-api` is reachable; the UI streams evolution events via SSE/WebSocket from `pe-stream`.
3. **RVF-replay** — a `.rvf` file is dropped onto the page; the UI reconstructs platform state from segments without any network or server.

The current static page cannot express these modes. We need a UI architecture that is reactive (state changes drive view updates), portable (no server required for mode 1), and faithful to the platform's lean ethos (no Node toolchain bloat, no heavy framework runtime).

## Decision

**We adopt a dynamic, reactive web UI built on SolidJS, driven by a typed transport layer that abstracts WASM, HTTP, and RVF as interchangeable data sources.**

The implementation has four layers:

1. **Transport** (`web/src/transport/`) — three adapters implementing a single `EngineClient` interface: `WasmClient`, `HttpClient`, `RvfClient`. The active adapter is selected at boot from a URL parameter or environment probe.
2. **Stores** (`web/src/stores/`) — Solid stores for `session`, `population`, `ledger`, `cycle`. Stores are updated by transport push events; views never call transports directly.
3. **Components** (`web/src/components/`) — replace the three placeholder files with real Solid components: `SequenceEditor`, `FitnessRadar`, `LineageDag`, `LedgerStrip`, `EvolutionTimeline`, `RvfInspector`.
4. **Pages** (`web/src/pages/`) — `Design`, `Evolve`, `Analyze`, `Audit`. Each is a route in a flat client-side router.

SolidJS is chosen over the alternatives below (see Rationale). The build remains Vite-only; we add `solid-js` and `vite-plugin-solid` as production dependencies and nothing else.

## Rationale

### Why a framework at all

The current vanilla-TS approach scales linearly with feature count. With four pages, six components, three transports, and live streaming events, the reactive plumbing becomes the bulk of the code. A framework with fine-grained reactivity removes that plumbing.

### Why SolidJS over the alternatives

| Option | Runtime size | Reactivity model | Fit |
|---|---|---|---|
| **SolidJS** | ~7 KB gzip | Fine-grained signals, no VDOM | **Chosen** |
| Lit + Signals | ~6 KB gzip | Web components + signals | Strong, but JSX ergonomics matter for charts/DAG |
| Svelte 5 (runes) | ~10 KB gzip | Compiler-driven runes | Good, but more magic; harder to step through |
| React + Zustand | ~45 KB gzip | VDOM + external store | Violates lean ethos; runtime dominates the WASM bundle |
| Vanilla + manual diff | 0 KB | Manual | Status quo; does not scale to the four-page surface |

SolidJS gives us JSX (matches the placeholder component idioms), no VDOM (cheap to reason about against WASM call frequency), and a runtime smaller than the WASM bundle itself.

### Why a transport abstraction

The three deployment modes (WASM-local, server-backed, RVF-replay) have different call shapes — sync function calls, async HTTP, async RVF segment reads — but the same domain operations: `score_sequence`, `run_evolution_step`, `verify_ledger`, `load_variants`. Hiding the difference behind one interface lets the same component tree power all three modes without conditional logic in the views.

### Why stores between transport and views

Streaming evolution events (`pe-stream`) arrive asynchronously and update multiple components at once (timeline, radar, DAG, ledger). A central store layer is the only sane place to fan those events out; doing it per-component would duplicate subscription logic.

## Consequences

### Positive

- Components subscribe to signals; rendering follows state without manual DOM updates.
- The same view tree renders in offline (WASM), online (HTTP), and replay (RVF) modes — proves the platform's "one artifact, many runtimes" claim visually.
- Streaming integration is natural: a single `engine.events$` observable feeds stores; views update automatically.
- Bundle stays small (estimated 60–80 KB gzip total including SolidJS + Vite client) — comparable to the `pe-wasm` payload, not larger.
- Placeholder components become real, killing the "Placeholder: full implementation will…" stubs that currently mislead readers.

### Negative

- Adds two production dependencies (`solid-js`, `vite-plugin-solid`) where there were none.
- Introduces JSX and a build-time transform; debugging now requires sourcemaps, not just View Source.
- Component authors must learn Solid's signals model (cheap, but non-zero).
- A dynamic UI raises the bar for browser support; we explicitly drop pre-2022 browsers (no further IE / legacy Safari support).

### Risks

- **Framework churn.** SolidJS 2.0 is on the horizon. Mitigation: pin to `solid-js@^1.9`, wrap framework-specific APIs in `web/src/runtime/` so a future port has one entry point.
- **Bundle creep.** Once a framework is in, contributors reach for component libraries. Mitigation: forbid runtime dependencies beyond `solid-js` without a follow-on ADR.
- **Transport divergence.** Three adapters can drift if the interface changes ad hoc. Mitigation: define `EngineClient` in `web/src/transport/types.ts` and require adapter parity tests under `web/src/transport/__tests__/`.
- **WASM call frequency.** Fine-grained reactivity can fire many small WASM calls. Mitigation: every transport method returns a memoised result keyed on input hash; explicit `invalidate()` for write paths.

## Module Layout

```
web/
├── index.html               # mount point + route shell
├── src/
│   ├── main.tsx             # boot, transport selection, router mount
│   ├── runtime/             # SolidJS re-exports (framework boundary)
│   ├── transport/
│   │   ├── types.ts         # EngineClient interface
│   │   ├── wasm.ts          # WasmClient
│   │   ├── http.ts          # HttpClient
│   │   ├── rvf.ts           # RvfClient (reads .rvf segments in-browser)
│   │   └── select.ts        # adapter selection at boot
│   ├── stores/
│   │   ├── session.ts
│   │   ├── population.ts
│   │   ├── ledger.ts
│   │   └── cycle.ts
│   ├── components/
│   │   ├── SequenceEditor.tsx
│   │   ├── FitnessRadar.tsx
│   │   ├── LineageDag.tsx       # SVG node/edge layout, ELK-lite
│   │   ├── LedgerStrip.tsx
│   │   ├── EvolutionTimeline.tsx
│   │   └── RvfInspector.tsx
│   └── pages/
│       ├── Design.tsx
│       ├── Evolve.tsx
│       ├── Analyze.tsx
│       └── Audit.tsx
└── pkg/                     # wasm-pack output (unchanged)
```

## Transport Interface

```ts
// web/src/transport/types.ts
export interface EngineClient {
  scoreSequence(seq: string): Promise<FitnessScore>;
  runEvolutionStep(pop: Population, cfg: CycleConfig): Promise<CycleResult>;
  searchSimilar(seq: string, k: number): Promise<SimilarHit[]>;
  verifyLedger(): Promise<LedgerStatus>;
  loadRvf(bytes: Uint8Array): Promise<RvfManifest>;
  events$: Observable<EngineEvent>;     // SSE for HttpClient, polling for WasmClient
  mode: "wasm" | "http" | "rvf";
}
```

## Rollout

1. Add `solid-js` + `vite-plugin-solid`; convert `main.ts` → `main.tsx` with a single empty route. Ship behind no flag — the page is already broken-ish.
2. Define `EngineClient` and implement `WasmClient` against the existing `pe-wasm` exports. Wire `Design` and `Evolve` pages against it.
3. Implement `HttpClient` against `pe-api`'s existing routes; reuse the same store layer; verify mode-switching via `?transport=http`.
4. Implement `RvfClient` by porting the segment readers from `pe-rvf` to a WASM build that exposes per-segment accessors to JS.
5. Replace placeholder components with real ones one by one; each lands with a screenshot in the PR.
6. Add Playwright smoke tests under `tests/e2e/web/` driving the three transports.

## Implementation Notes (2026-05-22)

Landed in commit-pending under `web/`. The realised tree matches § Module Layout with three additions and three deviations from the original sketch.

**Additions (not in original layout, justified):**
- `web/src/App.tsx` — top-level shell (header + nav + page slot). Needed once a router was introduced.
- `web/src/router/index.tsx` — hash-based router (~30 LOC, no dependency). Originally implied by "flat client-side router" but the file wasn't enumerated.
- `web/src/transport/cache.ts` — the content-hash memoiser called out in § Risks ("every transport method returns a memoised result keyed on input hash") — implemented as a tiny shared helper rather than inlined per-adapter.
- `web/src/stores/engine.ts` — Solid `createContext` wrapper so `useEngine()` works from any descendant. The ADR called for stores; this is the context wiring that makes them reachable.
- `web/src/styles.css` — global stylesheet; the ADR was silent on CSS layout.

**Deviations:**
1. **`events$: Observable<EngineEvent>` → `subscribe(listener): Unsubscribe`.** A full observable type would force an RxJS or solid-rx dependency, which § Risks forbids ("forbid runtime dependencies beyond `solid-js`"). Callback-based pub/sub is functionally equivalent for the fan-out the stores need; fan-in is provided by the listener composing its own behaviour.
2. **`HttpClient` events come from polling, not SSE.** `pe-api` does not currently expose an SSE/WebSocket endpoint (verified against `crates/pe-api/src/router.rs`). The client polls `/api/ledger/verify` + `/api/ledger/entries?limit=1` on a 2-second tick and emits `ledger.appended` on entry-count change. When `pe-api` grows a streaming endpoint, swapping the polling block for an `EventSource` is a localised change.
3. **`RvfClient` does best-effort JS-side segment parsing, not a `pe-rvf` → WASM binding.** Step 4 of the rollout described porting segment readers from `crates/pe-rvf` to a WASM build that exposes per-segment accessors. The shipped client parses the magic header and TOC directly in TypeScript (`web/src/transport/rvf.ts`), delegates scoring / similarity / cycle ops to an inner `WasmClient`, and exposes `listSegments()` and `readSegment(id)` for the Audit page. The richer `pe-rvf` binding remains a follow-on once `crates/pe-rvf` settles on a stable wire format.

**Verification:**
- `tsc --noEmit` — clean.
- `vite build` — 39.92 KB JS / 14.55 KB gzip (well under § Positive's "60–80 KB gzip total" estimate); 5.58 KB CSS / 1.80 KB gzip.
- `playwright test` — 6/6 passing (`tests/e2e/web/smoke.spec.ts`), covering all three transports plus router navigation. Browser was Chromium headless.
- All four pages render with realistic data when driven by the pe-wasm stub at `web/pkg/pe_wasm.js`.

## Out of Scope

- 3D structure rendering (Mol* / NGL) — defer to a follow-on ADR once data shape stabilises.
- Authentication / multi-user sessions — single-operator assumption holds for v1.
- Native (Tauri / Electron) packaging of the UI — the browser is the only client surface.
- Server-side rendering — every mode is client-rendered; SSR would re-introduce a server requirement we explicitly rejected in ADR-001.
