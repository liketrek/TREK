import { DIFF_UNKNOWN, DIFFICULTY_NAMES, Kind } from '../ski-graph.contract';
import { difficultyAllowed, liftClassOf, Mode, type EdgeCosts, type SkiProfile } from './profile';
import type { FoundPath, Step } from './router';
import type { SkiNet } from './stitch';
import type { SkiFailCode, SkiFailHint, SkiRouteFailedLeg, SkiRunDifficulty } from '@trek/shared';

/**
 * Why a leg found no way (spec 7.6): the rules are relaxed one at a time and
 * the leg searched again; the first relaxation that finds a way names the
 * reason and the one change that would plan the leg. The way a relaxed search
 * found is only read for its reason, never returned as the leg's line.
 */

/** One try at a leg with a profile: a way, no place to start or end, no way, or a search out of budget. */
export type LegAttempt =
  | { status: 'ok'; path: FoundPath; settled: number; costs: EdgeCosts }
  | { status: 'no_snap'; which: 'from' | 'to' }
  | { status: 'none'; nearest: { lat: number; lng: number } | null }
  | { status: 'timeout' };

type Attempt = (profile: SkiProfile) => LegAttempt;

type Found = Extract<LegAttempt, { status: 'ok' }>;

interface Relaxation {
  code: SkiFailCode;
  applies: (profile: SkiProfile) => boolean;
  relax: (profile: SkiProfile) => SkiProfile;
  /** The hint and the run or lift the reason is about, read off the relaxed way. */
  read: (net: SkiNet, base: SkiProfile, found: Found) => { hint: SkiFailHint; name: string | null };
}

const DOWNHILL_DISCIPLINES: ReadonlySet<string> = new Set(['alpine', 'snowboard', 'touring']);
const DESCENT_MODES: ReadonlySet<number> = new Set([Mode.DOWNHILL, Mode.SKITOUR_DOWN]);
const PISTE_KINDS: ReadonlySet<number> = new Set([Kind.RUN, Kind.AREA, Kind.CONNECTION]);
const LIFT_EDGE_KINDS: ReadonlySet<number> = new Set([Kind.LIFT, Kind.RAIL, Kind.BOARD]);

const modeOf = (costs: EdgeCosts, step: Step): number =>
  (step.dir === 0 ? costs.modeFwd[step.edge] : costs.modeBack[step.edge]) as number;

const nameOf = (net: SkiNet, edge: number): string | null => net.edgeName[edge] ?? net.edgeRef[edge] ?? null;

/** The hardest run of a way above what a profile allows, if it has one. */
export function hardestAbove(
  net: SkiNet,
  base: SkiProfile,
  path: FoundPath,
  costs: EdgeCosts,
): { level: SkiRunDifficulty; name: string | null } | null {
  let hardest = -1;
  let edge = -1;
  for (const step of path.steps) {
    const diff = net.edgeDiff[step.edge] as number;
    if (!DESCENT_MODES.has(modeOf(costs, step)) || !PISTE_KINDS.has(net.edgeKind[step.edge] as number)) continue;
    if (diff === DIFF_UNKNOWN || difficultyAllowed(base.options, diff) || diff <= hardest) continue;
    hardest = diff;
    edge = step.edge;
  }
  const level = DIFFICULTY_NAMES[hardest];
  return level ? { level, name: nameOf(net, edge) } : null;
}

const RELAXATIONS: readonly Relaxation[] = [
  {
    code: 'blocked_by_difficulty',
    applies: (p) =>
      DOWNHILL_DISCIPLINES.has(p.discipline) && (p.options.max_difficulty !== 'expert' || !p.options.allow_freeride),
    relax: (p) => ({ ...p, options: { ...p.options, max_difficulty: 'expert', allow_freeride: true } }),
    read: (net, base, found) => {
      const hardest = hardestAbove(net, base, found.path, found.costs);
      return { hint: hardest ? { raise_difficulty: hardest.level } : {}, name: hardest?.name ?? null };
    },
  },
  {
    code: 'blocked_by_lift_avoid',
    applies: (p) => p.useLifts && p.options.avoid_lifts.length > 0,
    relax: (p) => ({ ...p, options: { ...p.options, avoid_lifts: [] } }),
    read: (net, base, found) => {
      for (const step of found.path.steps) {
        if (!LIFT_EDGE_KINDS.has(net.edgeKind[step.edge] as number)) continue;
        const cls = liftClassOf(net.edgeLift[step.edge] as number);
        if (cls && base.options.avoid_lifts.includes(cls)) {
          return { hint: { allow_lift: cls }, name: nameOf(net, step.edge) };
        }
      }
      return { hint: {}, name: null };
    },
  },
  {
    code: 'blocked_by_technique',
    applies: (p) => p.discipline === 'cross_country' && p.technique !== 'unknown',
    relax: (p) => ({ ...p, technique: 'unknown' }),
    read: () => ({ hint: { technique: 'unknown' }, name: null }),
  },
  {
    code: 'needs_ride_down',
    applies: (p) => p.useLifts && !p.options.allow_lift_down,
    relax: (p) => ({ ...p, options: { ...p.options, allow_lift_down: true } }),
    read: (net, _base, found) => {
      const ride = found.path.steps.find((step) => modeOf(found.costs, step) === Mode.LIFT_DOWN);
      return { hint: { allow_lift_down: true }, name: ride ? nameOf(net, ride.edge) : null };
    },
  },
  {
    code: 'uphill_only',
    applies: (p) => p.discipline === 'alpine' || p.discipline === 'snowboard',
    relax: (p) => ({ ...p, walkUphill: true }),
    read: () => ({ hint: { discipline: 'touring' }, name: null }),
  },
];

/**
 * The reason a leg failed, from relaxing the rules one at a time, or null when
 * no single relaxation finds a way (the caller then says where it stopped).
 */
export function explainFailure(net: SkiNet, base: SkiProfile, attempt: Attempt): SkiRouteFailedLeg | null {
  for (const relaxation of RELAXATIONS) {
    if (!relaxation.applies(base)) continue;
    const found = attempt(relaxation.relax(base));
    if (found.status !== 'ok') continue;
    const { hint, name } = relaxation.read(net, base, found);
    return { status: 'failed', code: relaxation.code, at: null, hint, detail: { name } };
  }
  return null;
}
