import {
  STORAGE_RECLAIM_CATEGORIES,
  type StorageReclaimCategoryReport,
  type StorageReclaimReport,
  type StorageReclaimState,
} from '@trek/shared';

/** A number of files and their size, as the report counts them. */
export interface ReclaimCount {
  objects: number;
  bytes: number;
}

/** What one category of the last check has to say, when it has anything to say. */
interface ReclaimCategoryLine {
  category: (typeof STORAGE_RECLAIM_CATEGORIES)[number];
  /** Unused for a week or more: what the nightly run deletes once deletion is on. */
  freeable: ReclaimCount;
  /** Unused for less than a week: these get their week first. */
  waiting: ReclaimCount;
  /**
   * An unusually large share of the category looks unused: nothing in it is
   * deleted until an admin confirms that this is expected (a cleaned-up
   * backlog, say, rather than a second installation in the same bucket).
   */
  confirmationRequired: boolean;
  /** Everything the check found unused in the category, the count a confirmation is given for. */
  unreferenced: number;
  /** Why the category was left alone, or stopped part way; null when it was checked through. */
  skipped: Exclude<StorageReclaimCategoryReport['skipped'], 'not_reclaimed'> | null;
}

/** The admin's view of the reclaim pass: the switch and what the last check found. */
export interface ReclaimView {
  deleteEnabled: boolean;
  /** A check, nightly or on demand, is running now. */
  running: boolean;
  /** When the last check finished, ms; null before the first one. */
  checkedAt: number | null;
  /** Why the last check stopped before the end; null when it ran through. */
  stopped: StorageReclaimReport['stopped'];
  freeable: ReclaimCount;
  waiting: ReclaimCount;
  /** What the last run with deletion on removed: a check on demand only reports, so it never resets this. */
  freed: ReclaimCount;
  /** When that run finished, ms; null when nothing ever ran with deletion on. */
  freedAt: number | null;
  /** Only the categories with something to free, something waiting, something to confirm, or a reason they were skipped. */
  lines: ReclaimCategoryLine[];
}

const NONE: ReclaimCount = { objects: 0, bytes: 0 };

function add(a: ReclaimCount, b: ReclaimCount): ReclaimCount {
  return { objects: a.objects + b.objects, bytes: a.bytes + b.bytes };
}

function minus(a: ReclaimCount, b: ReclaimCount): ReclaimCount {
  return { objects: Math.max(0, a.objects - b.objects), bytes: Math.max(0, a.bytes - b.bytes) };
}

function freedBy(run: StorageReclaimReport | null): ReclaimCount {
  if (!run) return NONE;
  return STORAGE_RECLAIM_CATEGORIES.reduce(
    (sum, category) => add(sum, run.categories[category]?.deleted ?? NONE),
    NONE
  );
}

/**
 * The reclaim state as the storage panels show it, desktop and phone alike.
 * `null` (a server from before the reclaim pass, or a state not loaded) reads
 * as deletion off, not running and never checked.
 */
/**
 * One category of the last check as a line, or null when it has nothing to
 * say. A category the pass stopped in still counts what it found; one it
 * never judged counts nothing.
 */
function lineOf(
  category: ReclaimCategoryLine['category'],
  report: StorageReclaimCategoryReport | undefined
): ReclaimCategoryLine | null {
  if (!report || report.skipped === 'not_reclaimed') return null;
  const judged = report.skipped === null || report.skipped === 'interrupted' || report.skipped === 'delete_failed';
  // What was deleted on this run no longer waits to be freed.
  const freeable = judged ? minus(report.eligible, report.deleted) : NONE;
  const waiting = judged ? minus(report.unreferenced, report.eligible) : NONE;
  const line = {
    category,
    freeable,
    waiting,
    confirmationRequired: report.confirmationRequired,
    unreferenced: report.unreferenced.objects,
    skipped: report.skipped,
  };
  const quiet = freeable.objects === 0 && waiting.objects === 0 && !line.confirmationRequired && line.skipped === null;
  return quiet ? null : line;
}

/**
 * The reclaim state as the storage panels show it, desktop and phone alike.
 * `null` (a server from before the reclaim pass, or a state not loaded) reads
 * as deletion off, not running and never checked.
 */
export function reclaimView(state: StorageReclaimState | null): ReclaimView {
  const run = state?.lastRun ?? null;
  const lines = STORAGE_RECLAIM_CATEGORIES.flatMap((category) => lineOf(category, run?.categories[category]) ?? []);
  const freeable = lines.reduce((sum, line) => add(sum, line.freeable), NONE);
  const waiting = lines.reduce((sum, line) => add(sum, line.waiting), NONE);
  const deleteRun = state?.lastDeleteRun ?? null;
  return {
    deleteEnabled: state?.deleteEnabled ?? false,
    running: state?.running ?? false,
    checkedAt: run?.finishedAt ?? null,
    stopped: run?.stopped ?? null,
    freeable,
    waiting,
    freed: freedBy(deleteRun),
    freedAt: deleteRun?.finishedAt ?? null,
    lines,
  };
}
