/**
 * MDT-01: a multi-day tour is one tour, planned whole, whose stops mark where
 * each day's stage ends. The stages are read off the route in its order: the
 * first runs from the start to the first stage end, the next from there on,
 * the last to the end of the tour. Nothing about a stage is stored besides the
 * mark on its last stop, so the whole route and its stages cannot drift apart.
 * A tour without a mark is a day tour, as every tour saved before was.
 */

/** A day in minutes: the most one stage, and a day tour, is planned for. */
export const TOUR_DAY_MINUTES = 24 * 60;

/** The most stages a tour is split into, two months of days. */
export const MAX_TOUR_STAGES = 60;

/** A point as a stage end is read from: where it sits on the tour, and whether it steers only. */
interface StagePoint {
  role: 'start' | 'via' | 'end';
  shaping?: boolean;
  stage_end?: boolean;
}

/** Where a request's stage ends do not hold, and why. */
interface StageIssue {
  path: Array<string | number>;
  message: string;
}

/** How many stages the points make: one more than their stage ends, one for a day tour. */
export function tourStageCountOf(points: ReadonlyArray<{ stage_end?: boolean }>): number {
  return 1 + points.filter((point) => point.stage_end === true).length;
}

/** The longest moving time plus breaks a tour of so many stages is planned for: a day each. */
export function maxTourMinutesFor(stageCount: number): number {
  return Math.max(1, stageCount) * TOUR_DAY_MINUTES;
}

/**
 * Where a stage end may not sit: at the start or the end of the tour, which
 * begin and finish the first and the last stage anyway, and on a shaping
 * point, which is no stop to spend a night at. Beyond {@link MAX_TOUR_STAGES}
 * the tour is refused as a whole.
 */
export function tourStageIssues(points: readonly StagePoint[]): StageIssue[] {
  const issues: StageIssue[] = [];
  points.forEach((point, index) => {
    if (point.stage_end !== true) return;
    if (point.role !== 'via')
      issues.push({ path: ['waypoints', index, 'stage_end'], message: 'a stage ends at a stop between start and end' });
    else if (point.shaping === true)
      issues.push({ path: ['waypoints', index, 'stage_end'], message: 'a shaping point ends no stage' });
  });
  if (tourStageCountOf(points) > MAX_TOUR_STAGES)
    issues.push({ path: ['waypoints'], message: `a tour has at most ${MAX_TOUR_STAGES} stages` });
  return issues;
}

/** MDT-02: a stop a stage starts or ends at, as a list or a day plan places the stages. */
export interface TourStageStop {
  /** The point's own key, kept across saves; a stage is known by the key of the stop it starts at. */
  key: string;
  lat: number;
  lng: number;
}

/** A saved point as the stops between the stages are read from it. */
interface StoredStagePoint extends StagePoint {
  key?: string;
  lat: number;
  lng: number;
}

/**
 * MDT-02: the stops the stages of a multi-day tour run between, in route
 * order: the start, every stop that ends a stage, and the end, so stage `n`
 * runs from stop `n - 1` to stop `n`. A stage is put on a day by the key of
 * the stop it starts at, which a save keeps, so a stage end set or taken away
 * elsewhere leaves the other stages on their days. None for a day tour, and
 * none where a stop has no key yet (a point no save has kept), since such a
 * stage could not be found again.
 */
export function tourStageStopsOf(points: readonly StoredStagePoint[]): TourStageStop[] {
  if (points.length < 2 || tourStageCountOf(points) < 2) return [];
  const last = points.length - 1;
  const stops = points.filter((point, index) => index === 0 || index === last || point.stage_end === true);
  const keyed = stops.flatMap((point) => (point.key ? [{ key: point.key, lat: point.lat, lng: point.lng }] : []));
  return keyed.length === stops.length ? keyed : [];
}

/** The keys a stage can be put on a day by: those of the stops the stages start at, the last stop starting none. */
export function tourStageKeysOf(points: readonly StoredStagePoint[]): string[] {
  return tourStageStopsOf(points)
    .slice(0, -1)
    .map((stop) => stop.key);
}
