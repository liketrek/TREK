// FE-TOUR-ROUND-ROUTING-001 to FE-TOUR-ROUND-ROUTING-007: looking for round hikes of about a wished
// length with the router, leaving out what misses, walks its ground twice or repeats a round (RTE-03).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { valhallaRun, enrichTourElevations } = vi.hoisted(() => ({
  valhallaRun: vi.fn(),
  enrichTourElevations: vi.fn(),
}));

vi.mock('../../Map/valhallaRoute', () => ({ valhallaRun }));
vi.mock('./tourRouting', () => ({ enrichTourElevations }));

import { fitsWish, MAX_ROUND_ASKS, spotToward } from '@trek/shared';
import { findRoundHikes, type RoundSearchReport } from './roundHikeRouting';
import type { RoundRequest } from './roundHikes';

type Spot = { lat: number; lng: number };

const START = { lat: 47.5, lng: 11.1 };
const REQUEST: RoundRequest = {
  startId: 'a',
  start: START,
  targetM: 10_000,
  costing: { max_hiking_difficulty: 3, use_hills: 0.2 },
  key: 'a#10000',
};

/** The router's answer for a chain drawn as the line through its points, each point met where it was asked. */
function runThrough(points: Spot[], snappedMeters = 0) {
  return {
    legs: [],
    total: {
      coordinates: points.map(({ lat, lng }): [number, number] => [lat, lng]),
      distance: 0,
      duration: 0,
      hasToll: false,
      hasHighway: false,
      hasFerry: false,
    },
    snapped: points.map(({ lat, lng }) => ({ asked: [lat, lng], at: [lat, lng], meters: snappedMeters })),
  };
}

async function search(signal = new AbortController().signal) {
  const reports: RoundSearchReport[] = [];
  await findRoundHikes(REQUEST, signal, (report) => reports.push(report));
  return reports;
}

beforeEach(() => {
  vi.clearAllMocks();
  enrichTourElevations.mockImplementation(async (line: [number, number][]) =>
    line.map(([lat, lng], index): [number, number, number] => [lat, lng, 1000 + (index % 2) * 50])
  );
});

describe('findRoundHikes', () => {
  it('FE-TOUR-ROUND-ROUTING-001: three different rounds back to the start within a fifth of the wish, asked on foot under the hike’s rules', async () => {
    // A router that walks straight between the points: the first loop comes out short and is asked again larger.
    valhallaRun.mockImplementation(async (points: Spot[]) => runThrough(points));
    const reports = await search();

    expect(valhallaRun).toHaveBeenCalledTimes(4);
    for (const [points, mode, avoid, , costing] of valhallaRun.mock.calls) {
      expect(points[0]).toEqual(START);
      expect(points[points.length - 1]).toEqual(START);
      expect(points).toHaveLength(5);
      expect([mode, avoid, costing]).toEqual(['walking', [], REQUEST.costing]);
    }
    const last = reports[reports.length - 1];
    expect(last.phase).toBe('done');
    expect(last.asked).toBe(4);
    expect(last.candidates.map((round) => round.key)).toEqual(['a', 'b', 'c']);
    for (const round of last.candidates) {
      expect(round.coordinates[0]).toEqual([START.lat, START.lng]);
      expect(round.coordinates[round.coordinates.length - 1]).toEqual([START.lat, START.lng]);
      expect(fitsWish(round.distanceM, REQUEST.targetM)).toBe(true);
      // The spots the loop was steered through, where the line met them: the round's shaping points.
      expect(round.via).toHaveLength(3);
      expect(round.heights).toBe('known');
      expect(round.gainM).toBeGreaterThan(0);
      expect(round.minutes).toBeGreaterThan(0);
    }
    // The rounds show up as they are found, then their heights one after the other.
    expect(reports.map((report) => report.phase)).toEqual([
      'searching',
      'searching',
      'searching',
      'done',
      'done',
      'done',
      'done',
    ]);
    expect(reports[3].candidates.every((round) => round.heights === 'pending')).toBe(true);
    expect(enrichTourElevations).toHaveBeenCalledTimes(3);
  });

  it('FE-TOUR-ROUND-ROUTING-002: a router that never answers fails the search', async () => {
    valhallaRun.mockResolvedValue(null);
    const reports = await search();
    const last = reports[reports.length - 1];
    expect(last).toEqual({ phase: 'failed', candidates: [], asked: 6 });
    expect(enrichTourElevations).not.toHaveBeenCalled();
  });

  it('FE-TOUR-ROUND-ROUTING-003: a way there and back is no round, however well it fits the length', async () => {
    const far = spotToward(START, 0, 5_000);
    valhallaRun.mockResolvedValue(runThrough([START, far, START]));
    const reports = await search();
    expect(reports[reports.length - 1]).toMatchObject({ phase: 'done', candidates: [] });
  });

  it('FE-TOUR-ROUND-ROUTING-004: a loop whose spots lie too far from any path is not offered', async () => {
    valhallaRun.mockImplementation(async (points: Spot[]) => runThrough(points, 900));
    const reports = await search();
    expect(reports[reports.length - 1]).toMatchObject({ phase: 'done', candidates: [] });
    // One question per direction: a spot off the paths is not asked again at another size.
    expect(valhallaRun).toHaveBeenCalledTimes(6);
  });

  it('FE-TOUR-ROUND-ROUTING-005: the same round found again is offered once', async () => {
    const fixed = runThrough([START, ...[0, 90, 180].map((bearing) => spotToward(START, bearing, 2_400)), START]);
    valhallaRun.mockResolvedValue(fixed);
    const reports = await search();
    expect(reports[reports.length - 1].candidates).toHaveLength(1);
  });

  it('FE-TOUR-ROUND-ROUTING-006: a loop that misses the length twice in a row is let go, and the questions stay bounded', async () => {
    // Every loop comes back far too long, whatever its size.
    const huge = runThrough([START, spotToward(START, 0, 30_000), spotToward(START, 90, 30_000), START]);
    valhallaRun.mockResolvedValue(huge);
    const reports = await search();
    expect(valhallaRun).toHaveBeenCalledTimes(MAX_ROUND_ASKS);
    expect(reports[reports.length - 1]).toMatchObject({ phase: 'done', candidates: [], asked: MAX_ROUND_ASKS });
  });

  it('FE-TOUR-ROUND-ROUTING-007: nothing is reported once the search is called off, and rounds without heights keep their length', async () => {
    const controller = new AbortController();
    valhallaRun.mockImplementation(async (points: Spot[]) => {
      controller.abort();
      return runThrough(points);
    });
    expect(await search(controller.signal)).toEqual([]);

    valhallaRun.mockImplementation(async (points: Spot[]) => runThrough(points));
    enrichTourElevations.mockResolvedValue(null);
    const reports = await search();
    const round = reports[reports.length - 1].candidates[0];
    expect(round).toMatchObject({ heights: 'unknown', gainM: null, lossM: null, minutes: null });
    expect(round.distanceM).toBeGreaterThan(0);
  });
});
