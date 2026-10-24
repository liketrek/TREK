import { cumulativeMetres, type TourRouteCard, type TourRouteStop } from '@trek/shared';

import type { DistanceIndexedProfileSample } from '../../../../utils/routeGeometry';
import { hikePaintCss } from '../../../Tours/hike/hikePaint';
import type { LegVariant, LegVariantKey } from '../../../Tours/planner/legVariants';
import { gradeSegments } from '../../../Tours/terrain/tourTerrainModel';
import type { CardEntry } from '../cardTypes';

/**
 * A tour card's numbers, pure: the height profile scaled to the route's own
 * length, the stretches to tint in it, the stops worth a chip, the figures an
 * activity states, a way as the planner's way cards read one, and the words
 * of every warning, problem and stop as literal tables.
 */

/** The letters the ways of one answer go by, in the order the answer gave them. */
export const WAY_KEYS = ['a', 'b', 'c'] as const;

/** A route card of an answer, under the tool call it came from. */
export interface RouteEntry {
  toolCallId: string;
  card: TourRouteCard;
}

/** The route cards among an answer's cards of the tours' group. */
export function routeEntries(cards: readonly CardEntry[]): RouteEntry[] {
  return cards.flatMap(({ toolCallId, card }) => (card.kind === 'tourRoute' ? [{ toolCallId, card }] : []));
}

/**
 * How an answer's route cards are laid out: proposals of one activity as one
 * card of ways to choose from, three at most each; anything else (a saved
 * tour, a paddle or ski plan) on its own.
 */
export function wayGroups(entries: readonly RouteEntry[]): RouteEntry[][] {
  if (entries.length < 2 || entries.some((entry) => entry.card.source !== 'proposal')) {
    return entries.map((entry) => [entry]);
  }
  const groups: RouteEntry[][] = [];
  for (let index = 0; index < entries.length; index += WAY_KEYS.length) {
    groups.push(entries.slice(index, index + WAY_KEYS.length));
  }
  return groups;
}

/** From how steep a stretch counts as steep, in percent, and how long it must be to be marked. */
export const STEEP_GRADE = 27;
const STEEP_MIN_M = 100;
/** The stretch a grade is measured over, as the 3D view measures it. */
const GRADE_WINDOW_M = 200;

/** How many stop chips show before the middle ones fold into a count: the first four, the last two. */
const CHIP_LIMIT = 8;

const SAC_PAINTS = ['t1', 't2', 't3', 't4', 't5', 't6'] as const;

/** An SAC step's colour as a CSS variable, as the hike's own card draws it. */
export function sacPaint(step: number): string {
  return hikePaintCss(SAC_PAINTS[Math.min(6, Math.max(1, step)) - 1] ?? 't1');
}

/** Whether every point of the line has its height, which a profile needs. */
function hasHeights(card: TourRouteCard): boolean {
  return card.line.length >= 2 && card.line.every((point) => point[2] !== null);
}

/** Metres along the line at each point, scaled to the route's own length so the stops' positions meet it. */
export function alongOf(card: TourRouteCard): number[] {
  const along = cumulativeMetres(card.line);
  const total = along[along.length - 1] ?? 0;
  const scale = card.distanceM !== null && total > 0 ? card.distanceM / total : 1;
  return along.map((metres) => metres * scale);
}

/** The height profile's samples; none for a route joined straight or one without heights. */
export function profileSamples(card: TourRouteCard): DistanceIndexedProfileSample[] {
  if (!card.routed || !hasHeights(card)) return [];
  const along = alongOf(card);
  return card.line.map(([lat, lng, height], index) => ({
    distanceMeters: along[index] ?? 0,
    elevationMeters: height ?? 0,
    lat,
    lng,
  }));
}

/** A stretch to tint behind the profile, in metres along the route. */
interface ProfileBand {
  fromM: number;
  toM: number;
  color: string;
}

/** The grade of each stretch of the profile, where it ends: what `gradeAt` reads. */
export function profileGrades(samples: readonly DistanceIndexedProfileSample[]): { toM: number; grade: number }[] {
  return gradeSegments(samples, GRADE_WINDOW_M).map((segment, index) => ({
    toM: samples[index + 1]?.distanceMeters ?? 0,
    grade: segment.grade,
  }));
}

/** The SAC step of the way at a spot, the hardest where graded stretches meet; null where it is not graded. */
export function sacAt(card: Pick<TourRouteCard, 'stretches'>, atM: number): number | null {
  let step: number | null = null;
  for (const stretch of card.stretches) {
    if (stretch.facet !== 'sac' || atM < stretch.fromM || atM > stretch.toM) continue;
    step = Math.max(step ?? 0, stretch.step);
  }
  return step;
}

/** How steep the way is at a spot, in percent; null past its end or without a profile. */
export function gradeAt(grades: readonly { toM: number; grade: number }[], atM: number): number | null {
  return grades.find((stretch) => stretch.toM >= atM)?.grade ?? null;
}

/** The stretches at least `STEEP_GRADE` steep for at least `STEEP_MIN_M`, uphill or down, joined where they touch. */
export function steepStretches(samples: readonly DistanceIndexedProfileSample[]): { fromM: number; toM: number }[] {
  const runs: { fromM: number; toM: number }[] = [];
  let open: { fromM: number; toM: number } | null = null;
  profileGrades(samples).forEach(({ toM, grade }, index) => {
    const fromM = samples[index]?.distanceMeters ?? 0;
    if (grade < STEEP_GRADE) {
      open = null;
    } else if (open) {
      open.toM = toM;
    } else {
      open = { fromM, toM };
      runs.push(open);
    }
  });
  return runs.filter((run) => run.toM - run.fromM >= STEEP_MIN_M);
}

/**
 * What the profile tints: the stretches graded T3 and harder in their SAC
 * colour, else the steep ones in the warning colour. Never both, so no two
 * tints lie over each other.
 */
export function profileBands(card: TourRouteCard, samples: readonly DistanceIndexedProfileSample[]): ProfileBand[] {
  const graded = card.stretches.flatMap((stretch): ProfileBand[] =>
    stretch.facet === 'sac' && stretch.step >= 3
      ? [{ fromM: stretch.fromM, toM: stretch.toM, color: sacPaint(stretch.step) }]
      : []
  );
  if (graded.length > 0) return graded;
  return steepStretches(samples).map((run) => ({ ...run, color: 'var(--warning)' }));
}

/** Where the profile marks a spot across it: the named stops on the way and the stage ends, six at most. */
export function profileMarks(card: TourRouteCard): number[] {
  const marked = card.stops.filter((stop) => stop.stageEnd || (stop.role === 'via' && stop.name !== null));
  // One mark per spot: the profile keys its marks by where they stand.
  return [...new Set(marked.map((stop) => stop.atM))].slice(0, 6);
}

/** The stop chips in three runs: the first ones, the middle folded into a count, the last ones. */
interface StopChips {
  head: TourRouteStop[];
  folded: TourRouteStop[];
  tail: TourRouteStop[];
}

/** The stops as chips: the start, the end, the named vias and what lies along the way, the middle folded past eight. */
export function chipStops(card: TourRouteCard): StopChips {
  const chips = card.stops.filter((stop) => stop.role !== 'via' || stop.name !== null || stop.kind !== null);
  if (chips.length <= CHIP_LIMIT) return { head: chips, folded: [], tail: [] };
  return { head: chips.slice(0, 4), folded: chips.slice(4, -2), tail: chips.slice(-2) };
}

/** A figure a card can state. */
export type FactKey = 'time' | 'distance' | 'ascent' | 'descent';

/** A figure's value, null where the route does not know it. */
export function factValue(card: TourRouteCard, key: FactKey): number | null {
  if (key === 'time') return card.minutes;
  if (key === 'distance') return card.distanceM;
  return key === 'ascent' ? card.ascentM : card.descentM;
}

/** The figures an activity states, in its order: on skis the descent matters, on the water the distance. */
export function factKeysOf(card: TourRouteCard): FactKey[] {
  const order: FactKey[] =
    card.activity === 'ski'
      ? ['time', 'distance', 'descent']
      : card.activity === 'kayak'
        ? ['distance', 'time']
        : ['time', 'distance', 'ascent', 'descent'];
  return order.filter((key) => factValue(card, key) !== null);
}

/** The route as the planner's way cards read a way, so their badges, marks and differences read it too. */
export function legVariantOf(card: TourRouteCard, key: LegVariantKey): LegVariant {
  return {
    key,
    current: key === 'current',
    coordinates: card.line.map(([lat, lng]): [number, number] => [lat, lng]),
    distanceM: card.distanceM ?? 0,
    gainM: card.ascentM,
    lossM: card.descentM,
    minutes: card.minutes,
    heights: card.ascentM !== null ? 'known' : 'unknown',
  };
}

/** The way a held change of a saved tour replaces, as a way to compare the new one with; null without one. */
export function previousVariantOf(card: TourRouteCard): LegVariant | null {
  const previous = card.previous;
  if (!previous) return null;
  return {
    key: 'current',
    current: true,
    coordinates: previous.line.map(([lat, lng]): [number, number] => [lat, lng]),
    distanceM: previous.distanceM,
    gainM: previous.ascentM,
    lossM: null,
    minutes: previous.minutes,
    heights: previous.ascentM !== null ? 'known' : 'unknown',
  };
}

/** The points to frame on the map: the line, else the stops a route without one joins. */
export function routePoints(card: TourRouteCard): [number, number][] {
  if (card.line.length >= 2) return card.line.map(([lat, lng]): [number, number] => [lat, lng]);
  return card.stops.map((stop): [number, number] => [stop.lat, stop.lng]);
}

/**
 * Whether "Plan this" can take the proposal: a city walk, a hike, a bike
 * tour or a run whose way was planned, or a paddle or ski plan whose every
 * leg was planned. A saved tour, a held change and the other way of a
 * saved hike's leg (named by its place, changed with update_tour rather
 * than created anew) cannot.
 */
export function canTake(card: TourRouteCard): boolean {
  if (card.source === 'plan') {
    const whole = card.warnings.every((warning) => warning.kind !== 'legs_failed');
    return (card.activity === 'kayak' || card.activity === 'ski') && card.routed && whole;
  }
  if (card.source !== 'proposal' || card.placeId !== null) return false;
  return card.activity === 'walk' || (LAND_PLANS.has(card.activity) && card.routed);
}

/** The proposals on land "Plan this" takes once their way is planned. */
const LAND_PLANS: ReadonlySet<TourRouteCard['activity']> = new Set(['hike', 'bike', 'run']);

/** Why "Plan this" waits on a card it can take: a run is saved with the runner's pace only. Null when nothing is missing. */
export function takeWaitsKey(card: TourRouteCard): string | null {
  return card.activity === 'run' && card.paceSecondsPerKm == null ? NEEDS_PACE.labelKey : null;
}

const NEEDS_PACE = { labelKey: 'assistant.card.tour.needsPace' } as const;

/** A share as words take it, "40 %". */
export function percentText(share: number): string {
  return `${Math.round(share * 100)} %`;
}
