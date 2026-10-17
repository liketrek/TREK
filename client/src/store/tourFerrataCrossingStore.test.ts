// FE-STORE-FERRATACROSS-001: the stretches a tour climbs a via ferrata, published once per change.
import { describe, expect, it } from 'vitest';
import { publishTourFerrataCrossings, useTourFerrataCrossingStore } from './tourFerrataCrossingStore';

describe('tourFerrataCrossingStore', () => {
  it('FE-STORE-FERRATACROSS-001: keeps the same list when the stretches did not change, and empties to one shared list', () => {
    const crossing = { id: 'group/way/1', name: 'Via A', grade: 'K2', fromM: 100, toM: 400, afterWaypoint: null };
    publishTourFerrataCrossings([crossing]);
    const first = useTourFerrataCrossingStore.getState().crossings;
    publishTourFerrataCrossings([{ ...crossing }]);
    expect(useTourFerrataCrossingStore.getState().crossings).toBe(first);
    publishTourFerrataCrossings([{ ...crossing, toM: 500 }]);
    expect(useTourFerrataCrossingStore.getState().crossings).not.toBe(first);
    publishTourFerrataCrossings([]);
    const empty = useTourFerrataCrossingStore.getState().crossings;
    publishTourFerrataCrossings([]);
    expect(useTourFerrataCrossingStore.getState().crossings).toBe(empty);
    expect(empty).toEqual([]);
  });
});
