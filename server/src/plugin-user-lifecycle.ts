// A tiny, dependency-free relay so the core account-deletion path can notify the
// plugin runtime that a user was erased — without the auth/admin services (plain
// modules) importing the NestJS plugins layer. Mirrors plugin-event-sink.ts: the
// runtime registers the sink in onModuleInit; the core services call
// emitUserDeleted AFTER the user row is gone. Best-effort + never throws by design
// (the plugin side persists the erasure so nothing is lost if the sink is absent
// or the runtime is mid-boot).

let sink: ((userId: number) => void) | null = null;

export function setUserDeletedSink(fn: ((userId: number) => void) | null): void {
  sink = fn;
}

/** Announce that a TREK account was fully deleted. Called by the core deletion
 * paths after deleteUserCompletely so plugins can erase their own per-user data.
 * Swallows everything: a plugin bookkeeping error must never fail the deletion. */
export function emitUserDeleted(userId: number): void {
  if (!sink) return;
  try {
    sink(userId);
  } catch {
    /* the erasure is enqueued transactionally on the plugin side; a sink hiccup
       is non-fatal and the next runtime boot reconciles from the queue */
  }
}
