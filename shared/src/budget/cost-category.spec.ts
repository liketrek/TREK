// COST-CATEGORY-001 to COST-CATEGORY-005: a typed category read as one of the fixed keys.
import { COST_CATEGORY_HINT, costCategoryOf, storedCostCategory } from './cost-category';

import { describe, expect, it } from 'vitest';

describe('costCategoryOf', () => {
  it('COST-CATEGORY-001: a key stays itself', () => {
    expect(costCategoryOf('food')).toBe('food');
    expect(costCategoryOf('accommodation')).toBe('accommodation');
  });

  it('COST-CATEGORY-002: another case or a common name reads as its key', () => {
    expect(costCategoryOf('Food')).toBe('food');
    expect(costCategoryOf(' FOOD ')).toBe('food');
    expect(costCategoryOf('Flight')).toBe('flights');
    expect(costCategoryOf('Hotel')).toBe('accommodation');
    expect(costCategoryOf('Car park')).toBe('parking');
  });

  it('COST-CATEGORY-003: anything else is no key', () => {
    expect(costCategoryOf('Comida')).toBeNull();
    expect(costCategoryOf('')).toBeNull();
    expect(costCategoryOf(null)).toBeNull();
    expect(costCategoryOf(undefined)).toBeNull();
  });

  it('COST-CATEGORY-004: an expense is stored under the key, other text as given, nothing as other', () => {
    expect(storedCostCategory('Food')).toBe('food');
    expect(storedCostCategory('Train')).toBe('transport');
    expect(storedCostCategory('Comida')).toBe('Comida');
    expect(storedCostCategory('')).toBe('other');
    expect(storedCostCategory(null)).toBe('other');
    expect(storedCostCategory(undefined)).toBe('other');
  });

  it('COST-CATEGORY-005: the hint an assistant reads names every key', () => {
    for (const key of ['accommodation', 'food', 'transport', 'flights', 'other'])
      expect(COST_CATEGORY_HINT).toContain(key);
  });
});
