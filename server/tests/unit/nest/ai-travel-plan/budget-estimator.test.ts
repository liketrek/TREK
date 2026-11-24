/**
 * The budget is a rule-based estimate, so every band here is an assertion
 * about the published rate table, not about a live price feed.
 */
import { estimateBudget } from '../../../../src/nest/ai-travel-plan/budget-estimator';
import { cityTierOf } from '../../../../src/nest/ai-travel-plan/destination-catalog';
import { travelPlanCreateRequestSchema, type TravelPlanCreateRequest } from '@trek/shared';

import { describe, expect, it } from 'vitest';

function request(overrides: Record<string, unknown> = {}): TravelPlanCreateRequest {
  return travelPlanCreateRequestSchema.parse({
    destination: '杭州',
    startDate: '2026-05-01',
    endDate: '2026-05-02',
    ...overrides,
  });
}

const TWO_DAYS = ['2026-05-01', '2026-05-02'];

describe('estimateBudget', () => {
  it('prices one room-night for two adults in a tier-1 city', () => {
    const budget = estimateBudget(request({ travelers: { adults: 2 } }), TWO_DAYS, 1);

    expect(budget.breakdown).toEqual({ lodging: 450, meals: 480, local_transport: 160, tickets_other: 240 });
    expect(budget.breakdownMax).toEqual({ lodging: 900, meals: 900, local_transport: 350, tickets_other: 600 });
    expect(budget.min).toBe(1330);
    expect(budget.max).toBe(2750);
    expect(budget.assumptions).toContain('按 2 天 1 晚、1 间房估算。');
    expect(budget.assumptions).toContain('预算为规则估算，不是实时报价。');
  });

  it('does not charge lodging on a same-day trip', () => {
    const budget = estimateBudget(request(), ['2026-05-01'], 1);

    expect(budget.breakdown.lodging).toBe(0);
    expect(budget.breakdownMax.lodging).toBe(0);
    expect(budget.assumptions).toContain('按 1 天当天往返估算，不计住宿。');
  });

  it('discounts children to 0.6 of a meal and ticket', () => {
    const budget = estimateBudget(
      request({ travelers: { adults: 2, children: 1 }, transport: 'walking' }),
      TWO_DAYS,
      1,
    );

    expect(budget.breakdown.meals).toBe(620);
    expect(budget.breakdownMax.meals).toBe(1150);
    expect(budget.breakdown.tickets_other).toBe(310);
    expect(budget.breakdownMax.tickets_other).toBe(800);
    expect(budget.assumptions).toContain('儿童餐饮与门票按 0.6 人折算。');
  });

  it('charges walking trips a small transit allowance instead of per-person fares', () => {
    const budget = estimateBudget(request({ travelers: { adults: 2 }, transport: 'walking' }), TWO_DAYS, 1);

    expect(budget.breakdown.local_transport).toBe(0);
    expect(budget.breakdownMax.local_transport).toBe(100);
  });

  it('charges driving per car-day rather than per person', () => {
    const budget = estimateBudget(request({ travelers: { adults: 2 }, transport: 'driving' }), TWO_DAYS, 1);

    expect(budget.breakdown.local_transport).toBe(360);
    expect(budget.breakdownMax.local_transport).toBe(750);
    expect(budget.assumptions).toContain('市内交通按 1 辆车、每车每天计。');
  });

  it('prices a tier-3 city below a tier-1 city for the same trip', () => {
    const tier1 = estimateBudget(request({ travelers: { adults: 2 } }), TWO_DAYS, 1);
    const tier3 = estimateBudget(request({ travelers: { adults: 2 } }), TWO_DAYS, 3);

    expect(tier3.min).toBeLessThan(tier1.min);
    expect(tier3.max).toBeLessThan(tier1.max);
  });

  it('returns an honest zero estimate without dates', () => {
    const budget = estimateBudget(request(), [], 1);

    expect(budget).toMatchObject({ min: 0, max: 0, breakdown: {}, breakdownMax: {} });
    expect(budget.assumptions).toEqual(['缺少日期，暂未估算预算。']);
  });
});

describe('cityTierOf', () => {
  it('matches a city with an administrative suffix', () => {
    expect(cityTierOf('杭州市')).toBe(1);
    expect(cityTierOf('杭州市西湖区')).toBe(1);
  });

  it('matches an alias', () => {
    expect(cityTierOf('蓉城')).toBe(1);
  });

  it('falls back to tier 2 for an unknown destination', () => {
    expect(cityTierOf('某个县城')).toBe(2);
    expect(cityTierOf(undefined)).toBe(2);
  });
});
