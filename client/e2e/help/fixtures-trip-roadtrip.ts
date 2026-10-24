import type { APIRequestContext, Page } from '@playwright/test';
import { at, day } from '../dates';
import { seededTrip } from './fixtures';
import { PICTURE_DAY } from './guide';

/**
 * What a few road trip guides need beyond `ensureRoadtripFixtures`, each one
 * written by the guide that needs it and taken away again in its cleanup: the
 * other guides of the screen draw the same rail, and a fuel stop or a ferry
 * left behind would change their drive.
 *
 * Day N of "Autumn in Japan" is `day(N - 10)`: the trip ends on the picture day.
 */

type Place = { id: number; name: string };
type Assignment = { id: number; place_id: number };

async function placesOf(api: APIRequestContext): Promise<Place[]> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/places`);
  const body = (await res.json()) as { places?: Place[] } | Place[];
  return Array.isArray(body) ? body : (body.places ?? []);
}

export async function assignmentsOn(api: APIRequestContext, dayIndex: number): Promise<Assignment[]> {
  const { tripId, dayIds } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/days/${dayIds[dayIndex]}/assignments`);
  const body = (await res.json()) as { assignments?: Assignment[] };
  return body.assignments ?? [];
}

export async function placeIdOf(api: APIRequestContext, name: string): Promise<number | null> {
  return (await placesOf(api)).find((p) => p.name === name)?.id ?? null;
}

// ── A fuel stop on day 4, for the fill-level guide ───────────────────────────

/** A motorway service area on the Tomei, between Tokyo and Hakone. */
export const FUEL_STOP = {
  name: 'Ebina Service Area',
  lat: 35.4178,
  lng: 139.3955,
  address: 'Ebina, Kanagawa',
  description: 'Fuel and food on the Tomei Expressway, halfway to Hakone.',
  stop_type: 'fuel',
};

/**
 * Put the service area on day 4 between Shinjuku Gyoen and Hakone Shrine, the
 * leg it really lies on. Idempotent: an existing one is only put back in place.
 */
export async function ensureFuelStop(api: APIRequestContext): Promise<void> {
  const { tripId, dayIds } = seededTrip();
  let id = await placeIdOf(api, FUEL_STOP.name);
  if (id === null) {
    const created = await api.post(`/api/trips/${tripId}/places`, { data: FUEL_STOP });
    if (!created.ok())
      throw new Error(`could not create "${FUEL_STOP.name}": ${created.status()} ${await created.text()}`);
    id = await placeIdOf(api, FUEL_STOP.name);
  }
  if (id === null) throw new Error(`"${FUEL_STOP.name}" is missing after creating it`);
  if (!(await assignmentsOn(api, 3)).some((a) => a.place_id === id)) {
    const pinned = await api.post(`/api/trips/${tripId}/days/${dayIds[3]}/assignments`, { data: { place_id: id } });
    if (!pinned.ok())
      throw new Error(`could not put the fuel stop on day 4: ${pinned.status()} ${await pinned.text()}`);
  }
  // Right before Hakone Shrine, so the drive is Shinjuku, the service area, Hakone.
  const hakone = await placeIdOf(api, 'Hakone Shrine');
  const day4 = await assignmentsOn(api, 3);
  const fuel = day4.find((a) => a.place_id === id);
  const rest = day4.filter((a) => a !== fuel);
  const slot = rest.findIndex((a) => a.place_id === hakone);
  if (fuel && slot >= 0) {
    const orderedIds = [...rest.slice(0, slot), fuel, ...rest.slice(slot)].map((a) => a.id);
    await api.put(`/api/trips/${tripId}/days/${dayIds[3]}/assignments/reorder`, { data: { orderedIds } });
  }
}

export async function removeFuelStop(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const id = await placeIdOf(api, FUEL_STOP.name);
  if (id !== null) await api.delete(`/api/trips/${tripId}/places/${id}`);
}

// ── A ferry on day 3, for the bookings guide ─────────────────────────────────

/** The boat across Lake Ashi, between the two Hakone stops of day 3. */
export const FERRY = {
  title: 'Lake Ashi cruise Togendai → Moto-Hakone',
  from: { name: 'Togendai Port', lat: 35.2386, lng: 139.0128, time: '11:50' },
  to: { name: 'Moto-Hakone Port', lat: 35.1973, lng: 139.025, time: '12:25' },
};

type Booking = { id: number; title: string };

async function bookingsOf(api: APIRequestContext): Promise<Booking[]> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/reservations`);
  const body = (await res.json()) as { reservations?: Booking[] } | Booking[];
  return Array.isArray(body) ? body : (body.reservations ?? []);
}

/**
 * A ferry booking with both piers located, so the drive ends at one and starts
 * again at the other. 11:50 leaves the half hour of check-in a ferry is pinned
 * ahead of the timetable after the stop at Lake Ashi, so the badge reads on time.
 */
export async function ensureFerry(api: APIRequestContext): Promise<void> {
  if ((await bookingsOf(api)).some((b) => b.title === FERRY.title)) return;
  const { tripId, dayIds } = seededTrip();
  const created = await api.post(`/api/trips/${tripId}/reservations`, {
    data: {
      title: FERRY.title,
      type: 'ferry',
      status: 'confirmed',
      day_id: dayIds[2],
      end_day_id: dayIds[2],
      reservation_time: at(-7, FERRY.from.time),
      reservation_end_time: at(-7, FERRY.to.time),
      confirmation_number: 'HKN-3307',
      location: FERRY.from.name,
      endpoints: [
        {
          role: 'from',
          sequence: 0,
          name: FERRY.from.name,
          lat: FERRY.from.lat,
          lng: FERRY.from.lng,
          timezone: 'Asia/Tokyo',
          local_date: day(-7),
          local_time: FERRY.from.time,
        },
        {
          role: 'to',
          sequence: 1,
          name: FERRY.to.name,
          lat: FERRY.to.lat,
          lng: FERRY.to.lng,
          timezone: 'Asia/Tokyo',
          local_date: day(-7),
          local_time: FERRY.to.time,
        },
      ],
    },
  });
  if (!created.ok()) throw new Error(`could not create the ferry: ${created.status()} ${await created.text()}`);
}

export async function removeFerry(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  for (const booking of (await bookingsOf(api)).filter((b) => b.title === FERRY.title)) {
    await api.delete(`/api/trips/${tripId}/reservations/${booking.id}`);
  }
}

// ── A night found along the route, taken away again ──────────────────────────

/** Cancel the stays booked for a place, with their bookings, then the place. */
export async function removeNightAt(api: APIRequestContext, name: string): Promise<void> {
  if (!name) return;
  const { tripId } = seededTrip();
  const id = await placeIdOf(api, name);
  if (id === null) return;
  const res = await api.get(`/api/trips/${tripId}/accommodations`);
  const body = (await res.json()) as { accommodations?: { id: number; place_id: number }[] };
  for (const stay of (body.accommodations ?? []).filter((a) => a.place_id === id)) {
    await api.delete(`/api/trips/${tripId}/accommodations/${stay.id}`);
  }
  await api.delete(`/api/trips/${tripId}/places/${id}`);
}

// ── The Google Maps import, answered without asking Google ───────────────────

/** A route from Hakone round Mount Fuji, the way the preview reads one. */
export const GOOGLE_ROUTE = {
  url: 'https://maps.app.goo.gl/hakoneFujiFiveLakes',
  stops: [
    { name: 'Gotemba Premium Outlets', lat: 35.3076, lng: 138.964 },
    { name: 'Oshino Hakkai', lat: 35.4602, lng: 138.8327 },
    { name: 'Lake Kawaguchi', lat: 35.5171, lng: 138.7519 },
    { name: 'Fuji viewpoint (dropped pin)', lat: null, lng: null },
  ],
};

/**
 * The preview is the one request that goes to Google, so it is answered here;
 * the import itself is TREK's own and runs for real.
 */
export async function stubGooglePreview(page: Page): Promise<void> {
  await page.route('**/api/roadtrip/google-maps-preview', (route) =>
    route.fulfill({ status: 200, json: { stops: GOOGLE_ROUTE.stops } })
  );
}

export async function removeImportedStops(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  const names = GOOGLE_ROUTE.stops.filter((s) => s.lat !== null).map((s) => s.name);
  for (const place of (await placesOf(api)).filter((p) => names.includes(p.name))) {
    await api.delete(`/api/trips/${tripId}/places/${place.id}`);
  }
}

// ── Current warnings, answered without the live feeds ────────────────────────

/** A storm over Hakone and the Izu peninsula, the shape GDACS reports one in. */
export const HAZARD_TITLE = 'Tropical storm, green alert';

/**
 * The warnings come live from DWD and GDACS, and neither has to have anything
 * near Japan on the day the pictures are taken. The feed is answered here.
 */
export async function stubHazards(page: Page): Promise<void> {
  const now = PICTURE_DAY.toISOString();
  const until = new Date(PICTURE_DAY.getTime() + 36 * 3600_000).toISOString();
  // On the context, not the page: in dev the service worker makes this GET itself,
  // and only the context's routes see what a service worker asks for.
  await page.context().route('**/api/trips/*/roadtrip/hazards*', (route) =>
    route.fulfill({
      status: 200,
      json: {
        fetchedAt: now,
        sources: [
          { source: 'DWD', status: 'ok' },
          { source: 'GDACS', status: 'ok' },
        ],
        hazards: [
          {
            id: 'gdacs-tc-demo',
            source: 'GDACS',
            title: HAZARD_TITLE,
            description: 'Heavy rain and gusts of up to 90 km/h around Hakone and the Izu peninsula.',
            updatedAt: now,
            validUntil: until,
            url: 'https://www.gdacs.org/',
            alertScore: 0.5,
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [138.82, 35.02],
                  [139.18, 34.98],
                  [139.36, 35.16],
                  [139.3, 35.4],
                  [138.98, 35.46],
                  [138.78, 35.26],
                  [138.82, 35.02],
                ],
              ],
            },
          },
        ],
      },
    })
  );
}

export async function hideHazards(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip();
  await api.put(`/api/trips/${tripId}/roadtrip/preferences`, { data: { roadtrip_show_hazards: false } });
}

// ── The flight out, as the drive reads it ────────────────────────────────────

/** The seed's flight; it leaves Frankfurt on day 1, after day 1's first stops in Tokyo. */
const FLIGHT_TITLE = 'LH716 FRA → HND';

type Endpoint = {
  role: string;
  sequence: number;
  name: string;
  code?: string | null;
  lat: number;
  lng: number;
  timezone?: string | null;
  local_date?: string | null;
  local_time?: string | null;
};
type FlightRow = {
  id: number;
  title: string;
  reservation_time: string | null;
  reservation_end_time: string | null;
  day_id: number | null;
  end_day_id: number | null;
  endpoints?: Endpoint[];
};

let flightAsSeeded: FlightRow | null = null;

async function flightOf(api: APIRequestContext): Promise<FlightRow | null> {
  return ((await bookingsOf(api)) as unknown as FlightRow[]).find((b) => b.title === FLIGHT_TITLE) ?? null;
}

async function putFlight(api: APIRequestContext, id: number, data: Partial<FlightRow>): Promise<void> {
  const { tripId } = seededTrip();
  const res = await api.put(`/api/trips/${tripId}/reservations/${id}`, { data });
  if (!res.ok()) throw new Error(`could not move the flight: ${res.status()} ${await res.text()}`);
}

/**
 * The drive starts where the flight lands. The seed has it leave Frankfurt at
 * 13:05 on day 1, after Senso-ji, so the road trip would drive from Tokyo to
 * Frankfurt and back. For these pictures it is the overnight flight it should
 * be, into Haneda at 06:50 on day 1, and only its Haneda end is located.
 */
export async function overnightFlight(api: APIRequestContext): Promise<void> {
  const flight = await flightOf(api);
  if (!flight) throw new Error(`no booking "${FLIGHT_TITLE}" to move overnight`);
  flightAsSeeded ??= flight;
  const ends = flight.endpoints ?? [];
  await putFlight(api, flight.id, {
    reservation_time: at(-10, '17:55'),
    reservation_end_time: at(-9, '06:50'),
    // The server keeps a booking on the trip's first day even when it leaves the
    // evening before, so the drive would still start in Frankfurt. A ride without a
    // located end at both sides is left to the day plan, so the Frankfurt end goes.
    endpoints: ends.filter((e) => e.role !== 'from').map((e) => ({ ...e, local_date: day(-9), local_time: '06:50' })),
  });
  const moved = await flightOf(api);
  if ((moved?.endpoints ?? []).some((e) => e.role === 'from')) {
    throw new Error(`the flight still starts in Frankfurt: ${JSON.stringify(moved?.endpoints)}`);
  }
}

/** The flight back as the seed has it, for the screens after these. */
export async function restoreFlight(api: APIRequestContext): Promise<void> {
  const seeded = flightAsSeeded;
  if (!seeded) return;
  await putFlight(api, seeded.id, {
    reservation_time: seeded.reservation_time,
    reservation_end_time: seeded.reservation_end_time,
    day_id: seeded.day_id,
    end_day_id: seeded.end_day_id,
    endpoints: seeded.endpoints,
  });
  flightAsSeeded = null;
}
