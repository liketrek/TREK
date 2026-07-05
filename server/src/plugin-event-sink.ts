// A tiny, dependency-free relay so the plugin runtime can receive core trip events
// without the websocket module (which pulls in `ws`) importing the plugins layer —
// and so tests that mock `./websocket` don't accidentally strip the sink. websocket
// calls emitPluginEvent for every CORE broadcast; the plugin runtime registers the
// sink in onModuleInit. Name-only + best-effort by design (see PluginSupervisor).
let sink: ((tripId: number, event: string) => void) | null = null;

export function setPluginEventSink(fn: ((tripId: number, event: string) => void) | null): void {
  sink = fn;
}

export function emitPluginEvent(tripId: number, event: string): void {
  if (!sink) return;
  try {
    sink(tripId, event);
  } catch {
    /* a plugin sink must never break a core broadcast */
  }
}
