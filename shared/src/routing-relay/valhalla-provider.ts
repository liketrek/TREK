import {
  valhallaProviderSchema,
  type ValhallaCosting,
  type ValhallaProvider,
  type ValhallaRelayAction,
} from './routing-relay.schema';

/** TREK's three route profiles against the Valhalla costing model each is asked under. */
export const VALHALLA_COSTING = {
  driving: 'auto',
  walking: 'pedestrian',
  cycling: 'bicycle',
} as const satisfies Record<'driving' | 'walking' | 'cycling', ValhallaCosting>;

/** What decides which Valhalla an instance asks, as its settings hold it. */
export interface ValhallaChoice {
  /** `routing_valhalla_provider`; anything but one of its three values reads as not chosen. */
  provider: unknown;
  /** `valhalla_base_url`, an own Valhalla. */
  valhallaUrl: unknown;
  /** `routing_base_url`, an own OSRM. */
  routingUrl: unknown;
  /** Whether the TREK services' Valhalla can be asked from here: the services are on and hold a key. */
  trekAvailable: boolean;
}

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * The Valhalla an instance asks, or null where it asks none. A choice the
 * admin made stands; without one an own Valhalla is `custom`, an own OSRM
 * alone means no Valhalla at all (an operator who chose their own router is
 * not handed a third party they never asked for), and otherwise the TREK
 * services answer where they can and FOSSGIS where they cannot.
 */
export function resolveValhallaProvider(choice: ValhallaChoice): ValhallaProvider | null {
  const chosen = valhallaProviderSchema.safeParse(choice.provider);
  if (chosen.success && chosen.data === 'fossgis') return 'fossgis';
  if (chosen.success && chosen.data === 'trek') return choice.trekAvailable ? 'trek' : 'fossgis';
  if (filled(choice.valhallaUrl)) return 'custom';
  if (filled(choice.routingUrl)) return null;
  return choice.trekAvailable ? 'trek' : 'fossgis';
}

/**
 * Whether this Valhalla routes every day, on foot, by bike and by car, or only
 * what OSRM cannot answer. The TREK services and an own Valhalla carry the
 * whole load; the public FOSSGIS one allows a request a second and ten
 * locations, so there OSRM keeps the days and Valhalla answers the avoidances
 * and the tours.
 */
export function valhallaRoutesEveryDay(provider: ValhallaProvider | null): boolean {
  return provider === 'trek' || provider === 'custom';
}

function encodeSigned(value: number): string {
  let rest = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (rest >= 0x20) {
    out += String.fromCharCode((0x20 | (rest & 0x1f)) + 63);
    rest >>= 5;
  }
  return out + String.fromCharCode(rest + 63);
}

/** A line as Valhalla's encoded polyline of precision 6, the form its `encoded_polyline` takes. */
export function encodePolyline6(points: ReadonlyArray<{ lat: number; lon: number }>): string {
  let lat = 0;
  let lon = 0;
  let out = '';
  for (const point of points) {
    const nextLat = Math.round(point.lat * 1e6);
    const nextLon = Math.round(point.lon * 1e6);
    out += encodeSigned(nextLat - lat) + encodeSigned(nextLon - lon);
    lat = nextLat;
    lon = nextLon;
  }
  return out;
}

/**
 * A question as the relay takes it. A description sends its line as a
 * polyline instead of point by point: four thousand points written out run
 * past the relay's 64 KB, encoded they are a fifth of that.
 */
export function compactValhallaRequest(action: ValhallaRelayAction, body: object): object {
  if (action !== 'trace_attributes' || !('shape' in body) || !Array.isArray(body.shape)) return body;
  const { shape, ...rest } = body as { shape: Array<{ lat: number; lon: number }> };
  return { ...rest, encoded_polyline: encodePolyline6(shape) };
}
