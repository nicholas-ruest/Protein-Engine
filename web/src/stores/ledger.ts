import { createStore } from "solid-js/store";

export interface LedgerState {
  valid: boolean;
  head: string;
  entry_count: number;
  recent: Array<{ hash: string; ts: number; label: string }>;
}

export const [ledger, setLedger] = createStore<LedgerState>({
  valid: true,
  head: "—",
  entry_count: 0,
  recent: [],
});
