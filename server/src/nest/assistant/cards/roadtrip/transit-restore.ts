import { recordOf } from '../card-values';

/**
 * Gives an applied create_transit_journey back the itinerary the search found.
 * The model never sees a connection's line on the map (`geometry` and
 * `geometryPrecision` are dropped from every answer it gets), yet the tool
 * requires both on every leg, so the itinerary it passes on would be refused.
 *
 * The itineraries transit searches answered with are kept per user and trip,
 * across turns, as the provider gave them: "show me trains" and "add the
 * 08:04" are often two messages. The held call keeps the model's copy, so the
 * thread never stores or replays a line; the matching itinerary is put in
 * place of it only when the change is applied. When nothing kept matches (the
 * server restarted, the connection was found long ago), one search for the
 * same two places at the connection's own departure finds it again.
 */

export const TRANSIT_SEARCH_TOOL = 'search_transit_routes';
export const TRANSIT_CREATE_TOOL = 'create_transit_journey';

/** The itineraries one user and trip keep at most; a search answers with a handful. */
const MAX_KEPT = 50;
/** The users and trips kept at most; the longest unused goes first. */
const MAX_SHELVES = 200;
/** How long a found itinerary is kept: a connection found yesterday is searched again. */
const KEPT_MS = 6 * 60 * 60 * 1000;

/** An instant as one spelling: `+02:00` and `Z` name the same moment. */
function instantOf(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const at = Date.parse(value);
  return Number.isFinite(at) ? at : null;
}

/** Drops the entry set longest ago: a map keeps its keys in the order they were set. */
function dropOldest<V>(map: Map<string, V>): void {
  const oldest = map.keys().next();
  if (oldest.done !== true) map.delete(oldest.value);
}

/** What tells one connection from another: its two instants and the lines of its legs, in order. */
export function itineraryKey(raw: unknown): string | null {
  const itinerary = recordOf(raw);
  const start = instantOf(itinerary.startTime);
  const end = instantOf(itinerary.endTime);
  if (start === null || end === null || !Array.isArray(itinerary.legs)) return null;
  const lines = itinerary.legs.map((leg: unknown) => {
    const line = recordOf(leg).line;
    return typeof line === 'string' ? line : '';
  });
  return `${start}|${end}|${lines.length}|${lines.join(',')}`;
}

/** The itineraries one user's transit searches on one trip answered with, each for a while. */
export class KeptItineraries {
  private readonly byKey = new Map<string, { itinerary: unknown; at: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Keeps the itineraries a transit search answered with; the oldest give way past the cap. */
  keep(value: unknown): void {
    const itineraries = recordOf(value).itineraries;
    if (!Array.isArray(itineraries)) return;
    for (const itinerary of itineraries) {
      const key = itineraryKey(itinerary);
      if (key === null) continue;
      this.byKey.delete(key);
      this.byKey.set(key, { itinerary, at: this.now() });
      if (this.byKey.size > MAX_KEPT) dropOldest(this.byKey);
    }
  }

  /** The kept itinerary under this key, while it is fresh. */
  find(key: string): unknown {
    const kept = this.byKey.get(key);
    if (!kept) return undefined;
    if (this.now() - kept.at > KEPT_MS) {
      this.byKey.delete(key);
      return undefined;
    }
    return kept.itinerary;
  }
}

/** The kept itineraries of every user and trip, the longest unused dropped past the cap. */
export class ItineraryShelves {
  private readonly shelves = new Map<string, KeptItineraries>();

  constructor(private readonly now: () => number = Date.now) {}

  of(userId: number, tripId: number): KeptItineraries {
    const key = `${userId}:${tripId}`;
    const shelf = this.shelves.get(key) ?? new KeptItineraries(this.now);
    this.shelves.delete(key);
    this.shelves.set(key, shelf);
    if (this.shelves.size > MAX_SHELVES) dropOldest(this.shelves);
    return shelf;
  }
}

/** The arguments with the kept itinerary in place of the model's copy; the same object when none matches. */
export function restoreItinerary(kept: KeptItineraries, args: Record<string, unknown>): Record<string, unknown> {
  const key = itineraryKey(args.itinerary);
  const found = key === null ? undefined : kept.find(key);
  return found === undefined ? args : { ...args, itinerary: found };
}

/** The search that finds the call's connection again: its two places, from its own departure; null without them. */
export function searchAgainArgs(args: Record<string, unknown>): Record<string, unknown> | null {
  const startTime = recordOf(args.itinerary).startTime;
  if (typeof startTime !== 'string' || instantOf(startTime) === null) return null;
  if (!args.from || typeof args.from !== 'object' || !args.to || typeof args.to !== 'object') return null;
  return { from: args.from, to: args.to, time: startTime };
}
