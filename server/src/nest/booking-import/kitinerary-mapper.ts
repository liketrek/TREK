import { findByIata } from '../airports/airports.data';
import type {
  KiReservation,
  KiFlight,
  KiStation,
  KiTrainTrip,
  KiBusTrip,
  KiBoatTrip,
  KiLodgingBusiness,
  KiFoodEstablishment,
  KiRentalCar,
  KiEvent,
  KiGeo,
  KiAddress,
  KiDateTimeish,
  ParsedBookingItem,
  ParsedEndpoint,
  ParsedVenue,
} from './kitinerary.types';
import {
  haversineMetres,
  LEG_RESERVATION_TYPES,
  normalizeLocalDateTime,
  splitLocalDateTime,
  sumMinor,
  toMinor,
} from '@trek/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a plain ISO string from either a string or a KDE QDateTime object.
 *
 * The value passes through normalizeLocalDateTime so a printed 12-hour clock
 * ("2026-06-11T02:30 PM") becomes 24-hour before anything downstream reads it.
 * These two functions are the mapper's only exits for a date, so this covers
 * every type and every emitted field at once, and it keeps `sameConnection`
 * from comparing a NaN timestamp (#2094).
 */
function toIsoString(dt: KiDateTimeish): string | null {
  if (!dt) return null;
  if (typeof dt === 'string') return dt ? normalizeLocalDateTime(dt) : null;
  if (typeof dt === 'object' && dt['@type'] === 'QDateTime') {
    return dt['@value'] ? normalizeLocalDateTime(dt['@value']) : null;
  }
  return null;
}

function splitIso(dt: KiDateTimeish): { date: string | null; time: string | null } {
  const iso = toIsoString(dt);
  if (!iso) return { date: null, time: null };
  const split = splitLocalDateTime(iso);
  // The slice is the fallback for anything the normalizer does not recognise,
  // so a shape that works today cannot start returning null.
  if (split.date) return split;
  return { date: iso.slice(0, 10) || null, time: iso.length > 10 ? iso.slice(11, 16) || null : null };
}

function formatAddress(address: string | KiAddress | undefined): string | null {
  if (!address) return null;
  if (typeof address === 'string') return address || null;
  const joined = [address.streetAddress, address.addressLocality, address.postalCode, address.addressCountry]
    .filter(Boolean)
    .join(', ');
  return joined || null;
}

function coords(geo: KiGeo | undefined): { lat: number; lng: number } | null {
  if (!geo || geo.latitude == null || geo.longitude == null) return null;
  return { lat: Number(geo.latitude), lng: Number(geo.longitude) };
}

// ---------------------------------------------------------------------------
// Type mappers
// ---------------------------------------------------------------------------

function mapFlight(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const f = r.reservationFor as KiFlight | undefined;
  if (!f) return null;

  const depIata = f.departureAirport?.iataCode?.toUpperCase() ?? null;
  const arrIata = f.arrivalAirport?.iataCode?.toUpperCase() ?? null;
  const depAp = depIata ? findByIata(depIata) : null;
  const arrAp = arrIata ? findByIata(arrIata) : null;

  const depLabel = depAp
    ? depAp.city
      ? `${depAp.city} (${depAp.iata})`
      : depAp.name
    : (f.departureAirport?.name ?? depIata ?? 'Unknown');
  const arrLabel = arrAp
    ? arrAp.city
      ? `${arrAp.city} (${arrAp.iata})`
      : arrAp.name
    : (f.arrivalAirport?.name ?? arrIata ?? 'Unknown');

  const airline = f.airline?.name ?? f.airline?.iataCode ?? '';
  const flightNum = f.flightNumber ?? '';
  const title = [airline, flightNum].filter(Boolean).join(' ') || `Flight ${depLabel} → ${arrLabel}`;

  const { date: depDate, time: depTime } = splitIso(f.departureTime);
  const { date: arrDate, time: arrTime } = splitIso(f.arrivalTime);

  const endpoints: ParsedEndpoint[] = [];
  if (depAp) {
    endpoints.push({
      role: 'from',
      sequence: 0,
      name: depLabel,
      code: depAp.iata,
      lat: depAp.lat,
      lng: depAp.lng,
      timezone: depAp.tz,
      local_time: depTime,
      local_date: depDate,
    });
  } else {
    const c = coords(f.departureAirport?.geo);
    if (c)
      endpoints.push({
        role: 'from',
        sequence: 0,
        name: depLabel,
        code: depIata,
        lat: c.lat,
        lng: c.lng,
        timezone: null,
        local_time: depTime,
        local_date: depDate,
      });
  }
  if (arrAp) {
    endpoints.push({
      role: 'to',
      sequence: 1,
      name: arrLabel,
      code: arrAp.iata,
      lat: arrAp.lat,
      lng: arrAp.lng,
      timezone: arrAp.tz,
      local_time: arrTime,
      local_date: arrDate,
    });
  } else {
    const c = coords(f.arrivalAirport?.geo);
    if (c)
      endpoints.push({
        role: 'to',
        sequence: 1,
        name: arrLabel,
        code: arrIata,
        lat: c.lat,
        lng: c.lng,
        timezone: null,
        local_time: arrTime,
        local_date: arrDate,
      });
  }

  return {
    type: 'flight',
    title,
    reservation_time: toIsoString(f.departureTime),
    reservation_end_time: toIsoString(f.arrivalTime),
    confirmation_number: r.reservationNumber ?? null,
    metadata: {
      ...(airline ? { airline } : {}),
      ...(flightNum ? { flight_number: flightNum } : {}),
      ...(depIata ? { departure_airport: depIata } : {}),
      ...(arrIata ? { arrival_airport: arrIata } : {}),
    },
    endpoints,
    needs_review: endpoints.length < 2,
    source,
  };
}

/** The longest layover that still makes one journey, as AirTrail's import joins legs. */
const MAX_LAYOVER_MS = 24 * 3600 * 1000;

/** Two stations this close are one place, however each segment of the ticket spells its name. */
const SAME_STATION_METRES = 500;

/** Epoch ms of a kitinerary time, NaN when it is missing or cannot be read. */
function instantMs(dt: KiDateTimeish): number {
  const iso = toIsoString(dt);
  return iso ? new Date(iso).getTime() : Number.NaN;
}

/** Where a segment leaves from or arrives at: an airport's IATA code, a station's name, and its position when known. */
interface HopPlace {
  key: string | null;
  geo: { lat: number; lng: number } | null;
}

/** One segment of a journey, reduced to what tells whether the next one continues it. */
interface Hop {
  from: HopPlace;
  to: HopPlace;
  departureTime: KiDateTimeish;
  arrivalTime: KiDateTimeish;
}

function samePlace(a: HopPlace, b: HopPlace): boolean {
  if (a.key && a.key === b.key) return true;
  return !!a.geo && !!b.geo && haversineMetres(a.geo.lat, a.geo.lng, b.geo.lat, b.geo.lng) <= SAME_STATION_METRES;
}

/**
 * True when segment `next` continues the `chain` of connecting segments. It has
 * to leave from where the chain's last segment arrived, must not arrive anywhere
 * the chain has already been (that is a return, however soon it runs), and has
 * to leave within a day. The day is counted from the last segment's arrival, or
 * from its departure when no arrival is known (an AI import often has none).
 * A missing or unreadable departure fails both comparisons: two segments whose
 * order cannot be told apart stay two bookings, where a guess had folded a
 * return days earlier into the outbound one (#2653).
 */
function continuesChain(chain: Hop[], next: Hop): boolean {
  const last = chain[chain.length - 1];
  if (!samePlace(last.to, next.from)) return false;
  const visited = [chain[0].from, ...chain.map((hop) => hop.to)];
  if (visited.some((place) => samePlace(place, next.to))) return false;
  const arrived = instantMs(last.arrivalTime);
  const from = Number.isNaN(arrived) ? instantMs(last.departureTime) : arrived;
  const gapMs = instantMs(next.departureTime) - from;
  return gapMs >= 0 && gapMs <= MAX_LAYOVER_MS;
}

function flightHop(r: KiReservation): Hop | null {
  const f = r.reservationFor as KiFlight | undefined;
  if (!f) return null;
  const airport = (ap: KiFlight['departureAirport']): HopPlace => ({
    key: ap?.iataCode?.toUpperCase() ?? null,
    geo: null,
  });
  return {
    from: airport(f.departureAirport),
    to: airport(f.arrivalAirport),
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
  };
}

/** Collapse several connecting flight legs (same PNR) into one multi-leg booking. */
function mapFlightGroup(legs: KiReservation[], source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const flights = legs.map((l) => l.reservationFor as KiFlight | undefined);
  if (flights.some((f) => !f)) return mapFlight(legs[0], source); // malformed → fall back to single
  const fs = flights as KiFlight[];

  const iataOf = (ap: KiFlight['departureAirport']) => ap?.iataCode?.toUpperCase() ?? null;
  const makeEndpoint = (
    ap: KiFlight['departureAirport'],
    role: 'from' | 'stop' | 'to',
    time: string | null,
    date: string | null,
  ): ParsedEndpoint | null => {
    const iata = iataOf(ap);
    const found = iata ? findByIata(iata) : null;
    const label = found ? (found.city ? `${found.city} (${found.iata})` : found.name) : (ap?.name ?? iata ?? 'Unknown');
    if (found)
      return {
        role,
        sequence: 0,
        name: label,
        code: found.iata,
        lat: found.lat,
        lng: found.lng,
        timezone: found.tz,
        local_time: time,
        local_date: date,
      };
    const c = coords(ap?.geo);
    if (c)
      return {
        role,
        sequence: 0,
        name: label,
        code: iata,
        lat: c.lat,
        lng: c.lng,
        timezone: null,
        local_time: time,
        local_date: date,
      };
    return null;
  };

  const endpoints: ParsedEndpoint[] = [];
  const metaLegs: Record<string, unknown>[] = [];
  const first = fs[0];
  const firstDep = splitIso(first.departureTime);
  const originEp = makeEndpoint(first.departureAirport, 'from', firstDep.time, firstDep.date);
  if (originEp) endpoints.push(originEp);

  // A stop carries the onward departure, as the planner form saves one; the
  // landing there stays in the leg's arr_time.
  fs.forEach((f, i) => {
    const isLast = i === fs.length - 1;
    const arr = splitIso(f.arrivalTime);
    const onward = isLast ? arr : splitIso(fs[i + 1].departureTime);
    const arrEp = makeEndpoint(f.arrivalAirport, isLast ? 'to' : 'stop', onward.time, onward.date);
    if (arrEp) endpoints.push(arrEp);
    const airline = f.airline?.name ?? f.airline?.iataCode ?? '';
    metaLegs.push({
      from: iataOf(f.departureAirport),
      to: iataOf(f.arrivalAirport),
      ...(airline ? { airline } : {}),
      ...(f.flightNumber ? { flight_number: f.flightNumber } : {}),
      dep_time: splitIso(f.departureTime).time,
      arr_time: arr.time,
    });
  });
  endpoints.forEach((e, i) => {
    e.sequence = i;
  });

  const last = fs[fs.length - 1];
  const airline = first.airline?.name ?? first.airline?.iataCode ?? '';
  const route = [iataOf(first.departureAirport), ...fs.map((f) => iataOf(f.arrivalAirport))]
    .filter(Boolean)
    .join(' → ');
  return {
    type: 'flight',
    title: airline ? `${airline} ${route}` : `Flight ${route}`,
    reservation_time: toIsoString(first.departureTime),
    reservation_end_time: toIsoString(last.arrivalTime),
    confirmation_number: legs[0].reservationNumber ?? null,
    metadata: {
      ...(airline ? { airline } : {}),
      ...(first.flightNumber ? { flight_number: first.flightNumber } : {}),
      ...(iataOf(first.departureAirport) ? { departure_airport: iataOf(first.departureAirport) } : {}),
      ...(iataOf(last.arrivalAirport) ? { arrival_airport: iataOf(last.arrivalAirport) } : {}),
      legs: metaLegs,
    },
    endpoints,
    needs_review: endpoints.length < fs.length + 1,
    source,
  };
}

/** A train, bus or boat segment under the names all three share. */
interface GroundSegment {
  from?: KiStation;
  to?: KiStation;
  departureTime?: KiDateTimeish;
  arrivalTime?: KiDateTimeish;
  /** The train or bus number, or a boat's name. */
  id: string;
}

interface GroundKind {
  type: 'train' | 'bus' | 'cruise';
  read: (trip: Record<string, unknown>) => GroundSegment;
  title: (id: string, route: string) => string;
  /** Where the segment's id is kept in the metadata; a boat's name is its title instead. */
  idKey?: 'train_number' | 'bus_number';
}

// A Map, not an object literal: the key is the document's own @type, and
// "constructor" must not find anything.
const GROUND_KINDS = new Map<string, GroundKind>([
  [
    'TrainReservation',
    {
      type: 'train',
      read: (trip) => {
        const t = trip as KiTrainTrip;
        return {
          from: t.departureStation,
          to: t.arrivalStation,
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          id: t.trainNumber ?? t.trainName ?? '',
        };
      },
      title: (id, route) => (id ? `${id} (${route})` : `Train ${route}`),
      idKey: 'train_number',
    },
  ],
  [
    'BusReservation',
    {
      type: 'bus',
      read: (trip) => {
        const b = trip as KiBusTrip;
        return {
          from: b.departureBusStop,
          to: b.arrivalBusStop,
          departureTime: b.departureTime,
          arrivalTime: b.arrivalTime,
          id: b.busNumber ?? b.busName ?? '',
        };
      },
      title: (id, route) => (id ? `${id} (${route})` : `Bus ${route}`),
      idKey: 'bus_number',
    },
  ],
  [
    'BoatReservation',
    {
      type: 'cruise',
      read: (trip) => {
        const b = trip as KiBoatTrip;
        return {
          from: b.departureBoatTerminal,
          to: b.arrivalBoatTerminal,
          departureTime: b.departureTime,
          arrivalTime: b.arrivalTime,
          id: b.name ?? '',
        };
      },
      title: (id, route) => id || `Cruise ${route}`,
    },
  ],
]);

/** The types whose bookings carry one entry per segment in metadata.legs. */
const LEG_TYPES: readonly string[] = LEG_RESERVATION_TYPES;

function stationPlace(stop: KiStation | undefined): HopPlace {
  return { key: stop?.name?.trim().toLowerCase() || null, geo: coords(stop?.geo) };
}

function groundHop(kind: GroundKind, r: KiReservation): Hop | null {
  if (!r.reservationFor) return null;
  const s = kind.read(r.reservationFor);
  return {
    from: stationPlace(s.from),
    to: stationPlace(s.to),
    departureTime: s.departureTime,
    arrivalTime: s.arrivalTime,
  };
}

/** A named stop as an endpoint, with or without coordinates: preview() geocodes the rest (#1969). */
function stationEndpoint(
  stop: KiStation | undefined,
  role: ParsedEndpoint['role'],
  sequence: number,
  dt: KiDateTimeish,
): ParsedEndpoint | null {
  if (!stop?.name) return null;
  const c = coords(stop.geo);
  const { date, time } = splitIso(dt);
  return {
    role,
    sequence,
    name: stop.name,
    code: null,
    lat: c?.lat ?? null,
    lng: c?.lng ?? null,
    timezone: null,
    local_time: time,
    local_date: date,
  };
}

const isEndpoint = (e: ParsedEndpoint | null): e is ParsedEndpoint => e !== null;

function mapGround(r: KiReservation, kind: GroundKind, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  if (!r.reservationFor) return null;
  const s = kind.read(r.reservationFor);
  const route = `${s.from?.name ?? 'Unknown'} → ${s.to?.name ?? 'Unknown'}`;
  const endpoints = [
    stationEndpoint(s.from, 'from', 0, s.departureTime),
    stationEndpoint(s.to, 'to', 1, s.arrivalTime),
  ].filter(isEndpoint);

  return {
    type: kind.type,
    title: kind.title(s.id, route),
    reservation_time: toIsoString(s.departureTime),
    reservation_end_time: toIsoString(s.arrivalTime),
    confirmation_number: r.reservationNumber ?? null,
    ...(kind.idKey && s.id ? { metadata: { [kind.idKey]: s.id } } : {}),
    endpoints,
    needs_review: endpoints.length < 2,
    source,
  };
}

/**
 * Several connecting segments of one ticket as one booking with stops, the
 * shape the planner form saves a train with changes in (#2895). A stop's
 * endpoint carries the onward departure, as the form writes it; each segment's
 * own times, number, platform and seat go into metadata.legs.
 */
function mapGroundGroup(
  nodes: KiReservation[],
  kind: GroundKind,
  source: ParsedBookingItem['source'],
): ParsedBookingItem | null {
  const segments = nodes.map((node) => kind.read(node.reservationFor ?? {}));
  const first = segments[0];
  const last = segments[segments.length - 1];
  const endpoints = [
    stationEndpoint(first.from, 'from', 0, first.departureTime),
    ...segments.map((s, i) =>
      s === last
        ? stationEndpoint(s.to, 'to', i + 1, s.arrivalTime)
        : stationEndpoint(s.to, 'stop', i + 1, segments[i + 1].departureTime),
    ),
  ].filter(isEndpoint);
  endpoints.forEach((e, i) => {
    e.sequence = i;
  });

  const legs = segments.map((s, i) => {
    const detail = segmentDetail(nodes[i]);
    return {
      from: s.from?.name ?? null,
      to: s.to?.name ?? null,
      ...(kind.idKey && s.id ? { [kind.idKey]: s.id } : {}),
      ...(detail.platform != null ? { platform: detail.platform } : {}),
      ...(detail.seat != null ? { seat: detail.seat } : {}),
      dep_time: splitIso(s.departureTime).time,
      arr_time: splitIso(s.arrivalTime).time,
    };
  });

  return {
    type: kind.type,
    title: kind.title('', `${first.from?.name ?? 'Unknown'} → ${last.to?.name ?? 'Unknown'}`),
    reservation_time: toIsoString(first.departureTime),
    reservation_end_time: toIsoString(last.arrivalTime),
    confirmation_number: nodes[0].reservationNumber ?? null,
    metadata: {
      ...(kind.idKey && first.id ? { [kind.idKey]: first.id } : {}),
      legs,
    },
    endpoints,
    needs_review: endpoints.length < segments.length + 1,
    source,
  };
}

function mapLodging(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const l = r.reservationFor as KiLodgingBusiness | undefined;
  if (!l?.name) return null;

  const c = coords(l.geo);
  const venue: ParsedVenue = {
    name: l.name,
    ...(c ?? {}),
    address: formatAddress(l.address) ?? undefined,
    website: l.url ?? undefined,
    phone: l.telephone ?? undefined,
  };

  const { date: checkInDate, time: checkInTime } = splitIso(r.checkinTime);
  const { date: checkOutDate, time: checkOutTime } = splitIso(r.checkoutTime);
  const checkIn = checkInDate ? `${checkInDate}${checkInTime ? `T${checkInTime}` : ''}` : undefined;
  const checkOut = checkOutDate ? `${checkOutDate}${checkOutTime ? `T${checkOutTime}` : ''}` : undefined;

  return {
    type: 'hotel',
    // Only the lodging path can carry this: it is the shape the extractor falls
    // back to when it could not read a type at all (#2076).
    ...(r.trekTypeGuessed === true ? { type_guessed: true } : {}),
    title: l.name,
    confirmation_number: r.reservationNumber ?? null,
    location: formatAddress(l.address),
    _venue: venue,
    _accommodation: { check_in: checkIn, check_out: checkOut, confirmation: r.reservationNumber ?? undefined },
    metadata: {
      ...(checkInTime ? { check_in_time: checkInTime } : {}),
      ...(checkOutTime ? { check_out_time: checkOutTime } : {}),
    },
    source,
  };
}

function mapFood(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const f = r.reservationFor as KiFoodEstablishment | undefined;
  if (!f?.name) return null;

  const c = coords(f.geo);
  const venue: ParsedVenue = {
    name: f.name,
    ...(c ?? {}),
    address: formatAddress(f.address) ?? undefined,
    website: f.url ?? undefined,
    phone: f.telephone ?? undefined,
  };

  return {
    type: 'restaurant',
    title: f.name,
    reservation_time: toIsoString(r.startTime),
    reservation_end_time: toIsoString(r.endTime),
    confirmation_number: r.reservationNumber ?? null,
    location: formatAddress(f.address),
    _venue: venue,
    source,
  };
}

function mapRentalCar(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const car = r.reservationFor as KiRentalCar | undefined;
  const company = car?.rentalCompany?.name ?? '';
  const carName = car?.name ?? [car?.make, car?.model].filter(Boolean).join(' ') ?? '';
  const title = [company, carName].filter(Boolean).join(' — ') || 'Rental Car';

  const pickup = r.pickupLocation as KiReservation['pickupLocation'];
  const dropoff = r.dropoffLocation as KiReservation['dropoffLocation'];
  const pc = coords(pickup?.geo);
  const drc = coords(dropoff?.geo);
  const venue: ParsedVenue | undefined = pickup?.name
    ? { name: pickup.name, ...(pc ?? {}), address: formatAddress(pickup.address) ?? undefined }
    : undefined;

  // Pickup → return as from/to endpoints (coords optional; preview() geocodes).
  const { date: puDate, time: puTime } = splitIso(r.pickupTime);
  const { date: doDate, time: doTime } = splitIso(r.dropoffTime);
  const endpoints: ParsedEndpoint[] = [];
  if (pickup?.name)
    endpoints.push({
      role: 'from',
      sequence: 0,
      name: pickup.name,
      code: null,
      lat: pc?.lat ?? null,
      lng: pc?.lng ?? null,
      timezone: null,
      local_time: puTime,
      local_date: puDate,
    });
  if (dropoff?.name)
    endpoints.push({
      role: 'to',
      sequence: 1,
      name: dropoff.name,
      code: null,
      lat: drc?.lat ?? null,
      lng: drc?.lng ?? null,
      timezone: null,
      local_time: doTime,
      local_date: doDate,
    });

  return {
    type: 'car',
    title,
    reservation_time: toIsoString(r.pickupTime),
    reservation_end_time: toIsoString(r.dropoffTime),
    confirmation_number: r.reservationNumber ?? null,
    location: formatAddress(pickup?.address) ?? pickup?.name ?? null,
    ...(company ? { metadata: { rental_company: company } } : {}),
    endpoints,
    needs_review: endpoints.length < 2,
    ...(venue ? { _venue: venue } : {}),
    source,
  };
}

function mapEvent(r: KiReservation, source: ParsedBookingItem['source']): ParsedBookingItem | null {
  const e = r.reservationFor as KiEvent | undefined;
  if (!e?.name) return null;

  const loc = e.location;
  const c = coords(loc?.geo);
  const venue: ParsedVenue | undefined = loc?.name
    ? {
        name: loc.name,
        ...(c ?? {}),
        address: formatAddress(loc.address) ?? undefined,
        website: loc.url ?? undefined,
        phone: loc.telephone ?? undefined,
      }
    : undefined;

  return {
    type: 'event',
    title: e.name,
    reservation_time: toIsoString(e.startDate ?? r.startTime),
    reservation_end_time: toIsoString(e.endDate ?? r.endTime),
    confirmation_number: r.reservationNumber ?? null,
    location: loc ? (formatAddress(loc.address) ?? loc.name ?? null) : null,
    ...(venue ? { _venue: venue } : {}),
    source,
  };
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

/** Seat, class, platform and price of one node (type-agnostic).
 *  Models name these inconsistently and sometimes nest them under reservationFor,
 *  so check both levels and common aliases. */
function segmentDetail(r: KiReservation): {
  seat?: string;
  class?: string;
  platform?: string;
  price?: unknown;
  priceCurrency?: string;
} {
  const rf = (r.reservationFor && typeof r.reservationFor === 'object' ? r.reservationFor : {}) as Record<
    string,
    unknown
  >;
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      const v = (r as Record<string, unknown>)[k] ?? rf[k];
      if (v != null && v !== '') return v;
    }
    return undefined;
  };
  const seat = pick('seat', 'seatNumber');
  const cls = pick('class', 'bookingClass', 'fareClass', 'serviceClass', 'seatingType');
  const platform = pick('platform', 'departurePlatform');
  const price = pick('price', 'priceAmount', 'totalPrice', 'total');
  const cur = pick('priceCurrency', 'priceCurrencyISO4217Code', 'currency');
  return {
    ...(seat != null ? { seat: String(seat) } : {}),
    ...(cls != null ? { class: String(cls) } : {}),
    ...(platform != null ? { platform: String(platform) } : {}),
    ...(price != null ? { price } : {}),
    ...(cur != null ? { priceCurrency: String(cur) } : {}),
  };
}

/** Merge a node's seat/class/platform/price into its item's metadata. The item's own metadata wins. */
function applyCommonMeta(item: ParsedBookingItem, r: KiReservation): ParsedBookingItem {
  const detail = segmentDetail(r);
  if (Object.keys(detail).length) item.metadata = { ...detail, ...(item.metadata ?? {}) };
  return item;
}

interface Fare {
  price?: unknown;
  priceCurrency?: string;
}

const currencyOf = (fare: Fare) => fare.priceCurrency?.trim().toUpperCase();

/** Whether every price is a number, all in one currency. */
function summable(fares: Fare[]): boolean {
  return fares.every((fare) => Number.isFinite(Number(fare.price)) && currencyOf(fare) === currencyOf(fares[0]));
}

/** Whether every price is the same amount, to the cent, in the same currency. */
function oneAmount(fares: Fare[]): boolean {
  return summable(fares) && fares.every((fare) => toMinor(Number(fare.price)) === toMinor(Number(fares[0].price)));
}

/**
 * What one ticket covering several segments cost. KItinerary and the AI import
 * both print the ticket's total on every segment, so the same amount on each is
 * that total once, not once per segment (#2895). Amounts that differ are fares
 * per segment and add up, in whole cents, for flights as for trains. Mixed
 * currencies, or an amount that is not a number, keep the first segment's price.
 */
function ticketFare(nodes: KiReservation[]): Fare | null {
  const priced = nodes.map(segmentDetail).filter((detail) => detail.price != null);
  if (priced.length === 0) return null;
  const [first] = priced;
  const currency = first.priceCurrency != null ? { priceCurrency: first.priceCurrency } : {};
  if (!summable(priced) || oneAmount(priced)) return { price: first.price, ...currency };
  return { price: sumMinor(priced.map((detail) => Number(detail.price))) / 100, ...currency };
}

function withoutPrice(item: ParsedBookingItem): ParsedBookingItem {
  if (!item.metadata) return item;
  const { price: _price, priceCurrency: _currency, ...rest } = item.metadata;
  return { ...item, metadata: Object.keys(rest).length ? rest : undefined };
}

function hopOf(r: KiReservation): Hop | null {
  if (r['@type'] === 'FlightReservation') return flightHop(r);
  const kind = GROUND_KINDS.get(r['@type']);
  return kind ? groundHop(kind, r) : null;
}

/**
 * The segments one ticket covers, from `start` on: consecutive nodes of the same
 * type under the same booking reference, each leaving from where the one before
 * it arrived (`continuesChain`). A node without a reference is a ticket of its own.
 */
function ticketChain(kiItems: KiReservation[], start: number): KiReservation[] {
  const first = kiItems[start];
  const firstHop = hopOf(first);
  const ref = first.reservationNumber ?? null;
  const chain = [first];
  if (ref == null || !firstHop) return chain;
  const hops = [firstHop];
  for (let j = start + 1; j < kiItems.length; j++) {
    const next = kiItems[j];
    const hop = next['@type'] === first['@type'] && (next.reservationNumber ?? null) === ref ? hopOf(next) : null;
    if (!hop || !continuesChain(hops, hop)) break;
    chain.push(next);
    hops.push(hop);
  }
  return chain;
}

/**
 * The bookings one chain of connecting segments becomes. A flight or a train
 * with connections is one booking with stops and legs, priced once. A bus or a
 * boat has no legs to carry, so its segments stay bookings of their own, and
 * `priceRepeatedTotalOnce` keeps a total repeated on each to one of them.
 */
function mapTicket(
  chain: KiReservation[],
  fileName: string,
  start: number,
  out: { items: ParsedBookingItem[]; warnings: string[] },
): void {
  const [first] = chain;
  const kind = GROUND_KINDS.get(first['@type']);
  const source = { fileName, index: start };

  if (kind && chain.length > 1 && !LEG_TYPES.includes(kind.type)) {
    chain.forEach((node, k) => {
      const item = mapGround(node, kind, { fileName, index: start + k });
      if (item) out.items.push(applyCommonMeta(item, node));
      else out.warnings.push(unmappableWarning(node, fileName, start + k));
    });
    return;
  }

  const grouped = chain.length > 1;
  let item: ParsedBookingItem | null;
  if (kind) item = grouped ? mapGroundGroup(chain, kind, source) : mapGround(first, kind, source);
  else item = grouped ? mapFlightGroup(chain, source) : mapFlight(first, source);
  if (!item) {
    out.warnings.push(unmappableWarning(first, fileName, start));
    return;
  }
  const fare = grouped ? ticketFare(chain) : null;
  if (fare) item.metadata = { ...(item.metadata ?? {}), ...fare };
  out.items.push(applyCommonMeta(item, first));
}

/** The booking types a transport reservation maps to, whichever kind of ticket it came from. */
const TRANSPORT_TYPES = new Set<string>(['flight', ...[...GROUND_KINDS.values()].map((kind) => kind.type)]);

const departureMs = (item: ParsedBookingItem) =>
  item.reservation_time ? new Date(item.reservation_time).getTime() : Number.NaN;

const fareOf = (item: ParsedBookingItem): Fare => {
  const currency = item.metadata?.priceCurrency;
  return { price: item.metadata?.price, priceCurrency: typeof currency === 'string' ? currency : undefined };
};

/**
 * KItinerary prints an order's total on every segment, also on segments that do
 * not join into one booking: an outward and a return trip under one order
 * number, a gap between two segments, a change of station whose names differ
 * where no position is known, a bus or boat ticket with changes, a flight and a
 * train on one Rail&Fly reference. When every priced transport booking of one
 * reference carries the same amount in the same currency, that amount is the
 * order's total once, so the first of them to depart keeps it and the others
 * lose it (#2895). Amounts that differ are fares of their own and stay.
 *
 * Only for what KItinerary extracted. A model can read fares the document
 * states per segment that happen to be equal; `collapseRepeatedBookingTotal`
 * tells the two apart for the AI import by the document's own total line.
 */
function priceRepeatedTotalOnce(items: ParsedBookingItem[]): ParsedBookingItem[] {
  const byReference = new Map<string, ParsedBookingItem[]>();
  for (const item of items) {
    const reference = item.confirmation_number?.trim().toUpperCase();
    if (!reference || !TRANSPORT_TYPES.has(item.type) || item.metadata?.price == null) continue;
    byReference.set(reference, [...(byReference.get(reference) ?? []), item]);
  }
  const repeats = new Set<ParsedBookingItem>();
  for (const priced of byReference.values()) {
    if (priced.length < 2 || !oneAmount(priced.map(fareOf))) continue;
    const keeper = priced.reduce((first, item) => (departureMs(item) < departureMs(first) ? item : first), priced[0]);
    priced.filter((item) => item !== keeper).forEach((item) => repeats.add(item));
  }
  return repeats.size ? items.map((item) => (repeats.has(item) ? withoutPrice(item) : item)) : items;
}

/**
 * Why a mapper answered null, in the words of the node it refused.
 *
 * Every type mapper drops out on one of two things: no `reservationFor` at all,
 * or one that carries no name. Said out loud, because a recognised booking that
 * cannot be mapped used to disappear between the mapper and the preview, and an
 * import that found one weak node looked exactly like a document with nothing in
 * it (#2375). Shaped like the unknown-type warning below so the two read as one
 * list.
 */
function unmappableWarning(r: KiReservation, fileName: string, index: number): string {
  const reason = r.reservationFor ? 'no name in reservationFor' : 'no reservationFor';
  return `Incomplete ${r['@type']} in ${fileName}[${index}] (${reason}) — skipped`;
}

export function mapReservations(
  kiItems: KiReservation[],
  fileName: string,
  extractedBy: 'kitinerary' | 'ai' = 'kitinerary',
): { items: ParsedBookingItem[]; warnings: string[] } {
  const items: ParsedBookingItem[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < kiItems.length; i++) {
    const r = kiItems[i];
    const source = { fileName, index: i };
    let item: ParsedBookingItem | null;

    if (r['@type'] === 'FlightReservation' || GROUND_KINDS.has(r['@type'])) {
      const chain = ticketChain(kiItems, i);
      mapTicket(chain, fileName, i, { items, warnings });
      i += chain.length - 1;
      continue;
    }

    switch (r['@type']) {
      case 'LodgingReservation':
        item = mapLodging(r, source);
        break;
      case 'FoodEstablishmentReservation':
        item = mapFood(r, source);
        break;
      case 'RentalCarReservation':
        item = mapRentalCar(r, source);
        break;
      case 'EventReservation':
      case 'TouristAttractionVisit':
        item = mapEvent(r, source);
        break;
      default:
        warnings.push(`Unknown type "${r['@type']}" in ${fileName}[${i}] — skipped`);
        continue;
    }

    if (item) items.push(applyCommonMeta(item, r));
    else warnings.push(unmappableWarning(r, fileName, i));
  }

  return { items: extractedBy === 'kitinerary' ? priceRepeatedTotalOnce(items) : items, warnings };
}
