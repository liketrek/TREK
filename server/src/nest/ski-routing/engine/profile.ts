import { DIFF_EXPERT, DIFF_UNKNOWN, EdgeFlag, Groom, Kind, Lift, NodeFlag, Use } from '../ski-graph.contract';
import type { SkiNet } from './stitch';
import type { SkiDiscipline, SkiLiftClass, SkiRouteOptions, SkiTechnique } from '@trek/shared';

/**
 * Who travels the network, and what each edge costs them (spec 8). Two numbers
 * per edge and direction: the time it takes (what the traveller is shown) and
 * the cost the search weighs, which is the time with penalties and the
 * skier's preferences on top. An edge a profile may not use costs Infinity.
 */
export interface SkiProfile {
  discipline: SkiDiscipline;
  /** Cross-country only; `unknown` takes either technique. Null for every other discipline. */
  technique: SkiTechnique | null;
  options: SkiRouteOptions;
  /** Whether lifts may be ridden at all, the discipline's default resolved. */
  useLifts: boolean;
  /** Only while explaining a failure: a downhill skier may walk up a run, to tell "no way up" from "no way". */
  walkUphill?: boolean;
}

/** How an edge is travelled in one direction, or 0 when it is not. */
export const Mode = {
  NONE: 0,
  DOWNHILL: 1,
  LIFT: 2,
  LIFT_DOWN: 3,
  BOARD: 4,
  BOARD_DOWN: 5,
  ALIGHT: 6,
  ALIGHT_DOWN: 7,
  NORDIC: 8,
  SKITOUR_UP: 9,
  SKITOUR_DOWN: 10,
  SNOWSHOE: 11,
  HIKE: 12,
  WALK: 13,
  UPHILL_PISTE: 14,
} as const;

/** The time and cost of every edge in both directions for one profile, and how each is travelled. */
export interface EdgeCosts {
  timeFwd: Float64Array;
  timeBack: Float64Array;
  costFwd: Float64Array;
  costBack: Float64Array;
  modeFwd: Uint8Array;
  modeBack: Uint8Array;
  /** The fastest the search can go, metres of straight line per second of cost: the A* heuristic's speed. */
  maxSpeed: number;
}

/** Edges walked or skied as a link between pieces of the network. */
const WALK_KINDS: ReadonlySet<number> = new Set([Kind.LINK, Kind.CROSSING, Kind.CONNECTION, Kind.WALK]);
/** Edges a run's difficulty applies to. */
const PISTE_KINDS: ReadonlySet<number> = new Set([Kind.RUN, Kind.AREA, Kind.CONNECTION]);

/** The lift class the skier may leave out, by `edgeLift`. */
export function liftClassOf(lift: number): SkiLiftClass | null {
  if (lift === Lift.CABLE_CAR) return 'cable_car';
  if (lift === Lift.GONDOLA || lift === Lift.MIXED) return 'gondola';
  if (lift === Lift.CHAIR_DETACHABLE || lift === Lift.CHAIR_FIXED) return 'open_chair';
  if (lift >= Lift.DRAG && lift <= Lift.MAGIC_CARPET) return 'drag';
  if (lift === Lift.FUNICULAR || lift === Lift.RACK) return 'rail';
  return null;
}

/** Whether a lift of this class may be ridden up. Cross-country skiers ride only enclosed transport. */
export function liftAllowed(profile: SkiProfile, cls: SkiLiftClass | null): boolean {
  if (!profile.useLifts || cls === null || profile.options.avoid_lifts.includes(cls)) return false;
  if (profile.discipline === 'cross_country') return cls === 'gondola' || cls === 'cable_car' || cls === 'rail';
  // Nobody on snowshoes or boots is towed up a slope.
  if (profile.discipline === 'snowshoe' || profile.discipline === 'winter_hike') return cls !== 'drag';
  return true;
}

/** Whether a lift of this class may be ridden down: a gondola, a cable car or a train, never a tow. */
export function liftDownAllowed(profile: SkiProfile, cls: SkiLiftClass | null): boolean {
  return profile.options.allow_lift_down && cls !== 'drag' && liftAllowed(profile, cls);
}

/** Whether a run of this difficulty is within the skier's limit; one the data does not grade always is. */
export function difficultyAllowed(options: SkiRouteOptions, diff: number): boolean {
  if (diff === DIFF_UNKNOWN) return true;
  if (diff > DIFF_EXPERT) return options.allow_freeride;
  return diff <= DIFF_LEVEL[options.max_difficulty];
}

const DIFF_LEVEL: Record<SkiRouteOptions['max_difficulty'], number> = {
  novice: 0,
  easy: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

function lifted(profile: SkiProfile, net: SkiNet, e: number, uses: number, board: number, down: number): number {
  const cls = liftClassOf(net.edgeLift[e] as number);
  if (uses & Use.LIFT_UP && liftAllowed(profile, cls)) return board;
  if (uses & Use.LIFT_DOWN && liftDownAllowed(profile, cls)) return down;
  return Mode.NONE;
}

function nordicWanted(profile: SkiProfile): number {
  if (profile.technique === 'classic') return Use.NORDIC_CLASSIC;
  if (profile.technique === 'skating') return Use.NORDIC_SKATING;
  return Use.NORDIC_CLASSIC | Use.NORDIC_SKATING;
}

function groomAllowed(profile: SkiProfile, net: SkiNet, e: number): boolean {
  const groom = net.edgeGroom[e] as number;
  if (profile.options.groomed_only && (groom === 0 || groom & Groom.BACKCOUNTRY)) return false;
  return !profile.options.lit_only || ((net.edgeFlags[e] as number) & EdgeFlag.LIT) !== 0;
}

/** A downhill use of a piste, as long as its difficulty is within the limit. */
function descent(profile: SkiProfile, net: SkiNet, e: number, mode: number): number {
  if (!PISTE_KINDS.has(net.edgeKind[e] as number)) return mode;
  return difficultyAllowed(profile.options, net.edgeDiff[e] as number) ? mode : Mode.NONE;
}

/** A run short enough to be crossed on foot by someone who does not ski it. */
function crossable(net: SkiNet, e: number): boolean {
  const kind = net.edgeKind[e] as number;
  return (kind === Kind.RUN || kind === Kind.AREA) && (net.edgeLen[e] as number) <= 80;
}

function downhillMode(profile: SkiProfile, net: SkiNet, e: number, uses: number, other: number): number {
  const kind = net.edgeKind[e] as number;
  if (uses & Use.DOWNHILL) {
    const mode = descent(profile, net, e, Mode.DOWNHILL);
    if (mode !== Mode.NONE) return mode;
  }
  if (uses & Use.WALK && WALK_KINDS.has(kind)) return Mode.WALK;
  if (profile.walkUphill && (kind === Kind.RUN || kind === Kind.AREA) && other & Use.DOWNHILL) return Mode.WALK;
  return Mode.NONE;
}

function touringMode(profile: SkiProfile, net: SkiNet, e: number, uses: number, other: number, dir: 0 | 1): number {
  const kind = net.edgeKind[e] as number;
  const up = dir === 0 ? (net.edgeUp[e] as number) : (net.edgeDown[e] as number);
  const down = dir === 0 ? (net.edgeDown[e] as number) : (net.edgeUp[e] as number);
  const canDescend = (uses & (Use.DOWNHILL | Use.SKITOUR_DOWN)) !== 0;
  const canClimb = (uses & (Use.SKITOUR_UP | Use.SNOWSHOE)) !== 0;
  if (canDescend && (!canClimb || down >= up)) {
    const mode = descent(profile, net, e, Mode.SKITOUR_DOWN);
    if (mode !== Mode.NONE) return mode;
  }
  if (canClimb) return Mode.SKITOUR_UP;
  if (profile.options.touring_uphill_on_pistes && (kind === Kind.RUN || kind === Kind.AREA) && other & Use.DOWNHILL) {
    return Mode.UPHILL_PISTE;
  }
  return uses & Use.WALK && WALK_KINDS.has(kind) ? Mode.WALK : Mode.NONE;
}

/** How a profile travels an edge's snow (not its lifts) in one direction. */
function snowMode(profile: SkiProfile, net: SkiNet, e: number, dir: 0 | 1): number {
  const uses = (dir === 0 ? net.edgeFwd[e] : net.edgeBack[e]) as number;
  const other = (dir === 0 ? net.edgeBack[e] : net.edgeFwd[e]) as number;
  const kind = net.edgeKind[e] as number;
  const walk = uses & Use.WALK && WALK_KINDS.has(kind) ? Mode.WALK : Mode.NONE;
  switch (profile.discipline) {
    case 'alpine':
    case 'snowboard':
      return downhillMode(profile, net, e, uses, other);
    case 'cross_country':
      if (uses & nordicWanted(profile) && groomAllowed(profile, net, e)) return Mode.NORDIC;
      return walk;
    case 'touring':
      return touringMode(profile, net, e, uses, other, dir);
    case 'snowshoe':
      // A run's ski touring bits are a tourer's way down it, not a snowshoe trail.
      if (!PISTE_KINDS.has(kind) && uses & (Use.SNOWSHOE | Use.WINTER_HIKE | Use.SKITOUR_UP | Use.SKITOUR_DOWN)) {
        return Mode.SNOWSHOE;
      }
      if (crossable(net, e) && (uses | other) !== 0) return Mode.WALK;
      return walk;
    case 'winter_hike':
      if (uses & Use.WINTER_HIKE) return Mode.HIKE;
      if (crossable(net, e) && (uses | other) !== 0) return Mode.WALK;
      return walk;
  }
}

/** How a profile travels an edge in one direction, or {@link Mode.NONE}. */
export function travelMode(profile: SkiProfile, net: SkiNet, e: number, dir: 0 | 1): number {
  const uses = (dir === 0 ? net.edgeFwd[e] : net.edgeBack[e]) as number;
  const kind = net.edgeKind[e] as number;
  if (kind === Kind.LIFT || kind === Kind.RAIL) return lifted(profile, net, e, uses, Mode.LIFT, Mode.LIFT_DOWN);
  if (kind === Kind.BOARD) return lifted(profile, net, e, uses, Mode.BOARD, Mode.BOARD_DOWN);
  if (kind === Kind.ALIGHT) return lifted(profile, net, e, uses, Mode.ALIGHT, Mode.ALIGHT_DOWN);
  return snowMode(profile, net, e, dir);
}

// ── Times (spec 8.1) ─────────────────────────────────────────────────────────

/** Downhill speed by difficulty, m/s: novice, easy, intermediate, advanced, expert, freeride, extreme. */
const RUN_SPEED = [4, 7, 8.5, 7, 6, 5, 5];
const UNKNOWN_RUN_SPEED = 7;
const PACE_FACTOR: Record<SkiRouteOptions['pace'], number> = { relaxed: 0.7, normal: 1, sporty: 1.3 };

/** Ride speed by lift type when the data gives no ride time, m/s. */
const LIFT_SPEED: Record<number, number> = {
  [Lift.CABLE_CAR]: 10,
  [Lift.GONDOLA]: 5,
  [Lift.MIXED]: 5,
  [Lift.CHAIR_DETACHABLE]: 5,
  [Lift.CHAIR_FIXED]: 2.3,
  [Lift.DRAG]: 3,
  [Lift.TBAR]: 3,
  [Lift.JBAR]: 3,
  [Lift.PLATTER]: 3,
  [Lift.ROPE_TOW]: 2,
  [Lift.MAGIC_CARPET]: 0.8,
  [Lift.FUNICULAR]: 8,
  [Lift.RACK]: 8,
};

/** The wait at a lift's bottom station, a guess from its type and capacity, seconds. */
export function boardWaitSeconds(lift: number, capacity: number): number {
  const cls = liftClassOf(lift);
  if (lift === Lift.MAGIC_CARPET) return 30;
  if (cls === 'drag') return 60;
  if (cls === 'cable_car' || cls === 'rail') return 240;
  return capacity >= 2400 ? 90 : 120;
}

const ALIGHT_SECONDS = 15;
const WALK_SPEED = 0.7;

/** DIN 33466: the longer of the two times plus half the shorter, both in seconds. */
const din = (horizontal: number, vertical: number): number =>
  Math.max(horizontal, vertical) + Math.min(horizontal, vertical) / 2;

function runSeconds(profile: SkiProfile, net: SkiNet, e: number, length: number): number {
  const diff = net.edgeDiff[e] as number;
  let speed = (diff === DIFF_UNKNOWN ? UNKNOWN_RUN_SPEED : RUN_SPEED[diff]) ?? UNKNOWN_RUN_SPEED;
  if ((net.edgeGroom[e] as number) & Groom.MOGUL) speed *= 0.8;
  if ((net.edgeKind[e] as number) === Kind.AREA) speed *= 0.8;
  speed *= PACE_FACTOR[profile.options.pace];
  if (profile.discipline === 'snowboard') {
    if ((net.edgeFlags[e] as number) & EdgeFlag.FLAT_FOR_BOARD) return length / 1.5;
    speed *= 0.95;
  }
  return length / speed;
}

/** Tobler's hiking function, normalised to the flat, for a nordic skier: slower up, a little faster down. */
function toblerFactor(grade: number): number {
  const factor = Math.exp(-3.5 * Math.abs(grade + 0.05)) / Math.exp(-0.175);
  return Math.min(2.5, Math.max(0.25, factor));
}

function nordicSeconds(profile: SkiProfile, net: SkiNet, e: number, length: number, climb: number, drop: number) {
  const flat = profile.technique === 'skating' ? 3.3 : 2.5;
  const grade = length > 0 ? (climb - drop) / length : 0;
  let speed = flat * toblerFactor(grade);
  if ((net.edgeGroom[e] as number) & Groom.BACKCOUNTRY) speed *= 0.6;
  return length / speed;
}

/** What it takes to travel an edge in one direction in a mode, seconds; the wait at a lift included. */
export function edgeSeconds(profile: SkiProfile, net: SkiNet, e: number, dir: 0 | 1, mode: number): number {
  const length = net.edgeLen[e] as number;
  const climb = dir === 0 ? (net.edgeUp[e] as number) : (net.edgeDown[e] as number);
  const drop = dir === 0 ? (net.edgeDown[e] as number) : (net.edgeUp[e] as number);
  const kind = net.edgeKind[e] as number;
  // A link, a crossing or a mapped walk is walked, whatever it lets through.
  if (mode === Mode.WALK || kind === Kind.LINK || kind === Kind.CROSSING || kind === Kind.WALK) {
    return length / WALK_SPEED + (climb / 300) * 3600;
  }
  switch (mode) {
    case Mode.DOWNHILL:
      return runSeconds(profile, net, e, length);
    case Mode.LIFT:
    case Mode.LIFT_DOWN: {
      const ride = net.edgeLiftSec[e] as number;
      return ride > 0 ? ride : length / (LIFT_SPEED[net.edgeLift[e] as number] ?? 5);
    }
    case Mode.BOARD:
    case Mode.BOARD_DOWN:
      return boardWaitSeconds(net.edgeLift[e] as number, net.edgeLiftCap[e] as number);
    case Mode.ALIGHT:
    case Mode.ALIGHT_DOWN:
      return ALIGHT_SECONDS;
    case Mode.NORDIC:
      return nordicSeconds(profile, net, e, length, climb, drop);
    case Mode.SKITOUR_UP:
    case Mode.UPHILL_PISTE:
      return din(length / (4000 / 3600), (climb / 350) * 3600);
    case Mode.SKITOUR_DOWN:
      return length / (kind === Kind.RUN || kind === Kind.AREA || kind === Kind.CONNECTION ? 7 : 3);
    case Mode.SNOWSHOE:
      return din(length / (3000 / 3600), (climb / 250) * 3600 + (drop / 500) * 3600);
    case Mode.HIKE:
      return din(length / (4000 / 3600), (climb / 300) * 3600 + (drop / 500) * 3600) / 0.85;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

/** The extra seconds of the node an edge arrives at: getting out of the bindings where the map says to. */
export function dismountSeconds(net: SkiNet, node: number): number {
  const flags = net.nodeFlags[node] as number;
  if (flags & NodeFlag.DISMOUNT_YES) return 30;
  return flags & NodeFlag.DISMOUNT_SOMETIMES ? 10 : 0;
}

// ── Costs (spec 8.2) ─────────────────────────────────────────────────────────

const SKIING_MODES: ReadonlySet<number> = new Set([Mode.DOWNHILL, Mode.NORDIC, Mode.SKITOUR_DOWN]);
const LIFT_MODES: ReadonlySet<number> = new Set([Mode.LIFT, Mode.LIFT_DOWN, Mode.BOARD, Mode.BOARD_DOWN]);

/** OsmAnd's weighting for the easiest way: the harder a run against the limit, the dearer. */
function easiestFactor(options: SkiRouteOptions, diff: number): number {
  if (diff === DIFF_UNKNOWN) return 1.5;
  const below = DIFF_LEVEL[options.max_difficulty] - Math.min(diff, DIFF_EXPERT);
  if (below <= 0) return 1.8;
  if (below === 1) return 1.5;
  return below === 2 ? 1.2 : 1;
}

function nordicPenalty(profile: SkiProfile, net: SkiNet, e: number): number {
  const groom = net.edgeGroom[e] as number;
  let factor = 1;
  if (groom & Groom.BACKCOUNTRY) factor *= profile.technique === 'skating' ? 3 : 2;
  if ((net.edgeFlags[e] as number) & EdgeFlag.TECHNIQUE_ASSUMED) factor *= 1.1;
  return factor;
}

/** The cost the search weighs for an edge travelled in one direction: its time, penalised and weighted. */
export function edgeCost(profile: SkiProfile, net: SkiNet, e: number, dir: 0 | 1, mode: number, time: number): number {
  const flags = net.edgeFlags[e] as number;
  const kind = net.edgeKind[e] as number;
  let cost = time;
  if (mode === Mode.LIFT_DOWN) cost *= 3;
  if (mode === Mode.UPHILL_PISTE) cost *= 1.5;
  const uses = (dir === 0 ? net.edgeFwd[e] : net.edgeBack[e]) as number;
  if (mode === Mode.SNOWSHOE && uses & Use.SNOWSHOE) cost *= 0.8;
  if (mode === Mode.NORDIC) cost *= nordicPenalty(profile, net, e);
  if (dir === 1 && flags & EdgeFlag.DIR_CONFLICT && SKIING_MODES.has(mode)) cost *= 1.5;
  if (dir === 1 && flags & EdgeFlag.NORDIC_SOFT_ONEWAY && mode === Mode.NORDIC) cost *= 1.1;
  if (kind === Kind.AREA && flags & EdgeFlag.AREA_HAS_RUN) cost *= 1.3;
  if (flags & EdgeFlag.TYPE_UNKNOWN) cost *= 1.5;
  if (profile.discipline === 'snowboard') {
    if (mode === Mode.DOWNHILL && flags & EdgeFlag.FLAT_FOR_BOARD) cost *= 3;
    if (mode === Mode.BOARD && liftClassOf(net.edgeLift[e] as number) === 'drag') cost += 600;
  }
  if (profile.options.priority === 'most_skiing') {
    if (SKIING_MODES.has(mode)) cost /= 1.8;
    else if (LIFT_MODES.has(mode)) cost *= 1.2;
  }
  if (profile.options.priority === 'easiest' && mode === Mode.DOWNHILL && PISTE_KINDS.has(kind)) {
    cost *= easiestFactor(profile.options, net.edgeDiff[e] as number);
  }
  if (flags & EdgeFlag.INFERRED_LINK) {
    cost = (cost + 30) * ((net.edgeLen[e] as number) > 50 ? 2 : 1);
    if (profile.options.avoid_inferred_links) cost *= 5;
  }
  return cost;
}

/** Every edge's time, cost and mode in both directions for one profile. */
export function compileProfile(profile: SkiProfile, net: SkiNet): EdgeCosts {
  const m = net.edgeCount;
  const costs: EdgeCosts = {
    timeFwd: new Float64Array(m),
    timeBack: new Float64Array(m),
    costFwd: new Float64Array(m),
    costBack: new Float64Array(m),
    modeFwd: new Uint8Array(m),
    modeBack: new Uint8Array(m),
    maxSpeed: 1,
  };
  for (let e = 0; e < m; e++) {
    for (const dir of [0, 1] as const) {
      const mode = travelMode(profile, net, e, dir);
      const arrive = dir === 0 ? (net.edgeB[e] as number) : (net.edgeA[e] as number);
      const time =
        mode === Mode.NONE ? Infinity : edgeSeconds(profile, net, e, dir, mode) + dismountSeconds(net, arrive);
      const cost = mode === Mode.NONE ? Infinity : edgeCost(profile, net, e, dir, mode, time);
      if (dir === 0) {
        costs.timeFwd[e] = time;
        costs.costFwd[e] = cost;
        costs.modeFwd[e] = mode;
      } else {
        costs.timeBack[e] = time;
        costs.costBack[e] = cost;
        costs.modeBack[e] = mode;
      }
      // A little over the fastest edge, so the heuristic stays below any cost the lengths' rounding could give.
      const length = net.edgeLen[e] as number;
      if (Number.isFinite(cost) && cost > 0 && length > 0) {
        costs.maxSpeed = Math.max(costs.maxSpeed, (length / cost) * 1.02);
      }
    }
  }
  return costs;
}
