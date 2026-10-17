/**
 * PaddleRegionsService over a snapshot db with Geofabrik faked: a region
 * added, read in the background from an extract the test writes, its objects
 * stored; the queue in order; a failed read that keeps the previous data; a
 * region removed while it is read; the monthly and the boot requeue.
 */
import { PaddleFeatures } from '../../../../src/db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import type { PaddleRegionsRepository } from '../../../../src/db/repositories/PaddleRegions.repository';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { GeofabrikClient, type GeofabrikRegion } from '../../../../src/nest/paddle-obstacles/geofabrik.client';
import { PaddleObstaclesModule } from '../../../../src/nest/paddle-obstacles/paddle-obstacles.module';
import {
  CATALOG_UNAVAILABLE_MESSAGE,
  PaddleRegionsService,
  REGION_NOT_FOUND_MESSAGE,
  REGION_UNKNOWN_MESSAGE,
} from '../../../../src/nest/paddle-obstacles/paddle-regions.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, findRow, findRows, updateRows } from '../../../helpers/factories/rows';
import { pbfFile } from '../../../helpers/osm-pbf-fixture';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { paddleRegionSchema } from '@trek/shared';

import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  ...log,
}));

const db = createSnapshotTestDb();

const boundary = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [11.5, 48.9],
      [13, 48.9],
      [13, 50],
      [11.5, 50],
      [11.5, 48.9],
    ] as [number, number][],
  ],
};
const region = (id: string, name: string, parent: string | null = null): GeofabrikRegion => ({
  id,
  name,
  parent,
  pbfUrl: `https://download.geofabrik.de/${id}-latest.osm.pbf`,
  boundary: id === 'oberpfalz' ? boundary : null,
});
const catalogue = new Map<string, GeofabrikRegion>(
  [
    region('europe', 'Europe'),
    region('germany', 'Germany', 'europe'),
    region('bayern', 'Bayern', 'germany'),
    region('oberpfalz', 'Oberpfalz', 'bayern'),
    region('oberbayern', 'Oberbayern', 'bayern'),
    region('mecklenburg-vorpommern', 'Mecklenburg-Vorpommern', 'germany'),
    region('limburg-nl', 'Limburg', 'europe'),
  ].map((entry) => [entry.id, entry]),
);

/** The Lindenmühle weir and a put-in, current to 1 Oct 2026. */
const extract = pbfFile(
  [
    {
      dense: [
        { id: 1, lat: 49.1231, lon: 12.1301 },
        { id: 2, lat: 49.124, lon: 12.1315 },
        { id: 3, lat: 49.13, lon: 12.14, tags: { canoe: 'put_in' } },
      ],
    },
    { ways: [{ id: 29256405, refs: [1, 2], tags: { waterway: 'weir', name: 'Wehr Lindenmühle' } }] },
  ],
  { timestamp: Date.UTC(2026, 9, 1) / 1000 },
);

type DownloadOptions = Parameters<GeofabrikClient['download']>[2];
const regions = vi.fn<() => Promise<Map<string, GeofabrikRegion>>>();
const download = vi.fn<(url: string, target: string, options?: DownloadOptions) => Promise<void>>();

let dir: string;
let t: TestModule | undefined;
let service: PaddleRegionsService;
const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-regions-'));
});

beforeEach(async () => {
  resetTestDb(db);
  await rm(join(dir, 'paddle'), { recursive: true, force: true });
  regions.mockReset();
  regions.mockResolvedValue(catalogue);
  download.mockReset();
  download.mockImplementation((_url, target) => writeFile(target, extract));
  await t?.close();
  t = await createTestModule({
    db,
    imports: [AppConfigModule, PaddleObstaclesModule],
    overrides: [
      { provide: GeofabrikClient, useValue: { regions, download } },
      { provide: DataPathsService, useValue: { tmpDir: dir } },
    ],
  });
  service = t.get(PaddleRegionsService);
});

afterEach(async () => {
  // A case that failed before letting its download go must not hold the next one up.
  for (const release of held) release();
  held.clear();
  await service.idle();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await t?.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
});

const held = new Set<() => void>();

/** A download that waits until the test lets it finish or the read is called off. */
function heldDownload(): { release: () => void; signal: () => AbortSignal | undefined } {
  let release: () => void = () => {};
  let signal: AbortSignal | undefined;
  download.mockImplementationOnce(
    (_url, target, options) =>
      new Promise<void>((resolve, reject) => {
        let settled = false;
        signal = options?.signal;
        options?.onProgress?.(0.25);
        options?.signal?.addEventListener('abort', () => {
          settled = true;
          reject(new Error('This operation was aborted'));
        });
        release = () => {
          if (settled) return;
          settled = true;
          void writeFile(target, extract).then(resolve, reject);
        };
        held.add(release);
      }),
  );
  return { release: () => release(), signal: () => signal };
}

describe('PaddleRegionsService.add and the background read', () => {
  it('PREG-001: queues the region, reads its extract and stores its objects with the date of the data', async () => {
    const added = await service.add('oberpfalz');
    expect(added).toMatchObject({ id: 'oberpfalz', name: 'Oberpfalz', feature_count: 0, progress: null });
    expect(['queued', 'importing']).toContain(added.status);
    expect(paddleRegionSchema.safeParse(added).success).toBe(true);

    await service.idle();

    const [listed] = await service.list();
    expect(listed).toMatchObject({
      id: 'oberpfalz',
      status: 'ready',
      feature_count: 2,
      error: null,
      source_timestamp: '2026-10-01T00:00:00.000Z',
      progress: null,
    });
    expect(listed?.imported_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    const stored = await findRows(orm(), PaddleFeatures, {}, { osm_ref: 'asc' });
    expect(stored.map((row) => [row.osm_ref, row.kind])).toEqual([
      ['node/3', 'put_in'],
      ['way/29256405', 'weir'],
    ]);
    const row = await findRow(orm(), PaddleRegions, { id: 'oberpfalz' });
    expect(row).toMatchObject({ min_lat: 48.9, max_lat: 50, min_lng: 11.5, max_lng: 13 });
    expect(download).toHaveBeenCalledWith(
      'https://download.geofabrik.de/oberpfalz-latest.osm.pbf',
      expect.stringContaining(join(dir, 'paddle', 'oberpfalz-')),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    // The extract is gone once it is read.
    expect(await readdir(join(dir, 'paddle'))).toEqual([]);
  });

  it('PREG-002: refuses a region Geofabrik does not name, and says so when its list cannot be read', async () => {
    const unknown = await service.add('atlantis').catch((err: unknown) => err);
    expect(unknown).toBeInstanceOf(DomainError);
    expect(unknown).toMatchObject({ publicMessage: REGION_UNKNOWN_MESSAGE, status: 400 });

    regions.mockRejectedValue(new Error('Geofabrik index 503'));
    const add = await service.add('oberpfalz').catch((err: unknown) => err);
    expect(add).toMatchObject({ publicMessage: CATALOG_UNAVAILABLE_MESSAGE, status: 502 });
    const catalog = await service.catalog('ober').catch((err: unknown) => err);
    expect(catalog).toMatchObject({ publicMessage: CATALOG_UNAVAILABLE_MESSAGE, status: 502 });
    expect(await countRows(orm(), PaddleRegions)).toBe(0);
  });

  it('PREG-003: adding a region already there reads it again', async () => {
    await service.add('oberpfalz');
    await service.idle();
    const again = await service.add('oberpfalz');
    expect(again.status).toBe('queued');
    await service.idle();
    expect(download).toHaveBeenCalledTimes(2);
    expect(await countRows(orm(), PaddleRegions)).toBe(1);
  });

  it('PREG-004: a failed read marks the region failed with the reason and keeps the objects it had', async () => {
    await service.add('oberpfalz');
    await service.idle();
    download.mockRejectedValueOnce(new Error('Geofabrik download 500'));

    await service.refresh('oberpfalz');
    await service.idle();

    const [listed] = await service.list();
    expect(listed).toMatchObject({ status: 'failed', error: 'Geofabrik download 500', feature_count: 2 });
    expect(await countRows(orm(), PaddleFeatures)).toBe(2);
  });

  it('PREG-005: a region Geofabrik no longer lists at the time of its read fails with that reason', async () => {
    await service.add('oberpfalz');
    regions.mockResolvedValue(new Map());
    await service.idle();
    const [listed] = await service.list();
    expect(listed).toMatchObject({ status: 'failed', error: REGION_UNKNOWN_MESSAGE });
  });

  it('PREG-006: shows how far the read has come while it downloads', async () => {
    const held = heldDownload();
    await service.add('oberpfalz');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect((await service.list())[0]).toMatchObject({
      status: 'importing',
      progress: { phase: 'download', fraction: 0.25 },
    });

    held.release();
    await service.idle();
    expect((await service.list())[0]).toMatchObject({ status: 'ready', progress: null });
  });
});

describe('PaddleRegionsService: the queue', () => {
  it('PREG-007: reads queued regions one after another, a region queued while another is read included', async () => {
    const held = heldDownload();
    await service.add('oberpfalz');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    await service.add('mecklenburg-vorpommern');
    expect(download).toHaveBeenCalledTimes(1);

    held.release();
    await service.idle();

    expect(download.mock.calls.map(([url]) => url)).toEqual([
      'https://download.geofabrik.de/oberpfalz-latest.osm.pbf',
      'https://download.geofabrik.de/mecklenburg-vorpommern-latest.osm.pbf',
    ]);
    expect((await service.list()).map((entry) => [entry.id, entry.status])).toEqual([
      ['mecklenburg-vorpommern', 'ready'],
      ['oberpfalz', 'ready'],
    ]);
  });

  it('PREG-008: removing a region while it is read calls the read off and keeps nothing of it', async () => {
    const held = heldDownload();
    await service.add('oberpfalz');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));

    await service.remove('oberpfalz');
    await service.idle();

    expect(held.signal()?.aborted).toBe(true);
    expect(await countRows(orm(), PaddleRegions)).toBe(0);
    expect(await countRows(orm(), PaddleFeatures)).toBe(0);
    expect(await readdir(join(dir, 'paddle'))).toEqual([]);
  });

  it('PREG-009: a region whose row went while its file was read keeps no objects', async () => {
    download.mockImplementationOnce(async (_url, target) => {
      await writeFile(target, extract);
      await deleteRows(orm(), PaddleRegions, { id: 'oberpfalz' });
    });
    await service.add('oberpfalz');
    await service.idle();
    expect(await countRows(orm(), PaddleFeatures)).toBe(0);
  });

  it('PREG-010: refresh leaves a waiting or running read alone and refuses a region it does not hold', async () => {
    const held = heldDownload();
    await service.add('oberpfalz');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect((await service.refresh('oberpfalz')).status).toBe('importing');
    held.release();
    await service.idle();
    expect(download).toHaveBeenCalledTimes(1);

    const missing = await service.refresh('bayern').catch((err: unknown) => err);
    expect(missing).toMatchObject({ publicMessage: REGION_NOT_FOUND_MESSAGE, status: 404 });
    const gone = await service.remove('bayern').catch((err: unknown) => err);
    expect(gone).toMatchObject({ publicMessage: REGION_NOT_FOUND_MESSAGE, status: 404 });
  });

  it('PREG-011: the monthly refresh queues every region with data or a failed read; a boot requeues a cut read', async () => {
    await service.add('oberpfalz');
    await service.add('mecklenburg-vorpommern');
    await service.idle();
    await updateRows(orm(), PaddleRegions, { id: 'mecklenburg-vorpommern' }, { status: 'failed' });

    expect(await service.queueRefresh()).toBe(2);
    await service.idle();
    expect(download).toHaveBeenCalledTimes(4);
    expect(await service.queueRefresh()).toBe(2);
    await service.idle();

    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { status: 'importing' });
    await service.resumeAfterRestart();
    await service.idle();
    expect(download).toHaveBeenCalledTimes(7);
    expect((await service.list()).every((entry) => entry.status === 'ready')).toBe(true);
  });

  it('PREG-012: an error the queue itself meets is logged, and the next start picks the region up', async () => {
    const repository = t?.get<PaddleRegionsRepository>(getRepositoryToken(PaddleRegions));
    if (!repository) throw new Error('No repository');
    vi.spyOn(repository, 'nextQueued').mockRejectedValueOnce(new Error('database is locked'));

    await service.add('oberpfalz');
    await service.idle();
    expect((await service.list())[0]?.status).toBe('queued');
    expect(log.logError).toHaveBeenCalledWith('[Paddle] the read queue stopped: database is locked');

    service.kick();
    await service.idle();
    expect((await service.list())[0]?.status).toBe('ready');
  });
});

describe('PaddleRegionsService: restart and shutdown', () => {
  it('PREG-015: a shutdown stops the read under way, leaves it marked as being read and starts no other', async () => {
    const held = heldDownload();
    await service.add('oberpfalz');
    await service.add('mecklenburg-vorpommern');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));

    service.onApplicationShutdown();
    await service.idle();

    expect(held.signal()?.aborted).toBe(true);
    expect(download).toHaveBeenCalledTimes(1);
    expect((await service.list()).map((entry) => [entry.id, entry.status])).toEqual([
      ['mecklenburg-vorpommern', 'queued'],
      ['oberpfalz', 'importing'],
    ]);
    expect(log.logInfo).toHaveBeenCalledWith(
      '[Paddle] oberpfalz: stopped by the shutdown; read again on the next start',
    );
  });

  it('PREG-016: the boot after it queues the cut read again and clears what the last process left in its folder', async () => {
    await service.add('oberpfalz');
    await service.idle();
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { status: 'importing' });
    await mkdir(join(dir, 'paddle'), { recursive: true });
    await writeFile(join(dir, 'paddle', 'oberpfalz-1.osm.pbf'), 'half a download');

    await service.resumeAfterRestart();
    await service.idle();

    expect((await service.list())[0]?.status).toBe('ready');
    expect(await readdir(join(dir, 'paddle'))).toEqual([]);
  });

  it('PREG-017: a nested Geofabrik id reads into a file in the one folder', async () => {
    const texas = {
      ...region('us/texas', 'Texas', 'us'),
      pbfUrl: 'https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf',
    };
    regions.mockResolvedValue(new Map([['us/texas', texas]]));
    await service.add('us/texas');
    await service.idle();
    expect(download.mock.calls[0]?.[1]).toMatch(/[/\\]paddle[/\\]us_texas-\d+\.osm\.pbf$/);
    expect((await service.list())[0]).toMatchObject({ id: 'us/texas', status: 'ready', feature_count: 2 });
    // Without a boundary from Geofabrik, the region spans its objects.
    expect(await findRow(orm(), PaddleRegions, { id: 'us/texas' })).toMatchObject({
      min_lat: 49.1231,
      max_lat: 49.13,
      min_lng: 12.1301,
      max_lng: 12.14,
    });
  });
});

describe('PaddleRegionsService.catalog', () => {
  it('PREG-013: finds regions by name or id, names starting with the query first, with the regions they lie in', async () => {
    expect(await service.catalog('ober')).toEqual([
      { id: 'oberpfalz', name: 'Oberpfalz', path: ['Europe', 'Germany', 'Bayern'] },
      { id: 'oberbayern', name: 'Oberbayern', path: ['Europe', 'Germany', 'Bayern'] },
    ]);
    expect(await service.catalog('vorpommern')).toEqual([
      { id: 'mecklenburg-vorpommern', name: 'Mecklenburg-Vorpommern', path: ['Europe', 'Germany'] },
    ]);
    expect(await service.catalog('limburg-nl')).toEqual([{ id: 'limburg-nl', name: 'Limburg', path: ['Europe'] }]);
  });

  it('PREG-014: answers at most 25 matches', async () => {
    const many = new Map(
      Array.from({ length: 40 }, (_, i) => [`region-${i}`, region(`region-${i}`, `Region ${i}`)] as const),
    );
    regions.mockResolvedValue(many);
    expect(await service.catalog('region')).toHaveLength(25);
  });
});
