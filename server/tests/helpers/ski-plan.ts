/**
 * Planning legs on test worlds the way the service does: the request through
 * its contract, the profile as the service resolves it, the legs of one job
 * each going on from the one before.
 */
import { SkiRouter } from '../../src/nest/ski-routing/engine/plan';
import { stitchGraphs } from '../../src/nest/ski-routing/engine/stitch';
import { profileOf } from '../../src/nest/ski-routing/ski-routing.service';
import type { SkiWorld } from './ski-world';
import {
  skiRouteRequestSchema,
  type SkiDiscipline,
  type SkiRouteLeg,
  type SkiRouteOptionsInput,
  type SkiTechnique,
} from '@trek/shared';

export type Point = { lat: number; lng: number };

export interface PlanOptions {
  discipline?: SkiDiscipline;
  options?: SkiRouteOptionsInput;
  technique?: SkiTechnique | null;
  alternatives?: number;
  /** Whether each leg goes on from where the one before ended (the default), as the service sends them. */
  chained?: boolean;
}

export function planOn(
  worlds: SkiWorld | SkiWorld[],
  legs: Array<[Point, Point]>,
  { discipline = 'alpine', options = {}, technique = null, alternatives = 0, chained = true }: PlanOptions = {},
): SkiRouteLeg[] {
  const all = Array.isArray(worlds) ? worlds : [worlds];
  const router = new SkiRouter(stitchGraphs(all.map((world) => world.graph())));
  const request = skiRouteRequestSchema.parse({
    legs: legs.map(([from, to]) => ({ from, to })),
    discipline,
    technique,
    options,
    alternatives,
  });
  const input = request.legs.map((leg, index) => ({ from: leg.from, to: leg.to, continues: chained && index > 0 }));
  return router.plan({ legs: input, profile: profileOf(request), alternatives: request.alternatives }, ['w:1']);
}

/** The leg as planned, or a failure that says why it was not. */
export function okLeg(leg: SkiRouteLeg | undefined): Extract<SkiRouteLeg, { status: 'ok' }> {
  if (leg?.status !== 'ok') throw new Error(`leg not planned: ${JSON.stringify(leg)}`);
  return leg;
}

export function failedLeg(leg: SkiRouteLeg | undefined): Extract<SkiRouteLeg, { status: 'failed' }> {
  if (leg?.status !== 'failed') throw new Error(`leg planned, a failure was expected`);
  return leg;
}
