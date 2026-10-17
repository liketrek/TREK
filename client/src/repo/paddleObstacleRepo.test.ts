// FE-REPO-PADDLEOBS-001 to FE-REPO-PADDLEOBS-012: the online paddle obstacle read, tiled under the cap and merged.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PADDLE_OBSTACLES_MAX_SPAN_DEG,
  type PaddleCoverageRegion,
  type PaddleCoverageState,
  type PaddleFeature,
  type PaddleObstaclesResponse,
} from '@trek/shared';

import { paddleObstaclesApi } from '../api/paddleObstacles';
import { isEffectivelyOffline } from '../sync/networkMode';
import { PaddleObstaclesOfflineError, paddleObstacleRepo, tilesAround, type Tile } from './paddleObstacleRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/paddleObstacles', () => ({ paddleObstaclesApi: { inBox: vi.fn() } }));

const inBox = vi.mocked(paddleObstaclesApi.inBox);
const offline = vi.mocked(isEffectivelyOffline);

/** Three points whose box, with the margin, is 1.52 degrees high and 2.02 wide. */
const LONG_LINE: [number, number][] = [
  [48.2, 11],
  [49.5, 12.2],
  [48, 13],
];

function feature(ref: string, regionId: string, kind: PaddleFeature['kind'] = 'weir'): PaddleFeature {
  return {
    ref,
    kind,
    group_key: null,
    name: null,
    geometry: { type: 'Point', coordinates: [12.13, 49.12] },
    tags: { waterway: kind },
    tag_hash: `${regionId}:${ref}`,
    region_id: regionId,
  };
}

function region(id: string, name: string): PaddleCoverageRegion {
  return { id, name, source_timestamp: '2026-09-30T00:00:00Z', imported_at: '2026-10-01T06:00:00Z' };
}

function answer(
  features: PaddleFeature[],
  extra: { state?: PaddleCoverageState; regions?: PaddleCoverageRegion[]; truncated?: boolean } = {}
): PaddleObstaclesResponse {
  return {
    features,
    coverage: { state: extra.state ?? 'covered', regions: extra.regions ?? [] },
    truncated: extra.truncated ?? false,
  };
}

/** The index-th tile of a row along 49 degrees north, each 0.8 degrees wide. */
function tileAt(index: number): Tile {
  return { south: 49, west: 12 + index * 0.8, north: 49.8, east: 12.8 + index * 0.8 };
}

const round = (value: number): number => Number(value.toFixed(6));

/** Each tile as [south, west, north, east], rounded past the float noise of the stepping. */
function rounded(tiles: readonly Tile[]): number[][] {
  return tiles.map((tile) => [tile.south, tile.west, tile.north, tile.east].map(round));
}

beforeEach(() => {
  vi.resetAllMocks();
  offline.mockReturnValue(false);
  inBox.mockResolvedValue(answer([]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tilesAround', () => {
  it('FE-REPO-PADDLEOBS-001: a line without points asks for no tile', () => {
    expect(tilesAround([])).toEqual([]);
  });

  it('FE-REPO-PADDLEOBS-002: a short line is one tile, its box widened by the margin on every side', () => {
    const line: [number, number][] = [
      [49.1, 12.3],
      [49.2, 12.1],
    ];
    expect(rounded(tilesAround(line))).toEqual([[49.09, 12.09, 49.21, 12.31]]);
    expect(rounded(tilesAround([[-34.6, -58.4]]))).toEqual([[-34.61, -58.41, -34.59, -58.39]]);
  });

  it('FE-REPO-PADDLEOBS-003: a long line is split row by row into tiles under the cap that leave no gap', () => {
    const tiles = tilesAround(LONG_LINE);
    expect(rounded(tiles)).toEqual([
      [47.99, 10.99, 48.79, 11.79],
      [47.99, 11.79, 48.79, 12.59],
      [47.99, 12.59, 48.79, 13.01],
      [48.79, 10.99, 49.51, 11.79],
      [48.79, 11.79, 49.51, 12.59],
      [48.79, 12.59, 49.51, 13.01],
    ]);
    for (const tile of tiles) {
      expect(tile.north - tile.south).toBeLessThan(PADDLE_OBSTACLES_MAX_SPAN_DEG);
      expect(tile.east - tile.west).toBeLessThan(PADDLE_OBSTACLES_MAX_SPAN_DEG);
    }
  });
});

describe('paddleObstacleRepo.inTiles', () => {
  it('FE-REPO-PADDLEOBS-004: asks once per tile with the signal and keeps an object two tiles read once', async () => {
    const weir = feature('way/1', 'bayern');
    const lock = feature('node/2', 'bayern', 'lock');
    const rapids = feature('node/3', 'bayern', 'rapids');
    inBox.mockResolvedValueOnce(answer([weir, lock]));
    inBox.mockResolvedValueOnce(answer([weir, rapids]));
    const signal = new AbortController().signal;

    const result = await paddleObstacleRepo.inTiles([tileAt(0), tileAt(1)], signal);

    expect(inBox).toHaveBeenCalledTimes(2);
    expect(inBox).toHaveBeenNthCalledWith(1, tileAt(0), signal);
    expect(inBox).toHaveBeenNthCalledWith(2, tileAt(1), signal);
    expect(result.features).toEqual([weir, lock, rapids]);
  });

  it('FE-REPO-PADDLEOBS-005: an object two regions hold at their border is one object, as first read', async () => {
    const fromBayern = feature('way/7', 'bayern');
    const fromThueringen = feature('way/7', 'thueringen');
    const slipway = feature('node/8', 'thueringen', 'slipway');
    inBox.mockResolvedValueOnce(answer([fromBayern]));
    inBox.mockResolvedValueOnce(answer([fromThueringen, slipway]));
    expect((await paddleObstacleRepo.inTiles([tileAt(0), tileAt(1)])).features).toEqual([fromBayern, slipway]);

    inBox.mockResolvedValueOnce(answer([fromThueringen, fromBayern]));
    expect((await paddleObstacleRepo.inTiles([tileAt(0)])).features).toEqual([fromThueringen]);
  });

  it('FE-REPO-PADDLEOBS-006: the weakest coverage among the tiles is the coverage of the whole', async () => {
    async function coverageOf(states: PaddleCoverageState[]): Promise<PaddleCoverageState> {
      for (const state of states) inBox.mockResolvedValueOnce(answer([], { state }));
      const result = await paddleObstacleRepo.inTiles(states.map((_state, index) => tileAt(index)));
      return result.coverage;
    }

    expect(await coverageOf(['covered', 'covered'])).toBe('covered');
    expect(await coverageOf(['covered', 'partial', 'covered'])).toBe('partial');
    expect(await coverageOf(['partial', 'none', 'covered'])).toBe('none');
    expect(await coverageOf(['none', 'partial'])).toBe('none');
  });

  it('FE-REPO-PADDLEOBS-007: the read counts as cut when any one tile was cut', async () => {
    async function truncatedOf(cuts: boolean[]): Promise<boolean> {
      for (const truncated of cuts) inBox.mockResolvedValueOnce(answer([feature('way/1', 'bayern')], { truncated }));
      const result = await paddleObstacleRepo.inTiles(cuts.map((_cut, index) => tileAt(index)));
      return result.truncated;
    }

    expect(await truncatedOf([false, true, false])).toBe(true);
    expect(await truncatedOf([false, false])).toBe(false);
  });

  it('FE-REPO-PADDLEOBS-008: the regions of all tiles are merged, each region once', async () => {
    const bayern = region('bayern', 'Bayern');
    const thueringen = region('thueringen', 'Thüringen');
    inBox.mockResolvedValueOnce(answer([], { regions: [bayern] }));
    inBox.mockResolvedValueOnce(answer([], { state: 'partial', regions: [bayern, thueringen] }));

    const result = await paddleObstacleRepo.inTiles([tileAt(0), tileAt(1)]);

    expect(result.regions).toEqual([bayern, thueringen]);
    expect(result.coverage).toBe('partial');
  });

  it('FE-REPO-PADDLEOBS-009: no tile asks nothing and claims no coverage', async () => {
    await expect(paddleObstacleRepo.inTiles([])).resolves.toEqual({
      features: [],
      coverage: 'none',
      regions: [],
      truncated: false,
    });
    expect(inBox).not.toHaveBeenCalled();
  });

  it('FE-REPO-PADDLEOBS-010: offline it refuses with its own error and makes no request', async () => {
    offline.mockReturnValue(true);

    await expect(paddleObstacleRepo.inTiles([tileAt(0)])).rejects.toBeInstanceOf(PaddleObstaclesOfflineError);
    await expect(paddleObstacleRepo.around(LONG_LINE)).rejects.toMatchObject({
      name: 'PaddleObstaclesOfflineError',
      message: 'Paddle obstacles need a connection',
    });
    expect(inBox).not.toHaveBeenCalled();
  });

  it('FE-REPO-PADDLEOBS-011: a failing tile fails the whole read instead of a route that looks free', async () => {
    inBox.mockResolvedValueOnce(answer([feature('way/1', 'bayern')]));
    inBox.mockRejectedValueOnce(new Error('Network Error'));

    await expect(paddleObstacleRepo.inTiles([tileAt(0), tileAt(1)])).rejects.toThrow('Network Error');
  });
});

describe('paddleObstacleRepo.around', () => {
  it('FE-REPO-PADDLEOBS-012: reads the tiles around the line with the signal and merges their answers', async () => {
    const inTiles = vi.spyOn(paddleObstacleRepo, 'inTiles');
    const weir = feature('way/1', 'bayern');
    const bayern = region('bayern', 'Bayern');
    inBox.mockResolvedValue(answer([weir], { regions: [bayern] }));
    const signal = new AbortController().signal;

    const result = await paddleObstacleRepo.around(LONG_LINE, signal);

    expect(inTiles).toHaveBeenCalledWith(tilesAround(LONG_LINE), signal);
    expect(inBox).toHaveBeenCalledTimes(6);
    for (const tile of tilesAround(LONG_LINE)) expect(inBox).toHaveBeenCalledWith(tile, signal);
    expect(result).toEqual({ features: [weir], coverage: 'covered', regions: [bayern], truncated: false });
  });
});
