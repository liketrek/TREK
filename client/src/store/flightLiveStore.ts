import { flightLiveLegSchema, tripFlightLiveResponseSchema, type FlightLiveLeg } from '@trek/shared';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { flightLiveApi } from '../api/flightLive';
import { addListener, removeListener } from '../api/websocket';
import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * Live flight states per trip (GET /trips/:id/flights/live plus the
 * `flight:live` pushes). Kept apart from the trip store on purpose: it is
 * transient feed data with no offline copy, so it never goes through the
 * repo/Dexie layer, and an old state is worth nothing once the flight is over.
 */

interface TripFlightLive {
  enabled: boolean;
  attribution: string | null;
  /** By `legKey`. */
  legs: Record<string, FlightLiveLeg>;
}

interface FlightLiveState {
  trips: Record<number, TripFlightLive>;
  load: (tripId: number) => Promise<void>;
  merge: (tripId: number, legs: FlightLiveLeg[]) => void;
}

export const legKey = (reservationId: number, legIndex: number): string => `${reservationId}:${legIndex}`;

const byKey = (legs: FlightLiveLeg[]): Record<string, FlightLiveLeg> =>
  Object.fromEntries(legs.map((leg) => [legKey(leg.reservation_id, leg.leg_index), leg]));

/** The incoming legs, except where the one already held was fetched later. */
function newest(held: Record<string, FlightLiveLeg> | undefined, incoming: Record<string, FlightLiveLeg>) {
  if (!held) return incoming;
  const out: Record<string, FlightLiveLeg> = {};
  for (const [key, leg] of Object.entries(incoming)) {
    const mine = held[key];
    out[key] = mine && (mine.fetched_at ?? '') > (leg.fetched_at ?? '') ? mine : leg;
  }
  return out;
}

export const useFlightLiveStore = create<FlightLiveState>((set) => ({
  trips: {},

  load: async (tripId) => {
    if (!tripId || isEffectivelyOffline()) return;
    try {
      const parsed = tripFlightLiveResponseSchema.safeParse(await flightLiveApi.trip(tripId));
      // A server without the feature (older version) or a malformed answer leaves
      // the cards on their schedule-only look rather than breaking the sheet.
      if (!parsed.success) return;
      const { enabled, attribution, flights } = parsed.data;
      // A push that landed while this read was under way is newer than its answer and stays.
      set((state) => ({
        trips: {
          ...state.trips,
          [tripId]: { enabled, attribution, legs: newest(state.trips[tripId]?.legs, byKey(flights)) },
        },
      }));
    } catch {
      // Offline or the feed is down: the last known state stays, marked stale by its age.
    }
  },

  merge: (tripId, legs) =>
    set((state) => {
      const current = state.trips[tripId];
      if (!current) return state;
      return { trips: { ...state.trips, [tripId]: { ...current, legs: { ...current.legs, ...byKey(legs) } } } };
    }),
}));

/** The live state of one leg, or null while there is none. */
export function useFlightLiveLeg(tripId: number, reservationId: number, legIndex: number): FlightLiveLeg | null {
  return useFlightLiveStore((s) => s.trips[tripId]?.legs[legKey(reservationId, legIndex)] ?? null);
}

/** The live legs of one booking in leg order; empty while TREK follows none of them. */
export function useFlightLiveLegs(tripId: number, reservationId: number): FlightLiveLeg[] {
  return useFlightLiveStore(
    useShallow((s) =>
      Object.values(s.trips[tripId]?.legs ?? {})
        .filter((leg) => leg.reservation_id === reservationId)
        .sort((a, b) => a.leg_index - b.leg_index)
    )
  );
}

export function useFlightLiveAttribution(tripId: number): string | null {
  return useFlightLiveStore((s) => (s.trips[tripId]?.enabled ? s.trips[tripId].attribution : null));
}

/** Applies `flight:live` pushes for the given trip. Returns the function that stops listening. */
export function watchFlightLive(tripId: number): () => void {
  const onEvent = (event: Record<string, unknown>) => {
    if (event?.type !== 'flight:live' || Number(event.tripId) !== tripId || !Array.isArray(event.flights)) return;
    const legs = event.flights.flatMap((raw) => {
      const leg = flightLiveLegSchema.safeParse(raw);
      return leg.success ? [leg.data] : [];
    });
    if (legs.length > 0) useFlightLiveStore.getState().merge(tripId, legs);
  };
  addListener(onEvent);
  return () => removeListener(onEvent);
}
