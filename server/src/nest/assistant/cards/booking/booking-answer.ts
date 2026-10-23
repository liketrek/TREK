import type { AnswerInput } from '../card-types';
import { recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { bookingCard, bookingItemOf } from './booking-item';
import { idOf, rowOfReservation, rowOfStay, rowOfUpcoming, scopeOfCard, type BookingRow } from './booking-row';
import type { TrekCard } from '@trek/shared';

/**
 * The cards of the booking reads, from the tool's raw answer: the first eight
 * bookings in the order the answer lists them, the rest counted. The trip
 * summary draws none: it runs on most turns and would repeat its card under
 * every answer.
 */

const SHOWN = 8;

function listCard(input: AnswerInput, rows: Row[], toRow: (raw: Row) => BookingRow): TrekCard | null {
  const scope = scopeOfCard(input.card);
  return bookingCard(
    'none',
    rows.slice(0, SHOWN).map((raw) => bookingItemOf(toRow(raw), scope)),
    rows.length,
  );
}

/** A stay listed once: the list joins each booking that links it, so one stay can come twice. */
function distinctStays(rows: Row[]): Row[] {
  const seen = new Set<number>();
  return rows.filter((row) => {
    const id = idOf(row.id);
    if (id === null || seen.has(id)) return id === null;
    seen.add(id);
    return true;
  });
}

function reservationsCard(input: AnswerInput): TrekCard | null {
  const rows = rowsOf(recordOf(input.value).reservations);
  return listCard(input, rows, (raw) => rowOfReservation(raw, input.card.tripId, input.card));
}

function staysCard(input: AnswerInput): TrekCard | null {
  const rows = distinctStays(rowsOf(recordOf(input.value).accommodations));
  return listCard(input, rows, (raw) => rowOfStay(raw, input.card.tripId, input.card));
}

function upcomingCard(input: AnswerInput): TrekCard | null {
  const rows = rowsOf(recordOf(input.value).reservations);
  return listCard(input, rows, (raw) => rowOfUpcoming(raw, input.card.tripId));
}

export const BOOKING_ANSWERS = {
  list_reservations: reservationsCard,
  list_accommodations: staysCard,
  list_upcoming_reservations: upcomingCard,
};
