import type { TripCard } from '../../assistant-context';
import { recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import type { CardDay } from '@trek/shared';

/**
 * The trip's bookings and stays as `get_trip_summary` answered them on this
 * turn, by id, read once per trip card. The trip card itself keeps only a
 * booking's title and day for the prompt; a booking card needs the whole row
 * (its endpoints, travellers, metadata and the stay it links).
 */

interface TripBookings {
  reservations: ReadonlyMap<number, Row>;
  stays: ReadonlyMap<number, Row>;
}

const PARSED = new WeakMap<TripCard, TripBookings>();

function byId(rows: Row[]): Map<number, Row> {
  const out = new Map<number, Row>();
  for (const row of rows) {
    if (typeof row.id === 'number' && Number.isInteger(row.id) && row.id > 0 && !out.has(row.id)) out.set(row.id, row);
  }
  return out;
}

function parsed(card: TripCard): TripBookings {
  let found = PARSED.get(card);
  if (!found) {
    const summary = recordOf(recordOf(card.sources).summary);
    found = { reservations: byId(rowsOf(summary.reservations)), stays: byId(rowsOf(summary.accommodations)) };
    PARSED.set(card, found);
  }
  return found;
}

/** A booking of this trip as the summary holds it, joins included. */
export function bookingRowOf(card: TripCard, id: number | null): Row | null {
  return id === null ? null : (parsed(card).reservations.get(id) ?? null);
}

/** A stay of this trip as the summary holds it, its place joined. */
export function stayRowOf(card: TripCard, id: number | null): Row | null {
  return id === null ? null : (parsed(card).stays.get(id) ?? null);
}

/** A day of this trip by its id; null for one the trip does not hold. */
export function dayOf(card: TripCard, id: unknown): CardDay | null {
  const day = typeof id === 'number' ? card.days.find((d) => d.id === id) : undefined;
  return day ? { id: day.id, number: day.number, date: day.date } : null;
}

const ISO_DATE = /^(\d{4}-\d{2}-\d{2})/;

/** The date part of a date or a date and time, as written. */
export function dateOf(value: unknown): string | null {
  return typeof value === 'string' ? (ISO_DATE.exec(value.trim())?.[1] ?? null) : null;
}

/** The trip day on a date; a date the trip has no day for still names its date. */
export function dayOnDate(card: TripCard | null, date: string | null): CardDay | null {
  if (date === null) return null;
  const day = card?.days.find((d) => d.date === date);
  return day ? { id: day.id, number: day.number, date } : { id: null, number: null, date };
}
