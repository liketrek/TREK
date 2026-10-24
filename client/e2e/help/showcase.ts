import type { APIRequestContext } from '@playwright/test';
import { at, day } from '../dates';
import { setTripCover, type CoverPhoto } from '../screenshots/photos';
import { EXTRA_TRIPS, SPARE_TRIP, ensureExtraTrips } from './fixtures';

/**
 * The trips around the seeded one, made to look lived in.
 *
 * "Autumn in Japan" is the trip every guide works on, but the dashboard, the
 * journey and the collections pictures show the others too, and a grid of
 * grey cards with no plan in them reads as an empty demo. So the other trips
 * get a cover photo, a few real places on their days and the bookings a
 * traveller makes months ahead: the flight and the hotel for Lisbon, the
 * ferry and the car for Norway. Those are also what the dashboard's Upcoming
 * reservations widget lists, which stayed empty while the only bookings were
 * on a trip that ends today.
 *
 * Runs once after the seed. Everything is looked up by title or name first,
 * so a second run changes nothing.
 */

interface ShowcasePlace {
  name: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
  /** Index of the trip day, or none for an idea not planned yet. */
  day?: number;
  start?: string;
  end?: string;
  category: string;
}

interface ShowcaseBooking {
  title: string;
  type: string;
  status: 'confirmed' | 'pending';
  /** Days from the picture day and a local time, through `at`. */
  starts: [number, string];
  ends?: [number, string];
  confirmation_number?: string;
  location?: string;
  metadata?: Record<string, string>;
  endpoints?: Array<{
    role: 'from' | 'to';
    name: string;
    code?: string;
    lat: number;
    lng: number;
    timezone: string;
    date: number;
    time: string;
  }>;
}

interface ShowcaseTrip {
  title: string;
  cover: CoverPhoto;
  places: ShowcasePlace[];
  bookings: ShowcaseBooking[];
}

const LISBON_START = 25;
const NORWAY_START = 257;

const SHOWCASE: ShowcaseTrip[] = [
  {
    title: EXTRA_TRIPS[0].title,
    cover: 'lisbon',
    places: [
      {
        name: 'Torre de Belém',
        lat: 38.6916,
        lng: -9.216,
        address: 'Av. Brasília, Lisbon',
        description: 'Sixteenth-century tower on the Tagus, the start of the voyages of discovery.',
        day: 1,
        start: '10:00',
        end: '11:00',
        category: 'Attraction',
      },
      {
        name: 'Pastéis de Belém',
        lat: 38.6975,
        lng: -9.2032,
        address: 'R. de Belém 84, Lisbon',
        description: 'The original custard tarts since 1837, eaten warm with cinnamon.',
        day: 1,
        start: '11:15',
        end: '11:45',
        category: 'Bar/Cafe',
      },
      {
        name: 'Miradouro da Senhora do Monte',
        lat: 38.7193,
        lng: -9.1327,
        address: 'Largo Monte, Lisbon',
        description: 'The highest viewpoint over the old town, best at sunset.',
        day: 0,
        start: '19:00',
        end: '20:00',
        category: 'Attraction',
      },
      {
        name: 'Palácio da Pena',
        lat: 38.7876,
        lng: -9.3906,
        address: 'Estrada da Pena, Sintra',
        description: 'The painted palace on the hill above Sintra, a day trip by train.',
        day: 2,
        start: '10:30',
        end: '13:00',
        category: 'Attraction',
      },
    ],
    bookings: [
      {
        title: 'TP579 FRA → LIS',
        type: 'flight',
        status: 'confirmed',
        starts: [LISBON_START, '09:40'],
        ends: [LISBON_START, '11:35'],
        confirmation_number: 'K4R7TW',
        location: 'Frankfurt Airport',
        metadata: {
          airline: 'TAP Air Portugal',
          flight_number: 'TP579',
          departure_airport: 'FRA',
          arrival_airport: 'LIS',
        },
        endpoints: [
          {
            role: 'from',
            name: 'Frankfurt Airport',
            code: 'FRA',
            lat: 50.0379,
            lng: 8.5622,
            timezone: 'Europe/Berlin',
            date: LISBON_START,
            time: '09:40',
          },
          {
            role: 'to',
            name: 'Lisbon Humberto Delgado',
            code: 'LIS',
            lat: 38.7742,
            lng: -9.1342,
            timezone: 'Europe/Lisbon',
            date: LISBON_START,
            time: '11:35',
          },
        ],
      },
      {
        title: 'Memmo Alfama Hotel',
        type: 'hotel',
        status: 'confirmed',
        starts: [LISBON_START, '15:00'],
        ends: [LISBON_START + 2, '11:00'],
        confirmation_number: 'MA-88213',
        location: 'Travessa das Merceeiras 27, Lisbon',
      },
      {
        title: 'Train to Sintra',
        type: 'train',
        status: 'pending',
        starts: [LISBON_START + 2, '09:11'],
        ends: [LISBON_START + 2, '09:52'],
        location: 'Rossio Station',
      },
    ],
  },
  {
    title: EXTRA_TRIPS[1].title,
    cover: 'norway',
    places: [
      {
        name: 'Bryggen',
        lat: 60.3976,
        lng: 5.3247,
        address: 'Bryggen, Bergen',
        description: 'The Hanseatic wharf with its leaning wooden warehouses.',
        day: 0,
        start: '16:00',
        end: '17:30',
        category: 'Attraction',
      },
      {
        name: 'Trollstigen',
        lat: 62.4549,
        lng: 7.6699,
        address: 'Trollstigen, Rauma',
        description: 'Eleven hairpins up the mountain road, with a viewing platform at the top.',
        day: 4,
        start: '11:00',
        end: '12:00',
        category: 'Nature',
      },
      {
        name: 'Reine',
        lat: 67.9324,
        lng: 13.0886,
        address: 'Reine, Moskenes',
        description: 'Red fishing cabins under granite peaks in the Lofoten.',
        category: 'Nature',
      },
    ],
    bookings: [
      {
        title: 'Rental car, Bergen airport',
        type: 'car',
        status: 'confirmed',
        starts: [NORWAY_START, '13:00'],
        ends: [NORWAY_START + 14, '10:00'],
        confirmation_number: 'HZ-5521907',
        location: 'Bergen Airport Flesland',
      },
      {
        title: 'Ferry Bodø → Moskenes',
        type: 'ferry',
        status: 'pending',
        starts: [NORWAY_START + 10, '15:00'],
        ends: [NORWAY_START + 10, '18:30'],
        location: 'Bodø ferry terminal',
      },
    ],
  },
  { title: SPARE_TRIP.title, cover: 'alps', places: [], bookings: [] },
];

type Trip = { id: number; title: string; cover_image?: string | null };

async function list<T>(api: APIRequestContext, url: string, key: string): Promise<T[]> {
  const res = await api.get(url);
  if (!res.ok()) throw new Error(`GET ${url}: ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as Record<string, T[]> | T[];
  return Array.isArray(body) ? body : (body[key] ?? []);
}

async function post(api: APIRequestContext, url: string, data: unknown): Promise<Record<string, unknown>> {
  const res = await api.post(url, { data });
  if (!res.ok()) throw new Error(`POST ${url}: ${res.status()} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

async function fillTrip(
  api: APIRequestContext,
  trip: Trip,
  spec: ShowcaseTrip,
  categories: { id: number; name: string }[]
): Promise<void> {
  if (!trip.cover_image) await setTripCover(api, trip.id, spec.cover);

  const days = await list<{ id: number }>(api, `/api/trips/${trip.id}/days`, 'days');
  const places = await list<{ name: string }>(api, `/api/trips/${trip.id}/places`, 'places');
  for (const place of spec.places) {
    if (places.some((p) => p.name === place.name)) continue;
    const { day: dayIndex, start, end, category, ...payload } = place;
    const categoryId = categories.find((c) => c.name === category)?.id;
    const created = (await post(api, `/api/trips/${trip.id}/places`, {
      ...payload,
      ...(categoryId ? { category_id: categoryId } : {}),
    })) as { place: { id: number } };
    const dayId = dayIndex === undefined ? undefined : days[dayIndex]?.id;
    if (!dayId) continue;
    const assigned = (await post(api, `/api/trips/${trip.id}/days/${dayId}/assignments`, {
      place_id: created.place.id,
    })) as { assignment: { id: number } };
    if (start) {
      const res = await api.put(`/api/trips/${trip.id}/assignments/${assigned.assignment.id}/time`, {
        data: { place_time: start, end_time: end ?? null },
      });
      if (!res.ok()) throw new Error(`time for ${place.name}: ${res.status()} ${await res.text()}`);
    }
  }

  const bookings = await list<{ title: string }>(api, `/api/trips/${trip.id}/reservations`, 'reservations');
  for (const booking of spec.bookings) {
    if (bookings.some((b) => b.title === booking.title)) continue;
    const { starts, ends, endpoints, ...rest } = booking;
    await post(api, `/api/trips/${trip.id}/reservations`, {
      ...rest,
      reservation_time: at(starts[0], starts[1]),
      ...(ends ? { reservation_end_time: at(ends[0], ends[1]) } : {}),
      ...(endpoints
        ? {
            endpoints: endpoints.map(({ date, time, ...e }, sequence) => ({
              ...e,
              sequence,
              local_date: day(date),
              local_time: time,
            })),
          }
        : {}),
    });
  }
}

export async function ensureShowcase(api: APIRequestContext): Promise<void> {
  await ensureExtraTrips(api);
  let trips = await list<Trip>(api, '/api/trips', 'trips');
  if (!trips.some((t) => t.title === SPARE_TRIP.title)) {
    await post(api, '/api/trips', SPARE_TRIP);
    trips = await list<Trip>(api, '/api/trips', 'trips');
  }
  const categories = await list<{ id: number; name: string }>(api, '/api/categories', 'categories');
  for (const spec of SHOWCASE) {
    const trip = trips.find((t) => t.title === spec.title);
    if (trip) await fillTrip(api, trip, spec, categories);
  }
}
