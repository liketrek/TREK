import { BIKE_COSTING, bikeCosting, RUN_COSTING, runCosting } from './tour-costing';
import { BIKE_PROFILES, RUN_PROFILES } from './tours.schema';

import { describe, expect, it } from 'vitest';

describe('tour costing (BIK-01, RUN-01)', () => {
  it('TOUR-COST-001: every bike profile asks the bicycle costing for its own bicycle type', () => {
    expect(BIKE_PROFILES.map((profile) => bikeCosting(profile).bicycle_type)).toEqual([
      'Hybrid',
      'Road',
      'Cross',
      'Mountain',
    ]);
    expect(bikeCosting('road')).toBe(BIKE_COSTING.road);
  });

  it('TOUR-COST-002: a run avoids ferries whatever its profile, and only a trail run takes T2 paths', () => {
    for (const profile of RUN_PROFILES) expect(runCosting(profile).use_ferry).toBe(0);
    expect(runCosting('running')).toEqual({ use_tracks: 0, use_ferry: 0 });
    expect(RUN_COSTING.trail.max_hiking_difficulty).toBe(2);
  });
});
