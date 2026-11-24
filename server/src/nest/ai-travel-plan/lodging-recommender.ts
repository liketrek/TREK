import type { PlannerCandidate, PlannerProvider } from './planner-provider';
import type { TravelPlanLodgingArea, TravelPlanWarning } from '@trek/shared';

/** Provider categories and names that mean "you can sleep here". */
const LODGING_CATEGORY_TOKENS = ['住宿服务', 'hotel', 'hostel', 'guest_house', 'guesthouse', 'lodging'];
const LODGING_NAME_TOKENS = ['酒店', '宾馆', '民宿', '客栈', '旅馆', '青年旅舍', '旅社', '公寓'];

const MAX_QUERIES = 4;
const MAX_AREAS = 3;
const MAX_SAMPLES = 3;
/** Two anchor stops closer than this share one lodging area. */
const ANCHOR_MERGE_METERS = 800;
const ANCHOR_RADIUS_METERS = 5_000;
const FALLBACK_RADIUS_METERS = 8_000;

export interface LodgingRecommendation {
  areas: TravelPlanLodgingArea[];
  warning?: TravelPlanWarning;
}

export interface LodgingInput {
  provider: Pick<PlannerProvider, 'searchLodging'>;
  userId: number;
  destination: string;
  centre: { lat: number; lng: number };
  /** The scheduled stops, in itinerary order; only the first few are anchors. */
  anchors: PlannerCandidate[];
}

/**
 * A place is lodging when the provider's category or its own name says so.
 * This is intentionally separate from the visit-category filter: a hotel is
 * not a stop, but it is exactly what this search is looking for.
 */
export function isLodgingCandidate(candidate: PlannerCandidate): boolean {
  const category = (candidate.category ?? '').toLowerCase();
  if (LODGING_CATEGORY_TOKENS.some((token) => category.includes(token))) return true;
  return LODGING_NAME_TOKENS.some((token) => candidate.place.name.includes(token));
}

function pickAnchors(anchors: PlannerCandidate[]): PlannerCandidate[] {
  const picked: PlannerCandidate[] = [];
  for (const anchor of anchors) {
    if (picked.length >= MAX_AREAS) break;
    if (picked.some((existing) => haversine(existing.place, anchor.place) <= ANCHOR_MERGE_METERS)) continue;
    picked.push(anchor);
  }
  return picked;
}

function buildArea(anchor: PlannerCandidate, hotels: PlannerCandidate[]): TravelPlanLodgingArea {
  const lat = hotels.reduce((total, hotel) => total + hotel.place.lat, 0) / hotels.length;
  const lng = hotels.reduce((total, hotel) => total + hotel.place.lng, 0) / hotels.length;
  const ratings = hotels.map((hotel) => hotel.rating ?? null).filter((rating): rating is number => rating !== null);
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10
    : null;
  const distanceOf = (hotel: PlannerCandidate): number => Math.round(haversine(anchor.place, hotel.place));
  const samples = [...hotels]
    .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || distanceOf(a) - distanceOf(b))
    .slice(0, MAX_SAMPLES)
    .map((hotel) => ({
      place: hotel.place,
      rating: hotel.rating ?? null,
      distanceMeters: distanceOf(hotel),
      source: hotel.source,
    }));

  return {
    name: truncate(`${anchor.place.name}周边`, 120),
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    hotelCount: hotels.length,
    avgRating,
    sampleHotels: samples,
    reason: truncate(`靠近「${anchor.place.name}」，${hotels.length} 家住宿可选。`, 200),
  };
}

/**
 * Turn real lodging search results into at most three areas, each anchored on
 * a scheduled stop. Prices, availability and booking are out of scope; a failed
 * search is an info warning, never a reason to drop the draft.
 */
export async function recommendLodging(input: LodgingInput): Promise<LodgingRecommendation> {
  const seen = new Set<string>();
  let queries = 0;
  let failed = false;

  const search = async (
    query: string,
    bias: { lat: number; lng: number },
    radius: number,
  ): Promise<PlannerCandidate[]> => {
    if (queries >= MAX_QUERIES) return [];
    queries += 1;
    try {
      return await input.provider.searchLodging(input.userId, query, bias, radius);
    } catch {
      failed = true;
      return [];
    }
  };

  const freshHotels = (found: PlannerCandidate[]): PlannerCandidate[] => {
    const result: PlannerCandidate[] = [];
    for (const candidate of found) {
      if (!isLodgingCandidate(candidate)) continue;
      const key = `${candidate.place.provider}:${candidate.place.providerId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(candidate);
    }
    return result;
  };

  const areas: TravelPlanLodgingArea[] = [];
  const anchors = pickAnchors(input.anchors);
  let fallbackSearch: Promise<PlannerCandidate[]> | null = null;
  const fallback = (): Promise<PlannerCandidate[]> => {
    fallbackSearch ??= search(`${input.destination} 酒店`, input.centre, FALLBACK_RADIUS_METERS);
    return fallbackSearch;
  };

  const collectArea = async (index: number): Promise<void> => {
    if (index >= anchors.length || areas.length >= MAX_AREAS) return;
    const anchor = anchors[index];
    if (!anchor) return;
    let hotels = freshHotels(await search(`${anchor.place.name} 酒店`, anchor.place, ANCHOR_RADIUS_METERS));
    if (hotels.length < 2) {
      hotels = [...hotels, ...freshHotels(await fallback())];
    }
    if (hotels.length > 0) areas.push(buildArea(anchor, hotels));
    await collectArea(index + 1);
  };
  await collectArea(0);

  if (areas.length === 0 && anchors.length === 0) {
    const hotels = freshHotels(await fallback());
    if (hotels.length > 0) {
      const centreAnchor: PlannerCandidate = {
        place: {
          provider: 'maps',
          providerId: `centre:${input.destination}`,
          name: input.destination,
          lat: input.centre.lat,
          lng: input.centre.lng,
          category: null,
          address: null,
          rating: null,
          hours: [],
          coordinateSystem: 'wgs84',
        },
        source: { provider: 'maps', sourceId: `centre:${input.destination}`, checkedAt: '', freshness: 'live' },
        address: null,
        category: null,
        hours: [],
        rating: null,
      };
      areas.push(buildArea(centreAnchor, hotels));
    }
  }

  if (areas.length === 0) {
    return {
      areas,
      warning: {
        code: 'lodging_unavailable',
        message: failed
          ? '住宿检索暂时不可用，草案未包含住宿区域推荐。'
          : '没有检索到可用的住宿，可稍后在预订平台按区域查询。',
        severity: 'info',
      },
    };
  }
  return { areas };
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}
