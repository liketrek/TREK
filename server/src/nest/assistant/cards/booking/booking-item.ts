import { resolveTimeZone, wallClockInstant } from '../../../common/timezoneService';
import { clipped, clockOf, fileKeyOf, finite, isLat, isLng, recordOf, type Row } from '../card-values';
import { idOf, legsHaveReference, textOf, type BookingRow, type BookingScope, type StaySource } from './booking-row';
import { dateOf } from './booking-trip';
import {
  BOOKING_CHANGED_FIELDS,
  cardFileKeySchema,
  cardPhotoKeySchema,
  isTransportReservationType,
  LEG_RESERVATION_TYPES,
  RESERVATION_STATUSES,
  type BookingCard,
  type BookingChangedField,
  type BookingItem,
  type BookingLeg,
  type BookingStay,
  type BookingStop,
  type BookingTicket,
  type BookingVenue,
  type CardDay,
  type CardMoney,
  type CardPerson,
} from '@trek/shared';

/**
 * One booking as its card shows it, from a `BookingRow` and its scope. The
 * reference number is never copied, only that one exists; a price, a time or
 * a coordinate that does not read cleanly is left out rather than guessed. A
 * duration needs both ends' zones (stored, or from the coordinates): wall
 * clocks alone across zones would lie.
 */

const MAX_ITEMS = 8;
const MAX_STOPS = 9;
const MAX_TRAVELERS = 8;
const LEG_MAX_MINUTES = 10_080;
const TRIP_MAX_MINUTES = 20_160;
const STOP_CODE = /^[A-Z0-9]{2,5}$/;
const TYPE_KEY = /^[a-z_]{1,30}$/;
const CURRENCY = /^[A-Z]{3}$/;

/** A stop with what the card does not show but needs for the times: its zone and its local clock. */
interface RouteStop {
  stop: BookingStop;
  zone: string | null;
  localTime: unknown;
  localDate: string | null;
}

function coord(value: unknown, isValid: (n: number | null) => n is number): number | null {
  const n = finite(value);
  return isValid(n) ? n : null;
}

function typeOf(row: BookingRow): string {
  return typeof row.type === 'string' && TYPE_KEY.test(row.type) ? row.type : 'other';
}

function statusOf(row: BookingRow, type: string): BookingItem['status'] {
  const status = RESERVATION_STATUSES.find((known) => known === row.status);
  return status && type !== 'transit' ? status : null;
}

/** The stored price (`metadata.price`, text or number) in its currency, else the trip's. */
function priceOf(row: BookingRow, scope: BookingScope): CardMoney | null {
  if (row.price !== undefined) return row.price;
  const raw = row.meta.price;
  const amount = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9) return null;
  const own = row.meta.priceCurrency;
  const currency = typeof own === 'string' && CURRENCY.test(own) ? own : scope.currency;
  return currency && CURRENCY.test(currency) ? { amount, currency } : null;
}

/** The stored file name of an avatar; a picture on another host (a sign-in provider's) gives none. */
function avatarKeyOf(raw: unknown): string | null {
  if (typeof raw === 'string' && cardFileKeySchema.safeParse(raw).success) return raw;
  return fileKeyOf(raw);
}

export function travelersOf(rows: Row[]): { people: CardPerson[]; more: number } {
  const people = rows.flatMap((row): CardPerson[] => {
    const id = idOf(row.user_id);
    const name = clipped(row.username, 80);
    return id !== null && name !== null ? [{ id, name, avatarKey: avatarKeyOf(row.avatar) }] : [];
  });
  return { people: people.slice(0, MAX_TRAVELERS), more: Math.min(500, Math.max(0, people.length - MAX_TRAVELERS)) };
}

/** Whether the row has a confirmation of its own, on a leg or on its stay; never the value. */
function hasReference(row: BookingRow): boolean {
  return textOf(row.confirmation) !== null || legsHaveReference(row.meta) || row.stay?.hasReference === true;
}

/** A day by id where the row belongs to this trip, else by its date. */
function dayFor(row: BookingRow, scope: BookingScope, id: unknown, date: string | null): CardDay | null {
  if (row.tripId !== scope.tripId) return date ? { id: null, number: null, date } : null;
  return scope.day(id) ?? scope.dayOn(date);
}

/** The minutes from one wall clock to another, each in its zone; null without both ends or past `max`. */
function minutesBetween(
  from: { date: string | null; time: string | null; zone: string | null },
  to: { date: string | null; time: string | null; zone: string | null },
  max: number,
): number | null {
  if (!from.date || !from.time || !from.zone || !to.date || !to.time || !to.zone) return null;
  const start = wallClockInstant(from.date, from.time, from.zone);
  const end = wallClockInstant(to.date, to.time, to.zone);
  if (start === null || end === null) return null;
  const minutes = Math.round((end - start) / 60_000);
  return minutes > 0 && minutes <= max ? minutes : null;
}

function routeOf(endpoints: Row[]): RouteStop[] {
  const sorted = [...endpoints].sort((a, b) => (finite(a.sequence) ?? 0) - (finite(b.sequence) ?? 0));
  return sorted.flatMap((ep): RouteStop[] => {
    const name = clipped(ep.name, 80) ?? (typeof ep.code === 'string' ? clipped(ep.code, 80) : null);
    if (name === null) return [];
    const code = typeof ep.code === 'string' ? ep.code.trim().toUpperCase() : '';
    const lat = coord(ep.lat, isLat);
    const lng = coord(ep.lng, isLng);
    const zone = textOf(ep.timezone) ?? (lat !== null && lng !== null ? resolveTimeZone(lat, lng) : null);
    return [
      {
        stop: { name, code: STOP_CODE.test(code) ? code : null, lat, lng },
        zone,
        localTime: ep.local_time,
        localDate: dateOf(ep.local_date),
      },
    ];
  });
}

/** The stops a card shows: past nine, the first eight and the last. */
function shownStops(route: RouteStop[]): BookingStop[] {
  const stops = route.map((entry) => entry.stop);
  return stops.length > MAX_STOPS ? [...stops.slice(0, MAX_STOPS - 1), stops[stops.length - 1] as BookingStop] : stops;
}

function storedLegs(row: BookingRow, type: string, route: RouteStop[]): Row[] | null {
  const legs = Array.isArray(row.meta.legs) ? row.meta.legs.map(recordOf) : null;
  const hasLegs = (LEG_RESERVATION_TYPES as readonly string[]).includes(type);
  return hasLegs && legs && legs.length >= 1 && legs.length <= 8 && legs.length === route.length - 1 ? legs : null;
}

function legOf(
  row: BookingRow,
  scope: BookingScope,
  leg: Row,
  from: RouteStop | undefined,
  to: RouteStop | undefined,
  last: boolean,
): BookingLeg {
  const departs = clockOf(leg.dep_time);
  const arrives = clockOf(leg.arr_time);
  const departsDay = dayFor(row, scope, leg.dep_day_id, from?.localDate ?? null);
  const arrivesDay = dayFor(row, scope, leg.arr_day_id, last ? (to?.localDate ?? null) : null);
  return {
    carrier: clipped(leg.airline, 60),
    number: clipped(leg.flight_number ?? leg.train_number, 20),
    departs,
    departsDay,
    arrives,
    arrivesDay,
    minutes: minutesBetween(
      { date: departsDay?.date ?? null, time: departs, zone: from?.zone ?? null },
      { date: arrivesDay?.date ?? null, time: arrives, zone: to?.zone ?? null },
      LEG_MAX_MINUTES,
    ),
    seat: clipped(leg.seat, 20),
    platform: clipped(leg.platform, 20),
  };
}

/** The one leg of a direct booking, or of one whose segments do not line up with its stops. */
function singleLeg(row: BookingRow, scope: BookingScope, route: RouteStop[]): BookingLeg {
  const from = route[0];
  const to = route.length >= 2 ? route[route.length - 1] : undefined;
  const departs = clockOf(textOf(from?.localTime) ?? row.reservationTime);
  const arrives = clockOf(textOf(to?.localTime) ?? row.reservationEndTime);
  const departsDay = dayFor(
    row,
    scope,
    row.dayId,
    from?.localDate ?? dateOf(row.reservationTime) ?? dateOf(row.dayDate),
  );
  const arrivesDay = dayFor(row, scope, row.endDayId, to?.localDate ?? dateOf(row.reservationEndTime));
  return {
    carrier: clipped(row.meta.airline ?? row.meta.carrier, 60),
    number: clipped(row.meta.flight_number ?? row.meta.train_number, 20),
    departs,
    departsDay,
    arrives,
    arrivesDay,
    minutes: minutesBetween(
      { date: departsDay?.date ?? null, time: departs, zone: from?.zone ?? null },
      { date: arrivesDay?.date ?? null, time: arrives, zone: to?.zone ?? null },
      LEG_MAX_MINUTES,
    ),
    seat: clipped(row.meta.seat, 20),
    platform: clipped(row.meta.platform, 20),
  };
}

function ticketOf(row: BookingRow, scope: BookingScope, type: string): BookingTicket {
  const route = routeOf(row.endpoints);
  const stored = storedLegs(row, type, route);
  const legs = stored
    ? stored.map((leg, i) => legOf(row, scope, leg, route[i], route[i + 1], i === stored.length - 1))
    : [singleLeg(row, scope, route)];
  const first = legs[0] as BookingLeg;
  const last = legs[legs.length - 1] as BookingLeg;
  const located = route.filter((entry) => entry.stop.lat !== null && entry.stop.lng !== null).length;
  return {
    shape: 'ticket',
    stops: shownStops(route),
    legs,
    minutes: minutesBetween(
      { date: first.departsDay?.date ?? null, time: first.departs, zone: route[0]?.zone ?? null },
      { date: last.arrivesDay?.date ?? null, time: last.arrives, zone: route[route.length - 1]?.zone ?? null },
      TRIP_MAX_MINUTES,
    ),
    mappable: row.id !== null && located >= 2,
  };
}

function nightsOf(start: CardDay | null, end: CardDay | null): number | null {
  if (start?.number != null && end?.number != null) {
    const nights = end.number - start.number;
    return nights >= 0 && nights <= 366 ? nights : null;
  }
  if (start?.date && end?.date) {
    const span = Date.parse(`${end.date}T00:00:00Z`) - Date.parse(`${start.date}T00:00:00Z`);
    const nights = Math.round(span / 86_400_000);
    return Number.isFinite(nights) && nights >= 0 && nights <= 366 ? nights : null;
  }
  return null;
}

function photoKeyOf(value: unknown): string | null {
  return typeof value === 'string' && cardPhotoKeySchema.safeParse(value).success ? value : null;
}

function stayOf(row: BookingRow, scope: BookingScope, stay: StaySource | null): BookingStay {
  const placeId = stay?.placeId ?? null;
  const place = row.tripId === scope.tripId ? scope.place(placeId) : null;
  const start = stay ? dayFor(row, scope, stay.startDayId, stay.startDate) : null;
  const end = stay ? dayFor(row, scope, stay.endDayId, stay.endDate) : null;
  return {
    shape: 'stay',
    accommodationId: stay?.accommodationId ?? null,
    placeId,
    address: clipped(stay?.address ?? place?.address, 200),
    lat: coord(stay?.lat ?? place?.lat, isLat),
    lng: coord(stay?.lng ?? place?.lng, isLng),
    photoKey: photoKeyOf(stay?.photoKey ?? place?.googlePlaceId),
    checkIn: start ? { day: start, from: clockOf(stay?.checkIn), until: clockOf(stay?.checkInEnd) } : null,
    checkOut: end ? { day: end, by: clockOf(stay?.checkOut) } : null,
    nights: nightsOf(start, end),
  };
}

function venueOf(row: BookingRow, scope: BookingScope): BookingVenue {
  const local = row.tripId === scope.tripId;
  const placeId = idOf(row.placeId) ?? (local ? scope.assignmentPlace(row.assignmentId) : null);
  const place = local ? scope.place(placeId) : null;
  return {
    shape: 'venue',
    day: dayFor(row, scope, row.dayId, dateOf(row.reservationTime) ?? dateOf(row.dayDate)),
    starts: clockOf(row.reservationTime),
    ends: clockOf(row.reservationEndTime),
    location: clipped(row.location, 200) ?? clipped(row.placeName, 200) ?? clipped(place?.name, 200),
    placeId,
    lat: coord(place?.lat ?? row.point?.lat, isLat),
    lng: coord(place?.lng ?? row.point?.lng, isLng),
  };
}

/** The booking's card; null for one without a title (nor a place to name it by). */
export function bookingItemOf(
  row: BookingRow,
  scope: BookingScope,
  changed: readonly BookingChangedField[] = [],
): BookingItem | null {
  const type = typeOf(row);
  const title = clipped(row.title, 200) ?? (row.stay ? clipped(row.stay.name, 200) : null);
  if (title === null) return null;
  const { people, more } = travelersOf(row.travelers);
  const body = isTransportReservationType(type)
    ? ticketOf(row, scope, type)
    : type === 'hotel' || row.stay
      ? stayOf(row, scope, row.stay)
      : venueOf(row, scope);
  return {
    tripId: row.tripId,
    tripTitle: row.tripId === scope.tripId ? null : clipped(row.tripTitle, 120),
    reservationId: row.id,
    type,
    title,
    status: statusOf(row, type),
    needsReview: row.needsReview,
    hasReference: hasReference(row),
    price: priceOf(row, scope),
    travelers: people,
    moreTravelers: more,
    changed: [...changed],
    body,
  };
}

/** A card of up to eight bookings, the rest counted; null when none of them reads. */
export function bookingCard(
  change: BookingCard['change'],
  items: ReadonlyArray<BookingItem | null>,
  total?: number,
): BookingCard | null {
  const readable = items.filter((item): item is BookingItem => item !== null);
  if (readable.length === 0) return null;
  const shown = readable.slice(0, MAX_ITEMS);
  return { kind: 'booking', change, items: shown, more: Math.max(0, (total ?? readable.length) - shown.length) };
}

/** What a field of the card reads as, for telling a changed one from an unchanged one. */
function facet(item: BookingItem, field: BookingChangedField): unknown {
  const body = item.body;
  switch (field) {
    case 'title':
    case 'type':
    case 'status':
    case 'price':
      return item[field];
    case 'travelers':
      return item.travelers.map((person) => person.id).concat(item.moreTravelers);
    case 'reference':
      return item.hasReference;
    case 'day':
      if (body.shape === 'ticket') return body.legs.map((leg) => [leg.departsDay?.id, leg.departsDay?.date]);
      return body.shape === 'venue' ? [body.day?.id, body.day?.date] : null;
    case 'time':
      if (body.shape === 'ticket') return body.legs.map((leg) => [leg.departs, leg.arrives, leg.arrivesDay?.date]);
      return body.shape === 'venue' ? [body.starts, body.ends] : null;
    case 'route':
      return body.shape === 'ticket' ? body.stops.map((stop) => [stop.name, stop.code]) : null;
    case 'stay':
      return body.shape === 'stay' ? [body.placeId, body.checkIn?.day.id, body.checkOut?.day.id, body.nights] : null;
    case 'checkIn':
      return body.shape === 'stay' ? [body.checkIn?.from, body.checkIn?.until] : null;
    case 'checkOut':
      return body.shape === 'stay' ? (body.checkOut?.by ?? null) : null;
    case 'location':
      return body.shape === 'venue' ? [body.location, body.placeId] : null;
  }
}

/** The fields whose card value an update changes: the card before against the card after. */
export function changedBetween(before: BookingItem, after: BookingItem): BookingChangedField[] {
  return BOOKING_CHANGED_FIELDS.filter(
    (field) => JSON.stringify(facet(before, field)) !== JSON.stringify(facet(after, field)),
  );
}
