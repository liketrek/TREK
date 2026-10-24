import { findAlternatives } from './alternatives';
import { explainFailure, hardestAbove, type LegAttempt } from './explain';
import { compileProfile, type EdgeCosts, type SkiProfile } from './profile';
import { LEG_TIME_MS, MAX_SETTLED, searchPath, type SearchBudget } from './router';
import { buildLeg, flagNotes, legSeconds } from './segments';
import { nearestUsable, SNAP_RADIUS_M, snapPoint, type Snap } from './snap';
import type { SkiNet } from './stitch';
import type { SkiRouteLeg, SkiRoutePoint, SkiWhy } from '@trek/shared';

/**
 * The legs of one request on one network: each leg snapped, searched and,
 * planned, built into its line and stretches with its notes and other ways;
 * failed, explained. A leg that goes on from the one before starts exactly
 * where that one ended, so a tour does not jump between two parallel runs at
 * a point the skier set.
 */

export interface LegInput {
  from: SkiRoutePoint;
  to: SkiRoutePoint;
  /** The leg starts at the point the previous leg of this job ended at. */
  continues: boolean;
}

interface PlanInput {
  legs: readonly LegInput[];
  profile: SkiProfile;
  alternatives: number;
}

/** A relaxed search while explaining gets a quarter of the nodes and well under a second. */
const RELAXED_SETTLED = MAX_SETTLED / 4;
const RELAXED_MS = 600;
/** Only a leg found cheaply is searched again for the harder runs it kept clear of. */
const WHY_SETTLED = 50_000;
/** How much quicker the harder way must be before the note says so. */
const WHY_FASTER = 0.8;
/** How far a point off the network is measured, at most. */
const MEASURE_OFF_M = 2000;
const COMPILED_PROFILES = 8;

const round1 = (value: number): number => Math.round(value * 10) / 10;
const startOf = (snap: Snap): [number, number, number] => [snap.lat, snap.lng, snap.ele];

export class SkiRouter {
  private readonly compiled = new Map<string, EdgeCosts>();

  constructor(readonly net: SkiNet) {}

  /** The network's costs for a profile, kept for the last few profiles asked. */
  costsFor(profile: SkiProfile): EdgeCosts {
    const key = JSON.stringify(profile);
    let costs = this.compiled.get(key);
    if (costs) {
      this.compiled.delete(key);
    } else {
      costs = compileProfile(profile, this.net);
    }
    this.compiled.set(key, costs);
    while (this.compiled.size > COMPILED_PROFILES) this.compiled.delete(this.compiled.keys().next().value as string);
    return costs;
  }

  plan(input: PlanInput, areaIds: string[]): SkiRouteLeg[] {
    let previous: Snap | null = null;
    return input.legs.map((leg) => {
      const { answer, end } = this.planLeg(leg, input, leg.continues ? previous : null, areaIds);
      previous = end;
      return answer;
    });
  }

  /** One try at a leg with a profile, starting at `start` when the leg goes on from the one before. */
  private attempt(profile: SkiProfile, leg: LegInput, start: Snap | null, budget: SearchBudget): LegAttempt {
    const costs = this.costsFor(profile);
    const radius = SNAP_RADIUS_M[profile.discipline];
    const starts = start ? [start] : snapPoint(this.net, costs, leg.from.lat, leg.from.lng, radius, 'from');
    if (starts.length === 0) return { status: 'no_snap', which: 'from' };
    const ends = snapPoint(this.net, costs, leg.to.lat, leg.to.lng, radius, 'to');
    if (ends.length === 0) return { status: 'no_snap', which: 'to' };
    const outcome = searchPath(this.net, costs, starts, ends, leg.to, budget);
    if (outcome.status === 'ok') return { status: 'ok', path: outcome.path, settled: outcome.settled, costs };
    return outcome.status === 'none' ? { status: 'none', nearest: outcome.nearest } : { status: 'timeout' };
  }

  private relaxedBudget(): SearchBudget {
    return { maxSettled: RELAXED_SETTLED, deadline: Date.now() + RELAXED_MS };
  }

  private planLeg(
    leg: LegInput,
    input: PlanInput,
    start: Snap | null,
    areaIds: string[],
  ): { answer: SkiRouteLeg; end: Snap | null } {
    const base = input.profile;
    const found = this.attempt(base, leg, start, { maxSettled: MAX_SETTLED, deadline: Date.now() + LEG_TIME_MS });
    if (found.status === 'timeout') {
      return { answer: { status: 'failed', code: 'timeout', at: null, hint: null, detail: null }, end: null };
    }
    if (found.status !== 'ok') return { answer: this.failed(base, leg, start, found), end: null };
    const { path, costs } = found;
    const built = buildLeg(this.net, costs, path.steps, startOf(path.start));
    const avoided = this.avoidedDifficulty(base, leg, start, found, legSeconds(built));
    const why: SkiWhy[] = [...avoided, ...flagNotes(built.flagCounts)];
    const alternatives = findAlternatives(this.net, costs, path, input.alternatives, (penalty) =>
      searchPath(this.net, costs, [path.start], [path.end], leg.to, this.relaxedBudget(), penalty),
    );
    const { flagCounts: _flags, ...line } = built;
    return {
      answer: {
        status: 'ok',
        ...line,
        snapped_m: { from: round1(path.start.distance), to: round1(path.end.distance) },
        area_ids: areaIds,
        why,
        alternatives,
      },
      end: path.end,
    };
  }

  /** Why a leg found no way, or where it stopped. */
  private failed(base: SkiProfile, leg: LegInput, start: Snap | null, found: LegAttempt): SkiRouteLeg {
    const explained = explainFailure(this.net, base, (profile) =>
      this.attempt(profile, leg, start, this.relaxedBudget()),
    );
    if (explained) return explained;
    if (found.status === 'no_snap') {
      const point = found.which === 'from' ? leg.from : leg.to;
      const near = nearestUsable(this.net, this.costsFor(base), point.lat, point.lng, MEASURE_OFF_M);
      const name = near ? (this.net.edgeName[near.edge] ?? this.net.edgeRef[near.edge] ?? null) : null;
      const detail = near ? { name, distance_m: Math.round(near.distance) } : null;
      return { status: 'failed', code: 'not_on_piste', at: point, hint: null, detail };
    }
    const nearest = found.status === 'none' ? found.nearest : null;
    return { status: 'failed', code: 'disconnected', at: nearest, hint: null, detail: null };
  }

  /** A note when a way over harder runs would have been clearly quicker; nothing for a leg costly to search. */
  private avoidedDifficulty(
    base: SkiProfile,
    leg: LegInput,
    start: Snap | null,
    found: Extract<LegAttempt, { status: 'ok' }>,
    seconds: number,
  ): SkiWhy[] {
    const limited = base.options.max_difficulty !== 'expert' || !base.options.allow_freeride;
    const downhill = base.discipline === 'alpine' || base.discipline === 'snowboard' || base.discipline === 'touring';
    if (!limited || !downhill || found.settled > WHY_SETTLED) return [];
    const options = { ...base.options, max_difficulty: 'expert' as const, allow_freeride: true };
    const relaxed: SkiProfile = { ...base, options };
    const other = this.attempt(relaxed, leg, start, this.relaxedBudget());
    if (other.status !== 'ok') return [];
    const hardest = hardestAbove(this.net, base, other.path, other.costs);
    const faster = legSeconds(buildLeg(this.net, other.costs, other.path.steps, startOf(other.path.start)));
    if (!hardest || faster > seconds * WHY_FASTER) return [];
    const saved = Math.round(seconds - faster);
    return [{ kind: 'avoided_difficulty', level: hardest.level, name: hardest.name, saved_seconds: saved }];
  }
}
