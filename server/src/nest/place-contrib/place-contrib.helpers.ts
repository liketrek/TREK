import { MAX_RETRY_AFTER_MS, RETRY_DELAYS_MS, SUMMARY_MAX_CHARS, VALUE_MAX_CHARS } from './place-contrib.constants';
import {
  parsePlaceHours,
  placeWebsiteSchema,
  type PlaceContribField,
  type PlaceContribFieldResult,
  type PlaceContribLogResult,
  type PlaceHoursDay,
  type PlaceOpeningHours,
} from '@trek/shared';

import { createHash, randomInt } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32 = /^[0-9a-f]{32}$/i;
const OSM_ID = /^(node|way|relation):(\d{1,15})$/;
/** Where the place pictures users upload live (the places domain's `placeImageUrl`). */
export const UPLOADED_IMAGE_PREFIX = '/uploads/places/';

/**
 * The key the service files a place under: `gers:<id>` for a place from the
 * TREK index, `osm:<type>/<id>` for an OpenStreetMap element. A place without
 * one (a free pin, a Google or Amap place) is not sent in this version.
 */
export function contribKeyOf(osmId: string | null | undefined): string | null {
  const id = osmId?.trim() ?? '';
  if (id.startsWith('gers:')) {
    const gers = id.slice('gers:'.length).toLowerCase();
    return UUID.test(gers) || HEX32.test(gers) ? `gers:${gers}` : null;
  }
  const osm = OSM_ID.exec(id);
  return osm ? `osm:${osm[1]}/${osm[2]}` : null;
}

/** The gers id inside a key, for the lookup of what the service serves for it. */
export function gersOf(key: string): string | null {
  return key.startsWith('gers:') ? key.slice('gers:'.length) : null;
}

/** What a field sends, or why it stays home. */
type ContribPayload = { value: string } | { withheld: string };

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

/** One day in OSM syntax: `off`, `HH:MM-HH:MM`, or null for a day nobody set. */
function daySpec(day: PlaceHoursDay): string | null {
  if (day.closed) return 'off';
  if (!day.open || !day.close) return null;
  // An interval that ends before it starts runs past midnight, which OSM
  // spells the same way: 22:00-02:00.
  return `${day.open}-${day.close}`;
}

/**
 * The week as an OSM opening_hours rule, consecutive days with the same hours
 * folded into a range: `Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off`. Only the
 * days the user set are named; a day without times stays out instead of being
 * claimed as closed. Null for a week that says nothing.
 */
export function osmHoursOf(week: PlaceOpeningHours): string | null {
  const specs = week.map(daySpec);
  const parts: string[] = [];
  let start = 0;
  while (start < specs.length) {
    let end = start;
    while (end + 1 < specs.length && specs[end + 1] === specs[start]) end += 1;
    const spec = specs[start];
    if (spec !== null) {
      const days = start === end ? DAY_NAMES[start] : `${DAY_NAMES[start]}-${DAY_NAMES[end]}`;
      parts.push(`${days} ${spec}`);
    }
    start = end + 1;
  }
  return parts.length ? parts.join('; ') : null;
}

function hoursPayload(raw: string): ContribPayload {
  const week = parsePlaceHours(raw);
  if (!week) return { withheld: 'hours_unreadable' };
  if (week.every((day) => day.closed)) return { withheld: 'hours_all_closed' };
  const value = osmHoursOf(week);
  return value ? { value } : { withheld: 'hours_empty' };
}

/**
 * The value a field sends, normalized the way the service reads it, or the
 * reason it is kept home. The service normalizes again and its reading wins;
 * this only keeps out what it would refuse anyway.
 */
export function payloadOf(field: PlaceContribField, raw: string): ContribPayload {
  const text = raw.trim();
  if (!text) return { withheld: 'empty' };
  switch (field) {
    case 'website': {
      const parsed = placeWebsiteSchema.safeParse(text);
      return parsed.success && parsed.data ? { value: parsed.data } : { withheld: 'website_invalid' };
    }
    case 'email':
      return { value: text.toLowerCase() };
    case 'opening_hours':
      return hoursPayload(text);
    case 'image':
      // Only a picture uploaded to the place itself; a link, a provider's photo
      // or an inline image is not the user's to give away.
      return text.startsWith(UPLOADED_IMAGE_PREFIX) ? { value: text } : { withheld: 'image_not_uploaded' };
    default:
      return text.length > VALUE_MAX_CHARS ? { withheld: 'too_long' } : { value: text };
  }
}

/** A short line for the log: enough to recognise the value, never the whole description. */
export function summaryOf(field: PlaceContribField, value: string): string {
  if (field === 'image') return 'image';
  const line = value.replace(/\s+/g, ' ').trim();
  return line.length > SUMMARY_MAX_CHARS ? `${line.slice(0, SUMMARY_MAX_CHARS - 1)}…` : line;
}

/** The `baseHash` the service compares with: a prefix of the SHA-256 of the value it served. */
export function baseHashOf(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16) : null;
}

/**
 * The idempotency id of one request: stable for the same queued values, so a
 * retry after a lost answer is recognised as the same contribution, and new
 * as soon as one of them was replaced.
 */
/** Plain code-unit order: the same on every server, where a locale's collation is not. */
const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export function requestCid(entryCids: readonly string[]): string {
  const digest = createHash('sha256')
    .update([...entryCids].sort(byCodeUnit).join(','))
    .digest('base64url');
  return digest.slice(0, 32);
}

/** A fresh id for a queued value. */
export function newEntryCid(): string {
  return createHash('sha256')
    .update(`${Date.now()}:${randomInt(2 ** 47)}`)
    .digest('base64url')
    .slice(0, 24);
}

/** The wait after `attempts` failed attempts (1 for the first). */
export function retryDelayMs(attempts: number): number {
  const index = Math.min(Math.max(attempts, 1), RETRY_DELAYS_MS.length) - 1;
  return RETRY_DELAYS_MS[index];
}

/** A Retry-After header in milliseconds (seconds or an HTTP date), capped; null when there is none or it is unreadable. */
export function retryAfterMs(header: string | null, now: number = Date.now()): number | null {
  const text = header?.trim();
  if (!text) return null;
  const seconds = /^\d+$/.test(text) ? Number(text) * 1000 : Date.parse(text) - now;
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(seconds, MAX_RETRY_AFTER_MS);
}

/** How the log records what the service made of a field. */
export function logResultOf(result: Exclude<PlaceContribFieldResult, 'quota'>): PlaceContribLogResult {
  if (result === 'unchanged') return 'duplicate';
  if (result === 'rejected') return 'rejected';
  return 'accepted';
}

/** The day of a moment as the log keeps it, UTC. */
export function dayOf(at: Date): string {
  return at.toISOString().slice(0, 10);
}
