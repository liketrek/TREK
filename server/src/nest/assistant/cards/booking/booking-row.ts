import { RESERVATION_METADATA } from '../../../../db/json-columns';
import { decodeJson } from '../../../../utils/json-column';
import type { TripCard } from '../../assistant-context';
import { argId, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { bookingRowOf, dateOf, dayOf, dayOnDate, stayRowOf } from './booking-trip';
import type { BookingItem, CardDay, CardMoney } from '@trek/shared';

/**
 * Every booking card is drawn from one shape: a booking as the tools speak of
 * it, whatever told of it (a saved row, a summary row, an upcoming row, a
 * file's import, the arguments of a held write). `BookingScope` is what the
 * card can look up beside it: the trip card on a turn, or, for an applied
 * change (decided before any trip card is read), what the stored preview card
 * already named.
 */

/** A stay as a booking card reads it: the place, the nights, the times as stored. */
export interface StaySource {
  accommodationId: number | null;
  placeId: number | null;
  startDayId: number | null;
  endDayId: number | null;
  /** The dates when no day id is known (a file's import, another trip's row). */
  startDate: string | null;
  endDate: string | null;
  checkIn: unknown;
  checkInEnd: unknown;
  checkOut: unknown;
  name: unknown;
  address: unknown;
  lat: unknown;
  lng: unknown;
  /** A Google place id, for TREK's photo proxy. */
  photoKey: unknown;
  hasReference: boolean;
}

export interface BookingRow {
  tripId: number;
  /** Only for a row of another trip. */
  tripTitle: unknown;
  id: number | null;
  type: unknown;
  title: unknown;
  status: unknown;
  needsReview: boolean;
  confirmation: unknown;
  reservationTime: unknown;
  reservationEndTime: unknown;
  dayId: unknown;
  endDayId: unknown;
  /** The date of the booking's day, where only that is known. */
  dayDate: unknown;
  location: unknown;
  placeId: unknown;
  placeName: unknown;
  assignmentId: unknown;
  meta: Row;
  endpoints: Row[];
  travelers: Row[];
  stay: StaySource | null;
  /** A price the source names itself (a write's argument); undefined reads it from the metadata. */
  price?: CardMoney | null;
  /** Where a venue is when no trip place says so (a file's import names it). */
  point?: { lat: unknown; lng: unknown };
}

/** A place as a booking card completes a stay or a venue from it. */
interface ScopePlace {
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  googlePlaceId: string | null;
}

/** What a booking card looks up beside its source. */
export interface BookingScope {
  tripId: number;
  currency: string | null;
  day(id: unknown): CardDay | null;
  dayOn(date: string | null): CardDay | null;
  place(id: number | null): ScopePlace | null;
  assignmentPlace(id: unknown): number | null;
}

export function idOf(value: unknown): number | null {
  return argId({ value }, 'value');
}

/** The stay a booking links: stored as text, read back as `"14"` or `"14.0"` by older rows. */
export function accommodationIdOf(raw: Row): number | null {
  const value = raw.accommodation_id;
  return idOf(typeof value === 'string' ? Math.trunc(Number(value)) : value);
}

export function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** The scope of a turn: everything the trip card holds. */
export function scopeOfCard(card: TripCard): BookingScope {
  return {
    tripId: card.tripId,
    currency: card.currency,
    day: (id) => dayOf(card, id),
    dayOn: (date) => dayOnDate(card, date),
    place: (id) => (id === null ? null : (card.places.get(id) ?? null)),
    assignmentPlace: (id) => card.assignments.get(idOf(id) ?? 0)?.placeId ?? null,
  };
}

/** The days a stored card named, by id. */
function daysOfItems(items: readonly BookingItem[]): Map<number, CardDay> {
  const days = new Map<number, CardDay>();
  const add = (day: CardDay | null | undefined) => {
    if (day?.id != null && !days.has(day.id)) days.set(day.id, day);
  };
  for (const item of items) {
    const body = item.body;
    if (body.shape === 'ticket') {
      for (const leg of body.legs) {
        add(leg.departsDay);
        add(leg.arrivesDay);
      }
    } else if (body.shape === 'stay') {
      add(body.checkIn?.day);
      add(body.checkOut?.day);
    } else add(body.day);
  }
  return days;
}

/**
 * The scope of an applied change: the days its preview card named. A day
 * the preview did not name keeps its id alone, so the card still links it.
 */
export function scopeOfPreview(items: readonly BookingItem[], tripId: number): BookingScope {
  const days = daysOfItems(items);
  const first = items[0];
  return {
    tripId,
    currency: first?.price?.currency ?? null,
    day: (id) => {
      const known = idOf(id);
      return known === null ? null : (days.get(known) ?? { id: known, number: null, date: null });
    },
    dayOn: (date) => (date === null ? null : { id: null, number: null, date }),
    place: () => null,
    assignmentPlace: () => null,
  };
}

/** A booking's metadata: the readable details of a `list_reservations` row, else the stored column. */
function metaOf(raw: Row): Row {
  if (raw.details && typeof raw.details === 'object') return recordOf(raw.details);
  return typeof raw.metadata === 'string' ? decodeJson(RESERVATION_METADATA, raw.metadata) : recordOf(raw.metadata);
}

/**
 * The stay a hotel booking links, completed from the trip's own stay row where
 * the trip card has it. Another type reads as itself even while it still links
 * the stay it had as a hotel.
 */
function linkedStay(raw: Row, meta: Row, card: TripCard | null): StaySource | null {
  if (raw.type !== 'hotel') return null;
  const accommodationId = accommodationIdOf(raw);
  const placeId = idOf(raw.accommodation_place_id) ?? idOf(raw.place_id);
  const stay = card ? stayRowOf(card, accommodationId) : null;
  return {
    accommodationId,
    placeId: idOf(stay?.place_id) ?? placeId,
    startDayId: idOf(stay?.start_day_id) ?? idOf(raw.accommodation_start_day_id),
    endDayId: idOf(stay?.end_day_id) ?? idOf(raw.accommodation_end_day_id),
    startDate: null,
    endDate: null,
    checkIn: stay?.check_in ?? meta.check_in_time,
    checkInEnd: stay?.check_in_end ?? meta.check_in_end_time,
    checkOut: stay?.check_out ?? meta.check_out_time,
    name: stay?.place_name ?? raw.accommodation_name,
    address: stay?.place_address,
    lat: stay?.place_lat,
    lng: stay?.place_lng,
    photoKey: null,
    hasReference: textOf(stay?.confirmation) !== null,
  };
}

/** A saved booking: a summary row, a `list_reservations` row or what a write answered. */
export function rowOfReservation(raw: Row, tripId: number, card: TripCard | null = null): BookingRow {
  const meta = metaOf(raw);
  return {
    tripId: idOf(raw.trip_id) ?? tripId,
    tripTitle: null,
    id: idOf(raw.id),
    type: raw.type,
    title: raw.title,
    status: raw.status,
    needsReview: raw.needs_review === 1 || raw.needs_review === true,
    confirmation: raw.confirmation_number,
    reservationTime: raw.reservation_time,
    reservationEndTime: raw.reservation_end_time,
    dayId: raw.day_id,
    endDayId: raw.end_day_id,
    dayDate: null,
    location: raw.location,
    placeId: raw.type === 'hotel' ? null : raw.place_id,
    placeName: raw.place_name,
    assignmentId: raw.assignment_id,
    meta,
    endpoints: rowsOf(raw.endpoints),
    travelers: rowsOf(raw.travelers),
    stay: linkedStay(raw, meta, card),
  };
}

/** The booking of this trip that links a stay, from the trip card. */
function bookingOfStay(card: TripCard | null, accommodationId: number | null): Row | null {
  if (!card || accommodationId === null) return null;
  const summary = recordOf(recordOf(card.sources).summary);
  const found = rowsOf(summary.reservations).find((row) => accommodationIdOf(row) === accommodationId);
  return found ? (bookingRowOf(card, idOf(found.id)) ?? found) : null;
}

/** The price a place created with its stay carries, as booking metadata reads it. */
function placePrice(place: Row | null): Row {
  return place && place.price != null ? { price: place.price, priceCurrency: place.currency } : {};
}

/**
 * A stay: an accommodation row with its place joined (`list_accommodations`,
 * the summary, what a write answered). `place` overrides the joined place
 * (a place created with the stay). The booking linking it gives the status.
 */
export function rowOfStay(
  raw: Row,
  tripId: number,
  card: TripCard | null = null,
  place: Row | null = null,
): BookingRow {
  const accommodationId = idOf(raw.id);
  const booking = bookingOfStay(card, accommodationId);
  return {
    tripId: idOf(raw.trip_id) ?? tripId,
    tripTitle: null,
    id: idOf(booking?.id),
    type: 'hotel',
    title: raw.reservation_title ?? booking?.title ?? place?.name ?? raw.place_name,
    status: booking?.status ?? null,
    needsReview: booking?.needs_review === 1 || booking?.needs_review === true,
    confirmation: booking?.confirmation_number,
    reservationTime: null,
    reservationEndTime: null,
    dayId: null,
    endDayId: null,
    dayDate: null,
    location: null,
    placeId: null,
    placeName: null,
    assignmentId: null,
    meta: { ...placePrice(place), ...(booking ? metaOf(booking) : {}) },
    endpoints: [],
    travelers: booking ? rowsOf(booking.travelers) : [],
    stay: {
      accommodationId,
      placeId: idOf(place?.id) ?? idOf(raw.place_id),
      startDayId: idOf(raw.start_day_id),
      endDayId: idOf(raw.end_day_id),
      startDate: null,
      endDate: null,
      checkIn: raw.check_in,
      checkInEnd: raw.check_in_end,
      checkOut: raw.check_out,
      name: place?.name ?? raw.place_name,
      address: place?.address ?? raw.place_address,
      lat: place?.lat ?? raw.place_lat,
      lng: place?.lng ?? raw.place_lng,
      photoKey: place?.google_place_id ?? null,
      hasReference: textOf(raw.confirmation) !== null,
    },
  };
}

/**
 * A row of `list_upcoming_reservations`, which spans every trip: no endpoints
 * and no metadata; a stay comes as its check-in or its check-out moment.
 */
export function rowOfUpcoming(raw: Row, tripId: number): BookingRow {
  const moment = raw.type === 'checkin' || raw.type === 'checkout' ? raw.type : null;
  const date = dateOf(raw.day_date) ?? dateOf(raw.reservation_time);
  const rowTrip = idOf(raw.trip_id) ?? tripId;
  return {
    tripId: rowTrip,
    tripTitle: rowTrip === tripId ? null : raw.trip_title,
    id: moment ? null : idOf(raw.id),
    type: moment ? 'hotel' : raw.type,
    title: raw.title,
    status: moment ? null : raw.status,
    needsReview: false,
    confirmation: raw.confirmation_number,
    reservationTime: raw.reservation_time,
    reservationEndTime: null,
    dayId: null,
    endDayId: null,
    dayDate: date,
    location: raw.location ?? raw.place_name,
    placeId: null,
    placeName: null,
    assignmentId: null,
    meta: {},
    endpoints: [],
    travelers: [],
    stay: moment
      ? {
          accommodationId: idOf(raw.id),
          placeId: null,
          startDayId: null,
          endDayId: null,
          startDate: moment === 'checkin' ? date : null,
          endDate: moment === 'checkout' ? date : null,
          checkIn: moment === 'checkin' ? raw.reservation_time : null,
          checkInEnd: null,
          checkOut: moment === 'checkout' ? raw.reservation_time : null,
          name: raw.place_name,
          address: null,
          lat: null,
          lng: null,
          photoKey: null,
          hasReference: false,
        }
      : null,
  };
}

/** Whether a booking's legs carry a reference of their own (`list_reservations` says so without the value). */
export function legsHaveReference(meta: Row): boolean {
  if (meta.has_leg_reference === true) return true;
  return (
    Array.isArray(meta.legs) && meta.legs.some((leg: unknown) => textOf(recordOf(leg).confirmation_number) !== null)
  );
}
