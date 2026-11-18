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
}

/** A day's legs, or the reason the router could not answer. */
export type PlannerRouteResult = { ok: true; legs: TravelPlanLeg[] } | { ok: false };

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

  /** The destination's centre, for biasing searches; `null` when nothing resolved. */
  async centre(userId: number, destination: string): Promise<{ lat: number; lng: number } | null> {
    const direct = await this.maps.geocodeQuery(destination);
    if (direct) return direct;

    // The geocoder knows addresses, not city names. Asking the place provider
    // for the destination itself often returns a real record at its centre,
    // which is still a provider answer, never a guessed coordinate.
    try {
      const found = await this.maps.searchPlaces(userId, destination, 'zh');
      const hit = found.places.find((record) => finite(record.lat) && finite(record.lng));
      return hit ? { lat: Number(hit.lat), lng: Number(hit.lng) } : null;
    } catch {
      return null;
    }
  }

  /** Real places for one query, normalised; throws only when the provider refused. */
  async search(userId: number, query: string, bias: { lat: number; lng: number }): Promise<PlannerCandidate[]> {
    const checkedAt = dbNow();
    const { places } = await this.maps.searchPlaces(userId, query, 'zh', { ...bias, radius: 50_000 });
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
          costing: transport === 'drive' ? 'auto' : 'pedestrian',
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

  return {
    place: { provider, providerId, name, lat, lng },
    source: { provider, sourceId: providerId, checkedAt, freshness: 'live' },
    address: text(record.address),
    category: text(record.category) ?? firstCategory(record.types),
    hours,
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
