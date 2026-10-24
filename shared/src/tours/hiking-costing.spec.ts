import { hikingCosting, hikingCostingOptions, TOURS_MAX_HIKING_DIFFICULTY } from './hiking-costing';

import { describe, expect, it } from 'vitest';

describe('hikingCostingOptions (MF-08, RTE-01)', () => {
  it('HIKE-COST-001: asks the router only for what was switched on, in the options it was checked with', () => {
    expect(hikingCostingOptions(null)).toEqual({});
    expect(hikingCostingOptions(undefined)).toEqual({});
    expect(hikingCostingOptions({ avoid_steps: false })).toEqual({});
    expect(hikingCostingOptions({ avoid_climbs: true, avoid_steps: true, avoid_ferries: true })).toEqual({
      use_hills: 0.2,
      step_penalty: 600,
      use_ferry: 0,
    });
  });
});

describe('hikingCosting (RTE-02)', () => {
  it('HIKE-COST-002: weighs the whole tour and one of its sections alike: the limit with the preferences', () => {
    expect(hikingCosting()).toEqual({ max_hiking_difficulty: 2 });
    expect(hikingCosting(4, { avoid_steps: true })).toEqual({ max_hiking_difficulty: 4, step_penalty: 600 });
  });

  it('HIKE-COST-003: falls back to T2 only where no limit is given, and names the limit first', () => {
    expect(TOURS_MAX_HIKING_DIFFICULTY).toBe(2);
    expect(Object.keys(hikingCosting(6, { avoid_ferries: true, avoid_climbs: true }))).toEqual([
      'max_hiking_difficulty',
      'use_hills',
      'use_ferry',
    ]);
  });
});
