import type { PlannerCandidate } from './planner-provider';
import type { TravelPlanDayWeather, TravelPlanDraftDay, WeatherResult } from '@trek/shared';

export type PlaceEnvironment = 'indoor' | 'outdoor' | 'unknown';
export type WeatherRisk = 'none' | 'caution' | 'severe';

const INDOOR_CATEGORIES = [
  '科教文化服务',
  '博物馆',
  '展览馆',
  '美术馆',
  '科技馆',
  '图书馆',
  '水族馆',
  '海洋馆',
  '影剧院',
  '购物服务',
  '商场',
];
const OUTDOOR_CATEGORIES = ['风景名胜', '公园广场', '自然地物', '体育休闲服务', '体育场'];
const INDOOR_NAMES = [
  '博物馆',
  '美术馆',
  '展览馆',
  '科技馆',
  '纪念馆',
  '图书馆',
  '水族馆',
  '海洋馆',
  '剧院',
  '购物中心',
  '室内',
  '溶洞',
];
const OUTDOOR_NAMES = [
  '公园',
  '广场',
  '山',
  '湖',
  '岛',
  '海滩',
  '沙滩',
  '植物园',
  '动物园',
  '古镇',
  '老街',
  '步行街',
  '乐园',
  '欢乐谷',
  '景区',
  '湿地',
  '峡谷',
];

/** Whether a stop can shelter a traveller from rain or heat. */
export function classifyPlaceEnvironment(category: string | null, name: string): PlaceEnvironment {
  const cat = (category ?? '').toLowerCase();
  if (INDOOR_CATEGORIES.some((token) => cat.includes(token))) return 'indoor';
  if (OUTDOOR_CATEGORIES.some((token) => cat.includes(token))) return 'outdoor';
  if (INDOOR_NAMES.some((token) => name.includes(token))) return 'indoor';
  if (OUTDOOR_NAMES.some((token) => name.includes(token))) return 'outdoor';
  return 'unknown';
}

function kindOf(main: string, description: string): TravelPlanDayWeather['kind'] {
  const text = `${main} ${description}`.toLowerCase();
  if (/thunder|storm|雷/.test(text)) return 'storm';
  if (/snow|sleet|雪/.test(text)) return 'snow';
  if (/rain|drizzle|shower|雨/.test(text)) return 'rain';
  if (/fog|mist|haze|雾|霾/.test(text)) return 'fog';
  if (/cloud|overcast|阴|云/.test(text)) return 'clouds';
  if (/clear|sun|晴/.test(text)) return 'clear';
  return 'other';
}

/** Shape a provider result into the draft's day weather. */
export function toDayWeather(result: WeatherResult, checkedAt: string): TravelPlanDayWeather {
  const main = String(result.main ?? '');
  const description = result.description ?? null;
  return {
    provider: 'open-meteo',
    kind: kindOf(main, description ?? ''),
    tempMin: result.temp_min ?? result.temp ?? null,
    tempMax: result.temp_max ?? result.temp ?? null,
    description,
    type: result.type === 'climate' ? 'climate' : 'forecast',
    checkedAt,
  };
}

/**
 * How much weather should change the plan. `climate` is a seasonal reference
 * outside the forecast window, so it never reorders or raises a warning.
 */
export function weatherRisk(weather: TravelPlanDayWeather | null | undefined): WeatherRisk {
  if (!weather || weather.type === 'climate') return 'none';
  const text = `${weather.description ?? ''}`.toLowerCase();
  if (weather.kind === 'storm' || /暴|heavy/.test(text)) return 'severe';
  if (weather.kind === 'rain' || weather.kind === 'snow') return 'caution';
  if ((weather.tempMax ?? 0) >= 35 || (weather.tempMin ?? 0) <= -8) return 'caution';
  return 'none';
}

function prefersIndoor(weather: TravelPlanDayWeather | null): boolean {
  if (!weather || weather.type === 'climate') return false;
  if (weather.kind === 'rain' || weather.kind === 'snow' || weather.kind === 'storm') return true;
  return (weather.tempMax ?? 0) >= 35;
}

/**
 * Stable-reorder each day's candidates so a rainy or very hot day gets indoor
 * stops first. The bucket boundaries match `scheduleDays`' own spread rule, so
 * the number of stops per day does not change; only their order does.
 */
export function reorderCandidatesForWeather(
  selected: PlannerCandidate[],
  dates: string[],
  weatherByDate: ReadonlyMap<string, TravelPlanDayWeather | null>,
): PlannerCandidate[] {
  if (selected.length === 0 || dates.length === 0) return selected;

  const spread = selected.length >= dates.length;
  const dayOf = (index: number) =>
    spread ? Math.min(dates.length - 1, Math.floor((index * dates.length) / selected.length)) : 0;

  const buckets = new Map<number, PlannerCandidate[]>();
  selected.forEach((candidate, index) => {
    const bucket = dayOf(index);
    const list = buckets.get(bucket) ?? [];
    list.push(candidate);
    buckets.set(bucket, list);
  });

  const reordered: PlannerCandidate[] = [];
  for (let day = 0; day < dates.length; day += 1) {
    const bucket = buckets.get(day);
    if (!bucket || bucket.length === 0) continue;
    const weather = weatherByDate.get(dates[day] ?? '') ?? null;
    if (!prefersIndoor(weather)) {
      reordered.push(...bucket);
      continue;
    }
    const score = (candidate: PlannerCandidate): number => {
      const environment = classifyPlaceEnvironment(candidate.category, candidate.place.name);
      return environment === 'indoor' ? 0 : environment === 'unknown' ? 1 : 2;
    };
    reordered.push(
      ...bucket
        .map((candidate, index) => ({ candidate, index }))
        .sort((a, b) => score(a.candidate) - score(b.candidate) || a.index - b.index)
        .map((entry) => entry.candidate),
    );
  }
  return reordered;
}

/** Outdoor stops that remain on a day with meaningful weather risk. */
export function outdoorStopsAtRisk(
  days: TravelPlanDraftDay[],
): Array<{ date: string; risk: WeatherRisk; names: string[] }> {
  const result: Array<{ date: string; risk: WeatherRisk; names: string[] }> = [];
  for (const day of days) {
    const risk = weatherRisk(day.weather);
    if (risk === 'none') continue;
    const names = day.items
      .filter((item) => classifyPlaceEnvironment(item.place.category, item.place.name) === 'outdoor')
      .map((item) => item.place.name);
    if (names.length > 0) result.push({ date: day.date, risk, names });
  }
  return result;
}
