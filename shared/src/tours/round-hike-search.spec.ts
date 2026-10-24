// TOUR-ROUND-SEARCH-001 to TOUR-ROUND-SEARCH-008: the search for round hikes of about a wished
// length, with the router stood in for: which loops are asked and which are offered (RTE-03).
import { haversineMetres } from '../geo/haversine';
import { spotToward } from './round-hike-geometry';
import {
  deviationOf,
  distanceWindow,
  fitsWish,
  isRoundTarget,
  MAX_ROUND_ASKS,
  ROUND_MAX_M,
  ROUND_MIN_M,
  ROUND_MOST,
  searchRoundLoops,
  type RoundLoop,
} from './round-hike-search';

import { describe, expect, it, vi } from 'vitest';

type Spot = { lat: number; lng: number };

const START = { lat: 47.5, lng: 11.1 };

/** A line through the spots, and its length along them. */
function loopThrough(spots: Spot[]): RoundLoop {
  const points = [START, ...spots, START];
  let distanceM = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) distanceM += haversineMetres(a.lat, a.lng, b.lat, b.lng);
  }
  return { coordinates: points.map(({ lat, lng }): [number, number] => [lat, lng]), via: spots, distanceM };
}

describe('the wished length', () => {
  it('TOUR-ROUND-SEARCH-001: a round fits within a fifth either way, and its deviation is signed', () => {
    const { minM, maxM } = distanceWindow(10_000);
    expect(minM).toBeCloseTo(8_000);
    expect(maxM).toBeCloseTo(12_000);
    expect(fitsWish(8_001, 10_000)).toBe(true);
    expect(fitsWish(11_999, 10_000)).toBe(true);
    expect(fitsWish(7_999, 10_000)).toBe(false);
    expect(fitsWish(12_001, 10_000)).toBe(false);
    expect(deviationOf(10_800, 10_000)).toBeCloseTo(0.08);
    expect(deviationOf(9_500, 10_000)).toBeCloseTo(-0.05);
  });

  it('TOUR-ROUND-SEARCH-002: only a number in range can be asked for', () => {
    expect(isRoundTarget(null)).toBe(false);
    expect(isRoundTarget(Number.NaN)).toBe(false);
    expect(isRoundTarget(ROUND_MIN_M - 1)).toBe(false);
    expect(isRoundTarget(ROUND_MIN_M)).toBe(true);
    expect(isRoundTarget(ROUND_MAX_M)).toBe(true);
    expect(isRoundTarget(ROUND_MAX_M + 1)).toBe(false);
  });
});

describe('searchRoundLoops', () => {
  it('TOUR-ROUND-SEARCH-003: three different rounds within a fifth of the wish, a short first loop asked again larger', async () => {
    const ask = vi.fn(async (spots: Spot[]) => loopThrough(spots));
    const steps: number[] = [];
    const state = await searchRoundLoops(START, 10_000, ask, { onStep: ({ found }) => steps.push(found.length) });
    expect(state.found).toHaveLength(ROUND_MOST);
    expect(state.asked).toBe(4);
    expect(state.answered).toBe(4);
    for (const round of state.found) expect(fitsWish(round.distanceM, 10_000)).toBe(true);
    expect(steps).toEqual([1, 2, 3]);
    for (const [spots] of ask.mock.calls) expect(spots).toHaveLength(3);
  });

  it('TOUR-ROUND-SEARCH-004: a router that never answers leaves nothing answered', async () => {
    const state = await searchRoundLoops(START, 10_000, async () => undefined);
    expect(state).toEqual({ found: [], asked: 6, answered: 0 });
  });

  it('TOUR-ROUND-SEARCH-005: a way there and back is no round, however well it fits', async () => {
    const far = spotToward(START, 0, 5_000);
    const state = await searchRoundLoops(START, 10_000, async () => ({ ...loopThrough([far]), via: [far] }));
    expect(state.found).toEqual([]);
    expect(state.answered).toBeGreaterThan(0);
  });

  it('TOUR-ROUND-SEARCH-006: a loop with a spot off the paths is not asked again at another size', async () => {
    const ask = vi.fn(async () => null);
    const state = await searchRoundLoops(START, 10_000, ask);
    expect(ask).toHaveBeenCalledTimes(6);
    expect(state.found).toEqual([]);
  });

  it('TOUR-ROUND-SEARCH-007: the same round found again is offered once, and the questions stay bounded', async () => {
    const fixed = loopThrough([0, 90, 180].map((bearing) => spotToward(START, bearing, 2_400)));
    expect((await searchRoundLoops(START, 10_000, async () => fixed)).found).toHaveLength(1);
    const huge = loopThrough([spotToward(START, 0, 30_000), spotToward(START, 90, 30_000)]);
    const ask = vi.fn(async () => huge);
    const state = await searchRoundLoops(START, 10_000, ask);
    expect(ask).toHaveBeenCalledTimes(MAX_ROUND_ASKS);
    expect(state).toMatchObject({ found: [], asked: MAX_ROUND_ASKS });
  });

  it('TOUR-ROUND-SEARCH-008: nothing more is asked or heard once the search is called off', async () => {
    const signal = { aborted: false };
    const onStep = vi.fn();
    const ask = vi.fn(async (spots: Spot[]) => {
      signal.aborted = true;
      return loopThrough(spots);
    });
    const state = await searchRoundLoops(START, 10_000, ask, { signal, onStep });
    expect(ask).toHaveBeenCalledTimes(1);
    expect(onStep).not.toHaveBeenCalled();
    expect(state.answered).toBe(0);
  });
});
