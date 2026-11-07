// COST-CATEGORY-001 to COST-CATEGORY-008: a typed category read as one of the fixed keys.
import { RESERVATION_TYPES } from '../reservation/reservation-types';
import { COST_CATEGORIES } from './budget.schema';
import {
  COST_CATEGORY_HINT,
  costCategoryOf,
  isDerivedCostCategory,
  storedCostCategory,
  typeToCostCategory,
} from './cost-category';

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

  it('COST-CATEGORY-006: every booking type is filed under a key, the same one on every path', () => {
    for (const { type } of RESERVATION_TYPES) {
      expect(COST_CATEGORIES).toContain(typeToCostCategory(type));
      // The MCP stores the raw type through storedCostCategory; it must land where the form puts it.
      expect(storedCostCategory(type)).toBe(typeToCostCategory(type));
    }
    expect(typeToCostCategory('event')).toBe('activities');
    expect(typeToCostCategory('cable_car')).toBe('transport');
    expect(typeToCostCategory('car-rental')).toBe('transport');
    expect(typeToCostCategory('car rental')).toBe('transport');
  });

  it('COST-CATEGORY-007: a type no key stands for is filed under other', () => {
    expect(typeToCostCategory('spaceship')).toBe('other');
    expect(typeToCostCategory('')).toBe('other');
    expect(typeToCostCategory(null)).toBe('other');
    expect(typeToCostCategory(undefined)).toBe('other');
  });

  it('COST-CATEGORY-008: an expense moves with its booking type only while it carries the derived category', () => {
    expect(isDerivedCostCategory('flights', 'flight')).toBe(true);
    expect(isDerivedCostCategory('Flight', 'flight')).toBe(true);
    expect(isDerivedCostCategory('other', 'event')).toBe(true);
    expect(isDerivedCostCategory('activities', 'event')).toBe(true);
    expect(isDerivedCostCategory('other', 'flight')).toBe(false);
    expect(isDerivedCostCategory('food', 'train')).toBe(false);
  });
});
