/**
 * The ski areas the piste router plans on (spec 7.2, 7.3, 11): the index of
 * the Places host kept in the data folder and fetched only when its checksum
 * changed, each area's graph downloaded once however many ask, checked
 * against the index before it is kept, an older copy used while the host is
 * down, and files nobody used for 90 days swept. The host is a stub here;
 * its client is tested in trek-places.winter.test.ts.
 */
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { TrekPlacesWinterService } from '../../../../src/nest/maps/trek-places-winter.service';
import {
  areasAt,
  buildIndex,
  pickAreas,
  SkiAreasService,
  UNUSED_FOR_MS,
} from '../../../../src/nest/ski-routing/ski-areas.service';
import { SkiWorld } from '../../../helpers/ski-world';
import { Test } from '@nestjs/testing';
import type { WinterIndex, WinterIndexRow, WinterMeta } from '@trek/shared';

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');

const world = new SkiWorld();
world.run(world.node(0, 1000, 1800), world.node(0, 0, 1300), 1, { name: 'Talabfahrt' });
const GZ = world.gz();

function row(id: string, bbox: [number, number, number, number], bytes = GZ): WinterIndexRow {
  return {
    id,
    name: `Gebiet ${id}`,
    kind: 'resort',
    country: null,
    colourScheme: 'europe',
    bbox,
    counts: { runsKm: 1, nordicKm: 0, lifts: 0, skitourKm: 0, hikeKm: 0 },
    bytes: bytes.length,
    sha256: sha(bytes),
  };
}

const ROW = row('w:100', [6.99, 45.99, 7.01, 46.01]);

function hosted(rows: WinterIndexRow[], build = '2026-11-02') {
  const index: WinterIndex = { build, format: 1, areas: rows };
  const json = Buffer.from(JSON.stringify(index));
  const meta: WinterMeta = {
    build,
    format: 1,
    areas: rows.length,
    indexSha: sha(json),
    sourceTimestamp: null,
    attribution: { data: '© OpenStreetMap contributors, ODbL', terrain: 'Terrain: Mapzen Terrarium' },
  };
  return { index, meta, sha256: meta.indexSha };
}

let dir: string;
let host: ReturnType<typeof hosted>;
const winter = {
  enabled: vi.fn(() => true),
  heldBack: vi.fn(() => false),
  meta: vi.fn(),
  index: vi.fn(),
  area: vi.fn(),
};

async function service(): Promise<SkiAreasService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      SkiAreasService,
      { provide: DataPathsService, useValue: { dataDir: dir } },
      { provide: TrekPlacesWinterService, useValue: winter },
    ],
  }).compile();
  return moduleRef.get(SkiAreasService);
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-ski-areas-'));
  host = hosted([ROW]);
  winter.enabled.mockReset().mockReturnValue(true);
  winter.meta.mockReset().mockImplementation(async () => host.meta);
  winter.index
    .mockReset()
    .mockImplementation(async () => ({ status: 'ok', index: host.index, sha256: host.sha256, dropped: 0 }));
  winter.area.mockReset().mockImplementation(async () => ({ status: 'ok', bytes: GZ, etag: ROW.sha256 }));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('the index of ski areas', () => {
  it('SKIAREA-001: fetched once and kept on disk; a later start reads it from there without asking', async () => {
    const areas = await service();
    const index = await areas.index();
    expect(index?.build).toBe('2026-11-02');
    expect(index?.areas.map((area) => area.row.id)).toEqual(['w:100']);
    expect(index?.attribution).toBe('© OpenStreetMap contributors, ODbL. Terrain: Mapzen Terrarium');
    await areas.index();
    expect(winter.meta).toHaveBeenCalledTimes(1);
    expect(await readdir(join(dir, 'ski'))).toEqual([`index-${host.meta.indexSha.slice(0, 8)}.json`]);

    const later = await service();
    expect((await later.index())?.indexSha).toBe(host.meta.indexSha);
    expect(winter.meta).toHaveBeenCalledTimes(1);
  });

  it('SKIAREA-002: none without TREK Places or the host, a broken kept file skipped', async () => {
    winter.enabled.mockReturnValue(false);
    expect(await (await service()).index()).toBeNull();
    winter.enabled.mockReturnValue(true);
    winter.meta.mockRejectedValue(new Error('TREK Places API 503'));
    expect(await (await service()).index()).toBeNull();
    await mkdir(join(dir, 'ski'), { recursive: true });
    await writeFile(join(dir, 'ski', 'index-broken00.json'), '{not json');
    expect(await (await service()).index()).toBeNull();
  });

  it('SKIAREA-003: takes a new index only with its announced checksum and a format it reads', async () => {
    const areas = await service();
    await areas.index();
    expect(await areas.refresh()).toBe('unchanged');

    const next = hosted([ROW, row('w:200', [8, 46, 8.01, 46.01])], '2026-11-09');
    winter.meta.mockResolvedValue(next.meta);
    winter.index.mockResolvedValueOnce({ status: 'ok', index: next.index, sha256: 'f'.repeat(64), dropped: 0 });
    expect(await areas.refresh()).toBe('refused');
    expect((await areas.index())?.build).toBe('2026-11-02');

    winter.meta.mockResolvedValueOnce({ ...next.meta, format: 2 });
    expect(await areas.refresh()).toBe('refused');

    winter.index.mockResolvedValueOnce({ status: 'not_modified' });
    expect(await areas.refresh()).toBe('unchanged');

    winter.index.mockResolvedValueOnce({ status: 'ok', index: next.index, sha256: next.sha256, dropped: 1 });
    expect(await areas.refresh()).toBe('updated');
    expect((await areas.index())?.areas).toHaveLength(2);
    expect(winter.index).toHaveBeenLastCalledWith(host.meta.indexSha);
    expect(await readdir(join(dir, 'ski'))).toEqual([`index-${next.meta.indexSha.slice(0, 8)}.json`]);
  });
});

describe('an area graph', () => {
  it('SKIAREA-010: downloaded once however many ask at once, then read from disk', async () => {
    const areas = await service();
    const [a, b] = await Promise.all([areas.ensureArea(ROW), areas.ensureArea(ROW)]);
    expect(a).toEqual({ file: areas.fileOf(ROW), stale: false });
    expect(b).toEqual(a);
    expect(winter.area).toHaveBeenCalledTimes(1);
    expect(winter.area).toHaveBeenCalledWith('w:100', null);
    expect(areas.fileOf(ROW)).toMatch(/w_100@[0-9a-f]{8}\.sgr\.gz$/);
    expect(await areas.ensureArea(ROW)).toEqual(a);
    expect(winter.area).toHaveBeenCalledTimes(1);
    expect(areas.stateOf(ROW)).toBe('ready');
  });

  it('SKIAREA-011: refuses a graph whose checksum is not the index one, and keeps nothing of it', async () => {
    const areas = await service();
    winter.area.mockResolvedValueOnce({ status: 'ok', bytes: Buffer.from('not the graph'), etag: null });
    await expect(areas.ensureArea(ROW)).rejects.toThrow("does not match the index's checksum");
    expect(existsSync(areas.fileOf(ROW))).toBe(false);
    expect(areas.stateOf(ROW)).toBe('unavailable');
  });

  it('SKIAREA-012: an older copy stands in while the host is down; without one the download fails', async () => {
    const areas = await service();
    await areas.ensureArea(ROW);
    const changed = { ...ROW, sha256: sha('a newer build') };
    winter.area.mockRejectedValueOnce(Object.assign(new Error('TREK Places API 503'), { status: 503 }));
    expect(await areas.ensureArea(changed)).toEqual({ file: areas.fileOf(ROW), stale: true });
    const unknown = row('w:300', [8, 46, 8.01, 46.01]);
    winter.area.mockRejectedValueOnce(Object.assign(new Error('TREK Places API 404'), { status: 404 }));
    await expect(areas.ensureArea(unknown)).rejects.toThrow('TREK Places API 404');
    // An id the host does not know sends TREK for a fresh index.
    await vi.waitFor(() => expect(winter.meta).toHaveBeenCalled());
    winter.area.mockResolvedValueOnce({ status: 'not_modified' });
    await expect(areas.ensureArea(unknown)).rejects.toThrow('sent no graph');
  });

  it('SKIAREA-013: an area loading, ready or unavailable, and unavailable while TREK Places is off', async () => {
    const areas = await service();
    let release: (value: unknown) => void = () => undefined;
    winter.area.mockImplementationOnce(
      () => new Promise((resolve) => (release = () => resolve({ status: 'ok', bytes: GZ, etag: null }))),
    );
    expect(areas.stateOf(ROW)).toBe('loading');
    const pending = areas.ensureArea(ROW);
    expect(areas.stateOf(ROW)).toBe('loading');
    release(undefined);
    await pending;
    expect(areas.stateOf(ROW)).toBe('ready');
    winter.enabled.mockReturnValue(false);
    expect(areas.enabled()).toBe(false);
    expect(areas.stateOf(row('w:400', [9, 46, 9.01, 46.01]))).toBe('unavailable');
    expect(areas.placesHeldBack()).toBe(false);
    winter.heldBack.mockReturnValueOnce(true);
    expect(areas.placesHeldBack()).toBe(true);
  });

  it('SKIAREA-014: lists the areas kept, and sweeps half writes and files unused for 90 days', async () => {
    const areas = await service();
    await areas.ensureArea(ROW);
    const old = join(dir, 'ski', 'areas', 'w_9@deadbeef.sgr.gz');
    await writeFile(old, GZ);
    const long = new Date(Date.now() - UNUSED_FOR_MS - 60_000);
    await utimes(old, long, long);
    await writeFile(join(dir, 'ski', 'areas', 'w_1@00000000.sgr.gz.tmp'), 'half');
    await writeFile(join(dir, 'ski', 'index-00000000.json.tmp'), 'half');
    expect((await areas.keptAreas()).map((kept) => kept.id).sort()).toEqual(['w:100', 'w:9']);
    expect(await areas.sweep(Date.now(), { tempOnly: true })).toBe(2);
    expect(existsSync(old)).toBe(true);
    expect(await areas.sweep(Date.now())).toBe(1);
    expect(existsSync(old)).toBe(false);
    expect(existsSync(areas.fileOf(ROW))).toBe(true);
    await areas.onApplicationBootstrap();
    await rm(join(dir, 'ski'), { recursive: true, force: true });
    expect(await areas.sweep(Date.now())).toBe(0);
    expect(await areas.keptAreas()).toEqual([]);
  });
});

describe('the areas a leg is planned on', () => {
  const index = buildIndex(
    { build: 'b', indexSha: 'x', attribution: { data: 'd', terrain: 't' } },
    {
      build: 'b',
      format: 1,
      areas: [
        row('w:1', [7, 46, 7.02, 46.02]),
        row('w:2', [7.03, 46, 7.05, 46.02]),
        row('w:3-a', [8, 46, 8.02, 46.02]),
        row('w:3-b', [8.015, 46, 8.04, 46.02]),
        row('w:4', [7.001, 46.001, 7.003, 46.003]),
      ],
    },
  );

  it('SKIAREA-020: the area holding both ends, the smaller one nearer first where two hold a point', () => {
    expect(areasAt(index, { lat: 46.002, lng: 7.002 }).map((area) => area.row.id)).toEqual(['w:4', 'w:1']);
    const pick = pickAreas(index, { from: { lat: 46.01, lng: 7.01 }, to: { lat: 46.012, lng: 7.012 } });
    expect(pick.status === 'ok' && pick.areas.map((area) => area.row.id)).toEqual(['w:1']);
  });

  it('SKIAREA-021: no area at an end, and two areas that do not touch, are said as such', () => {
    expect(pickAreas(index, { from: { lat: 50, lng: 7 }, to: { lat: 46.01, lng: 7.01 } })).toEqual({
      status: 'no_area',
      at: { lat: 50, lng: 7 },
    });
    expect(pickAreas(index, { from: { lat: 46.01, lng: 7.01 }, to: { lat: 50, lng: 7 } }).status).toBe('no_area');
    expect(pickAreas(index, { from: { lat: 46.01, lng: 7.005 }, to: { lat: 46.01, lng: 7.045 } })).toEqual({
      status: 'cross_area',
      at: { lat: 46.01, lng: 7.045 },
    });
  });

  it('SKIAREA-022: the pieces of one split network that touch are planned on together', () => {
    const pick = pickAreas(index, { from: { lat: 46.01, lng: 8.005 }, to: { lat: 46.01, lng: 8.035 } });
    expect(pick.status === 'ok' && pick.areas.map((area) => area.row.id)).toEqual(['w:3-a', 'w:3-b']);
  });
});
