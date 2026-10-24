import {
  FERRATA_TILE_DEG,
  FERRATA_TILES_PER_REQUEST_SIDE,
  ferrataTileAt,
  ferrataTileCount,
  ferrataTileKey,
  ferrataTileRange,
  ferrataTileRangeBbox,
  ferrataTileBlockKey,
  ferrataTileRequests,
  ferrataTilesOf,
  growFerrataTileRange,
  parseFerrataTileKey,
  snapFerrataBbox,
} from './ferrataGrid';
import { ferrataBboxSpanOk } from './ferratas.schema';

import { describe, expect, it } from 'vitest';

describe('ferrataGrid', () => {
  it('uses one 0.05 degree cell and two cells per request side', () => {
    expect(FERRATA_TILE_DEG).toBe(0.05);
    expect(FERRATA_TILES_PER_REQUEST_SIDE).toBe(2);
  });

  it('snaps a box outwards to the grid and clamps it to the globe', () => {
    expect(snapFerrataBbox({ south: 46.51, west: 11.72, north: 46.58, east: 11.81 })).toEqual({
      south: 46.5,
      west: 11.7,
      north: 46.6,
      east: 11.85,
    });
    // An edge already on a grid line stays where it is, float noise or not.
    expect(snapFerrataBbox({ south: 46.15, west: 11.7, north: 46.2, east: 11.75 })).toEqual({
      south: 46.15,
      west: 11.7,
      north: 46.2,
      east: 11.75,
    });
    expect(snapFerrataBbox({ south: -90, west: -180, north: 90, east: 180 })).toEqual({
      south: -90,
      west: -180,
      north: 90,
      east: 180,
    });
  });

  it('names the tile a point lies in, a point on a grid line in the tile north east of it', () => {
    expect(ferrataTileAt(46.52, 11.81)).toEqual({ row: 930, col: 236 });
    expect(ferrataTileAt(46.15, 11.7)).toEqual({ row: 923, col: 234 });
    expect(ferrataTileAt(-0.01, -0.01)).toEqual({ row: -1, col: -1 });
    // The poles and the antimeridian stay inside the grid.
    expect(ferrataTileAt(90, 180)).toEqual({ row: 1799, col: 3599 });
  });

  it('round-trips a tile through its key and refuses anything else', () => {
    expect(parseFerrataTileKey(ferrataTileKey({ row: -12, col: 340 }))).toEqual({ row: -12, col: 340 });
    expect(parseFerrataTileKey('930:236')).toEqual({ row: 930, col: 236 });
    expect(parseFerrataTileKey('930,236')).toBeNull();
    expect(parseFerrataTileKey('99999:1')).toBeNull();
    expect(parseFerrataTileKey('')).toBeNull();
  });

  it('covers a box with the tiles it touches, not the next row on a grid line', () => {
    const range = ferrataTileRange({ south: 46.5, west: 11.7, north: 46.6, east: 11.81 });
    expect(range).toEqual({ minRow: 930, maxRow: 931, minCol: 234, maxCol: 236 });
    expect(ferrataTileCount(range)).toBe(6);
    expect(ferrataTilesOf(range).map(ferrataTileKey)).toEqual([
      '930:234',
      '930:235',
      '930:236',
      '931:234',
      '931:235',
      '931:236',
    ]);
    expect(ferrataTileRangeBbox(range)).toEqual({ south: 46.5, west: 11.7, north: 46.6, east: 11.85 });
  });

  it('grows a range by a ring on every side', () => {
    const range = { minRow: 930, maxRow: 931, minCol: 234, maxCol: 236 };
    expect(growFerrataTileRange(range, 1)).toEqual({ minRow: 929, maxRow: 932, minCol: 233, maxCol: 237 });
    expect(growFerrataTileRange({ minRow: 1799, maxRow: 1799, minCol: 0, maxCol: 0 }, 1).maxRow).toBe(1799);
  });

  it('asks for tiles of one grid-aligned block with one box around them', () => {
    const requests = ferrataTileRequests([
      { row: 930, col: 234 },
      { row: 931, col: 235 },
    ]);
    expect(requests).toEqual([
      {
        bbox: { south: 46.5, west: 11.7, north: 46.6, east: 11.8 },
        range: { minRow: 930, maxRow: 931, minCol: 234, maxCol: 235 },
      },
    ]);
    expect(ferrataTileRequests([])).toEqual([]);
  });

  it('splits tiles that straddle a block line along it, so each request is one block of the server', () => {
    const requests = ferrataTileRequests([
      { row: 931, col: 235 },
      { row: 932, col: 236 },
    ]);
    expect(requests.map(({ range }) => range)).toEqual([
      { minRow: 931, maxRow: 931, minCol: 235, maxCol: 235 },
      { minRow: 932, maxRow: 932, minCol: 236, maxCol: 236 },
    ]);
    expect(ferrataTileBlockKey(931, 235)).toBe('465:117');
    expect(ferrataTileBlockKey(-1, -3)).toBe('-1:-2');
  });

  it('cuts a wider set into boxes of at most 0.1 degree a side, each covering only tiles it holds', () => {
    const tiles = ferrataTilesOf({ minRow: 900, maxRow: 911, minCol: 200, maxCol: 202 });
    const requests = ferrataTileRequests(tiles);
    expect(requests).toHaveLength(12);
    for (const { bbox } of requests) {
      expect(bbox.north - bbox.south).toBeLessThanOrEqual(0.1 + 1e-9);
      expect(bbox.east - bbox.west).toBeLessThanOrEqual(0.1 + 1e-9);
    }
    for (const { bbox } of requests) expect(ferrataBboxSpanOk(bbox)).toBe(true);
    const covered = requests.flatMap(({ range }) => ferrataTilesOf(range).map(ferrataTileKey)).sort();
    expect(covered).toEqual(tiles.map(ferrataTileKey).sort());
  });
});
