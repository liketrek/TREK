/**
 * STA-02: the pure half of the user's activity sums. The rows are every tour
 * of the trips the user can open, once per day it is on, and the recordings
 * assigned to them; what comes out is the list of the user's done (or still
 * upcoming) tours the shared summary adds up, see `tour-activity-stats.schema`
 * in @trek/shared for the rules this follows. Whether an entry is done, and
 * which whole route its counted stages stand in for, is up to that summary:
 * both depend on the reader's today.
 */
import type { TourStatsExecutionRow, TourStatsTrackRow } from '../../db/repositories/TourActivities.repository';
import { computeTourMetrics, parseRouteGeometry } from './tours.helpers';
import type { TourActivityStatsEntry, TourActivityStatsResponse, TourTypeKey } from '@trek/shared';

/** One tour with its executions, as the rows give it. */
interface TourOfStats {
  row: TourStatsExecutionRow;
  executions: TourStatsExecutionRow[];
}

/** One execution of a tour that is the user's and on a day with a date. */
interface DatedExecution {
  assignmentId: number;
  date: string;
}

interface ActivityStatsInput {
  executions: readonly TourStatsExecutionRow[];
  tracks: readonly TourStatsTrackRow[];
  /** The tours the user left out of their own sums. */
  excluded: ReadonlySet<number>;
  /**
   * MDT-02: the stages of each multi-day tour whose stages are put on days,
   * by the key of the stop each starts at (`tourStageKeysOf`). A tour not in
   * it is counted whole, as a day tour is.
   */
  stageKeys?: ReadonlyMap<number, readonly string[]>;
}

/**
 * Whether an execution is the user's own: it names the user among those taking
 * part, or names nobody, which in the planner means everyone of the trip. The
 * rows only hold trips the user owns or is a member of, so a day that names
 * participants without the user is the only one that is not theirs.
 */
export function isOwnExecution(row: TourStatsExecutionRow): boolean {
  return row.joined === 1 || row.participant_count === 0;
}

/** A trip day's date as a calendar day, null when the day has none. */
function calendarDay(date: string | null): string | null {
  const day = date?.slice(0, 10) ?? null;
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function groupByTour(rows: readonly TourStatsExecutionRow[]): TourOfStats[] {
  const tours = new Map<number, TourOfStats>();
  for (const row of rows) {
    const tour = tours.get(row.place_id) ?? { row, executions: [] };
    if (row.assignment_id !== null) tour.executions.push(row);
    tours.set(row.place_id, tour);
  }
  return [...tours.values()];
}

/** The user's executions of a tour, and of those the ones on a dated day, the earliest first. */
function ownExecutions(tour: TourOfStats): { own: number; dated: DatedExecution[] } {
  const own = tour.executions.filter(isOwnExecution);
  const dated: DatedExecution[] = [];
  for (const row of own) {
    const date = calendarDay(row.date);
    if (date !== null && row.assignment_id !== null) dated.push({ assignmentId: row.assignment_id, date });
  }
  dated.sort((a, b) => a.date.localeCompare(b.date) || a.assignmentId - b.assignmentId);
  return { own: own.length, dated };
}

/** A measure as the contract carries it: unknown stays null, never a negative. */
function measure(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
}

/** On the water a climb says nothing, so a paddle tour carries no heights, planned or recorded. */
function heights(type: string, gain: number | null, loss: number | null) {
  return type === 'kayak' ? { ascent_m: null, descent_m: null } : { ascent_m: measure(gain), descent_m: measure(loss) };
}

function baseEntry(tour: TourOfStats, excluded: ReadonlySet<number>) {
  const { row } = tour;
  return {
    place_id: row.place_id,
    name: row.name,
    tour_type: row.tour_type as TourTypeKey,
    trip: { id: row.trip_id, title: row.trip_title },
    derived_from_place_id: row.derived_from_place_id,
    excluded: excluded.has(row.place_id),
  };
}

/**
 * The plan standing in for the tour: once, however many days it is on, on the
 * last of them, so a tour still under way does not count before it is done.
 */
function planEntry(
  tour: TourOfStats,
  last: DatedExecution,
  dayCount: number,
  excluded: ReadonlySet<number>,
): TourActivityStatsEntry {
  const { row } = tour;
  return {
    ...baseEntry(tour, excluded),
    date: last.date,
    basis: 'plan',
    track: null,
    day_count: dayCount,
    distance_km: measure(row.distance),
    ...heights(row.tour_type, row.elevation_gain, row.elevation_loss),
  };
}

/** A recording in the plan's place, measured on its own line: the line it kept if it was planned over since. */
function trackEntry(
  tour: TourOfStats,
  track: TourStatsTrackRow,
  date: string,
  excluded: ReadonlySet<number>,
): TourActivityStatsEntry {
  const line = parseRouteGeometry(track.track_recorded_route_geometry ?? track.track_route_geometry);
  const metrics = computeTourMetrics(line);
  return {
    ...baseEntry(tour, excluded),
    date,
    basis: 'track',
    track: { place_id: track.track_place_id, name: track.track_name },
    day_count: 1,
    distance_km: line.length >= 2 ? metrics.distanceKm : null,
    ...heights(tour.row.tour_type, metrics.elevationGainM, metrics.elevationLossM),
  };
}

/**
 * A tour's entries: one per recording of one of the user's executions (a
 * recording on no day stands for the whole tour, so it counts with the last of
 * them), or else the plan once. A recording of someone else's execution is
 * theirs, not the user's.
 */
function entriesOfTour(
  tour: TourOfStats,
  dated: readonly DatedExecution[],
  last: DatedExecution,
  tracks: readonly TourStatsTrackRow[],
  excluded: ReadonlySet<number>,
): TourActivityStatsEntry[] {
  const dateOf = new Map(dated.map((execution) => [execution.assignmentId, execution.date]));
  const recorded = tracks
    .filter((track) => track.place_id === tour.row.place_id)
    .map((track) => ({ track, date: track.assignment_id === null ? last.date : dateOf.get(track.assignment_id) }))
    .filter((item): item is { track: TourStatsTrackRow; date: string } => item.date !== undefined);
  if (recorded.length === 0) return [planEntry(tour, last, dated.length, excluded)];
  return recorded.map(({ track, date }) => trackEntry(tour, track, date, excluded));
}

/** What became of one tour: its entries, or why a tour of the user's cannot count. */
type TourOutcome = TourActivityStatsEntry[] | 'unassigned' | 'undated' | null;

/** The dates on which the user does one stage: its own days, and the days that hold the whole tour. */
function stageDates(tour: TourOfStats, key: string): { any: boolean; dates: string[] } {
  const own = tour.executions.filter(
    (row) => isOwnExecution(row) && (row.tour_stage_key === null || row.tour_stage_key === key),
  );
  const dates = own.flatMap((row) => {
    const date = calendarDay(row.date);
    return date === null ? [] : [date];
  });
  return { any: own.length > 0, dates };
}

/**
 * MDT-02: a multi-day tour whose stages are on days of their own. The route
 * is measured whole, so it counts once only when every stage is on a dated
 * day of the user's, on the last of those days; whether that day has passed
 * is the summary's to say. Until then it is uncounted: on no day while a
 * stage is on none of the user's days, undated while one is only on days
 * without a date. A recording counts as what was done, in place of the plan:
 * the plan of the stages it does not cover is not measured apart, so it is
 * left out rather than counted with the whole route a second time.
 */
function stagedOutcome(tour: TourOfStats, keys: readonly string[], input: ActivityStatsInput): TourOutcome {
  const { own, dated } = ownExecutions(tour);
  if (own === 0) return null;
  const last = dated.at(-1);
  if (last) {
    const tracks = input.tracks.filter((track) => track.place_id === tour.row.place_id);
    const recorded = entriesOfTour(tour, dated, last, tracks, input.excluded);
    if (tracks.length > 0 && recorded.every((entry) => entry.basis === 'track')) return recorded;
  }
  const stages = keys.map((key) => stageDates(tour, key));
  if (stages.some((stage) => !stage.any)) return 'unassigned';
  if (stages.some((stage) => stage.dates.length === 0) || !last) return 'undated';
  // Every stage has a date here, so the empty start never wins against an ISO date.
  const lastDate = stages.flatMap((stage) => stage.dates).reduce((a, b) => (b > a ? b : a), '');
  return [planEntry(tour, { assignmentId: last.assignmentId, date: lastDate }, dated.length, input.excluded)];
}

function outcomeOf(tour: TourOfStats, input: ActivityStatsInput): TourOutcome {
  const keys = input.stageKeys?.get(tour.row.place_id) ?? [];
  const stagesOnDays = keys.length > 1 && tour.executions.some((row) => row.tour_stage_key !== null);
  if (stagesOnDays) return stagedOutcome(tour, keys, input);
  const { own, dated } = ownExecutions(tour);
  const last = dated.at(-1);
  if (last) return entriesOfTour(tour, dated, last, input.tracks, input.excluded);
  if (tour.executions.length === 0) return 'unassigned';
  return own > 0 ? 'undated' : null;
}

/**
 * The user's activity entries and what of their trips cannot count. A
 * recording is never a tour of its own here. A whole route other tours were
 * planned from keeps its entries and each stage names it in
 * `derived_from_place_id`: the shared summary leaves the route out only while
 * one of its stages counts, which takes the reader's today. A route whose
 * stages are on the user's days is not named as uncounted either, since they
 * stand in for it.
 */
export function buildActivityStats(input: ActivityStatsInput): TourActivityStatsResponse {
  const recordings = new Set(input.tracks.map((track) => track.track_place_id));
  const tours = groupByTour(input.executions).filter((tour) => !recordings.has(tour.row.place_id));
  const outcomes = tours.map((tour) => ({ tour, outcome: outcomeOf(tour, input) }));
  const routesOfPlannedStages = new Set(
    outcomes.filter(({ outcome }) => Array.isArray(outcome)).map(({ tour }) => tour.row.derived_from_place_id),
  );
  const uncounted = { unassigned: 0, undated: 0 };
  const entries: TourActivityStatsEntry[] = [];
  for (const { tour, outcome } of outcomes) {
    if (Array.isArray(outcome)) entries.push(...outcome);
    else if (outcome !== null && !routesOfPlannedStages.has(tour.row.place_id)) uncounted[outcome] += 1;
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name) || a.place_id - b.place_id);
  return { entries, uncounted };
}
