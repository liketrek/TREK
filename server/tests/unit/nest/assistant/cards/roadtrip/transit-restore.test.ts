/**
 * An applied create_transit_journey gets back the itinerary its search found:
 * the model never sees a connection's line, yet the tool needs it on every
 * leg. The searches' itineraries are kept per user and trip across turns, the
 * held call keeps the model's copy (so the thread never stores a line), and
 * the matching itinerary goes in when the change is applied. One no longer
 * kept is searched for again.
 */
import { AssistantToolSession } from '../../../../../../src/nest/assistant/assistant-tools.service';
import {
  ItineraryShelves,
  itineraryKey,
  KeptItineraries,
  restoreItinerary,
  searchAgainArgs,
} from '../../../../../../src/nest/assistant/cards/roadtrip/transit-restore';

import { describe, expect, it, vi } from 'vitest';

const leg = (line: string | null, geometry: string | null) => ({
  mode: line ? 'RAIL' : 'WALK',
  line,
  geometry,
  geometryPrecision: 5,
});
const raw = (start: string, lines: (string | null)[]) => ({
  startTime: start,
  endTime: '2026-10-01T08:41:00+02:00',
  legs: lines.map((line) => leg(line, `poly-${line ?? 'walk'}`)),
});
/** The itinerary as the model passes it on: the same, without the line on the map. */
const told = (start: string, lines: (string | null)[], end = '2026-10-01T08:41:00+02:00') => ({
  startTime: start,
  endTime: end,
  legs: lines.map((line) => ({ mode: line ? 'RAIL' : 'WALK', line })),
});
const from = { lat: 48.14, lng: 11.56, name: 'München Hbf' };
const to = { lat: 48.37, lng: 10.89, name: 'Augsburg Hbf' };

type CallTool = (request: { name: string; arguments: Record<string, unknown> }) => Promise<unknown>;

const BOTH = ['search_transit_routes', 'create_transit_journey'];

/** A session over a client that answers every search with `found` and every other call with `{ ok: true }`. */
function sessionWith(found: unknown, kept: KeptItineraries, names = BOTH) {
  const callTool = vi.fn<CallTool>(async ({ name }) => ({
    content: [{ type: 'text', text: JSON.stringify(name === 'search_transit_routes' ? found : { ok: true }) }],
  }));
  const tool = (name: string) => ({
    name,
    description: '',
    inputSchema: { type: 'object', properties: {} },
    kind: name.startsWith('search') ? 'read' : 'write',
    pinned: false,
    hint: { destructive: false, creates: false, group: 'roadtrip' },
  });
  const tools = new Map(names.map((name) => [name, tool(name)]));
  const client = { callTool };
  const audit = () => undefined;
  const session = new AssistantToolSession(client as never, {} as never, tools as never, 1, audit, 'turn', kept);
  return { session, callTool };
}

describe('transit itinerary restore', () => {
  it('ASTRT-040: tells connections apart by their instants and the lines of their legs', () => {
    const at = Date.parse('2026-10-01T06:04:00Z');
    const until = Date.parse('2026-10-01T06:41:00Z');
    expect(itineraryKey(raw('2026-10-01T08:04:00+02:00', [null, 'RE 4']))).toBe(`${at}|${until}|2|,RE 4`);
    expect(itineraryKey(told('2026-10-01T06:04:00Z', [null, 'RE 4'], '2026-10-01T06:41:00.000Z'))).toBe(
      itineraryKey(raw('2026-10-01T08:04:00+02:00', [null, 'RE 4'])),
    );
    expect(itineraryKey({ startTime: 'x' })).toBeNull();
    expect(itineraryKey({ startTime: 'not a time', endTime: 'nor this', legs: [] })).toBeNull();
  });

  it('ASTRT-041: puts the search answer in place of the model copy, and leaves an unknown one alone', () => {
    const kept = new KeptItineraries();
    kept.keep({ itineraries: [raw('2026-10-01T08:04:00+02:00', ['RE 4']), 'broken'], dropped: 0 });
    kept.keep('Too many transit requests.');
    const args = { dayId: 3, itinerary: told('2026-10-01T06:04:00Z', ['RE 4']) };
    expect(restoreItinerary(kept, args)).toEqual({ dayId: 3, itinerary: raw('2026-10-01T08:04:00+02:00', ['RE 4']) });
    const other = { dayId: 3, itinerary: told('2026-10-01T09:04:00+02:00', ['RE 4']) };
    expect(restoreItinerary(kept, other)).toBe(other);
  });

  it('ASTRT-042: a search in one turn restores the journey applied in the next, held without a line', async () => {
    const shelves = new ItineraryShelves();
    const found = { itineraries: [raw('2026-10-01T08:04:00+02:00', ['RE 4'])], dropped: 0 };
    const first = sessionWith(found, shelves.of(7, 1));
    await first.session.call('search_transit_routes', { from, to });

    const held = { dayId: 3, from, to, itinerary: told('2026-10-01T08:04:00+02:00', ['RE 4']) };
    const next = sessionWith(found, shelves.of(7, 1));
    expect(next.session.pinArgs('create_transit_journey', held)).toEqual({ args: held });
    expect(JSON.stringify(next.session.pinArgs('create_transit_journey', held))).not.toMatch(/geometry/);
    await next.session.call('create_transit_journey', held);
    expect(next.callTool).toHaveBeenCalledTimes(1);
    expect(next.callTool.mock.calls[0][0]).toEqual({
      name: 'create_transit_journey',
      arguments: { ...held, itinerary: raw('2026-10-01T08:04:00+02:00', ['RE 4']) },
    });
  });

  it('ASTRT-043: a connection no longer kept is searched for again from its own departure', async () => {
    const found = { itineraries: [raw('2026-10-01T08:04:00+02:00', ['RE 4'])], dropped: 0 };
    const { session, callTool } = sessionWith(found, new KeptItineraries());
    const held = { dayId: 3, from, to, itinerary: told('2026-10-01T08:04:00+02:00', ['RE 4']) };
    await session.call('create_transit_journey', held);
    expect(callTool.mock.calls.map(([request]) => request.name)).toEqual([
      'search_transit_routes',
      'create_transit_journey',
    ]);
    expect(callTool.mock.calls[0][0].arguments).toEqual({ from, to, time: '2026-10-01T08:04:00+02:00' });
    expect(callTool.mock.calls[1][0].arguments.itinerary).toEqual(raw('2026-10-01T08:04:00+02:00', ['RE 4']));

    const without = sessionWith(found, new KeptItineraries(), ['create_transit_journey']);
    await without.session.call('create_transit_journey', held);
    expect(without.callTool.mock.calls.map(([request]) => request.arguments)).toEqual([held]);
    expect(searchAgainArgs({ itinerary: told('soon', []), from, to })).toBeNull();
    expect(searchAgainArgs({ itinerary: told('2026-10-01T08:04:00+02:00', []), from })).toBeNull();
  });

  it('ASTRT-044: keeps itineraries per user and trip, for six hours, the newest fifty of them', () => {
    let now = 0;
    const shelves = new ItineraryShelves(() => now);
    const one = raw('2026-10-01T08:04:00+02:00', ['RE 4']);
    const key = itineraryKey(one) as string;
    shelves.of(7, 1).keep({ itineraries: [one] });
    expect(shelves.of(7, 1).find(key)).toEqual(one);
    expect(shelves.of(7, 2).find(key)).toBeUndefined();
    expect(shelves.of(8, 1).find(key)).toBeUndefined();
    now = 6 * 60 * 60 * 1000 + 1;
    expect(shelves.of(7, 1).find(key)).toBeUndefined();

    const kept = new KeptItineraries(() => now);
    const many = Array.from({ length: 51 }, (_, index) =>
      raw(`2026-10-01T08:${String(index).padStart(2, '0')}:00+02:00`, ['RE 4']),
    );
    kept.keep({ itineraries: many });
    expect(kept.find(itineraryKey(many[0]) as string)).toBeUndefined();
    expect(kept.find(itineraryKey(many[50]) as string)).toEqual(many[50]);
  });
});
