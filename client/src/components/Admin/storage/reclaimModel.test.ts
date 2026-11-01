// FE-ADMIN-STOR-RECLAIM-001 to -007: the reclaim report as both storage panels show it.
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimCategoryReport, type StorageReclaimReport } from '@trek/shared';

import { reclaimView } from './reclaimModel';

const none = { objects: 0, bytes: 0 };

function category(patch: Partial<StorageReclaimCategoryReport> = {}): StorageReclaimCategoryReport {
  return {
    objects: 0,
    unreferenced: none,
    eligible: none,
    deleted: none,
    confirmationRequired: false,
    skipped: null,
    ...patch,
  };
}

function report(
  patch: Partial<Record<(typeof STORAGE_RECLAIM_CATEGORIES)[number], StorageReclaimCategoryReport>>,
  mode: StorageReclaimReport['mode'] = 'report'
): StorageReclaimReport {
  const categories = Object.fromEntries(
    STORAGE_RECLAIM_CATEGORIES.map((c) => [c, category({ skipped: 'not_reclaimed' })])
  ) as StorageReclaimReport['categories'];
  return { startedAt: 1_000, finishedAt: 2_000, mode, stopped: null, categories: { ...categories, ...patch } };
}

describe('reclaimView', () => {
  it('FE-ADMIN-STOR-RECLAIM-001: no state reads as deletion off, not running and never checked', () => {
    expect(reclaimView(null)).toEqual({
      deleteEnabled: false,
      running: false,
      checkedAt: null,
      stopped: null,
      freeable: none,
      waiting: none,
      freed: none,
      freedAt: null,
      lines: [],
    });
  });

  it('FE-ADMIN-STOR-RECLAIM-002: freeable is what is a week old, waiting what is younger, summed over categories', () => {
    const view = reclaimView({
      deleteEnabled: true,
      running: false,
      lastDeleteRun: null,
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

  it('FE-ADMIN-STOR-RECLAIM-003: freed comes from the last run with deletion on, which a check on demand does not replace', () => {
    const deleting = report(
      {
        files: category({
          unreferenced: { objects: 2, bytes: 20 },
          eligible: { objects: 2, bytes: 20 },
          deleted: { objects: 2, bytes: 20 },
        }),
      },
      'delete'
    );
    const view = reclaimView({
      deleteEnabled: true,
      running: false,
      lastDeleteRun: { ...deleting, finishedAt: 900 },
      lastRun: report({}),
    });
    expect(view.freed).toEqual({ objects: 2, bytes: 20 });
    expect(view.freedAt).toBe(900);
    expect(view.freeable).toEqual(none);
    expect(view.lines).toEqual([]);
  });

  it('FE-ADMIN-STOR-RECLAIM-004: a skipped category shows its reason and counts toward nothing, one never reclaimed shows nothing', () => {
    const view = reclaimView({
      deleteEnabled: false,
      running: false,
      lastDeleteRun: null,
      lastRun: report({ avatars: category({ skipped: 'foreign_install', unreferenced: { objects: 9, bytes: 9 } }) }),
    });
    expect(view.lines).toEqual([
      {
        category: 'avatars',
        freeable: none,
        waiting: none,
        confirmationRequired: false,
        unreferenced: 9,
        skipped: 'foreign_install',
      },
    ]);
    expect(view.waiting).toEqual(none);
    expect(view.lines.some((line) => line.category === 'backups')).toBe(false);
  });

  it('FE-ADMIN-STOR-RECLAIM-005: a pass that stopped says why, and a category it stopped in keeps its partial figures', () => {
    const view = reclaimView({
      deleteEnabled: false,
      running: false,
      lastDeleteRun: null,
      lastRun: {
        ...report({ covers: category({ skipped: 'interrupted', unreferenced: { objects: 4, bytes: 40 } }) }),
        stopped: 'failed',
      },
    });
    expect(view.stopped).toBe('failed');
    expect(view.waiting).toEqual({ objects: 4, bytes: 40 });
    expect(view.lines[0]).toMatchObject({ category: 'covers', skipped: 'interrupted' });
  });

  it('FE-ADMIN-STOR-RECLAIM-006: a category waiting for a confirmation shows even with nothing old enough yet', () => {
    const view = reclaimView({
      deleteEnabled: true,
      running: false,
      lastDeleteRun: null,
      lastRun: report({ places: category({ objects: 10, confirmationRequired: true }) }),
    });
    expect(view.lines).toEqual([
      { category: 'places', freeable: none, waiting: none, confirmationRequired: true, unreferenced: 0, skipped: null },
    ]);
  });

  it('FE-ADMIN-STOR-RECLAIM-007: a running check reads as running', () => {
    expect(reclaimView({ deleteEnabled: false, running: true, lastRun: null, lastDeleteRun: null }).running).toBe(true);
  });
});
