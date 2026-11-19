import type { TravelPlanDraft, TravelPlanDraftDay, TravelPlanRequest } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  briefDayCount,
  briefFromRequest,
  briefToCreateRequest,
  countDraftPlaces,
  emptyBrief,
  splitList,
  validateBrief,
  type Translate,
  type TravelBrief,
} from '../../../src/components/AiTravelPlan/aiPlanModel';

const t: Translate = (key) => key;

function brief(overrides: Partial<TravelBrief> = {}): TravelBrief {
  return { ...emptyBrief(), ...overrides };
}

function request(overrides: Partial<TravelPlanRequest> = {}): TravelPlanRequest {
  return {
    travelers: { adults: 2, children: 1, seniors: 0 },
    pace: 'relaxed',
    interests: ['food'],
    transport: 'walking',
    constraints: ['no early starts'],
    ...overrides,
  };
}

function item(name: string): TravelPlanDraftDay['items'][number] {
  return {
    place: { provider: 'amap', providerId: name, name, lat: 29.56, lng: 106.55 },
    arriveAt: null,
    leaveAt: null,
    activity: null,
    travelFromPrevious: null,
    estimatedCostCny: null,
    source: { provider: 'amap', sourceId: name, checkedAt: '2026-05-01 00:00:00', freshness: 'live' },
  };
}

function draft(): TravelPlanDraft {
  return {
    summary: 'three days in Chongqing',
    factsCheckedAt: null,
    days: [
      { date: '2026-05-01', items: [item('a'), item('b')] },
      { date: '2026-05-02', items: [item('c')] },
    ],
    estimatedBudgetCny: { min: 0, max: 0, breakdown: {} },
    warnings: [],
  };
}

describe('aiPlanModel', () => {
  describe('splitList', () => {
    it('FE-AI-MODEL-001: splits on both English and Chinese commas, trims, drops blanks', () => {
      expect(splitList(' 火锅, 夜景 ，, 博物馆 ')).toEqual(['火锅', '夜景', '博物馆']);
    });

    it('FE-AI-MODEL-001b: splits on enumeration commas and semicolons', () => {
      expect(splitList('美食、博物馆、徒步、景区')).toEqual(['美食', '博物馆', '徒步', '景区']);
      expect(splitList('美食；夜景;徒步')).toEqual(['美食', '夜景', '徒步']);
    });

    it('FE-AI-MODEL-002: an empty field is an empty list', () => {
      expect(splitList('   ')).toEqual([]);
    });
  });

  describe('briefToCreateRequest', () => {
    it('FE-AI-MODEL-003: trims every text field and keeps the numbers', () => {
      const result = briefToCreateRequest(
        brief({
          prompt: ' 带我吃三天 ',
          destination: ' 重庆 ',
          origin: ' 成都 ',
          startDate: '2026-05-01',
          endDate: '2026-05-03',
          budgetCny: '3000',
          adults: 2,
          children: 1,
          seniors: 1,
          interests: '火锅, 夜景',
          constraints: '不吃辣',
        })
      );

      expect(result).toEqual({
        prompt: '带我吃三天',
        destination: '重庆',
        origin: '成都',
        startDate: '2026-05-01',
        endDate: '2026-05-03',
        travelers: { adults: 2, children: 1, seniors: 1 },
        budgetCny: 3000,
        pace: 'balanced',
        transport: 'public_transit',
        interests: ['火锅', '夜景'],
        constraints: ['不吃辣'],
      });
    });

    it('FE-AI-MODEL-004: omits empty optional fields instead of sending empty strings', () => {
      const result = briefToCreateRequest(brief({ adults: 2 }));

      expect(result).toEqual({
        travelers: { adults: 2, children: 0, seniors: 0 },
        pace: 'balanced',
        transport: 'public_transit',
        interests: [],
        constraints: [],
      });
      expect('prompt' in result).toBe(false);
      expect('destination' in result).toBe(false);
      expect('budgetCny' in result).toBe(false);
    });

    it('FE-AI-MODEL-005: caps interests and constraints at the contract maximum of 20', () => {
      const many: string[] = [];
      for (let index = 0; index < 25; index += 1) many.push(`entry-${index}`);

      const result = briefToCreateRequest(brief({ interests: many.join(','), constraints: many.join(',') }));

      expect(result.interests).toHaveLength(20);
      expect(result.constraints).toHaveLength(20);
      expect(result.interests?.[19]).toBe('entry-19');
    });
  });

  describe('briefFromRequest', () => {
    it('FE-AI-MODEL-006: puts every request field back into the form, joining list fields', () => {
      const result = briefFromRequest(
        request({
          prompt: 'p',
          destination: 'Chongqing',
          origin: 'Chengdu',
          startDate: '2026-05-01',
          endDate: '2026-05-03',
          budgetCny: 0,
          travelers: { adults: 2, children: 1, seniors: 0 },
          interests: ['food', 'night view'],
          constraints: [],
        })
      );

      expect(result).toEqual(
        brief({
          prompt: 'p',
          destination: 'Chongqing',
          origin: 'Chengdu',
          startDate: '2026-05-01',
          endDate: '2026-05-03',
          budgetCny: '0',
          adults: 2,
          children: 1,
          seniors: 0,
          pace: 'relaxed',
          transport: 'walking',
          interests: 'food, night view',
          constraints: '',
        })
      );
    });

    it('FE-AI-MODEL-007: an absent optional field becomes an empty form field', () => {
      const result = briefFromRequest(request());

      expect(result.prompt).toBe('');
      expect(result.destination).toBe('');
      expect(result.budgetCny).toBe('');
      expect(result.constraints).toBe('no early starts');
    });
  });

  describe('briefDayCount', () => {
    it('FE-AI-MODEL-008: a single-day trip counts as one day, inclusive', () => {
      expect(briefDayCount(brief({ startDate: '2026-05-01', endDate: '2026-05-01' }))).toBe(1);
      expect(briefDayCount(brief({ startDate: '2026-05-01', endDate: '2026-05-03' }))).toBe(3);
    });

    it('FE-AI-MODEL-009: returns null until both dates are valid', () => {
      expect(briefDayCount(brief({ startDate: '2026-05-01' }))).toBeNull();
      expect(briefDayCount(brief({ startDate: 'not-a-date', endDate: '2026-05-03' }))).toBeNull();
    });

    it('FE-AI-MODEL-010: a backwards range goes negative, which validation then refuses', () => {
      expect(briefDayCount(brief({ startDate: '2026-05-03', endDate: '2026-05-01' }))).toBe(-1);
    });
  });

  describe('countDraftPlaces', () => {
    it('FE-AI-MODEL-011: sums every day item and treats a missing draft as zero', () => {
      expect(countDraftPlaces(null)).toBe(0);
      expect(countDraftPlaces(draft())).toBe(3);
    });
  });

  describe('validateBrief', () => {
    it('FE-AI-MODEL-012: requires a prompt or a destination', () => {
      expect(validateBrief(brief(), t)).toBe('planner.ai.promptRequired');
    });

    it('FE-AI-MODEL-013: a prompt alone is enough', () => {
      expect(validateBrief(brief({ prompt: '带父母去重庆' }), t)).toBeNull();
    });

    it('FE-AI-MODEL-014: refuses a backwards date range', () => {
      expect(validateBrief(brief({ destination: '重庆', startDate: '2026-05-03', endDate: '2026-05-01' }), t)).toBe(
        'planner.ai.dateRangeInvalid'
      );
    });

    it('FE-AI-MODEL-015: refuses a range over 14 days', () => {
      expect(validateBrief(brief({ destination: '重庆', startDate: '2026-05-01', endDate: '2026-05-15' }), t)).toBe(
        'planner.ai.dateRangeTooLong'
      );
    });

    it('FE-AI-MODEL-016: accepts the 14-day boundary', () => {
      expect(
        validateBrief(brief({ destination: '重庆', startDate: '2026-05-01', endDate: '2026-05-14' }), t)
      ).toBeNull();
    });

    it('FE-AI-MODEL-017: refuses a non-numeric, negative or over-one-million budget', () => {
      const withBudget = (budgetCny: string): TravelBrief => brief({ destination: '重庆', budgetCny });

      expect(validateBrief(withBudget('abc'), t)).toBe('planner.ai.budgetInvalid');
      expect(validateBrief(withBudget('-1'), t)).toBe('planner.ai.budgetInvalid');
      expect(validateBrief(withBudget('1000001'), t)).toBe('planner.ai.budgetInvalid');
    });

    it('FE-AI-MODEL-018: an empty budget and the one-million boundary are accepted', () => {
      expect(validateBrief(brief({ destination: '重庆', budgetCny: '' }), t)).toBeNull();
      expect(validateBrief(brief({ destination: '重庆', budgetCny: '1000000' }), t)).toBeNull();
    });

    it('FE-AI-MODEL-019: needs at least one traveller', () => {
      expect(validateBrief(brief({ destination: '重庆', adults: 0 }), t)).toBe('planner.ai.travelersInvalid');
    });
  });
});
