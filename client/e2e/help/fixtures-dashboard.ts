import type { APIRequestContext } from '@playwright/test';
import { at, day } from '../dates';
import { EXTRA_TRIPS } from './fixtures';

/**
 * What the dashboard guides need beyond the seed and `ensureExtraTrips`.
 *
 * The seeded Japan trip ends on the picture day, so every one of its bookings
 * is behind us and the Upcoming reservations widget would read "Nothing booked
 * yet." The Lisbon weekend, 25 days out, gets three bookings of its own: a
 * flight, a table that is not confirmed yet (so the Pending tag shows) and a
 * day trip. Trip reminders are switched on, which is the instance default, so
 * the reminder guide finds the presets and not the "disabled" hint.
 */

/** The flight, the hotel and the Sintra train come from the showcase (showcase.ts); the guides add a dinner. */
export const LISBON_FLIGHT = 'TP579 FRA → LIS';
export const LISBON_BOOKINGS = [
  {
    title: 'Dinner at Cervejaria Ramiro',
    type: 'restaurant',
    status: 'pending',
    location: 'Av. Almirante Reis 1, Lisbon',
    offset: 25,
    time: '20:30',
    confirmation_number: '',
  },
] as const;

const listIn = <T>(body: unknown, key: string): T[] =>
  Array.isArray(body) ? (body as T[]) : (((body as Record<string, unknown>)?.[key] as T[] | undefined) ?? []);

async function json(res: Awaited<ReturnType<APIRequestContext['get']>>, what: string): Promise<unknown> {
  if (!res.ok()) throw new Error(`${what}: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Id of a trip by its title; throws when it is missing. */
export async function tripIdByTitle(api: APIRequestContext, title: string): Promise<number> {
  const trip = listIn<{ id: number; title: string }>(
    await json(await api.get('/api/trips'), 'list trips'),
    'trips'
  ).find((t) => t.title === title);
  if (!trip) throw new Error(`fixture trip "${title}" is missing`);
  return trip.id;
}

export async function ensureDashboardFixtures(api: APIRequestContext): Promise<void> {
  const settings = await api.put('/api/auth/app-settings', { data: { notify_trip_reminder: 'true' } });
  if (!settings.ok())
    throw new Error(`could not switch trip reminders on: ${settings.status()} ${await settings.text()}`);

  const tripId = await tripIdByTitle(api, EXTRA_TRIPS[0].title);
  const reservations = listIn<{ title: string }>(
    await json(await api.get(`/api/trips/${tripId}/reservations`), 'list reservations'),
    'reservations'
  );
  const days = listIn<{ id: number; date?: string | null }>(
    await json(await api.get(`/api/trips/${tripId}/days`), 'list days'),
    'days'
  );
  for (const { offset, time, ...booking } of LISBON_BOOKINGS) {
    if (reservations.some((r) => r.title === booking.title)) continue;
    const dayId = days.find((d) => d.date === day(offset))?.id;
    const created = await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        ...booking,
        confirmation_number: booking.confirmation_number || undefined,
        day_id: dayId,
        reservation_time: at(offset, time),
      },
    });
    if (!created.ok())
      throw new Error(`could not create "${booking.title}": ${created.status()} ${await created.text()}`);
  }
}
