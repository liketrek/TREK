/**
 * Reading the stops out of a shared Google Maps directions link.
 *
 * A `/maps/dir/` URL is a route somebody already planned: the stops are in the link
 * itself, which is why this needs no API key and no call to Google. Three shapes reach
 * us, and all three are somebody pressing "share" on a different screen:
 *
 * - the path form, `…/maps/dir/Berlin/Dresden/Prague/@50.9,13.5,8z/data=!4m…`, where the
 *   segments between `dir` and the viewport are the stops and the data blob usually
 *   carries a coordinate pair for each of them;
 * - the documented form, `…/maps/dir/?api=1&origin=…&destination=…&waypoints=A|B`, which
 *   is what the URL builder in Google's own docs produces;
 * - a `maps.app.goo.gl` short link, which is either of the above after one redirect —
 *   followed by the caller, because following it is a network call and this file makes
 *   none.
 *
 * Everything here is pure. What it cannot answer — a stop that is only a name — it says
 * so about, and the caller geocodes it.
 */

/** A stop read off the link. Coordinates when the link carried them, a name otherwise. */
export interface DirWaypoint {
  name: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * The most stops taken from one link.
 *
 * Google's own limit is ten waypoints between the ends; the cap is well above that
 * because the URL is user input and the geocoding behind it costs a request each.
 */
export const MAX_DIR_WAYPOINTS = 30;

/** `52.52,13.405` as a whole segment — how a stop with no name is written. */
const COORD_PAIR = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;

/**
 * The coordinate pairs Google hides in the `data=` blob, in driving order.
 *
 * Directions encode a stop as `!1d<lng>!2d<lat>`, the reverse of the `!3d<lat>!4d<lng>`
 * a single-place link uses — the numbers are the same protobuf fields read by a
 * different message, and getting the two the wrong way round puts Berlin in Somalia.
 */
const DATA_LNG_LAT = /!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g;

/** Is this a directions link at all, rather than a list or a single place? */
export function isDirectionsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return /\/maps\/dir\/?/.test(url.pathname) || /\/dir\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

/** Somewhere on Earth, rather than a pair of numbers that happen to be next to a comma. */
function onEarth(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** A decoded stop: a coordinate pair becomes one, anything else stays a name. */
function asWaypoint(decoded: string): DirWaypoint | null {
  const text = decoded.trim();
  if (!text) return null;
  const coords = text.match(COORD_PAIR);
  if (coords) {
    const lat = Number.parseFloat(coords[1]);
    const lng = Number.parseFloat(coords[2]);
    if (onEarth(lat, lng)) return { name: null, lat, lng };
  }
  return { name: text, lat: null, lng: null };
}

/** A path segment still carries its escapes, and spaces as plus signs. */
function decodeSegment(raw: string): string {
  try {
    return decodeURIComponent(raw.replaceAll('+', ' '));
  } catch {
    // A stray percent is somebody else's malformed link, not a reason to fail the import.
    return raw.replaceAll('+', ' ');
  }
}

/** The `?api=1&origin=…` form, which names its parts instead of ordering them. */
function fromQuery(url: URL): DirWaypoint[] {
  const origin = url.searchParams.get('origin');
  const destination = url.searchParams.get('destination');
  if (!origin && !destination) return [];
  const between = url.searchParams.get('waypoints')?.split('|') ?? [];
  // Already decoded by URLSearchParams, so these go straight in.
  return [origin, ...between, destination]
    .filter((part): part is string => !!part && part.trim().length > 0)
    .map((part) => asWaypoint(part))
    .filter((wp): wp is DirWaypoint => wp !== null);
}

/** The path form, where the stops are the segments and the blob holds their positions. */
function fromPath(url: URL): DirWaypoint[] {
  const parts = url.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('dir');
  if (at < 0) return [];

  const names: DirWaypoint[] = [];
  let data = '';
  for (const part of parts.slice(at + 1)) {
    // The viewport and the blob end the list of stops; everything after them belongs to
    // how the map was framed, not to where the car goes.
    if (part.startsWith('@')) continue;
    if (part.startsWith('data=')) { data = part; continue; }
    if (data) continue;
    const wp = asWaypoint(decodeSegment(part));
    if (wp) names.push(wp);
  }
  if (!names.length) return [];

  // Positions from the blob, but only when there is exactly one for each stop. A partial
  // match cannot be lined up — Google drops the pair for "your location" and adds pairs
  // of its own for a route through several countries — and half a link read confidently
  // is worse than a link read as names and geocoded.
  const pairs = [...(data.matchAll(DATA_LNG_LAT))]
    .map((m) => ({ lng: Number.parseFloat(m[1]), lat: Number.parseFloat(m[2]) }))
    .filter((p) => onEarth(p.lat, p.lng));
  if (pairs.length !== names.length) return names;

  return names.map((wp, i) => (wp.lat !== null ? wp : { name: wp.name, lat: pairs[i].lat, lng: pairs[i].lng }));
}

/**
 * The stops of a shared directions link, in the order they are driven.
 *
 * Empty when the link is not a route, or holds fewer than two stops — one stop is a
 * place, and the place search box already takes those.
 */
export function parseDirectionsUrl(raw: string): DirWaypoint[] {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return [];
  }
  const fromParams = fromQuery(url);
  const found = fromParams.length ? fromParams : fromPath(url);
  return found.length >= 2 ? found.slice(0, MAX_DIR_WAYPOINTS) : [];
}
