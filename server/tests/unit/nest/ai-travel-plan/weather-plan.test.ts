/**
 * Weather only edits the order inside a day and raises a warning; it never
 * invents a stop, drops one, or rejects the draft.
 */
import type { PlannerCandidate } from '../../../../src/nest/ai-travel-plan/planner-provider';
import {
  classifyPlaceEnvironment,
  outdoorStopsAtRisk,
  reorderCandidatesForWeather,
  toDayWeather,
  weatherRisk,
} from '../../../../src/nest/ai-travel-plan/weather-plan';
import type { TravelPlanDayWeather, TravelPlanDraftDay, WeatherResult } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const CHECKED_AT = '2026-05-01T00:00:00.000Z';

function weather(overrides: Partial<TravelPlanDayWeather> = {}): TravelPlanDayWeather {
  return {
    provider: 'open-meteo',
    kind: 'rain',
    tempMin: 16,
    tempMax: 21,
    description: '小雨',
    type: 'forecast',
    checkedAt: CHECKED_AT,
    ...overrides,
  };
}

function candidate(name: string, category: string | null): PlannerCandidate {
  return {
    place: {
      provider: 'amap',
      providerId: name,
      name,
      lat: 30.25,
      lng: 120.16,
      category,
      address: null,
      rating: null,
      hours: [],
      coordinateSystem: 'wgs84',
    },
    source: { provider: 'amap', sourceId: name, checkedAt: CHECKED_AT, freshness: 'live' },
    address: null,
    category,
    hours: [],
    rating: null,
  };
}

function draftDay(
  date: string,
  names: Array<[string, string | null]>,
  dayWeather?: TravelPlanDayWeather,
): TravelPlanDraftDay {
  return {
    date,
    weather: dayWeather,
    items: names.map(([name, category]) => {
      const entry = candidate(name, category);
      return {
        place: entry.place,
        arriveAt: '09:00',
        leaveAt: '10:00',
        activity: null,
        travelFromPrevious: null,
        estimatedCostCny: null,
        source: entry.source,
      };
    }),
  };
}

describe('classifyPlaceEnvironment', () => {
  it('reads the provider category before the name', () => {
    expect(classifyPlaceEnvironment('科教文化服务;博物馆', '西湖')).toBe('indoor');
    expect(classifyPlaceEnvironment('风景名胜;公园广场', '室内乐园')).toBe('outdoor');
  });

  it('falls back to name keywords when the category is missing', () => {
    expect(classifyPlaceEnvironment(null, '浙江省博物馆')).toBe('indoor');
    expect(classifyPlaceEnvironment(null, '西湖')).toBe('outdoor');
  });

  it('stays unknown for a place with no usable signal', () => {
    expect(classifyPlaceEnvironment(null, '海底捞火锅')).toBe('unknown');
  });
});

describe('toDayWeather', () => {
  it('keeps the provider temperature range and marks a forecast', () => {
    const result: WeatherResult = {
      temp: 20,
      temp_min: 16,
      temp_max: 24,
      main: 'Rain',
      description: '小雨',
      type: 'forecast',
    };

    expect(toDayWeather(result, CHECKED_AT)).toEqual({
      provider: 'open-meteo',
      kind: 'rain',
      tempMin: 16,
      tempMax: 24,
      description: '小雨',
      type: 'forecast',
      checkedAt: CHECKED_AT,
    });
  });

  it('falls back to the single temperature and marks climate beyond the forecast window', () => {
    const result: WeatherResult = { temp: 28, main: 'Clear', description: '晴', type: 'climate' };

    const shaped = toDayWeather(result, CHECKED_AT);

    expect(shaped.tempMin).toBe(28);
    expect(shaped.tempMax).toBe(28);
    expect(shaped.kind).toBe('clear');
    expect(shaped.type).toBe('climate');
  });
});

describe('weatherRisk', () => {
  it('ignores a missing day and a climate reference', () => {
    expect(weatherRisk(null)).toBe('none');
    expect(weatherRisk(weather({ kind: 'storm', type: 'climate' }))).toBe('none');
  });

  it('raises caution for rain and snow, and severe for a storm', () => {
    expect(weatherRisk(weather({ kind: 'rain' }))).toBe('caution');
    expect(weatherRisk(weather({ kind: 'snow' }))).toBe('caution');
    expect(weatherRisk(weather({ kind: 'storm' }))).toBe('severe');
  });

  it('promotes any description that says 暴 or heavy, whatever the kind', () => {
    expect(weatherRisk(weather({ kind: 'clouds', description: '暴雨' }))).toBe('severe');
    expect(weatherRisk(weather({ kind: 'clouds', description: 'heavy rain' }))).toBe('severe');
  });

  it('raises caution for extreme heat and cold', () => {
    expect(weatherRisk(weather({ kind: 'clear', tempMax: 36 }))).toBe('caution');
    expect(weatherRisk(weather({ kind: 'clear', tempMin: -9 }))).toBe('caution');
    expect(weatherRisk(weather({ kind: 'clear', tempMin: 5, tempMax: 30 }))).toBe('none');
  });
});

describe('reorderCandidatesForWeather', () => {
  it('puts indoor stops first on a rainy day, keeping the day count and stability', () => {
    const selected = [
      candidate('西溪湿地', '风景名胜'),
      candidate('浙江省博物馆', '科教文化服务'),
      candidate('河坊街', null),
      candidate('中国丝绸博物馆', '科教文化服务'),
    ];
    const dates = ['2026-05-01'];
    const byDate = new Map([['2026-05-01', weather()]]);

    const reordered = reorderCandidatesForWeather(selected, dates, byDate);

    expect(reordered).toHaveLength(selected.length);
    expect(reordered.map((entry) => entry.place.name)).toEqual([
      '浙江省博物馆',
      '中国丝绸博物馆',
      '河坊街',
      '西溪湿地',
    ]);
  });

  it('leaves every bucket untouched without weather', () => {
    const selected = [candidate('西溪湿地', '风景名胜'), candidate('浙江省博物馆', '科教文化服务')];

    expect(reorderCandidatesForWeather(selected, ['2026-05-01'], new Map())).toEqual(selected);
  });

  it('does not reorder on a climate reference', () => {
    const selected = [candidate('西溪湿地', '风景名胜'), candidate('浙江省博物馆', '科教文化服务')];
    const byDate = new Map<string, TravelPlanDayWeather>([['2026-05-01', weather({ type: 'climate' })]]);

    expect(reorderCandidatesForWeather(selected, ['2026-05-01'], byDate)).toEqual(selected);
  });

  it('uses the same spread rule as scheduling, so only a day with rain is reordered', () => {
    const selected = [
      candidate('西溪湿地', '风景名胜'),
      candidate('浙江省博物馆', '科教文化服务'),
      candidate('千岛湖', '风景名胜'),
      candidate('中国丝绸博物馆', '科教文化服务'),
    ];
    const dates = ['2026-05-01', '2026-05-02'];
    const byDate = new Map<string, TravelPlanDayWeather>([['2026-05-02', weather()]]);

    const reordered = reorderCandidatesForWeather(selected, dates, byDate);

    expect(reordered.map((entry) => entry.place.name)).toEqual([
      '西溪湿地',
      '浙江省博物馆',
      '中国丝绸博物馆',
      '千岛湖',
    ]);
  });
});

describe('outdoorStopsAtRisk', () => {
  it('lists the outdoor stops still scheduled on a risky day', () => {
    const days = [
      draftDay('2026-05-01', [['浙江省博物馆', '科教文化服务']], weather()),
      draftDay(
        '2026-05-02',
        [
          ['西湖', '风景名胜'],
          ['河坊街', null],
        ],
        weather(),
      ),
    ];

    expect(outdoorStopsAtRisk(days)).toEqual([{ date: '2026-05-02', risk: 'caution', names: ['西湖'] }]);
  });

  it('says nothing for an indoor-only day, a clear day or a climate reference', () => {
    const days = [
      draftDay('2026-05-01', [['浙江省博物馆', '科教文化服务']], weather()),
      draftDay('2026-05-02', [['西湖', '风景名胜']], weather({ kind: 'clear' })),
      draftDay('2026-05-03', [['西溪湿地', '风景名胜']], weather({ type: 'climate' })),
    ];

    expect(outdoorStopsAtRisk(days)).toEqual([]);
  });
});
