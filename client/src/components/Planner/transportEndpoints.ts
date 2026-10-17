import {
  Bike,
  Bus,
  CableCar,
  Car,
  CarTaxiFront,
  Plane,
  Route,
  Sailboat,
  Ship,
  Train,
  type LucideIcon,
} from 'lucide-react';

import type { Day, Reservation, ReservationEndpoint } from '../../types';
import { orderedEndpoints, parseReservationMetadata, stripAirportCode, usesStationRoute } from '../../utils/flightLegs';
import { formatDate, resolveDayId, splitReservationDateTime } from '../../utils/formatters';
import type { Airport } from './AirportSelect';
import { importedPriceEntry } from './importedPrice';
import type { LocationPoint } from './LocationSelect';
import type { BookingReviewDraft } from './parsedItemToDraft';

/**
 * The transport booking form both shells edit, the desktop TransportModal and the
 * phone's transport sheet: the route rows, how a saved booking fills them and the
 * request body they are saved as, so the saved shape is the same on both.
 */

export const TRANSPORT_TYPES = [
  'flight',
  'train',
  'bus',
  'car',
  'taxi',
  'bicycle',
  'cruise',
  'ferry',
  'cable_car',
  'transit',
  'transport_other',
] as const;
export type TransportType = (typeof TRANSPORT_TYPES)[number];

/** The types the form offers to pick; transit is only ever created by the automated search. */
export const TRANSPORT_TYPE_OPTIONS: { value: TransportType; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'flight', labelKey: 'reservations.type.flight', Icon: Plane },
  { value: 'train', labelKey: 'reservations.type.train', Icon: Train },
  { value: 'bus', labelKey: 'reservations.type.bus', Icon: Bus },
  { value: 'car', labelKey: 'reservations.type.car', Icon: Car },
  { value: 'taxi', labelKey: 'reservations.type.taxi', Icon: CarTaxiFront },
  { value: 'bicycle', labelKey: 'reservations.type.bicycle', Icon: Bike },
  { value: 'cruise', labelKey: 'reservations.type.cruise', Icon: Ship },
  { value: 'ferry', labelKey: 'reservations.type.ferry', Icon: Sailboat },
  { value: 'cable_car', labelKey: 'reservations.type.cable_car', Icon: CableCar },
  { value: 'transport_other', labelKey: 'reservations.type.transport_other', Icon: Route },
];

export interface EndpointPick {
  airport?: Airport;
  location?: LocationPoint;
}

/**
 * A flight is an ordered list of airports. The origin has only a departure, the
 * destination only an arrival, and each stop in between has both, plus the airline
 * and flight number of the flight LEAVING it. N waypoints = N-1 legs.
 */
export interface WaypointForm {
  airport: Airport | null;
  arrDayId: string | number;
  arrTime: string;
  depDayId: string | number;
  depTime: string;
  airline: string;
  flight_number: string;
  seat: string;
  /** Booking reference of the leg leaving this waypoint (#1943); empty means the booking's own. */
  confirmation_number: string;
}

/** A train or cruise mirrors the flight, with stations for airports and a train number and platform per leg. */
export interface StationWaypointForm {
  location: LocationPoint | null;
  arrDayId: string | number;
  arrTime: string;
  depDayId: string | number;
  depTime: string;
  train_number: string;
  platform: string;
  seat: string;
  confirmation_number: string;
}

/** A place a car rental passes between pick-up and return (#1797), with the time the driver plans to be there. */
export interface CarStopForm {
  location: LocationPoint | null;
  time: string;
}

export function emptyWaypoint(dayId: string | number = ''): WaypointForm {
  return {
    airport: null,
    arrDayId: dayId,
    arrTime: '',
    depDayId: dayId,
    depTime: '',
    airline: '',
    flight_number: '',
    seat: '',
    confirmation_number: '',
  };
}

export function emptyStationWaypoint(dayId: string | number = ''): StationWaypointForm {
  return {
    location: null,
    arrDayId: dayId,
    arrTime: '',
    depDayId: dayId,
    depTime: '',
    train_number: '',
    platform: '',
    seat: '',
    confirmation_number: '',
  };
}

export const emptyCarStop = (): CarStopForm => ({ location: null, time: '' });

export type NewEndpoint = Omit<ReservationEndpoint, 'id' | 'reservation_id'>;
type EndpointRole = 'from' | 'to' | 'stop';

export function endpointFromAirport(
  a: Airport,
  role: EndpointRole,
  sequence: number,
  date: string | null,
  time: string | null
): NewEndpoint {
  return {
    role,
    sequence,
    name: a.city ? `${a.city} (${a.iata})` : a.name,
    code: a.iata,
    lat: a.lat,
    lng: a.lng,
    timezone: a.tz,
    local_date: date,
    local_time: time,
  };
}

export function endpointFromLocation(
  l: LocationPoint,
  role: EndpointRole,
  sequence: number,
  date: string | null,
  time: string | null
): NewEndpoint {
  return {
    role,
    sequence,
    name: l.name,
    code: null,
    lat: l.lat,
    lng: l.lng,
    timezone: null,
    local_date: date,
    local_time: time,
  };
}

export function airportFromEndpoint(e: ReservationEndpoint | undefined): Airport | null {
  if (!e || !e.code) return null;
  return {
    iata: e.code,
    icao: null,
    name: e.name,
    city: stripAirportCode(e.name),
    country: '',
    lat: e.lat,
    lng: e.lng,
    tz: e.timezone || '',
  };
}

export function locationFromEndpoint(e: ReservationEndpoint | undefined): LocationPoint | null {
  if (!e) return null;
  return { name: e.name, lat: e.lat, lng: e.lng, address: null };
}

/** The fields of the form both shells share; the desktop keeps a few more of its own. */
export interface TransportFields {
  title: string;
  type: TransportType;
  status: 'pending' | 'confirmed';
  start_day_id: string | number;
  end_day_id: string | number;
  departure_time: string;
  arrival_time: string;
  confirmation_number: string;
  notes: string;
}

export const EMPTY_TRANSPORT_FIELDS: TransportFields = {
  title: '',
  type: 'flight',
  status: 'pending',
  start_day_id: '',
  end_day_id: '',
  departure_time: '',
  arrival_time: '',
  confirmation_number: '',
  notes: '',
};

/** One leg of a multi-leg booking as metadata.legs stores it. */
export interface TransportLegMeta {
  from?: string;
  to?: string;
  airline?: string;
  flight_number?: string;
  train_number?: string;
  platform?: string;
  seat?: string;
  confirmation_number?: string;
  dep_day_id?: number | null;
  dep_time?: string | null;
  arr_day_id?: number | null;
  arr_time?: string | null;
  day_positions?: Record<string, number>;
}

/** The flat metadata a transport form reads back. */
export interface TransportMetaFields {
  airline?: string;
  flight_number?: string;
  train_number?: string;
  platform?: string;
  seat?: string;
  legs?: unknown;
}

/** The booking's metadata as the form reads it; unlike the other readers, broken JSON is not forgiven here. */
export function readTransportMeta(src: Pick<Reservation, 'metadata'>): TransportMetaFields {
  return (
    typeof src.metadata === 'string' ? JSON.parse(src.metadata || '{}') : src.metadata || {}
  ) as TransportMetaFields;
}

const legsOf = (meta: TransportMetaFields): TransportLegMeta[] =>
  Array.isArray(meta.legs) ? (meta.legs as TransportLegMeta[]) : [];

/** The type a saved booking opens with; one the form does not know becomes `fallback`. */
export function transportTypeOf(type: string, fallback: TransportType): TransportType {
  return (TRANSPORT_TYPES as readonly string[]).includes(type) ? (type as TransportType) : fallback;
}

/** The form fields for a saved booking or an import prefill. */
export function transportFieldsFrom(src: Reservation, days: Day[], type: TransportType): TransportFields {
  return {
    title: src.title || '',
    type,
    status: src.status === 'confirmed' ? 'confirmed' : 'pending',
    // For an edit, keep the saved day; for an imported prefill (no day_id), resolve it
    // from the parsed pick-up/return date so the date isn't lost on save.
    start_day_id: src.day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_time).date),
    end_day_id: src.end_day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_end_time).date),
    departure_time: splitReservationDateTime(src.reservation_time).time ?? '',
    arrival_time: splitReservationDateTime(src.reservation_end_time).time ?? '',
    confirmation_number: src.confirmation_number || '',
    notes: src.notes || '',
  };
}

/** The route rows of the form. A seed fills only the ones it names; the others keep what they hold. */
export interface TransportRoute {
  waypoints?: WaypointForm[];
  trainWaypoints?: StationWaypointForm[];
  fromPick?: EndpointPick;
  toPick?: EndpointPick;
  carStops?: CarStopForm[];
}

export interface RouteSeedOptions {
  /** Editing a saved booking rather than reviewing an import. */
  isEdit: boolean;
  /**
   * A stopover has no day column of its own, so when metadata.legs is missing
   * (imported or MCP-created bookings) the phone seeds it from the endpoint's
   * local_date. The desktop leaves it empty.
   */
  stopDaysFromEndpoints: boolean;
}

/** The empty route of a new booking, every row starting on the given day. */
export function blankTransportRoute(dayId: string | number): Required<TransportRoute> {
  return {
    fromPick: {},
    toPick: {},
    waypoints: [emptyWaypoint(dayId), emptyWaypoint(dayId)],
    trainWaypoints: [emptyStationWaypoint(dayId), emptyStationWaypoint(dayId)],
    carStops: [],
  };
}

interface LegDays {
  arrDayId: string | number;
  arrTime: string;
  depDayId: string | number;
  depTime: string;
}

/** The waypoint rows of a booking that has endpoints: each row's days and times, then its per-leg fields. */
function waypointRows<W>(
  src: Reservation,
  meta: TransportMetaFields,
  days: Day[],
  opts: RouteSeedOptions,
  row: (ep: ReservationEndpoint, legOut: TransportLegMeta | undefined, isFirst: boolean, when: LegDays) => W
): W[] {
  const eps = orderedEndpoints(src);
  const metaLegs = legsOf(meta);
  // Only an import prefill carries a per-endpoint local_date without a day_id. On an
  // edit the saved day wins: local_date is denormalised and can lag behind after a
  // day drag, insertDay or a trip-date shift, so resolving from it would silently
  // move the booking to another day on a plain re-save.
  const endpointDayId = (ep?: { local_date?: string | null } | null) =>
    opts.isEdit ? '' : resolveDayId(days, ep?.local_date);
  return eps.map((ep, i) => {
    const legInto = metaLegs[i - 1]; // leg arriving INTO waypoint i
    const legOut = metaLegs[i]; // leg departing FROM waypoint i
    const isFirst = i === 0;
    const isLast = i === eps.length - 1;
    const stopDay = opts.stopDaysFromEndpoints && !isFirst && !isLast ? resolveDayId(days, ep?.local_date) : '';
    return row(ep, legOut, isFirst, {
      arrDayId: legInto?.arr_day_id ?? (endpointDayId(ep) || (isLast ? (src.end_day_id ?? '') : stopDay)),
      arrTime: legInto?.arr_time ?? (!isFirst ? (ep.local_time ?? '') : ''),
      depDayId: legOut?.dep_day_id ?? (endpointDayId(ep) || (isFirst ? (src.day_id ?? '') : stopDay)),
      depTime: legOut?.dep_time ?? (!isLast ? (ep.local_time ?? '') : ''),
    });
  });
}

/** The day a legacy booking without full endpoints seeds its first or last row on. */
function legacyDays(src: Reservation, days: Day[], opts: RouteSeedOptions) {
  const eps = src.endpoints || [];
  const endpointDayId = (ep?: { local_date?: string | null } | null) =>
    opts.isEdit ? '' : resolveDayId(days, ep?.local_date);
  return {
    from: eps.find((e) => e.role === 'from'),
    to: eps.find((e) => e.role === 'to'),
    depDay: endpointDayId(eps.find((e) => e.role === 'from')) || (src.day_id ?? ''),
    arrDay: endpointDayId(eps.find((e) => e.role === 'to')) || (src.end_day_id ?? src.day_id ?? ''),
  };
}

function flightWaypoints(
  src: Reservation,
  meta: TransportMetaFields,
  days: Day[],
  opts: RouteSeedOptions
): WaypointForm[] {
  if (orderedEndpoints(src).length >= 2) {
    return waypointRows(src, meta, days, opts, (ep, legOut, isFirst, when) => ({
      airport: airportFromEndpoint(ep),
      ...when,
      airline: legOut?.airline ?? (isFirst ? (meta.airline ?? '') : ''),
      flight_number: legOut?.flight_number ?? (isFirst ? (meta.flight_number ?? '') : ''),
      seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
      // No fallback to src.confirmation_number: that one belongs to the whole
      // booking and stays in the form's own field, otherwise a plain re-save would
      // copy it onto the first leg.
      confirmation_number: legOut?.confirmation_number ?? '',
    }));
  }
  // Legacy flight with no (or partial) endpoints: seed two waypoints.
  const { from, to, depDay, arrDay } = legacyDays(src, days, opts);
  const dep = emptyWaypoint(depDay);
  dep.airport = airportFromEndpoint(from);
  dep.depTime = splitReservationDateTime(src.reservation_time).time ?? '';
  dep.airline = meta.airline ?? '';
  dep.flight_number = meta.flight_number ?? '';
  dep.seat = meta.seat ?? '';
  const arr = emptyWaypoint(arrDay);
  arr.airport = airportFromEndpoint(to);
  arr.arrTime = splitReservationDateTime(src.reservation_end_time).time ?? '';
  return [dep, arr];
}

function stationWaypoints(
  src: Reservation,
  meta: TransportMetaFields,
  days: Day[],
  opts: RouteSeedOptions
): StationWaypointForm[] {
  // A current single-leg train (2 endpoints, no metadata.legs) round-trips through
  // the first branch: the flat train_number/platform/seat land on the first station.
  if (orderedEndpoints(src).length >= 2) {
    return waypointRows(src, meta, days, opts, (ep, legOut, isFirst, when) => ({
      location: locationFromEndpoint(ep),
      ...when,
      train_number: legOut?.train_number ?? (isFirst ? (meta.train_number ?? '') : ''),
      platform: legOut?.platform ?? (isFirst ? (meta.platform ?? '') : ''),
      seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
      // See the flight branch: the booking's own reference stays out of the legs.
      confirmation_number: legOut?.confirmation_number ?? '',
    }));
  }
  const { from, to, depDay, arrDay } = legacyDays(src, days, opts);
  const dep = emptyStationWaypoint(depDay);
  dep.location = locationFromEndpoint(from);
  dep.depTime = splitReservationDateTime(src.reservation_time).time ?? '';
  dep.train_number = meta.train_number ?? '';
  dep.platform = meta.platform ?? '';
  dep.seat = meta.seat ?? '';
  const arr = emptyStationWaypoint(arrDay);
  arr.location = locationFromEndpoint(to);
  arr.arrTime = splitReservationDateTime(src.reservation_end_time).time ?? '';
  return [dep, arr];
}

/** The route rows a saved booking or an import prefill opens with, for the type it opens as. */
export function seedTransportRoute(
  src: Reservation,
  meta: TransportMetaFields,
  type: TransportType,
  days: Day[],
  opts: RouteSeedOptions
): Required<TransportRoute> {
  // Every row is set, including those the type does not show: the form stays
  // mounted between openings, and a row kept from the previous booking would come
  // back (and be saved) as soon as the type is switched to one that shows it.
  if (type === 'flight') {
    return {
      waypoints: flightWaypoints(src, meta, days, opts),
      trainWaypoints: [emptyStationWaypoint(), emptyStationWaypoint()],
      fromPick: {},
      toPick: {},
      carStops: [],
    };
  }
  if (usesStationRoute(type)) {
    return {
      waypoints: [emptyWaypoint(), emptyWaypoint()],
      trainWaypoints: stationWaypoints(src, meta, days, opts),
      fromPick: {},
      toPick: {},
      carStops: [],
    };
  }
  const eps = src.endpoints || [];
  return {
    fromPick: { location: locationFromEndpoint(eps.find((e) => e.role === 'from')) || undefined },
    toPick: { location: locationFromEndpoint(eps.find((e) => e.role === 'to')) || undefined },
    waypoints: [emptyWaypoint(), emptyWaypoint()],
    trainWaypoints: [emptyStationWaypoint(), emptyStationWaypoint()],
    // Stops persist for every type; only a car offers an editor for them, so only a
    // car reads them back into one. The others keep passing theirs through untouched.
    carStops:
      src.type === 'car'
        ? eps
            .filter((e) => e.role === 'stop')
            .slice()
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((e) => ({ location: locationFromEndpoint(e), time: e.local_time ?? '' }))
        : [],
  };
}

/** The day picker options: a dash for none, then each day by title or number with its date as the badge. */
export function transportDayOptions(
  days: Day[],
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: string
) {
  return [
    { value: '', label: '—' },
    ...days.map((d) => {
      const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined;
      const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined;
      return { value: d.id, label: d.title || t('dayplan.dayN', { n: d.day_number }), badge: dateBadge ?? dayBadge };
    }),
  ];
}

export interface TransportDraft {
  form: TransportFields;
  waypoints: WaypointForm[];
  trainWaypoints: StationWaypointForm[];
  fromPick: EndpointPick;
  toPick: EndpointPick;
  carStops: CarStopForm[];
}

export interface TransportPayloadOptions {
  /** The booking being edited; null while creating. */
  reservation: Reservation | null;
  /** The import item under review; its parsed price becomes the linked cost of a new booking. */
  prefill: BookingReviewDraft | null;
  budgetEnabled: boolean;
  /**
   * The phone anchors a train's day and time on the stations that become endpoints,
   * falling back to the raw rows only when none is picked. The desktop reads the raw
   * first and last rows.
   */
  anchorOnStations: boolean;
  /** The desktop's link field; the phone has none and sends no url. */
  url?: string;
}

export type TransportPayload = Record<string, unknown> & { title: string };

const near = (a?: number | null, b?: number | null) => a != null && b != null && Math.abs(a - b) < 1e-6;

type LegEnds = Pick<WaypointForm, 'seat' | 'confirmation_number' | 'depDayId' | 'depTime' | 'arrDayId' | 'arrTime'>;

/** The tail every saved flight or train leg shares: seat, booking reference, schedule and the old day positions. */
function legSchedule(w: LegEnds, next: LegEnds, orig: TransportLegMeta | undefined): TransportLegMeta {
  return {
    ...(w.seat ? { seat: w.seat } : {}),
    ...(w.confirmation_number ? { confirmation_number: w.confirmation_number } : {}),
    dep_day_id: w.depDayId ? Number(w.depDayId) : null,
    dep_time: w.depTime || null,
    arr_day_id: next.arrDayId ? Number(next.arrDayId) : null,
    arr_time: next.arrTime || null,
    ...(orig?.day_positions ? { day_positions: orig.day_positions } : {}),
  };
}

/** The request body the form saves as. */
export function buildTransportPayload(
  draft: TransportDraft,
  days: Day[],
  opts: TransportPayloadOptions
): TransportPayload {
  const { form, waypoints, trainWaypoints, fromPick, toPick, carStops } = draft;
  const { reservation } = opts;
  const stationRoute = usesStationRoute(form.type);
  const startDay = days.find((d) => d.id === Number(form.start_day_id));
  const endDay = days.find((d) => d.id === Number(form.end_day_id));

  const buildTime = (day: Day | undefined, time: string): string | null => {
    if (!time) return null;
    return day?.date ? `${day.date}T${time}` : time;
  };

  const dayDate = (id: string | number): string | null => days.find((d) => d.id === Number(id))?.date ?? null;
  // Flight route as an ordered list of airports (origin .. stops .. destination).
  const flightWps = form.type === 'flight' ? waypoints.filter((w) => w.airport) : [];
  const firstWp = flightWps[0];
  const lastWp = flightWps[flightWps.length - 1];
  // Only geocoded stations become map endpoints and legs.
  const trainWps = stationRoute ? trainWaypoints : [];
  const trainStations = trainWps.filter((w) => w.location);
  const trainAnchors = opts.anchorOnStations && trainStations.length > 0 ? trainStations : trainWps;
  const firstTrainWp = trainAnchors[0];
  const lastTrainWp = trainAnchors[trainAnchors.length - 1];
  // Per-leg day-plan positions are owned by the day planner, not this form: keep
  // them when re-saving so editing a flight doesn't reset where its legs sit.
  const origLegs: TransportLegMeta[] = reservation ? parseReservationMetadata(reservation).legs || [] : [];

  const metadata: Record<string, unknown> = {};
  if (form.type === 'flight') {
    // Top-level keys mirror the first/last leg so legacy readers keep working.
    if (firstWp?.airline) metadata.airline = firstWp.airline;
    if (firstWp?.flight_number) metadata.flight_number = firstWp.flight_number;
    if (firstWp?.airport) {
      metadata.departure_airport = firstWp.airport.iata;
      metadata.departure_timezone = firstWp.airport.tz;
    }
    if (lastWp?.airport) {
      metadata.arrival_airport = lastWp.airport.iata;
      metadata.arrival_timezone = lastWp.airport.tz;
    }
    // Per-leg detail only for true multi-leg flights: a single-leg flight keeps the
    // flat metadata it always had.
    if (flightWps.length > 2) {
      metadata.legs = flightWps.slice(0, -1).map((w, i) => {
        const next = flightWps[i + 1];
        return {
          from: w.airport!.iata,
          to: next.airport!.iata,
          ...(w.airline ? { airline: w.airline } : {}),
          ...(w.flight_number ? { flight_number: w.flight_number } : {}),
          ...legSchedule(w, next, origLegs[i]),
        };
      });
    }
    if (firstWp?.seat) metadata.seat = firstWp.seat;
  } else if (stationRoute) {
    // Flat keys mirror the first leg so legacy readers keep working.
    if (firstTrainWp?.train_number) metadata.train_number = firstTrainWp.train_number;
    if (firstTrainWp?.platform) metadata.platform = firstTrainWp.platform;
    if (firstTrainWp?.seat) metadata.seat = firstTrainWp.seat;
    // Per-leg detail only for a true multi-leg train (more than two geocoded stations).
    if (trainStations.length > 2) {
      metadata.legs = trainStations.slice(0, -1).map((w, i) => {
        const next = trainStations[i + 1];
        return {
          from: w.location!.name,
          to: next.location!.name,
          ...(w.train_number ? { train_number: w.train_number } : {}),
          ...(w.platform ? { platform: w.platform } : {}),
          ...legSchedule(w, next, origLegs[i]),
        };
      });
    }
  }

  // A transit itinerary (#1065) lives in metadata.transit + 'stop' endpoints, neither
  // of which this form shows or edits, so re-saving must not wipe them. They're kept
  // only while from/to are unchanged: picking a different origin or destination
  // invalidates the stored connection.
  const prevMeta = reservation ? parseReservationMetadata(reservation) : {};
  const prevEndpointsAll = reservation?.endpoints || [];
  const prevFrom = prevEndpointsAll.find((ep) => ep.role === 'from');
  const prevTo = prevEndpointsAll.find((ep) => ep.role === 'to');
  const keepTransit = !!(
    prevMeta.transit &&
    form.type !== 'flight' &&
    prevFrom &&
    prevTo &&
    fromPick.location &&
    toPick.location &&
    near(prevFrom.lat, fromPick.location.lat) &&
    near(prevFrom.lng, fromPick.location.lng) &&
    near(prevTo.lat, toPick.location.lat) &&
    near(prevTo.lng, toPick.location.lng)
  );
  if (keepTransit) metadata.transit = prevMeta.transit;
  // A joined AirTrail import (#1535) records every source flight id in
  // metadata.airtrail_ids so the picker doesn't offer those legs again.
  if (Array.isArray(prevMeta.airtrail_ids)) metadata.airtrail_ids = prevMeta.airtrail_ids;

  const startDate = startDay?.date ?? null;
  const endDate = (endDay ?? startDay)?.date ?? null;
  const endpoints: NewEndpoint[] = [];
  if (form.type === 'flight') {
    flightWps.forEach((w, i) => {
      const isFirst = i === 0;
      const isLast = i === flightWps.length - 1;
      const role: EndpointRole = isFirst ? 'from' : isLast ? 'to' : 'stop';
      const dId = isLast ? w.arrDayId : w.depDayId;
      const time = isLast ? w.arrTime : w.depTime;
      endpoints.push(endpointFromAirport(w.airport!, role, i, dayDate(dId), time || null));
    });
  } else if (stationRoute) {
    trainStations.forEach((w, i) => {
      const isFirst = i === 0;
      const isLast = i === trainStations.length - 1;
      const role: EndpointRole = isFirst ? 'from' : isLast ? 'to' : 'stop';
      const dId = isLast ? w.arrDayId : w.depDayId;
      const time = isLast ? w.arrTime : w.depTime;
      // The destination date falls back to the departure day when the arrival day is left blank.
      const date = dayDate(dId) ?? (isLast ? dayDate(firstTrainWp?.depDayId ?? '') : null);
      endpoints.push(endpointFromLocation(w.location!, role, i, date, time || null));
    });
  } else {
    if (fromPick.location) {
      endpoints.push(endpointFromLocation(fromPick.location, 'from', 0, startDate, form.departure_time || null));
    }
    // A car writes the stops the driver planned; every other type keeps passing the
    // itinerary's transfer stops through while the route is unchanged (#1065).
    const carEndpoints =
      form.type === 'car'
        ? carStops
            .filter((s) => s.location)
            .map((s, i) => endpointFromLocation(s.location!, 'stop', i + 1, startDate, s.time || null))
        : [];
    const stops =
      keepTransit && form.type !== 'car'
        ? prevEndpointsAll
            .filter((ep) => ep.role === 'stop')
            .slice()
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
        : [];
    stops.forEach((s, i) =>
      endpoints.push({
        role: 'stop',
        sequence: i + 1,
        name: s.name,
        code: s.code ?? null,
        lat: s.lat,
        lng: s.lng,
        timezone: s.timezone ?? null,
        local_date: s.local_date ?? null,
        local_time: s.local_time ?? null,
      })
    );
    carEndpoints.forEach((e) => endpoints.push(e));
    const stopCount = stops.length + carEndpoints.length;
    if (toPick.location) {
      endpoints.push(endpointFromLocation(toPick.location, 'to', stopCount + 1, endDate, form.arrival_time || null));
    }
  }

  // Flights and trains derive their span from the first/last waypoint; other
  // transports use the single departure/arrival fields.
  const flightDepDay = firstWp && firstWp.depDayId ? Number(firstWp.depDayId) : null;
  const flightArrDay = lastWp && lastWp.arrDayId ? Number(lastWp.arrDayId) : null;
  const trainDepDay = firstTrainWp && firstTrainWp.depDayId ? Number(firstTrainWp.depDayId) : null;
  const trainArrDay = lastTrainWp && lastTrainWp.arrDayId ? Number(lastTrainWp.arrDayId) : null;
  const ownDay = (id: string | number) => (id ? Number(id) : null);
  const payload: TransportPayload = {
    title: form.title,
    type: form.type,
    status: form.status,
    day_id: form.type === 'flight' ? flightDepDay : stationRoute ? trainDepDay : ownDay(form.start_day_id),
    end_day_id: form.type === 'flight' ? flightArrDay : stationRoute ? trainArrDay : ownDay(form.end_day_id),
    reservation_time:
      form.type === 'flight'
        ? buildTime(
            days.find((d) => d.id === flightDepDay),
            firstWp?.depTime || ''
          )
        : stationRoute
          ? buildTime(
              days.find((d) => d.id === trainDepDay),
              firstTrainWp?.depTime || ''
            )
          : buildTime(startDay, form.departure_time),
    reservation_end_time:
      form.type === 'flight'
        ? buildTime(
            days.find((d) => d.id === flightArrDay),
            lastWp?.arrTime || ''
          )
        : stationRoute
          ? // Fall back to the departure day so a same-day train (arrival day left blank) still gets its date.
            buildTime(
              days.find((d) => d.id === trainArrDay) ?? days.find((d) => d.id === trainDepDay),
              lastTrainWp?.arrTime || ''
            )
          : buildTime(endDay ?? startDay, form.arrival_time),
    location: null,
    confirmation_number: form.confirmation_number || null,
    notes: form.notes || null,
    ...(opts.url !== undefined ? { url: opts.url || null } : {}),
    // Always an object, never null: the server reads null as "clear the column" and
    // would drop the expense price mirrored into metadata (#2233).
    metadata,
    endpoints,
    needs_review: false,
  };
  // Imported booking: auto-create the linked cost from the parsed price. Only on
  // create (not edit) and only when there's a price.
  if (!reservation && opts.prefill && opts.budgetEnabled) {
    const entry = importedPriceEntry(opts.prefill.metadata, form.type);
    if (entry) payload.create_budget_entry = entry;
  }
  return payload;
}
