// Tiny content-hash memoiser shared by transports. Keeps the WASM call rate
// bounded under fine-grained Solid reactivity (see ADR-011 risks).

type AsyncFn<A extends unknown[], R> = (...args: A) => Promise<R>;

function hashArgs(args: unknown[]): string {
  return JSON.stringify(args);
}

export function memoised<A extends unknown[], R>(
  fn: AsyncFn<A, R>,
  store: Map<string, Promise<R>>,
): AsyncFn<A, R> {
  return ((...args: A) => {
    const key = hashArgs(args);
    let hit = store.get(key);
    if (!hit) {
      hit = fn(...args);
      store.set(key, hit);
    }
    return hit;
  }) as AsyncFn<A, R>;
}
