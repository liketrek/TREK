// COST-CATEGORY-001 to COST-CATEGORY-003: a typed category read as one of the fixed keys.
import { costCategoryOf } from './cost-category';

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
});
