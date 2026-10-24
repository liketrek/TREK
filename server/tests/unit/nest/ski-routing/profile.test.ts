/**
 * The cost model of the piste router (spec 8): which discipline may travel an
 * edge in which direction, how long it takes, and what the search weighs it
 * at. Every case is one edge of a world drawn for it, read through the
 * network the router searches.
 */
import {
  boardWaitSeconds,
  compileProfile,
  difficultyAllowed,
  dismountSeconds,
  edgeCost,
  edgeSeconds,
  liftAllowed,
  liftClassOf,
  liftDownAllowed,
  Mode,
  travelMode,
  type SkiProfile,
} from '../../../../src/nest/ski-routing/engine/profile';
import { stitchGraphs, type SkiNet } from '../../../../src/nest/ski-routing/engine/stitch';
import { EdgeFlag, Groom, Kind, Lift, NodeFlag, Use } from '../../../../src/nest/ski-routing/ski-graph.contract';
import { profileOf } from '../../../../src/nest/ski-routing/ski-routing.service';
import { NORDIC_BOTH, RUN_DOWN, SkiWorld, type EdgeOptions } from '../../../helpers/ski-world';
import { skiRouteRequestSchema, type SkiDiscipline, type SkiRouteOptionsInput, type SkiTechnique } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const P = { lat: 46, lng: 7 };

function profile(discipline: SkiDiscipline, options: SkiRouteOptionsInput = {}, technique: SkiTechnique | null = null) {
  const request = skiRouteRequestSchema.parse({ legs: [{ from: P, to: P }], discipline, technique, options });
  return profileOf(request);
}

/** One edge from a node `ele0` high to one 1000 m north and `ele1` high, with the options given. */
function oneEdge(options: EdgeOptions, ele0 = 1500, ele1 = 1400, nodeFlags = 0): SkiNet {
  const world = new SkiWorld();
  const a = world.node(0, 0, ele0);
  const b = world.node(0, 1000, ele1, { flags: nodeFlags });
  world.edge(a, b, options);
  return stitchGraphs([world.graph()]);
}

const run = (diff: number, extra: EdgeOptions = {}) =>
  oneEdge({ kind: Kind.RUN, fwd: RUN_DOWN, back: 0, diff, ...extra });

describe('who may travel an edge (spec 8.3)', () => {
  it('SKIPROF-001: a downhill skier skis a run down within the limit, never up, and walks a link either way', () => {
    const alpine = profile('alpine');
    expect(travelMode(alpine, run(2), 0, 0)).toBe(Mode.DOWNHILL);
    expect(travelMode(alpine, run(2), 0, 1)).toBe(Mode.NONE);
    expect(travelMode(alpine, run(3), 0, 0)).toBe(Mode.NONE);
    expect(travelMode(profile('alpine', { max_difficulty: 'advanced' }), run(3), 0, 0)).toBe(Mode.DOWNHILL);
    const link = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK });
    expect(travelMode(alpine, link, 0, 1)).toBe(Mode.WALK);
    const track = oneEdge({ kind: Kind.HIKE, fwd: Use.WALK | Use.WINTER_HIKE, back: Use.WALK | Use.WINTER_HIKE });
    expect(travelMode(alpine, track, 0, 0)).toBe(Mode.NONE);
    // Only while explaining: walking up a run tells "no way up" from "no way".
    expect(travelMode({ ...alpine, walkUphill: true }, run(2), 0, 1)).toBe(Mode.WALK);
  });

  it('SKIPROF-002: a run of unknown difficulty is allowed, freeride and extreme only when switched on', () => {
    const base = profile('alpine').options;
    expect(difficultyAllowed(base, 255)).toBe(true);
    expect(difficultyAllowed(base, 5)).toBe(false);
    expect(difficultyAllowed({ ...base, allow_freeride: true }, 6)).toBe(true);
    expect(difficultyAllowed({ ...base, max_difficulty: 'novice' }, 1)).toBe(false);
    expect(difficultyAllowed({ ...base, max_difficulty: 'expert' }, 4)).toBe(true);
  });

  it('SKIPROF-003: lifts by class, the rider and the discipline', () => {
    const types = [Lift.NONE, Lift.CABLE_CAR, Lift.GONDOLA, Lift.MIXED, Lift.CHAIR_FIXED, Lift.TBAR, Lift.MAGIC_CARPET];
    expect([...types, Lift.RACK].map(liftClassOf)).toEqual([
      null,
      'cable_car',
      'gondola',
      'gondola',
      'open_chair',
      'drag',
      'drag',
      'rail',
    ]);
    const alpine = profile('alpine');
    expect(liftAllowed(alpine, 'drag')).toBe(true);
    expect(liftAllowed(profile('alpine', { avoid_lifts: ['drag'] }), 'drag')).toBe(false);
    expect(liftAllowed(profile('alpine', { use_lifts: false }), 'gondola')).toBe(false);
    expect(liftAllowed(alpine, null)).toBe(false);
    const nordic = profile('cross_country', { use_lifts: true });
    expect(liftAllowed(nordic, 'gondola')).toBe(true);
    expect(liftAllowed(nordic, 'open_chair')).toBe(false);
    expect(liftAllowed(profile('cross_country'), 'gondola')).toBe(false);
    const walker = profile('winter_hike', { use_lifts: true });
    expect(liftAllowed(walker, 'open_chair')).toBe(true);
    expect(liftAllowed(walker, 'drag')).toBe(false);
    expect(liftDownAllowed(alpine, 'gondola')).toBe(true);
    expect(liftDownAllowed(alpine, 'drag')).toBe(false);
    expect(liftDownAllowed(profile('alpine', { allow_lift_down: false }), 'gondola')).toBe(false);
  });

  it('SKIPROF-004: a lift, its boarding and its exit are ridden up, and down only where allowed', () => {
    const world = new SkiWorld();
    const valley = world.node(0, 0, 1200);
    const top = world.node(0, 1500, 2000);
    const { ride, board, alight } = world.lift(valley, top, { type: Lift.GONDOLA, down: true });
    const net = stitchGraphs([world.graph()]);
    const alpine = profile('alpine');
    expect(travelMode(alpine, net, ride, 0)).toBe(Mode.LIFT);
    expect(travelMode(alpine, net, ride, 1)).toBe(Mode.LIFT_DOWN);
    expect(travelMode(alpine, net, board, 0)).toBe(Mode.BOARD);
    expect(travelMode(alpine, net, alight, 0)).toBe(Mode.ALIGHT);
    expect(travelMode(alpine, net, board, 1)).toBe(Mode.NONE);
    // The boarding at the top and the exit at the bottom, of the ride down.
    expect(travelMode(alpine, net, 3, 0)).toBe(Mode.BOARD_DOWN);
    expect(travelMode(alpine, net, 4, 0)).toBe(Mode.ALIGHT_DOWN);
    expect(travelMode(profile('alpine', { allow_lift_down: false }), net, ride, 1)).toBe(Mode.NONE);
    expect(travelMode(profile('touring'), net, ride, 0)).toBe(Mode.NONE);
  });

  it('SKIPROF-005: a cross-country skier keeps to the technique, the grooming and the lights asked for', () => {
    const skatingOnly = oneEdge({ kind: Kind.NORDIC, fwd: Use.NORDIC_SKATING, back: Use.NORDIC_SKATING, groom: 2 });
    expect(travelMode(profile('cross_country', {}, 'classic'), skatingOnly, 0, 0)).toBe(Mode.NONE);
    expect(travelMode(profile('cross_country', {}, 'skating'), skatingOnly, 0, 0)).toBe(Mode.NORDIC);
    expect(travelMode(profile('cross_country', {}, 'unknown'), skatingOnly, 0, 1)).toBe(Mode.NORDIC);
    const wild = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: Groom.BACKCOUNTRY });
    expect(travelMode(profile('cross_country', { groomed_only: true }), wild, 0, 0)).toBe(Mode.NONE);
    expect(travelMode(profile('cross_country'), wild, 0, 0)).toBe(Mode.NORDIC);
    const dark = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 3 });
    expect(travelMode(profile('cross_country', { lit_only: true }), dark, 0, 0)).toBe(Mode.NONE);
    const lit = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 3, flags: EdgeFlag.LIT });
    expect(travelMode(profile('cross_country', { lit_only: true }), lit, 0, 0)).toBe(Mode.NORDIC);
    const link = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK });
    expect(travelMode(profile('cross_country'), link, 0, 0)).toBe(Mode.WALK);
    expect(travelMode(profile('cross_country'), run(1), 0, 0)).toBe(Mode.NONE);
  });

  it('SKIPROF-006: a ski tourer climbs skitour ways, skis runs down and climbs a piste only when asked to', () => {
    const touring = profile('touring');
    const both = Use.SKITOUR_UP | Use.SKITOUR_DOWN;
    const climb = oneEdge({ kind: Kind.SKITOUR, fwd: both, back: Use.SKITOUR_UP }, 1500, 1900);
    expect(travelMode(touring, climb, 0, 0)).toBe(Mode.SKITOUR_UP);
    expect(travelMode(touring, climb, 0, 1)).toBe(Mode.SKITOUR_UP);
    const descent = oneEdge({ kind: Kind.SKITOUR, fwd: both, back: 0 }, 1900, 1500);
    expect(travelMode(touring, descent, 0, 0)).toBe(Mode.SKITOUR_DOWN);
    expect(travelMode(touring, run(2), 0, 0)).toBe(Mode.SKITOUR_DOWN);
    expect(travelMode(touring, run(2), 0, 1)).toBe(Mode.NONE);
    expect(travelMode(profile('touring', { touring_uphill_on_pistes: true }), run(2), 0, 1)).toBe(Mode.UPHILL_PISTE);
    expect(travelMode(touring, run(4), 0, 0)).toBe(Mode.NONE);
    const snowshoeTrail = oneEdge({ kind: Kind.HIKE, fwd: Use.SNOWSHOE, back: Use.SNOWSHOE });
    expect(travelMode(touring, snowshoeTrail, 0, 1)).toBe(Mode.SKITOUR_UP);
  });

  it('SKIPROF-007: snowshoes and boots keep to their trails and cross a run only where it is short', () => {
    const onFoot = Use.SNOWSHOE | Use.WINTER_HIKE;
    const trail = oneEdge({ kind: Kind.HIKE, fwd: onFoot, back: onFoot });
    expect(travelMode(profile('snowshoe'), trail, 0, 1)).toBe(Mode.SNOWSHOE);
    expect(travelMode(profile('winter_hike'), trail, 0, 1)).toBe(Mode.HIKE);
    const shoeOnly = oneEdge({ kind: Kind.HIKE, fwd: Use.SNOWSHOE, back: Use.SNOWSHOE });
    expect(travelMode(profile('winter_hike'), shoeOnly, 0, 0)).toBe(Mode.NONE);
    // The world's edges are 1000 m long: too long to cross on foot.
    expect(travelMode(profile('snowshoe'), run(1), 0, 0)).toBe(Mode.NONE);
    const world = new SkiWorld();
    world.run(world.node(0, 0, 1500), world.node(0, 60, 1495), 1);
    const short = stitchGraphs([world.graph()]);
    expect(travelMode(profile('snowshoe'), short, 0, 1)).toBe(Mode.WALK);
    expect(travelMode(profile('winter_hike'), short, 0, 0)).toBe(Mode.WALK);
    const link = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK });
    expect(travelMode(profile('winter_hike'), link, 0, 0)).toBe(Mode.WALK);
    expect(travelMode(profile('snowshoe'), link, 0, 0)).toBe(Mode.WALK);
  });
});

describe('how long it takes (spec 8.1)', () => {
  it('SKIPROF-010: a run by its difficulty, moguls, open slopes, the pace and the board', () => {
    const alpine = profile('alpine');
    expect(edgeSeconds(alpine, run(2), 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 8.5, 3);
    expect(edgeSeconds(alpine, run(0), 0, 0, Mode.DOWNHILL)).toBeCloseTo(250, 3);
    expect(edgeSeconds(alpine, run(255), 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 7, 3);
    expect(edgeSeconds(alpine, run(2, { groom: Groom.MOGUL }), 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 6.8, 3);
    const area = oneEdge({ kind: Kind.AREA, fwd: RUN_DOWN, back: 0, diff: 1 });
    expect(edgeSeconds(alpine, area, 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 5.6, 3);
    expect(edgeSeconds(profile('alpine', { pace: 'sporty' }), run(1), 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 9.1, 3);
    expect(edgeSeconds(profile('snowboard'), run(1), 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 6.65, 3);
    const flat = run(1, { flags: EdgeFlag.FLAT_FOR_BOARD });
    expect(edgeSeconds(profile('snowboard'), flat, 0, 0, Mode.DOWNHILL)).toBeCloseTo(1000 / 1.5, 3);
  });

  it('SKIPROF-011: a lift by its ride time, else by its speed; the wait by type and capacity; 15 s to get off', () => {
    const alpine = profile('alpine');
    const timed = oneEdge({ kind: Kind.LIFT, fwd: Use.LIFT_UP, lift: Lift.GONDOLA, liftSec: 300 });
    expect(edgeSeconds(alpine, timed, 0, 0, Mode.LIFT)).toBe(300);
    const fixed = oneEdge({ kind: Kind.LIFT, fwd: Use.LIFT_UP, lift: Lift.CHAIR_FIXED });
    expect(edgeSeconds(alpine, fixed, 0, 0, Mode.LIFT)).toBeCloseTo(1000 / 2.3, 3);
    expect(boardWaitSeconds(Lift.CHAIR_DETACHABLE, 0)).toBe(120);
    expect(boardWaitSeconds(Lift.GONDOLA, 2400)).toBe(90);
    expect(boardWaitSeconds(Lift.CABLE_CAR, 3000)).toBe(240);
    expect(boardWaitSeconds(Lift.FUNICULAR, 0)).toBe(240);
    expect(boardWaitSeconds(Lift.TBAR, 0)).toBe(60);
    expect(boardWaitSeconds(Lift.MAGIC_CARPET, 0)).toBe(30);
    expect(edgeSeconds(alpine, fixed, 0, 0, Mode.ALIGHT)).toBe(15);
  });

  it('SKIPROF-012: cross-country by technique and gradient, walking with its climb, touring and hiking', () => {
    const flatTrail = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 3 }, 1500, 1500);
    // On the flat Tobler's factor is 1.
    expect(edgeSeconds(profile('cross_country', {}, 'classic'), flatTrail, 0, 0, Mode.NORDIC)).toBeCloseTo(400, 3);
    expect(edgeSeconds(profile('cross_country', {}, 'skating'), flatTrail, 0, 0, Mode.NORDIC)).toBeCloseTo(
      1000 / 3.3,
      3,
    );
    const steep = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 3 }, 1500, 1600);
    const up = edgeSeconds(profile('cross_country', {}, 'classic'), steep, 0, 0, Mode.NORDIC);
    const down = edgeSeconds(profile('cross_country', {}, 'classic'), steep, 0, 1, Mode.NORDIC);
    expect(up).toBeGreaterThan(400);
    expect(down).toBeLessThan(up);
    const walk = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK }, 1500, 1530);
    expect(edgeSeconds(profile('alpine'), walk, 0, 0, Mode.WALK)).toBeCloseTo(1000 / 0.7 + 360, 3);
    const climb = oneEdge({ kind: Kind.SKITOUR, fwd: Use.SKITOUR_UP, back: Use.SKITOUR_UP }, 1500, 1850);
    // DIN 33466: 900 s for the kilometre, 3600 s for the 350 m: the longer plus half the shorter.
    expect(edgeSeconds(profile('touring'), climb, 0, 0, Mode.SKITOUR_UP)).toBeCloseTo(3600 + 450, 3);
    expect(edgeSeconds(profile('touring'), climb, 0, 1, Mode.SKITOUR_DOWN)).toBeCloseTo(1000 / 3, 3);
    expect(edgeSeconds(profile('touring'), run(1), 0, 0, Mode.SKITOUR_DOWN)).toBeCloseTo(1000 / 7, 3);
    const shoe = oneEdge({ kind: Kind.HIKE, fwd: Use.SNOWSHOE, back: Use.SNOWSHOE }, 1500, 1750);
    expect(edgeSeconds(profile('snowshoe'), shoe, 0, 0, Mode.SNOWSHOE)).toBeCloseTo(3600 + 600, 3);
    const path = oneEdge({ kind: Kind.HIKE, fwd: Use.WINTER_HIKE, back: Use.WINTER_HIKE }, 1500, 1500);
    expect(edgeSeconds(profile('winter_hike'), path, 0, 0, Mode.HIKE)).toBeCloseTo(900 / 0.85, 3);
    expect(edgeSeconds(profile('alpine'), path, 0, 0, Mode.NONE)).toBe(Infinity);
  });

  it('SKIPROF-013: getting out of the bindings where the map says so adds to the edge arriving there', () => {
    const always = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK }, 1500, 1500, NodeFlag.DISMOUNT_YES);
    expect(dismountSeconds(always, 1)).toBe(30);
    expect(dismountSeconds(always, 0)).toBe(0);
    const sometimes = oneEdge({ kind: Kind.LINK }, 1500, 1500, NodeFlag.DISMOUNT_SOMETIMES);
    expect(dismountSeconds(sometimes, 1)).toBe(10);
    const costs = compileProfile(profile('alpine'), always);
    expect(costs.timeFwd[0]).toBeCloseTo(1000 / 0.7 + 30, 3);
    expect(costs.timeBack[0]).toBeCloseTo(1000 / 0.7, 3);
  });
});

describe('what the search weighs (spec 8.2)', () => {
  const cost = (p: SkiProfile, net: SkiNet, dir: 0 | 1 = 0) => {
    const mode = travelMode(p, net, 0, dir);
    return edgeCost(p, net, 0, dir, mode, 100);
  };

  it('SKIPROF-020: penalties: a guessed link, riding down, the wrong way, a slope with a run, an untyped way', () => {
    const alpine = profile('alpine');
    const shortLink = oneEdge({ kind: Kind.LINK, fwd: Use.WALK, back: Use.WALK, flags: EdgeFlag.INFERRED_LINK });
    expect(cost(alpine, shortLink)).toBe(260);
    expect(cost(profile('alpine', { avoid_inferred_links: true }), shortLink)).toBe(1300);
    const world = new SkiWorld();
    world.link(world.node(0, 0, 1500), world.node(0, 30, 1500), { flags: EdgeFlag.INFERRED_LINK });
    expect(cost(alpine, stitchGraphs([world.graph()]))).toBe(130);
    const gondola = oneEdge({ kind: Kind.LIFT, fwd: Use.LIFT_UP, back: Use.LIFT_DOWN, lift: Lift.GONDOLA });
    expect(cost(alpine, gondola, 1)).toBe(300);
    const conflict = oneEdge({ kind: Kind.RUN, fwd: RUN_DOWN, back: RUN_DOWN, diff: 1, flags: EdgeFlag.DIR_CONFLICT });
    expect(cost(alpine, conflict, 0)).toBe(100);
    expect(cost(alpine, conflict, 1)).toBe(150);
    const area = oneEdge({ kind: Kind.AREA, fwd: RUN_DOWN, back: 0, diff: 1, flags: EdgeFlag.AREA_HAS_RUN });
    expect(cost(alpine, area)).toBeCloseTo(130, 6);
    const untyped = oneEdge({ kind: Kind.CONNECTION, fwd: Use.WALK | Use.DOWNHILL, flags: EdgeFlag.TYPE_UNKNOWN });
    expect(cost(alpine, untyped)).toBe(150);
  });

  it('SKIPROF-021: a snowboarder avoids flats and surface lifts, a nordic skier the wrong way and the wild', () => {
    const board = profile('snowboard');
    expect(cost(board, run(1, { flags: EdgeFlag.FLAT_FOR_BOARD }))).toBe(300);
    const world = new SkiWorld();
    const { board: tbarBoard } = world.lift(world.node(0, 0, 1500), world.node(0, 600, 1700), { type: Lift.TBAR });
    const tbar = stitchGraphs([world.graph()]);
    expect(edgeCost(board, tbar, tbarBoard, 0, Mode.BOARD, 60)).toBe(660);
    expect(edgeCost(profile('alpine'), tbar, tbarBoard, 0, Mode.BOARD, 60)).toBe(60);
    const nordic = { kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 1 };
    const soft = oneEdge({ ...nordic, flags: EdgeFlag.NORDIC_SOFT_ONEWAY });
    expect(cost(profile('cross_country'), soft, 1)).toBeCloseTo(110, 6);
    const wild = oneEdge({ kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: Groom.BACKCOUNTRY });
    expect(cost(profile('cross_country', {}, 'classic'), wild)).toBe(200);
    expect(cost(profile('cross_country', {}, 'skating'), wild)).toBe(300);
    const assumed = oneEdge({ ...nordic, flags: EdgeFlag.TECHNIQUE_ASSUMED });
    expect(cost(profile('cross_country'), assumed)).toBeCloseTo(110, 6);
    const shoe = oneEdge({ kind: Kind.HIKE, fwd: Use.SNOWSHOE, back: Use.SNOWSHOE });
    expect(cost(profile('snowshoe'), shoe)).toBe(80);
    expect(cost(profile('touring', { touring_uphill_on_pistes: true }), run(1), 1)).toBe(150);
  });

  it('SKIPROF-022: priorities: most skiing makes runs cheap and lifts dear, easiest makes the harder runs dear', () => {
    const most = profile('alpine', { priority: 'most_skiing' });
    expect(cost(most, run(1))).toBeCloseTo(100 / 1.8, 6);
    const lift = oneEdge({ kind: Kind.LIFT, fwd: Use.LIFT_UP, lift: Lift.GONDOLA });
    expect(cost(most, lift)).toBeCloseTo(120, 6);
    const easiest = profile('alpine', { priority: 'easiest', max_difficulty: 'advanced' });
    expect(cost(easiest, run(3))).toBeCloseTo(180, 6);
    expect(cost(easiest, run(2))).toBeCloseTo(150, 6);
    expect(cost(easiest, run(1))).toBeCloseTo(120, 6);
    expect(cost(easiest, run(0))).toBeCloseTo(100, 6);
    expect(cost(easiest, run(255))).toBeCloseTo(150, 6);
  });

  it('SKIPROF-023: every edge compiled both ways, a forbidden one at Infinity, the heuristic under every edge', () => {
    const world = new SkiWorld();
    const top = world.node(0, 0, 2000);
    const valley = world.node(0, -1000, 1500);
    world.run(top, valley, 2);
    world.lift(valley, top, { sec: 200 });
    const net = stitchGraphs([world.graph()]);
    const costs = compileProfile(profile('alpine'), net);
    expect(costs.modeFwd[0]).toBe(Mode.DOWNHILL);
    expect(costs.costBack[0]).toBe(Infinity);
    for (let e = 0; e < net.edgeCount; e++) {
      for (const [cost, length] of [
        [costs.costFwd[e] as number, net.edgeLen[e] as number],
        [costs.costBack[e] as number, net.edgeLen[e] as number],
      ]) {
        if (Number.isFinite(cost) && length > 0) expect(length / cost).toBeLessThanOrEqual(costs.maxSpeed);
      }
    }
    expect(costs.maxSpeed).toBeGreaterThan(5);
  });
});
