import {
  isTransportReservationType,
  type AssistantApplied,
  type BookingCard,
  type BookingItem,
  type TrekCard,
} from '@trek/shared';
import { BedDouble, CalendarCog, Hotel, Ticket } from 'lucide-react';

import type { EntityTarget, PackLook } from '../cardTypes';

/**
 * What the bookings bring to the chat's pure look: the verbs and tool names
 * of their changes, the reading steps, what an applied booking or stay opens
 * (the booking in its tab, a stay on its check-in day) and the follow-ups of
 * a booking answer. A look stays pure, icons and literals only: the chat's
 * main chunk reads every look, so whatever a look imports ships with it.
 */

/** The first booking a card holds; an applied change's card holds one. */
function bookingItemOf(card: TrekCard | null): BookingItem | null {
  return card?.kind === 'booking' ? (card.items[0] ?? null) : null;
}

/** The tab a booking lives in: the transports for anything travelled on, else the bookings. */
export function bookingTabOf(type: string): 'transports' | 'buchungen' {
  return isTransportReservationType(type) ? 'transports' : 'buchungen';
}

/**
 * Where "Open" takes a booking: its tab with the booking opened, on this
 * trip; a booking of another trip (the upcoming list spans every trip) opens
 * that trip's planner. `map` shows its route on the plan instead.
 */
export function bookingTarget(item: BookingItem, reservationId: number, map = false): EntityTarget {
  const params: Record<string, string> = map
    ? { booking: String(reservationId), map: '1' }
    : { booking: String(reservationId) };
  const tab = map ? 'plan' : bookingTabOf(item.type);
  if (item.tripTitle !== null) {
    return { kind: 'page', path: `/trips/${item.tripId}?${new URLSearchParams({ tab, ...params }).toString()}` };
  }
  return { kind: 'tab', tab, params };
}

/** The spot a booking has on the plan's map: a stay's or a venue's place, else the day it starts. */
export function bookingSpotOf(item: BookingItem | null): { placeId: number | null; dayId: number | null } | null {
  if (!item || item.tripTitle !== null) return null;
  const body = item.body;
  if (body.shape === 'stay') {
    if (body.placeId !== null) return { placeId: body.placeId, dayId: null };
    return body.checkIn?.day.id ? { placeId: null, dayId: body.checkIn.day.id } : null;
  }
  if (body.shape === 'venue') {
    if (body.placeId !== null) return { placeId: body.placeId, dayId: null };
    return body.day?.id ? { placeId: null, dayId: body.day.id } : null;
  }
  const dayId = body.legs[0]?.departsDay?.id ?? null;
  return dayId !== null ? { placeId: null, dayId } : null;
}

function reservationOnMap(applied: AssistantApplied, card: TrekCard | null) {
  return bookingSpotOf(bookingItemOf(card)) ?? { placeId: null, dayId: applied.dayId };
}

function reservationOpen(applied: AssistantApplied, card: TrekCard | null): EntityTarget | null {
  const item = bookingItemOf(card);
  const id = applied.ids[0] ?? item?.reservationId ?? null;
  return item && id !== null ? bookingTarget(item, id) : null;
}

/** Whether a card shows a booking of this trip still waiting for its confirmation, one the chat can confirm. */
function holdsPendingHere(card: BookingCard): boolean {
  return card.items.some((item) => item.tripTitle === null && item.status === 'pending');
}

/** The check-in day of an applied stay, where the planner's day head shows it. */
function stayDayOf(applied: AssistantApplied, card: TrekCard | null): number | null {
  const body = bookingItemOf(card)?.body;
  return (body?.shape === 'stay' ? body.checkIn?.day.id : null) ?? applied.dayId;
}

export const BOOKING_LOOK = {
  verbs: {
    addStay: { Icon: BedDouble, tone: 'success', labelKey: 'assistant.change.verb.addStay' },
    updateStay: { Icon: CalendarCog, tone: 'info', labelKey: 'assistant.change.verb.updateStay' },
    updateReservation: { Icon: Ticket, tone: 'info', labelKey: 'assistant.change.verb.updateReservation' },
  },
  tools: {
    set_reservation_travelers: { labelKey: 'assistant.tool.set_reservation_travelers' },
    link_hotel_accommodation: { labelKey: 'assistant.tool.link_hotel_accommodation' },
    update_transport: { labelKey: 'assistant.tool.update_transport' },
    delete_transport: { labelKey: 'assistant.tool.delete_transport' },
    delete_accommodation: { labelKey: 'assistant.tool.delete_accommodation' },
    reorder_reservations: { labelKey: 'assistant.tool.reorder_reservations' },
    import_airtrail_flights: { labelKey: 'assistant.tool.import_airtrail_flights' },
  },
  steps: {
    list_reservations: { stepKey: 'assistant.step.bookings' },
    list_accommodations: { stepKey: 'assistant.step.stays' },
    list_upcoming_reservations: { stepKey: 'assistant.step.upcoming' },
  },
  entities: {
    reservation: {
      Icon: Ticket,
      openLabelKey: 'assistant.card.booking.open',
      onMap: reservationOnMap,
      open: reservationOpen,
    },
    accommodation: {
      Icon: Hotel,
      openLabelKey: 'assistant.card.booking.openStay',
      onMap: (applied, card) => {
        const spot = bookingSpotOf(bookingItemOf(card));
        return spot ?? { placeId: null, dayId: applied.dayId };
      },
      open: (applied, card) => {
        const dayId = stayDayOf(applied, card);
        return dayId !== null ? { kind: 'map', placeId: null, dayId } : null;
      },
    },
  },
  cards: {
    booking: {
      // A stay no booking links is a stay; anything else is the booking.
      entity: (card) => {
        const item = bookingItemOf(card);
        return item?.body.shape === 'stay' && item.reservationId === null ? 'accommodation' : 'reservation';
      },
      followUps: [
        { id: 'bookingsOpen', labelKey: 'assistant.followUp.bookingsOpen' },
        { id: 'bookingsNights', labelKey: 'assistant.followUp.bookingsNights' },
        { id: 'bookingsConfirm', labelKey: 'assistant.followUp.bookingsConfirm', edits: true, when: holdsPendingHere },
      ],
    },
  },
} satisfies PackLook<'booking'>;
