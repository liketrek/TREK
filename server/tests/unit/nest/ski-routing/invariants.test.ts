/**
 * The invariant sweep (spec 12.3): random point pairs on every area at hand,
 * for every discipline. Whatever the points, a leg is planned or failed, never
 * thrown; and a planned leg only uses an edge in a direction its uses allow,
 * enters a lift by its boarding and leaves it by its exit, keeps to the
 * difficulty limit, never climbs a run, takes no link longer than 120 m, runs
 * as one line from stretch to stretch, and its totals are its stretches added
 * up.
 */
import { SkiRouter } from '../../../../src/nest/ski-routing/engine/plan';
import { compileProfile, Mode } from '../../../../src/nest/ski-routing/engine/profile';
import { LEG_TIME_MS, searchPath, type Step } from '../../../../src/nest/ski-routing/engine/router';
import { SNAP_RADIUS_M, snapPoint } from '../../../../src/nest/ski-routing/engine/snap';
import { stitchGraphs, type SkiNet } from '../../../../src/nest/ski-routing/engine/stitch';
import { decodeSkiGraph } from '../../../../src/nest/ski-routing/ski-graph';
import { Kind, Lift } from '../../../../src/nest/ski-routing/ski-graph.contract';
import { profileOf } from '../../../../src/nest/ski-routing/ski-routing.service';
import { SkiWorld } from '../../../helpers/ski-world';
import { SKI_DISCIPLINES, skiRouteRequestSchema, type SkiRouteLeg } from '@trek/shared';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PAIRS = 500;

/** A small, fixed random sequence, so a failing pair can be found again. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A resort of everything: lifts of three kinds, runs of every grade, a link, a nordic loop, a winter path. */
function resort(): SkiNet {
  const world = new SkiWorld();
  const valley = world.node(0, 0, 1200);
  const mid = world.node(400, 1200, 1700);
  const top = world.node(0, 2400, 2300);
  const shoulder = world.node(-600, 1600, 1900);
  const lake = world.node(1500, 100, 1210);
  const village = world.node(2600, 0, 1215);
  world.lift(valley, mid, { name: 'Talbahn', type: Lift.GONDOLA, down: true, cap: 2400 });
  world.lift(mid, top, { name: 'Gipfelsessel', type: Lift.CHAIR_DETACHABLE });
  world.lift(shoulder, top, { name: 'Schlepper', type: Lift.TBAR });
  world.run(top, mid, 2, { name: 'Rote' });
  world.run(top, shoulder, 4, { name: 'Expert' });
  world.run(shoulder, valley, 1, { name: 'Blaue', via: [[-400, 800]] });
  world.run(mid, valley, 0, { name: 'Kinderland' });
  world.run(top, valley, 5, { name: 'Freeride', via: [[-900, 1200]] });
  const gap = world.node(30, 0, 1201);
  world.link(valley, gap);
  world.nordic(gap, lake, { name: 'Seeloipe' });
  world.nordic(lake, village, { name: 'Dorfloipe' });
  world.edge(lake, mid, { kind: Kind.HIKE, fwd: 0x380, back: 0x380, name: 'Winterweg' });
  return stitchGraphs([world.graph()]);
}

function golden(): SkiNet {
  return stitchGraphs([decodeSkiGraph(readFileSync(join(__dirname, '../../../fixtures/ski/golden-v1.sgr')))]);
}

function box(net: SkiNet) {
  let minLat = 90;
  let minLng = 180;
  let maxLat = -90;
  let maxLng = -180;
  for (let i = 0; i < net.nodeCount; i++) {
    minLat = Math.min(minLat, net.nodeLat[i] as number);
    maxLat = Math.max(maxLat, net.nodeLat[i] as number);
    minLng = Math.min(minLng, net.nodeLng[i] as number);
    maxLng = Math.max(maxLng, net.nodeLng[i] as number);
  }
  const pad = 0.001;
  return { minLat: minLat - pad, minLng: minLng - pad, maxLat: maxLat + pad, maxLng: maxLng + pad };
}

const RIDE: ReadonlySet<number> = new Set([Kind.LIFT, Kind.RAIL]);
const INTO_RIDE: ReadonlySet<number> = new Set([Kind.BOARD, Kind.LIFT, Kind.RAIL]);
const OUT_OF_RIDE: ReadonlySet<number> = new Set([Kind.ALIGHT, Kind.LIFT, Kind.RAIL]);
const HARD: ReadonlySet<string | null> = new Set(['expert', 'freeride', 'extreme']);

/** The step-level rules of a found path, as the search left it. */
function checkSteps(net: SkiNet, steps: readonly Step[], modeOf: (step: Step) => number, limit: number): void {
  const moving = steps.filter((step) => step.from !== step.to);
  moving.forEach((step, index) => {
    const mode = modeOf(step);
    const uses = step.dir === 0 ? net.edgeFwd[step.edge] : net.edgeBack[step.edge];
    expect(mode).not.toBe(Mode.NONE);
    const kind = net.edgeKind[step.edge] as number;
    // A walker crosses a short run whichever way it is drawn; every other way needs its uses.
    if (mode !== Mode.WALK || (kind !== Kind.RUN && kind !== Kind.AREA)) expect(uses).toBeGreaterThan(0);
    if (RIDE.has(kind)) {
      const before = moving[index - 1];
      const after = moving[index + 1];
      expect(before !== undefined && INTO_RIDE.has(net.edgeKind[before.edge] as number)).toBe(true);
      expect(after !== undefined && OUT_OF_RIDE.has(net.edgeKind[after.edge] as number)).toBe(true);
    }
    if (mode === Mode.DOWNHILL) {
      const climb = step.dir === 0 ? net.edgeUp[step.edge] : net.edgeDown[step.edge];
      expect(climb).toBeLessThanOrEqual(15);
      const diff = net.edgeDiff[step.edge] as number;
      if (kind === Kind.RUN || kind === Kind.AREA) expect(diff === 255 || diff <= limit).toBe(true);
    }
    if (kind === Kind.LINK) expect(net.edgeLen[step.edge]).toBeLessThanOrEqual(120);
  });
}

/** The contract-level rules of an answered leg. */
function checkLeg(leg: SkiRouteLeg | undefined): void {
  expect(['ok', 'failed']).toContain(leg?.status);
  if (leg?.status !== 'ok') return;
  const total = leg.seconds.ski + leg.seconds.lift + leg.seconds.wait + leg.seconds.walk;
  const summed = leg.segments.reduce((sum, segment) => sum + segment.seconds + segment.wait_seconds, 0);
  expect(Math.abs(total - summed)).toBeLessThan(1);
  for (let i = 1; i < leg.segments.length; i++) {
    expect(leg.segments[i]?.from).toBe(leg.segments[i - 1]?.to);
  }
  for (const segment of leg.segments) {
    expect(segment.from).toBeLessThanOrEqual(segment.to);
    expect(segment.to).toBeLessThan(leg.geometry.length);
  }
  expect(leg.segments.some((s) => s.kind === 'run' && HARD.has(s.difficulty))).toBe(false);
}

describe.each([
  ['the golden area', golden],
  ['a resort of everything', resort],
])('the invariant sweep on %s', (_name, build) => {
  it.each(SKI_DISCIPLINES.map((discipline) => [discipline]))(
    'SKIINV-001: %s, random pairs: planned or failed, and every planned leg keeps the rules',
    (discipline) => {
      const net = build();
      const router = new SkiRouter(net);
      const area = box(net);
      const next = random(discipline.length * 7919 + net.edgeCount);
      const point = () => ({
        lat: area.minLat + (area.maxLat - area.minLat) * next(),
        lng: area.minLng + (area.maxLng - area.minLng) * next(),
      });
      const request = skiRouteRequestSchema.parse({ legs: [{ from: point(), to: point() }], discipline });
      const profile = profileOf(request);
      const costs = compileProfile(profile, net);
      const modeOf = (step: Step) => (step.dir === 0 ? costs.modeFwd[step.edge] : costs.modeBack[step.edge]) as number;
      let planned = 0;
      for (let pair = 0; pair < PAIRS; pair++) {
        const from = point();
        const to = point();
        const [leg] = router.plan({ legs: [{ from, to, continues: false }], profile, alternatives: 0 }, ['w:1']);
        checkLeg(leg);
        if (leg?.status !== 'ok') continue;
        planned++;
        const radius = SNAP_RADIUS_M[discipline];
        const starts = snapPoint(net, costs, from.lat, from.lng, radius, 'from');
        const ends = snapPoint(net, costs, to.lat, to.lng, radius, 'to');
        const budget = { maxSettled: 400_000, deadline: Date.now() + LEG_TIME_MS };
        const found = searchPath(net, costs, starts, ends, to, budget);
        expect(found.status).toBe('ok');
        if (found.status === 'ok') checkSteps(net, found.path.steps, modeOf, 2);
      }
      // The sweep would prove nothing if no pair were ever planned.
      if (discipline === 'alpine') expect(planned).toBeGreaterThan(0);
    },
  );
});
