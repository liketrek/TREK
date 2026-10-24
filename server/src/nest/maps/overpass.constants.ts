/**
 * What every outbound Overpass caller shares: the public mirrors, how
 * OVERPASS_URL replaces them, and the User-Agent the mirrors ask for.
 *
 * The maps domain owns Overpass, but the via ferrata lookup races the same
 * mirrors under the same operator settings. This file is the part of maps
 * other domains may import (a `.constants.ts` is public surface for
 * lint:boundaries), so the list lives once instead of drifting in two copies.
 * Pure on purpose: no env read, no Nest, the caller hands in the raw values.
 */

/**
 * Public Overpass mirrors, queried in PARALLEL (first valid response wins).
 * Reachability and load vary a lot by network and region: the canonical
 * instance is frequently overloaded (504s) and some community mirrors are
 * unreachable from certain networks. Racing them means whichever mirror is
 * fastest-reachable for this user answers, and an overloaded or blocked one
 * never blocks the others.
 */
const DEFAULT_OVERPASS_MIRRORS: readonly string[] = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

/**
 * OVERPASS_URL as a list of http(s) endpoints, or the public mirrors when it
 * names none. Operators behind locked-down egress, or running their own
 * Overpass, point TREK at one or more endpoints (comma-separated); when set it
 * REPLACES the public mirrors, so a firewalled cluster never reaches out to
 * them (see #1309). Entries that are not http(s) URLs are dropped.
 */
export function parseOverpassEndpoints(raw: string | undefined): string[] {
  const custom = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => {
      try {
        const url = new URL(s);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    });
  return custom.length > 0 ? custom : [...DEFAULT_OVERPASS_MIRRORS];
}

/**
 * Overpass, Nominatim and Wikimedia all ask that requests carry a User-Agent
 * that uniquely identifies the deploying instance: a shared, generic UA gets
 * rate-limited and throttled harder (see #1309). When the instance URL is
 * configured it is appended; getAppUrl()'s bare http://localhost fallback is
 * not a useful identifier, so it is dropped.
 */
export function buildUserAgent(instanceUrl: string | undefined): string {
  const base = 'TREK Travel Planner (https://github.com/liketrek/TREK)';
  if (instanceUrl && !instanceUrl.startsWith('http://localhost')) return `${base}; ${instanceUrl}`;
  return base;
}
