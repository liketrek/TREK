import type { TripCard } from '../../assistant-context';
import { IMPORT_BOOKING_TOOL } from '../../assistant-tools.constants';
import type { DomainCards, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, idIn } from '../card-values';
import { BOOKING_ANSWERS } from './booking-answer';
import { appliedImport, appliedReservation, appliedStay, appliedTravelers } from './booking-applied';
import { BOOKING_CHANGE_CARDS, importedBookingCard } from './booking-change';
import { BOOKING_DESCRIBERS } from './booking-describe';
import { stayRowOf } from './booking-trip';
import { BOOKING_EFFECTS, BOOKING_UNDO } from './booking-undo';
import type { TrekCard } from '@trek/shared';

/**
 * The bookings in the assistant chat: tickets (flights, trains, hire cars),
 * stays and venues, as the planner's booking cards show them. Every booking
 * write and read gets its card; the curated writes name their own verb
 * ("Add accommodation" instead of a bare "Add") and the created ones can be
 * undone. The words and cards of `create_reservation` and of a file's
 * `import_booking` come from here too; the verb of a booking from a file stays
 * with the changes the server proposes itself (ASSISTANT_SERVER_WRITE_TOOLS).
 */

type ChangeOf = (ctx: PreviewContext, args: ToolArgs) => TrekCard | null;

const change = (tool: string): ChangeOf => BOOKING_CHANGE_CARDS[tool] ?? (() => null);

/** The stay an id argument names: its place, else the booking that links it. */
function stayName(key: string, value: number, card: TripCard): string | null {
  if (key !== 'accommodationId') return null;
  const stay = stayRowOf(card, value);
  return stay ? clipped(stay.place_name ?? stay.reservation_title, 160) : null;
}

/** The stay a stay write touched, by the key its answer names it under (the place and the stop come too). */
const stayIds = (_args: ToolArgs, result: unknown): number[] => {
  const id = idIn(result, 'accommodation');
  return id ? [id] : [];
};

const ADD_RESERVATION = { verbKey: 'addReservation', entity: 'reservation' } as const;
const ADD_STAY = { verbKey: 'addStay', entity: 'accommodation' } as const;
const UPDATE_RESERVATION = { verbKey: 'updateReservation', entity: 'reservation' } as const;

export const BOOKING_CARDS: DomainCards = {
  id: 'booking',
  prompt: [
    'Bookings and stays are drawn as cards beside your answer: do not repeat their times, route or reference. Read them with list_reservations (flight numbers, seats, check-in times) and list_accommodations; get_trip_summary leaves those details out.',
    'A hotel not yet in the trip: search_place, then create_place_accommodation; one that is: create_accommodation.',
  ],
  tools: {
    list_reservations: { answer: BOOKING_ANSWERS.list_reservations },
    list_accommodations: { answer: BOOKING_ANSWERS.list_accommodations },
    list_upcoming_reservations: { answer: BOOKING_ANSWERS.list_upcoming_reservations },
    create_reservation: {
      write: ADD_RESERVATION,
      describe: BOOKING_DESCRIBERS.create_reservation,
      change: change('create_reservation'),
      effect: BOOKING_EFFECTS.create_reservation,
      applied: appliedReservation,
      undo: BOOKING_UNDO.create_reservation,
    },
    create_transport: {
      write: ADD_RESERVATION,
      describe: BOOKING_DESCRIBERS.create_transport,
      change: change('create_transport'),
      applied: appliedReservation,
      undo: BOOKING_UNDO.create_transport,
    },
    update_reservation: {
      write: UPDATE_RESERVATION,
      describe: BOOKING_DESCRIBERS.update_reservation,
      change: change('update_reservation'),
      applied: appliedReservation,
    },
    update_transport: {
      write: UPDATE_RESERVATION,
      describe: BOOKING_DESCRIBERS.update_transport,
      change: change('update_transport'),
      applied: appliedReservation,
    },
    set_reservation_travelers: {
      write: UPDATE_RESERVATION,
      describe: BOOKING_DESCRIBERS.set_reservation_travelers,
      change: change('set_reservation_travelers'),
      applied: appliedTravelers,
      appliedIds: (args) => {
        const id = argId(args, 'reservationId');
        return id ? [id] : [];
      },
    },
    link_hotel_accommodation: {
      write: { verbKey: 'updateStay', entity: 'reservation' },
      describe: BOOKING_DESCRIBERS.link_hotel_accommodation,
      change: change('link_hotel_accommodation'),
      applied: appliedReservation,
    },
    delete_reservation: { change: change('delete_reservation') },
    delete_transport: { change: change('delete_transport') },
    create_accommodation: {
      write: ADD_STAY,
      describe: BOOKING_DESCRIBERS.create_accommodation,
      effect: BOOKING_EFFECTS.create_accommodation,
      change: change('create_accommodation'),
      applied: appliedStay,
      appliedIds: stayIds,
      undo: BOOKING_UNDO.create_accommodation,
    },
    create_place_accommodation: {
      write: ADD_STAY,
      describe: BOOKING_DESCRIBERS.create_place_accommodation,
      effect: BOOKING_EFFECTS.create_place_accommodation,
      change: change('create_place_accommodation'),
      applied: appliedStay,
      appliedIds: stayIds,
      undo: BOOKING_UNDO.create_place_accommodation,
    },
    update_accommodation: {
      write: { verbKey: 'updateStay', entity: 'accommodation' },
      describe: BOOKING_DESCRIBERS.update_accommodation,
      effect: BOOKING_EFFECTS.update_accommodation,
      change: change('update_accommodation'),
      applied: appliedStay,
      appliedIds: stayIds,
      nameArg: stayName,
    },
    delete_accommodation: { change: change('delete_accommodation'), nameArg: stayName },
    [IMPORT_BOOKING_TOOL]: {
      describe: BOOKING_DESCRIBERS[IMPORT_BOOKING_TOOL],
      change: importedBookingCard,
      applied: appliedImport,
    },
  },
};
