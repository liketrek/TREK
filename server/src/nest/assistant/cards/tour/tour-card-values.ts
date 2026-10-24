import { thinLine } from '../../../../utils/polyline';
import type { TripCard } from '../../assistant-context';
import { clipped, clockOf, finite, isLat, isLng, recordOf, type Row } from '../card-values';
import {
  cumulativeMetres,
  haversineMetres,
  MAX_CARD_CHARS,
  TOUR_POI_CATEGORIES,
  TOUR_ROUTE_LIMITS,
  type TourPoiCategory,
  type TourRouteCard,
  type TourRouteStop,
  type TourRouteStretch,
} from '@trek/shared';

/**
 * The readers the tour cards are built with: a tool's own answer or a call's
 * arguments taken as they come, nothing trusted, every number bounded the way
 * the card kind bounds it. A line is thinned for drawing and keeps either a
 * height on every point or on none, so a profile is drawn only from a line
 * whose heights are all known.
 */

export type RoutePoint = TourRouteCard['line'][number];

/** A coordinate as a card draws it: five decimals, about a metre. */
export function coord(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

/** A whole number within `[min, max]`, or null for anything else. */
export function whole(value: unknown, min: number, max: number): number | null {
  const number = finite(value);
  if (number === null) return null;
  const rounded = Math.round(number);
  return rounded >= min && rounded <= max ? rounded : null;
}

export const metresOf = (value: unknown) => whole(value, 0, 5_000_000);
export const climbOf = (value: unknown) => whole(value, 0, 100_000);
export const heightOf = (value: unknown) => whole(value, -500, 9_000);
export const minutesOf = (value: unknown) => whole(value, 0, 86_400);

/** A SAC step, T1 to T6 as 1 to 6, or null. */
export function sacStepOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6 ? value : null;
}

/** A point `{ lat, lng }` (or `[lat, lng]`), or null when it is none. */
export function latLngOf(value: unknown): { lat: number; lng: number } | null {
  const [rawLat, rawLng] = Array.isArray(value) ? value : [recordOf(value).lat, recordOf(value).lng];
  const lat = finite(rawLat);
  const lng = finite(rawLng);
  return isLat(lat) && isLng(lng) ? { lat: coord(lat), lng: coord(lng) } : null;
}

/**
 * A line to draw from a tool's `[lat, lng]` or `[lat, lng, height]` points:
 * bad points left out, thinned to `most`, every height null when one of the
 * kept points has none.
 */
export function lineOf(raw: unknown, most: number = TOUR_ROUTE_LIMITS.line): RoutePoint[] {
  if (!Array.isArray(raw)) return [];
  const points = raw.flatMap((point: unknown): Array<[number, number, number | null]> => {
    const at = latLngOf(point);
    return at ? [[at.lat, at.lng, heightOf(Array.isArray(point) ? point[2] : null)]] : [];
  });
  const kept = thinLine(points, most);
  const heights = kept.every(([, , height]) => height !== null);
  return kept.map(([lat, lng, height]): RoutePoint => [lat, lng, heights ? height : null]);
}

/** A line of points joined straight, without heights: the stops of a way that is not planned. */
export function straightLine(points: ReadonlyArray<{ lat: number; lng: number }>): RoutePoint[] {
  return thinLine(points, TOUR_ROUTE_LIMITS.line).map(({ lat, lng }): RoutePoint => [lat, lng, null]);
}

/** Metres along a straight line at each of its points. */
export function straightMetres(points: ReadonlyArray<{ lat: number; lng: number }>): number[] {
  return cumulativeMetres(points.map(({ lat, lng }) => [lat, lng] as const)).map(Math.round);
}

/** The lowest and highest height of a line whose heights are known, else nulls. */
export function heightRange(line: readonly RoutePoint[]): { min: number | null; max: number | null } {
  const heights = line.map(([, , height]) => height).filter((height): height is number => height !== null);
  if (heights.length === 0 || heights.length !== line.length) return { min: null, max: null };
  return { min: Math.min(...heights), max: Math.max(...heights) };
}

const POI_CATEGORIES: ReadonlySet<string> = new Set(TOUR_POI_CATEGORIES);

/** A kind of place along a tour, or null. */
export function poiCategoryOf(value: unknown): TourPoiCategory | null {
  return typeof value === 'string' && POI_CATEGORIES.has(value) ? (value as TourPoiCategory) : null;
}

/** A stop with every field it does not name empty. */
export function stopOf(
  fields: Pick<TourRouteStop, 'role' | 'lat' | 'lng' | 'atM'> & Partial<TourRouteStop>,
): TourRouteStop {
  return {
    kind: null,
    name: null,
    offM: null,
    minutes: null,
    clock: null,
    stayMinutes: null,
    stageEnd: false,
    flag: null,
    ...fields,
  };
}

/** The role of the point at `index` of `count` a way runs through. */
export function roleAt(index: number, count: number): TourRouteStop['role'] {
  if (index === 0) return 'start';
  return index === count - 1 ? 'end' : 'via';
}

/** A stop's name from a tool's answer: masked and cut, as a card shows it. */
export function stopName(value: unknown): string | null {
  return clipped(value, 80);
}

/**
 * A text from a call's arguments (a name the change will store): on one
 * line and cut to `max`, never masked, so the card shows what is saved.
 */
export function argText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * The stops in the order they lie along the way, at most as many as a card
 * holds: the ends and the named points first kept, the places along it after.
 */
export function sortedStops(stops: readonly TourRouteStop[]): TourRouteStop[] {
  const most = TOUR_ROUTE_LIMITS.stops + TOUR_ROUTE_LIMITS.along;
  const own = stops.filter((stop) => stop.role !== 'along');
  const kept = [...own.slice(0, TOUR_ROUTE_LIMITS.stops - 1), ...own.slice(-1)].slice(0, own.length);
  const along = stops.filter((stop) => stop.role === 'along').slice(0, most - kept.length);
  return [...kept, ...along].sort((a, b) => a.atM - b.atM);
}

/** A clock `minutes` after a start, `HH:MM`, wrapped past midnight; null without a start. */
export function clockAfter(start: string | null, minutes: number | null): string | null {
  const begin = clockOf(start);
  if (!begin || minutes === null) return null;
  const total = Number(begin.slice(0, 2)) * 60 + Number(begin.slice(3, 5)) + minutes;
  const within = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(within / 60)).padStart(2, '0')}:${String(within % 60).padStart(2, '0')}`;
}

/** The number of a trip day, from the trip card; null for a day it does not hold. */
export function dayNumberOf(card: TripCard, dayId: number | null): number | null {
  if (dayId === null) return null;
  const number = card.days.find((day) => day.id === dayId)?.number ?? null;
  return number !== null && number >= 1 && number <= 999 ? number : null;
}

/** Whether two points lie within `metres` of each other. */
export function near(a: { lat: number; lng: number }, b: { lat: number; lng: number }, metres: number): boolean {
  return haversineMetres(a.lat, a.lng, b.lat, b.lng) <= metres;
}

/** The rows of an array, each as a record. */
export function rowsIn(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

/** A tour card with every field it does not name empty: no figures, no stretches, no schedule. */
export function routeCard(
  fields: Pick<TourRouteCard, 'source' | 'activity' | 'line' | 'routed'> & Partial<TourRouteCard>,
): TourRouteCard {
  return {
    kind: 'tourRoute',
    placeId: null,
    name: null,
    label: null,
    distanceM: null,
    ascentM: null,
    descentM: null,
    minEleM: null,
    maxEleM: null,
    minutes: null,
    minutesBasis: null,
    limit: null,
    grades: null,
    problem: null,
    stretches: [],
    stops: [],
    stages: null,
    skiScheme: null,
    schedule: null,
    warnings: [],
    previous: null,
    ...fields,
  };
}

/** How much a stretch tells: a SAC grade by its step, any other stretch the least. */
function weightOf(stretch: TourRouteStretch): number {
  return stretch.facet === 'sac' ? stretch.step : 0;
}

/**
 * At most `most` stretches, the hardest kept wherever they lie (among equals
 * the first), in their order along the way: the end of a long route keeps its
 * grades rather than reading as ungraded.
 */
export function hardestStretches(stretches: readonly TourRouteStretch[], most: number): TourRouteStretch[] {
  if (stretches.length <= most) return [...stretches];
  return [...stretches]
    .sort((a, b) => weightOf(b) - weightOf(a))
    .slice(0, most)
    .sort((a, b) => a.fromM - b.fromM);
}

/** How a card too heavy to send is lightened, one step after the other, the least telling first. */
const LIGHTER: ReadonlyArray<(card: TourRouteCard) => TourRouteCard> = [
  (card) => ({
    ...card,
    line: thinLine(card.line, 200),
    previous: card.previous ? { ...card.previous, line: thinLine(card.previous.line, 100) } : null,
  }),
  (card) => ({ ...card, stops: card.stops.filter((stop) => stop.role !== 'along' || stop.kind === 'highest') }),
  (card) => ({ ...card, line: thinLine(card.line, 120), stretches: hardestStretches(card.stretches, 40) }),
];

/**
 * The card as light as it must be to be sent (MAX_CARD_CHARS as JSON): a
 * card of long names, a full line and every stretch is thinned first, then
 * loses the places along the way, then more of its line and all but its
 * hardest stretches. One that is still too heavy is refused by the registry.
 */
export function fitted(card: TourRouteCard): TourRouteCard {
  let shown = card;
  for (const lighter of LIGHTER) {
    if (JSON.stringify(shown).length <= MAX_CARD_CHARS) return shown;
    shown = lighter(shown);
  }
  return shown;
}
