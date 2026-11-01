// FE-ADMIN-STOR-RECLAIM-001 to -005: the reclaim report as both storage panels show it.
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimCategoryReport, type StorageReclaimReport } from '@trek/shared';

import { reclaimView } from './reclaimModel';

const none = { objects: 0, bytes: 0 };

function category(patch: Partial<StorageReclaimCategoryReport> = {}): StorageReclaimCategoryReport {
  return { objects: 0, unreferenced: none, eligible: none, deleted: none, skipped: null, ...patch };
}

function report(
  patch: Partial<Record<(typeof STORAGE_RECLAIM_CATEGORIES)[number], StorageReclaimCategoryReport>>
): StorageReclaimReport {
  const categories = Object.fromEntries(
    STORAGE_RECLAIM_CATEGORIES.map((c) => [c, category({ skipped: 'not_reclaimed' })])
  ) as StorageReclaimReport['categories'];
  return {
    startedAt: 1_000,
    finishedAt: 2_000,
    mode: 'report',
    stopped: null,
    categories: { ...categories, ...patch },
  };
}

describe('reclaimView', () => {
  it('FE-ADMIN-STOR-RECLAIM-001: no state reads as deletion off and never checked', () => {
    expect(reclaimView(null)).toEqual({
      deleteEnabled: false,
      checkedAt: null,
      stopped: false,
      freeable: none,
      waiting: none,
      deleted: none,
      lines: [],
    });
  });

  it('FE-ADMIN-STOR-RECLAIM-002: freeable is what is a week old, waiting what is younger, summed over categories', () => {
    const view = reclaimView({
      deleteEnabled: true,
      lastRun: report({
        covers: category({
          objects: 40,
          unreferenced: { objects: 5, bytes: 500 },
          eligible: { objects: 3, bytes: 300 },
        }),
        places: category({ objects: 10, unreferenced: { objects: 1, bytes: 100 } }),
      }),
    });
    expect(view.deleteEnabled).toBe(true);
    expect(view.checkedAt).toBe(2_000);
    expect(view.freeable).toEqual({ objects: 3, bytes: 300 });
    expect(view.waiting).toEqual({ objects: 3, bytes: 300 });
    expect(view.lines.map((line) => line.category)).toEqual(['covers', 'places']);
  });

  it('FE-ADMIN-STOR-RECLAIM-003: what the run deleted is no longer freeable, and counts as freed', () => {
    const view = reclaimView({
      deleteEnabled: true,
      lastRun: report({
        files: category({
          unreferenced: { objects: 2, bytes: 20 },
          eligible: { objects: 2, bytes: 20 },
          deleted: { objects: 2, bytes: 20 },
        }),
      }),
    });
    expect(view.freeable).toEqual(none);
    expect(view.deleted).toEqual({ objects: 2, bytes: 20 });
    expect(view.lines).toEqual([]);
  });

  it('FE-ADMIN-STOR-RECLAIM-004: a skipped category shows its reason and counts toward nothing, one never reclaimed shows nothing', () => {
    const view = reclaimView({
      deleteEnabled: false,
      lastRun: report({
        avatars: category({ skipped: 'too_many_unreferenced', unreferenced: { objects: 9, bytes: 9 } }),
      }),
    });
    expect(view.lines).toEqual([
      { category: 'avatars', freeable: none, waiting: none, skipped: 'too_many_unreferenced' },
    ]);
    expect(view.waiting).toEqual(none);
    expect(view.lines.some((line) => line.category === 'backups')).toBe(false);
  });

  it('FE-ADMIN-STOR-RECLAIM-005: a check stopped by a restore says so', () => {
    expect(
      reclaimView({ deleteEnabled: false, lastRun: { ...report({}), stopped: 'database_reopened' } }).stopped
    ).toBe(true);
  });
});
