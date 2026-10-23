import { blockText, clipped, finite, recordOf } from '../card-values';
import type { AtlasBucketEntry, VisitStatus } from '@trek/shared';

/**
 * The readers the atlas cards are built with: codes upper-cased and checked,
 * counts kept whole and in bounds, a bucket-list row as the card shows it,
 * and the snapshots a change card is predicted from. A wish's coordinates
 * stay in the snapshot (they decide whether an add is a duplicate) and never
 * reach a card.
 */

const COUNTRY = /^[A-Z]{2}$/;
const REGION = /^[A-Z]{2}-[A-Z0-9]{1,8}$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
const TARGET = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const MAX_COUNT = 1_000_000;

/** A country code as a card holds it: ISO alpha-2 in upper case, else null. */
export function countryCodeOf(value: unknown): string | null {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return COUNTRY.test(code) ? code : null;
}

/** A region code as a card holds it: ISO 3166-2 in upper case, else null. */
export function regionCodeOf(value: unknown): string | null {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return REGION.test(code) ? code : null;
}

/** The day of a date or a timestamp as `YYYY-MM-DD`, else null. */
export function isoDayOf(value: unknown): string | null {
  return typeof value === 'string' && ISO_DAY.test(value) ? value.slice(0, 10) : null;
}

/** A count as a card holds it: a whole number from 0 up to its bound; anything else counts 0. */
export function countOf(value: unknown): number {
  const n = finite(value);
  return n === null || n < 0 ? 0 : Math.min(Math.round(n), MAX_COUNT);
}

export function statusOf(value: unknown): VisitStatus | null {
  return value === 'visited' || value === 'planned' || value === 'idea' ? value : null;
}

/** An argument's text as it will be stored: on one line and cut, not masked. */
export function argText(value: unknown, max: number): string | null {
  return typeof value === 'string' ? blockText(value.replace(/\s+/g, ' '), max, { mask: false }) : null;
}

/** When a wish is planned for, a year, a month or a day; anything else is none. */
export function targetDateOf(value: unknown): string | null {
  return typeof value === 'string' && TARGET.test(value) ? value : null;
}

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * A wish as a card shows it, from a bucket-list row (the tool's answer, its
 * text masked) or from the arguments of an add (cut only). Null without a name.
 */
export function entryOf(row: unknown, { fromResult }: { fromResult: boolean }): AtlasBucketEntry | null {
  const r = recordOf(row);
  const text = (value: unknown, max: number) => (fromResult ? clipped(value, max) : argText(value, max));
  const name = text(r.name, 120);
  if (!name) return null;
  const countryCode = countryCodeOf(r.country_code);
  const region = regionCodeOf(r.region_code);
  const reachedOn = isoDayOf(r.visited_at);
  const source = r.visited_source;
  return {
    id: positiveId(r.id),
    name,
    countryCode,
    // A region belongs to its own country, the rule the service keeps too.
    regionCode: region && countryCode && region.startsWith(`${countryCode}-`) ? region : null,
    targetDate: targetDateOf(r.target_date),
    notes: text(r.notes, 200),
    reachedOn,
    reachedFrom: reachedOn && (source === 'manual' || source === 'dawarich') ? source : null,
  };
}

/** Where one country stands on the atlas map. */
export interface CountryStanding {
  status: VisitStatus;
  placeCount: number;
  tripCount: number;
}

/** The atlas as a change is predicted from: visited countries and each country's standing. */
export interface AtlasSnapshot {
  visited: number;
  countries: ReadonlyMap<string, CountryStanding>;
}

/** `get_atlas_stats` read as a snapshot; null when it is not an atlas. */
export function atlasSnapshotOf(raw: unknown): AtlasSnapshot | null {
  const stats = recordOf(recordOf(raw).stats);
  if (!Array.isArray(stats.countries)) return null;
  const countries = new Map<string, CountryStanding>();
  for (const row of stats.countries) {
    const r = recordOf(row);
    const code = countryCodeOf(r.code);
    // A user without trips has only countries marked by hand, which carry no status: they are visited.
    if (code) {
      countries.set(code, {
        status: statusOf(r.status) ?? 'visited',
        placeCount: countOf(r.placeCount),
        tripCount: countOf(r.tripCount),
      });
    }
  }
  return { visited: countOf(recordOf(stats.stats).totalCountries), countries };
}

/** One region of the atlas map. */
export interface RegionEntry {
  name: string;
  country: string;
  status: VisitStatus;
}

/** `list_visited_regions` read as regions by code; null when it is not a region list. */
export function regionsSnapshotOf(raw: unknown): ReadonlyMap<string, RegionEntry> | null {
  const grouped = recordOf(raw).regions;
  if (!grouped || typeof grouped !== 'object') return null;
  const regions = new Map<string, RegionEntry>();
  for (const [country, list] of Object.entries(recordOf(grouped))) {
    const countryCode = countryCodeOf(country);
    if (!countryCode || !Array.isArray(list)) continue;
    for (const row of list) {
      const r = recordOf(row);
      const code = regionCodeOf(r.code);
      const status = statusOf(r.status);
      if (code && status) regions.set(code, { name: clipped(r.name, 80) ?? code, country: countryCode, status });
    }
  }
  return regions;
}

/** Visited regions of one country in a snapshot. */
export function visitedRegionsIn(regions: ReadonlyMap<string, RegionEntry>, country: string): number {
  return [...regions.values()].filter((region) => region.country === country && region.status === 'visited').length;
}

/** What makes two wishes the same wish (#1898): the name, the country, the target date and the spot. */
interface WishIdentity {
  name: string;
  country: string | null;
  target: string | null;
  lat: number | null;
  lng: number | null;
}

/** An empty value and none are the same "not set", as the service reads them (it does not trim). */
function blankToNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * A wish's identity from raw values, the way the service compares them: the
 * name trimmed and folded to ASCII lower case (lower() in SQLite folds ASCII
 * only), the country exactly as it will be stored (`country_code IS ?`
 * compares it as is). Only create_bucket_list_item upper-cases its country
 * (its zod schema does), so only an add asks for `upperCountry`.
 */
export function identityOf(row: unknown, { upperCountry = false }: { upperCountry?: boolean } = {}): WishIdentity {
  const r = recordOf(row);
  const country = blankToNull(r.country_code);
  return {
    name: (typeof r.name === 'string' ? r.name.trim() : '').replace(/[A-Z]/g, (c) => c.toLowerCase()),
    country: country !== null && upperCountry ? country.toUpperCase() : country,
    target: blankToNull(r.target_date),
    lat: finite(r.lat),
    lng: finite(r.lng),
  };
}

export function sameWish(a: WishIdentity, b: WishIdentity): boolean {
  return a.name === b.name && a.country === b.country && a.target === b.target && a.lat === b.lat && a.lng === b.lng;
}

/** The bucket list as a change is predicted from: how many wishes, each with its identity. */
export interface BucketSnapshot {
  size: number;
  wishes: ReadonlyMap<number, { entry: AtlasBucketEntry; identity: WishIdentity }>;
}

/** `list_bucket_list` read as a snapshot; null when it is not a bucket list. */
export function bucketSnapshotOf(raw: unknown): BucketSnapshot | null {
  const items = recordOf(raw).items;
  if (!Array.isArray(items)) return null;
  const wishes = new Map<number, { entry: AtlasBucketEntry; identity: WishIdentity }>();
  for (const row of items) {
    const entry = entryOf(row, { fromResult: true });
    if (entry?.id) wishes.set(entry.id, { entry, identity: identityOf(row) });
  }
  return { size: items.length, wishes };
}
