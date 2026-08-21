import {
  budgetCreateItemRequestSchema,
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
