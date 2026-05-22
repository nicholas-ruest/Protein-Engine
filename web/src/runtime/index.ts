// Framework boundary — every Solid import in app code goes through here so a
// future port to another framework has exactly one entry point (see ADR-011).
export {
  createSignal,
  createMemo,
  createEffect,
  createResource,
  onCleanup,
  onMount,
  For,
  Show,
  Switch,
  Match,
  Suspense,
  ErrorBoundary,
  batch,
} from "solid-js";
export type { Component, JSX, Accessor, Setter, Resource } from "solid-js";
export { createStore, produce, reconcile } from "solid-js/store";
export type { Store, SetStoreFunction } from "solid-js/store";
export { render } from "solid-js/web";
