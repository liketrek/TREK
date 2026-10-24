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

/** The path form's stops, as the segments name them, and the data blob after them. */
function pathStops(url: URL): { names: DirWaypoint[]; data: string } {
  const parts = url.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('dir');
  if (at < 0) return { names: [], data: '' };

  const names: DirWaypoint[] = [];
  let data = '';
  for (const part of parts.slice(at + 1)) {
    // The viewport and the blob end the list of stops; everything after them belongs to
    // how the map was framed, not to where the car goes.
    if (part.startsWith('@')) continue;
    if (part.startsWith('data=')) {
      data = part;
      continue;
    }
    if (data) continue;
    const wp = asWaypoint(decodeSegment(part));
    if (wp) names.push(wp);
  }
  return { names, data };
}

/**
 * Positions from the blob, but only when there is exactly one for each stop. A partial
 * match cannot be lined up: Google drops the pair for "your location" and adds pairs
 * of its own for a route through several countries, and half a link read confidently
 * is worse than a link read as names and geocoded.
 */
function withPairPositions(names: DirWaypoint[], data: string): DirWaypoint[] {
  const pairs = [...data.matchAll(DATA_LNG_LAT)]
    .map((m) => ({ lng: Number.parseFloat(m[1]), lat: Number.parseFloat(m[2]) }))
    .filter((p) => onEarth(p.lat, p.lng));
  if (pairs.length !== names.length) return names;

  return names.map((wp, i) => (wp.lat !== null ? wp : { name: wp.name, lat: pairs[i].lat, lng: pairs[i].lng }));
}

/** The path form, where the stops are the segments and the blob holds their positions. */
function fromPath(url: URL, positions: DirectionsPositions): DirWaypoint[] {
  const { names, data } = pathStops(url);
  if (!names.length) return [];
  return positions === 'stop-blocks' ? withStopBlockPositions(names, data) : withPairPositions(names, data);
}

/**
 * One field of the data blob. Google writes a protobuf message as `!<field><type><value>`
 * tokens: `!4m66` is field 4, a message holding the 66 tokens after it (its own and its
 * children's), `!1d-8.61` a double, `!1s0x…` a string, `!3e2` an enum.
 */
interface BlobField {
  key: string;
  value: string;
  children: BlobField[];
}

const BLOB_TOKEN = /^(\d+)([A-Za-z])(.*)$/;

/**
 * The blob as its tree of fields; null for a token that is not a field, or a message
 * that claims more tokens than follow it.
 */
function blobFields(data: string): BlobField[] | null {
  const tokens = decodeSegment(data.slice('data='.length)).split('!').filter(Boolean);
  const root: BlobField = { key: '', value: '', children: [] };
  const open: Array<{ field: BlobField; left: number }> = [{ field: root, left: tokens.length }];
  for (const token of tokens) {
    const match = BLOB_TOKEN.exec(token);
    const parent = open.at(-1);
    if (!match || !parent || open.some((entry) => entry.left < 1)) return null;
    const field: BlobField = { key: match[1] + match[2], value: match[3], children: [] };
    parent.field.children.push(field);
    for (const entry of open) entry.left -= 1;
    if (match[2] === 'm') open.push({ field, left: Number(match[3]) });
    while (open.length > 1 && open.at(-1)?.left === 0) open.pop();
  }
  return open.length === 1 ? root.children : null;
}

/** The route message: the first `!4m` that lists two stop blocks (`!1m`) or more. */
function routeMessage(fields: readonly BlobField[]): BlobField | null {
  for (const field of fields) {
    if (field.key === '4m' && field.children.filter((child) => child.key === '1m').length >= 2) return field;
    const inner = routeMessage(field.children);
    if (inner) return inner;
  }
  return null;
}

/**
 * A stop block's own position (`!2m2!1d<lng>!2d<lat>`). A point Google adds where the
 * line was dragged sits in a `!3m` of the block and is not the stop.
 */
function blockPosition(block: BlobField): { lat: number; lng: number } | null {
  const own = block.children.find((child) => child.key === '2m');
  const lng = Number.parseFloat(own?.children.find((child) => child.key === '1d')?.value ?? '');
  const lat = Number.parseFloat(own?.children.find((child) => child.key === '2d')?.value ?? '');
  return onEarth(lat, lng) ? { lat, lng } : null;
}

/**
 * CW-07: positions read from each stop's own block of the route message, so a line
 * dragged through extra points or a stop given as coordinates cannot shift them onto the
 * wrong stop. When the blocks and the stops do not pair up one to one, no stop takes a
 * position from the blob: a stop the link does not place stays without one.
 */
function withStopBlockPositions(names: DirWaypoint[], data: string): DirWaypoint[] {
  const fields = data ? blobFields(data) : null;
  const route = fields ? routeMessage(fields) : null;
  const blocks = route?.children.filter((child) => child.key === '1m') ?? [];
  if (blocks.length !== names.length) return names;
  return names.map((wp, i) => {
    const position = wp.lat === null ? blockPosition(blocks[i]) : null;
    return position ? { name: wp.name, ...position } : wp;
  });
}

/**
 * How the stops of the path form are placed from the data blob: `pairs` lines up the
 * coordinate pairs with the stops when their counts agree (the road trip and places
 * imports, which geocode what stays a name), `stop-blocks` reads each stop's own block
 * and places nothing it cannot line up (the city walk import, which guesses nothing).
 */
export type DirectionsPositions = 'pairs' | 'stop-blocks';

/**
 * The stops of a shared directions link, in the order they are driven.
 *
 * Empty when the link is not a route, or holds fewer than two stops — one stop is a
 * place, and the place search box already takes those.
 */
export function parseDirectionsUrl(
  raw: string,
  limit = MAX_DIR_WAYPOINTS,
  positions: DirectionsPositions = 'pairs',
): DirWaypoint[] {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return [];
  }
  const fromParams = fromQuery(url);
  const found = fromParams.length ? fromParams : fromPath(url, positions);
  return found.length >= 2 ? found.slice(0, limit) : [];
}

/** How a directions link says its route is travelled; `unknown` when it does not say, or says two things. */
export type DirTravelMode = 'walking' | 'driving' | 'bicycling' | 'transit' | 'other' | 'unknown';

/** Google's travel-mode field in a route's data blob: !3e0 car, !3e1 bike, !3e2 on foot, !3e3 transit. */
const DATA_MODE = /!3e(\d+)/g;
const DATA_MODES: Readonly<Partial<Record<string, DirTravelMode>>> = {
  '0': 'driving',
  '1': 'bicycling',
  '2': 'walking',
  '3': 'transit',
};
const PARAM_MODES: Readonly<Partial<Record<string, DirTravelMode>>> = {
  driving: 'driving',
  walking: 'walking',
  bicycling: 'bicycling',
  transit: 'transit',
};

/** The `data=` path segment of a route, decoded; '' when there is none. Only there does !3e name the mode. */
function dataSegmentOf(url: URL): string {
  const part = url.pathname.split('/').find((segment) => segment.startsWith('data='));
  return part ? decodeSegment(part) : '';
}

/**
 * CW-07: the travel mode a directions link states, from the documented
 * `travelmode=` parameter or the `!3e` field of the path's data blob. Exactly one
 * mode stated is the answer; none, or two different ones, is `unknown`.
 */
export function directionsTravelMode(raw: string): DirTravelMode {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'unknown';
  }
  if (!isDirectionsUrl(url.href)) return 'unknown';
  const said = new Set<DirTravelMode>();
  const param = url.searchParams.get('travelmode');
  if (param !== null) said.add(PARAM_MODES[param.trim().toLowerCase()] ?? 'other');
  for (const [, code] of dataSegmentOf(url).matchAll(DATA_MODE)) said.add(DATA_MODES[code] ?? 'other');
  const [only] = said;
  return said.size === 1 && only ? only : 'unknown';
}
