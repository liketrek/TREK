/**
 * Dashboard data model + pure helpers — shared by the data hook (useDashboard)
 * and the presentational components in DashboardPage. Kept free of React/IO so
 * both sides can import it without a cycle. Part of the FE "page = wiring
 * container + data hook" convention (see dashboard/README.md).
 */

import tzlookup from 'tz-lookup';
import type { Day, Reservation, ReservationEndpoint, Trip } from '../../types';
import { TRANSPORT_TYPES } from '../../utils/dayMerge';
import { localIsoDate } from '../../utils/localDate';

// The dashboard works with the canonical Trip shape returned by the list/get
// endpoints (it already carries the computed day_count/place_count/is_owner/
// owner_username/shared_count fields). Kept as a named alias so the existing
// imports stay stable.
export type DashboardTrip = Trip;

export interface Member {
  id: number;
  username: string;
  avatar_url?: string | null;
}
export interface Place {
  id: number;
  name: string;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  google_place_id: string | null;
  osm_id: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}
export interface HeroBundle {
  members: Member[];
  places: Place[];
  days: Day[];
  reservations: Reservation[];
}
export interface TravelStats {
  totalTrips?: number;
  totalDays?: number;
  totalPlaces?: number;
  totalDistanceKm?: number;
  countries?: string[];
}
export interface UpcomingReservation {
  id: number;
  trip_id: number;
  title: string;
  type: string;
  reservation_time?: string | null;
  day_date?: string | null;
  location?: string | null;
  place_name?: string | null;
  trip_title?: string | null;
}

export const MS_PER_DAY = 86400000;

export interface DepartureTransport {
  reservationId: number;
  title: string;
  departureAt: number;
  localTime: string;
  timeZone: string;
}

interface WallClockParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = ISO_DATE.exec(value.slice(0, 10));
  if (!match) return null;
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
    ? `${match[1]}-${match[2]}-${match[3]}`
    : null;
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = LOCAL_TIME.exec(value);
  if (!match) return null;
  const hour = Number(match[1]),
    minute = Number(match[2]),
    second = Number(match[3] || 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function originEndpoint(reservation: Reservation): ReservationEndpoint | null {
  return (
    (reservation.endpoints || [])
      .filter((endpoint) => endpoint.role === 'from')
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))[0] ?? null
  );
}

function validTimeZone(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(0);
    return value;
  } catch {
    return null;
  }
}

function originTimeZone(endpoint: ReservationEndpoint | null): string | null {
  if (!endpoint) return null;
  const explicit = validTimeZone(endpoint.timezone);
  if (explicit) return explicit;
  if (!Number.isFinite(endpoint.lat) || !Number.isFinite(endpoint.lng)) return null;
  try {
    return validTimeZone(tzlookup(endpoint.lat, endpoint.lng));
  } catch {
    return null;
  }
}

function wallClockParts(formatter: Intl.DateTimeFormat, epoch: number): WallClockParts | null {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(epoch))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  const values = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
  return Object.values(values).every(Number.isFinite) ? values : null;
}

const wallClockAsUtc = (parts: WallClockParts): number =>
  Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
const sameWallClock = (a: WallClockParts | null, b: WallClockParts): boolean =>
  !!a &&
  a.year === b.year &&
  a.month === b.month &&
  a.day === b.day &&
  a.hour === b.hour &&
  a.minute === b.minute &&
  a.second === b.second;

/** Convert an IANA-zone local wall time to an epoch, rejecting DST gaps. */
export function zonedLocalDateTimeToEpoch(date: string, time: string, timeZone: string): number | null {
  const normalizedDate = normalizeDate(date),
    normalizedTime = normalizeTime(time);
  if (!normalizedDate || !normalizedTime) return null;
  const [year, month, day] = normalizedDate.split('-').map(Number);
  const [hour, minute] = normalizedTime.split(':').map(Number);
  const desired: WallClockParts = { year, month, day, hour, minute, second: 0 };
  const desiredAsUtc = wallClockAsUtc(desired);
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
  const offsets = new Set<number>();
  for (const probe of [desiredAsUtc - 36 * 60 * 60 * 1000, desiredAsUtc, desiredAsUtc + 36 * 60 * 60 * 1000]) {
    const rendered = wallClockParts(formatter, probe);
    if (rendered) offsets.add(wallClockAsUtc(rendered) - probe);
  }
  const candidates = [...offsets]
    .map((offset) => desiredAsUtc - offset)
    .filter((candidate) => sameWallClock(wallClockParts(formatter, candidate), desired));
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

function resolvedLocalDateTime(
  reservation: Reservation,
  daysById: Map<number, string>
): { date: string; time: string | null } | null {
  const endpoint = originEndpoint(reservation);
  const stored = reservation.reservation_time?.includes('T')
    ? {
        date: normalizeDate(reservation.reservation_time.split('T')[0]),
        time: normalizeTime(reservation.reservation_time.split('T')[1]),
      }
    : { date: normalizeDate(reservation.reservation_time), time: normalizeTime(reservation.reservation_time) };
  const date =
    normalizeDate(endpoint?.local_date) ??
    stored.date ??
    (reservation.day_id != null ? normalizeDate(daysById.get(reservation.day_id)) : null);
  return date ? { date, time: normalizeTime(endpoint?.local_time) ?? stored.time } : null;
}

/** The first dated non-cancelled transport is fixed before precision checks. */
export function getDepartureTransport(
  reservations: Reservation[],
  days: Day[],
  now = Date.now()
): DepartureTransport | null {
  const daysById = new Map(
    days.flatMap((day) => {
      const date = normalizeDate(day.date);
      return date ? [[day.id, date] as const] : [];
    })
  );
  const candidates = reservations
    .filter((reservation) => TRANSPORT_TYPES.has(reservation.type) && reservation.status !== 'cancelled')
    .map((reservation) => ({ reservation, local: resolvedLocalDateTime(reservation, daysById) }))
    .filter(
      (candidate): candidate is { reservation: Reservation; local: { date: string; time: string | null } } =>
        !!candidate.local
    )
    .sort(
      (a, b) =>
        `${a.local.date}T${a.local.time ?? '00:00'}`.localeCompare(`${b.local.date}T${b.local.time ?? '00:00'}`) ||
        a.reservation.id - b.reservation.id
    );
  const first = candidates[0];
  if (!first?.local.time) return null;
  const timeZone = originTimeZone(originEndpoint(first.reservation));
  if (!timeZone) return null;
  const departureAt = zonedLocalDateTimeToEpoch(first.local.date, first.local.time, timeZone);
  if (departureAt === null || departureAt <= now) return null;
  return {
    reservationId: first.reservation.id,
    title: first.reservation.title || first.reservation.type,
    departureAt,
    localTime: first.local.time,
    timeZone,
  };
}

/**
 * Today as a local-calendar 'YYYY-MM-DD' — see utils/localDate for why this
 * must never come from toISOString(). Trip dates are wall-clock dates
 * (daysUntil below parses them as local midnight).
 */
export function localIsoToday(): string {
  return localIsoDate();
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / MS_PER_DAY);
}

export function getTripStatus(trip: DashboardTrip): 'ongoing' | 'today' | 'tomorrow' | 'future' | 'past' | null {
  const today = localIsoToday();
  if (trip.start_date && trip.end_date && trip.start_date <= today && trip.end_date >= today) return 'ongoing';
  const until = daysUntil(trip.start_date);
  if (until === null) return null;
  if (until === 0) return 'today';
  if (until === 1) return 'tomorrow';
  if (until > 1) return 'future';
  return 'past';
}

export function sortTrips(trips: DashboardTrip[]): DashboardTrip[] {
  const today = localIsoToday();
  const rank = (t: DashboardTrip) => {
    if (t.start_date && t.end_date && t.start_date <= today && t.end_date >= today) return 0;
    if (t.start_date && t.start_date >= today) return 1;
    return 2;
  };
  return [...trips].sort((a, b) => {
    const ra = rank(a),
      rb = rank(b);
    if (ra !== rb) return ra - rb;
    const ad = a.start_date || '',
      bd = b.start_date || '';
    if (ra <= 1) return ad.localeCompare(bd);
    return bd.localeCompare(ad);
  });
}
