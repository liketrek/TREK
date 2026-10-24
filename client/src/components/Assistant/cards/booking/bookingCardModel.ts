import type { BookingCard, BookingChangedField, BookingItem, BookingLeg, BookingTicket, CardDay } from '@trek/shared';

import type { StatusTone } from '../../../Planner/bookings/bookingParts';
import type { CardEntry } from '../cardTypes';

/**
 * The pure side of a booking card: what its status dot says, how many stops
 * a ticket makes, how long a stopover lasts, how many days later it lands,
 * and how an answer's booking cards read as one list. No React here, so the
 * card, its rows and the tests read one answer.
 */

/** A status a booking card names in words. */
type BookingStatus = NonNullable<BookingItem['status']>;

/**
 * The planner's tone of a booking (its `toneOf`): a transit hop in the info
 * tone, a confirmed booking green, any other (pending, cancelled) amber; none
 * for a stay no booking names.
 */
export function toneOfItem(item: Pick<BookingItem, 'type' | 'status'>): StatusTone | null {
  if (item.type === 'transit') return 'transit';
  if (!item.status) return null;
  return item.status === 'confirmed' ? 'confirmed' : 'pending';
}

/** The words for a status, literal keys so the i18n check sees each one; a cancelled one says so in its tooltip. */
export const STATUS_LABEL: Record<BookingStatus, { labelKey: string }> = {
  confirmed: { labelKey: 'reservations.confirmed' },
  pending: { labelKey: 'reservations.pending' },
  cancelled: { labelKey: 'assistant.card.booking.cancelled' },
};

/** The stops between a ticket's two ends; null when no route is known. */
export function stopsOf(ticket: BookingTicket): number | null {
  if (ticket.stops.length >= 2) return ticket.stops.length - 2;
  return ticket.legs.length > 1 ? ticket.legs.length - 1 : null;
}

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** How many days after it departs a leg (or a whole ticket, first leg to last) lands; null for the same day. */
export function daysLater(from: CardDay | null, to: CardDay | null): number | null {
  if (from?.date && to?.date) {
    const later = dayNumber(to.date) - dayNumber(from.date);
    return later > 0 ? later : null;
  }
  if (from?.number != null && to?.number != null) {
    const later = to.number - from.number;
    return later > 0 ? later : null;
  }
  return null;
}

/** The minutes between two clocks on the days they name (a stopover's arrival and the onward departure). */
function minutesBetween(arrives: BookingLeg, departs: BookingLeg): number | null {
  if (!arrives.arrives || !departs.departs) return null;
  const toMinutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
  const days = daysLater(arrives.arrivesDay ?? arrives.departsDay, departs.departsDay ?? arrives.arrivesDay) ?? 0;
  const minutes = days * 1440 + toMinutes(departs.departs) - toMinutes(arrives.arrives);
  return minutes > 0 ? minutes : null;
}

/** One stopover of a ticket: where, and for how long when both clocks are known. */
interface Layover {
  place: string;
  minutes: number | null;
}

/** The stopovers between a ticket's legs; only when the legs line up with its stops. */
export function layoversOf(ticket: BookingTicket): Layover[] {
  if (ticket.legs.length < 2 || ticket.stops.length !== ticket.legs.length + 1) return [];
  return ticket.legs.slice(0, -1).map((leg, i) => {
    const stop = ticket.stops[i + 1];
    const next = ticket.legs[i + 1] as BookingLeg;
    return { place: stop?.code ?? stop?.name ?? '', minutes: minutesBetween(leg, next) };
  });
}

/** Whether an update changes a field; a create or a removal marks nothing. */
export function isChanged(card: Pick<BookingCard, 'change'>, item: BookingItem, field: BookingChangedField): boolean {
  return card.change === 'update' && item.changed.includes(field);
}

/** An answer's booking cards as one list: every booking in order, and how many the answers left out. */
export function itemsOf(entries: readonly CardEntry[]): { items: BookingItem[]; more: number } {
  const items: BookingItem[] = [];
  let more = 0;
  for (const entry of entries) {
    if (entry.card.kind !== 'booking') continue;
    items.push(...entry.card.items);
    more += entry.card.more;
  }
  return { items, more };
}

/** At most this many bookings are drawn as whole cards; from one more on they read as a list. */
export const FULL_CARDS = 2;
