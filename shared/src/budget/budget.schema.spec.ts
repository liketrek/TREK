import {
  budgetCreateItemRequestSchema,
  budgetUpdateItemRequestSchema,
  budgetCreateSettlementRequestSchema,
  budgetUpdateSettlementRequestSchema,
  budgetFreezeRatesRequestSchema,
  budgetSettlementQuerySchema,
  budgetUnconvertedSchema,
  budgetUpdateMembersRequestSchema,
  budgetToggleMemberPaidRequestSchema,
  budgetReorderItemsRequestSchema,
  COST_CATEGORIES,
  typeToCostCategory,
} from './budget.schema';

import { describe, it, expect } from 'vitest';

describe('budgetCreateItemRequestSchema', () => {
  it('requires a name; money/meta fields optional + nullable', () => {
    expect(budgetCreateItemRequestSchema.safeParse({ name: 'Hotel' }).success).toBe(true);
    expect(
      budgetCreateItemRequestSchema.safeParse({
        name: 'Hotel',
        total_price: 200,
        persons: null,
      }).success,
    ).toBe(true);
    expect(budgetCreateItemRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('budgetUpdateMembersRequestSchema', () => {
  it('requires a numeric user_ids array', () => {
    expect(budgetUpdateMembersRequestSchema.safeParse({ user_ids: [1, 2] }).success).toBe(true);
    expect(budgetUpdateMembersRequestSchema.safeParse({ user_ids: 'no' }).success).toBe(false);
  });
});

describe('budgetToggleMemberPaidRequestSchema', () => {
  it('requires a boolean paid', () => {
    expect(budgetToggleMemberPaidRequestSchema.safeParse({ paid: true }).success).toBe(true);
    expect(budgetToggleMemberPaidRequestSchema.safeParse({ paid: 'yes' }).success).toBe(false);
  });
});

describe('budgetReorderItemsRequestSchema', () => {
  it('requires numeric ids', () => {
    expect(budgetReorderItemsRequestSchema.safeParse({ orderedIds: [3, 1, 2] }).success).toBe(true);
    expect(budgetReorderItemsRequestSchema.safeParse({ orderedIds: ['a'] }).success).toBe(false);
  });
});

describe('COST_CATEGORIES', () => {
  it('includes fuel and parking alongside the existing fixed categories', () => {
    expect(COST_CATEGORIES).toContain('fuel');
    expect(COST_CATEGORIES).toContain('parking');
  });
});

describe('typeToCostCategory', () => {
  it('files a parking booking under parking, not transport', () => {
    expect(typeToCostCategory('parking')).toBe('parking');
  });

  it('leaves the other vehicle types on transport', () => {
    expect(typeToCostCategory('car-rental')).toBe('transport');
    expect(typeToCostCategory('taxi')).toBe('transport');
  });
});

describe('fallback_fx (rates lent for a write)', () => {
  const fx = { base: 'AUD', rates: { VND: 18241.3 } };

  it('is optional on all four write bodies and kept when well formed', () => {
    const cases = [
      [budgetCreateItemRequestSchema, { name: 'Pho' }],
      [budgetUpdateItemRequestSchema, {}],
      [budgetCreateSettlementRequestSchema, { from_user_id: 1, to_user_id: 2, amount: 10 }],
      [budgetUpdateSettlementRequestSchema, { from_user_id: 1, to_user_id: 2, amount: 10 }],
    ] as const;
    for (const [schema, body] of cases) {
      expect(schema.safeParse(body).success).toBe(true);
      const parsed = schema.safeParse({ ...body, fallback_fx: fx });
      expect(parsed.success).toBe(true);
      expect(parsed.data?.fallback_fx).toEqual(fx);
    }
  });

  const accepted = (fallback_fx: unknown) =>
    budgetCreateItemRequestSchema.safeParse({ name: 'Pho', fallback_fx }).success;

  it('refuses a base or a currency that is not three upper-case letters', () => {
    expect(accepted({ base: 'aud', rates: { VND: 1.5 } })).toBe(false);
    expect(accepted({ base: 'AUDX', rates: { VND: 1.5 } })).toBe(false);
    expect(accepted({ base: 'AUD', rates: { vnd: 1.5 } })).toBe(false);
    expect(accepted({ base: 'AUD', rates: { VNDX: 1.5 } })).toBe(false);
  });

  it('refuses a rate that is zero, negative, NaN, infinite or above 1e9', () => {
    for (const rate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1e9 + 1]) {
      expect(accepted({ base: 'AUD', rates: { VND: rate } })).toBe(false);
    }
    expect(accepted({ base: 'AUD', rates: { VND: 1e9 } })).toBe(true);
    expect(accepted({ base: 'AUD', rates: { VND: 1e-9 } })).toBe(true);
  });

  it('refuses an empty table and one with more than 200 currencies', () => {
    // AAA, AAB, … : n distinct three-letter codes.
    const codes = (n: number) =>
      Object.fromEntries(
        Array.from({ length: n }, (_, i) => [
          String.fromCharCode(65 + Math.floor(i / 676), 65 + (Math.floor(i / 26) % 26), 65 + (i % 26)),
          1.5,
        ]),
      );
    expect(accepted({ base: 'AUD', rates: {} })).toBe(false);
    expect(accepted({ base: 'AUD', rates: codes(200) })).toBe(true);
    expect(accepted({ base: 'AUD', rates: codes(201) })).toBe(false);
  });
});

describe('budgetFreezeRatesRequestSchema', () => {
  it('accepts an empty body and a well-formed fallback table', () => {
    expect(budgetFreezeRatesRequestSchema.safeParse({}).success).toBe(true);
    expect(
      budgetFreezeRatesRequestSchema.safeParse({ fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } }).success,
    ).toBe(true);
    expect(budgetFreezeRatesRequestSchema.safeParse({ fallback_fx: { base: 'AUD', rates: { VND: 0 } } }).success).toBe(
      false,
    );
  });
});

describe('budgetSettlementQuerySchema', () => {
  it('coerces base_rate from the query string and leaves base as it came', () => {
    expect(budgetSettlementQuerySchema.parse({})).toEqual({});
    expect(budgetSettlementQuerySchema.parse({ base: 'eur', base_rate: '0.61' })).toEqual({
      base: 'eur',
      base_rate: 0.61,
    });
  });

  it('refuses a base_rate that is not a positive number in range', () => {
    for (const base_rate of ['abc', '0', '-1', '1e10', '']) {
      expect(budgetSettlementQuerySchema.safeParse({ base_rate }).success).toBe(false);
    }
  });
});

describe('budgetUnconvertedSchema', () => {
  it('lists row ids and currencies', () => {
    expect(budgetUnconvertedSchema.safeParse({ item_ids: [3], settlement_ids: [], currencies: ['VND'] }).success).toBe(
      true,
    );
    expect(budgetUnconvertedSchema.safeParse({ item_ids: ['3'], settlement_ids: [], currencies: [] }).success).toBe(
      false,
    );
  });
});
