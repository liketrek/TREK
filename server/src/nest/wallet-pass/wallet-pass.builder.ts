import { createHash } from 'node:crypto';
import tzLookup from 'tz-lookup';

/**
 * A booking as an Apple Wallet pass: what this server sends the TREK services'
 * pass signer (push.liketrek.com/v1/wallet/pass), which builds and signs the
 * .pkpass. Pure: the service hands the booking, its endpoints, the trip's title
 * and the words in the user's language in; nothing here reads or fetches.
 *
 * The signer takes plain text of bounded length and refuses a spelled-out link,
 * so every text is cleaned and shortened here rather than refused there.
 */

export type WalletPassKind =
  'flight' | 'train' | 'bus' | 'boat' | 'car' | 'hotel' | 'restaurant' | 'event' | 'tour' | 'other';

export interface WalletPassField {
  label: string;
  value: string;
}

/** The signer's request body (control-plane/src/wallet-pass.ts in trek-hosted). */
export interface WalletPassRequest {
  kind: WalletPassKind;
  serial: string;
  title: string;
  trip?: string;
  start: string;
  end?: string;
  from?: { code?: string; name: string };
  to?: { code?: string; name: string };
  location?: { latitude: number; longitude: number; name?: string };
  details?: WalletPassField[];
  back?: WalletPassField[];
  confirmation?: WalletPassField;
  locale?: string;
}

/** The labels a pass shows, in the user's language (wallet-pass.words.ts). */
export interface WalletWords {
  locale: string;
  departure: string;
  arrival: string;
  pickup: string;
  dropOff: string;
  checkIn: string;
  checkOut: string;
  time: string;
  seat: string;
  platform: string;
  flightNumber: string;
  trainNumber: string;
  airline: string;
  confirmation: string;
  location: string;
}

export interface WalletPassEndpoint {
  role: 'from' | 'to' | 'stop';
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_time: string | null;
  local_date: string | null;
}

export interface WalletPassSource {
  reservation: {
    id: number;
    trip_id: number;
    title: string;
    type: string | null;
    reservation_time?: string | null;
    reservation_end_time?: string | null;
    confirmation_number?: string | null;
    location?: string | null;
    created_at?: string | null;
    metadata: Record<string, unknown>;
  };
  endpoints: WalletPassEndpoint[];
  tripTitle: string | null;
  /** The booking's place (the hotel, the restaurant), when it has coordinates. */
  place: { lat: number; lng: number; name: string | null } | null;
}

const KIND_OF: Record<string, WalletPassKind> = {
  flight: 'flight',
  train: 'train',
  bus: 'bus',
  transit: 'bus',
  cable_car: 'bus',
  cruise: 'boat',
  ferry: 'boat',
  car: 'car',
  taxi: 'car',
  bicycle: 'car',
  parking: 'car',
  hotel: 'hotel',
  restaurant: 'restaurant',
  event: 'event',
  tour: 'tour',
};

export function kindOf(type: string | null | undefined): WalletPassKind {
  return (type && KIND_OF[type]) || 'other';
}

/** A text for the pass: no spelled-out links, single-spaced, at most `max` characters. */
export function clean(value: unknown, max: number): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** "2027-04-02T15:00" and "2027-04-02 15:00" as their date and time parts; a bare date gets no time. */
function splitLocal(value: string | null | undefined): { date: string; time: string | null } | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(value.trim());
  if (!match) return null;
  return { date: match[1] as string, time: match[2] ?? null };
}

/** The UTC offset of a zone at a wall-clock time, in minutes ("+09:00" is 540). */
function offsetMinutes(timeZone: string, wallClockAsUtc: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(wallClockAsUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const shown = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((shown - wallClockAsUtc) / 60_000);
}

/**
 * A local date and time with the offset its zone has then: what Wallet needs to
 * bring the pass up at the right moment. Without a zone the time is taken as UTC,
 * which only shifts when the pass surfaces, never what it shows.
 */
export function withOffset(date: string, time: string | null, timeZone: string | null): string {
  const clock = time ?? '00:00';
  const asUtc = Date.parse(`${date}T${clock}:00Z`);
  let offset = 0;
  if (timeZone) {
    try {
      // Twice, so a wall-clock time right after a DST change takes the offset it really has.
      offset = offsetMinutes(timeZone, asUtc - offsetMinutes(timeZone, asUtc) * 60_000);
    } catch {
      offset = 0;
    }
  }
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${date}T${clock}:00${sign}${hh}:${mm}`;
}

function zoneAt(lat: number | undefined, lng: number | undefined): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    return tzLookup(lat, lng);
  } catch {
    return null;
  }
}

/** "Fri 2 Apr, 15:00" in the user's language, as the wall clock says it (no zone shift). */
export function displayTime(locale: string, date: string, time: string | null): string {
  const asUtc = new Date(`${date}T${time ?? '00:00'}:00Z`);
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' };
  if (time) Object.assign(options, { hour: '2-digit', minute: '2-digit' });
  try {
    return new Intl.DateTimeFormat(locale, options).format(asUtc);
  } catch {
    return new Intl.DateTimeFormat('en', options).format(asUtc);
  }
}

function text(meta: Record<string, unknown>, key: string, max = 64): string | undefined {
  const value = meta[key];
  return typeof value === 'string' || typeof value === 'number' ? clean(value, max) : undefined;
}

/** A stable serial for the booking, so adding its pass again replaces the one in Wallet. */
export function serialFor(reservation: WalletPassSource['reservation']): string {
  const digest = createHash('sha256')
    .update(`${reservation.trip_id}:${reservation.id}:${reservation.created_at ?? ''}`)
    .digest('hex')
    .slice(0, 16);
  return `trek-${reservation.id}-${digest}`;
}

const CONFIRMATION = /^[A-Za-z0-9 ._/-]{1,40}$/;

/**
 * The request for a booking's pass, or null when it has no date to bring the
 * pass up on (a booking without a time is not something Wallet can surface).
 */
export function buildWalletPassRequest(src: WalletPassSource, words: WalletWords): WalletPassRequest | null {
  const { reservation, endpoints } = src;
  const meta = reservation.metadata;
  const kind = kindOf(reservation.type);
  const fromEnd = endpoints.find((e) => e.role === 'from');
  const toEnd = [...endpoints].reverse().find((e) => e.role === 'to');
  const journey = kind === 'flight' || kind === 'train' || kind === 'bus' || kind === 'boat';

  // When it starts: the departure as the endpoint knows it, else the booking's own time.
  const startLocal =
    (journey && fromEnd?.local_date ? { date: fromEnd.local_date, time: fromEnd.local_time } : null) ??
    splitLocal(reservation.reservation_time);
  if (!startLocal) return null;
  const endLocal =
    (journey && toEnd?.local_date ? { date: toEnd.local_date, time: toEnd.local_time } : null) ??
    splitLocal(reservation.reservation_end_time);

  const place = src.place ?? (fromEnd && !journey ? { lat: fromEnd.lat, lng: fromEnd.lng, name: fromEnd.name } : null);
  const startZone =
    fromEnd?.timezone ?? zoneAt(journey ? fromEnd?.lat : place?.lat, journey ? fromEnd?.lng : place?.lng);
  const endZone = toEnd?.timezone ?? zoneAt(toEnd?.lat ?? place?.lat, toEnd?.lng ?? place?.lng) ?? startZone;

  const title = clean(reservation.title, 60) ?? clean(words.location, 60) ?? 'TREK';
  const request: WalletPassRequest = {
    kind,
    serial: serialFor(reservation),
    title,
    start: withOffset(startLocal.date, startLocal.time, startZone),
    locale: words.locale,
  };
  const trip = clean(src.tripTitle, 60);
  if (trip) request.trip = trip;
  if (endLocal) request.end = withOffset(endLocal.date, endLocal.time, endZone);

  const details: WalletPassField[] = [];
  const add = (label: string, value: string | undefined) => {
    const v = clean(value, 64);
    if (v && details.length < 4) details.push({ label: clean(label, 24) ?? label.slice(0, 24), value: v });
  };
  const when = (date: string, time: string | null) => displayTime(words.locale, date, time);

  if (journey && fromEnd && toEnd) {
    request.from = { name: clean(fromEnd.name, 40) ?? '?', ...(fromEnd.code ? { code: clean(fromEnd.code, 8) } : {}) };
    request.to = { name: clean(toEnd.name, 40) ?? '?', ...(toEnd.code ? { code: clean(toEnd.code, 8) } : {}) };
    add(words.departure, when(startLocal.date, startLocal.time));
    if (kind === 'flight') {
      const number = [text(meta, 'airline', 30), text(meta, 'flight_number', 12)].filter(Boolean).join(' ');
      add(words.flightNumber, number || undefined);
    }
    if (kind === 'train') add(words.trainNumber, text(meta, 'train_number', 20));
    add(words.seat, text(meta, 'seat', 16));
    add(words.platform, text(meta, 'platform', 16));
    if (endLocal) add(words.arrival, when(endLocal.date, endLocal.time));
  } else if (kind === 'hotel') {
    add(words.checkIn, when(startLocal.date, text(meta, 'check_in_time', 5) ?? startLocal.time));
    if (endLocal) add(words.checkOut, when(endLocal.date, text(meta, 'check_out_time', 5) ?? endLocal.time));
  } else if (kind === 'car') {
    add(words.pickup, when(startLocal.date, startLocal.time));
    if (endLocal) add(words.dropOff, when(endLocal.date, endLocal.time));
  } else {
    add(words.time, when(startLocal.date, startLocal.time));
  }

  // A journey without both ends is shown as a plain booking, which the signer accepts.
  if (journey && !(request.from && request.to)) request.kind = 'other';

  if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng) && !journey) {
    const name = clean(place.name ?? reservation.location, 60);
    request.location = { latitude: place.lat, longitude: place.lng, ...(name ? { name } : {}) };
  } else if (journey && fromEnd) {
    request.location = {
      latitude: fromEnd.lat,
      longitude: fromEnd.lng,
      ...(fromEnd.name ? { name: clean(fromEnd.name, 60) } : {}),
    };
  }

  if (details.length) request.details = details;
  const back: WalletPassField[] = [];
  const where = clean(reservation.location, 64);
  if (where) back.push({ label: clean(words.location, 24) ?? 'Location', value: where });

  const code = reservation.confirmation_number?.trim();
  if (code && CONFIRMATION.test(code)) {
    request.confirmation = { label: clean(words.confirmation, 24) ?? 'Confirmation', value: code };
  } else if (code) {
    const shown = clean(code, 64);
    if (shown) back.push({ label: clean(words.confirmation, 24) ?? 'Confirmation', value: shown });
  }
  if (back.length) request.back = back;
  return request;
}
