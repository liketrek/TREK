import { emptyTravelPlanDraft, travelPlanDraftItemSchema } from './draft.schema';
import { travelPlanSchema, travelPlanStreamEventSchema } from './plan.schema';
import {
  travelPlanApplyRequestSchema,
  travelPlanCreateRequestSchema,
  travelPlanRevisionRequestSchema,
} from './request.schema';

import { describe, expect, it } from 'vitest';

describe('travelPlanCreateRequestSchema', () => {
  it('accepts a prompt alone and fills the structured defaults', () => {
    const parsed = travelPlanCreateRequestSchema.parse({ prompt: '三天北京，想看故宫和胡同' });

    expect(parsed.prompt).toBe('三天北京，想看故宫和胡同');
    expect(parsed.travelers).toEqual({ adults: 1, children: 0, seniors: 0 });
    expect(parsed.pace).toBe('balanced');
    expect(parsed.interests).toEqual([]);
    expect(parsed.transport).toBe('public_transit');
  });

  it('accepts a destination alone', () => {
    expect(() => travelPlanCreateRequestSchema.parse({ destination: '杭州' })).not.toThrow();
  });

  it('refuses a request with neither a prompt nor a destination', () => {
    const result = travelPlanCreateRequestSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('refuses an end date before the start date', () => {
    const result = travelPlanCreateRequestSchema.safeParse({
      destination: '成都',
      startDate: '2026-05-03',
      endDate: '2026-05-01',
    });

    expect(result.success).toBe(false);
  });

  it('refuses a plan longer than 14 days', () => {
    const result = travelPlanCreateRequestSchema.safeParse({
      destination: '新疆',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
    });

    expect(result.success).toBe(false);
  });

  it('accepts exactly 14 days', () => {
    const result = travelPlanCreateRequestSchema.safeParse({
      destination: '新疆',
      startDate: '2026-05-01',
      endDate: '2026-05-14',
    });

    expect(result.success).toBe(true);
  });
});

describe('travelPlanRevisionRequestSchema', () => {
  it('requires feedback', () => {
    expect(travelPlanRevisionRequestSchema.safeParse({}).success).toBe(false);
  });

  it('keeps an optional expected revision', () => {
    const parsed = travelPlanRevisionRequestSchema.parse({ feedback: '少走一点路', expectedRevision: 2 });

    expect(parsed.expectedRevision).toBe(2);
  });
});

describe('travelPlanApplyRequestSchema', () => {
  it('refuses existing_trip without a trip id', () => {
    expect(travelPlanApplyRequestSchema.safeParse({ mode: 'existing_trip' }).success).toBe(false);
  });

  it('accepts new_trip without a trip id', () => {
    expect(travelPlanApplyRequestSchema.safeParse({ mode: 'new_trip' }).success).toBe(true);
  });
});

describe('travelPlanDraftSchema / plan response', () => {
  it('accepts an item only with a provider id, coordinates and a source', () => {
    const item = {
      place: { provider: 'amap', providerId: 'B0FFH3', name: '西湖', lat: 30.25, lng: 120.15 },
      arriveAt: '09:00',
      leaveAt: '11:00',
      activity: '环湖散步',
      travelFromPrevious: null,
      estimatedCostCny: null,
      source: {
        provider: 'amap',
        sourceId: 'B0FFH3',
        checkedAt: '2026-05-01 01:00:00',
        freshness: 'live',
      },
    };

    expect(travelPlanDraftItemSchema.safeParse(item).success).toBe(true);
    expect(travelPlanDraftItemSchema.safeParse({ ...item, source: undefined }).success).toBe(false);
  });

  it('fills place metadata defaults for drafts written before it existed', () => {
    const parsed = travelPlanDraftItemSchema.parse({
      place: { provider: 'amap', providerId: 'B0FFH3', name: '西湖', lat: 30.25, lng: 120.15 },
      arriveAt: null,
      leaveAt: null,
      activity: null,
      travelFromPrevious: null,
      estimatedCostCny: null,
      source: {
        provider: 'amap',
        sourceId: 'B0FFH3',
        checkedAt: '2026-05-01 01:00:00',
        freshness: 'live',
      },
    });

    expect(parsed.place).toMatchObject({
      category: null,
      address: null,
      rating: null,
      hours: [],
      coordinateSystem: 'wgs84',
    });
  });

  it('builds an honest empty draft', () => {
    const draft = emptyTravelPlanDraft('2026-01-01 00:00:00', [
      { code: 'engine_not_configured', message: '没有引擎', severity: 'warning' },
    ]);

    expect(draft.days).toEqual([]);
    expect(draft.estimatedBudgetCny).toEqual({ min: 0, max: 0, breakdown: {}, breakdownMax: {}, assumptions: [] });
    expect(draft.warnings).toHaveLength(1);
  });

  it('validates a stored plan with no revision yet', () => {
    const parsed = travelPlanSchema.parse({
      id: 1,
      status: 'ready',
      request: { destination: '杭州', travelers: { adults: 1, children: 0, seniors: 0 } },
      currentRevision: 0,
      targetTripId: null,
      appliedTripId: null,
      expiresAt: null,
      createdAt: '2026-01-01 00:00:00',
      updatedAt: '2026-01-01 00:00:00',
      draft: null,
      warnings: [],
      revisions: [],
      applyResult: null,
    });

    expect(parsed.status).toBe('ready');
  });
});

describe('travelPlanStreamEventSchema', () => {
  it('accepts a progress event and refuses an unknown stage', () => {
    expect(travelPlanStreamEventSchema.parse({ type: 'progress', stage: 'places', message: '检索中' })).toEqual({
      type: 'progress',
      stage: 'places',
      message: '检索中',
    });
    expect(() => travelPlanStreamEventSchema.parse({ type: 'progress', stage: 'thinking', message: 'x' })).toThrow();
  });

  it('discriminates the error event from a plan event', () => {
    expect(travelPlanStreamEventSchema.parse({ type: 'error', code: 'generation_failed', message: '失败' }).type).toBe(
      'error',
    );
    expect(() => travelPlanStreamEventSchema.parse({ type: 'done', plan: { id: 1 } })).toThrow();
  });
});
