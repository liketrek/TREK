/**
 * Core event subscriptions (#1429 eco). Two enforcement points:
 *   1. the websocket broadcast tap announces every CORE event (name only) to the
 *      sink, but never plugin:* re-broadcasts (loop guard);
 *   2. supervisor.deliverEvent only invokes plugins that are active, hold
 *      'events:subscribe', AND subscribed to the event (or '*').
 */
import { describe, it, expect, afterEach } from 'vitest';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import { broadcast } from '../../../src/websocket';
import { setPluginEventSink } from '../../../src/plugin-event-sink';

function makeSupervisor(): PluginSupervisor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PluginSupervisor((() => ({})) as any, {}, {});
}
function put(s: PluginSupervisor, id: string, status: string, events: string[], granted: string[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s as any).running.set(id, { id, status, hooks: [], events, granted: new Set(granted) });
}

describe('supervisor.deliverEvent gating', () => {
  it('invokes only active, granted, subscribed plugins (name + tripId only, fire-and-forget)', () => {
    const s = makeSupervisor();
    put(s, 'sub', 'active', ['place:created'], ['events:subscribe']);
    put(s, 'star', 'active', ['*'], ['events:subscribe']);
    put(s, 'nogrant', 'active', ['place:created'], ['db:own']);          // subscribed but no grant
    put(s, 'otherEvent', 'active', ['day:updated'], ['events:subscribe']); // different event
    put(s, 'notactive', 'starting', ['place:created'], ['events:subscribe']);
    const calls: Array<[string, string, Record<string, unknown>]> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = (id: string, method: string, params: Record<string, unknown>) => { calls.push([id, method, params]); return Promise.resolve(); };

    s.deliverEvent(7, 'place:created');
    expect(calls.map((c) => c[0]).sort()).toEqual(['star', 'sub']);
    expect(calls[0][1]).toBe('invoke.event');
    expect(calls.every((c) => c[2].event === 'place:created' && c[2].tripId === 7)).toBe(true);
  });
});

describe('websocket broadcast → plugin event sink', () => {
  afterEach(() => setPluginEventSink(null));

  it('announces core events by name, and never plugin:* re-broadcasts', () => {
    const seen: Array<[number, string]> = [];
    setPluginEventSink((tripId, event) => seen.push([tripId, event]));
    // fires even with no connected sockets (announced before the room check)
    broadcast(42, 'place:created', { place: { id: 1 } });
    broadcast(42, 'plugin:trip-doctor:rechecked', { count: 3 }); // must be skipped
    expect(seen).toEqual([[42, 'place:created']]);
  });
});
