/**
 * The storage reclaim pass (#2924) over a real StorageModule: a real registry
 * and LocalDriver on temp folders, the marks table in the snapshot db, and
 * fake reference sources standing in for the owner domains. The pass marks
 * first, deletes a week later only with the switch on and only after asking
 * every source about the single key again; every brake skips a category and
 * starts its marks over. RCLS-001 to RCLS-024.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { StorageReclaimMarks } from '../../../../src/db/entities/StorageReclaimMarks.entity';
import { dbNow } from '../../../../src/db/types';
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { logError } from '../../../../src/nest/audit/audit-log.logger';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { DatabaseLifecycle } from '../../../../src/nest/database/database-lifecycle.service';
import { StorageAdminService } from '../../../../src/nest/storage/storage-admin.service';
import { StorageJobsService } from '../../../../src/nest/storage/storage-jobs.service';
import { StorageReclaimRegistryService } from '../../../../src/nest/storage/storage-reclaim-registry.service';
import { StorageReclaimService } from '../../../../src/nest/storage/storage-reclaim.service';
import {
  STORAGE_RECLAIMABLE_CATEGORIES,
  STORAGE_REFERENCE_SOURCE_IDS,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from '../../../../src/nest/storage/storage-reclaim.types';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows } from '../../../helpers/factories/rows';
import { readAppSetting, setAppSetting } from '../../../helpers/factories/settings';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;
const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let uploadsRoot: string;
let backupsRoot: string;
let reclaim: StorageReclaimService;
let storage: StorageService;
let references: StorageReclaimRegistryService;
let reopen: () => Promise<void>;
/** What the fake sources still name, per category. */
let named: Map<ServedCategory, Set<string>>;
/** Called on every question a source is asked, before it answers. */
let onAsk: ((category: ServedCategory, keys: readonly string[]) => void | Promise<void>) | null;

/** The keys the fake sources name in `category`, created empty on first use. */
function namedIn(category: ServedCategory): Set<string> {
  let set = named.get(category);
  if (!set) {
    set = new Set<string>();
    named.set(category, set);
  }
  return set;
}

function fakeSource(id: StorageReferenceSourceId): StorageReferenceSource {
  const categories: readonly ServedCategory[] =
    id === 'auth' ? ['avatars'] : id === 'files' ? ['files'] : STORAGE_RECLAIMABLE_CATEGORIES;
  return {
    id,
    claims: categories.map((category): StorageReferenceClaim => ({ category, prefix: '' })),
    async referenced(category, keys) {
      await onAsk?.(category, keys);
      const set = named.get(category) ?? new Set<string>();
      return new Set(keys.filter((key) => set.has(key)));
    },
  };
}

function backends(extra: unknown[] = []): string {
  return JSON.stringify([
    { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
    { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
    ...extra,
  ]);
}

async function put(category: ServedCategory, key: string, body = '12345'): Promise<void> {
  await storage.put(category, key, Readable.from(body));
}

function objectPath(category: string, key: string): string {
  return path.join(uploadsRoot, category, key);
}

/** The orphans plus `kept` named covers, so the orphans stay under the brake's fifth. */
async function seedCovers(orphans: string[], kept = 4): Promise<void> {
  const keptKeys = Array.from({ length: kept }, (_unused, i) => `kept-${i}.jpg`);
  await Promise.all([...orphans, ...keptKeys].map((key) => put('covers', key)));
  named.set('covers', new Set(keptKeys));
}

async function marksOf(category: string): Promise<Array<{ key: string; first_seen_at: string }>> {
  const rows = await orm.repo(StorageReclaimMarks).marksOf(category);
  return rows
    .map((row) => ({ key: row.key, first_seen_at: row.first_seen_at }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

beforeAll(async () => {
  uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-reclaim-uploads-'));
  backupsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-reclaim-backups-'));
  orm = await createTestOrm(db);
  await setAppSetting(orm, 'storage.backends', backends());
  t = await createTestModule({
    db,
    imports: [StorageModule],
    init: true,
    overrides: [
      {
        provide: DatabaseLifecycle,
        useValue: {
          onReopened: (listener: () => Promise<void>) => {
            reopen = listener;
          },
        },
      },
    ],
  });
  reclaim = t.get(StorageReclaimService);
  storage = t.get(StorageService);
  references = t.get(StorageReclaimRegistryService);
  for (const id of STORAGE_REFERENCE_SOURCE_IDS) references.register(fakeSource(id));
});

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.mocked(logError).mockClear();
  for (const entry of fs.readdirSync(uploadsRoot)) {
    if (entry !== '.tmp') fs.rmSync(path.join(uploadsRoot, entry), { recursive: true, force: true });
  }
  await deleteRows(orm, StorageReclaimMarks);
  await deleteRows(orm, AppSettings, { key: { $like: 'storage.reclaim%' } });
  named = new Map();
  onAsk = null;
});

afterAll(async () => {
  await t.close();
  await orm.close();
  db.close();
  fs.rmSync(uploadsRoot, { recursive: true, force: true });
  fs.rmSync(backupsRoot, { recursive: true, force: true });
});

const T0 = new Date(Date.now() + 2 * DAY);
const WEEK_LATER = new Date(T0.getTime() + 8 * DAY);

describe('StorageReclaimService: mark, then sweep', () => {
  it('RCLS-001: a first pass only reports and marks; the report is persisted and the state carries it', async () => {
    await seedCovers(['orphan.jpg']);
    const report = await reclaim.run({ now: T0 });
    expect(report.mode).toBe('report');
    expect(report.stopped).toBeNull();
    expect(report.categories.covers).toEqual({
      objects: 5,
      unreferenced: { objects: 1, bytes: 5 },
      eligible: { objects: 0, bytes: 0 },
      deleted: { objects: 0, bytes: 0 },
      skipped: null,
    });
    expect(report.categories.files).toMatchObject({ objects: 0, skipped: null });
    for (const category of ['photos', 'photos-google', 'photos-trek', 'backups'] as const) {
      expect(report.categories[category].skipped).toBe('not_reclaimed');
    }
    expect(await marksOf('covers')).toEqual([{ key: 'orphan.jpg', first_seen_at: dbNow(T0) }]);
    expect(await reclaim.state()).toEqual({ deleteEnabled: false, lastRun: report });
    expect((await t.get(StorageAdminService).state()).reclaim).toEqual({ deleteEnabled: false, lastRun: report });
  });

  it('RCLS-002: with deletion on, a mark a week old goes through the facade and takes its mark along', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.setDeleteEnabled(true);
    const first = await reclaim.run({ now: T0 });
    expect(first.mode).toBe('delete');
    expect(first.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);

    const second = await reclaim.run({ now: WEEK_LATER });
    expect(second.categories.covers.eligible).toEqual({ objects: 1, bytes: 5 });
    expect(second.categories.covers.deleted).toEqual({ objects: 1, bytes: 5 });
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(false);
    expect(fs.existsSync(objectPath('covers', 'kept-0.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-003: a report-only pass deletes nothing even with deletion on', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: T0 });
    const report = await reclaim.run({ now: WEEK_LATER, reportOnly: true });
    expect(report.mode).toBe('report');
    expect(report.categories.covers.eligible.objects).toBe(1);
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
  });

  it('RCLS-004: an object named again loses its mark, and its week starts over once it is unnamed', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: T0 });
    namedIn('covers').add('orphan.jpg');
    const renamed = await reclaim.run({ now: new Date(T0.getTime() + DAY) });
    expect(renamed.categories.covers.unreferenced.objects).toBe(0);
    expect(await marksOf('covers')).toEqual([]);

    namedIn('covers').delete('orphan.jpg');
    const again = await reclaim.run({ now: WEEK_LATER });
    expect(again.categories.covers.eligible.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([{ key: 'orphan.jpg', first_seen_at: dbNow(WEEK_LATER) }]);
  });

  it('RCLS-005: the single-key re-check right before the delete keeps an object named in between', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: T0 });
    onAsk = (category, keys) => {
      const [only] = keys;
      if (category === 'covers' && keys.length === 1 && only !== undefined) namedIn('covers').add(only);
    };
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.eligible.objects).toBe(1);
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-006: young objects, a missing modification time and nested subtrees are never judged', async () => {
    await put('covers', 'young.jpg');
    await put('covers', 'zero.jpg');
    await put('files', 'assistant/attached.pdf');
    await put('journey', 'thumbs/abcdef.jpg');
    const now = T0;
    fs.utimesSync(
      objectPath('covers', 'young.jpg'),
      new Date(now.getTime() - 60_000),
      new Date(now.getTime() - 60_000),
    );
    fs.utimesSync(objectPath('covers', 'zero.jpg'), 0, 0);
    const report = await reclaim.run({ now });
    expect(report.categories.covers).toMatchObject({ objects: 2, unreferenced: { objects: 0, bytes: 0 } });
    expect(report.categories.files.objects).toBe(0);
    expect(report.categories.journey.objects).toBe(0);
    expect(await marksOf('covers')).toEqual([]);
  });
});

describe('StorageReclaimService: brakes', () => {
  it('RCLS-007: more than a fifth unreferenced skips the category, deletes nothing and clears its marks', async () => {
    await seedCovers(['o1.jpg', 'o2.jpg'], 1);
    await orm.repo(StorageReclaimMarks).insertMissing('covers', [{ key: 'o1.jpg', size: 5 }], dbNow(new Date(0)));
    await reclaim.setDeleteEnabled(true);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers).toEqual({
      objects: 3,
      unreferenced: { objects: 2, bytes: 10 },
      eligible: { objects: 0, bytes: 0 },
      deleted: { objects: 0, bytes: 0 },
      skipped: 'too_many_unreferenced',
    });
    expect(fs.existsSync(objectPath('covers', 'o1.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-008: a category whose required source is missing, or answers for a part only, is skipped', async () => {
    await seedCovers(['orphan.jpg']);
    const all = [...references.sources()];
    const withoutAuth = all.filter((source) => source.id !== 'auth');
    vi.spyOn(references, 'sources').mockReturnValue(withoutAuth);
    let report = await reclaim.run({ now: T0 });
    expect(report.categories.avatars.skipped).toBe('sources_missing');
    expect(report.categories.covers.skipped).toBeNull();

    const partialTrips: StorageReferenceSource = {
      id: 'trips',
      claims: [{ category: 'covers', prefix: 'sub/' }],
      referenced: async () => new Set<string>(),
    };
    vi.spyOn(references, 'sources').mockReturnValue([...all.filter((source) => source.id !== 'trips'), partialTrips]);
    report = await reclaim.run({ now: T0 });
    expect(report.categories.covers.skipped).toBe('sources_missing');
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-009: a source answering for a subtree only is not asked about root keys', async () => {
    await seedCovers(['orphan.jpg']);
    const subtree = vi.fn(async () => new Set<string>());
    vi.spyOn(references, 'sources').mockReturnValue([
      ...references.sources(),
      { id: 'trips', claims: [{ category: 'covers', prefix: 'sub/' }], referenced: subtree },
    ]);
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers.unreferenced.objects).toBe(1);
    expect(subtree).not.toHaveBeenCalled();
  });

  it('RCLS-010: a category whose location holds another category is skipped', async () => {
    await seedCovers(['orphan.jpg']);
    const nestedRoot = path.join(uploadsRoot, 'covers');
    await setAppSetting(
      orm,
      'storage.backends',
      backends([{ name: 'nested', type: 'local', options: { root: nestedRoot } }]),
    );
    await setAppSetting(orm, 'storage.categories', JSON.stringify({ 'photos-trek': 'nested' }));
    await storage.reloadConfig();
    try {
      const report = await reclaim.run({ now: T0 });
      expect(report.categories.covers.skipped).toBe('shared_location');
      expect(report.categories.files.skipped).toBeNull();
    } finally {
      await setAppSetting(orm, 'storage.backends', backends());
      await deleteRows(orm, AppSettings, { key: 'storage.categories' });
      await storage.reloadConfig();
    }
  });

  it('RCLS-011: a listing that fails skips the category and clears its marks', async () => {
    await orm.repo(StorageReclaimMarks).insertMissing('covers', [{ key: 'x.jpg', size: 1 }], dbNow(new Date(0)));
    vi.spyOn(storage, 'list').mockImplementation(() => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('backend down')) }),
    }));
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers.skipped).toBe('list_failed');
    expect(report.categories.files.skipped).toBe('list_failed');
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('backend down'));
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-012: a source that fails skips the category, never reads it as unreferenced', async () => {
    await seedCovers(['orphan.jpg']);
    onAsk = (category) => {
      if (category === 'covers') throw new Error('trips table locked');
    };
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers).toMatchObject({ objects: 5, skipped: 'source_failed' });
    expect(report.categories.places.skipped).toBeNull();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('trips table locked'));
  });

  it('RCLS-013: a pass refuses on a demo instance and while another storage job holds the slot', async () => {
    const demo = vi.spyOn(t.get(RuntimeEnvService), 'isDemoMode').mockReturnValue(true);
    await expect(reclaim.run()).rejects.toMatchObject({ code: 'reclaim_demo' });
    demo.mockRestore();

    const jobs = t.get(StorageJobsService);
    expect(jobs.claimExclusive('a test')).toBe(true);
    try {
      const refusal = await reclaim.run().catch((err: unknown) => err);
      expect(refusal).toBeInstanceOf(DomainError);
      expect(refusal).toMatchObject({ code: 'reclaim_busy' });
      expect((refusal as DomainError).getStatus()).toBe(409);
    } finally {
      jobs.releaseExclusive('a test');
    }
  });

  it('RCLS-014: while a pass holds the slot, a migration is refused with its name, and the slot is free after', async () => {
    const jobs = t.get(StorageJobsService);
    let refusal: unknown = null;
    onAsk = async (category) => {
      if (category !== 'covers' || refusal) return;
      refusal = await jobs.startMigration('covers', 'backups-local').catch((err: unknown) => err);
    };
    await seedCovers(['orphan.jpg']);
    await reclaim.run({ now: T0 });
    expect(String(refusal)).toContain('a storage reclaim is running, one storage job at a time');
    expect(jobs.claimExclusive('after')).toBe(true);
    jobs.releaseExclusive('after');
  });

  it('RCLS-015: a database reopened mid-pass stops it before anything else is judged', async () => {
    await seedCovers(['orphan.jpg']);
    await put('places', 'p.jpg');
    let reopened = false;
    onAsk = async (category) => {
      if (category === 'covers' && !reopened) {
        reopened = true;
        await reopen();
      }
    };
    const report = await reclaim.run({ now: T0 });
    expect(report.stopped).toBe('database_reopened');
    expect(report.categories.covers.unreferenced.objects).toBe(0);
    expect(report.categories.places.objects).toBe(0);
    expect(await marksOf('covers')).toEqual([]);
    expect((await reclaim.state()).lastRun?.stopped).toBe('database_reopened');
  });
});

describe('StorageReclaimService: the delete itself', () => {
  async function markedWeekOld(orphans: string[], kept = 4): Promise<void> {
    await seedCovers(orphans, kept);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: T0 });
  }

  it('RCLS-016: a re-check that fails keeps the object', async () => {
    await markedWeekOld(['orphan.jpg']);
    onAsk = (_category, keys) => {
      if (keys.length === 1) throw new Error('lookup timed out');
    };
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('lookup timed out'));
  });

  it('RCLS-017: an object gone or written again since it was judged is left and its mark dropped', async () => {
    await markedWeekOld(['gone.jpg', 'fresh.jpg'], 8);
    // Changed between the listing and the delete: the batch looks at each object again first.
    const listed = storage.list.bind(storage);
    vi.spyOn(storage, 'list').mockImplementation(async function* (category, prefix) {
      yield* listed(category, prefix);
      if (category !== 'covers') return;
      fs.rmSync(objectPath('covers', 'gone.jpg'), { force: true });
      fs.utimesSync(objectPath('covers', 'fresh.jpg'), WEEK_LATER, WEEK_LATER);
    });
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.eligible.objects).toBe(2);
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'fresh.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-024: the re-check before the delete asks about the whole batch at once, not once per object', async () => {
    await markedWeekOld(['a.jpg', 'b.jpg', 'c.jpg'], 12);
    const asked: string[][] = [];
    onAsk = (category, keys) => {
      if (category === 'covers') asked.push([...keys].sort());
    };
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(3);
    // Per source: the listing's question, then one re-check for the three.
    const rechecks = asked.filter((keys) => keys.length === 3 && keys.every((key) => !key.startsWith('kept-')));
    expect(rechecks.length).toBe(STORAGE_REFERENCE_SOURCE_IDS.filter((id) => id !== 'auth' && id !== 'files').length);
    expect(asked.some((keys) => keys.length === 1)).toBe(false);
  });

  it('RCLS-018: a delete that fails keeps the mark for the next pass', async () => {
    await markedWeekOld(['orphan.jpg']);
    vi.spyOn(storage, 'delete').mockRejectedValue(new Error('permission denied'));
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(await marksOf('covers')).toEqual([{ key: 'orphan.jpg', first_seen_at: dbNow(T0) }]);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  });

  it('RCLS-019: an object the facade keeps on delete is not counted as reclaimed', async () => {
    await markedWeekOld(['orphan.jpg']);
    vi.spyOn(storage, 'keepsOnDelete').mockReturnValue(true);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
  });
});

describe('StorageReclaimService: the switch and the stored report', () => {
  it('RCLS-020: the switch is stored as true or false and only the exact true deletes', async () => {
    expect((await reclaim.setDeleteEnabled(true)).deleteEnabled).toBe(true);
    expect(await readAppSetting(orm, 'storage.reclaim_delete')).toBe('true');
    expect((await reclaim.setDeleteEnabled(false)).deleteEnabled).toBe(false);
    await setAppSetting(orm, 'storage.reclaim_delete', 'yes');
    expect((await reclaim.state()).deleteEnabled).toBe(false);
  });

  it('RCLS-021: a stored report that no longer parses reads as never run', async () => {
    await setAppSetting(orm, 'storage.reclaim_report', '{not json');
    expect((await reclaim.state()).lastRun).toBeNull();
    await setAppSetting(orm, 'storage.reclaim_report', JSON.stringify({ startedAt: 'yesterday' }));
    expect((await reclaim.state()).lastRun).toBeNull();
  });

  it('RCLS-022: a restore that begins mid-pass stops it before the delete, and waits for it to let go', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: T0 });
    const jobs = t.get(StorageJobsService);
    let restoreStarted: Promise<void> | null = null;
    let restoreAsked = false;
    let restoreWent = false;
    onAsk = (_category, keys) => {
      if (keys.length !== 1 || restoreAsked) return;
      restoreAsked = true;
      restoreStarted = jobs.beginRestore().then(() => {
        restoreWent = true;
      });
    };
    try {
      const report = await reclaim.run({ now: WEEK_LATER });
      expect(report.stopped).toBe('database_reopened');
      expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
      expect(restoreAsked).toBe(true);
      await restoreStarted;
      expect(restoreWent).toBe(true);
    } finally {
      jobs.endRestore();
    }
  });

  it('RCLS-023: a pass refuses to start while a restore runs, and starts again once it ended', async () => {
    const jobs = t.get(StorageJobsService);
    await jobs.beginRestore();
    try {
      await expect(reclaim.run({ now: T0 })).rejects.toMatchObject({ code: 'reclaim_busy' });
    } finally {
      jobs.endRestore();
    }
    expect(jobs.restoreRunning).toBe(false);
    expect((await reclaim.run({ now: T0 })).stopped).toBeNull();
  });
});
