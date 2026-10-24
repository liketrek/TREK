// FE-REPO-FERRATA-001 to FE-REPO-FERRATA-007: the network read behind the via ferrata layer and its tiles kept on the device.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import { ferratasApi } from '../api/ferratas';
import { clearAll, clearTripData, offlineDb } from '../db/offlineDb';
import { isEffectivelyOffline } from '../sync/networkMode';
import { FERRATA_TILE_FRESH_MS, ferrataRepo } from './ferrataRepo';

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../api/ferratas', () => ({ ferratasApi: { list: vi.fn() } }));

const BBOX = '46.500,11.700,46.600,11.900';
const reply = {
  ferratas: [
    {
      id: 'way/42',
      name: 'Via delle Trincee',
      grade: { raw: '4', level: 4, plus: null },
      routeName: null,
      geometry: [
        [46.52, 11.8],
        [46.53, 11.81],
      ],
      osmUrl: 'https://www.openstreetmap.org/way/42',
    },
  ],
  truncated: false,
  source: 'openstreetmap',
  attribution: '© OpenStreetMap contributors',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(ferratasApi.list).mockResolvedValue(reply);
});

describe('ferrataRepo.list', () => {
  it('FE-REPO-FERRATA-001: asks the api for the trip and box with the signal and returns the parsed answer', async () => {
    const signal = new AbortController().signal;
    await expect(ferrataRepo.list(7, BBOX, signal)).resolves.toEqual(reply);
    expect(ferratasApi.list).toHaveBeenCalledWith(7, BBOX, signal);
  });

  it('FE-REPO-FERRATA-002: offline it refuses without making the request', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await expect(ferrataRepo.list(7, BBOX, new AbortController().signal)).rejects.toThrow('connection');
    expect(ferratasApi.list).not.toHaveBeenCalled();
  });

  it('FE-REPO-FERRATA-003: an answer off the contract is rejected, not drawn', async () => {
    vi.mocked(ferratasApi.list).mockResolvedValue({ ...reply, ferratas: [{ ...reply.ferratas[0], id: 'node/1' }] });
    await expect(ferrataRepo.list(7, BBOX, new AbortController().signal)).rejects.toThrow();
    vi.mocked(ferratasApi.list).mockResolvedValue({
      ...reply,
      ferratas: [{ ...reply.ferratas[0], geometry: [[46.5, 11.7]] }],
    });
    await expect(ferrataRepo.list(7, BBOX, new AbortController().signal)).rejects.toThrow();
  });
});

describe('ferrataRepo tiles', () => {
  const NOW = 10 * FERRATA_TILE_FRESH_MS;
  const FERRATA: Ferrata = {
    id: 'way/42',
    name: 'Via delle Trincee',
    grade: { raw: '4', level: 4, plus: null },
    routeName: null,
    geometry: [
      [46.52, 11.8],
      [46.53, 11.81],
    ],
    osmUrl: 'https://www.openstreetmap.org/way/42',
  };

  beforeEach(async () => {
    await clearAll();
  });

  it('FE-REPO-FERRATA-004: keeps tiles per trip and hands back the fresh ones', async () => {
    await ferrataRepo.saveTiles(7, [
      { tile: '930:236', fetchedAt: NOW - 1_000, ferratas: [FERRATA] },
      { tile: '930:237', fetchedAt: NOW - 2_000, ferratas: [] },
    ]);
    await ferrataRepo.saveTiles(8, [{ tile: '930:236', fetchedAt: NOW, ferratas: [] }]);

    const rows = await ferrataRepo.cachedTiles(7, NOW);
    expect(rows.map((row) => row.tile).sort()).toEqual(['930:236', '930:237']);
    expect(rows.find((row) => row.tile === '930:236')?.ferratas).toEqual([FERRATA]);
    expect(await ferrataRepo.cachedTiles(8, NOW)).toHaveLength(1);
  });

  it('FE-REPO-FERRATA-005: a tile older than a week is dropped instead of drawn', async () => {
    await ferrataRepo.saveTiles(7, [
      { tile: '930:236', fetchedAt: NOW - FERRATA_TILE_FRESH_MS - 1, ferratas: [FERRATA] },
      { tile: '930:237', fetchedAt: NOW - FERRATA_TILE_FRESH_MS + 1, ferratas: [] },
    ]);

    expect((await ferrataRepo.cachedTiles(7, NOW)).map((row) => row.tile)).toEqual(['930:237']);
    expect(await offlineDb.ferrataTiles.get([7, '930:236'])).toBeUndefined();
  });

  it('FE-REPO-FERRATA-006: a cached ferrata off the contract, or a row under a bad key, is left out', async () => {
    await offlineDb.ferrataTiles.bulkPut([
      { tripId: 7, tile: '930:236', fetchedAt: NOW, ferratas: [FERRATA, { ...FERRATA, id: 'node/1' }] },
      { tripId: 7, tile: 'nonsense', fetchedAt: NOW, ferratas: [] },
    ]);
    const rows = await ferrataRepo.cachedTiles(7, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ferratas).toEqual([FERRATA]);
  });

  it('FE-REPO-FERRATA-007: skips a save for another account, and the tiles go with their trip', async () => {
    await ferrataRepo.saveTiles(7, [{ tile: '930:236', fetchedAt: NOW, ferratas: [] }], 'trek-offline-u999');
    expect(await offlineDb.ferrataTiles.count()).toBe(0);

    await ferrataRepo.saveTiles(7, [{ tile: '930:236', fetchedAt: NOW, ferratas: [] }], ferrataRepo.cacheName());
    expect(await offlineDb.ferrataTiles.count()).toBe(1);
    await clearTripData(7);
    expect(await offlineDb.ferrataTiles.count()).toBe(0);
  });
});
