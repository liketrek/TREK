import { confirmationCovers, type ReclaimConfirmations } from './storage-reclaim.settings';
import type { ServedCategory } from './storage.types';
import type { StorageReclaimCategoryReport, StorageReclaimReport } from '@trek/shared';

/** One object a pass looks at. */
export interface ReclaimCandidate {
  key: string;
  size: number;
}

/**
 * What a pass has found and done in one category so far. It is filled in as
 * the pass goes, so a pass that stops part way still reports what it deleted.
 */
export interface CategoryProgress {
  objects: number;
  unreferenced: ReclaimCandidate[];
  eligible: ReclaimCandidate[];
  deleted: ReclaimCandidate[];
  confirmationRequired: boolean;
  skipped: StorageReclaimCategoryReport['skipped'];
}

export function newProgress(): CategoryProgress {
  return { objects: 0, unreferenced: [], eligible: [], deleted: [], confirmationRequired: false, skipped: null };
}

export function reportOf(progress: CategoryProgress): StorageReclaimCategoryReport {
  return {
    objects: progress.objects,
    unreferenced: countOf(progress.unreferenced),
    eligible: countOf(progress.eligible),
    deleted: countOf(progress.deleted),
    confirmationRequired: progress.confirmationRequired,
    skipped: progress.skipped,
  };
}

function countOf(candidates: readonly ReclaimCandidate[]): { objects: number; bytes: number } {
  return { objects: candidates.length, bytes: candidates.reduce((sum, candidate) => sum + candidate.size, 0) };
}

/**
 * The report as the admin state shows it: a category whose live confirmation
 * covers its unreferenced count no longer reads as waiting for one, so the
 * prompt goes as soon as the admin confirmed, not only after the next pass.
 */
export function withConfirmations(
  report: StorageReclaimReport,
  confirmations: ReclaimConfirmations,
  now: number,
): StorageReclaimReport {
  const categories = Object.fromEntries(
    Object.entries(report.categories).map(([category, row]) => [
      category,
      row.confirmationRequired &&
      confirmationCovers(confirmations[category as ServedCategory], row.unreferenced.objects, now)
        ? { ...row, confirmationRequired: false }
        : row,
    ]),
  ) as StorageReclaimReport['categories'];
  return { ...report, categories };
}

/** What a report says the pass deleted, over every category. */
export function deletedTotal(report: StorageReclaimReport): { objects: number; bytes: number } {
  const rows = Object.values(report.categories);
  return {
    objects: rows.reduce((sum, row) => sum + row.deleted.objects, 0),
    bytes: rows.reduce((sum, row) => sum + row.deleted.bytes, 0),
  };
}

/** One line when the pass found, deleted or refused something; null when there was nothing to say. */
export function reportSummary(report: StorageReclaimReport): string | null {
  const rows = Object.values(report.categories);
  const unreferenced = rows.reduce((sum, row) => sum + row.unreferenced.objects, 0);
  const deleted = deletedTotal(report);
  const skipped = Object.entries(report.categories)
    .filter(([, row]) => row.skipped !== null && row.skipped !== 'not_reclaimed')
    .map(([category, row]) => `${category} (${row.skipped})`);
  const waiting = Object.entries(report.categories)
    .filter(([, row]) => row.confirmationRequired)
    .map(([category]) => category);
  const parts: string[] = [];
  if (unreferenced > 0) parts.push(`${unreferenced} unreferenced object(s)`);
  if (deleted.objects > 0) parts.push(`deleted ${deleted.objects} (${deleted.bytes} bytes)`);
  if (waiting.length > 0) parts.push(`waiting for an admin to confirm ${waiting.join(', ')}`);
  if (skipped.length > 0) parts.push(`skipped ${skipped.join(', ')}`);
  if (report.stopped) parts.push(`stopped: ${report.stopped}`);
  return parts.length > 0 ? parts.join('; ') : null;
}
