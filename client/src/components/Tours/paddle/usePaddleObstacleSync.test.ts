/**
 * FE-HOOK-PADDLESYNC-001 to FE-HOOK-PADDLESYNC-008: how the planner keeps the
 * paddle obstacle store in step with the paddle tour it has open.
 *
 * The hook asks the repo for the tiles around the line, snapped outward to a
 * 0.05 degree grid, relates what came back to the line as it is now and
 * publishes both, with the length the relations were measured along. A point
 * moved inside the same tiles asks nothing new, an answer for an area the line
 * has left is dropped, and with no paddle tour open, or a line too short to
 * paddle, the store is emptied.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleCoverageRegion, PaddleFeature, PaddleGeometry, PaddleObstacleKind } from '@trek/shared';

import {
  PaddleObstaclesOfflineError,
  paddleObstacleRepo,
  type PaddleObstaclesAround,
  type Tile,
} from '../../../repo/paddleObstacleRepo';
import {
  clearPaddleObstacles,
  publishPaddleObstacles,
  selectPaddleObstacle,
  usePaddleObstacleStore,
} from '../../../store/paddleObstacleStore';
import { usePaddleObstacleSync } from './usePaddleObstacleSync';

// Only the request is answered here: the offline error and the tile maths stay the repo's own.
vi.mock('../../../repo/paddleObstacleRepo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../repo/paddleObstacleRepo')>();
  return { ...actual, paddleObstacleRepo: { ...actual.paddleObstacleRepo, inTiles: vi.fn() } };
});

type Line = readonly (readonly [number, number])[];

interface Props {
  line: Line | null;
  active: boolean;
}

/** A kilometre of river running north, [lat, lng] as the planner draws it. */
const LINE: Line = [
  [46.5, 11.8],
  [46.51, 11.8],
];
/** Its first point dragged 100 m east: still inside the same snapped tiles. */
const MOVED: Line = [
  [46.5, 11.8013],
  [46.51, 11.8],
];
/** A line in another area altogether. */
const FAR_LINE: Line = [
  [47, 12],
  [47.01, 12],
];

/** The tile LINE (and MOVED) asks for, snapped outward to the 0.05 degree grid. */
const LINE_TILE: Tile = { south: 46.45, west: 11.75, north: 46.55, east: 11.85 };
const FAR_TILE: Tile = { south: 46.95, west: 11.95, north: 47.05, east: 12.05 };

const feature = (ref: string, kind: PaddleObstacleKind, geometry: PaddleGeometry): PaddleFeature => ({
  ref,
  kind,
  group_key: null,
  name: null,
  geometry,
  tags: {},
  tag_hash: `${ref}-hash`,
  region_id: 'bavaria',
});

/** Across the river halfway down LINE; geometry is [lng, lat], as OSM gives it. */
const WEIR = feature('way/1', 'weir', {
  type: 'LineString',
  coordinates: [
    [11.799, 46.505],
    [11.801, 46.505],
  ],
});
/** On the east bank, 100 m off LINE: near it, and on the line once its first point moves east. */
const SLIPWAY = feature('node/2', 'slipway', { type: 'Point', coordinates: [11.8013, 46.502] });
/** Several kilometres east: read with the area, related to no line. */
const DAM = feature('way/3', 'dam', { type: 'Point', coordinates: [11.9, 46.505] });
/** On FAR_LINE. */
const LOCK = feature('node/4', 'lock', { type: 'Point', coordinates: [12, 47.005] });

const REGION: PaddleCoverageRegion = {
  id: 'bavaria',
  name: 'Bavaria',
  source_timestamp: '2026-09-01T00:00:00Z',
  imported_at: '2026-09-02T08:00:00Z',
};

/** What the repo reads around LINE: one region only partly covering it, and cut at the cap. */
const ANSWER: PaddleObstaclesAround = {
  features: [WEIR, SLIPWAY, DAM],
  coverage: 'partial',
  regions: [REGION],
  truncated: true,
};
const FAR_ANSWER: PaddleObstaclesAround = {
  features: [LOCK],
  coverage: 'covered',
  regions: [REGION],
  truncated: false,
};

const inTiles = vi.mocked(paddleObstacleRepo.inTiles);
const state = () => usePaddleObstacleStore.getState();

function renderSync(props: Props) {
  return renderHook(({ line, active }: Props) => usePaddleObstacleSync(line, active), { initialProps: props });
}

/** A request the test answers by hand, so the state while it is on its way can be read. */
function deferred() {
  let resolve: (value: PaddleObstaclesAround) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<PaddleObstaclesAround>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** Lets a settled request run its handlers and the store follow. */
async function drain() {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  });
}

/** What a tour opened before left in the store, so a test can see it emptied. */
function seed() {
  publishPaddleObstacles({
    status: 'ready',
    features: [WEIR],
    related: [],
    routeLengthM: 500,
    coverage: 'covered',
    regions: [REGION],
    truncated: false,
  });
}

describe('usePaddleObstacleSync', () => {
  beforeEach(() => {
    inTiles.mockReset();
    inTiles.mockResolvedValue(ANSWER);
    clearPaddleObstacles();
  });

  it('FE-HOOK-PADDLESYNC-001: publishes loading while asking, then the objects, the related ones and the coverage', async () => {
    const pending = deferred();
    inTiles.mockReturnValueOnce(pending.promise);
    renderSync({ line: LINE, active: true });

    expect(inTiles).toHaveBeenCalledWith([LINE_TILE], expect.any(AbortSignal));
    expect(state()).toMatchObject({
      status: 'loading',
      features: [],
      related: [],
      coverage: 'none',
      regions: [],
      truncated: false,
    });
    expect(state().routeLengthM).toBeCloseTo(1111.95, 1);

    pending.resolve(ANSWER);
    await drain();

    expect(state()).toMatchObject({
      status: 'ready',
      features: [WEIR, SLIPWAY, DAM],
      coverage: 'partial',
      regions: [REGION],
      truncated: true,
    });
    // In the order the line reaches them; the dam is too far off to relate.
    expect(state().related).toMatchObject([
      { feature: { ref: 'node/2' }, relation: 'near' },
      { feature: { ref: 'way/1' }, relation: 'on_route', distanceM: 0, alongM: 556 },
    ]);
    expect(state().routeLengthM).toBeCloseTo(1111.95, 1);
    expect(inTiles).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-PADDLESYNC-002: offline it reports the data out of reach, never a route free of obstacles', async () => {
    inTiles.mockRejectedValue(new PaddleObstaclesOfflineError());
    renderSync({ line: LINE, active: true });
    await drain();

    expect(state()).toMatchObject({ status: 'offline', features: [], related: [], coverage: 'none', regions: [] });
    expect(state().routeLengthM).toBeCloseTo(1111.95, 1);
  });

  it('FE-HOOK-PADDLESYNC-003: a failed request reads as an error, not as offline', async () => {
    inTiles.mockRejectedValue(new Error('502'));
    renderSync({ line: LINE, active: true });
    await drain();

    expect(state()).toMatchObject({ status: 'error', features: [], related: [], coverage: 'none' });
  });

  it.each<[string, Props]>([
    ['switched off', { line: LINE, active: false }],
    ['without a line', { line: null, active: true }],
    ['for a line of one point', { line: [[46.5, 11.8]], active: true }],
  ])('FE-HOOK-PADDLESYNC-004: asks for nothing and empties the store %s', async (_label, props) => {
    seed();
    renderSync(props);
    await drain();

    expect(inTiles).not.toHaveBeenCalled();
    expect(state()).toMatchObject({ status: 'idle', features: [], related: [], routeLengthM: 0, regions: [] });
  });

  it('FE-HOOK-PADDLESYNC-005: a point moved inside the same tiles asks nothing new, a line that leaves them asks again', async () => {
    const far = deferred();
    inTiles.mockResolvedValueOnce(ANSWER).mockReturnValueOnce(far.promise);
    const { rerender } = renderSync({ line: LINE, active: true });
    await drain();
    selectPaddleObstacle('way/1');

    rerender({ line: MOVED, active: true });
    await drain();
    expect(inTiles).toHaveBeenCalledTimes(1);
    // Related to the line as it is now: the slipway is on it, and the open card stays open.
    expect(state()).toMatchObject({ status: 'ready', selectedRef: 'way/1' });
    expect(state().related).toMatchObject([
      { feature: { ref: 'node/2' }, relation: 'on_route' },
      { feature: { ref: 'way/1' }, relation: 'on_route' },
    ]);
    expect(state().routeLengthM).toBeCloseTo(1116.39, 1);

    rerender({ line: FAR_LINE, active: true });
    expect(inTiles).toHaveBeenCalledTimes(2);
    expect(inTiles).toHaveBeenLastCalledWith([FAR_TILE], expect.any(AbortSignal));
    // The old area's objects are not shown around the new line while it loads.
    expect(state()).toMatchObject({ status: 'loading', features: [], related: [], selectedRef: null });

    far.resolve(FAR_ANSWER);
    await drain();
    expect(state()).toMatchObject({ status: 'ready', features: [LOCK], coverage: 'covered' });
    expect(state().related).toMatchObject([{ feature: { ref: 'node/4' }, relation: 'on_route' }]);
  });

  it.each(['answers', 'fails'] as const)(
    'FE-HOOK-PADDLESYNC-006: keeps the new area when the request for the old one %s late',
    async (outcome) => {
      const old = deferred();
      inTiles.mockReturnValueOnce(old.promise).mockResolvedValueOnce(FAR_ANSWER);
      const { rerender } = renderSync({ line: LINE, active: true });
      rerender({ line: FAR_LINE, active: true });
      await drain();
      expect(inTiles.mock.calls[0]?.[1]?.aborted).toBe(true);
      expect(state().status).toBe('ready');

      if (outcome === 'answers') old.resolve(ANSWER);
      else old.reject(new Error('502'));
      await drain();

      expect(state()).toMatchObject({ status: 'ready', features: [LOCK], coverage: 'covered' });
    }
  );

  it('FE-HOOK-PADDLESYNC-007: switching the paddle tour off empties the store and closes the open card', async () => {
    const { rerender } = renderSync({ line: LINE, active: true });
    await drain();
    selectPaddleObstacle('way/1');
    expect(state().status).toBe('ready');

    rerender({ line: LINE, active: false });
    expect(state()).toMatchObject({ status: 'idle', features: [], related: [], routeLengthM: 0, selectedRef: null });
    expect(inTiles).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-PADDLESYNC-008: empties the store when the planner closes', async () => {
    const { unmount } = renderSync({ line: LINE, active: true });
    await drain();
    selectPaddleObstacle('way/1');
    expect(state()).toMatchObject({ status: 'ready', selectedRef: 'way/1' });

    unmount();
    expect(state()).toEqual({
      status: 'idle',
      features: [],
      related: [],
      routeLengthM: 0,
      coverage: 'none',
      regions: [],
      truncated: false,
      selectedRef: null,
      focus: null,
    });
  });
});
