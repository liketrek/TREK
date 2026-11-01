import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimCategoryReport, type StorageReclaimState } from '@trek/shared';

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
  /** Why the category was left alone; null when it was checked. */
  skipped: Exclude<StorageReclaimCategoryReport['skipped'], 'not_reclaimed'> | null;
}

/** The admin's view of the reclaim pass: the switch and what the last check found. */
export interface ReclaimView {
  deleteEnabled: boolean;
  /** When the last check finished, ms; null before the first one. */
  checkedAt: number | null;
  /** The last check stopped early, because a restore swapped the database under it. */
  stopped: boolean;
  freeable: ReclaimCount;
  waiting: ReclaimCount;
  /** What the last check deleted itself (only a nightly run with deletion on deletes). */
  deleted: ReclaimCount;
  /** Only the categories with something to free, something waiting, or a reason they were skipped. */
  lines: ReclaimCategoryLine[];
}

const NONE: ReclaimCount = { objects: 0, bytes: 0 };

function add(a: ReclaimCount, b: ReclaimCount): ReclaimCount {
  return { objects: a.objects + b.objects, bytes: a.bytes + b.bytes };
}

function minus(a: ReclaimCount, b: ReclaimCount): ReclaimCount {
  return { objects: Math.max(0, a.objects - b.objects), bytes: Math.max(0, a.bytes - b.bytes) };
}

/**
 * The reclaim state as the storage panels show it, desktop and phone alike.
 * `null` (a server from before the reclaim pass, or a state not loaded) reads
 * as deletion off and never checked.
 */
export function reclaimView(state: StorageReclaimState | null): ReclaimView {
  const run = state?.lastRun ?? null;
  const lines: ReclaimCategoryLine[] = [];
  let freeable = NONE;
  let waiting = NONE;
  let deleted = NONE;
  for (const category of STORAGE_RECLAIM_CATEGORIES) {
    const report = run?.categories[category];
    if (!report || report.skipped === 'not_reclaimed') continue;
    // A skipped category frees nothing, whatever it counted: only its reason is shown.
    if (report.skipped !== null) {
      lines.push({ category, freeable: NONE, waiting: NONE, skipped: report.skipped });
      continue;
    }
    // What was deleted on this run no longer waits to be freed.
    const due = minus(report.eligible, report.deleted);
    const young = minus(report.unreferenced, report.eligible);
    freeable = add(freeable, due);
    waiting = add(waiting, young);
    deleted = add(deleted, report.deleted);
    if (due.objects > 0 || young.objects > 0) lines.push({ category, freeable: due, waiting: young, skipped: null });
  }
  return {
    deleteEnabled: state?.deleteEnabled ?? false,
    checkedAt: run?.finishedAt ?? null,
    stopped: run?.stopped != null,
    freeable,
    waiting,
    deleted,
    lines,
  };
}
