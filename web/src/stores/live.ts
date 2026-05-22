import { createStore } from "solid-js/store";

export interface LiveEvent {
  ts: number;
  topic: string;
  label: string;
}

export interface LiveState {
  events: LiveEvent[];
}

export const [live, setLive] = createStore<LiveState>({ events: [] });

export function pushLive(e: LiveEvent): void {
  setLive("events", (cur) => {
    const next = [...cur, e];
    return next.length > 80 ? next.slice(-80) : next;
  });
}
