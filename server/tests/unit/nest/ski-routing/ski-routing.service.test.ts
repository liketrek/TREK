/**
 * The piste router service (spec 7, 11): what it answers when TREK Places or
 * the admin switch is off, while an index or an area is still on its way, on
 * an area kept from an older build, when the router's thread is busy or slow,
 * and with every leg planned on the areas that hold its ends. The Places host
 * is a stub; the areas are kept in a temp folder and planned on the calling
 * thread.
 */
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { TrekPlacesWinterService } from '../../../../src/nest/maps/trek-places-winter.service';
import { SkiAreasService } from '../../../../src/nest/ski-routing/ski-areas.service';
import { InlineSkiRouterRunner, SKI_ROUTER_RUNNER } from '../../../../src/nest/ski-routing/ski-router-runner';
import {
  LOADING_MS,
  profileOf,
  settleWithin,
  SkiRoutingService,
} from '../../../../src/nest/ski-routing/ski-routing.service';
import { SkiWorld } from '../../../helpers/ski-world';
import { Test } from '@nestjs/testing';
import { skiRouteRequestSchema, skiRouteResponseSchema, type SkiRouteInput, type WinterIndexRow } from '@trek/shared';

import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
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

/** Testalp, a run and a lift; Nachbaralp 20 km east, a run of its own. */
const testalp = new SkiWorld({ lat: 46, lng: 7 }, { areaId: 'w:1', build: '2026-11-02', name: 'Testalp' });
const valley = testalp.node(0, 0, 1200);
const top = testalp.node(0, 2000, 2200);
testalp.lift(valley, top, { name: 'Sonnenbahn', sec: 420 });
testalp.run(top, valley, 1, { name: 'Talabfahrt', via: [[300, 1000]] });
const nachbar = new SkiWorld({ lat: 46, lng: 7.26 }, { areaId: 'w:2', build: '2026-11-02', name: 'Nachbaralp' });
nachbar.run(nachbar.node(0, 1000, 1800), nachbar.node(0, 0, 1300), 1, { name: 'Nachbarpiste' });

function rowOf(world: SkiWorld, id: string, name: string): WinterIndexRow {
  const gz = world.gz();
  const south = world.at(-500, -500);
  const north = world.at(500, 2500);
  return {
    id,
    name,
    kind: 'resort',
    country: null,
    colourScheme: 'europe',
    bbox: [south.lng, south.lat, north.lng, north.lat],
    counts: { runsKm: 2, nordicKm: 0, lifts: 1, skitourKm: 0, hikeKm: 0 },
    bytes: gz.length,
    sha256: sha(gz),
  };
}

const ROWS = [rowOf(testalp, 'w:1', 'Testalp'), rowOf(nachbar, 'w:2', 'Nachbaralp')];
const GZ: Record<string, Buffer> = { 'w:1': testalp.gz(), 'w:2': nachbar.gz() };

let dir: string;
const winter = { enabled: vi.fn(), meta: vi.fn(), index: vi.fn(), area: vi.fn() };
const addons = { getToursSkiRouting: vi.fn() };
const runner = { run: vi.fn(), forget: vi.fn(), close: vi.fn() };

async function build(inline = true) {
  const inlineRunner = new InlineSkiRouterRunner();
  runner.run.mockImplementation((job) => inlineRunner.run(job));
  const moduleRef = await Test.createTestingModule({
    providers: [
      SkiRoutingService,
      SkiAreasService,
      { provide: DataPathsService, useValue: { dataDir: dir } },
      { provide: TrekPlacesWinterService, useValue: winter },
      { provide: AddonsService, useValue: addons },
      { provide: SKI_ROUTER_RUNNER, useValue: inline ? inlineRunner : runner },
    ],
  }).compile();
  return { routing: moduleRef.get(SkiRoutingService), areas: moduleRef.get(SkiAreasService) };
}

const request = (input: Partial<SkiRouteInput> & Pick<SkiRouteInput, 'legs'>) =>
  skiRouteRequestSchema.parse({ discipline: 'alpine', ...input });

const down = { from: testalp.at(0, 2000), to: testalp.at(0, 0) };

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-ski-routing-'));
  const json = Buffer.from(JSON.stringify({ build: '2026-11-02', format: 1, areas: ROWS }));
  const meta = {
    build: '2026-11-02',
    format: 1,
    areas: ROWS.length,
    indexSha: sha(json),
    sourceTimestamp: null,
    attribution: { data: '© OpenStreetMap contributors, ODbL', terrain: 'Terrain: Mapzen Terrarium' },
  };
  winter.enabled.mockReset().mockReturnValue(true);
  winter.meta.mockReset().mockResolvedValue(meta);
  winter.index.mockReset().mockResolvedValue({
    status: 'ok',
    index: { build: '2026-11-02', format: 1, areas: ROWS },
    sha256: meta.indexSha,
    dropped: 0,
  });
  winter.area.mockReset().mockImplementation(async (id: string) => ({ status: 'ok', bytes: GZ[id], etag: null }));
  addons.getToursSkiRouting.mockReset().mockResolvedValue({ enabled: true });
  runner.run.mockReset();
  runner.close.mockReset();
});

afterEach(async () => {
  vi.useRealTimers();
  await rm(dir, { recursive: true, force: true });
});

describe('when nothing can be planned here', () => {
  it('SKISVC-001: TREK Places switched off: every leg drawn freely, nothing asked of the host', async () => {
    winter.enabled.mockReturnValue(false);
    const { routing } = await build();
    const answer = await routing.route(request({ legs: [down, down] }));
    expect(answer.legs).toEqual([
      { status: 'failed', code: 'places_unavailable', at: null, hint: { free_draw: true }, detail: null },
      { status: 'failed', code: 'places_unavailable', at: null, hint: { free_draw: true }, detail: null },
    ]);
    expect(answer).toMatchObject({ build: null, stale: false, area_names: [] });
    expect(winter.meta).not.toHaveBeenCalled();
  });

  it('SKISVC-002: the admin switched piste routing off: disabled, drawn freely', async () => {
    addons.getToursSkiRouting.mockResolvedValue({ enabled: false });
    const { routing } = await build();
    const answer = await routing.route(request({ legs: [down] }));
    expect(answer.legs[0]).toMatchObject({ status: 'failed', code: 'disabled', hint: { free_draw: true } });
    expect(skiRouteResponseSchema.parse(answer)).toEqual(answer);
  });

  it('SKISVC-003: no index to be had: places unavailable; an index slower than the wait: loading', async () => {
    winter.meta.mockRejectedValue(new Error('TREK Places API 503'));
    const { routing } = await build();
    expect((await routing.route(request({ legs: [down] }))).legs[0]).toMatchObject({ code: 'places_unavailable' });

    winter.meta.mockImplementation(() => new Promise(() => undefined));
    const slow = await build();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const pending = slow.routing.route(request({ legs: [down] }));
    await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
    await vi.advanceTimersByTimeAsync(LOADING_MS);
    expect((await pending).legs[0]).toMatchObject({ status: 'failed', code: 'loading', hint: null });
  });
});

describe('legs on the areas that hold them', () => {
  it('SKISVC-010: plans a leg on its area, with the build, the area name and the attribution', async () => {
    const { routing } = await build();
    const answer = await routing.route(request({ legs: [down] }));
    expect(answer.legs[0]).toMatchObject({ status: 'ok', area_ids: ['w:1'] });
    expect(answer).toMatchObject({
      build: '2026-11-02',
      stale: false,
      area_names: ['Testalp'],
      attribution: '© OpenStreetMap contributors, ODbL. Terrain: Mapzen Terrarium',
    });
    expect(skiRouteResponseSchema.parse(answer)).toEqual(answer);
    expect(winter.area).toHaveBeenCalledWith('w:1', null);
  });

  it('SKISVC-011: answers each leg on its own: off every area, across two areas, on the next area', async () => {
    const { routing } = await build();
    const lowland = { lat: 53.5, lng: 10 };
    const answer = await routing.route(
      request({
        legs: [
          { from: lowland, to: testalp.at(0, 0) },
          { from: testalp.at(0, 2000), to: nachbar.at(0, 0) },
          { from: nachbar.at(0, 1000), to: nachbar.at(0, 0) },
        ],
      }),
    );
    expect(answer.legs[0]).toEqual({ status: 'failed', code: 'no_area', at: lowland, hint: null, detail: null });
    expect(answer.legs[1]).toMatchObject({ status: 'failed', code: 'cross_area' });
    expect(answer.legs[2]).toMatchObject({ status: 'ok', area_ids: ['w:2'] });
    expect(answer.area_names).toEqual(['Nachbaralp']);
  });

  it('SKISVC-012: a leg goes on from the leg before it on the same area', async () => {
    const { routing } = await build();
    const answer = await routing.route(
      request({
        legs: [
          { from: testalp.at(0, 0), to: testalp.at(0, 2000) },
          { from: testalp.at(0, 2000), to: testalp.at(0, 0) },
        ],
      }),
    );
    expect(answer.legs.map((leg) => leg.status)).toEqual(['ok', 'ok']);
    const [up, run] = answer.legs;
    if (up?.status !== 'ok' || run?.status !== 'ok') throw new Error('not planned');
    expect(up.segments.map((s) => s.kind)).toEqual(['lift']);
    expect(run.segments.map((s) => s.name)).toEqual(['Talabfahrt']);
  });

  it('SKISVC-013: an area slower than the wait: loading, named; one that cannot be had: drawn freely', async () => {
    winter.area.mockImplementation(() => new Promise(() => undefined));
    const { routing, areas } = await build();
    // The index is here already; only the area is on its way.
    await areas.index();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const pending = routing.route(request({ legs: [down] }));
    await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
    await vi.advanceTimersByTimeAsync(LOADING_MS);
    expect((await pending).legs[0]).toMatchObject({ code: 'loading', detail: { name: 'Testalp' } });
    vi.useRealTimers();

    winter.area.mockRejectedValue(Object.assign(new Error('TREK Places API 503'), { status: 503 }));
    const fresh = await build();
    expect((await fresh.routing.route(request({ legs: [down] }))).legs[0]).toMatchObject({
      code: 'places_unavailable',
      hint: { free_draw: true },
    });
  });

  it('SKISVC-014: plans on an older copy of the area while the host is down, and says so', async () => {
    const { routing, areas } = await build();
    await routing.route(request({ legs: [down] }));
    const index = await areas.index();
    const kept = index?.areas[0];
    if (!kept) throw new Error('no index');
    kept.row = { ...kept.row, sha256: sha('a newer build') };
    winter.area.mockRejectedValue(Object.assign(new Error('TREK Places API 503'), { status: 503 }));
    const answer = await routing.route(request({ legs: [down] }));
    expect(answer.legs[0]).toMatchObject({ status: 'ok' });
    expect(answer.stale).toBe(true);
  });

  it('SKISVC-015: a busy or slow thread answers busy or timeout; a graph it cannot read, drawn freely', async () => {
    const { routing } = await build(false);
    runner.run.mockRejectedValueOnce(new Error('busy'));
    expect((await routing.route(request({ legs: [down] }))).legs[0]).toMatchObject({ code: 'busy', hint: null });
    runner.run.mockRejectedValueOnce(new Error('timeout'));
    expect((await routing.route(request({ legs: [down] }))).legs[0]).toMatchObject({ code: 'timeout' });
    runner.run.mockRejectedValueOnce(new Error('SGR1 format 2 is not 1'));
    expect((await routing.route(request({ legs: [down] }))).legs[0]).toMatchObject({
      code: 'places_unavailable',
      hint: { free_draw: true },
    });
    await routing.onApplicationShutdown();
    expect(runner.close).toHaveBeenCalled();
  });
});

describe('the area at a point and its lines', () => {
  it('SKISVC-020: the area at a point, its download started, ready once here; none off every area', async () => {
    const { routing } = await build();
    const near = await routing.areaNear(46.005, 7.001);
    expect(near.area).toMatchObject({ id: 'w:1', name: 'Testalp', kind: 'resort', colour_scheme: 'europe' });
    expect(['loading', 'ready']).toContain(near.area?.state);
    await vi.waitFor(async () => expect((await routing.areaNear(46.005, 7.001)).area?.state).toBe('ready'));
    expect(await routing.areaNear(53.5, 10)).toEqual({ area: null });
    addons.getToursSkiRouting.mockResolvedValue({ enabled: false });
    expect((await routing.areaNear(46.005, 7.001)).area?.state).toBe('unavailable');
    // TREK Places off: the area kept from before is named, but nothing is fetched for it.
    winter.enabled.mockReturnValue(false);
    const off = await build();
    expect((await off.routing.areaNear(46.005, 7.001)).area?.state).toBe('unavailable');
  });

  it('SKISVC-021: an area lines for the map with its checksum; an unknown one 404, none to be had 503', async () => {
    const { routing } = await build();
    const lines = await routing.network('w:1');
    expect(lines).toMatchObject({ area_id: 'w:1', build: '2026-11-02', colour_scheme: 'europe', simplified_m: 5 });
    expect(lines.sha256).toBe(ROWS[0]?.sha256);
    expect(lines.features.map((feature) => feature.name).sort()).toEqual(['Sonnenbahn', 'Talabfahrt']);
    await expect(routing.network('w:999')).rejects.toMatchObject({ status: 404 });
    winter.area.mockRejectedValue(Object.assign(new Error('TREK Places API 503'), { status: 503 }));
    await expect(routing.network('w:2')).rejects.toBeInstanceOf(DomainError);
    addons.getToursSkiRouting.mockResolvedValue({ enabled: false });
    await expect(routing.network('w:1')).rejects.toMatchObject({ status: 503 });
  });
});

describe('helpers', () => {
  it('SKISVC-030: settleWithin tells done, failed and pending, and leaves no failure unhandled', async () => {
    expect(await settleWithin(Promise.resolve(4), 10)).toEqual({ status: 'done', value: 4 });
    const error = new Error('no');
    expect(await settleWithin(Promise.reject(error), 10)).toEqual({ status: 'failed', error });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let fail: (err: Error) => void = () => undefined;
    const late = new Promise<number>((_resolve, reject) => (fail = reject));
    const settled = settleWithin(late, 50);
    await vi.advanceTimersByTimeAsync(50);
    expect(await settled).toEqual({ status: 'pending' });
    fail(new Error('later'));
  });

  it('SKISVC-031: a technique only for cross-country, either when none was named, lifts by discipline', () => {
    const legs = [down];
    expect(profileOf(request({ legs, technique: 'classic' })).technique).toBeNull();
    expect(profileOf(request({ legs, discipline: 'cross_country' })).technique).toBe('unknown');
    expect(profileOf(request({ legs, discipline: 'cross_country', technique: 'skating' })).technique).toBe('skating');
    expect(profileOf(request({ legs })).useLifts).toBe(true);
    expect(profileOf(request({ legs, discipline: 'touring' })).useLifts).toBe(false);
    expect(profileOf(request({ legs, options: { groomed_only: true } })).options.groomed_only).toBe(false);
  });
});
