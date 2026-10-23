import type { CardPlace, TripCard } from './assistant-context';
import { clipped, finite, isLat, isLng, recordOf, type Row } from './cards/card-values';
import { dayLabel } from './cards/preview-format';
import {
  haversineMetres,
  kindOfResult,
  type AssistantActivity,
  type AssistantActivityArea,
  type AssistantFoundPlace,
  type AssistantMention,
  type AssistantMentions,
  type AssistantPlaces,
  type AssistantWeather,
  type AssistantWeatherDay,
} from '@trek/shared';

/**
 * The cards an answer shows beside its text, built by the server from what a
 * step's tools answered: the places a search found, the weather it looked up,
 * where a running step is looking. The client never reads a raw tool answer.
 *
 * The helpers get the tool's own answer, before it was redacted for the
 * provider, because the coordinates are needed. So every field is picked by
 * name (nothing else of a result gets through, no website, phone or e-mail),
 * every text is masked like a provider answer, and no URL is ever passed on:
 * a photo is asked for by a key, through TREK's own photo route.
 */

/** Places a search shows as cards; `more` counts the rest. */
const PLACES_SHOWN = 20;
const MAX_NAME_CHARS = 120;
const MAX_ADDRESS_CHARS = 200;
const MAX_LABEL_CHARS = 80;
/** A search area wider or higher than this is too large to show on the map. */
const MAX_AREA_DEGREES = 2;
/** The radius a nearby search uses when the model sets none, as the tool does. */
const NEARBY_RADIUS_M = 500;
/** The radius a place search biased to a point uses when the model sets none, as the provider does. */
const BIAS_RADIUS_M = 50_000;
/** The area a weather lookup stands for on the map. */
const WEATHER_RADIUS_M = 5_000;
/** How close a trip place must be to a searched point to name it. */
const NAMED_WITHIN_M = 2_000;

const GOOGLE_PLACE_ID = /^[\w-]{1,200}$/;
const MAX_OSM_ID_CHARS = 40;
/** A source's own id that names an OpenStreetMap element, as a tour POI carries it (`node:123`). */
const OSM_ELEMENT_ID = /^(node|way|relation):\d+$/;
const MAX_CALL_ID_CHARS = 64;
const WEATHER_KINDS: ReadonlySet<string> = new Set(['forecast', 'climate', 'current']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The search tools whose results are shown as place cards, and where their answer lists them. */
const PLACE_LISTS: Readonly<Record<string, 'places' | 'pois'>> = {
  search_place: 'places',
  search_nearby_places: 'places',
  search_pois: 'pois',
  // Places along a saved tour: a hut, a spring, a viewpoint to add to the day.
  search_tour_pois: 'pois',
};

/** Whether the trip runs today, the only time a source's "open now" means anything for it. */
function tripRunsOn(card: TripCard, today: string): boolean {
  return !!card.startDate && !!card.endDate && card.startDate <= today && today <= card.endDate;
}

/** Whether a trip place is the one found: the same Google or OpenStreetMap id. */
function isSamePlace(place: CardPlace, googlePlaceId: string | null, osmId: string | null): boolean {
  return (googlePlaceId !== null && place.googlePlaceId === googlePlaceId) || (osmId !== null && place.osmId === osmId);
}

function foundPlaceOf(row: Row, ref: string, card: TripCard, running: boolean): AssistantFoundPlace | null {
  const lat = finite(row.lat);
  const lng = finite(row.lng);
  const name = clipped(row.name, MAX_NAME_CHARS);
  if (!isLat(lat) || !isLng(lng) || !name) return null;
  const googleId = typeof row.google_place_id === 'string' ? row.google_place_id : '';
  const googlePlaceId = GOOGLE_PLACE_ID.test(googleId) ? googleId : null;
  // A tour POI has no osm_id of its own: its id is the OpenStreetMap element when the source is OpenStreetMap.
  const ownId = typeof row.id === 'string' && OSM_ELEMENT_ID.test(row.id) ? row.id : '';
  const osm = typeof row.osm_id === 'string' ? row.osm_id : ownId;
  const osmId = osm !== '' && osm.length <= MAX_OSM_ID_CHARS ? osm : null;
  const rating = finite(row.rating);
  const inTrip = [...card.places.values()].find((place) => isSamePlace(place, googlePlaceId, osmId));
  return {
    ref,
    name,
    address: clipped(row.address, MAX_ADDRESS_CHARS),
    lat,
    lng,
    kind: kindOfResult({ types: row.types, category: row.category }),
    rating: rating !== null && rating >= 0 && rating <= 5 ? rating : null,
    openNow: running && typeof row.open_now === 'boolean' ? row.open_now : null,
    googlePlaceId,
    osmId,
    photoKey: googlePlaceId ?? `coords:${lat.toFixed(6)},${lng.toFixed(6)}`,
    inTripPlaceId: inTrip?.id ?? null,
  };
}

/**
 * The places a search step found, as cards: at most eight, `more` counting the
 * rest, each under the ref `<toolCallId>:<index>` a suggestion for a day names
 * it by. Null for any other tool, or when the search found nothing to show.
 */
export function foundPlacesOf(
  toolName: string,
  toolCallId: string,
  value: unknown,
  card: TripCard,
  today: string,
): AssistantPlaces | null {
  const list = PLACE_LISTS[toolName];
  const rows = list ? recordOf(value)[list] : null;
  if (!Array.isArray(rows) || toolCallId.length > MAX_CALL_ID_CHARS) return null;
  const running = tripRunsOn(card, today);
  const places: AssistantFoundPlace[] = [];
  for (const row of rows) {
    const place = foundPlaceOf(recordOf(row), `${toolCallId}:${places.length}`, card, running);
    if (place) places.push(place);
  }
  if (places.length === 0) return null;
  return { toolCallId, places: places.slice(0, PLACES_SHOWN), more: Math.max(0, places.length - PLACES_SHOWN) };
}

/** The Google place ids a search answered with, for the details lookups that may follow it. */
export function googleIdsOf(toolName: string, value: unknown): string[] {
  const list = PLACE_LISTS[toolName];
  const rows = list ? recordOf(value)[list] : null;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const id = recordOf(row).google_place_id;
    return typeof id === 'string' && GOOGLE_PLACE_ID.test(id) ? [id] : [];
  });
}

/**
 * One date of weather a `get_weather` step looked up, on the trip day of that
 * date if there is one. Null for any other tool and for an answer without a
 * forecast (`{ error: 'no_forecast' }`).
 */
export function weatherDayOf(toolName: string, args: Row, value: unknown, card: TripCard): AssistantWeatherDay | null {
  if (toolName !== 'get_weather') return null;
  const weather = recordOf(recordOf(value).weather);
  const date = typeof args.date === 'string' && ISO_DATE.test(args.date) ? args.date : null;
  const tempMax = finite(weather.temp_max) ?? finite(weather.temp);
  const main = clipped(weather.main, 20);
  if (weather.error !== undefined || !date || tempMax === null || !main) return null;
  const rain = finite(weather.precipitation_probability_max);
  const type = typeof weather.type === 'string' ? weather.type : '';
  return {
    dayId: card.days.find((day) => day.date === date)?.id ?? null,
    date,
    main,
    tempMax,
    tempMin: finite(weather.temp_min),
    rainPct: rain === null ? null : Math.min(100, Math.max(0, Math.round(rain))),
    kind: WEATHER_KINDS.has(type) ? (type as AssistantWeatherDay['kind']) : 'forecast',
  };
}

/** The weather of one answer: one entry per date, the last lookup of a date winning, in date order. */
export function weatherOf(days: readonly AssistantWeatherDay[]): AssistantWeather | null {
  const byDate = new Map(days.map((day): [string, AssistantWeatherDay] => [day.date, day]));
  const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 16);
  return sorted.length > 0 ? { days: sorted } : null;
}

/** The trip place nearest to a point, by name, when one is close enough to name the point by. */
function nearbyName(card: TripCard, lat: number, lng: number): string | null {
  let best: { name: string; metres: number } | null = null;
  for (const place of card.places.values()) {
    if (place.lat === null || place.lng === null) continue;
    const metres = haversineMetres(lat, lng, place.lat, place.lng);
    if (metres <= NAMED_WITHIN_M && (!best || metres < best.metres)) best = { name: place.name, metres };
  }
  return best ? clipped(best.name, MAX_LABEL_CHARS) : null;
}

type PointArea = Extract<AssistantActivityArea, { type: 'point' }>;
type BoxArea = Extract<AssistantActivityArea, { type: 'bbox' }>;

/** A point with its radius (the tool's default when the model set none), when it is one. */
function pointArea(latValue: unknown, lngValue: unknown, radiusValue: unknown, fallback: number): PointArea | null {
  const lat = finite(latValue);
  const lng = finite(lngValue);
  if (!isLat(lat) || !isLng(lng)) return null;
  const radius = Math.round(finite(radiusValue) ?? fallback);
  return { type: 'point', lat, lng, radiusM: Math.min(50_000, Math.max(50, radius)) };
}

/** A box, when it is one and no wider or higher than two degrees. */
function boxArea(value: unknown): BoxArea | null {
  const box = recordOf(value);
  const [south, west, north, east] = [box.south, box.west, box.north, box.east].map(finite);
  if (!isLat(south) || !isLat(north) || !isLng(west) || !isLng(east)) return null;
  if (south >= north || west >= east || north - south > MAX_AREA_DEGREES || east - west > MAX_AREA_DEGREES) {
    return null;
  }
  return { type: 'bbox', south, west, north, east };
}

/** How far the box round a hike's points reaches past them, in degrees, so points on one line still make a box. */
const HIKE_BOX_MARGIN = 0.005;

/**
 * Where a hike is being planned: named by its goal, the last point after the
 * start that has a name, and the box round its points.
 */
function hikeLook(args: Row): { label: string | null; area: AssistantActivityArea | null } {
  const points = Array.isArray(args.waypoints) ? args.waypoints.map(recordOf) : [];
  const goal = points
    .slice(1)
    .map((point) => clipped(point.name, MAX_LABEL_CHARS))
    .filter((name): name is string => name !== null)
    .pop();
  const lats = points.map((point) => finite(point.lat)).filter(isLat);
  const lngs = points.map((point) => finite(point.lng)).filter(isLng);
  const area =
    lats.length === points.length && lngs.length === points.length && points.length > 0
      ? boxArea({
          south: Math.min(...lats) - HIKE_BOX_MARGIN,
          west: Math.min(...lngs) - HIKE_BOX_MARGIN,
          north: Math.max(...lats) + HIKE_BOX_MARGIN,
          east: Math.max(...lngs) + HIKE_BOX_MARGIN,
        })
      : null;
  return { label: goal ?? null, area };
}

/** The name and the area of a step that looks somewhere, as its arguments say. */
function lookOf(
  toolName: string,
  args: Row,
  card: TripCard,
): { label: string | null; area: AssistantActivityArea | null } {
  if (toolName === 'search_nearby_places' || toolName === 'get_weather') {
    const radius = toolName === 'get_weather' ? WEATHER_RADIUS_M : args.radius;
    const area = pointArea(args.lat, args.lng, radius, NEARBY_RADIUS_M);
    return { label: area ? nearbyName(card, area.lat, area.lng) : null, area };
  }
  if (toolName === 'search_pois') {
    const area = boxArea(args.bbox);
    const centre = area ? nearbyName(card, (area.south + area.north) / 2, (area.west + area.east) / 2) : null;
    return { label: centre, area };
  }
  if (toolName === 'propose_hike') return hikeLook(args);
  if (toolName === 'search_place') {
    const bias = recordOf(args.locationBias);
    const area = pointArea(bias.lat, bias.lng, bias.radius, BIAS_RADIUS_M);
    return { label: clipped(args.query, MAX_LABEL_CHARS), area };
  }
  return { label: null, area: null };
}

/**
 * What a step that is about to run is doing, for the live line and the map:
 * the place or query it names and the area it searches. Null for a step that
 * names neither.
 */
export function activityOf(toolName: string, toolCallId: string, args: Row, card: TripCard): AssistantActivity | null {
  if (toolCallId.length > MAX_CALL_ID_CHARS) return null;
  const { label, area } = lookOf(toolName, args, card);
  return label === null && area === null ? null : { toolCallId, label, area };
}

/** What a mention is called in the trip; null when the trip holds no such thing. */
function mentionLabel(
  ctx: { card: TripCard; locale: string },
  kind: AssistantMention['kind'],
  id: number,
): string | null {
  if (kind === 'day') return ctx.card.days.some((day) => day.id === id) ? dayLabel(ctx, id) : null;
  if (kind === 'place') return ctx.card.places.get(id)?.name ?? null;
  return ctx.card.reservations.get(id)?.title ?? null;
}

/**
 * The days, places and bookings the user named with `@`, with the labels the
 * trip gives them (never the ones the request sent). One that is not in the
 * trip falls out, and so does a repeat.
 */
export function mentionItems(
  card: TripCard,
  mentions: readonly AssistantMention[],
  locale: string,
): AssistantMentions['items'] {
  const items: AssistantMentions['items'] = [];
  const seen = new Set<string>();
  const ctx = { card, locale };
  for (const { kind, id } of mentions) {
    const label = mentionLabel(ctx, kind, id);
    const shown = clipped(label, MAX_NAME_CHARS);
    if (!shown || seen.has(`${kind}:${id}`)) continue;
    seen.add(`${kind}:${id}`);
    items.push({ kind, id, label: shown });
  }
  return items.slice(0, 10);
}
