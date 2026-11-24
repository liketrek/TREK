/**
 * PLAN-06..10 unit tests: the parser merges without inventing fields, the
 * provider normalises real records and routes, the planner schedules what it
 * got, and the validator turns gaps and overloads into stable warnings.
 */
import {
  PlannerRequestParser,
  mergeRequest,
  missingRequestFields,
} from '../../../../src/nest/ai-travel-plan/planner-prompt';
import { PlannerProvider, routeTransport } from '../../../../src/nest/ai-travel-plan/planner-provider';
import { hasBlockingWarning, validateDraft } from '../../../../src/nest/ai-travel-plan/planner-validator';
import { PlannerService } from '../../../../src/nest/ai-travel-plan/planner.service';
import { RealTravelPlanEngine } from '../../../../src/nest/ai-travel-plan/real-travel-plan.engine';
import { classifyPlaceEnvironment } from '../../../../src/nest/ai-travel-plan/weather-plan';
import {
  travelPlanCreateRequestSchema,
  travelPlanRequestSchema,
  type TravelPlanCreateRequest,
  type TravelPlanDraft,
  type TravelPlanDraftDay,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

function request(overrides: Partial<TravelPlanCreateRequest> = {}): TravelPlanCreateRequest {
  return travelPlanCreateRequestSchema.parse({
    destination: '杭州',
    startDate: '2026-05-01',
    endDate: '2026-05-02',
    ...overrides,
  });
}

function day(date: string, times: Array<[string, string]>): TravelPlanDraftDay {
  return {
    date,
    items: times.map(([arriveAt, leaveAt], index) => ({
      place: {
        provider: 'amap',
        providerId: `amap:${index}`,
        name: `地点${index}`,
        lat: 30 + index,
        lng: 120 + index,
        category: null,
        address: null,
        rating: null,
        hours: [],
        coordinateSystem: 'wgs84',
      },
      arriveAt,
      leaveAt,
      activity: '游览',
      travelFromPrevious: null,
      estimatedCostCny: null,
      source: { provider: 'amap', sourceId: `amap:${index}`, checkedAt: '2026-04-01 00:00:00', freshness: 'live' },
    })),
  };
}

function draft(days: TravelPlanDraftDay[], warnings: TravelPlanDraft['warnings'] = []): TravelPlanDraft {
  return {
    summary: '',
    factsCheckedAt: '2026-04-01 00:00:00',
    days,
    estimatedBudgetCny: { min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] },
    lodgingAreas: [],
    warnings,
  };
}

const candidate = (id: number, lat = 30 + id * 0.01, lng = 120 + id * 0.01, address: string | null = '杭州市') => ({
  place: {
    provider: 'amap',
    providerId: `amap:${id}`,
    name: `地点${id}`,
    lat,
    lng,
    category: '风景名胜',
    address,
    rating: null,
    hours: [],
    coordinateSystem: 'wgs84' as const,
  },
  source: { provider: 'amap', sourceId: `amap:${id}`, checkedAt: '2026-04-01 00:00:00', freshness: 'live' as const },
  address,
  category: '风景名胜',
  hours: [],
});

describe('PlannerRequestParser', () => {
  it('leaves a request without a prompt untouched and never calls a model', async () => {
    const connections = { resolveForUser: vi.fn() };
    const clients = { create: vi.fn() };
    const parser = new PlannerRequestParser(connections as never, clients as never);

    const outcome = await parser.merge(7, request());

    expect(outcome.request).toEqual(request());
    expect(outcome.warnings).toEqual([]);
    expect(connections.resolveForUser).not.toHaveBeenCalled();
  });

  it('OPS-01: a capped generation never resolves a connection or calls a model', async () => {
    const connections = { resolveForUser: vi.fn() };
    const clients = { create: vi.fn() };
    const parser = new PlannerRequestParser(connections as never, clients as never);

    const outcome = await parser.merge(7, request({ prompt: '杭州两天' }), { allowModel: false });

    expect(outcome.request).toEqual(request({ prompt: '杭州两天' }));
    expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'usage_limit', severity: 'warning' })]);
    expect(connections.resolveForUser).not.toHaveBeenCalled();
    expect(clients.create).not.toHaveBeenCalled();
  });

  it('OPS-01: a capped revision falls back to the raw feedback without a model', async () => {
    const connections = { resolveForUser: vi.fn() };
    const clients = { create: vi.fn() };
    const parser = new PlannerRequestParser(connections as never, clients as never);

    const outcome = await parser.feedbackKeywords(7, '再去一个博物馆', { allowModel: false });

    expect(outcome.keywords).toEqual(['再去一个博物馆']);
    expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'usage_limit', severity: 'warning' })]);
    expect(connections.resolveForUser).not.toHaveBeenCalled();
    expect(clients.create).not.toHaveBeenCalled();
  });

  it('reports model_not_configured and keeps the structured fields when no connection exists', async () => {
    const connections = { resolveForUser: vi.fn(async () => Promise.reject(new Error('not connected'))) };
    const parser = new PlannerRequestParser(connections as never, { create: vi.fn() } as never);

    const outcome = await parser.merge(7, request({ prompt: '杭州两天' }));

    expect(outcome.request.destination).toBe('杭州');
    expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'model_not_configured', severity: 'info' })]);
  });

  it('merges only the fields the model returned, letting explicit fields win', async () => {
    const text = JSON.stringify({
      destination: '苏州',
      dayCount: 3,
      travelers: { adults: 2, children: 1 },
      pace: 'relaxed',
      interests: ['园林', '博物馆'],
      transport: 'driving',
    });
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      { create: vi.fn(() => ({ model: 'test-model', stream: () => streamOf(text) })) } as never,
    );

    const outcome = await parser.merge(7, request({ prompt: '想带家人去苏州玩三天', interests: ['园林'] }));
    const merged = outcome.request;

    expect(merged.destination).toBe('杭州');
    expect(merged.dayCount).toBe(3);
    expect(merged.travelers).toEqual({ adults: 2, children: 1, seniors: 0 });
    expect(merged.pace).toBe('relaxed');
    expect(merged.transport).toBe('driving');
    expect(merged.interests).toEqual(['园林', '博物馆']);
    expect(outcome.model).toEqual({
      provider: 'openai',
      model: 'test-model',
      promptTokens: 3,
      completionTokens: 4,
    });
  });

  it('reports prompt_unparsed when the model answers something that is not the schema', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      { create: vi.fn(() => ({ model: 'test-model', stream: () => streamOf('好的，我来帮你规划！') })) } as never,
    );

    const outcome = await parser.merge(7, request({ prompt: '随便' }));

    expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'prompt_unparsed' })]);
    expect(outcome.request.destination).toBe('杭州');
  });

  it('falls back to the feedback text when the model cannot extract keywords', async () => {
    const parser = new PlannerRequestParser(
      { resolveForUser: vi.fn(async () => ({ kind: 'openai' })) } as never,
      { create: vi.fn(() => ({ model: 'test-model', stream: () => streamOf('not json') })) } as never,
    );

    const outcome = await parser.feedbackKeywords(7, '想去西溪湿地');

    expect(outcome.keywords).toEqual(['想去西溪湿地']);
  });
});

describe('mergeRequest and missingRequestFields', () => {
  it('keeps a non-default structured field and unions interests', () => {
    const merged = mergeRequest(
      travelPlanRequestSchema.parse({
        destination: '杭州',
        startDate: '2026-05-01',
        endDate: '2026-05-02',
        pace: 'intensive',
        interests: ['西湖'],
      }),
      { pace: 'relaxed', interests: ['龙井'] },
    );

    expect(merged.pace).toBe('intensive');
    expect(merged.interests).toEqual(['西湖', '龙井']);
  });

  it('names every missing field in the order the traveller reads it', () => {
    expect(missingRequestFields(travelPlanRequestSchema.parse({ destination: '杭州' }))).toEqual([
      '出发日期',
      '行程天数',
    ]);
  });
});

describe('validateDraft', () => {
  it('blocks an empty plan', () => {
    const warnings = validateDraft(request(), draft([]));
    expect(warnings).toEqual([expect.objectContaining({ code: 'no_places_found', severity: 'blocking' })]);
    expect(hasBlockingWarning(warnings)).toBe(true);
  });

  it('warns on duplicates, long gaps and unconfirmed prices, but lets lunch gaps through', () => {
    const days = [
      day('2026-05-01', [
        ['09:00', '10:30'],
        ['13:30', '15:00'],
      ]),
      day('2026-05-02', [
        ['11:30', '12:00'],
        ['13:30', '14:00'],
      ]),
    ];
    const secondDay = days[1];
    const secondItem = secondDay?.items[1];
    if (secondDay && secondItem) {
      secondDay.items[1] = { ...secondItem, place: { ...secondItem.place, providerId: 'amap:0' } };
    }
    const warnings = validateDraft(request(), draft(days));
    const codes = warnings.map((warning) => warning.code);

    expect(codes).toContain('duplicate_place');
    expect(codes).toContain('price_unconfirmed');
    expect(codes.filter((code) => code === 'long_gap')).toHaveLength(1);
  });

  it('blocks a day that runs past 22:00 or spans more than ten hours', () => {
    const late = validateDraft(request(), draft([day('2026-05-01', [['21:00', '22:30']])]));
    expect(late).toContainEqual(expect.objectContaining({ code: 'day_overloaded', severity: 'blocking' }));

    const long = validateDraft(
      request(),
      draft([
        day('2026-05-01', [
          ['08:00', '09:00'],
          ['19:30', '20:00'],
        ]),
      ]),
    );
    expect(long).toContainEqual(expect.objectContaining({ code: 'day_overloaded', severity: 'blocking' }));
  });

  it('warns when the known minimum exceeds the stated budget', () => {
    const value = draft([day('2026-05-01', [['09:00', '10:00']])]);
    value.estimatedBudgetCny = { min: 300, max: 500, breakdown: {}, breakdownMax: {}, assumptions: ['测试'] };
    const item = value.days[0]?.items[0];
    if (item) item.estimatedCostCny = { min: 300, max: 500 };

    expect(validateDraft(request({ budgetCny: 200 }), value)).toContainEqual(
      expect.objectContaining({ code: 'budget_exceeded', severity: 'warning' }),
    );
  });

  it('blocks an item without coordinates and collapses repeated warnings', () => {
    const value = draft(
      [day('2026-05-01', [['09:00', '10:00']])],
      [
        { code: 'price_unconfirmed', message: '重复', severity: 'info' },
        { code: 'price_unconfirmed', message: '重复', severity: 'info' },
      ],
    );
    const item = value.days[0]?.items[0];
    if (item) item.place = { ...item.place, lat: Number.NaN };

    const warnings = validateDraft(request(), value);

    expect(warnings).toContainEqual(
      expect.objectContaining({ code: 'place_missing_coordinates', severity: 'blocking' }),
    );
    expect(warnings.filter((warning) => warning.message === '重复')).toHaveLength(1);
  });

  it('skips untimed days and rows whose clock is not HH:MM', () => {
    const untimed = day('2026-05-01', [['09:00', '10:00']]);
    const first = untimed.items[0];
    if (first) untimed.items[0] = { ...first, arriveAt: null, leaveAt: null };
    const malformed = day('2026-05-02', [['9:00', '10:00']]);

    const warnings = validateDraft(request(), draft([untimed, malformed]));

    expect(warnings.some((warning) => warning.code === 'day_overloaded' || warning.code === 'long_gap')).toBe(false);
  });

  it('treats a gap inside the lunch window as a break but warns past it', () => {
    const through = validateDraft(
      request(),
      draft([
        day('2026-05-01', [
          ['09:00', '11:40'],
          ['13:30', '14:30'],
        ]),
      ]),
    );
    expect(through.some((warning) => warning.code === 'long_gap')).toBe(false);

    const past = validateDraft(
      request(),
      draft([
        day('2026-05-01', [
          ['09:00', '11:40'],
          ['14:00', '15:00'],
        ]),
      ]),
    );
    expect(past).toContainEqual(expect.objectContaining({ code: 'long_gap', severity: 'warning' }));
  });
});

describe('PlannerService', () => {
  function service(
    provider: Record<string, ReturnType<typeof vi.fn>>,
    weather: Record<string, ReturnType<typeof vi.fn>> = {
      get: vi.fn(async () => ({ temp: 20, main: 'Clear', description: '晴', type: 'forecast' })),
      getDetailed: vi.fn(),
    },
  ): PlannerService {
    return new PlannerService({ searchLodging: vi.fn(async () => []), ...provider } as never, weather as never);
  }

  it('blocks when the destination cannot be resolved', async () => {
    const planner = service({ centre: vi.fn(async () => null), search: vi.fn(), route: vi.fn() });
    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.warnings).toEqual([
      expect.objectContaining({ code: 'destination_unresolved', severity: 'blocking' }),
    ]);
  });

  it('blocks when every search returns nothing', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => []),
      route: vi.fn(),
    });
    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'no_places_found', severity: 'blocking' })]),
    );
  });

  it('never searches the bare destination — Amap answers that with the city’s own offices', async () => {
    const search = vi.fn(async (_userId: number, _query: string) => [candidate(1), candidate(2)]);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search,
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    await planner.plan({ userId: 1, request: request() });

    const queries = search.mock.calls.map((call) => call[1]);
    expect(queries).toEqual(expect.arrayContaining(['杭州 景点', '杭州 博物馆', '杭州 公园']));
    expect(queries).not.toContain('杭州');
  });

  it('spends two search slots on indoor stops when the forecast is rainy', async () => {
    const search = vi.fn(async (_userId: number, _query: string) => [candidate(1)]);
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search,
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ temp: 18, main: 'Rain', description: '小雨', type: 'forecast' })),
        getDetailed: vi.fn(),
      },
    );

    await planner.plan({ userId: 1, request: request() });

    // The shelter queries take the last two of the five slots, so the pool
    // holds indoor stops before selection — still five searches, not seven.
    expect(search.mock.calls.map((call) => call[1])).toEqual([
      '杭州 景点',
      '杭州 公园',
      '杭州 博物馆',
      '杭州 商场',
      '杭州 展览馆',
    ]);
  });

  it('never keeps more than two place searches in flight (the Amap QPS cap)', async () => {
    let inFlight = 0;
    let peak = 0;
    const search = vi.fn(async (_userId: number, _query: string) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return [candidate(1)];
    });
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search,
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ temp: 18, main: 'Rain', description: '小雨', type: 'forecast' })),
        getDetailed: vi.fn(),
      },
    );

    await planner.plan({ userId: 1, request: request() });

    expect(search).toHaveBeenCalledTimes(5);
    expect(peak).toBeLessThanOrEqual(2);
  });

  it('keeps the clear-weather search budget on interests alone', async () => {
    const search = vi.fn(async (_userId: number, _query: string) => [candidate(1)]);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search,
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    await planner.plan({ userId: 1, request: request() });

    expect(search.mock.calls.map((call) => call[1])).toEqual(['杭州 景点', '杭州 公园', '杭州 博物馆']);
  });

  it('fills a single explicit interest with the discovery keywords', async () => {
    const search = vi.fn(async (_userId: number, _query: string) => [candidate(1)]);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search,
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    await planner.plan({ userId: 1, request: request({ interests: ['景点'] }) });

    const queries = search.mock.calls.map((call) => call[1]);
    expect(queries).toEqual(expect.arrayContaining(['杭州 景点', '杭州 公园', '杭州 博物馆']));
  });

  it('drops civic infrastructure that a city-name search drags in', async () => {
    const civic = (id: number, category: string) => ({ ...candidate(id), category });
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        candidate(1),
        civic(2, '政府机构及社会团体;政府机关;地市级政府及事业单位'),
        civic(3, '科教文化服务;学校;中学'),
        civic(4, '医疗保健服务;医药保健销售店'),
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.flatMap((day) => day.items).map((item) => item.place.name)).toEqual(['地点1']);
  });

  it('drops places the provider marks as shut or under construction', async () => {
    const labelled = (id: number, name: string) => {
      const base = candidate(id);
      return { ...base, name, place: { ...base.place, name } };
    };
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        candidate(1),
        labelled(2, '晋忻梦幻乐园(暂停营业)'),
        labelled(3, '长城博物馆(建设中)'),
        labelled(4, '某古城景区(已关闭)'),
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.flatMap((day) => day.items).map((item) => item.place.name)).toEqual(['地点1']);
  });

  it('keeps only what the keyword means — a shop on 公园路 is not a park', async () => {
    const typed = (id: number, category: string) => ({ ...candidate(id), category });
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        typed(1, '风景名胜;公园广场;公园'),
        typed(2, '餐饮服务;休闲餐饮;烧烤'),
        typed(3, '科教文化服务;博物馆;博物馆'),
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    const names = outcome.draft.days.flatMap((day) => day.items).map((item) => item.place.name);
    expect(names).toContain('地点1');
    expect(names).toContain('地点3');
    expect(names).not.toContain('地点2');
  });

  it('carries the provider metadata the traveller needs to judge a stop', async () => {
    const base = candidate(1);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        {
          ...base,
          address: '山西省忻州市忻府区',
          rating: 4.6,
          hours: ['周一：08:00-18:00'],
          place: {
            ...base.place,
            address: '山西省忻州市忻府区',
            rating: 4.6,
            hours: ['周一：08:00-18:00'],
          },
        },
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.flatMap((day) => day.items)[0]?.place).toMatchObject({
      address: '山西省忻州市忻府区',
      category: '风景名胜',
      rating: 4.6,
      hours: ['周一：08:00-18:00'],
      coordinateSystem: 'wgs84',
    });
  });

  it('schedules real places with routed legs and records place and route facts', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1), candidate(2), candidate(1)]),
      route: vi.fn(async () => ({
        ok: true,
        legs: [
          { mode: 'walk', minutes: 12, distanceMeters: 900 },
          { mode: 'walk', minutes: 8, distanceMeters: 600 },
        ],
      })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.days).toHaveLength(1);
    expect(outcome.draft.days[0]?.items).toHaveLength(2);
    expect(outcome.draft.days[0]?.items[0]).toMatchObject({ arriveAt: '09:00', leaveAt: '10:30' });
    expect(outcome.draft.days[0]?.items[1]).toMatchObject({ arriveAt: '10:42', travelFromPrevious: { minutes: 12 } });
    expect(outcome.facts.filter((fact) => fact.kind === 'place')).toHaveLength(2);
    expect(outcome.facts).toContainEqual(expect.objectContaining({ kind: 'route', provider: 'routing-relay' }));
    expect(outcome.draft.estimatedBudgetCny.min).toBeGreaterThan(0);
    expect(outcome.draft.estimatedBudgetCny.assumptions.length).toBeGreaterThan(0);
  });

  it('keeps going with estimated legs and a warning when the router refuses', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1), candidate(2)]),
      route: vi.fn(async () => ({ ok: false })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'route_unavailable' }));
    expect(outcome.draft.days[0]?.items[1]?.travelFromPrevious).toMatchObject({ distanceMeters: null });
    expect(outcome.facts.some((fact) => fact.kind === 'route')).toBe(false);
  });

  it('reports a failed search without losing the other results', async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce([candidate(1)])
      .mockRejectedValueOnce(new Error('quota'))
      .mockResolvedValue([]);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search,
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request({ interests: ['西湖', '龙井'] }) });

    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'place_search_failed' }));
    expect(outcome.draft.days[0]?.items).toHaveLength(1);
  });

  it('returns request_incomplete without a destination or with an unusable start date', async () => {
    const search = vi.fn();
    const planner = service({ centre: vi.fn(), search, route: vi.fn() });

    const noDestination = await planner.plan({
      userId: 1,
      request: travelPlanCreateRequestSchema.parse({ prompt: '杭州两天', startDate: '2026-05-01', dayCount: 2 }),
    });
    const badDate = await planner.plan({
      userId: 1,
      request: travelPlanCreateRequestSchema.parse({ destination: '杭州', startDate: '2026-13-99', dayCount: 2 }),
    });

    for (const outcome of [noDestination, badDate]) {
      expect(outcome.warnings).toEqual([expect.objectContaining({ code: 'request_incomplete', severity: 'blocking' })]);
      expect(outcome.draft.days).toEqual([]);
    }
    expect(search).not.toHaveBeenCalled();
  });

  it('covers the requested days from dayCount and asks for drive and other transport', async () => {
    const runs = await Promise.all(
      (['driving', 'mixed'] as const).map(async (transport) => {
        const route = vi.fn(async () => ({ ok: false }));
        const planner = service({
          centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
          search: vi.fn(async () => [candidate(1), candidate(2), candidate(3), candidate(4)]),
          route,
        });
        const outcome = await planner.plan({
          userId: 1,
          request: travelPlanCreateRequestSchema.parse({
            destination: '杭州',
            startDate: '2026-05-01',
            dayCount: 2,
            transport,
          }),
        });
        return { transport, route, outcome };
      }),
    );

    for (const { transport, route, outcome } of runs) {
      expect(outcome.draft.days).toHaveLength(2);
      expect(route).toHaveBeenCalledWith(1, expect.any(Array), transport === 'driving' ? 'drive' : 'other');
      expect(outcome.draft.days[0]?.items[1]?.travelFromPrevious).toMatchObject({ mode: routeTransport(transport) });
    }
  });

  it('uses the pace for the daily cap and warns about the places it left out', async () => {
    const many = Array.from({ length: 10 }, (_, index) => candidate(index + 1));
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => many),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request({ pace: 'relaxed' }) });

    expect(outcome.warnings).toContainEqual(
      expect.objectContaining({ code: 'places_skipped', message: expect.stringContaining('前 6 个') }),
    );
    expect(outcome.draft.days[0]?.items[0]).toMatchObject({ arriveAt: '09:00', leaveAt: '11:00' });
  });

  it('keeps stops near the centre and drops an administrative area', async () => {
    const city = candidate(2);
    const abroad = candidate(3);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        candidate(1),
        { ...city, place: { ...city.place, name: '成都', lat: 30.66, lng: 104.06 }, category: 'city' },
        { ...abroad, place: { ...abroad.place, name: '成都', lat: 35.69, lng: 139.77 }, category: 'restaurant' },
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.flatMap((day) => day.items).map((item) => item.place.name)).toEqual(['地点1']);
  });

  it('spreads a long list across every planned day instead of leaving the tail empty', async () => {
    const many = Array.from({ length: 6 }, (_, index) => candidate(index + 1));
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => many),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: travelPlanCreateRequestSchema.parse({
        destination: '杭州',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        pace: 'relaxed',
      }),
    });

    expect(outcome.draft.days.map((day) => day.items.length)).toEqual([2, 2, 2]);
  });

  it('puts one stop on each day when the list only just covers the calendar', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1), candidate(2)]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.map((day) => day.items.length)).toEqual([1, 1]);
  });

  it('warns about a day that had no place left to schedule', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1)]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days.map((day) => day.items.length)).toEqual([1, 0]);
    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'day_underfilled', severity: 'warning' }));
  });

  it('prefers a better-rated stop when the extra distance is small', async () => {
    const near = candidate(1, 30.009, 120);
    const rated = candidate(2, 30.0094, 120);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [
        { ...near, rating: 1, place: { ...near.place, rating: 1 } },
        { ...rated, rating: 4.8, place: { ...rated.place, rating: 4.8 } },
      ]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days[0]?.items[0]?.place.name).toBe('地点2');
  });

  it('never schedules a stop before it opens', async () => {
    const place = candidate(1, 30.005, 120);
    const hours = ['Friday: 10:00-18:00'];
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [{ ...place, hours, place: { ...place.place, hours } }]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01', pace: 'relaxed' }),
    });

    expect(outcome.draft.days[0]?.items[0]).toMatchObject({ arriveAt: '10:00', leaveAt: '12:00' });
  });

  it('clamps a visit to the provider closing time', async () => {
    const place = candidate(1, 30.005, 120);
    const hours = ['Friday: 09:00-10:00'];
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [{ ...place, hours, place: { ...place.place, hours } }]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01', pace: 'relaxed' }),
    });

    expect(outcome.draft.days[0]?.items[0]).toMatchObject({ arriveAt: '09:00', leaveAt: '10:00' });
  });

  it('skips a place the provider says is closed on that weekday and warns', async () => {
    const place = candidate(1, 30.005, 120);
    const hours = ['Monday: Closed'];
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [{ ...place, hours, place: { ...place.place, hours } }]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-04', endDate: '2026-05-04' }),
    });

    expect(outcome.draft.days[0]?.items).toHaveLength(0);
    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'place_closed', severity: 'warning' }));
    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'day_underfilled' }));
  });

  it('moves a stop out of the lunch window and skips what no longer fits the day', async () => {
    const lunch = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1), candidate(2)]),
      route: vi.fn(async () => ({ ok: true, legs: [{ mode: 'walk', minutes: 60, distanceMeters: 100 }] })),
    });
    const shifted = await lunch.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });
    expect(shifted.draft.days[0]?.items[1]).toMatchObject({ arriveAt: '13:30', leaveAt: '15:00' });

    const overflow = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1), candidate(2), candidate(3)]),
      // A routed leg this long pushes every following stop past the day's end.
      route: vi.fn(async () => ({
        ok: true,
        legs: [
          { mode: 'drive', minutes: 900, distanceMeters: 50_000 },
          { mode: 'drive', minutes: 900, distanceMeters: 50_000 },
        ],
      })),
    });
    const skipped = await overflow.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01', pace: 'relaxed', transport: 'driving' }),
    });
    expect(skipped.warnings).toContainEqual(
      expect.objectContaining({ code: 'places_skipped', message: expect.stringContaining('没有排进行程') }),
    );
    expect(skipped.draft.days[0]?.items).toHaveLength(1);
  });

  it('truncates a long place fact and leaves the parenthesis off when there is no address', async () => {
    const longAddress = '长'.repeat(600);
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1, 30, 120, null), candidate(2, 30.1, 120.1, longAddress)]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });
    const details = outcome.facts.filter((fact) => fact.kind === 'place').map((fact) => fact.detail);

    expect(details[0]).toBe('地点1');
    expect(details[1]).toHaveLength(500);
  });

  it('records each day’s forecast and a weather fact', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1)]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.days[0]?.weather).toMatchObject({
      provider: 'open-meteo',
      kind: 'clear',
      tempMin: 20,
      tempMax: 20,
      type: 'forecast',
    });
    expect(outcome.facts).toContainEqual(
      expect.objectContaining({ kind: 'weather', provider: 'open-meteo', detail: expect.stringContaining('晴') }),
    );
  });

  it('warns, but still plans, when the weather lookup fails', async () => {
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search: vi.fn(async () => [candidate(1)]),
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      { get: vi.fn(async () => Promise.reject(new Error('offline'))), getDetailed: vi.fn() },
    );

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days[0]?.weather).toBeNull();
    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'weather_unavailable', severity: 'info' }));
    expect(outcome.draft.days.flatMap((day) => day.items)).toHaveLength(1);
  });

  it('puts an indoor stop first on a rainy day', async () => {
    const outdoor = candidate(1);
    const museumBase = candidate(2);
    const museum = {
      ...museumBase,
      name: '杭州博物馆',
      category: '科教文化服务;博物馆',
      place: { ...museumBase.place, name: '杭州博物馆', category: '科教文化服务;博物馆' },
    };
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search: vi.fn(async () => [outdoor, museum]),
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ temp: 18, main: 'Rain', description: '小雨', type: 'forecast' })),
        getDetailed: vi.fn(),
      },
    );

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.days[0]?.items.map((item) => item.place.name)).toEqual(['杭州博物馆', '地点1']);
  });

  it('gives each rainy day two indoor stops before the cap trims the pool', async () => {
    // Indoor stops sit farther from the centre than the parks, so the old
    // selection (the first `cap` of the nearest-neighbour order) filled both
    // days with parks and never reached a museum.
    const outdoor = [1, 2, 3, 4, 5, 6].map((id) => candidate(id));
    const indoor = [10, 11, 12, 13, 14, 15].map((id) => {
      const base = candidate(id);
      return {
        ...base,
        category: '科教文化服务;博物馆',
        place: { ...base.place, name: `博物馆${id}`, category: '科教文化服务;博物馆' },
      };
    });
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search: vi.fn(async () => [...outdoor, ...indoor]),
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ main: 'Rain', description: '小雨', type: 'forecast' })),
        getDetailed: vi.fn(),
      },
    );

    const outcome = await planner.plan({ userId: 1, request: request() });

    expect(outcome.draft.days).toHaveLength(2);
    for (const day of outcome.draft.days) {
      const indoorStops = day.items.filter(
        (item) => classifyPlaceEnvironment(item.place.category, item.place.name) === 'indoor',
      );
      expect(indoorStops).toHaveLength(2);
    }
  });

  it('shows a climate reference beyond the forecast window without reordering', async () => {
    const outdoor = candidate(1);
    const museumBase = candidate(2);
    const museum = {
      ...museumBase,
      name: '杭州博物馆',
      category: '科教文化服务;博物馆',
      place: { ...museumBase.place, name: '杭州博物馆', category: '科教文化服务;博物馆' },
    };
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search: vi.fn(async () => [outdoor, museum]),
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ temp: 26, main: 'Rain', description: '多雨', type: 'climate' })),
        getDetailed: vi.fn(),
      },
    );

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.days[0]?.weather?.type).toBe('climate');
    expect(outcome.draft.days[0]?.items.map((item) => item.place.name)).toEqual(['地点1', '杭州博物馆']);
    expect(outcome.warnings.some((warning) => warning.code === 'weather_outdoor_risk')).toBe(false);
    expect(outcome.facts).toContainEqual(
      expect.objectContaining({ kind: 'weather', detail: expect.stringContaining('气候参考') }),
    );
  });

  it('warns about the outdoor stops that remain on a risky day', async () => {
    const planner = service(
      {
        centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
        search: vi.fn(async () => [candidate(1), candidate(2)]),
        route: vi.fn(async () => ({ ok: true, legs: [] })),
      },
      {
        get: vi.fn(async () => ({ temp: 18, main: 'Rain', description: '中雨', type: 'forecast' })),
        getDetailed: vi.fn(),
      },
    );

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.warnings).toContainEqual(
      expect.objectContaining({
        code: 'weather_outdoor_risk',
        severity: 'warning',
        message: expect.stringContaining('2026-05-01'),
      }),
    );
    expect(outcome.draft.days[0]?.items).toHaveLength(2);
  });

  it('writes the lodging areas derived from real hotels', async () => {
    const museum = candidate(1);
    const hotelBase = candidate(2);
    const hotel = {
      ...hotelBase,
      name: '西湖酒店',
      category: '住宿服务;宾馆酒店',
      rating: 4.6,
      place: { ...hotelBase.place, name: '西湖酒店', category: '住宿服务;宾馆酒店', rating: 4.6 },
    };
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [museum, hotel]),
      searchLodging: vi.fn(async () => [hotel]),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.lodgingAreas).toHaveLength(1);
    expect(outcome.draft.lodgingAreas[0]).toMatchObject({
      name: '地点1周边',
      hotelCount: 1,
      sampleHotels: [expect.objectContaining({ rating: 4.6 })],
    });
  });

  it('warns, but still plans, when the lodging search fails', async () => {
    const planner = service({
      centre: vi.fn(async () => ({ lat: 30, lng: 120 })),
      search: vi.fn(async () => [candidate(1)]),
      searchLodging: vi.fn(async () => Promise.reject(new Error('quota'))),
      route: vi.fn(async () => ({ ok: true, legs: [] })),
    });

    const outcome = await planner.plan({
      userId: 1,
      request: request({ startDate: '2026-05-01', endDate: '2026-05-01' }),
    });

    expect(outcome.draft.lodgingAreas).toEqual([]);
    expect(outcome.warnings).toContainEqual(expect.objectContaining({ code: 'lodging_unavailable', severity: 'info' }));
    expect(outcome.draft.days[0]?.items).toHaveLength(1);
  });
});

describe('PlannerProvider', () => {
  it('normalises an amap record and drops one without coordinates', async () => {
    const maps = {
      geocodeQuery: vi.fn(async () => null),
      searchPlaces: vi.fn(async () => ({
        places: [
          {
            name: '西湖',
            lat: 30.2,
            lng: 120.1,
            source: 'amap',
            amap_poi_id: 'amap:B0FF',
            address: '西湖区',
            types: ['风景名胜'],
            rating: 4.5,
            opening_hours: ['周一：08:00-18:00'],
          },
          { name: '没有坐标', source: 'osm' },
        ],
      })),
    };
    const provider = new PlannerProvider(maps as never, { ask: vi.fn() } as never);

    expect(await provider.centre(1, '杭州')).toBeNull();
    const found = await provider.search(1, '杭州 西湖', { lat: 30, lng: 120 });
    expect(found).toEqual([
      expect.objectContaining({
        place: {
          provider: 'amap',
          providerId: 'amap:B0FF',
          name: '西湖',
          lat: 30.2,
          lng: 120.1,
          category: '风景名胜',
          address: '西湖区',
          rating: 4.5,
          hours: ['周一：08:00-18:00'],
          coordinateSystem: 'wgs84',
        },
        category: '风景名胜',
      }),
    ]);
  });

  it('reads valhalla legs and refuses an answer of the wrong shape', async () => {
    const routing = {
      ask: vi.fn(async () => ({
        status: 200,
        body: Buffer.from(JSON.stringify({ trip: { legs: [{ summary: { length: 1.5, time: 600 } }] } })),
      })),
    };
    const provider = new PlannerProvider({ geocodeQuery: vi.fn(), searchPlaces: vi.fn() } as never, routing as never);

    expect(
      await provider.route(
        1,
        [
          { lat: 30, lng: 120 },
          { lat: 30.1, lng: 120.1 },
        ],
        'drive',
      ),
    ).toEqual({
      ok: true,
      legs: [{ mode: 'drive', minutes: 10, distanceMeters: 1500 }],
    });

    routing.ask.mockResolvedValueOnce({ status: 200, body: Buffer.from('{"trip":{}}') } as never);
    expect(
      await provider.route(
        1,
        [
          { lat: 30, lng: 120 },
          { lat: 30.1, lng: 120.1 },
        ],
        'walk',
      ),
    ).toEqual({ ok: false });
  });

  it('routes transit legs on the car network instead of a pedestrian path', async () => {
    const ask = vi.fn(async (_userId: number, _kind: string, _payload: { costing?: string }) => ({
      status: 200,
      body: Buffer.from(JSON.stringify({ trip: { legs: [{ summary: { length: 2, time: 900 } }] } })),
    }));
    const provider = new PlannerProvider({ geocodeQuery: vi.fn(), searchPlaces: vi.fn() } as never, { ask } as never);

    const routed = await provider.route(
      1,
      [
        { lat: 30, lng: 120 },
        { lat: 30.1, lng: 120.1 },
      ],
      'other',
    );

    expect(ask.mock.calls[0]?.[2]).toMatchObject({ costing: 'auto' });
    expect(routed).toEqual({ ok: true, legs: [{ mode: 'other', minutes: 15, distanceMeters: 2000 }] });
  });

  it('prefers an administrative record and falls back to the geocoder for a centre', async () => {
    const maps = {
      geocodeQuery: vi.fn(async () => ({ lat: 30.2, lng: 120.1 })),
      searchPlaces: vi.fn(async () => ({
        places: [
          { name: '杭州小笼包', lat: 35.7, lng: 139.7, category: 'restaurant' },
          { name: '杭州', lat: 30.25, lng: 120.15, category: 'city' },
        ],
      })),
    };
    const provider = new PlannerProvider(maps as never, { ask: vi.fn() } as never);

    // A same-named restaurant abroad must never become the centre.
    expect(await provider.centre(1, '杭州')).toEqual({ lat: 30.25, lng: 120.15 });
    expect(maps.geocodeQuery).not.toHaveBeenCalled();

    maps.searchPlaces.mockResolvedValueOnce({
      places: [{ name: '杭州', lat: 30.2, lng: 120.1, category: 'restaurant' }],
    } as never);
    expect(await provider.centre(1, '杭州')).toEqual({ lat: 30.2, lng: 120.1 });

    maps.geocodeQuery.mockResolvedValueOnce(null as never);
    maps.searchPlaces.mockRejectedValueOnce(new Error('quota') as never);
    expect(await provider.centre(1, '杭州')).toBeNull();
  });

  it('anchors the centre on the densest namesake cluster when no area record came back', async () => {
    // The real first-plan failure: the OSM half was down, the index answered
    // with a Kuala Lumpur airport named 杭州 first, and the geocoder returned
    // that airport — every Amap search then ran around Malaysia and answered
    // 10045 (USER_ABROAD_DAILY_QUERY_OVER_LIMIT).
    const maps = {
      geocodeQuery: vi.fn(async () => ({ lat: 3.09, lng: 101.7 })),
      searchPlaces: vi.fn(async () => ({
        places: [
          { name: '杭州', lat: 3.09, lng: 101.7, category: 'airport' },
          { name: '杭州', lat: 35.62, lng: 139.58, category: null },
          { name: '杭州 Hangzhou', lat: 30.2768, lng: 120.1523, category: 'travel_service' },
          { name: '杭州火车站', lat: 30.246, lng: 120.178, category: null },
          { name: '杭州东', lat: 30.2938, lng: 120.2087, category: 'train_station' },
        ],
      })),
    };
    const provider = new PlannerProvider(maps as never, { ask: vi.fn() } as never);

    expect(await provider.centre(1, '杭州')).toEqual({ lat: 30.2768, lng: 120.1523 });
    expect(maps.geocodeQuery).not.toHaveBeenCalled();
  });

  it('refuses a one-point route, a non-200 answer and a summary without numbers', async () => {
    const routing = { ask: vi.fn() };
    const provider = new PlannerProvider({ geocodeQuery: vi.fn(), searchPlaces: vi.fn() } as never, routing as never);

    expect(await provider.route(1, [{ lat: 30, lng: 120 }], 'walk')).toEqual({ ok: true, legs: [] });
    expect(routing.ask).not.toHaveBeenCalled();

    routing.ask.mockResolvedValueOnce({ status: 502, body: Buffer.from('{}') } as never);
    expect(
      await provider.route(
        1,
        [
          { lat: 30, lng: 120 },
          { lat: 30.1, lng: 120.1 },
        ],
        'walk',
      ),
    ).toEqual({ ok: false });

    routing.ask.mockResolvedValueOnce({
      status: 200,
      body: Buffer.from(JSON.stringify({ trip: { legs: [{}, { summary: { time: '600', length: '1.5' } }] } })),
    } as never);
    expect(
      await provider.route(
        1,
        [
          { lat: 30, lng: 120 },
          { lat: 30.1, lng: 120.1 },
          { lat: 30.2, lng: 120.2 },
        ],
        'other',
      ),
    ).toEqual({
      ok: true,
      legs: [
        { mode: 'other', minutes: 0, distanceMeters: null },
        { mode: 'other', minutes: 10, distanceMeters: 1500 },
      ],
    });
  });

  it('maps transport to the router mode and keeps every candidate id fallback', async () => {
    expect(routeTransport('driving')).toBe('drive');
    expect(routeTransport('public_transit')).toBe('public_transit');
    expect(routeTransport('mixed')).toBe('public_transit');
    expect(routeTransport('walking')).toBe('walk');

    const maps = {
      geocodeQuery: vi.fn(),
      searchPlaces: vi.fn(async () => ({
        places: [
          { name: '甲', lat: 30, lng: 120, google_place_id: 'g:1', types: ['', 5, '公园'] },
          { name: '乙', lat: '31', lng: '121', osm_id: 'node:2', opening_hours: ['09:00-17:00', '', 7] },
          { name: '丙', lat: 32, lng: 122, id: 'local:3' },
          { name: '丁', lat: 33, lng: 123 },
          { name: '戊', lat: true, lng: 124, id: 'bad' },
        ],
      })),
    };
    const provider = new PlannerProvider(maps as never, { ask: vi.fn() } as never);

    const found = await provider.search(1, '杭州', { lat: 30, lng: 120 });

    expect(found.map((entry) => entry.place.providerId)).toEqual(['g:1', 'node:2', 'local:3']);
    expect(found[0]).toMatchObject({ place: { provider: 'maps' }, address: null, category: '公园' });
    expect(found[1]).toMatchObject({ hours: ['09:00-17:00'] });
    expect(found[2]).toMatchObject({ category: null, hours: [] });
  });
});

describe('RealTravelPlanEngine', () => {
  it('returns a draft status with request_incomplete when a required field is missing', async () => {
    const parser = {
      merge: vi.fn(async () => ({
        request: travelPlanRequestSchema.parse({ destination: '杭州' }),
        warnings: [],
        model: null,
      })),
    };
    const engine = new RealTravelPlanEngine(parser as never, { plan: vi.fn() } as never);

    const result = await engine.generate({ userId: 1, request: request() });

    expect(result.status).toBe('draft');
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'request_incomplete', severity: 'blocking' }),
    );
  });

  it('returns ready for a plan without blocking warnings', async () => {
    const parser = { merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })) };
    const planner = {
      plan: vi.fn(async () => ({
        draft: draft([day('2026-05-01', [['09:00', '10:00']])]),
        facts: [{ kind: 'place', provider: 'amap', checkedAt: '2026-04-01 00:00:00', detail: '西湖' }],
        warnings: [],
      })),
    };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.generate({ userId: 1, request: request() });

    expect(result.status).toBe('ready');
    expect(result.modelMeta.engine).toBe('nest-planner');
  });

  it('returns failed, never a fabricated draft, when the planner throws', async () => {
    const parser = { merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })) };
    const engine = new RealTravelPlanEngine(
      parser as never,
      { plan: vi.fn(async () => Promise.reject(new Error('down'))) } as never,
    );

    const result = await engine.generate({ userId: 1, request: request() });

    expect(result.status).toBe('failed');
    expect(result.draft.days).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: 'generation_failed' }));
  });

  it('keeps the previous draft when a revision finds no new places', async () => {
    const previous = draft([day('2026-05-01', [['09:00', '10:00']])]);
    const parser = {
      merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })),
      feedbackKeywords: vi.fn(async () => ({ keywords: ['西溪'], warnings: [], model: null })),
    };
    const planner = {
      plan: vi.fn(async () => ({ draft: draft([]), facts: [], warnings: [] })),
    };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.revise({ userId: 1, request: request(), draft: previous, feedback: '加上西溪' });

    expect(result.status).toBe('ready');
    expect(result.draft.days).toEqual(previous.days);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: 'revision_not_applied' }));
  });

  it('refuses to revise without the fields a plan needs', async () => {
    const parser = {
      merge: vi.fn(async () => ({
        request: travelPlanRequestSchema.parse({ destination: '杭州' }),
        warnings: [],
        model: null,
      })),
    };
    const planner = { plan: vi.fn() };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.revise({ userId: 1, request: request(), draft: draft([]), feedback: '换个地方' });

    expect(result.status).toBe('draft');
    expect(planner.plan).not.toHaveBeenCalled();
    expect(result.warnings).toEqual([expect.objectContaining({ code: 'request_incomplete', severity: 'blocking' })]);
  });

  it('turns a blocking finding from the validator into a draft status', async () => {
    const parser = { merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })) };
    const broken = day('2026-05-01', [['09:00', '10:00']]);
    const first = broken.items[0];
    if (first) first.place = { ...first.place, lng: Number.NaN };
    const planner = {
      plan: vi.fn(async () => ({ draft: draft([broken]), facts: [], warnings: [] })),
    };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.generate({ userId: 1, request: request() });

    expect(result.status).toBe('draft');
    expect(result.draft.warnings).toContainEqual(
      expect.objectContaining({ code: 'place_missing_coordinates', severity: 'blocking' }),
    );
  });

  it('does not keep an empty previous draft as if it were a plan', async () => {
    const parser = {
      merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })),
      feedbackKeywords: vi.fn(async () => ({ keywords: ['西溪'], warnings: [], model: null })),
    };
    const planner = { plan: vi.fn(async () => ({ draft: draft([]), facts: [], warnings: [] })) };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.revise({ userId: 1, request: request(), draft: draft([]), feedback: '加个公园' });

    expect(result.status).toBe('draft');
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: 'no_places_found' }));
  });

  it('keeps the previous draft as a draft when its warnings already block it', async () => {
    const previous = draft(
      [day('2026-05-01', [['09:00', '10:00']])],
      [{ code: 'place_missing_coordinates', message: '旧版本缺坐标', severity: 'blocking' }],
    );
    const parser = {
      merge: vi.fn(async () => ({ request: request(), warnings: [], model: null })),
      feedbackKeywords: vi.fn(async () => ({ keywords: ['西溪'], warnings: [], model: null })),
    };
    const planner = { plan: vi.fn(async () => ({ draft: draft([]), facts: [], warnings: [] })) };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const result = await engine.revise({ userId: 1, request: request(), draft: previous, feedback: '换个地方' });

    expect(result.status).toBe('draft');
    expect(result.draft.days).toEqual(previous.days);
  });

  it('reports unknown token counts as null rather than zero, and fails a throwing revision', async () => {
    const model = { provider: 'openai', model: 'test-model', promptTokens: null, completionTokens: null };
    const parser = {
      merge: vi.fn(async () => ({ request: request(), warnings: [], model })),
      feedbackKeywords: vi.fn(async () => ({ keywords: [], warnings: [], model })),
    };
    const planner = {
      plan: vi.fn(async () => ({
        draft: draft([day('2026-05-01', [['09:00', '10:00']])]),
        facts: [],
        warnings: [],
      })),
    };
    const engine = new RealTravelPlanEngine(parser as never, planner as never);

    const generated = await engine.generate({ userId: 1, request: request() });
    expect(generated.modelMeta).toMatchObject({ provider: 'openai', promptTokens: null, completionTokens: null });

    planner.plan.mockRejectedValueOnce(new Error('down') as never);
    const failed = await engine.revise({ userId: 1, request: request(), draft: draft([]), feedback: '改一下' });
    expect(failed.status).toBe('failed');
  });
});

async function* streamOf(text: string) {
  yield { type: 'text-delta' as const, delta: text };
  yield { type: 'usage' as const, inputTokens: 3, outputTokens: 4 };
}
