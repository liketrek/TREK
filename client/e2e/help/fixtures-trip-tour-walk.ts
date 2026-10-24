import type { APIRequestContext } from '@playwright/test';
import { seededTrip } from './fixtures';
import { TOUR_NAMES, TOUR_TRIP } from './tour-fixtures';

/**
 * What the city walk pictures need beyond `ensureToursFixtures`: opening hours
 * on one stop of the Bolzano walk, so the walk's day shows what a stay that
 * runs past closing time looks like, and the Google Maps link the import
 * guide pastes. Nothing here is run by importing it.
 */

/**
 * The stop that gets opening hours, and the hours. The South Tyrol Museum of
 * Archaeology is open every day in July from ten to six; the walk starts at
 * 15:00 on day 1 and reaches it after the arcades and the market, so its
 * hour and a half runs past closing time.
 */
export const WALK_HOURS = { stop: 'South Tyrol Museum of Archaeology', hours: 'Mo-Su 10:00-18:00' } as const;

type Json = Record<string, unknown>;
type Point = [number, number, number | null];

async function body<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

/**
 * Give the museum stop of the Bolzano walk its opening hours, once. A walk's
 * stops only carry hours where they were found on OpenStreetMap, and the
 * fixture draws the walk by hand, so they are written here with a save of
 * the tour as it stands: the same line, the same stops, one field more. A
 * failure warns and leaves the walk as it was; the pictures then show the
 * arrivals without a warning.
 */
export async function ensureWalkHours(api: APIRequestContext): Promise<void> {
  try {
    const { trips } = await body<{ trips: { id: number; title: string }[] }>(await api.get('/api/trips'), 'trips');
    const tripId = trips.find((t) => t.title === TOUR_TRIP)?.id;
    if (!tripId) throw new Error(`no trip "${TOUR_TRIP}"`);
    const { tours } = await body<{ tours: { place_id: number; name: string }[] }>(
      await api.get(`/api/trips/${tripId}/tours`),
      'tours'
    );
    const placeId = tours.find((t) => t.name === TOUR_NAMES.cityWalk)?.place_id;
    if (!placeId) throw new Error(`no tour "${TOUR_NAMES.cityWalk}"`);
    const detail = await body<{ tour: Json; waypoints: Json[] }>(
      await api.get(`/api/trips/${tripId}/tours/${placeId}`),
      'the walk'
    );
    const museum = detail.waypoints.find((w) => w.name === WALK_HOURS.stop);
    if (!museum) throw new Error(`the walk has no stop "${WALK_HOURS.stop}"`);
    if (museum.opening_hours === WALK_HOURS.hours) return;

    const placesBody = await body<{ places?: Json[] } | Json[]>(await api.get(`/api/trips/${tripId}/places`), 'places');
    const place = (Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])).find((p) => p.id === placeId);
    const raw = place?.route_geometry;
    const line = (typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])) as Point[];
    if (line.length < 2 || line.some((p) => typeof p[2] !== 'number' || !Number.isFinite(p[2]))) {
      throw new Error('the walk has no line with heights to save again');
    }
    const tour = detail.tour;
    const minutes = typeof tour.duration === 'number' ? tour.duration : null;
    const res = await api.put(`/api/trips/${tripId}/tours/${placeId}`, {
      data: {
        name: tour.name,
        tour_type: 'walk',
        route_geometry: line,
        waypoints: detail.waypoints.map((w) => (w === museum ? { ...w, opening_hours: WALK_HOURS.hours } : w)),
        duration_seconds: minutes === null ? null : minutes * 60,
        break_additional_minutes: tour.break_additional_minutes ?? null,
        planned_duration_minutes: tour.planned_duration_minutes ?? null,
        description: tour.description ?? null,
        website: tour.website ?? null,
        expected_revision: tour.revision ?? null,
      },
    });
    if (!res.ok()) throw new Error(`save the walk: ${res.status()} ${await res.text()}`);
  } catch (err) {
    console.warn(
      `[walk-fixtures] the museum stop has no opening hours: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ── The Google Maps link ──────────────────────────────────────────────────────

/**
 * A walking route through Ortisei, in Val Gardena where the trip stays, in
 * the shape Google Maps shares one: the stops as path segments, then the
 * viewport, then the data blob with one block per stop holding its position
 * (`!2m2!1d<lng>!2d<lat>`) and `!3e2`, on foot. The server reads it without
 * asking Google (`directions-url.helpers.ts`), so the picture needs no
 * network for the preview. The place ids in the blocks are opaque to TREK.
 */
const ORTISEI_STOPS = [
  {
    name: 'Piazza S. Antonio, 39046 Ortisei BZ, Italy',
    lat: 46.57478,
    lng: 11.67228,
    cid: '0x4778f4c0d1a2b3c5:0x2f6a1e0b9c4d7e13',
  },
  {
    name: 'Museum Gherdëina, Strada Rezia 83, 39046 Ortisei BZ, Italy',
    lat: 46.57589,
    lng: 11.67428,
    cid: '0x4778f4c2a9e1d0b7:0x6b3c2d1e0f9a8b75',
  },
  {
    name: 'Chiesa parrocchiale di Sant’Ulrico, 39046 Ortisei BZ, Italy',
    lat: 46.57673,
    lng: 11.6708,
    cid: '0x4778f4bd6c5e4f31:0x1d9e8f7a6b5c4d29',
  },
  {
    name: 'Promenade Luis Trenker, 39046 Ortisei BZ, Italy',
    lat: 46.5741,
    lng: 11.6686,
    cid: '0x4778f4b9e8d7c6a3:0x7c6b5a4f3e2d1c08',
  },
] as const;

/** A path segment the way Google writes one: commas kept, spaces as plus signs. */
const segment = (name: string) => encodeURIComponent(name).replace(/%2C/g, ',').replace(/%20/g, '+');

function googleWalkLink(): string {
  const blocks = ORTISEI_STOPS.map((s) => `!1m5!1m1!1s${s.cid}!2m2!1d${s.lng}!2d${s.lat}`).join('');
  // The inner route message holds six tokens per stop and the mode; the outer one that and itself.
  const inner = ORTISEI_STOPS.length * 6 + 1;
  return (
    `https://www.google.com/maps/dir/${ORTISEI_STOPS.map((s) => segment(s.name)).join('/')}` +
    `/@46.5755,11.6715,17z/data=!4m${inner + 1}!4m${inner}${blocks}!3e2`
  );
}

export const GOOGLE_WALK = {
  link: googleWalkLink(),
  /** The first and the last stop as the preview names them. */
  first: ORTISEI_STOPS[0].name,
  last: ORTISEI_STOPS[ORTISEI_STOPS.length - 1].name,
  count: ORTISEI_STOPS.length,
} as const;

// ── Visits ────────────────────────────────────────────────────────────────────

/**
 * Take every stop of the Higashiyama walk on Japan day 9 back to planned,
 * so the check-off guide finds nothing marked and leaves nothing marked.
 */
export async function resetKyotoVisits(api: APIRequestContext): Promise<void> {
  const japan = seededTrip();
  const { tours } = await body<{ tours: { place_id: number; name: string }[] }>(
    await api.get(`/api/trips/${japan.tripId}/tours`),
    'Japan tours'
  );
  const walkId = tours.find((t) => t.name === TOUR_NAMES.kyotoWalk)?.place_id;
  if (!walkId) return;
  const { assignments } = await body<{ assignments: { id: number; place_id: number }[] }>(
    await api.get(`/api/trips/${japan.tripId}/days/${japan.dayIds[8]}/assignments`),
    'Japan day 9'
  );
  const assignment = assignments.find((a) => a.place_id === walkId);
  if (!assignment) return;
  const { visits } = await body<{ visits: { assignment_id: number; station_key: string; status: string }[] }>(
    await api.get(`/api/trips/${japan.tripId}/tour-visits`),
    'visits'
  );
  for (const visit of visits.filter((v) => v.assignment_id === assignment.id)) {
    await api.put(`/api/trips/${japan.tripId}/tour-visits/${assignment.id}/${visit.station_key}`, {
      data: { status: 'planned' },
    });
  }
}
