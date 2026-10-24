import {
  SKI_DIFFICULTIES,
  skiLiftClassSchema,
  type SkiDifficulty,
  type SkiFlag,
  type SkiGeometryPoint,
  type SkiRouteOkLeg,
  type SkiRouteOptionsInput,
  type SkiSegmentKind,
  type SkiWhy,
} from '@trek/shared';
import type { SkiLegProblem, SkiTourRoute } from '../planner/skiRouting';
import type { SkiChoice } from './skiChoice';

/** Flags that say a stretch rests on a guess of the map data, not on what is mapped. */
const GUESSED: ReadonlySet<SkiFlag> = new Set([
  'inferred_link',
  'inferred_crossing',
  'dir_from_dem',
  'technique_assumed',
  'area_derived',
  'difficulty_unknown',
]);

/** Stretches ridden on a lift, a funicular or rack railway, or a gondola down. */
const RIDES: ReadonlySet<SkiSegmentKind> = new Set(['lift', 'rail', 'lift_down']);

type Seconds = SkiRouteOkLeg['seconds'];

/** A harder run the piste router kept the route clear of. */
export type SkiAvoided = Extract<SkiWhy, { kind: 'avoided_difficulty' }>;

/** The time of every planned leg, by what it is spent on. */
export function skiSecondsOf(route: SkiTourRoute): Seconds {
  const total: Seconds = { ski: 0, lift: 0, wait: 0, walk: 0 };
  for (const leg of route.legs) {
    if (leg?.status !== 'ok') continue;
    total.ski += leg.seconds.ski;
    total.lift += leg.seconds.lift;
    total.wait += leg.seconds.wait;
    total.walk += leg.seconds.walk;
  }
  return total;
}

/** The height lost along a stretch of a leg's line, counted where its points have a height. */
function descentAlong(geometry: readonly SkiGeometryPoint[], from: number, to: number): number {
  let down = 0;
  let last: number | null = null;
  for (const [, , height] of geometry.slice(from, to + 1)) {
    if (height === null) continue;
    if (last !== null && height < last) down += last - height;
    last = height;
  }
  return down;
}

/** The metres of runs, the height skied down on them, and the lift rides of every planned leg. */
export function skiTallyOf(route: SkiTourRoute): { runsM: number; downM: number; rides: number } {
  const tally = { runsM: 0, downM: 0, rides: 0 };
  for (const leg of route.legs) {
    if (leg?.status !== 'ok') continue;
    for (const segment of leg.segments) {
      if (RIDES.has(segment.kind)) tally.rides += 1;
      if (segment.kind !== 'run') continue;
      tally.runsM += segment.length_m;
      tally.downM += descentAlong(leg.geometry, segment.from, segment.to);
    }
  }
  return tally;
}

/** The harder runs the route kept clear of, and whether any stretch rests on a guess. */
export function skiWhyOf(route: SkiTourRoute): { avoided: SkiAvoided[]; guessed: boolean } {
  const why = route.legs.flatMap((leg) => (leg?.status === 'ok' ? leg.why : []));
  return {
    avoided: why.flatMap((entry) => (entry.kind === 'avoided_difficulty' ? [entry] : [])),
    guessed: why.some((entry) => entry.kind === 'flag' && GUESSED.has(entry.flag)),
  };
}

/** One change a failed leg's hint suggests, as a change of the ski choice. */
interface SkiFix {
  labelKey: string;
  apply: (choice: SkiChoice) => SkiChoice;
}

const withOptions = (choice: SkiChoice, patch: Partial<SkiRouteOptionsInput>): SkiChoice => ({
  ...choice,
  options: { ...choice.options, ...patch },
});

/** The fixes a failed leg's hint offers, each a change of the ski choice that would plan it. */
export function skiFixesOf(problem: SkiLegProblem): SkiFix[] {
  const hint = problem.hint;
  if (!hint) return [];
  const fixes: SkiFix[] = [];
  const level = hint.raise_difficulty;
  if (level) {
    const graded = (SKI_DIFFICULTIES as readonly string[]).includes(level);
    fixes.push({
      labelKey: 'tours.ski.fix.raiseDifficulty',
      apply: (choice) =>
        withOptions(choice, graded ? { max_difficulty: level as SkiDifficulty } : { allow_freeride: true }),
    });
  }
  const lift = skiLiftClassSchema.safeParse(hint.allow_lift);
  if (lift.success) {
    fixes.push({
      labelKey: 'tours.ski.fix.allowLift',
      apply: (choice) =>
        withOptions(choice, { avoid_lifts: (choice.options?.avoid_lifts ?? []).filter((c) => c !== lift.data) }),
    });
  }
  if (hint.allow_lift_down) {
    fixes.push({
      labelKey: 'tours.ski.fix.liftDown',
      apply: (choice) => withOptions(choice, { allow_lift_down: true }),
    });
  }
  const technique = hint.technique;
  if (technique) fixes.push({ labelKey: 'tours.ski.fix.technique', apply: (choice) => ({ ...choice, technique }) });
  const discipline = hint.discipline;
  if (discipline) {
    fixes.push({
      labelKey: 'tours.ski.fix.discipline',
      apply: (choice) => ({
        ...choice,
        discipline,
        technique: discipline === 'cross_country' ? choice.technique : null,
      }),
    });
  }
  return fixes;
}
