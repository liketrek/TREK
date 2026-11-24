import { dbNow } from '../../db/types';
import { WeatherService } from '../weather/weather.service';
import { estimateBudget } from './budget-estimator';
import { cityTierOf } from './destination-catalog';
import { recommendLodging } from './lodging-recommender';
import { ADMIN_CATEGORIES, PlannerProvider, routeTransport, type PlannerCandidate } from './planner-provider';
import {
  classifyPlaceEnvironment,
  outdoorStopsAtRisk,
  prefersIndoor,
  reorderCandidatesForWeather,
  toDayWeather,
} from './weather-plan';
import { Injectable } from '@nestjs/common';
import type {
  TravelPlanBudget,
  TravelPlanCreateRequest,
  TravelPlanDayWeather,
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

/**
 * How many place searches may be in flight at once.
 *
 * Amap's key is capped at a few concurrent queries per second, and the first
 * plan after a restart used to fire all five at once: the burst tripped the
 * cap (10021) and sometimes the whole overseas bucket (10045), and a plan of
 * zero stops was the result even with retries. Two at a time stays under the
 * cap while still finishing the five searches in a couple of seconds.
 */
const PLACE_SEARCH_CONCURRENCY = 2;

/**
 * Keywords that surface indoor stops on a rainy or very hot trip. They compete
 * for the same five-search budget: the point is to have museums, malls and
 * exhibition halls in the pool before selection trims it, not to add a sixth
 * search to a key that is already rate-limited.
 */
const INDOOR_QUERY_KEYWORDS = ['商场', '展览馆'];

/** Indoor stops each rainy or very hot day is guaranteed, when the pool has them. */
const INDOOR_STOPS_PER_DAY = 2;

/** Never schedule more places than this, whatever the pace. */
const MAX_PLACES = 24;

/** A stop must be near the resolved centre; a same-named venue abroad is not a candidate. */
const MAX_PLACE_DISTANCE_M = 80_000;

/**
 * How much farther a better-rated stop may be: a five-star place can be about
 * 15% farther than an unrated one and still win. Ratings stay a tie-breaker on
 * top of distance, never a reason to abandon a compact route.
 */
const RATING_DISTANCE_WEIGHT = 0.03;

/**
 * Provider categories that are infrastructure, never a place to visit. Amap
 * answers a bare city-name search with the city's own offices, schools and
 * hospitals, and a plan of those is not a trip.
 */
const NON_VISIT_CATEGORY_PREFIXES = [
  '政府机构及社会团体',
  '医疗保健服务',
  '金融保险服务',
  '交通设施服务',
  '汽车服务',
  '公司企业',
  '科教文化服务;学校',
];

const NON_VISIT_CATEGORIES = new Set(['government', 'hospital', 'school', 'bank', 'pharmacy', 'parking', 'office']);

function isVisitCategory(category: string | null): boolean {
  const value = (category ?? '').trim().toLowerCase();
  if (value === '') return true;
  return !NON_VISIT_CATEGORY_PREFIXES.some((prefix) => value.startsWith(prefix)) && !NON_VISIT_CATEGORIES.has(value);
}

/**
 * Amap keeps shut and unfinished venues in its index and puts the state in the
 * name. A draft must not send someone to a construction site or a closed park.
 */
const UNAVAILABLE_NAME_MARKERS = ['暂停营业', '停止营业', '已关闭', '建设中', '在建', '装修中', '暂未开放', '暂停开放'];

function isAvailableForVisit(name: string): boolean {
  return !UNAVAILABLE_NAME_MARKERS.some((marker) => name.includes(marker));
}

/**
 * What a sight keyword means as a provider category. Amap matches keywords
 * against POI names, so "公园" also returns shops on 公园路 — a park query must
 * not drag those in as stops. Unknown free-text interests keep every visitable
 * category and let the keyword search decide.
 */
const INTEREST_CATEGORY_PREFIXES: Record<string, string[]> = {
  景点: ['风景名胜', '科教文化服务', '体育休闲服务', 'attraction', 'tourism', 'viewpoint'],
  博物馆: ['科教文化服务', 'museum'],
  公园: ['风景名胜', '体育休闲服务', 'park', 'garden'],
  美食: ['餐饮服务', 'restaurant', 'cafe', 'food'],
  购物: ['购物服务', 'shop', 'mall'],
  商场: ['购物服务', 'shop', 'mall'],
  展览馆: ['科教文化服务', 'museum', '展览馆'],
};

function matchesInterest(category: string | null, interest: string): boolean {
  const allowed = INTEREST_CATEGORY_PREFIXES[interest];
  const value = (category ?? '').trim().toLowerCase();
  if (allowed === undefined || value === '') return true;
  return allowed.some((prefix) => value.startsWith(prefix.toLowerCase()));
}

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
  constructor(
    private readonly provider: PlannerProvider,
    private readonly weather: WeatherService,
  ) {}

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

    const weatherPromise = Promise.all(
      dates.map(async (date): Promise<[string, TravelPlanDayWeather | null]> => {
        try {
          const result = await this.weather.get(String(centre.lat), String(centre.lng), date, 'zh');
          return [date, toDayWeather(result, checkedAt)];
        } catch {
          return [date, null];
        }
      }),
    );

    // The forecast now decides what to search for, not just the order of what
    // was found: waiting for it here is what lets a rainy trip ask for indoor
    // stops at all. It is one short call, and it used to run concurrently with
    // searches that could not use its answer.
    onStage?.('weather');
    const weatherByDate = new Map<string, TravelPlanDayWeather | null>(await weatherPromise);
    const missingWeather = [...weatherByDate.values()].filter((weather) => weather === null).length;
    if (missingWeather > 0) {
      warnings.push({
        code: 'weather_unavailable',
        message: `有 ${missingWeather} 天的天气暂时没有取到，排程未考虑天气。`,
        severity: 'info',
      });
    }
    const indoorNeeded = dates.some((date) => prefersIndoor(weatherByDate.get(date) ?? null));

    onStage?.('places');
    const queries = buildQueries(request, input.extraQueries ?? [], indoorNeeded);
    const results = await searchQueries(this.provider, userId, centre, queries);
    const candidates = results.flatMap((result) => result.candidates ?? []);
    for (const result of results) {
      if (result.warning) warnings.push(result.warning);
    }
    // Keep the draft in one city: drop administrative areas (a "city" record is
    // not a stop), civic infrastructure and same-named venues that geocoded
    // somewhere else entirely.
    const nearby = candidates.filter(
      (candidate) =>
        !ADMIN_CATEGORIES.has((candidate.category ?? '').toLowerCase()) &&
        isVisitCategory(candidate.category) &&
        isAvailableForVisit(candidate.place.name) &&
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
    const selected = selectItinerary(ordered, cap, dates, weatherByDate, indoorNeeded);
    if (ordered.length > selected.length) {
      warnings.push({
        code: 'places_skipped',
        message: `检索到 ${ordered.length} 个地点，按行程天数只安排了前 ${selected.length} 个。`,
        severity: 'info',
      });
    }

    const scheduled = reorderCandidatesForWeather(selected, dates, weatherByDate);
    const lodgingPromise = recommendLodging({
      provider: this.provider,
      userId,
      destination: request.destination,
      centre,
      anchors: selected,
    });

    const transport = routeTransport(request.transport);
    onStage?.('routing');
    const routed = await this.provider.route(
      userId,
      scheduled.map((candidate) => ({ lat: candidate.place.lat, lng: candidate.place.lng })),
      transport === 'walk' ? 'walk' : transport === 'drive' ? 'drive' : 'other',
    );
    let legs: TravelPlanLeg[];
    if (routed.ok) {
      legs = routed.legs;
    } else {
      legs = estimatedLegs(scheduled, transport);
      warnings.push({
        code: 'route_unavailable',
        message: '路线服务暂时不可用，地点之间的交通时间按直线距离估算，请以实际路况为准。',
        severity: 'warning',
      });
    }

    onStage?.('scheduling');
    const { days, skipped, closed, late } = scheduleDays(scheduled, legs, dates, request.pace);
    for (const day of days) day.weather = weatherByDate.get(day.date) ?? null;
    for (const risk of outdoorStopsAtRisk(days)) {
      warnings.push({
        code: 'weather_outdoor_risk',
        message: `${risk.date} 天气可能影响户外地点（${risk.names.slice(0, 3).join('、')}${risk.names.length > 3 ? ' 等' : ''}），已尽量优先安排室内地点，请备好雨具或调整顺序。`,
        severity: 'warning',
      });
    }
    if (skipped > 0) {
      warnings.push({
        code: 'places_skipped',
        message: `当天时间不够，${skipped} 个地点没有排进行程。`,
        severity: 'info',
      });
    }
    if (closed.length > 0) {
      const first = closed[0];
      warnings.push({
        code: 'place_closed',
        message: `有 ${closed.length} 个地点在计划日期闭馆，已跳过（如「${first?.name ?? ''}」${first?.date ?? ''}）。`,
        severity: 'warning',
      });
    }
    if (late.length > 0) {
      const first = late[0];
      warnings.push({
        code: 'place_outside_hours',
        message: `有 ${late.length} 个地点在计划日期已过营业时间，未能排入（如「${first?.name ?? ''}」${first?.date ?? ''}）。`,
        severity: 'warning',
      });
    }
    const emptyDays = days.filter((day) => day.items.length === 0).length;
    if (emptyDays > 0) {
      warnings.push({
        code: 'day_underfilled',
        message: `有 ${emptyDays} 天没有排入地点，可以增加兴趣关键词或缩短行程天数后重试。`,
        severity: 'warning',
      });
    }

    const lodging = await lodgingPromise;
    if (lodging.warning) warnings.push(lodging.warning);

    const facts = buildFacts(scheduled, days, routed.ok, checkedAt);
    const summary = buildSummary(selected.length, days.length, routed.ok);

    onStage?.('validating');
    return {
      draft: {
        summary,
        factsCheckedAt: checkedAt,
        days,
        estimatedBudgetCny: estimateBudget(request, dates, cityTierOf(request.destination)),
        lodgingAreas: lodging.areas,
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

interface PlaceQuery {
  query: string;
  interest: string;
}

/** One query's answer: candidates, or the warning that explains its absence. */
interface PlaceSearchOutcome {
  candidates?: PlannerCandidate[];
  warning?: TravelPlanWarning;
}

/**
 * Run the plan's place searches with a small concurrency cap.
 *
 * The cap exists for the provider's sake, not ours: a fresh plan used to fire
 * all five searches at once, and the burst is what a QPS-limited key refuses.
 * The workers pull from a shared queue (the index increment happens before the
 * first await, so two workers never claim the same query) and recurse for the
 * next one; results keep the query order the caller asked for.
 */
async function searchQueries(
  provider: PlannerProvider,
  userId: number,
  centre: { lat: number; lng: number },
  queries: PlaceQuery[],
): Promise<PlaceSearchOutcome[]> {
  const results: PlaceSearchOutcome[] = [];
  let next = 0;

  const worker = async (): Promise<void> => {
    const index = next++;
    const entry = queries[index];
    if (!entry) return;
    try {
      const places = await provider.search(userId, entry.query, centre);
      results[index] = {
        candidates: places.filter((candidate) => matchesInterest(candidate.category, entry.interest)),
      };
    } catch {
      results[index] = {
        warning: {
          code: 'place_search_failed',
          message: `地点检索「${entry.query}」暂时失败，结果可能不完整。`,
          severity: 'warning',
        },
      };
    }
    if (next < queries.length) await worker();
  };

  await Promise.all(Array.from({ length: Math.min(PLACE_SEARCH_CONCURRENCY, queries.length) }, () => worker()));
  return results;
}

const DEFAULT_INTERESTS = ['景点', '公园', '博物馆'];

function buildQueries(request: TravelPlanCreateRequest, extra: string[], indoor = false): PlaceQuery[] {
  const destination = request.destination ?? '';
  // A single explicit interest ("景点") is one search and a thin pool; pair it
  // with the discovery defaults so a small city still yields a full itinerary.
  // Explicit interests keep their slots, defaults only fill the remainder.
  const interests = [...new Set([...request.interests, ...DEFAULT_INTERESTS])];
  // The city name alone is never a query: Amap matches it against POI names and
  // fills the pool with the city's own offices, schools and hospitals. Every
  // query pairs the city with a keyword; extra revision keywords take the slots.
  const keywords = [...new Set([...interests, ...extra])];
  // A rainy or hot trip trades its last interest slot for two shelter queries:
  // the pool has to contain indoor stops before selection, or no amount of
  // reordering can put one on the day.
  const chosen = indoor
    ? [...keywords.slice(0, MAX_QUERIES - INDOOR_QUERY_KEYWORDS.length), ...INDOOR_QUERY_KEYWORDS]
    : keywords.slice(0, MAX_QUERIES);
  const queries = chosen
    .map((keyword) => ({
      interest: keyword,
      query: `${destination} ${keyword}`.replace(/\s+/g, ' ').trim().slice(0, QUERY_MAX),
    }))
    .filter((entry) => entry.query !== '');

  return dedupeQueries(queries).slice(0, MAX_QUERIES);
}

function dedupeQueries(queries: PlaceQuery[]): PlaceQuery[] {
  const seen = new Set<string>();
  return queries.filter((entry) => {
    if (seen.has(entry.query)) return false;
    seen.add(entry.query);
    return true;
  });
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

/** A provider rating we can trust, or null when the record has none. */
function ratingOf(candidate: PlannerCandidate): number | null {
  const rating = candidate.rating ?? candidate.place.rating ?? null;
  return typeof rating === 'number' && rating > 0 && rating <= 5 ? rating : null;
}

/** Distance adjusted so a well-rated stop may be slightly farther and still win. */
function weightedDistance(from: { lat: number; lng: number }, candidate: PlannerCandidate): number {
  const distance = haversine(from, candidate.place);
  const rating = ratingOf(candidate);
  return rating === null ? distance : distance / (1 + rating * RATING_DISTANCE_WEIGHT);
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
      const distance = weightedDistance(current, remaining[index] as PlannerCandidate);
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

/**
 * Cut the capped itinerary out of the ordered pool.
 *
 * Without weather pressure this is simply the first `cap` stops. When a day
 * needs shelter, that day's slice reserves room for indoor stops first, pulled
 * from the nearest indoor places the pool still holds. Reordering alone could
 * not do this: a rainy day whose four nearest stops were parks stayed a day of
 * parks even when the pool held five museums. The day buckets mirror
 * `scheduleDays`' own spread rule, so a stop taken for a day is a stop that day
 * actually keeps.
 */
function selectItinerary(
  ordered: PlannerCandidate[],
  cap: number,
  dates: string[],
  weatherByDate: ReadonlyMap<string, TravelPlanDayWeather | null>,
  indoorNeeded: boolean,
): PlannerCandidate[] {
  const limit = Math.min(cap, ordered.length);
  if (!indoorNeeded || dates.length <= 1) return ordered.slice(0, limit);

  const quota = dates.map(() => 0);
  for (let index = 0; index < limit; index += 1) {
    const day = Math.min(dates.length - 1, Math.floor((index * dates.length) / limit));
    quota[day] = (quota[day] ?? 0) + 1;
  }

  const pool = [...ordered];
  const selected: PlannerCandidate[] = [];
  for (let day = 0; day < dates.length; day += 1) {
    const size = quota[day] ?? 0;
    if (size === 0) continue;
    const wantsIndoor = prefersIndoor(weatherByDate.get(dates[day] ?? '') ?? null)
      ? Math.min(INDOOR_STOPS_PER_DAY, size)
      : 0;
    let taken = 0;
    if (wantsIndoor > 0) {
      for (let index = 0; index < pool.length && taken < wantsIndoor;) {
        const candidate = pool[index] as PlannerCandidate;
        if (classifyPlaceEnvironment(candidate.category, candidate.place.name) === 'indoor') {
          selected.push(candidate);
          pool.splice(index, 1);
          taken += 1;
        } else {
          index += 1;
        }
      }
    }
    while (taken < size && pool.length > 0) {
      selected.push(pool.shift() as PlannerCandidate);
      taken += 1;
    }
  }
  return selected;
}

/** One provider opening-hours segment, already attributed to weekdays. */
interface OpeningRule {
  /** Weekday indexes (0 = Sunday); null means the segment applies every day. */
  days: number[] | null;
  kind: 'open' | 'closed' | 'unknown';
  open: number;
  close: number;
}

/** The opening windows a place has on a given date. */
type OpeningState =
  { kind: 'unknown' } | { kind: 'closed' } | { kind: 'open'; windows: Array<{ open: number; close: number }> };

const WEEKDAY_TOKENS: Record<string, number> = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };

/** Longest first so "Thursday" wins over "th" and "Sun" over "su". */
const ENGLISH_WEEKDAYS: Record<string, number> = {
  monday: 1,
  mon: 1,
  mo: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  tu: 2,
  wednesday: 3,
  wed: 3,
  we: 3,
  thursday: 4,
  thurs: 4,
  thur: 4,
  thu: 4,
  th: 4,
  friday: 5,
  fri: 5,
  fr: 5,
  saturday: 6,
  sat: 6,
  sa: 6,
  sunday: 0,
  sun: 0,
  su: 0,
};

const ENGLISH_WEEKDAY_WORD =
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues|tue|thurs|thur|thu|wed|fri|sat|sun|mo|tu|we|th|fr|sa|su)\b/gi;

const TIME_RANGE = /(\d{1,2}):(\d{2})\s*(?:-|–|—|~|至|到)\s*(\d{1,2}):(\d{2})/g;

/** Minutes since midnight; 24:00 is allowed as a closing time. */
function minuteOf(hour: string, minute: string): number | null {
  const hours = Number(hour);
  const minutes = Number(minute);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes > 59) return null;
  if (hours > 24 || (hours === 24 && minutes !== 0)) return null;
  return hours * 60 + minutes;
}

/** The weekday a YYYY-MM-DD date falls on, in UTC to match planDates(). */
function weekdayOf(date: string): number | null {
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(value) ? new Date(value).getUTCDay() : null;
}

/** The weekdays a segment names, or null when it names none (every day). */
function dayScope(segment: string): number[] | null {
  if (/工作日/.test(segment)) return [1, 2, 3, 4, 5];
  if (/周末/.test(segment)) return [0, 6];
  if (/每天|每日/.test(segment)) return null;
  const tokens = [...segment.matchAll(/(?:周|星期)([一二三四五六日天])/g)];
  if (tokens.length > 0) {
    const range = /(?:周|星期)[一二三四五六日天]\s*(?:至|-|–|—|~|到)\s*(?:周|星期)[一二三四五六日天]/.test(segment);
    if (range && tokens.length >= 2) {
      const start = WEEKDAY_TOKENS[tokens[0]?.[1] ?? ''];
      const end = WEEKDAY_TOKENS[tokens[tokens.length - 1]?.[1] ?? ''];
      if (start === undefined || end === undefined) return null;
      const days: number[] = [];
      for (let day = start; ; day = (day + 1) % 7) {
        days.push(day);
        if (day === end) break;
      }
      return days;
    }
    return tokens.map((token) => WEEKDAY_TOKENS[token[1] ?? '']).filter((day): day is number => day !== undefined);
  }
  // Providers normalise hours to the OSM dialect ("Monday: 08:00-18:00",
  // "Mo-Fr 09:00-18:00", "Sunday: ?"), so English names must be read too.
  const words = [...segment.matchAll(ENGLISH_WEEKDAY_WORD)].map((match) => match[0].toLowerCase());
  if (words.length === 0) return null;
  const range = segment.toLowerCase().match(/([a-z]+)\s*-\s*([a-z]+)/);
  const start = range ? ENGLISH_WEEKDAYS[range[1] ?? ''] : undefined;
  const end = range ? ENGLISH_WEEKDAYS[range[2] ?? ''] : undefined;
  if (start !== undefined && end !== undefined) {
    const days: number[] = [];
    for (let day = start; ; day = (day + 1) % 7) {
      days.push(day);
      if (day === end) break;
    }
    return days;
  }
  return words.map((word) => ENGLISH_WEEKDAYS[word]).filter((day): day is number => day !== undefined);
}

/** Turn provider hours text into rules. Unparseable text produces no rules. */
function parseOpeningRules(hours: string[]): OpeningRule[] {
  const rules: OpeningRule[] = [];
  for (const text of hours) {
    for (const part of text.split(/[;；]/)) {
      const segment = part.trim();
      if (segment === '') continue;
      const days = dayScope(segment);
      const ranges = [...segment.matchAll(TIME_RANGE)];
      let open = Number.POSITIVE_INFINITY;
      let close = Number.NEGATIVE_INFINITY;
      for (const range of ranges) {
        const from = minuteOf(range[1] ?? '', range[2] ?? '');
        const to = minuteOf(range[3] ?? '', range[4] ?? '');
        if (from === null || to === null || to <= from) continue;
        open = Math.min(open, from);
        close = Math.max(close, to);
      }
      if (Number.isFinite(open) && Number.isFinite(close)) {
        rules.push({ days, kind: 'open', open, close });
        continue;
      }
      if (/24\s*\/\s*7|全天|24\s*小时/.test(segment)) {
        rules.push({ days, kind: 'open', open: 0, close: 24 * 60 });
        continue;
      }
      // "Monday: ?" is unknown, not closed: skipping it would drop a valid stop.
      if (/[?？]/.test(segment)) {
        rules.push({ days, kind: 'unknown', open: 0, close: 0 });
        continue;
      }
      if (/closed|闭馆|闭园|不开放|停止营业|休息/i.test(segment)) {
        rules.push({ days, kind: 'closed', open: 0, close: 0 });
      }
    }
  }
  return rules;
}

/**
 * What a place's hours mean on one date. Unknown text never penalises a place:
 * the planner only skips a stop when the provider actually said it is closed.
 */
function openingOn(hours: string[] | undefined, date: string): OpeningState {
  if (!hours || hours.length === 0) return { kind: 'unknown' };
  const rules = parseOpeningRules(hours);
  if (rules.length === 0) return { kind: 'unknown' };
  const weekday = weekdayOf(date);
  if (weekday === null) return { kind: 'unknown' };
  const matching = rules.filter((rule) => rule.days === null || rule.days.includes(weekday));
  if (matching.length === 0) return { kind: 'unknown' };
  const windows = matching
    .filter((rule) => rule.kind === 'open')
    .map((rule) => ({ open: rule.open, close: rule.close }))
    .sort((a, b) => a.open - b.open);
  if (windows.length > 0) return { kind: 'open', windows };
  return matching.some((rule) => rule.kind === 'closed') ? { kind: 'closed' } : { kind: 'unknown' };
}

/** Where a visit can actually fit, or why it cannot be scheduled that day. */
function fitOpening(
  state: OpeningState,
  arrive: number,
  stay: number,
): { arrive: number; leave: number } | 'closed' | 'late' {
  if (state.kind === 'closed') return 'closed';
  if (state.kind === 'unknown') return { arrive, leave: arrive + stay };
  for (const window of state.windows) {
    const start = Math.max(arrive, window.open);
    if (start < window.close) return { arrive: start, leave: Math.min(start + stay, window.close) };
  }
  return 'late';
}

/** A stop dropped because the provider's hours leave no usable window that day. */
interface SkippedStop {
  name: string;
  date: string;
}

function scheduleDays(
  selected: PlannerCandidate[],
  legs: TravelPlanLeg[],
  dates: string[],
  pace: TravelPlanCreateRequest['pace'],
): { days: TravelPlanDraftDay[]; skipped: number; closed: SkippedStop[]; late: SkippedStop[] } {
  const stay = pace === 'relaxed' ? 120 : pace === 'intensive' ? 60 : 90;
  const dayEnd = pace === 'relaxed' ? 18 * 60 : pace === 'intensive' ? 20 * 60 : 19 * 60;
  const days: TravelPlanDraftDay[] = dates.map((date) => ({ date, items: [] }));
  const closed: SkippedStop[] = [];
  const late: SkippedStop[] = [];

  // More stops than days would otherwise pack the first days and leave the
  // tail empty; spread the route across the whole calendar instead. A list that
  // only just covers the calendar still gets one stop per day. A shorter list
  // cannot fill every day, and the caller warns about the days left empty.
  const spread = selected.length >= dates.length;
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
    let leg = previous >= 0 && (days[dayIndex]?.items.length ?? 0) > 0 ? (legs[previous] ?? null) : null;
    let arrive = cursor + (leg?.minutes ?? 0);
    if (arrive >= 11 * 60 + 30 && arrive < 13 * 60 + 30) arrive = 13 * 60 + 30;

    const date = dates[dayIndex] ?? '';
    let fit = fitOpening(openingOn(candidate.hours, date), arrive, stay);
    if (fit === 'closed' || fit === 'late') {
      (fit === 'closed' ? closed : late).push({ name: candidate.place.name, date });
      // The legs were routed through this stop; a later stop cannot claim the
      // leg that started here without inventing a visit.
      previous = -1;
      continue;
    }
    let arriveAt = fit.arrive;
    let leave = fit.leave;

    if (leave > dayEnd && (days[dayIndex]?.items.length ?? 0) > 0) {
      dayIndex += 1;
      if (dayIndex >= days.length) {
        skipped = selected.length - index;
        break;
      }
      leg = null;
      previous = -1;
      const nextDate = dates[dayIndex] ?? '';
      fit = fitOpening(openingOn(candidate.hours, nextDate), DAY_START_MINUTES, stay);
      if (fit === 'closed' || fit === 'late') {
        (fit === 'closed' ? closed : late).push({ name: candidate.place.name, date: nextDate });
        continue;
      }
      arriveAt = fit.arrive;
      leave = fit.leave;
    }

    const day = days[dayIndex];
    if (!day) break;
    day.items.push(itemOf(candidate, arriveAt, leave, leg));
    cursor = leave;
    previous = index;
  }

  return { days, skipped, closed, late };
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

  for (const day of days) {
    if (!day.weather) continue;
    const low = day.weather.tempMin;
    const high = day.weather.tempMax;
    const range = low !== null && high !== null ? `，${low}–${high}℃` : '';
    const reference = day.weather.type === 'climate' ? '（气候参考）' : '';
    facts.push({
      kind: 'weather',
      provider: 'open-meteo',
      checkedAt,
      detail: truncate(`${day.date}：${day.weather.description ?? '天气'}${range}${reference}。`, 500),
    });
  }

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
    '预算按规则估算，不含往返大交通与购物，实际以支付为准。',
  ].join('');
}

function emptyOutcome(checkedAt: string, summary: string, warnings: TravelPlanWarning[]): PlannerOutcome {
  return {
    draft: {
      summary,
      factsCheckedAt: checkedAt,
      days: [],
      estimatedBudgetCny: emptyBudget(),
      lodgingAreas: [],
      warnings: [],
    },
    facts: [],
    warnings,
  };
}

function emptyBudget(): TravelPlanBudget {
  return { min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] };
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
