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

  it('threads { entity, entityId } into the payload while keeping actingUserId undefined', () => {
    const s = makeSupervisor();
    put(s, 'sub', 'active', ['reservation:created'], ['events:subscribe']);
    const calls: Array<[string, string, Record<string, unknown>, { actingUserId?: number }]> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = (id: string, method: string, params: Record<string, unknown>, opts: any) => { calls.push([id, method, params, opts]); return Promise.resolve(); };

    s.deliverEvent(7, 'reservation:created', { entity: 'reservation', entityId: 40 });
    expect(calls[0][2]).toEqual({ event: 'reservation:created', tripId: 7, entity: 'reservation', entityId: 40 });
    // the no-user invariant: an enriched event still carries NO acting user
    expect(calls[0][3].actingUserId).toBeUndefined();
  });

  it('delivers the snapshot ONLY to plugins holding the family read grant', () => {
    const s = makeSupervisor();
    put(s, 'canread', 'active', ['*'], ['events:subscribe', 'db:read:trips']);
    put(s, 'noread', 'active', ['*'], ['events:subscribe']);
    put(s, 'wronggrant', 'active', ['*'], ['events:subscribe', 'db:read:costs']);
    const calls: Array<[string, Record<string, unknown>]> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = (id: string, _m: string, params: Record<string, unknown>) => { calls.push([id, params]); return Promise.resolve(); };

    const snapshot = { id: 3, trip_id: 7, day_number: 1, title: 'Kyoto' };
    s.deliverEvent(7, 'day:updated', { entity: 'day', entityId: 3, snapshot });
    const byId = Object.fromEntries(calls);
    // day rides on db:read:trips — only 'canread' sees the fields
    expect(byId.canread.snapshot).toEqual(snapshot);
    expect(byId.noread.snapshot).toBeUndefined();
    expect(byId.wronggrant.snapshot).toBeUndefined();
    // the hint itself still reaches everyone subscribed
    expect(byId.noread).toMatchObject({ event: 'day:updated', tripId: 7, entity: 'day', entityId: 3 });
  });

  it('maps budget snapshots to db:read:costs, not the trip grant', () => {
    const s = makeSupervisor();
    put(s, 'costs', 'active', ['*'], ['events:subscribe', 'db:read:costs']);
    put(s, 'trips', 'active', ['*'], ['events:subscribe', 'db:read:trips']);
    const calls: Array<[string, Record<string, unknown>]> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s as any).invoke = (id: string, _m: string, params: Record<string, unknown>) => { calls.push([id, params]); return Promise.resolve(); };

    s.deliverEvent(7, 'budget:created', { entity: 'budget', entityId: 8, snapshot: { id: 8, name: 'Hotel' } });
    const byId = Object.fromEntries(calls);
    expect(byId.costs.snapshot).toEqual({ id: 8, name: 'Hotel' });
    expect(byId.trips.snapshot).toBeUndefined();
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

  it('derives { entity, entityId, snapshot } for the sink from the broadcast payload', () => {
    const seen: Array<{ tripId: number; event: string; meta: unknown }> = [];
    setPluginEventSink((tripId, event, meta) => seen.push({ tripId, event, meta }));
    broadcast(42, 'reservation:updated', { reservation: { id: 40, title: 'Flight', status: 'confirmed' } });
    expect(seen).toEqual([{
      tripId: 42,
      event: 'reservation:updated',
      meta: { entity: 'reservation', entityId: 40, snapshot: { id: 40, title: 'Flight', status: 'confirmed' } },
    }]);
  });
});
