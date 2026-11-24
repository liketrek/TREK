import { dbNow } from '../../db/types';
import { MapsService } from '../maps/maps.service';
import { RoutingRelayService } from '../routing-relay/routing-relay.service';
import { Injectable } from '@nestjs/common';
import type { TravelPlanLeg, TravelPlanPlace, TravelPlanSource } from '@trek/shared';

/** One real place a provider returned, with the evidence a draft has to carry. */
export interface PlannerCandidate {
  place: TravelPlanPlace;
  source: TravelPlanSource;
  address: string | null;
  category: string | null;
  /** Opening-hours text exactly as the provider wrote it; empty when it has none. */
  hours: string[];
  /** Provider rating 0–5, or null when the provider has none. */
  rating?: number | null;
}

/** A day's legs, or the reason the router could not answer. */
export type PlannerRouteResult = { ok: true; legs: TravelPlanLeg[] } | { ok: false };

/** Map "types" that name an area, never a visitable stop. */
export const ADMIN_CATEGORIES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'county',
  'state',
  'province',
  'region',
  'country',
  'administrative',
  'boundary',
]);

/**
 * The only door the planner has to the outside world (PLAN-07).
 *
 * It calls what the installation already ships — `MapsService` for places and
 * geocoding, `RoutingRelayService` for legs — and nothing else. Every record it
 * returns keeps its provider id and check time, so the draft can prove where a
 * place came from. It never invents a place, a coordinate or a route.
 */
@Injectable()
export class PlannerProvider {
  constructor(
    private readonly maps: MapsService,
    private readonly routing: RoutingRelayService,
  ) {}

  /**
   * The destination's centre, for biasing searches; `null` when nothing resolved.
   *
   * An administrative record comes first: the geocoder happily returns a
   * same-named restaurant in another country ("成都" in Tokyo), while a city
   * record is the thing the traveller actually named.
   */
  async centre(userId: number, destination: string): Promise<{ lat: number; lng: number } | null> {
    const wanted = destination.replace(/\s+/g, '');
    try {
      const found = await this.maps.searchPlaces(userId, destination, 'zh');
      const records = found.places.filter((record) => finite(record.lat) && finite(record.lng));
      const named = records.filter((record) => nameMatches(text(record.name), wanted));
      const hit = named.find(isArea);
      if (hit) return { lat: Number(hit.lat), lng: Number(hit.lng) };
      // No administrative record (the OSM half can be down while the business
      // index answers): the densest cluster of same-named records is still a
      // far better anchor than the geocoder's first hit, which can be a
      // namesake on another continent ("杭州" is an airport in Kuala Lumpur).
      const dense = densestRecord(named);
      if (dense) return { lat: Number(dense.lat), lng: Number(dense.lng) };
    } catch {
      // Fall through to the geocoder; a provider refusal must not block a plan.
    }

    return this.maps.geocodeQuery(destination);
  }

  /** Real places for one query, normalised; throws only when the provider refused. */
  async search(userId: number, query: string, bias: { lat: number; lng: number }): Promise<PlannerCandidate[]> {
    return this.searchByRadius(userId, query, bias, 50_000);
  }

  /**
   * Lodging near a point. It deliberately skips `isVisitCategory`: a hotel is
   * not a stop, but it is exactly what this search asks for.
   */
  async searchLodging(
    userId: number,
    query: string,
    bias: { lat: number; lng: number },
    radiusM = 5_000,
  ): Promise<PlannerCandidate[]> {
    return this.searchByRadius(userId, query, bias, radiusM);
  }

  private async searchByRadius(
    userId: number,
    query: string,
    bias: { lat: number; lng: number },
    radius: number,
  ): Promise<PlannerCandidate[]> {
    const checkedAt = dbNow();
    const { places } = await this.maps.searchPlaces(userId, query, 'zh', { ...bias, radius });
    return places
      .map((record) => toCandidate(record, checkedAt))
      .filter((candidate): candidate is PlannerCandidate => candidate !== null);
  }

  /**
   * A real route through the day's points. Any refusal, timeout or shape this
   * parser does not recognise is an honest `ok: false`; the caller may mark the
   * legs as estimated, but it must never present one as a checked route.
   */
  async route(
    userId: number,
    points: Array<{ lat: number; lng: number }>,
    transport: 'walk' | 'drive' | 'other',
  ): Promise<PlannerRouteResult> {
    if (points.length < 2) return { ok: true, legs: [] };
    try {
      const answer = await this.routing.ask(
        userId,
        'route',
        {
          locations: points.map((point) => ({ lat: point.lat, lon: point.lng })),
          // Transit is routed on the road network with car costing: a pedestrian
          // route between stops a few kilometres apart either exceeds the
          // timeout or reports an unusable duration. Car time is the closest
          // road-based fallback; the leg keeps the requested transit mode.
          costing: transport === 'walk' ? 'pedestrian' : 'auto',
        },
        15_000,
      );
      if (answer.status !== 200) return { ok: false };
      const payload = JSON.parse(answer.body.toString('utf8')) as {
        trip?: { legs?: Array<{ summary?: { length?: unknown; time?: unknown } }> };
      };
      const legs = payload.trip?.legs;
      if (!Array.isArray(legs) || legs.length !== points.length - 1) return { ok: false };
      return {
        ok: true,
        legs: legs.map((leg) => {
          const seconds = numberOrNull(leg.summary?.time);
          const kilometres = numberOrNull(leg.summary?.length);
          return {
            mode: transport,
            minutes: seconds === null ? 0 : Math.max(0, Math.round(seconds / 60)),
            distanceMeters: kilometres === null ? null : Math.max(0, Math.round(kilometres * 1000)),
          } satisfies TravelPlanLeg;
        }),
      };
    } catch {
      return { ok: false };
    }
  }
}

/** The transport a request asks for, as the route provider's three answers. */
export function routeTransport(transport: 'public_transit' | 'driving' | 'walking' | 'mixed'): TravelPlanLeg['mode'] {
  if (transport === 'driving') return 'drive';
  if (transport === 'public_transit' || transport === 'mixed') return 'public_transit';
  return 'walk';
}

function isArea(record: Record<string, unknown>): boolean {
  const category = text(record.category)?.toLowerCase();
  return category !== undefined && ADMIN_CATEGORIES.has(category);
}

function nameMatches(name: string | null, wanted: string): boolean {
  if (!name || !wanted) return false;
  const plain = name.replace(/\s+/g, '');
  return plain === wanted || plain.includes(wanted) || wanted.includes(plain);
}

/** How close two same-named records must be to count as the same settlement. */
const CENTRE_CLUSTER_KM = 150;

/**
 * The same-named record with the most same-named neighbours, when at least two
 * agree. Coordinates are the one thing about a namesake that needs no language
 * to read, so this is what breaks the tie when no administrative record came
 * back: a city's own records cluster, a same-named airport abroad sits alone.
 */
function densestRecord(records: Record<string, unknown>[]): Record<string, unknown> | null {
  let best: Record<string, unknown> | null = null;
  let bestNeighbours = 0;
  for (const record of records) {
    const neighbours = records.filter(
      (other) =>
        other !== record &&
        distanceKm(Number(record.lat), Number(record.lng), Number(other.lat), Number(other.lng)) <= CENTRE_CLUSTER_KM,
    ).length;
    if (neighbours > bestNeighbours) {
      best = record;
      bestNeighbours = neighbours;
    }
  }
  return bestNeighbours > 0 ? best : null;
}

/** Flat-earth distance in kilometres; exact enough at the cluster radius. */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (aLat - bLat) * 111;
  const dLng = (aLng - bLng) * 111 * Math.cos(((aLat + bLat) / 2) * rad);
  return Math.hypot(dLat, dLng);
}

function toCandidate(record: Record<string, unknown>, checkedAt: string): PlannerCandidate | null {
  const name = text(record.name);
  const lat = numberOrNull(record.lat);
  const lng = numberOrNull(record.lng);
  if (!name || lat === null || lng === null) return null;

  const provider = text(record.source) ?? 'maps';
  const providerId = text(record.amap_poi_id) ?? text(record.google_place_id) ?? text(record.osm_id) ?? text(record.id);
  if (!providerId) return null;

  const hours = Array.isArray(record.opening_hours)
    ? record.opening_hours.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
    : [];
  const rating = numberOrNull(record.rating);
  const address = text(record.address);
  const category = text(record.category) ?? firstCategory(record.types);
  // A provider that reports 0 or a value above 5 has no usable rating; the
  // schema range would otherwise reject the whole draft.
  const usableRating = rating !== null && rating >= 0 && rating <= 5 ? rating : null;

  return {
    place: {
      provider,
      providerId,
      name,
      lat,
      lng,
      category,
      address,
      rating: usableRating,
      hours,
      // The provider converts whatever datum it speaks to WGS-84 at its own
      // boundary (see places-provider.ts), so the draft can state it plainly.
      coordinateSystem: 'wgs84',
    },
    source: { provider, sourceId: providerId, checkedAt, freshness: 'live' },
    address,
    category,
    hours,
    rating: usableRating,
  };
}

function firstCategory(types: unknown): string | null {
  if (!Array.isArray(types)) return null;
  for (const entry of types) {
    const value = text(entry);
    if (value) return value;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function finite(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
