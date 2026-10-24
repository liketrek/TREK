import type { TourActivityBasis, TourActivityStatsEntry } from './tour-activity-stats.schema';
import type { TourTypeKey } from './tours.schema';

/**
 * STA-02: what the user's done tours add up to, for the Atlas and for the
 * assistant alike, so both say the same numbers. A sum knows how many entries
 * had the value and of how many could: `value` is null when none had it, never
 * a zero standing in for "unknown", and `known < of` says it is short of the
 * whole. Paddling sums no heights (a climb on the water says nothing), as in
 * the trip's own tour totals (STA-01).
 */
export interface TourActivitySum {
  value: number | null;
  known: number;
  of: number;
}

export interface TourActivityTotals {
  count: number;
  distanceKm: TourActivitySum;
  ascentM: TourActivitySum;
  descentM: TourActivitySum;
  /** How many of the entries rest on the plan and how many on a recorded track. */
  byBasis: Record<TourActivityBasis, number>;
}

export interface TourActivityFilter {
  /** Today in the reader's own calendar, YYYY-MM-DD: a tour counts once its day is over. */
  today: string;
  /** The period, both days included; left out, open on that side. */
  from?: string | null;
  to?: string | null;
  /** One type; left out, all of them. */
  type?: TourTypeKey | null;
}

export interface TourActivitySummary {
  totals: TourActivityTotals;
  /** By type, the most tours first; empty when nothing counts. */
  types: Array<TourActivityTotals & { type: TourTypeKey }>;
  /** Every entry done in the period, the newest first; those the user left out are among them, flagged and not summed. */
  done: TourActivityStatsEntry[];
  /** In the period and of the type, but their day is not over yet. */
  upcoming: number;
}

/** Whether the day an entry is on is over: it counts from the next day on. */
export function isTourActivityDone(entry: Pick<TourActivityStatsEntry, 'date'>, today: string): boolean {
  return entry.date < today;
}

function inPeriod(date: string, filter: TourActivityFilter): boolean {
  return (!filter.from || date >= filter.from) && (!filter.to || date <= filter.to);
}

function sumOf(values: ReadonlyArray<number | null>): TourActivitySum {
  const known = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return {
    value: known.length ? known.reduce((total, value) => total + value, 0) : null,
    known: known.length,
    of: values.length,
  };
}

function totalsOf(entries: readonly TourActivityStatsEntry[]): TourActivityTotals {
  const withHeights = entries.filter((entry) => entry.tour_type !== 'kayak');
  return {
    count: entries.length,
    distanceKm: sumOf(entries.map((entry) => entry.distance_km)),
    ascentM: sumOf(withHeights.map((entry) => entry.ascent_m)),
    descentM: sumOf(withHeights.map((entry) => entry.descent_m)),
    byBasis: {
      plan: entries.filter((entry) => entry.basis === 'plan').length,
      track: entries.filter((entry) => entry.basis === 'track').length,
    },
  };
}

/**
 * A whole route counts only while none of the stages planned from it does:
 * once a stage is done, counted and in the reader's period and type, the
 * stages stand for the route. A stage still ahead or left out hides nothing.
 */
function withoutRoutesOfCountedStages(
  entries: readonly TourActivityStatsEntry[],
  counted: readonly TourActivityStatsEntry[],
): TourActivityStatsEntry[] {
  const routes = new Set(counted.map((entry) => entry.derived_from_place_id));
  return entries.filter((entry) => !routes.has(entry.place_id));
}

/** The entries of the period and type, done and counted, summed as a whole and by type. */
export function summarizeTourActivities(
  entries: readonly TourActivityStatsEntry[],
  filter: TourActivityFilter,
): TourActivitySummary {
  const inScope = entries.filter(
    (entry) => inPeriod(entry.date, filter) && (!filter.type || entry.tour_type === filter.type),
  );
  const countedInScope = inScope.filter((entry) => !entry.excluded && isTourActivityDone(entry, filter.today));
  const matching = withoutRoutesOfCountedStages(inScope, countedInScope);
  const done = matching.filter((entry) => isTourActivityDone(entry, filter.today));
  const counted = done.filter((entry) => !entry.excluded);
  const byType = new Map<TourTypeKey, TourActivityStatsEntry[]>();
  for (const entry of counted) byType.set(entry.tour_type, [...(byType.get(entry.tour_type) ?? []), entry]);
  return {
    totals: totalsOf(counted),
    types: [...byType.entries()]
      .map(([type, ofType]) => ({ type, ...totalsOf(ofType) }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    done: [...done].sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name)),
    upcoming: matching.filter((entry) => !entry.excluded && !isTourActivityDone(entry, filter.today)).length,
  };
}
