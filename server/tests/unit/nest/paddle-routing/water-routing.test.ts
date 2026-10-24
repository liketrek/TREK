/**
 * PAD-11 from the extract to the planned leg: a piece of the world drawn in
 * the test, read by the region import, built into the water network and
 * routed on, as a region's read and a paddler's leg go in production.
 */
import { importExtract } from '../../../../src/nest/paddle-obstacles/paddle-import';
import { WaterRouter, type RouteProfile } from '../../../../src/nest/paddle-routing/engine/router';
import { decodeWaterGraph } from '../../../../src/nest/paddle-routing/water-graph';
import { lineMetres, WaterWorld } from '../../../helpers/water-world';
import type { PaddleRouteLeg } from '@trek/shared';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dir: string;
let n = 0;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-water-routing-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

const KAYAK: RouteProfile = { boat: 'kayak', lakeStyle: 'direct', lockPolicy: 'auto' };
const SUP: RouteProfile = { ...KAYAK, boat: 'sup' };

/** The world read as a region: its network's stats and a router on it. */
async function built(world: WaterWorld) {
  const path = join(dir, `world-${n++}.osm.pbf`);
  await writeFile(path, world.pbf());
  const phases: string[] = [];
  const outcome = await importExtract(path, 'test-region', (phase) => {
    if (phases.at(-1) !== phase) phases.push(phase);
  });
  if (!outcome.graph) throw new Error('no network built');
  return { ...outcome.graph, phases, router: new WaterRouter(decodeWaterGraph(Buffer.from(outcome.graph.bytes))) };
}

function ok(leg: PaddleRouteLeg): Extract<PaddleRouteLeg, { status: 'ok' }> {
  if (leg.status !== 'ok') throw new Error(`leg failed: ${leg.code}`);
  return leg;
}

const kinds = (leg: PaddleRouteLeg) => [...new Set(ok(leg).segments.map((segment) => segment.kind))];

/** In from the north, a lake 1 km wide and 3 km long (the Woblitz), out to the south. */
function woblitz(): WaterWorld {
  const world = new WaterWorld();
  world.line(
    [
      [0, 6000],
      [0, 4000],
    ],
    { waterway: 'river', name: 'Havel' },
  );
  world.ring(
    [
      [-500, 4000],
      [500, 4000],
      [500, 1000],
      [-500, 1000],
    ],
    { natural: 'water', name: 'Woblitz' },
  );
  world.line(
    [
      [0, 1000],
      [0, -1000],
    ],
    { waterway: 'river', name: 'Havel' },
  );
  return world;
}

/** A river 6 km long, flowing south, its centre line at east 0, a node every 100 m (node `k` at north 6000 - 100k). */
function river(world: WaterWorld, tags: Record<string, string> = {}) {
  return world.line(
    [
      [0, 6000],
      [0, 0],
    ],
    { waterway: 'river', name: 'Regen', ...tags },
  );
}

describe('water routing from an extract (PAD-11)', () => {
  it('WATER-001: follows a river between two points beside it, snapped onto it, named', async () => {
    const world = new WaterWorld();
    river(world);
    const { router, stats, phases } = await built(world);
    expect(phases).toEqual(['read', 'build']);
    expect(stats.water_km).toBeCloseTo(6, 1);

    const leg = ok(router.route(world.at(40, 5000), world.at(-30, 1000), KAYAK));
    expect(leg.distance_m).toBeGreaterThan(3950);
    expect(leg.distance_m).toBeLessThan(4050);
    expect(leg.snapped_m.from).toBeCloseTo(40, -1);
    expect(leg.segments).toEqual([expect.objectContaining({ kind: 'water', name: 'Regen' })]);
    expect(lineMetres(leg.geometry as [number, number][])).toBeCloseTo(leg.distance_m, -1);
  });

  it('WATER-002: a point far from the water is off it, two waters that never meet have no way between', async () => {
    const world = new WaterWorld();
    river(world);
    world.line(
      [
        [3000, 6000],
        [3000, 0],
      ],
      { waterway: 'river', name: 'Naab' },
    );
    const { router } = await built(world);
    const far = world.at(600, 3000);
    expect(router.route(world.at(0, 5000), far, KAYAK)).toEqual({ status: 'failed', code: 'not_on_water', at: far });
    expect(router.route(world.at(0, 5000), world.at(3000, 1000), KAYAK)).toEqual({
      status: 'failed',
      code: 'no_water_path',
      at: null,
    });
  });

  it('WATER-003: carries round a weir on the mapped portage, and round one without a portage on a short straight carry', async () => {
    const world = new WaterWorld();
    const regen = river(world);
    // A weir drawn across the river at 4 km, its portage on the west bank.
    world.line(
      [
        [-30, 4000],
        [30, 4000],
      ],
      { waterway: 'weir', name: 'Lindenmühle' },
      30,
    );
    world.line(
      [
        [0, 4060],
        [-25, 4050],
        [-25, 3950],
        [0, 3940],
      ],
      { canoe: 'portage', name: 'Umtragestelle' },
      40,
    );
    // A weir on the river's node at 2 km, with nothing mapped round it.
    world.tag(regen.refs[40] as number, { waterway: 'weir', name: 'Pielmühle' });
    const { router, stats } = await built(world);
    expect(stats.portages).toBeGreaterThanOrEqual(1);
    expect(stats.inferred_portages).toBeGreaterThanOrEqual(1);

    const leg = ok(router.route(world.at(0, 5500), world.at(0, 500), KAYAK));
    const portages = leg.segments.filter((segment) => segment.kind === 'portage');
    expect(portages.map((segment) => segment.source)).toEqual(['tagged', 'inferred']);
    expect(portages[0]?.name).toBe('Umtragestelle');
  });

  it('WATER-004: paddles grade 2 whitewater in a kayak and marks it, never in a SUP; grade 3 is no touring water', async () => {
    const world = new WaterWorld();
    world.line(
      [
        [0, 6000],
        [0, 3000],
      ],
      { waterway: 'river', name: 'Regen' },
    );
    world.line(
      [
        [0, 3000],
        [0, 2500],
      ],
      { waterway: 'river', name: 'Regen', 'whitewater:section_grade': '2' },
    );
    world.line(
      [
        [0, 2500],
        [0, 0],
      ],
      { waterway: 'river', name: 'Regen' },
    );
    world.line(
      [
        [5000, 6000],
        [5000, 3000],
      ],
      { waterway: 'river', name: 'Wild', 'whitewater:section_grade': '3' },
    );
    const { router } = await built(world);
    const kayak = ok(router.route(world.at(0, 5000), world.at(0, 1000), KAYAK));
    expect(kayak.segments.find((segment) => segment.kind === 'rapids')).toMatchObject({ grade: 2 });
    expect(router.route(world.at(0, 5000), world.at(0, 1000), SUP)).toMatchObject({ status: 'failed' });
    expect(router.route(world.at(5000, 5500), world.at(5000, 3500), KAYAK)).toMatchObject({ status: 'failed' });
  });

  it('WATER-005: crosses a lake straight over, along its shore when asked, and a SUP keeps to the shore anyway', async () => {
    const world = woblitz();
    const { router, stats } = await built(world);
    expect(stats.lakes).toBe(1);

    const from = world.at(0, 5000);
    const to = world.at(0, 0);
    const direct = ok(router.route(from, to, KAYAK));
    expect(kinds(direct)).toEqual(['water', 'lake']);
    expect(direct.segments.find((segment) => segment.kind === 'lake')?.name).toBe('Woblitz');
    const shore = ok(router.route(from, to, { ...KAYAK, lakeStyle: 'shore' }));
    const sup = ok(router.route(from, to, SUP));
    expect(shore.distance_m).toBeGreaterThan(direct.distance_m);
    expect(sup.distance_m).toBeGreaterThanOrEqual(direct.distance_m);
    // A point out on the lake is on the water too.
    expect(router.route(world.at(200, 2500), to, KAYAK).status).toBe('ok');
  });

  it('WATER-012: from a point out on a lake a SUP makes for the shore and the shore style follows it, neither drawn straight across', async () => {
    const world = woblitz();
    const { router } = await built(world);
    // 500 m off both side banks: past a SUP's reach of open water, and beyond the shore style's band.
    const from = world.at(0, 2500);
    const to = world.at(0, 0);
    const direct = ok(router.route(from, to, KAYAK));
    expect(direct.distance_m).toBeLessThan(2550);
    expect(ok(router.route(from, to, { ...KAYAK, lakeStyle: 'shore' })).distance_m).toBeGreaterThan(
      direct.distance_m + 200,
    );
    expect(ok(router.route(from, to, SUP)).distance_m).toBeGreaterThan(direct.distance_m + 200);
  });

  it('WATER-006: goes round an island of a multipolygon lake, not across it', async () => {
    const world = new WaterWorld();
    const outer = world.ring([
      [-1000, 1000],
      [1000, 1000],
      [1000, -1000],
      [-1000, -1000],
    ]);
    const island = world.ring([
      [-300, 300],
      [300, 300],
      [300, -300],
      [-300, -300],
    ]);
    world.relation(
      [
        { type: 'way', ref: outer, role: 'outer' },
        { type: 'way', ref: island, role: 'inner' },
      ],
      { type: 'multipolygon', natural: 'water', name: 'Müritz' },
    );
    const { router, stats } = await built(world);
    expect(stats.lakes).toBe(1);
    const leg = ok(router.route(world.at(0, 800), world.at(0, -800), KAYAK));
    expect(leg.distance_m).toBeGreaterThan(1600);
    const crossesIsland = leg.geometry.some(([lat, lng]) => {
      const centre = world.at(0, 0);
      const edge = world.at(250, 250);
      return Math.abs(lat - centre.lat) < edge.lat - centre.lat && Math.abs(lng - centre.lng) < edge.lng - centre.lng;
    });
    expect(crossesIsland).toBe(false);
  });

  it('WATER-007: joins a river end close to other water as water, bridges a wider break as a marked gap', async () => {
    const world = new WaterWorld();
    world.line(
      [
        [0, 3000],
        [0, 2000],
      ],
      { waterway: 'river' },
    );
    world.line(
      [
        [0, 1980],
        [0, 1000],
      ],
      { waterway: 'river' },
    );
    world.line(
      [
        [0, 920],
        [0, 0],
      ],
      { waterway: 'river' },
    );
    const { router, stats } = await built(world);
    expect(stats.gaps).toBeGreaterThanOrEqual(1);
    const leg = ok(router.route(world.at(0, 2900), world.at(0, 100), KAYAK));
    expect(kinds(leg)).toContain('gap');
  });

  it('WATER-008: takes the canoe pass beside a weir, and leaves a mill race to the mill', async () => {
    const world = new WaterWorld();
    const regen = river(world);
    world.tag(regen.refs[30] as number, { waterway: 'weir' });
    world.line(
      [
        [0, 3200],
        [-40, 3100],
        [-40, 2900],
        [0, 2800],
      ],
      { waterway: 'canoe_pass', name: 'Bootsgasse' },
      50,
    );
    world.line(
      [
        [0, 5000],
        [800, 4500],
        [800, 1500],
        [0, 1000],
      ],
      { waterway: 'canal', usage: 'headrace' },
    );
    const { router } = await built(world);
    const leg = ok(router.route(world.at(0, 5500), world.at(0, 500), KAYAK));
    expect(kinds(leg)).toContain('pass');
    expect(kinds(leg)).not.toContain('portage');
    expect(leg.distance_m).toBeLessThan(5300);
  });

  it('WATER-011: goes through an open lock by its own name, carries round it when told to, and only on a mapped way round a closed one', async () => {
    const world = new WaterWorld();
    const canal = (east: number, lock: Record<string, string>) => {
      world.line(
        [
          [east, 3000],
          [east, 2000],
        ],
        { waterway: 'canal', name: 'Müritz-Havel-Wasserstraße' },
      );
      world.line(
        [
          [east, 2000],
          [east, 1900],
        ],
        { waterway: 'canal', name: 'Müritz-Havel-Wasserstraße', lock: 'yes', ...lock },
        20,
      );
      world.line(
        [
          [east, 1900],
          [east, 0],
        ],
        { waterway: 'canal', name: 'Müritz-Havel-Wasserstraße' },
      );
    };
    canal(0, { lock_name: 'Schleuse Diemitz' });
    canal(3000, { lock_name: 'Schleuse Zu', boat: 'no' });
    canal(6000, { lock_name: 'Schleuse Gesperrt', boat: 'no' });
    world.line(
      [
        [6000, 2050],
        [6030, 2000],
        [6030, 1900],
        [6000, 1850],
      ],
      { canoe: 'portage' },
      30,
    );
    const { router, stats } = await built(world);
    expect(stats.locks).toBeGreaterThanOrEqual(1);

    const through = ok(router.route(world.at(0, 2800), world.at(0, 200), KAYAK));
    expect(through.segments.find((segment) => segment.kind === 'lock')?.name).toBe('Schleuse Diemitz');
    const carried = ok(router.route(world.at(0, 2800), world.at(0, 200), { ...KAYAK, lockPolicy: 'portage' }));
    expect(kinds(carried)).toContain('portage');
    expect(kinds(carried)).not.toContain('lock');

    expect(router.route(world.at(3000, 2800), world.at(3000, 200), KAYAK).status).toBe('failed');
    const round = ok(router.route(world.at(6000, 2800), world.at(6000, 200), KAYAK));
    expect(round.segments.find((segment) => segment.kind === 'portage')?.source).toBe('tagged');
  });

  it('WATER-009: a search past its time answers timeout, not a route; a leg along one stretch needs no search', async () => {
    const world = new WaterWorld();
    for (const [from, to] of [
      [6000, 3000],
      [3000, 0],
    ]) {
      world.line(
        [
          [0, from as number],
          [0, to as number],
        ],
        { waterway: 'river' },
      );
    }
    const { router } = await built(world);
    expect(router.route(world.at(0, 5000), world.at(0, 4000), KAYAK, Date.now() - 1).status).toBe('ok');
    expect(router.route(world.at(0, 5000), world.at(0, 1000), KAYAK, Date.now() - 1)).toEqual({
      status: 'failed',
      code: 'timeout',
      at: null,
    });
  });

  it('WATER-010: an extract without water it routes on builds no network', async () => {
    const world = new WaterWorld();
    world.line(
      [
        [0, 1000],
        [0, 0],
      ],
      { highway: 'path' },
    );
    const path = join(dir, `world-${n++}.osm.pbf`);
    await writeFile(path, world.pbf());
    const outcome = await importExtract(path, 'dry', () => undefined);
    expect(outcome.graph).toBeNull();
  });
});
