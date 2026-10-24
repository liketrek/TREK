import type { APIRequestContext } from '@playwright/test';
import { seededTrip } from './fixtures';
import { TOUR_NAMES } from './tour-fixtures';

/**
 * What the tour guide on the plan map needs beyond `ensureToursFixtures`: one
 * of the trip's tours on a day, so the day's route has a tour to run to and on
 * from. The Tours fixtures may already put one there; then nothing is added.
 * Otherwise the Fushimi Inari hike goes onto day 5, the day that already holds
 * Fushimi Inari Taisha, and `removeTourFromDay` takes exactly that assignment
 * out again in `afterAll`, so the screens after this one see the seed as it was.
 */

interface DayAssignment {
  id: number;
  place_id: number;
  place?: { name?: string };
}

/** The tour names, whatever shape the Tours fixtures export them in (a list or a map of them). */
export function tourNames(): string[] {
  const values = Object.values(TOUR_NAMES as unknown as Record<string, unknown>);
  return values.filter((v): v is string => typeof v === 'string');
}

export interface TourOnDay {
  /** The day's number in the days column, 1-based. */
  day: number;
  /** The tour's name, as the list and its card show it. */
  name: string;
  /** The assignment this fixture created, to remove again; null when the tour was already on a day. */
  created: { dayId: number; id: number } | null;
}

async function assignmentsOf(api: APIRequestContext, tripId: number, dayId: number): Promise<DayAssignment[]> {
  const res = await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`);
  if (!res.ok()) throw new Error(`could not read the assignments of day ${dayId}: ${res.status()}`);
  const body = (await res.json()) as { assignments?: DayAssignment[] };
  return body.assignments ?? [];
}

export async function ensureTourOnDay(api: APIRequestContext): Promise<TourOnDay> {
  const { tripId, dayIds } = seededTrip();
  const names = tourNames();
  if (!names.length) throw new Error('the Tours fixtures export no tour names');

  for (let i = 0; i < dayIds.length; i++) {
    const onDay = (await assignmentsOf(api, tripId, dayIds[i])).find((a) => names.includes(a.place?.name ?? ''));
    if (onDay?.place?.name) return { day: i + 1, name: onDay.place.name, created: null };
  }

  const res = await api.get(`/api/trips/${tripId}/places`);
  const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[];
  const places = Array.isArray(body) ? body : (body.places ?? []);
  const tours = places.filter((p) => names.includes(p.name));
  const tour = tours.find((p) => /fushimi/i.test(p.name)) ?? tours[0];
  if (!tour) throw new Error(`none of the tours (${names.join(', ')}) is in the trip`);

  const dayId = dayIds[4];
  const created = await api.post(`/api/trips/${tripId}/days/${dayId}/assignments`, { data: { place_id: tour.id } });
  if (!created.ok())
    throw new Error(`could not put "${tour.name}" on day 5: ${created.status()} ${await created.text()}`);
  const { assignment } = (await created.json()) as { assignment: { id: number } };
  return { day: 5, name: tour.name, created: { dayId, id: assignment.id } };
}

export async function removeTourFromDay(api: APIRequestContext, onDay: TourOnDay | null): Promise<void> {
  if (!onDay?.created) return;
  const { tripId } = seededTrip();
  await api.delete(`/api/trips/${tripId}/days/${onDay.created.dayId}/assignments/${onDay.created.id}`);
}
