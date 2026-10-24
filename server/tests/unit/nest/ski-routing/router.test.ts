/**
 * The piste router on drawn ski areas (spec 7.4, 7.5, 12.2): runs one way,
 * lifts only through their stations, a start inside a run, the reachable one
 * of two parallel runs, legs that go on from each other, pieces of a split
 * network stitched, other ways, and the notes a planned leg carries.
 */
import { compileProfile } from '../../../../src/nest/ski-routing/engine/profile';
import { searchPath } from '../../../../src/nest/ski-routing/engine/router';
import { LIFT_SNAP_M, MAX_SNAPS, snapPoint } from '../../../../src/nest/ski-routing/engine/snap';
import { stitchGraphs } from '../../../../src/nest/ski-routing/engine/stitch';
import { EdgeFlag, Lift, NodeFlag } from '../../../../src/nest/ski-routing/ski-graph.contract';
import { profileOf } from '../../../../src/nest/ski-routing/ski-routing.service';
import { failedLeg, okLeg, planOn } from '../../../helpers/ski-plan';
import { SkiWorld } from '../../../helpers/ski-world';
import { skiRouteRequestSchema, skiRouteResponseSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * Testalp: a chair from the valley to the top, a red run to the middle
 * station and a blue one on down, and a black run straight down beside them.
 */
function testalp() {
  const world = new SkiWorld();
  const valley = world.node(0, 0, 1200);
  const top = world.node(0, 2000, 2200);
  const mid = world.node(600, 1000, 1700);
  world.lift(valley, top, { name: 'Sonnenbahn', sec: 420, cap: 2400 });
  world.run(top, mid, 2, { name: 'Rote Eins', ref: '1' });
  world.run(mid, valley, 1, { name: 'Blaue Zwei' });
  world.run(top, valley, 3, { name: 'Schwarze Wand', via: [[-300, 1000]] });
  return { world, valley: world.at(0, 0), top: world.at(0, 2000), mid: world.at(600, 1000) };
}

const RED_M = Math.hypot(600, 1000);

describe('runs and lifts', () => {
  it('SKIROUTE-001: skis the runs within the limit, the harder one left out, at the times of the cost model', () => {
    const { world, top, valley } = testalp();
    const leg = okLeg(planOn(world, [[top, valley]])[0]);
    expect(leg.segments.map((s) => [s.kind, s.name, s.difficulty])).toEqual([
      ['run', 'Rote Eins', 'intermediate'],
      ['run', 'Blaue Zwei', 'easy'],
    ]);
    expect(leg.segments[0]?.ref).toBe('1');
    expect(leg.distance_m).toBeCloseTo(2 * RED_M, 0);
    expect(leg.descent_m).toBe(1000);
    expect(leg.climb_m).toBe(0);
    expect(leg.seconds.ski).toBeCloseTo(RED_M / 8.5 + RED_M / 7, 3);
    expect(leg.seconds).toMatchObject({ lift: 0, wait: 0, walk: 0 });
    expect(leg.geometry[0]?.[0]).toBeCloseTo(top.lat, 6);
    expect(leg.geometry[leg.geometry.length - 1]?.[1]).toBeCloseTo(valley.lng, 6);
    expect(leg.geometry[0]?.[2]).toBe(2200);
    expect(leg.snapped_m).toEqual({ from: 0, to: 0 });
    expect(leg.area_ids).toEqual(['w:1']);
    expect(skiRouteResponseSchema.shape.legs.element.safeParse(leg).success).toBe(true);
  });

  it('SKIROUTE-002: takes the black run once the limit allows it, it being quicker', () => {
    const { world, top, valley } = testalp();
    const leg = okLeg(planOn(world, [[top, valley]], { options: { max_difficulty: 'advanced' } })[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Schwarze Wand']);
    expect(leg.segments[0]?.difficulty).toBe('advanced');
  });

  it('SKIROUTE-003: goes up by the lift, boarded and left at its stations, with its wait and its ride', () => {
    const { world, top, valley } = testalp();
    const leg = okLeg(planOn(world, [[valley, top]])[0]);
    expect(leg.segments).toHaveLength(1);
    expect(leg.segments[0]).toMatchObject({
      kind: 'lift',
      name: 'Sonnenbahn',
      lift_type: 'chair_detachable',
      seconds: 435,
      wait_seconds: 90,
      difficulty: null,
    });
    expect(leg.seconds).toEqual({ ski: 0, lift: 435, wait: 90, walk: 0 });
    expect(leg.climb_m).toBe(1000);
  });

  it('SKIROUTE-004: a start inside a run goes on down it from there, never up', () => {
    const { world, valley } = testalp();
    const halfway = world.at(300, 1500);
    const leg = okLeg(planOn(world, [[halfway, valley]])[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Rote Eins', 'Blaue Zwei']);
    expect(leg.segments[0]?.length_m).toBeCloseTo(RED_M / 2, 0);
    expect(leg.snapped_m.from).toBeLessThan(1);
    expect(leg.geometry[0]?.[0]).toBeCloseTo(halfway.lat, 6);
  });

  it('SKIROUTE-005: a click right beside a lift line means the lift, a click at a station that station', () => {
    const { world, valley, top } = testalp();
    const net = stitchGraphs([world.graph()]);
    const request = skiRouteRequestSchema.parse({ legs: [{ from: top, to: top }], discipline: 'alpine' });
    const costs = compileProfile(profileOf(request), net);
    const beside = world.at(25, 1000);
    expect(LIFT_SNAP_M).toBe(40);
    const from = snapPoint(net, costs, beside.lat, beside.lng, 150, 'from');
    expect(from).toHaveLength(1);
    expect(from[0]).toMatchObject({ edge: -1, startCost: 0 });
    expect(from[0]?.lat).toBeCloseTo(valley.lat, 6);
    const to = snapPoint(net, costs, beside.lat, beside.lng, 150, 'to');
    expect(to[0]?.lat).toBeCloseTo(top.lat, 6);
    const leg = okLeg(planOn(world, [[beside, top]])[0]);
    expect(leg.segments.map((s) => s.kind)).toEqual(['lift']);
    expect(leg.snapped_m.from).toBeCloseTo(Math.hypot(25, 1000), -1);
    expect(MAX_SNAPS).toBe(5);
  });
});

describe('where a leg joins the network', () => {
  /** Two parallel runs 60 m apart: Ost reaches the valley station, West ends 200 m above it. */
  function parallel() {
    const world = new SkiWorld();
    const eastTop = world.node(0, 1000, 1800);
    const station = world.node(0, 0, 1300);
    const westTop = world.node(60, 1000, 1800);
    const westEnd = world.node(60, 200, 1400);
    world.run(eastTop, station, 1, { name: 'Ost' });
    world.run(westTop, westEnd, 1, { name: 'West' });
    return { world, station: world.at(0, 0) };
  }

  it('SKIROUTE-010: of two parallel runs, the one that gets there, though the click is nearer the other', () => {
    const { world, station } = parallel();
    const leg = okLeg(planOn(world, [[world.at(35, 600), station]])[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Ost']);
    expect(leg.snapped_m.from).toBeCloseTo(35, 0);
  });

  it('SKIROUTE-011: a leg goes on from where the one before ended, not from wherever its point is nearest', () => {
    const { world, station } = parallel();
    const between = world.at(35, 500);
    const legs = planOn(world, [
      [world.at(35, 900), between],
      [between, station],
    ]);
    // The first leg ends on West, the nearer run; from there no run reaches the station.
    expect(okLeg(legs[0]).segments.map((s) => s.name)).toEqual(['West']);
    expect(failedLeg(legs[1]).code).toBe('disconnected');
    // Planned on its own, the second leg finds Ost.
    const alone = planOn(world, [[between, station]]);
    expect(okLeg(alone[0]).segments.map((s) => s.name)).toEqual(['Ost']);
    const unchained = planOn(
      world,
      [
        [world.at(35, 900), between],
        [between, station],
      ],
      { chained: false },
    );
    expect(okLeg(unchained[1]).segments.map((s) => s.name)).toEqual(['Ost']);
  });

  it('SKIROUTE-012: both ends on one run plan the stretch between them; ends at one spot, a leg of no length', () => {
    const { world } = parallel();
    const leg = okLeg(planOn(world, [[world.at(0, 900), world.at(0, 300)]])[0]);
    expect(leg.segments).toHaveLength(1);
    expect(leg.segments[0]?.length_m).toBeCloseTo(600, 0);
    const still = okLeg(planOn(world, [[world.at(0, 500), world.at(0, 500)]])[0]);
    expect(still.distance_m).toBe(0);
    expect(still.geometry).toHaveLength(2);
    expect(still.segments).toEqual([expect.objectContaining({ kind: 'walk', seconds: 0, length_m: 0 })]);
    expect(still.snapped_m).toEqual({ from: 0, to: 0 });
  });
});

describe('a network in pieces (spec 6.6)', () => {
  it('SKIROUTE-020: joins pieces at their shared boundary nodes, the halo copy of an edge kept once', () => {
    const upper = new SkiWorld({ lat: 46, lng: 7 }, { areaId: 'w:5-a', build: '2026-11-02', name: 'Nordnetz' });
    const x = upper.node(0, 2000, 2000, { osm: 101 });
    const y = upper.node(0, 1000, 1600, { osm: 102, flags: NodeFlag.BOUNDARY });
    const z = upper.node(0, 0, 1200, { osm: 103, flags: NodeFlag.BOUNDARY });
    upper.run(x, y, 1, { name: 'Oben', way: 1 });
    upper.run(y, z, 1, { name: 'Unten', way: 2, flags: EdgeFlag.HALO });
    const lower = new SkiWorld({ lat: 46, lng: 7 }, { areaId: 'w:5-b', build: '2026-11-02', name: 'Nordnetz' });
    const y2 = lower.node(0, 1000, 1600, { osm: 102, flags: NodeFlag.BOUNDARY });
    const z2 = lower.node(0, 0, 1200, { osm: 103, flags: NodeFlag.BOUNDARY });
    lower.run(y2, z2, 1, { name: 'Unten', way: 2 });
    const net = stitchGraphs([upper.graph(), lower.graph()]);
    expect(net.nodeCount).toBe(3);
    expect(net.edgeCount).toBe(2);
    expect(net.areaIds).toEqual(['w:5-a', 'w:5-b']);
    // The copy without the halo flag is the one kept.
    expect(Array.from(net.edgeFlags).some((flags) => (flags & EdgeFlag.HALO) !== 0)).toBe(false);
    const leg = okLeg(planOn([upper, lower], [[upper.at(0, 2000), upper.at(0, 0)]])[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Oben', 'Unten']);
  });

  it('SKIROUTE-021: never joins synthetic nodes, nor nodes of one piece alone', () => {
    const world = new SkiWorld();
    const a = world.node(0, 0, 1500, { osm: -5, flags: NodeFlag.BOUNDARY });
    const b = world.node(0, -500, 1400, { osm: -5, flags: NodeFlag.BOUNDARY });
    world.run(a, b, 1);
    expect(stitchGraphs([world.graph()]).nodeCount).toBe(2);
    expect(stitchGraphs([world.graph(), world.graph()]).nodeCount).toBe(4);
    expect(() => stitchGraphs([])).toThrow('No graph to stitch');
  });
});

describe('other ways and notes', () => {
  it('SKIROUTE-030: offers a second way that shares little with the first and is not much slower', () => {
    const world = new SkiWorld();
    const top = world.node(0, 2000, 2200);
    const valley = world.node(0, 0, 1200);
    const east = world.node(300, 1000, 1700);
    const west = world.node(-310, 1000, 1700);
    world.run(top, east, 1, { name: 'Ostabfahrt' });
    world.run(east, valley, 1, { name: 'Ostabfahrt' });
    world.run(top, west, 1, { name: 'Westabfahrt' });
    world.run(west, valley, 1, { name: 'Westabfahrt' });
    const leg = okLeg(planOn(world, [[world.at(0, 2000), world.at(0, 0)]], { alternatives: 2 })[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Ostabfahrt']);
    expect(leg.alternatives).toHaveLength(1);
    expect(leg.alternatives[0]?.segments.map((s) => s.name)).toEqual(['Westabfahrt']);
    expect(leg.alternatives[0]?.seconds_total).toBeGreaterThan(leg.seconds.ski);
    expect(okLeg(planOn(world, [[world.at(0, 2000), world.at(0, 0)]])[0]).alternatives).toEqual([]);
  });

  it('SKIROUTE-031: notes a harder run it kept clear of when that would have been clearly quicker', () => {
    const world = new SkiWorld();
    const top = world.node(0, 2000, 2200);
    const valley = world.node(0, 0, 1200);
    world.run(top, valley, 3, { name: 'Schwarze Wand' });
    world.run(top, valley, 1, { name: 'Umweg', via: [[1500, 1000]] });
    const leg = okLeg(planOn(world, [[world.at(0, 2000), world.at(0, 0)]])[0]);
    expect(leg.segments.map((s) => s.name)).toEqual(['Umweg']);
    const avoided = leg.why.find((note) => note.kind === 'avoided_difficulty');
    expect(avoided).toMatchObject({ kind: 'avoided_difficulty', level: 'advanced', name: 'Schwarze Wand' });
    expect(avoided?.kind === 'avoided_difficulty' ? avoided.saved_seconds : 0).toBeGreaterThan(200);
    // With the limit at expert nothing was avoided.
    const expert = { options: { max_difficulty: 'expert' as const } };
    const free = okLeg(planOn(world, [[world.at(0, 2000), world.at(0, 0)]], expert)[0]);
    expect(free.why.some((note) => note.kind === 'avoided_difficulty')).toBe(false);
  });

  it('SKIROUTE-032: counts the flagged stretches a leg rests on: a guessed link, a direction from the terrain', () => {
    const world = new SkiWorld();
    const top = world.node(0, 2000, 2200);
    const gap = world.node(0, 1000, 1700);
    const after = world.node(0, 990, 1699);
    const valley = world.node(0, 0, 1200);
    world.run(top, gap, 1, { name: 'Oben', flags: EdgeFlag.DIR_FROM_DEM });
    world.link(gap, after, { flags: EdgeFlag.INFERRED_LINK });
    world.run(after, valley, 255, { name: 'Unten' });
    const leg = okLeg(planOn(world, [[world.at(0, 2000), world.at(0, 0)]])[0]);
    expect(leg.segments.map((s) => s.kind)).toEqual(['run', 'link', 'run']);
    expect(leg.segments[1]?.flags).toEqual(['inferred_link']);
    expect(leg.why).toEqual(
      expect.arrayContaining([
        { kind: 'flag', flag: 'dir_from_dem', count: 1 },
        { kind: 'flag', flag: 'inferred_link', count: 1 },
        { kind: 'flag', flag: 'difficulty_unknown', count: 1 },
      ]),
    );
    expect(leg.seconds.walk).toBeGreaterThan(0);
  });

  it('SKIROUTE-033: rides a funicular as rail, and a gondola down only where allowed', () => {
    const world = new SkiWorld();
    const valley = world.node(0, 0, 1600);
    const top = world.node(0, 1500, 2300);
    world.lift(valley, top, { type: Lift.FUNICULAR, name: 'Sunnegga', sec: 180 });
    const up = okLeg(planOn(world, [[world.at(0, 0), world.at(0, 1500)]])[0]);
    expect(up.segments[0]).toMatchObject({ kind: 'rail', lift_type: 'funicular', wait_seconds: 240 });

    const gondola = new SkiWorld();
    const foot = gondola.node(0, 0, 1600);
    const summit = gondola.node(0, 1500, 2500);
    gondola.lift(foot, summit, { type: Lift.GONDOLA, name: 'Gondel', down: true });
    const down = okLeg(planOn(gondola, [[gondola.at(0, 1500), gondola.at(0, 0)]])[0]);
    expect(down.segments[0]).toMatchObject({ kind: 'lift_down', name: 'Gondel' });
    expect(down.segments[0]?.flags).toContain('ride_down');
    expect(down.why).toContainEqual({ kind: 'flag', flag: 'ride_down', count: 3 });
  });
});

describe('the search budget', () => {
  it('SKIROUTE-040: answers timeout once it settled more nodes than allowed, and none where nothing joins', () => {
    const { world, top, valley } = testalp();
    const net = stitchGraphs([world.graph()]);
    const request = skiRouteRequestSchema.parse({ legs: [{ from: top, to: valley }], discipline: 'alpine' });
    const costs = compileProfile(profileOf(request), net);
    const starts = snapPoint(net, costs, top.lat, top.lng, 150, 'from');
    const ends = snapPoint(net, costs, valley.lat, valley.lng, 150, 'to');
    const budget = { maxSettled: 0, deadline: Date.now() + 1000 };
    expect(searchPath(net, costs, starts, ends, valley, budget).status).toBe('timeout');
    // A ski tourer rides no lift and climbs no run: from the valley nothing leads up.
    const touring = skiRouteRequestSchema.parse({ legs: [{ from: valley, to: top }], discipline: 'touring' });
    const climb = compileProfile(profileOf(touring), net);
    const none = searchPath(net, climb, ends, starts, top, { maxSettled: 100, deadline: Date.now() + 1000 });
    expect(none).toMatchObject({ status: 'none' });
    expect(none.status === 'none' ? none.nearest?.lat : null).toBeCloseTo(valley.lat, 6);
  });
});
