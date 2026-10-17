/**
 * PAD-11C, PaddleRegionLoadService over a snapshot db with Geofabrik faked:
 * a place no region covers gets the smallest region around it loaded, asked
 * for or refused, as the admin's setting, the region's size and the day's
 * count say; a region TREK holds already answers how far its read is; the
 * admins hear of a request once.
 */
import { PaddleRegionRequests } from '../../../../src/db/entities/PaddleRegionRequests.entity';
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { DemoModule } from '../../../../src/nest/common/demo.module';
import { DemoService } from '../../../../src/nest/common/demo.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { GeofabrikClient, type GeofabrikRegion } from '../../../../src/nest/paddle-obstacles/geofabrik.client';
import { PaddleObstaclesModule } from '../../../../src/nest/paddle-obstacles/paddle-obstacles.module';
import { PaddleRegionLoadService } from '../../../../src/nest/paddle-obstacles/paddle-region-load.service';
import { PaddleRegionsService } from '../../../../src/nest/paddle-obstacles/paddle-regions.service';
import { PaddleRoutingService } from '../../../../src/nest/paddle-routing/paddle-routing.service';
import type { User } from '../../../../src/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { pbfFile } from '../../../helpers/osm-pbf-fixture';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { PADDLE_AUTO_REGIONS_PER_DAY, paddleRegionLoadStateSchema } from '@trek/shared';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  ...log,
}));

const db = createSnapshotTestDb();

const box = (west: number, south: number, east: number, north: number) => ({
  type: 'Polygon' as const,
  coordinates: [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ] as [number, number][],
  ],
});
const region = (id: string, name: string, boundary: GeofabrikRegion['boundary']): GeofabrikRegion => ({
  id,
  name,
  parent: null,
  pbfUrl: `https://download.geofabrik.de/${id}-latest.osm.pbf`,
  boundary,
});
const catalogue = new Map<string, GeofabrikRegion>(
  [
    region('germany', 'Germany', box(5, 47, 16, 55)),
    region('bayern', 'Bayern', box(9, 47, 14, 51)),
    region('oberpfalz', 'Oberpfalz', box(11.5, 48.9, 13, 50)),
    region('mecklenburg-vorpommern', 'Mecklenburg-Vorpommern', box(10.5, 53, 14.5, 54.7)),
    region('nowhere', 'Nowhere', null),
  ].map((entry) => [entry.id, entry]),
);

const REGENSBURG = { lat: 49.3, lng: 12.2 };
const MUERITZ = { lat: 53.45, lng: 12.7 };
const ATLANTIC = { lat: 0, lng: -30 };

const extract = pbfFile([{ dense: [{ id: 1, lat: 49.3, lon: 12.2, tags: { canoe: 'put_in' } }] }], {
  timestamp: Date.UTC(2026, 9, 1) / 1000,
});

const regions = vi.fn<() => Promise<Map<string, GeofabrikRegion>>>();
const download = vi.fn<(url: string, target: string) => Promise<void>>();
const sizeOf = vi.fn<(url: string) => Promise<number | null>>();

let dir: string;
let t: TestModule | undefined;
let load: PaddleRegionLoadService;
let send: ReturnType<typeof vi.spyOn>;
let paddler: User;
let admin: User;
const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-load-'));
});

beforeEach(async () => {
  resetTestDb(db);
  regions.mockReset().mockResolvedValue(catalogue);
  download.mockReset().mockImplementation((_url, target) => writeFile(target, extract));
  sizeOf.mockReset().mockResolvedValue(80 * 1024 * 1024);
  await t?.close();
  t = await createTestModule({
    db,
    imports: [AppConfigModule, DemoModule, PaddleObstaclesModule],
    overrides: [
      { provide: GeofabrikClient, useValue: { regions, download, sizeOf } },
      { provide: DataPathsService, useValue: { tmpDir: dir, dataDir: dir } },
    ],
  });
  load = t.get(PaddleRegionLoadService);
  send = vi.spyOn(t.get(NotificationsService), 'send').mockResolvedValue(undefined as never);
  paddler = (await makeUser(orm(), { username: 'elmo' })).user as unknown as User;
  admin = (await makeUser(orm(), { username: 'maurice', role: 'admin' })).user as unknown as User;
});

afterEach(async () => {
  await t?.get(PaddleRegionsService).idle();
  vi.restoreAllMocks();
});

afterAll(async () => {
  await t?.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
});

const ask = async (user: User, points = [REGENSBURG], retry = false) => {
  const answers = await load.load(user, { points, retry });
  for (const answer of answers) expect(paddleRegionLoadStateSchema.safeParse(answer).success).toBe(true);
  return answers;
};

describe('PaddleRegionLoadService', () => {
  it('PLOAD-001: loads the smallest region around a place by itself, and follows it on the next ask', async () => {
    const [first] = await ask(paddler);
    expect(first).toMatchObject({ state: 'loading', region: { id: 'oberpfalz', name: 'Oberpfalz' } });
    expect(await findRow(orm(), PaddleRegions, { id: 'oberpfalz' })).toMatchObject({ origin: 'auto' });
    expect(sizeOf).toHaveBeenCalledWith('https://download.geofabrik.de/oberpfalz-latest.osm.pbf');
    await ask(paddler);
    expect(await findRows(orm(), PaddleRegions, {})).toHaveLength(1);
    expect(send).not.toHaveBeenCalled();
  });

  it('PLOAD-002: answers two places in one region with one decision', async () => {
    const answers = await ask(paddler, [REGENSBURG, { lat: 49.31, lng: 12.21 }]);
    expect(answers.map((answer) => answer.region?.id)).toEqual(['oberpfalz', 'oberpfalz']);
    expect(sizeOf).toHaveBeenCalledTimes(1);
  });

  it('PLOAD-003: sends a region over the size limit to the admins as a request, and tells them once', async () => {
    sizeOf.mockResolvedValue(900 * 1024 * 1024);
    const [answer] = await ask(paddler);
    expect(answer).toEqual({ state: 'requested', region: { id: 'oberpfalz', name: 'Oberpfalz' }, reason: 'too_large' });
    await ask(paddler);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'paddle_region_requested',
        scope: 'admin',
        params: { region: 'Oberpfalz', actor: 'elmo' },
      }),
    );
    expect(await findRows(orm(), PaddleRegions, {})).toHaveLength(0);
    expect(await load.pending()).toEqual([
      expect.objectContaining({ id: 'oberpfalz', reason: 'too_large', requested_by: 'elmo', declined: false }),
    ]);
  });

  it('PLOAD-004: holds TREK to a few regions a day and asks the admins for the next', async () => {
    for (let i = 0; i < PADDLE_AUTO_REGIONS_PER_DAY; i += 1) {
      await insertRow(orm(), PaddleRegions, { id: `auto-${i}`, name: `Auto ${i}`, origin: 'auto', status: 'ready' });
    }
    const [answer] = await ask(paddler);
    expect(answer).toMatchObject({ state: 'requested', reason: 'limit' });
  });

  it('PLOAD-005: in the ask mode files every region, while an admin planning loads it at once, whatever its size', async () => {
    await load.updateSettings({ mode: 'ask', max_mb: 500 });
    expect((await ask(paddler))[0]).toMatchObject({ state: 'requested', reason: 'ask' });
    sizeOf.mockResolvedValue(3000 * 1024 * 1024);
    expect((await ask(admin))[0]).toMatchObject({ state: 'loading', region: { id: 'oberpfalz' } });
    expect(await findRow(orm(), PaddleRegions, { id: 'oberpfalz' })).toMatchObject({ origin: 'admin' });
    expect(await load.pending()).toEqual([]);
  });

  it('PLOAD-006: switched off, or for a demo account, loads nothing and asks nobody', async () => {
    await load.updateSettings({ mode: 'off', max_mb: 500 });
    expect((await ask(paddler))[0]).toEqual({
      state: 'unavailable',
      region: { id: 'oberpfalz', name: 'Oberpfalz' },
      reason: 'off',
    });
    await load.updateSettings({ mode: 'auto', max_mb: 500 });
    vi.spyOn(t?.get(DemoService) as DemoService, 'isDemoUserId').mockResolvedValue(true);
    expect((await ask(paddler))[0]).toMatchObject({ state: 'unavailable', reason: 'off' });
    expect(await findRows(orm(), PaddleRegions, {})).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('PLOAD-007: a declined region is not asked for again; an admin adding it settles the request', async () => {
    sizeOf.mockResolvedValue(900 * 1024 * 1024);
    await ask(paddler);
    await load.decline('oberpfalz');
    expect((await ask(paddler))[0]).toEqual({ state: 'declined', region: { id: 'oberpfalz', name: 'Oberpfalz' } });
    expect(send).toHaveBeenCalledTimes(1);
    await t?.get(PaddleRegionsService).add('oberpfalz');
    expect(await findRows(orm(), PaddleRegionRequests, {})).toHaveLength(0);
    await expect(load.decline('oberpfalz')).rejects.toBeInstanceOf(DomainError);
  });

  it('PLOAD-008: says ready where a network covers the place, and nothing is loaded', async () => {
    await insertRow(orm(), PaddleRegions, { id: 'oberpfalz', name: 'Oberpfalz', status: 'ready' });
    vi.spyOn(t?.get(PaddleRoutingService) as PaddleRoutingService, 'regionsCovering').mockResolvedValue(['oberpfalz']);
    expect((await ask(paddler))[0]).toEqual({ state: 'ready', region: { id: 'oberpfalz', name: 'Oberpfalz' } });
    expect(sizeOf).not.toHaveBeenCalled();
  });

  it('PLOAD-009: a region held answers its read: failed, read again on retry, built anew when it has no network, else no water', async () => {
    const held = { id: 'oberpfalz', name: 'Oberpfalz', min_lat: 48.9, min_lng: 11.5, max_lat: 50, max_lng: 13 };
    await insertRow(orm(), PaddleRegions, { ...held, status: 'failed' });
    expect((await ask(paddler))[0]).toMatchObject({ state: 'failed' });
    expect((await ask(paddler, [REGENSBURG], true))[0]).toMatchObject({ state: 'loading' });
    await t?.get(PaddleRegionsService).idle();
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { status: 'ready' });
    const routing = t?.get(PaddleRoutingService) as PaddleRoutingService;
    vi.spyOn(routing, 'networks').mockResolvedValue(new Map());
    expect((await ask(paddler))[0]).toMatchObject({ state: 'loading' });
    await t?.get(PaddleRegionsService).idle();
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { status: 'ready' });
    vi.spyOn(routing, 'networks').mockResolvedValue(new Map([['oberpfalz', {} as never]]));
    expect((await ask(paddler))[0]).toEqual({ state: 'no_water', region: { id: 'oberpfalz', name: 'Oberpfalz' } });
  });

  it('PLOAD-010: says where nothing can be had: no extract around the place, or the list out of reach', async () => {
    expect((await ask(paddler, [ATLANTIC]))[0]).toEqual({ state: 'unavailable', region: null, reason: 'no_extract' });
    regions.mockRejectedValue(new Error('timeout'));
    expect((await ask(paddler, [MUERITZ]))[0]).toEqual({
      state: 'unavailable',
      region: null,
      reason: 'catalog_unavailable',
    });
  });

  it('PLOAD-011: the setting starts automatic at 500 MB and falls back there from a broken row', async () => {
    expect(await load.settings()).toEqual({ mode: 'auto', max_mb: 500 });
    expect(await load.updateSettings({ mode: 'ask', max_mb: 1000 })).toEqual({ mode: 'ask', max_mb: 1000 });
    const { AppSettings } = await import('../../../../src/db/entities/AppSettings.entity');
    await updateRows(orm(), AppSettings, { key: 'paddle_auto_load' }, { value: 'sometimes' });
    await updateRows(orm(), AppSettings, { key: 'paddle_auto_max_mb' }, { value: '99999' });
    expect(await load.settings()).toEqual({ mode: 'auto', max_mb: 500 });
  });

  it('PLOAD-012: a size Geofabrik does not announce counts as small enough; the download still caps it', async () => {
    sizeOf.mockResolvedValue(null);
    expect((await ask(paddler, [MUERITZ]))[0]).toMatchObject({
      state: 'loading',
      region: { id: 'mecklenburg-vorpommern' },
    });
  });
});
