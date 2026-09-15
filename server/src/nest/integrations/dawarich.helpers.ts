import { createHash } from 'crypto';
import type { DawarichTrackDay, DawarichTrackSegment } from '@trek/shared';
import type { DawarichSlimPoint, DawarichTrackFeature, DawarichVisitRaw, DawarichVisitedCountry } from './dawarich.client';

/**
 * Pure helpers for the Dawarich integration — no database, no HTTP, no
 * container. Everything that decides *what a recording means* lives here so it
 * can be tested against fixtures rather than against a live instance.
 */

// ── Time and local days ──────────────────────────────────────────────────────

/**
 * The local calendar date of an ISO timestamp, as the source itself means it.
 *
 * Rails renders a `TimeWithZone` as wall-clock time plus the offset, and
 * Dawarich's `ApiController#set_user_time_zone` wraps every request in the
 * *recording user's own* timezone. So the first ten characters of `started_at`
 * are already the local date that user sees in Dawarich — reading them is not a
 * shortcut, it is the only interpretation that cannot silently disagree with
 * the screen the stay came from.
 *
 * An instant in UTC (`…Z`) has no local meaning to recover, so it is taken as
 * given: that is what the source said.
 */
export function localDateOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Offset in minutes carried by an ISO string (`+02:00` → 120, `Z` → 0). */
export function offsetMinutesOf(iso: string): number {
  const match = /([+-])(\d{2}):?(\d{2})$/.exec(iso);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** Local wall-clock milliseconds — the instant shifted into the string's own offset. */
function localMs(iso: string): number {
  return Date.parse(iso) + offsetMinutesOf(iso) * 60_000;
}

/** `YYYY-MM-DD` of a local wall-clock millisecond value. */
function dateOfLocalMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Local midnight (as wall-clock ms) at the start of the day after `ms`. */
function nextLocalMidnight(ms: number): number {
  const day = Math.floor(ms / 86_400_000);
  return (day + 1) * 86_400_000;
}

/** Whole minutes between two ISO instants, never negative. */
export function minutesBetween(startIso: string, endIso: string): number {
  const delta = Date.parse(endIso) - Date.parse(startIso);
  return Number.isFinite(delta) && delta > 0 ? Math.round(delta / 60_000) : 0;
}

/**
 * The window to ask Dawarich about for a trip.
 *
 * Widened on both sides, for two different reasons. Backwards, because the
 * visits endpoint filters on `started_at` alone: a stay that began the evening
 * before and ran into the first morning is invisible at an exact boundary.
 * Forwards, because a stay on the last day ends after it.
 *
 * A trip with no end date is open-ended; it gets the lookback and stops at now,
 * because a plan reaching into next year is not a recording.
 */
export function syncWindow(
  startDate: string | null,
  endDate: string | null,
  now: Date,
  lookbackDays: number,
  lookaheadDays: number,
): { from: Date; to: Date } | null {
  const start = startDate ? Date.parse(`${startDate}T00:00:00Z`) : NaN;
  if (!Number.isFinite(start)) return null;
  const from = new Date(start - lookbackDays * 86_400_000);

  const end = endDate ? Date.parse(`${endDate}T23:59:59Z`) : NaN;
  const to = Number.isFinite(end)
    ? new Date(Math.min(end + lookaheadDays * 86_400_000, now.getTime()))
    : now;

  return to.getTime() > from.getTime() ? { from, to } : null;
}

// ── Change detection ─────────────────────────────────────────────────────────

/**
 * A stable fingerprint of the fields TREK shows for a visit.
 *
 * Dawarich sends no `updated_at`, so this is the whole of change detection: a
 * renamed, re-timed or re-placed visit hashes differently, and everything else
 * — a re-run of the detector that produced the same answer — hashes the same
 * and stays quiet. Field order is fixed rather than derived from the object,
 * because `JSON.stringify` of a parsed payload preserves key order and a
 * provider reordering its serializer would otherwise look like every visit
 * changing at once.
 */
export function visitHash(visit: DawarichVisitRaw): string {
  const parts = [
    String(visit.id),
    visit.name ?? '',
    visit.started_at,
    visit.ended_at,
    String(visit.status ?? ''),
    String(visit.place?.latitude ?? ''),
    String(visit.place?.longitude ?? ''),
    String(visit.place?.id ?? ''),
  ];
  return createHash('sha256').update(parts.join('\u0000')).digest('hex');
}

/** Numbers reach TREK as numbers or as strings depending on the endpoint. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * A visit reduced to what TREK stores.
 *
 * `status` is normalised rather than trusted: "declined" stopped existing in
 * Dawarich 1.12.0 and anything unrecognised is treated as a suggestion, which
 * is the side that asks the user rather than the side that acts.
 */
export function normalizeVisit(visit: DawarichVisitRaw): {
  sourceVisitId: string;
  name: string;
  lat: number | null;
  lng: number | null;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  localDate: string;
  status: 'suggested' | 'confirmed';
  confidence: number | null;
  confidenceBand: string | null;
  countryCodeFromSource: string | null;
} | null {
  if (visit?.id === undefined || visit?.id === null) return null;
  if (typeof visit.started_at !== 'string' || typeof visit.ended_at !== 'string') return null;
  if (!Number.isFinite(Date.parse(visit.started_at))) return null;

  // MINUTES, not seconds. Dawarich writes the column as
  // `duration_minutes = ((ended_at - started_at) / 60).to_i` in
  // `app/services/visits/create.rb` and its serializer passes that straight
  // through; the merge service rounds the same way. Read as seconds it divided
  // by sixty a second time, so an eighteen-minute stop reached the panel as
  // "0 min" and an afternoon somewhere as "2 min". Confirmed against a live
  // 1.14.5: a visit spanning 11:00:00 to 11:18:45 reports `duration: 18`.
  const durationField = toNumber(visit.duration);

  // An `ended_at` that does not parse is repaired rather than passed through:
  // kept as-is it renders as "Invalid Date" next to a perfectly good arrival
  // time, which looks like TREK lost the data rather than the source sending
  // something odd. The reported duration is the better source for the end, and
  // the arrival itself is the honest fallback when there is none.
  const endParses = Number.isFinite(Date.parse(visit.ended_at));
  const endedAt = endParses
    ? visit.ended_at
    : new Date(
        Date.parse(visit.started_at) + (durationField !== null && durationField > 0 ? durationField * 60_000 : 0),
      ).toISOString();

  // The span between the two timestamps wins wherever there is one: it is the
  // value that agrees with the arrival and departure shown beside it, and it
  // holds whatever unit a future Dawarich decides on. The reported figure only
  // stands in when `ended_at` was unusable, and it is minutes.
  const durationMinutes = endParses
    ? minutesBetween(visit.started_at, endedAt)
    : durationField !== null && durationField > 0
      ? Math.round(durationField)
      : 0;

  const rawCode = visit.place?.country_code;
  return {
    sourceVisitId: String(visit.id),
    name: (visit.name ?? '').trim() || 'Unnamed stay',
    lat: toNumber(visit.place?.latitude),
    lng: toNumber(visit.place?.longitude),
    startedAt: visit.started_at,
    endedAt,
    durationMinutes,
    localDate: localDateOf(visit.started_at),
    status: visit.status === 'confirmed' ? 'confirmed' : 'suggested',
    confidence: toNumber(visit.confidence),
    confidenceBand: typeof visit.confidence_band === 'string' ? visit.confidence_band : null,
    countryCodeFromSource:
      typeof rawCode === 'string' && rawCode.length === 2 ? rawCode.toUpperCase() : null,
  };
}

// ── Geometry ─────────────────────────────────────────────────────────────────

/** Metres between two coordinates. Equirectangular — exact enough well under a kilometre. */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = Math.PI / 180;
  const x = (bLng - aLng) * toRad * Math.cos(((aLat + bLat) / 2) * toRad);
  const y = (bLat - aLat) * toRad;
  return Math.sqrt(x * x + y * y) * R;
}

/**
 * Ramer–Douglas–Peucker, iterative.
 *
 * Recursion is the textbook shape and the wrong one here: a day of one-second
 * tracking is tens of thousands of points and a nearly straight motorway run is
 * its worst case, which is exactly where the recursion depth peaks.
 */
export function simplify(points: Array<[number, number]>, epsilon: number): Array<[number, number]> {
  if (points.length <= 2) return points;

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    if (last <= first + 1) continue;

    let maxDist = 0;
    let index = first;
    for (let i = first + 1; i < last; i++) {
      const dist = perpendicularDistance(points[i]!, points[first]!, points[last]!);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > epsilon) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i] === 1);
}

/** Perpendicular distance in degrees, longitude scaled so the metric is not latitude-skewed. */
function perpendicularDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number],
): number {
  const scale = Math.cos((point[0] * Math.PI) / 180) || 1;
  const px = point[1] * scale;
  const py = point[0];
  const sx = start[1] * scale;
  const sy = start[0];
  const ex = end[1] * scale;
  const ey = end[0];

  const dx = ex - sx;
  const dy = ey - sy;
  if (dx === 0 && dy === 0) return Math.hypot(px - sx, py - sy);

  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (sx + t * dx), py - (sy + t * dy));
}

/**
 * Cap a polyline at `max` points by keeping an even stride.
 *
 * A backstop behind `simplify`, not a replacement: simplification keeps corners
 * and drops straights, which is what a route should look like, but a
 * sufficiently jittery recording survives it. The first and last point are
 * always kept so the line still starts and ends where the day did.
 */
export function capPoints(points: Array<[number, number]>, max: number): Array<[number, number]> {
  if (points.length <= max || max < 2) return points;
  const stride = (points.length - 1) / (max - 1);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < max - 1; i++) out.push(points[Math.round(i * stride)]!);
  out.push(points[points.length - 1]!);
  return out;
}

/** `[lng, lat]` GeoJSON pairs → TREK's `[lat, lng]`, skipping anything unusable. */
export function geoJsonToLatLng(coordinates: unknown): Array<[number, number]> {
  if (!Array.isArray(coordinates)) return [];
  const out: Array<[number, number]> = [];
  for (const pair of coordinates) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const lng = toNumber(pair[0]);
    const lat = toNumber(pair[1]);
    if (lat === null || lng === null) continue;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    out.push([lat, lng]);
  }
  return out;
}

// ── Grouping a recording into local days ─────────────────────────────────────

interface BucketOptions {
  /** Points kept per day after simplification. */
  maxPointsPerDay: number;
  /** Simplification tolerance in degrees. ~5e-5 is roughly five metres. */
  epsilon: number;
}

const DEFAULT_BUCKET: BucketOptions = { maxPointsPerDay: 600, epsilon: 0.00005 };

/**
 * Recorded points → one entry per local calendar day.
 *
 * Midnight is exact here: every point carries its own timestamp, so a drive
 * that runs from 23:40 to 00:20 genuinely ends one day and begins the next. The
 * last point of a day is repeated as the first of the next so the two lines
 * meet instead of leaving a gap across midnight.
 */
export function bucketPointsByDay(
  points: DawarichSlimPoint[],
  offsetMinutes: number,
  options: Partial<BucketOptions> = {},
): DawarichTrackDay[] {
  const { maxPointsPerDay, epsilon } = { ...DEFAULT_BUCKET, ...options };
  const byDay = new Map<string, Array<{ lat: number; lng: number; ts: number }>>();

  for (const point of points) {
    const lat = toNumber(point.latitude);
    const lng = toNumber(point.longitude);
    const ts = toNumber(point.timestamp);
    if (lat === null || lng === null || ts === null) continue;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    const date = dateOfLocalMs(ts * 1000 + offsetMinutes * 60_000);
    const bucket = byDay.get(date);
    if (bucket) bucket.push({ lat, lng, ts });
    else byDay.set(date, [{ lat, lng, ts }]);
  }

  const dates = [...byDay.keys()].sort();
  const days: DawarichTrackDay[] = [];

  for (let d = 0; d < dates.length; d++) {
    const date = dates[d]!;
    const own = byDay.get(date)!.sort((a, b) => a.ts - b.ts);
    // Stitch the previous day's last point on, so consecutive days join up
    // rather than showing a jump the traveller never made.
    const previous = d > 0 ? byDay.get(dates[d - 1]!) : undefined;
    const stitched = previous?.length ? [previous[previous.length - 1]!, ...own] : own;

    const line = capPoints(
      simplify(stitched.map((p): [number, number] => [p.lat, p.lng]), epsilon),
      maxPointsPerDay,
    );
    if (line.length < 2) continue;

    days.push({
      date,
      segments: [
        {
          points: line,
          mode: null,
          startedAt: new Date(own[0]!.ts * 1000).toISOString(),
          endedAt: new Date(own[own.length - 1]!.ts * 1000).toISOString(),
          distanceMeters: null,
        },
      ],
    });
  }

  return days;
}

/**
 * Dawarich tracks → one entry per local calendar day.
 *
 * A track has a start and an end but no per-point times, so a track that runs
 * across midnight is cut by **index proportion of its time span**. That is an
 * approximation, and a deliberate one: it is precisely the approximation
 * Dawarich itself applies to its own mode timeline for tracks whose segments
 * predate time anchoring. Inventing a more confident split would be fiction —
 * the timestamps to do it exactly are not in the payload.
 */
export function bucketTracksByDay(
  features: DawarichTrackFeature[],
  options: Partial<BucketOptions> = {},
): DawarichTrackDay[] {
  const { maxPointsPerDay, epsilon } = { ...DEFAULT_BUCKET, ...options };
  const byDay = new Map<string, DawarichTrackSegment[]>();

  for (const feature of features) {
    const props = feature?.properties;
    const startedAt = typeof props?.start_at === 'string' ? props.start_at : null;
    const endedAt = typeof props?.end_at === 'string' ? props.end_at : null;
    if (!startedAt || !endedAt) continue;

    const points = geoJsonToLatLng(feature?.geometry?.coordinates);
    if (points.length < 2) continue;

    const mode = typeof props?.dominant_mode === 'string' ? props.dominant_mode : null;
    const distance = toNumber(props?.distance);

    for (const piece of splitAtLocalMidnight(points, startedAt, endedAt)) {
      const line = capPoints(simplify(piece.points, epsilon), maxPointsPerDay);
      if (line.length < 2) continue;
      const segment: DawarichTrackSegment = {
        points: line,
        mode,
        startedAt: piece.startedAt,
        endedAt: piece.endedAt,
        // A split piece's share of the distance is a guess; only a whole track
        // reports the number Dawarich actually measured.
        distanceMeters: piece.whole ? distance : null,
      };
      const bucket = byDay.get(piece.date);
      if (bucket) bucket.push(segment);
      else byDay.set(piece.date, [segment]);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, segments]) => ({
      date,
      segments: segments.sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)),
    }));
}

/** One piece of a track that falls entirely inside a single local day. */
interface TrackPiece {
  date: string;
  points: Array<[number, number]>;
  startedAt: string;
  endedAt: string;
  /** True when the track never crossed midnight and was not actually cut. */
  whole: boolean;
}

function splitAtLocalMidnight(
  points: Array<[number, number]>,
  startedAt: string,
  endedAt: string,
): TrackPiece[] {
  const startLocal = localMs(startedAt);
  const endLocal = localMs(endedAt);
  const startDate = dateOfLocalMs(startLocal);
  const endDate = dateOfLocalMs(endLocal);

  if (startDate === endDate || !(endLocal > startLocal)) {
    return [{ date: startDate, points, startedAt, endedAt, whole: true }];
  }

  // How many midnights the track runs through, and therefore how many pieces it
  // would have to become.
  const boundaries: number[] = [];
  for (let boundary = nextLocalMidnight(startLocal); boundary < endLocal; boundary += 86_400_000) {
    boundaries.push(boundary);
  }

  // Not enough geometry to give every day a drawable piece — a two-point line
  // across midnight is one segment, and cutting it would hand one day a single
  // point and the other nothing. The whole track goes on the day it started,
  // which is where its `started_at` puts it and what the times on it already
  // say. Pretending to a split we cannot make would quietly lose the tail.
  if (points.length - 1 < boundaries.length + 1) {
    return [{ date: startDate, points, startedAt, endedAt, whole: true }];
  }

  const offset = offsetMinutesOf(startedAt) * 60_000;
  const span = endLocal - startLocal;
  const pieces: TrackPiece[] = [];
  let cutIndex = 0;
  let cutLocal = startLocal;

  for (const boundary of boundaries) {
    const index = Math.max(
      cutIndex + 1,
      Math.min(points.length - 1, Math.round(((boundary - startLocal) / span) * (points.length - 1))),
    );
    // The boundary point belongs to both sides, so each day's line reaches
    // midnight instead of stopping short of it.
    pieces.push({
      date: dateOfLocalMs(cutLocal),
      points: points.slice(cutIndex, index + 1),
      startedAt: new Date(cutLocal - offset).toISOString(),
      endedAt: new Date(boundary - offset).toISOString(),
      whole: false,
    });
    cutIndex = index;
    cutLocal = boundary;
    if (cutIndex >= points.length - 1) break;
  }

  if (cutIndex < points.length - 1) {
    pieces.push({
      date: dateOfLocalMs(cutLocal),
      points: points.slice(cutIndex),
      startedAt: new Date(cutLocal - offset).toISOString(),
      endedAt,
      whole: false,
    });
  }

  return pieces;
}

/** Total points across every day, for the "how much did we draw" report. */
export function countPoints(days: DawarichTrackDay[]): number {
  return days.reduce(
    (total, day) => total + day.segments.reduce((sum, segment) => sum + segment.points.length, 0),
    0,
  );
}

// ── Visited cities ───────────────────────────────────────────────────────────

/**
 * How much recording one `visited_cities` request may cover.
 *
 * Dawarich computes that endpoint on the spot: it loads every point in the
 * window, sorts them in memory and walks them into stays, with nothing cached.
 * A year in one request is fine for someone who records a point a minute and a
 * certain timeout for someone who records one every few seconds, because the
 * work grows with the points while the request budget stays fixed. A month is
 * a twelfth of that work per request.
 */
export const VISITED_CITIES_WINDOW_DAYS = 30;

/**
 * `[from, to]` cut into consecutive windows of at most `days`.
 *
 * Dawarich reads the bounds as an inclusive range (`start_at..end_at`), so each
 * window after the first starts one second past the end of the one before. With
 * touching bounds a point recorded on that exact second would be counted twice.
 * Bounds are whole seconds for the same reason: that is what goes on the wire.
 */
export function splitWindow(from: Date, to: Date, days: number): Array<{ from: Date; to: Date }> {
  const step = days * 86_400_000;
  const end = Math.floor(to.getTime() / 1000) * 1000;
  const windows: Array<{ from: Date; to: Date }> = [];
  let start = Math.floor(from.getTime() / 1000) * 1000;
  while (start <= end) {
    const stop = Math.min(start + step, end);
    windows.push({ from: new Date(start), to: new Date(stop) });
    if (stop === end) break;
    start = stop + 1000;
  }
  return windows;
}

/**
 * Several `visited_cities` answers folded into one, as if the whole range had
 * been asked for at once.
 *
 * Countries keep the order they were first seen in, cities within a country
 * likewise. A city seen in more than one window adds up its minutes and points
 * and keeps the latest timestamp. The payload arrives unvalidated, so an entry
 * without a usable name is skipped here rather than guessed at.
 *
 * One thing a split cannot recover: Dawarich drops a stay shorter than the
 * user's minimum per window, so a stay cut in half by a window boundary can fall
 * under it on both sides. That costs a city at most, never a country the rest of
 * the recording found.
 */
export function mergeVisitedCountries(answers: DawarichVisitedCountry[][]): DawarichVisitedCountry[] {
  const countries = new Map<string, Map<string, DawarichVisitedCountry['cities'][number]>>();
  for (const answer of answers) {
    for (const entry of answer) {
      if (!entry || typeof entry.country !== 'string') continue;
      let cities = countries.get(entry.country);
      if (!cities) {
        cities = new Map();
        countries.set(entry.country, cities);
      }
      for (const city of Array.isArray(entry.cities) ? entry.cities : []) {
        if (!city || typeof city.city !== 'string') continue;
        const seen = cities.get(city.city);
        if (!seen) {
          cities.set(city.city, { ...city });
          continue;
        }
        seen.points = sumOf(seen.points, city.points);
        seen.stayed_for = sumOf(seen.stayed_for, city.stayed_for);
        const latest = Math.max(toNumber(seen.timestamp) ?? -Infinity, toNumber(city.timestamp) ?? -Infinity);
        seen.timestamp = Number.isFinite(latest) ? latest : undefined;
      }
    }
  }
  return [...countries].map(([country, cities]) => ({ country, cities: [...cities.values()] }));
}

/** Two optional counts added up; absent when neither side had one. */
function sumOf(a: unknown, b: unknown): number | undefined {
  const left = toNumber(a);
  const right = toNumber(b);
  if (left === null && right === null) return undefined;
  return (left ?? 0) + (right ?? 0);
}
