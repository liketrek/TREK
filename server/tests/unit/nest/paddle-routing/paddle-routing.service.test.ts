/**
 * PaddleRoutingService over a snapshot db and a temp data folder: a region's
 * network written and recorded as the import does it, legs planned on the
 * smallest region covering both ends, the failures per leg, the files swept,
 * replaced and discarded, and the counts the admin list reads.
 */
import { PaddleRegions } from '../../../../src/db/entities/PaddleRegions.entity';
import { PaddleWaterGraphs } from '../../../../src/db/entities/PaddleWaterGraphs.entity';
import { AppConfigModule } from '../../../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { importExtract } from '../../../../src/nest/paddle-obstacles/paddle-import';
import { PaddleRoutingModule } from '../../../../src/nest/paddle-routing/paddle-routing.module';
import { PaddleRoutingService } from '../../../../src/nest/paddle-routing/paddle-routing.service';
import { PADDLE_ROUTER_RUNNER, type RouterRunner } from '../../../../src/nest/paddle-routing/router-runner';
import type { BuiltWaterGraph } from '../../../../src/nest/paddle-routing/water-graph.contract';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { WaterWorld } from '../../../helpers/water-world';
import { MikroORM } from '@mikro-orm/core';
import { paddleRouteRequestSchema, type PaddleRouteInput } from '@trek/shared';

import { existsSync } from 'node:fs';
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

let dir: string;
let t: TestModule | undefined;
let service: PaddleRoutingService;

/** Two pieces of water: a long river in the west region, a short one inside it in the east region's box too. */
const west = new WaterWorld({ lat: 49, lng: 12 });
west.line(
  [
    [0, 6000],
    [0, 0],
  ],
  { waterway: 'river', name: 'Regen' },
);
const east = new WaterWorld({ lat: 49, lng: 12.5 });
east.line(
  [
    [0, 3000],
    [0, 0],
  ],
  { waterway: 'river', name: 'Naab' },
);

let westGraph: BuiltWaterGraph;
let eastGraph: BuiltWaterGraph;

async function graphOf(world: WaterWorld): Promise<BuiltWaterGraph> {
  const path = join(dir, `world-${Math.random().toString(36).slice(2)}.osm.pbf`);
  await writeFile(path, world.pbf());
  const { graph } = await importExtract(path, 'region', () => undefined);
  if (!graph) throw new Error('no network');
  return graph;
}

const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};
const inContext = <T>(work: () => Promise<T>) => withRequestContext(orm(), work);
const graphsDir = () => join(dir, 'paddle', 'graphs');

/** A region's network as the import hands it over: written, then recorded. */
async function install(regionId: string, built: BuiltWaterGraph) {
  if ((await countRows(orm(), PaddleRegions, { id: regionId })) === 0) {
    await insertRow(orm(), PaddleRegions, { id: regionId, name: regionId, status: 'ready' });
  }
  const file = await service.writeGraphFile(regionId, built);
  const previous = await inContext(() => service.recordGraph(regionId, file, built));
  await service.replaced(previous, file);
  return file;
}

const plan = (input: PaddleRouteInput) => inContext(() => service.route(paddleRouteRequestSchema.parse(input)));

async function boot(runner?: RouterRunner) {
  await t?.close();
  t = await createTestModule({
    db,
    imports: [AppConfigModule, PaddleRoutingModule],
    overrides: [
      { provide: DataPathsService, useValue: { dataDir: dir, tmpDir: dir } },
      ...(runner ? [{ provide: PADDLE_ROUTER_RUNNER, useValue: runner }] : []),
    ],
  });
  service = t.get(PaddleRoutingService);
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-routing-'));
  westGraph = await graphOf(west);
  eastGraph = await graphOf(east);
});

beforeEach(async () => {
  resetTestDb(db);
  vi.clearAllMocks();
  await rm(join(dir, 'paddle'), { recursive: true, force: true });
  await boot();
});

afterEach(async () => {
  await t?.close();
  t = undefined;
});

afterAll(async () => {
  db.close();
  await rm(dir, { recursive: true, force: true });
});

describe('PaddleRoutingService', () => {
  it('PADROUTE-SVC-001: plans a leg on the region that covers it, and fails a leg no region covers on its own', async () => {
    await install('oberpfalz', westGraph);
    const answer = await plan({
      legs: [
        { from: west.at(0, 5000), to: west.at(0, 1000) },
        { from: west.at(0, 5000), to: { lat: 10, lng: 10 } },
        { from: { lat: 10, lng: 10 }, to: west.at(0, 1000) },
      ],
    });
    expect(answer.legs[0]).toMatchObject({ status: 'ok' });
    expect(answer.legs[1]).toEqual({ status: 'failed', code: 'no_region', at: { lat: 10, lng: 10 } });
    expect(answer.legs[2]).toEqual({ status: 'failed', code: 'no_region', at: { lat: 10, lng: 10 } });
    expect(answer.graph_rev).toBe(westGraph.rev);
  });

  it('PADROUTE-SVC-002: a leg between two regions that share no box fails as cross region; no region at all answers no rev', async () => {
    await install('oberpfalz', westGraph);
    await install('niederbayern', eastGraph);
    const cross = await plan({ legs: [{ from: west.at(0, 5000), to: east.at(0, 2000) }] });
    expect(cross.legs[0]).toEqual({ status: 'failed', code: 'cross_region', at: east.at(0, 2000) });
    expect(cross.graph_rev).toBeNull();
  });

  it('PADROUTE-SVC-003: legs of two regions are planned each on its own, the revs joined', async () => {
    await install('oberpfalz', westGraph);
    await install('niederbayern', eastGraph);
    const answer = await plan({
      legs: [
        { from: west.at(0, 5000), to: west.at(0, 1000) },
        { from: east.at(0, 2500), to: east.at(0, 500) },
      ],
    });
    expect(answer.legs.map((leg) => leg.status)).toEqual(['ok', 'ok']);
    expect(answer.graph_rev?.split('+').sort()).toEqual([westGraph.rev, eastGraph.rev].sort());
  });

  it('PADROUTE-SVC-004: a runner that fails answers busy for its legs, one past its time timeout', async () => {
    const runner: RouterRunner = {
      run: vi.fn().mockRejectedValueOnce(new Error('worker exited')).mockRejectedValueOnce(new Error('timeout')),
      forget: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
    await boot(runner);
    await install('oberpfalz', westGraph);
    const leg = { from: west.at(0, 5000), to: west.at(0, 1000) };
    expect((await plan({ legs: [leg] })).legs).toEqual([{ status: 'failed', code: 'busy', at: null }]);
    expect((await plan({ legs: [leg] })).legs).toEqual([{ status: 'failed', code: 'timeout', at: null }]);
    expect(log.logInfo).toHaveBeenCalledWith(expect.stringContaining('worker exited'));
    await t?.close();
    t = undefined;
    expect(runner.close).toHaveBeenCalled();
  });

  it('PADROUTE-SVC-005: a rebuilt region replaces its file and the router forgets the old one; the same build keeps it', async () => {
    const runner: RouterRunner = { run: vi.fn(), forget: vi.fn(), close: vi.fn().mockResolvedValue(undefined) };
    await boot(runner);
    const first = await install('oberpfalz', westGraph);
    expect(await readdir(graphsDir())).toEqual([first]);
    const again = await install('oberpfalz', westGraph);
    expect(again).toBe(first);
    expect(runner.forget).not.toHaveBeenCalled();

    const second = await install('oberpfalz', eastGraph);
    expect(await readdir(graphsDir())).toEqual([second]);
    expect(runner.forget).toHaveBeenCalledWith(join(graphsDir(), first));
    expect(await countRows(orm(), PaddleWaterGraphs)).toBe(1);
  });

  it('PADROUTE-SVC-006: a file whose import did not commit is discarded; the sweep clears files no region names and halves of a write', async () => {
    const kept = await install('oberpfalz', westGraph);
    const orphan = await service.writeGraphFile('gone/region', eastGraph);
    expect(orphan).toMatch(/^gone_region\./);
    await writeFile(join(graphsDir(), 'half.wgraph.tmp'), 'x');
    await writeFile(join(graphsDir(), 'notes.txt'), 'kept');
    await inContext(() => service.sweep());
    expect((await readdir(graphsDir())).sort()).toEqual([kept, 'notes.txt'].sort());

    const unrecorded = await service.writeGraphFile('other', eastGraph);
    await service.discard(unrecorded);
    expect(existsSync(join(graphsDir(), unrecorded))).toBe(false);
  });

  it('PADROUTE-SVC-007: lists the network of each region with its counts, its build time and its size; a broken row lists none', async () => {
    await install('oberpfalz', westGraph);
    await install('niederbayern', eastGraph);
    await updateRows(orm(), PaddleWaterGraphs, { region_id: 'niederbayern' }, { stats: 'not json' });
    const networks = await inContext(() => service.networks());
    expect([...networks.keys()]).toEqual(['oberpfalz']);
    expect(networks.get('oberpfalz')).toMatchObject({
      ...westGraph.stats,
      bytes: westGraph.bytes.byteLength,
      built_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
    });
  });

  it('PADROUTE-SVC-008: the boot sweep runs without a folder, and a failing sweep is logged, never thrown', async () => {
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    await mkdir(join(dir, 'paddle'), { recursive: true });
    await writeFile(graphsDir(), 'a file where the folder should be');
    vi.spyOn(service, 'sweep').mockRejectedValueOnce(new Error('disk gone'));
    await service.onApplicationBootstrap();
    expect(log.logError).toHaveBeenCalledWith(expect.stringContaining('disk gone'));
  });
});
