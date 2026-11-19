import { dbNow } from '../../db/types';
import { ADMIN_CATEGORIES, PlannerProvider, routeTransport, type PlannerCandidate } from './planner-provider';
import { Injectable } from '@nestjs/common';
import type {
  TravelPlanBudget,
  TravelPlanCreateRequest,
  TravelPlanDraft,
  TravelPlanDraftDay,
  TravelPlanDraftItem,
  TravelPlanFact,
  TravelPlanLeg,
  TravelPlanStreamStage,
  TravelPlanWarning,
} from '@trek/shared';

/** When a planned day starts. */
const DAY_START_MINUTES = 9 * 60;

/** Longest a search query may be; the place provider refuses very long keywords. */
const QUERY_MAX = 80;

/** Never ask a provider for more than this many place searches per plan. */
const MAX_QUERIES = 5;

/** Never schedule more places than this, whatever the pace. */
const MAX_PLACES = 24;

/** A stop must be near the resolved centre; a same-named venue abroad is not a candidate. */
const MAX_PLACE_DISTANCE_M = 80_000;

export interface PlannerOutcome {
  draft: TravelPlanDraft;
  facts: TravelPlanFact[];
  warnings: TravelPlanWarning[];
}

export interface PlanInput {
  userId: number;
  request: TravelPlanCreateRequest;
  /** Extra search words a revision asked for. */
  extraQueries?: string[];
  onStage?: (stage: TravelPlanStreamStage) => void;
}

/**
 * PLAN-08 + PLAN-09: real places in, a day-by-day draft out.
 *
 * The service never writes prose about a place a provider did not return and
 * never puts a price on one. It searches only through `PlannerProvider`,
 * schedules what came back by opening-day order and pace, and reports every
 * gap or skipped place as a warning instead of hiding it.
 */
@Injectable()
export class PlannerService {
  constructor(private readonly provider: PlannerProvider) {}

  async plan(input: PlanInput): Promise<PlannerOutcome> {
    const { userId, request, onStage } = input;
    const checkedAt = dbNow();
    const warnings: TravelPlanWarning[] = [];

    const dates = planDates(request);
    if (!request.destination || dates.length === 0) {
      return emptyOutcome(checkedAt, '缺少目的地或日期，暂时无法检索真实地点。', [
        {
          code: 'request_incomplete',
          message: '请补充目的地与出发日期（或行程天数）后再生成。',
          severity: 'blocking',
        },
      ]);
    }

    onStage?.('places');
    const centre = await this.provider.centre(userId, request.destination);
    if (!centre) {
      return emptyOutcome(checkedAt, '目的地没能在地图供应商处解析。', [
        {
          code: 'destination_unresolved',
          message: `无法解析目的地「${request.destination}」，请换一个更具体的城市或区域名称。`,
          severity: 'blocking',
        },
      ]);
    }

    const queries = buildQueries(request, input.extraQueries ?? []);
    const results = await Promise.all(
      queries.map(async (query): Promise<{ candidates?: PlannerCandidate[]; warning?: TravelPlanWarning }> => {
        try {
          return { candidates: await this.provider.search(userId, query, centre) };
        } catch {
          return {
            warning: {
              code: 'place_search_failed',
              message: `地点检索「${query}」暂时失败，结果可能不完整。`,
              severity: 'warning',
            },
          };
        }
      }),
    );
    const candidates = results.flatMap((result) => result.candidates ?? []);
    for (const result of results) {
      if (result.warning) warnings.push(result.warning);
    }
    // Keep the draft in one city: drop administrative areas (a "city" record is
    // not a stop) and same-named venues that geocoded somewhere else entirely.
    const nearby = candidates.filter(
      (candidate) =>
        !ADMIN_CATEGORIES.has((candidate.category ?? '').toLowerCase()) &&
        haversine(centre, candidate.place) <= MAX_PLACE_DISTANCE_M,
    );
    if (nearby.length === 0) {
      return emptyOutcome(checkedAt, '没有检索到可用的真实地点。', [
        ...warnings,
        {
          code: 'no_places_found',
          message: '地图供应商没有返回可用的地点，请调整目的地或兴趣后重试。',
          severity: 'blocking',
        },
      ]);
    }

    const perDay = request.pace === 'relaxed' ? 3 : request.pace === 'intensive' ? 5 : 4;
    const cap = Math.min(dates.length * perDay, MAX_PLACES);
    const ordered = nearestNeighbour(dedupe(nearby), centre);
    const selected = ordered.slice(0, cap);
    if (ordered.length > selected.length) {
      warnings.push({
        code: 'places_skipped',
        message: `检索到 ${ordered.length} 个地点，按行程天数只安排了前 ${selected.length} 个。`,
        severity: 'info',
      });
    }

    const transport = routeTransport(request.transport);
    onStage?.('routing');
    const routed = await this.provider.route(
      userId,
      selected.map((candidate) => ({ lat: candidate.place.lat, lng: candidate.place.lng })),
      transport === 'walk' ? 'walk' : transport === 'drive' ? 'drive' : 'other',
    );
    let legs: TravelPlanLeg[];
    if (routed.ok) {
      legs = routed.legs;
    } else {
      legs = estimatedLegs(selected, transport);
      warnings.push({
        code: 'route_unavailable',
        message: '路线服务暂时不可用，地点之间的交通时间按直线距离估算，请以实际路况为准。',
        severity: 'warning',
      });
    }

    onStage?.('scheduling');
    const { days, skipped } = scheduleDays(selected, legs, dates, request.pace);
    if (skipped > 0) {
      warnings.push({
        code: 'places_skipped',
        message: `当天时间不够，${skipped} 个地点没有排进行程。`,
        severity: 'info',
      });
    }

    const facts = buildFacts(selected, days, routed.ok, checkedAt);
    const summary = buildSummary(selected.length, days.length, routed.ok);

    onStage?.('validating');
    return {
      draft: {
        summary,
        factsCheckedAt: checkedAt,
        days,
        estimatedBudgetCny: emptyBudget(),
        warnings: [],
      },
      facts,
      warnings,
    };
  }
}

/** The calendar days a request covers; empty when it has no start date. */
export function planDates(request: TravelPlanCreateRequest): string[] {
  if (!request.startDate) return [];
  const start = Date.parse(`${request.startDate}T00:00:00Z`);
  if (!Number.isFinite(start)) return [];

  const count = dayCountOf(request);
  if (count === null || count < 1) return [];

  return Array.from({ length: Math.min(count, 14) }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}

function dayCountOf(request: TravelPlanCreateRequest): number | null {
  if (request.endDate) {
    const start = Date.parse(`${request.startDate}T00:00:00Z`);
    const end = Date.parse(`${request.endDate}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    return Math.round((end - start) / 86_400_000) + 1;
  }
  return request.dayCount ?? null;
}

function buildQueries(request: TravelPlanCreateRequest, extra: string[]): string[] {
  const destination = request.destination ?? '';
  const interests = request.interests.length > 0 ? request.interests : ['景点', '博物馆', '公园'];
  // The destination keeps the last slot; every other slot is a keyword, so a
  // fourth interest is searched instead of silently dropped.
  const keywords = [...interests, ...extra].slice(0, Math.max(1, MAX_QUERIES - 1));
  const queries = [...keywords.map((keyword) => `${destination} ${keyword}`), destination]
    .map((query) => query.replace(/\s+/g, ' ').trim().slice(0, QUERY_MAX))
    .filter((query) => query !== '');

  return [...new Set(queries)].slice(0, MAX_QUERIES);
}

function dedupe(candidates: PlannerCandidate[]): PlannerCandidate[] {
  const ids = new Set<string>();
  const spots = new Set<string>();
  return candidates.filter((candidate) => {
    if (ids.has(candidate.place.providerId)) return false;
    // The index and OSM can both return the same venue under different ids.
    const spot = `${candidate.place.name.trim()}|${candidate.place.lat.toFixed(3)},${candidate.place.lng.toFixed(3)}`;
    if (spots.has(spot)) return false;
    ids.add(candidate.place.providerId);
    spots.add(spot);
    return true;
  });
}

/** Greedy nearest-neighbour from the destination centre: short hops, no criss-crossing. */
function nearestNeighbour(candidates: PlannerCandidate[], centre: { lat: number; lng: number }): PlannerCandidate[] {
  const remaining = [...candidates];
  const ordered: PlannerCandidate[] = [];
  let current = centre;
  while (remaining.length > 0) {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const distance = haversine(current, remaining[index]?.place as { lat: number; lng: number });
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    const picked = remaining.splice(best, 1)[0];
    if (!picked) break;
    ordered.push(picked);
    current = { lat: picked.place.lat, lng: picked.place.lng };
  }
  return ordered;
}

function scheduleDays(
  selected: PlannerCandidate[],
  legs: TravelPlanLeg[],
  dates: string[],
  pace: TravelPlanCreateRequest['pace'],
): { days: TravelPlanDraftDay[]; skipped: number } {
  const stay = pace === 'relaxed' ? 120 : pace === 'intensive' ? 60 : 90;
  const dayEnd = pace === 'relaxed' ? 18 * 60 : pace === 'intensive' ? 20 * 60 : 19 * 60;
  const days: TravelPlanDraftDay[] = dates.map((date) => ({ date, items: [] }));

  // More stops than days would otherwise pack the first days and leave the
  // tail empty; spread the route across the whole calendar instead. A short
  // list that fits one day keeps the old packing behaviour.
  const spread = selected.length > dates.length;
  const dayOf = (index: number) =>
    spread ? Math.min(days.length - 1, Math.floor((index * days.length) / selected.length)) : 0;

  let dayIndex = 0;
  let cursor = DAY_START_MINUTES;
  let previous = -1;
  let skipped = 0;

  for (let index = 0; index < selected.length; index += 1) {
    const candidate = selected[index];
    if (!candidate) continue;
    const target = dayOf(index);
    if (target > dayIndex) {
      dayIndex = target;
      cursor = DAY_START_MINUTES;
      previous = -1;
    }
    let leg = previous >= 0 && days[dayIndex]?.items.length ? (legs[previous] ?? null) : null;
    let arrive = cursor + (leg?.minutes ?? 0);
    if (arrive >= 11 * 60 + 30 && arrive < 13 * 60 + 30) arrive = 13 * 60 + 30;
    let leave = arrive + stay;

    if (leave > dayEnd && (days[dayIndex]?.items.length ?? 0) > 0) {
      dayIndex += 1;
      if (dayIndex >= days.length) {
        skipped = selected.length - index;
        break;
      }
      leg = null;
      arrive = DAY_START_MINUTES;
      leave = arrive + stay;
    }

    const day = days[dayIndex];
    if (!day) break;
    day.items.push(itemOf(candidate, arrive, leave, leg));
    cursor = leave;
    previous = index;
  }

  return { days, skipped };
}

function itemOf(
  candidate: PlannerCandidate,
  arrive: number,
  leave: number,
  leg: TravelPlanLeg | null,
): TravelPlanDraftItem {
  return {
    place: candidate.place,
    arriveAt: clock(arrive),
    leaveAt: clock(leave),
    activity: candidate.category ?? '游览',
    travelFromPrevious: leg,
    estimatedCostCny: null,
    source: candidate.source,
  };
}

/** Straight-line minutes, only used when the router refused; never shown as a route fact. */
function estimatedLegs(candidates: PlannerCandidate[], transport: TravelPlanLeg['mode']): TravelPlanLeg[] {
  const metresPerMinute = transport === 'drive' ? 400 : transport === 'walk' ? 75 : 250;
  return candidates.slice(0, -1).map((candidate, index) => {
    const next = candidates[index + 1];
    const distance = next ? haversine(candidate.place, next.place) : 0;
    return {
      mode: transport,
      minutes: Math.max(1, Math.round(distance / metresPerMinute)),
      distanceMeters: null,
    } satisfies TravelPlanLeg;
  });
}

function buildFacts(
  selected: PlannerCandidate[],
  days: TravelPlanDraftDay[],
  routed: boolean,
  checkedAt: string,
): TravelPlanFact[] {
  const facts: TravelPlanFact[] = selected.map((candidate) => ({
    kind: 'place',
    provider: candidate.place.provider,
    checkedAt,
    detail: truncate(`${candidate.place.name}${candidate.address ? `（${candidate.address}）` : ''}`, 500),
  }));

  if (!routed) return facts;

  for (const day of days) {
    const dayLegs = day.items
      .map((item) => item.travelFromPrevious)
      .filter((leg): leg is TravelPlanLeg => leg !== null);
    if (dayLegs.length === 0) continue;
    const minutes = dayLegs.reduce((total, leg) => total + leg.minutes, 0);
    facts.push({
      kind: 'route',
      provider: 'routing-relay',
      checkedAt,
      detail: truncate(`${day.date}：${day.items.length} 个地点，${dayLegs.length} 段交通，约 ${minutes} 分钟。`, 500),
    });
  }
  return facts;
}

function buildSummary(places: number, days: number, routed: boolean): string {
  return [
    `已按你的需求检索到 ${places} 个真实地点，分布在 ${days} 天。`,
    routed ? '地点之间的交通时间来自路线服务。' : '路线服务不可用，交通时间为直线估算。',
    '门票与消费价格尚未接入，预算不包含这些费用。',
  ].join('');
}

function emptyOutcome(checkedAt: string, summary: string, warnings: TravelPlanWarning[]): PlannerOutcome {
  return {
    draft: {
      summary,
      factsCheckedAt: checkedAt,
      days: [],
      estimatedBudgetCny: emptyBudget(),
      warnings: [],
    },
    facts: [],
    warnings,
  };
}

function emptyBudget(): TravelPlanBudget {
  return { min: 0, max: 0, breakdown: {} };
}

function clock(minutes: number): string {
  const capped = Math.min(minutes, 23 * 60 + 59);
  return `${String(Math.floor(capped / 60)).padStart(2, '0')}:${String(capped % 60).padStart(2, '0')}`;
}

/** Great-circle metres; squared sums only, no need for the exact radius. */
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
