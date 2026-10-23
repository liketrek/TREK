import type { PreviewContext, ToolArgs } from '../card-types';
import { argId, finite, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { bookingCard, bookingItemOf, changedBetween } from './booking-item';
import { idOf, rowOfReservation, rowOfStay, scopeOfCard, type BookingRow, type StaySource } from './booking-row';
import { bookingRowOf, dateOf, stayRowOf } from './booking-trip';
import type { BookingCard, CardMoney, TrekCard } from '@trek/shared';

/**
 * The cards of held booking writes: what will be saved, drawn from the
 * call's arguments and the trip as this turn read it. A create shows the new
 * booking, an update the booking as it will read afterwards with the fields
 * that change marked, a removal the booking as it is. A write about a booking
 * the trip card does not hold draws no card; the row of words stays.
 */

const CURRENCY = /^[A-Z]{3}$/;

/** A stay moved to another place: what the old place named is dropped, so the new one's shows. */
const UNPLACED = { name: null, address: null, lat: null, lng: null, photoKey: null } as const;

/** A booking with nothing known yet, for a create to fill from its arguments. */
function blankRow(tripId: number): BookingRow {
  return {
    tripId,
    tripTitle: null,
    id: null,
    type: null,
    title: null,
    status: null,
    needsReview: false,
    confirmation: null,
    reservationTime: null,
    reservationEndTime: null,
    dayId: null,
    endDayId: null,
    dayDate: null,
    location: null,
    placeId: null,
    placeName: null,
    assignmentId: null,
    meta: {},
    endpoints: [],
    travelers: [],
    stay: null,
  };
}

function blankStay(): StaySource {
  return {
    accommodationId: null,
    placeId: null,
    startDayId: null,
    endDayId: null,
    startDate: null,
    endDate: null,
    checkIn: null,
    checkInEnd: null,
    checkOut: null,
    name: null,
    address: null,
    lat: null,
    lng: null,
    photoKey: null,
    hasReference: false,
  };
}

/** A price argument in its currency (the trip's unless the tool takes one). */
function argPrice(amount: unknown, currency: unknown, ctx: PreviewContext): CardMoney | null {
  const value = finite(amount);
  const code = typeof currency === 'string' ? currency.toUpperCase() : ctx.card.currency;
  if (value === null || value <= 0 || value > 1e9 || !code || !CURRENCY.test(code)) return null;
  return { amount: value, currency: code };
}

/** The plain-string metadata a transport tool takes. */
function stringsOf(value: unknown): Row {
  return Object.fromEntries(Object.entries(recordOf(value)).filter(([, inner]) => typeof inner === 'string'));
}

/** Endpoints as the tool will store them: a flight's code-only stop placed at its airport, as the tool does. */
function endpointsOf(ctx: PreviewContext, value: unknown): Row[] {
  return rowsOf(value).map((ep) => {
    if (finite(ep.lat) !== null && finite(ep.lng) !== null) return ep;
    const airport = typeof ep.code === 'string' ? ctx.airport(ep.code) : null;
    return airport ? { ...ep, lat: airport.lat, lng: airport.lng, timezone: ep.timezone ?? airport.tz } : ep;
  });
}

/** A transport write's arguments over the booking they change (a blank one for a create). */
function withTransportArgs(ctx: PreviewContext, base: BookingRow, args: ToolArgs): BookingRow {
  let meta = base.meta;
  if (args.metadata !== undefined) {
    // The tool replaces the metadata whole, but a price mirrored from an expense survives unless it is named.
    const { price, priceCurrency } = base.meta;
    meta = { ...(price !== undefined ? { price, priceCurrency } : {}), ...stringsOf(args.metadata) };
  }
  if (Array.isArray(args.legs)) meta = { ...meta, legs: rowsOf(args.legs) };
  return {
    ...base,
    type: args.type ?? base.type,
    title: args.title ?? base.title,
    status: args.status ?? base.status,
    dayId: args.start_day_id ?? base.dayId,
    endDayId: args.end_day_id ?? (base.id === null ? args.start_day_id : base.endDayId),
    reservationTime: args.reservation_time ?? base.reservationTime,
    reservationEndTime: args.reservation_end_time ?? base.reservationEndTime,
    confirmation: args.confirmation_number ?? base.confirmation,
    needsReview: typeof args.needs_review === 'boolean' ? args.needs_review : base.needsReview,
    meta,
    endpoints: args.endpoints !== undefined ? endpointsOf(ctx, args.endpoints) : base.endpoints,
    ...(args.price !== undefined ? { price: argPrice(args.price, null, ctx) } : {}),
  };
}

/** A booking write's arguments over the booking they change; a hotel's place is its stay's. */
function withBookingArgs(base: BookingRow, args: ToolArgs): BookingRow {
  const type = args.type ?? base.type;
  const row: BookingRow = {
    ...base,
    type,
    title: args.title ?? base.title,
    status: args.status ?? base.status,
    reservationTime: args.reservation_time ?? base.reservationTime,
    reservationEndTime: args.reservation_end_time ?? base.reservationEndTime,
    location: args.location ?? base.location,
    confirmation: args.confirmation_number ?? base.confirmation,
    assignmentId: args.assignment_id !== undefined ? args.assignment_id : base.assignmentId,
    // A hotel turned into another type no longer reads as a stay, whatever it still links.
    stay: type === 'hotel' ? base.stay : null,
  };
  if (args.place_id === undefined) return row;
  if (type !== 'hotel') return { ...row, placeId: args.place_id };
  return { ...row, stay: { ...(base.stay ?? blankStay()), ...UNPLACED, placeId: idOf(args.place_id) } };
}

function created(ctx: PreviewContext, row: BookingRow): BookingCard | null {
  return bookingCard('create', [bookingItemOf(row, scopeOfCard(ctx.card))]);
}

/** The update's card: the booking as it will read, every field whose card value changes marked. */
function updated(ctx: PreviewContext, before: BookingRow, after: BookingRow): BookingCard | null {
  const scope = scopeOfCard(ctx.card);
  const old = bookingItemOf(before, scope);
  const next = bookingItemOf(after, scope);
  if (!old || !next) return null;
  return bookingCard('update', [{ ...next, changed: changedBetween(old, next) }]);
}

function currentBooking(ctx: PreviewContext, args: ToolArgs): BookingRow | null {
  const raw = bookingRowOf(ctx.card, argId(args, 'reservationId'));
  return raw ? rowOfReservation(raw, ctx.card.tripId, ctx.card) : null;
}

function currentStay(ctx: PreviewContext, args: ToolArgs): BookingRow | null {
  const raw = stayRowOf(ctx.card, argId(args, 'accommodationId'));
  return raw ? rowOfStay(raw, ctx.card.tripId, ctx.card) : null;
}

function removed(ctx: PreviewContext, row: BookingRow | null): BookingCard | null {
  return row ? bookingCard('remove', [bookingItemOf(row, scopeOfCard(ctx.card))]) : null;
}

/** A stay from a stay tool's arguments: the place, the nights, the three times. */
function stayOfArgs(args: ToolArgs, base: StaySource = blankStay()): StaySource {
  return {
    ...base,
    placeId: argId(args, 'place_id') ?? base.placeId,
    startDayId: argId(args, 'start_day_id') ?? base.startDayId,
    endDayId: argId(args, 'end_day_id') ?? base.endDayId,
    checkIn: args.check_in ?? base.checkIn,
    checkInEnd: args.check_in_end ?? base.checkInEnd,
    checkOut: args.check_out ?? base.checkOut,
    hasReference: typeof args.confirmation === 'string' ? args.confirmation.trim() !== '' : base.hasReference,
  };
}

type ChangeBuilder = (ctx: PreviewContext, args: ToolArgs) => TrekCard | null;

export const BOOKING_CHANGE_CARDS: Readonly<Record<string, ChangeBuilder>> = {
  create_transport: (ctx, args) =>
    created(ctx, withTransportArgs(ctx, { ...blankRow(ctx.card.tripId), status: 'pending' }, args)),
  create_reservation: (ctx, args) => {
    const hotel =
      args.type === 'hotel' &&
      argId(args, 'place_id') !== null &&
      argId(args, 'start_day_id') !== null &&
      argId(args, 'end_day_id') !== null;
    const base: BookingRow = { ...blankRow(ctx.card.tripId), status: 'pending', type: args.type };
    const row = withBookingArgs(base, { ...args, place_id: hotel ? undefined : args.place_id });
    return created(ctx, {
      ...row,
      dayId: args.day_id,
      price: argPrice(args.price, null, ctx),
      stay: hotel ? stayOfArgs({ ...args, confirmation: args.confirmation_number }) : null,
    });
  },
  update_reservation: (ctx, args) => {
    const before = currentBooking(ctx, args);
    return before ? updated(ctx, before, withBookingArgs(before, args)) : null;
  },
  update_transport: (ctx, args) => {
    const before = currentBooking(ctx, args);
    return before ? updated(ctx, before, withTransportArgs(ctx, before, args)) : null;
  },
  delete_reservation: (ctx, args) => removed(ctx, currentBooking(ctx, args)),
  delete_transport: (ctx, args) => removed(ctx, currentBooking(ctx, args)),
  set_reservation_travelers: (ctx, args) => {
    const before = currentBooking(ctx, args);
    if (!before) return null;
    const ids = Array.isArray(args.user_ids) ? args.user_ids : [];
    // Somebody not on the trip is left out, as the tool leaves them out.
    const travelers = ids.flatMap((id: unknown) => {
      const person = typeof id === 'number' ? ctx.card.members.get(id) : undefined;
      return person ? [{ user_id: id, username: person.name, avatar: person.avatarKey }] : [];
    });
    return updated(ctx, before, { ...before, travelers });
  },
  link_hotel_accommodation: (ctx, args) => {
    const before = currentBooking(ctx, args);
    if (!before) return null;
    const stay = stayOfArgs(args, before.stay ?? blankStay());
    return updated(ctx, before, { ...before, stay: { ...stay, ...UNPLACED } });
  },
  create_accommodation: (ctx, args) => {
    const place = ctx.card.places.get(argId(args, 'place_id') ?? 0);
    if (!place) return null;
    return created(ctx, { ...blankRow(ctx.card.tripId), type: 'hotel', title: place.name, stay: stayOfArgs(args) });
  },
  create_place_accommodation: (ctx, args) =>
    created(ctx, {
      ...blankRow(ctx.card.tripId),
      type: 'hotel',
      title: args.name,
      price: argPrice(args.price, args.currency, ctx),
      stay: {
        ...stayOfArgs({ ...args, place_id: undefined }),
        name: args.name,
        address: args.address,
        lat: args.lat,
        lng: args.lng,
        photoKey: args.google_place_id,
      },
    }),
  update_accommodation: (ctx, args) => {
    const before = currentStay(ctx, args);
    if (!before?.stay) return null;
    const placeId = argId(args, 'place_id');
    const moved = placeId !== null && placeId !== before.stay.placeId;
    // Another place: its name, address and position come from the trip's place, not the old stay's.
    const base = moved ? { ...before.stay, ...UNPLACED } : before.stay;
    const title = moved ? (ctx.card.places.get(placeId)?.name ?? before.title) : before.title;
    return updated(ctx, before, { ...before, title, stay: stayOfArgs(args, base) });
  },
  delete_accommodation: (ctx, args) => removed(ctx, currentStay(ctx, args)),
};

/** A booking read from an attached file (a BookingImportPreviewItem), as it will be saved. */
export function importedBookingCard(ctx: PreviewContext, args: ToolArgs): TrekCard | null {
  const stay = recordOf(args._accommodation);
  const venue = recordOf(args._venue);
  const isStay = args.type === 'hotel' || args._accommodation !== undefined;
  const row: BookingRow = {
    ...blankRow(ctx.card.tripId),
    type: isStay ? 'hotel' : args.type,
    title: args.title,
    needsReview: args.needs_review === true,
    confirmation: args.confirmation_number,
    reservationTime: args.reservation_time,
    reservationEndTime: args.reservation_end_time,
    location: args.location ?? venue.name,
    meta: recordOf(args.metadata),
    endpoints: rowsOf(args.endpoints),
    point: { lat: venue.lat, lng: venue.lng },
    stay: isStay
      ? {
          ...blankStay(),
          startDate: dateOf(stay.check_in ?? args.reservation_time),
          endDate: dateOf(stay.check_out ?? args.reservation_end_time),
          checkIn: stay.check_in,
          checkOut: stay.check_out,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          hasReference: typeof stay.confirmation === 'string' && stay.confirmation.trim() !== '',
        }
      : null,
  };
  return created(ctx, row);
}
