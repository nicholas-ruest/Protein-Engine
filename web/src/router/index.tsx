import { createSignal, onCleanup, onMount, type JSX } from "solid-js";

export type RouteId = "workbench" | "evolve" | "embedding" | "quantum" | "lineage" | "governance";

const ROUTES: RouteId[] = ["workbench", "evolve", "embedding", "quantum", "lineage", "governance"];

function readHash(): RouteId {
  const h = window.location.hash.replace(/^#\/?/, "") as RouteId;
  return ROUTES.includes(h) ? h : "workbench";
}

const [route, setRoute] = createSignal<RouteId>(readHash());

export { route };

export function navigate(to: RouteId): void {
  window.location.hash = `#/${to}`;
}

export function Router(props: { children: (r: RouteId) => JSX.Element }): JSX.Element {
  const onHash = () => setRoute(readHash());
  onMount(() => window.addEventListener("hashchange", onHash));
  onCleanup(() => window.removeEventListener("hashchange", onHash));
  return <>{props.children(route())}</>;
}
