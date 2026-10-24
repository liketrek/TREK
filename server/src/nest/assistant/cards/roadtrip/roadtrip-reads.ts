import { localParts, resolveTimeZone } from '../../../common/timezoneService';
import type { AnswerInput, ToolArgs } from '../card-types';
import { argId, clipped, finite, instantOf, isLat, isLng, recordOf, type Row } from '../card-values';
import {
  chargingInfoSchema,
  cheapestEnergy,
  CORRIDOR_CARD_HITS_MAX,
  DAY_ROUTE_CARD_STOPS_MAX,
  MAX_CARD_CHARS,
  roadtripCorridorRequestSchema,
  TRANSIT_CARD_ITINERARIES_MAX,
  TRANSIT_CARD_LEGS_MAX,
  type ChargingCard,
  type CorridorCard,
  type DayRouteCard,
  type TransitCard,
  type TransitCardItinerary,
} from '@trek/shared';

/**
 * The answer cards of the road trip's reads: what a corridor search found
 * along a day, a charger as one look found it, the connections a transit
 * search offers (and the one a held journey adds), and the stops a Google
 * Maps route link names. Each is built from the tool's raw answer; texts are
 * masked like a provider answer, and no card carries an address of the web.
 */

/** The corridor search pages its areas six at a time. */
const AREAS_PER_PAGE = 6;
/** Room a card leaves under the cap for the envelope it is stored in. */
const BUDGET = MAX_CARD_CHARS - 400;

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

function wholeIn(value: unknown, min: number, max: number): number | null {
  const number = finite(value);
  return number === null ? null : Math.min(max, Math.max(min, Math.round(number)));
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function socketsOf(poi: Row): CorridorCard['hits'][number]['sockets'] {
  return rows(recordOf(poi.charging).sockets)
    .flatMap((socket) => {
      const type = clipped(socket.type, 20);
      const kw = finite(socket.kw);
      return type
        ? [{ type, kw: kw === null ? null : Math.min(2000, Math.max(0, kw)), count: wholeIn(socket.count, 0, 99) }]
        : [];
    })
    .sort((a, b) => (b.kw ?? -1) - (a.kw ?? -1))
    .slice(0, 4);
}

function betweenOf(value: unknown): [string, string] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const from = clipped(value[0], 80);
  const to = clipped(value[1], 80);
  return from && to ? [from, to] : null;
}

/** search_roadtrip_corridor's hits along one day; a search with no hit still says so. */
export function corridorAnswerCard({ toolCallId, args, value, card }: AnswerInput): CorridorCard | null {
  const answer = recordOf(value);
  const dayNumber = wholeIn(answer.dayNumber ?? args.dayNumber, 1, 999);
  const category = roadtripCorridorRequestSchema.shape.category.safeParse(args.category);
  if (dayNumber === null || !category.success) return null;
  const width = finite(args.widthKm);
  const hits = rows(answer.hits).flatMap((hit, index) => {
    const poi = recordOf(hit.poi);
    const lat = finite(poi.lat);
    const lng = finite(poi.lng);
    const alongKm = finite(hit.alongKm);
    if (!isLat(lat) || !isLng(lng) || alongKm === null) return [];
    return [
      {
        ref: `${toolCallId}:${index}`,
        name: clipped(poi.name, 80),
        brand: clipped(poi.brand, 40),
        lat: roundTo(lat, 5),
        lng: roundTo(lng, 5),
        alongKm: roundTo(Math.min(40_000, Math.max(0, alongKm)), 1),
        offKm: roundTo(Math.min(10, Math.max(0, finite(hit.distanceKm) ?? 0)), 2),
        between: betweenOf(hit.between),
        sockets: socketsOf(poi),
      },
    ];
  });
  const total = wholeIn(answer.totalAreas, 0, 1000) ?? 0;
  const offset = wholeIn(args.offset, 0, 1000) ?? 0;
  const shown = hits.slice(0, CORRIDOR_CARD_HITS_MAX);
  return {
    kind: 'corridor',
    dayId: card.days.find((day) => day.number === dayNumber)?.id ?? null,
    dayNumber,
    category: category.data,
    widthKm: width !== null && width > 0 && width <= 10 ? width : 5,
    hits: shown,
    more: Math.min(10_000, hits.length - shown.length),
    searched: { done: Math.min(total, offset + AREAS_PER_PAGE), total },
    partial: answer.complete !== true,
  };
}

/** get_ and lookup_roadtrip_charging_info: free points, the cheapest energy price and the source, as checked. */
export function chargingAnswerCard({ args, value, card }: AnswerInput): ChargingCard | null {
  const parsed = chargingInfoSchema.safeParse(value);
  if (!parsed.success) return null;
  const info = parsed.data;
  const placeId = argId(args, 'placeId');
  const place = placeId === null ? undefined : card.places.get(placeId);
  const lat = finite(place ? place.lat : args.lat);
  const lng = finite(place ? place.lng : args.lng);
  const cheapest = cheapestEnergy(info.tariffs);
  const components = info.tariffs.reduce((sum, tariff) => sum + tariff.components.length, 0);
  const energy =
    cheapest && /^[A-Z]{3}$/.test(cheapest.currency) && cheapest.price <= 1e9
      ? { amount: cheapest.price, currency: cheapest.currency }
      : null;
  return {
    kind: 'charging',
    placeId,
    name: clipped(place ? place.name : args.name, 80),
    station: clipped(info.station, 120),
    lat: isLat(lat) ? roundTo(lat, 5) : null,
    lng: isLng(lng) ? roundTo(lng, 5) : null,
    status: info.status,
    stale: info.stale,
    available: info.available === null ? null : Math.min(999, info.available),
    total: Math.min(999, info.total),
    checkedAt: instantOf(info.checkedAt),
    updatedAt: instantOf(info.updatedAt),
    energy,
    otherPrices: Math.min(99, Math.max(0, components - (energy ? 1 : 0))),
    source: clipped(info.source, 80),
    license: clipped(info.license, 120),
  };
}

/** A transit line colour as `#rrggbb`; the short form is spelled out, anything else gives null. */
function lineColour(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

/** The local date and clock of a moment at a stop, in the zone of where the stop is. */
function localAt(iso: unknown, stop: Row): { date: string | null; time: string | null } {
  if (typeof iso !== 'string') return { date: null, time: null };
  return localParts(iso, resolveTimeZone(stop.lat, stop.lng));
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function stopOf(raw: unknown): TransitCardItinerary['legs'][number]['from'] {
  const stop = recordOf(raw);
  return {
    name: clipped(stop.name, 80) ?? '?',
    time: localAt(stop.time ?? stop.scheduledTime, stop).time,
    track: clipped(stop.track, 12),
  };
}

/** One connection as a card lists it, its clocks local to each stop; null when its times do not read. */
export function itineraryOf(raw: unknown): TransitCardItinerary | null {
  const itinerary = recordOf(raw);
  const legs = rows(itinerary.legs);
  const first = recordOf(legs[0]?.from);
  const last = recordOf(legs[legs.length - 1]?.to);
  const start = localAt(itinerary.startTime, first);
  const end = localAt(itinerary.endTime, last);
  if (legs.length === 0 || !start.date || !start.time || !end.date || !end.time) return null;
  const endDayOffset = daysBetween(start.date, end.date);
  if (endDayOffset < 0 || endDayOffset > 3) return null;
  return {
    date: start.date,
    start: start.time,
    end: end.time,
    endDayOffset,
    durationS: Math.min(1e7, Math.max(0, finite(itinerary.duration) ?? 0)),
    transfers: wholeIn(itinerary.transfers, 0, 20) ?? 0,
    walkS: Math.min(1e7, Math.max(0, finite(itinerary.walkSeconds) ?? 0)),
    legs: legs.slice(0, TRANSIT_CARD_LEGS_MAX).map((leg) => ({
      mode: typeof leg.mode === 'string' && /^[A-Z_]{1,40}$/.test(leg.mode) ? leg.mode : 'OTHER',
      line: clipped(leg.line, 20),
      lineColor: lineColour(leg.lineColor),
      lineTextColor: lineColour(leg.lineTextColor),
      from: stopOf(leg.from),
      to: stopOf(leg.to),
      durationS: Math.min(1e7, Math.max(0, finite(leg.duration) ?? 0)),
      stops: wholeIn(leg.intermediateStops, 0, 500) ?? 0,
      headsign: clipped(leg.headsign, 80),
      agency: clipped(leg.agency, 60),
    })),
  };
}

/** The name a transit place goes by: the call's own, else the first stop's of the connection. */
function placeName(place: unknown, fallback: TransitCardItinerary['legs'][number]['from'] | undefined): string | null {
  return clipped(recordOf(place).name, 80) ?? fallback?.name ?? null;
}

/**
 * search_transit_routes' connections, the first four of them, fewer when
 * long ones would not fit under the cap; the rest are counted in `more`.
 */
export function transitAnswerCard({ args, value }: AnswerInput): TransitCard | null {
  const answer = recordOf(value);
  const itineraries = rows(answer.itineraries).flatMap((raw) => {
    const itinerary = itineraryOf(raw);
    return itinerary ? [itinerary] : [];
  });
  const first = itineraries[0];
  const from = placeName(args.from, first?.legs[0]?.from);
  const to = placeName(args.to, first?.legs[first.legs.length - 1]?.to);
  if (!first || !from || !to) return null;
  const dropped = wholeIn(answer.dropped, 0, 100) ?? 0;
  for (let count = Math.min(TRANSIT_CARD_ITINERARIES_MAX, itineraries.length); count >= 1; count -= 1) {
    const card: TransitCard = {
      kind: 'transit',
      from,
      to,
      dayId: null,
      itineraries: itineraries.slice(0, count),
      more: Math.min(100, itineraries.length - count),
      dropped,
    };
    if (JSON.stringify(card).length <= BUDGET) return card;
  }
  return null;
}

/** The journey a held create_transit_journey adds, from its arguments. */
export function transitChangeCard(args: ToolArgs): TransitCard | null {
  const itinerary = itineraryOf(args.itinerary);
  if (!itinerary) return null;
  const from = placeName(args.from, itinerary.legs[0]?.from);
  const to = placeName(args.to, itinerary.legs[itinerary.legs.length - 1]?.to);
  if (!from || !to) return null;
  return { kind: 'transit', from, to, dayId: argId(args, 'dayId'), itineraries: [itinerary], more: 0, dropped: 0 };
}

/** The stops a Google Maps link names, as preview_google_maps_route read them once the user let it. */
export function googleRouteCard(result: unknown): DayRouteCard | null {
  const located: DayRouteCard['stops'] = [];
  const unresolved: string[] = [];
  for (const stop of rows(recordOf(result).stops)) {
    const name = clipped(stop.name, 80);
    const lat = finite(stop.lat);
    const lng = finite(stop.lng);
    if (!name) continue;
    if (isLat(lat) && isLng(lng)) {
      if (located.length < DAY_ROUTE_CARD_STOPS_MAX) {
        located.push({ placeId: null, name, lat: roundTo(lat, 5), lng: roundTo(lng, 5), added: true });
      }
    } else if (unresolved.length < 10) unresolved.push(name);
  }
  if (located.length === 0 && unresolved.length === 0) return null;
  return {
    kind: 'dayRoute',
    dayId: null,
    dayNumber: null,
    stops: located,
    vias: [],
    afterName: null,
    track: null,
    unresolved,
  };
}
