import type { EngineClient, TransportMode } from "./types";
import { WasmClient } from "./wasm";
import { HttpClient } from "./http";
import { RvfClient } from "./rvf";

/**
 * Pick a transport at boot.
 *
 * Default is `wasm` — it works offline, has full method coverage, and is the
 * mode the demo / codespace previews assume.
 *
 * Explicit override via `?transport=wasm|http|rvf` is honoured. We intentionally
 * do NOT auto-probe `/api/health` — codespace HTTPS proxies often return a 200
 * for missing routes (an HTML 404 page), which caused the selector to pick
 * `http` and then crash on every domain method pe-api doesn't expose.
 */
export async function selectTransport(): Promise<EngineClient> {
  const url = new URL(window.location.href);
  const override = url.searchParams.get("transport") as TransportMode | null;
  if (override === "http") return new HttpClient();
  if (override === "rvf") return new RvfClient();
  return new WasmClient();
}
