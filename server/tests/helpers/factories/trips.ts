import { Days } from '../../../src/db/entities/Days.entity';
import { ShareTokens } from '../../../src/db/entities/ShareTokens.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { inContext, nextSeq, type FactoryOrm } from './context';
import { createRow, findRows, insertRows } from './rows';
import type { EntityDTO } from '@mikro-orm/core';

export type TripRow = EntityDTO<Trips>;
export type DayRow = EntityDTO<Days>;

export interface TripOverrides {
  title?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  currency?: string;
  feed_token?: string | null;
  is_archived?: number;
  reminder_days?: number;
  cover_image?: string | null;
}

/**
 * The calendar dates from `start` to `end`, both included. Stepped in UTC: a
 * date-only string parses as UTC midnight, and stepping local time would
 * drop or repeat a day across a DST change.
 */
export function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let d = new Date(start); d <= new Date(end); d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * A trip owned by `userId`. With both dates set it also gets one day per
 * date, numbered from 1, as the trips service creates them.
 */
export async function makeTrip(orm: FactoryOrm, userId: number, overrides: TripOverrides = {}): Promise<TripRow> {
  const trip = await createRow(orm, Trips, {
    user: userId,
    title: overrides.title ?? `Test Trip ${nextSeq('trip')}`,
    description: overrides.description ?? null,
    start_date: overrides.start_date ?? null,
    end_date: overrides.end_date ?? null,
    ...(overrides.currency !== undefined ? { currency: overrides.currency } : {}),
    ...(overrides.feed_token !== undefined ? { feed_token: overrides.feed_token } : {}),
    ...(overrides.is_archived !== undefined ? { is_archived: overrides.is_archived } : {}),
    ...(overrides.reminder_days !== undefined ? { reminder_days: overrides.reminder_days } : {}),
    ...(overrides.cover_image !== undefined ? { cover_image: overrides.cover_image } : {}),
  });
  if (overrides.start_date && overrides.end_date) {
    const dates = datesBetween(overrides.start_date, overrides.end_date);
    await insertRows(
      orm,
      Days,
      dates.map((date, i) => ({ trip: trip.id, day_number: i + 1, date })),
    );
  }
  return trip;
}

/** One more day on the trip; `day_number` defaults to the next free one. */
export async function makeDay(
  orm: FactoryOrm,
  tripId: number,
  overrides: { day_number?: number; date?: string | null; title?: string | null; notes?: string | null } = {},
): Promise<DayRow> {
  const dayNumber =
    overrides.day_number ??
    (await inContext(orm, async (em) => {
      const last = await em.findOne(
        Days,
        { trip: tripId },
        { orderBy: { day_number: 'desc' }, disableIdentityMap: true },
      );
      return (last?.day_number ?? 0) + 1;
    }));
  return createRow(orm, Days, {
    trip: tripId,
    day_number: dayNumber,
    date: overrides.date ?? null,
    title: overrides.title ?? null,
    notes: overrides.notes ?? null,
  });
}

/** The trip's days in day order. */
export function readTripDays(orm: FactoryOrm, tripId: number): Promise<DayRow[]> {
  return findRows(orm, Days, { trip: tripId }, { day_number: 'asc' });
}

/** Adds `userId` to the trip's members; a second call for the same pair is a no-op. */
export async function addTripMember(
  orm: FactoryOrm,
  tripId: number,
  userId: number,
  invitedBy: number | null = null,
): Promise<void> {
  await inContext(orm, (em) => em.getRepository(TripMembers).addIgnoringConflict(tripId, userId, invitedBy));
}

/** A public share link for the trip, sharing what the overrides switch on. */
export function makeShareToken(
  orm: FactoryOrm,
  tripId: number,
  createdBy: number,
  overrides: Partial<
    Pick<
      EntityDTO<ShareTokens>,
      | 'token'
      | 'share_map'
      | 'share_bookings'
      | 'share_packing'
      | 'share_budget'
      | 'share_collab'
      | 'share_travel_only'
      | 'share_hide_images'
      | 'expires_at'
    >
  > = {},
): Promise<EntityDTO<ShareTokens>> {
  return createRow(orm, ShareTokens, {
    trip: tripId,
    createdByRef: createdBy,
    token: overrides.token ?? `share-${nextSeq('share-token')}-${tripId}`,
    ...overrides,
  });
}
