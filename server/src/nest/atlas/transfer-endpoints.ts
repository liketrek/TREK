/**
 * Layover detection for the two country-deriving Atlas queries.
 *
 * A plane change is not a visit, so #1486 taught both queries to skip
 * reservation_endpoints rows with role='stop'. That only reaches a layover
 * stored INSIDE one booking. When the legs of one journey land in the database as
 * two separate reservations (an AirTrail import whose flights never chained, or
 * legs imported one by one before the join feature existed), the hub is the
 * legitimate 'to' of the first booking and the legitimate 'from' of the second,
 * and no role filter can tell that apart from a real destination (#1535).
 *
 * What does tell it apart is the time on the ground: leaving the same airport
 * again within 24 h is a connection, not a stay. The window is deliberately the
 * one both importers already apply when they merge the legs of one journey
 * (orderConnectionChain in airtrail-import.service.ts, kitinerary-mapper.ts), so
 * Atlas and the importers agree on what counts as one connection.
 *
 * Read-side only, hence no migration: both queries derive their countries live on
 * every request, so a database that already holds the split bookings heals as
 * soon as this ships.
 */
import { haversineKm } from '../common/geo';

/** Ground time up to which an onward departure is a connection rather than a stay. */
export const MAX_LAYOVER_MS = 24 * 3600 * 1000;

/**
 * Without clocks only calendar dates are left. Leaving the day after arriving is
 * still an overnight connection; a wider gap can't be told apart from a genuine
 * stopover in the stored data, so it keeps counting as visited.
 */
export const MAX_CLOCKLESS_DAY_GAP = 1;

/**
 * How far from where the arriving leg started the departing leg may land and
 * still count as the flight home rather than the next hop. A return is regularly
 * booked into the sibling airport of the same city (Charleroi instead of
 * Zaventem, Gatwick instead of Heathrow), and that day was spent at the
 * destination, not in transit.
 *
 * A radius is the right shape for that question: the country of a coordinate
 * would be both too coarse (Belfast to Dublin to London would read as a return
 * and start counting Ireland as visited) and too expensive, since
 * getCountryFromCoords scans admin polygons and this runs inside the pairing
 * loop. 100 km covers every sibling pair worth naming (CRL/BRU 45 km, LGW/LHR
 * 40 km, EWR/JFK 34 km, HND/NRT 60 km) and stays below the distance between two
 * cities that each own their traffic, so Amsterdam to Frankfurt to Brussels
 * (170 km) keeps pairing as the connection it is.
 */
const RETURN_RADIUS_KM = 100;

/** One reservation_endpoints row, joined to the columns its booking contributes. */
export interface FlightEndpointRow {
  id: number;
  reservation_id: number;
  trip_id: number;
  role: string;
  code: string | null;
  lat: number;
  lng: number;
  local_date: string | null;
  local_time: string | null;
  /** The booking's own time column for this side of the leg, used for the date only. */
  fallback_time: string | null;
}

/** Local calendar date plus, when the leg carried an instant, the local clock. */
interface Stamp {
  date: string | null;
  time: string | null;
}

/** Where one end of a booking actually is, for the airports the importer geocoded. */
interface Coords {
  lat: number;
  lng: number;
}

/** The match keys and positions of one booking's own two ends, shared by all of its endpoints. */
interface BookingKeys {
  from: Set<string>;
  to: Set<string>;
  fromCoords: Coords[];
  toCoords: Coords[];
}

interface Endpoint {
  row: FlightEndpointRow;
  booking: BookingKeys;
  /** The buckets this endpoint belongs to, already scoped to its trip. */
  keys: string[];
  /** Midnight of the leg's local date. */
  dayMs: number;
  /** The leg's exact instant, null when it carried no clock. */
  exactMs: number | null;
  /** What a bucket of departures is ordered by: the instant if there is one, else the day. */
  sortMs: number;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;
const CLOCK = /^\d{2}:\d{2}/;
const DAY_MS = 24 * 3600 * 1000;

/**
 * How far past the arrival's midnight the sorted departures still have to be
 * walked. Two days, because each half of a pair is anchored on its own date: a
 * clockless arrival still pairs with a departure at 23:45 the next day, and an
 * arrival at 23:50 still pairs with a date-only departure the day after. This
 * bounds the scan only, isConnection stays the one place that decides.
 */
const SCAN_WINDOW_MS = 2 * DAY_MS;

/**
 * Every key an endpoint can be matched on. Two rows for one airport need not
 * agree on their shape: an imported leg carries the IATA/ICAO code, a booking
 * typed in by hand may only have been geocoded. Indexing both and pairing on
 * either match covers the mixed case, and the coordinate key is rounded because
 * two geocodes of the same airport differ in the last decimals.
 */
function endpointKeys(e: FlightEndpointRow): string[] {
  const keys: string[] = [];
  const code = e.code?.trim();
  if (code) keys.push(`c:${code.toUpperCase()}`);
  if (Number.isFinite(e.lat) && Number.isFinite(e.lng)) keys.push(`p:${e.lat.toFixed(2)},${e.lng.toFixed(2)}`);
  return keys;
}

/**
 * An endpoint only has local_date/local_time when its leg carried a usable
 * instant; localParts() returns nulls otherwise, which is exactly the date-only
 * AirTrail flight that fails to chain in the first place. So fall back to the
 * booking's own time column, but take its DATE half only: for an arrival that
 * column can hold the departure airport's local clock (airtrail.mapper.ts), which
 * says nothing about the time on the ground here.
 */
function stampOf(e: FlightEndpointRow): Stamp {
  if (e.local_date && DATE_ONLY.test(e.local_date)) {
    const time = e.local_time && CLOCK.test(e.local_time) ? e.local_time.slice(0, 5) : null;
    return { date: e.local_date, time };
  }
  const fallback = e.fallback_time?.match(DATE_PREFIX);
  return { date: fallback ? fallback[1] : null, time: null };
}

function utcMs(date: string, time: string | null): number {
  return Date.parse(`${date}T${time ?? '00:00'}:00Z`);
}

/**
 * The instants the pairing compares, read once per endpoint instead of once per
 * pair. null means the leg can never be either half of a pair: without a date
 * that parses, neither branch below has anything to measure.
 *
 * A clock that got past the shape check can still be nonsense, and the resulting
 * NaN is kept rather than downgraded to "no clock": a pair where both sides claim
 * an instant has always been judged on the instant alone.
 */
function instantsOf(stamp: Stamp): { dayMs: number; exactMs: number | null; sortMs: number } | null {
  if (!stamp.date) return null;
  const dayMs = utcMs(stamp.date, null);
  if (!Number.isFinite(dayMs)) return null;
  const exactMs = stamp.time === null ? null : utcMs(stamp.date, stamp.time);
  return { dayMs, exactMs, sortMs: exactMs !== null && Number.isFinite(exactMs) ? exactMs : dayMs };
}

/**
 * Is the departure the onward leg of the arrival? Both endpoints sit at the same
 * airport and therefore in the same timezone, so the naive local stamps compare
 * as real instants and their difference is the true time on the ground. That is
 * the only reason this is sound, so never reuse it across two airports.
 */
function isConnection(arrival: Endpoint, departure: Endpoint): boolean {
  if (arrival.exactMs !== null && departure.exactMs !== null) {
    const gap = departure.exactMs - arrival.exactMs;
    return Number.isFinite(gap) && gap >= 0 && gap <= MAX_LAYOVER_MS;
  }
  const days = (departure.dayMs - arrival.dayMs) / DAY_MS;
  return days >= 0 && days <= MAX_CLOCKLESS_DAY_GAP;
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const key of a) {
    if (b.has(key)) return true;
  }
  return false;
}

/**
 * Is the departing booking heading back to where the arriving one started? Then
 * the traveler spent the time in between at the destination, and the same call is
 * the one orderConnectionChain makes before it joins two legs.
 *
 * The airport keys answer that for a return into the exact same airport; the
 * distance covers the sibling airport of the same city, which the keys can never
 * match. Legs the importer had no coordinates for fall back to the key match.
 */
function returnsToOrigin(departure: Endpoint, arrival: Endpoint): boolean {
  if (intersects(departure.booking.to, arrival.booking.from)) return true;
  for (const landed of departure.booking.toCoords) {
    for (const started of arrival.booking.fromCoords) {
      if (haversineKm(landed.lat, landed.lng, started.lat, started.lng) <= RETURN_RADIUS_KM) return true;
    }
  }
  return false;
}

/** First entry of a bucket sorted by sortMs that is not earlier than `from`. */
function firstFrom(bucket: Endpoint[], from: number): number {
  let low = 0;
  let high = bucket.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (bucket[mid].sortMs < from) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * The endpoint ids that are only a connection airport, spread over two bookings.
 *
 * Callers pass flight endpoints of non-cancelled bookings only: a car rental
 * picked up right where a flight landed has its own from/to at that airport and
 * would otherwise pair with the arrival and swallow the destination country
 * (#1366).
 */
export function transferEndpointIds(rows: FlightEndpointRow[]): Set<number> {
  const transfers = new Set<number>();
  if (rows.length < 2) return transfers;

  const landings: Endpoint[] = [];
  const departures = new Map<string, Endpoint[]>();
  const bookings = new Map<number, BookingKeys>();

  for (const row of rows) {
    if (row.role !== 'from' && row.role !== 'to') continue;
    const keys = endpointKeys(row);
    if (keys.length === 0) continue;

    let booking = bookings.get(row.reservation_id);
    if (!booking) {
      booking = { from: new Set<string>(), to: new Set<string>(), fromCoords: [], toCoords: [] };
      bookings.set(row.reservation_id, booking);
    }
    const arriving = row.role === 'to';
    const ownKeys = arriving ? booking.to : booking.from;
    for (const key of keys) ownKeys.add(key);
    if (Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
      (arriving ? booking.toCoords : booking.fromCoords).push({ lat: row.lat, lng: row.lng });
    }

    // A leg without a readable date pairs with nothing, but its keys and its
    // position had to be recorded above: they describe the booking either way.
    const instants = instantsOf(stampOf(row));
    if (!instants) continue;

    // Two trips that happen to touch the same airport are two journeys: an
    // arrival home from one and a departure on the next is not a layover. The
    // trip belongs in the bucket key rather than in a per-pair check, so the
    // journeys of an imported flight log are never compared against each other.
    const endpoint: Endpoint = { row, booking, keys: keys.map((key) => `${row.trip_id}:${key}`), ...instants };
    if (arriving) {
      landings.push(endpoint);
      continue;
    }
    for (const key of endpoint.keys) {
      const bucket = departures.get(key);
      if (bucket) bucket.push(endpoint);
      else departures.set(key, [endpoint]);
    }
  }

  // In time order, so an arrival can stop looking once the ground time is out of
  // reach. Ten years of flight log imported into one trip put hundreds of
  // departures on a home airport, and comparing every arrival against all of them
  // cost more than a second on both request paths that call this.
  for (const bucket of departures.values()) bucket.sort((a, b) => a.sortMs - b.sortMs);

  for (const arrival of landings) {
    const until = arrival.dayMs + SCAN_WINDOW_MS;
    // An endpoint carrying both a code and a coordinate sits in two buckets, so
    // without this the same pair would be judged twice.
    const seen = arrival.keys.length > 1 ? new Set<Endpoint>() : null;
    for (const key of arrival.keys) {
      const left = departures.get(key);
      if (!left) continue;
      for (let i = firstFrom(left, arrival.dayMs); i < left.length; i++) {
        const departure = left[i];
        if (departure.sortMs > until) break;
        if (seen) {
          if (seen.has(departure)) continue;
          seen.add(departure);
        }
        if (departure.row.reservation_id === arrival.row.reservation_id) continue;
        if (returnsToOrigin(departure, arrival)) continue;
        if (!isConnection(arrival, departure)) continue;
        transfers.add(arrival.row.id);
        transfers.add(departure.row.id);
      }
    }
  }

  return transfers;
}
