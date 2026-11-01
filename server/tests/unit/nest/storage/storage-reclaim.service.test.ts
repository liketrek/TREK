/**
 * The storage reclaim pass (#2924) over a real StorageModule: a real registry
 * and LocalDriver on temp folders, the marks table in the snapshot db, and
 * fake reference sources standing in for the owner domains. The pass marks
 * first, deletes a week later only with the switch on and only after asking
 * every source about its batch again. A skip keeps the marks; a share over a
 * fifth waits for an admin's confirmation; an owner marker of another install
 * keeps its hands off; a restore resets the switch, the marks and the reports
 * but keeps this install's id. RCLS-001 to RCLS-036.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../../../src/db/entities/AuditLog.entity';
import { StorageReclaimMarks } from '../../../../src/db/entities/StorageReclaimMarks.entity';
import { StorageReclaimMarksRepository } from '../../../../src/db/repositories/StorageReclaimMarks.repository';
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
  storageOwnerMarkerKey,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from '../../../../src/nest/storage/storage-reclaim.types';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, findRow } from '../../../helpers/factories/rows';
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
let jobs: StorageJobsService;
let references: StorageReclaimRegistryService;
let reopen: () => Promise<void>;
let installId: string;
/** What the fake sources still name, per category. */
let named: Map<ServedCategory, Set<string>>;
/** Called on every question a source is asked, before it answers: `keys` is null for a whole-category read. */
let onAsk: ((category: ServedCategory, keys: readonly string[] | null) => void | Promise<void>) | null;

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
    async namedKeys(category) {
      await onAsk?.(category, null);
      return new Set([...(named.get(category) ?? [])].map((key) => key.toLowerCase()));
    },
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

/** The orphans plus `kept` named covers, so the orphans stay under a fifth. */
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

/** What a synchronous call threw, or null. */
function thrownBy(call: () => unknown): unknown {
  try {
    call();
  } catch (err) {
    return err;
  }
  return null;
}

async function markWeekOld(category: ServedCategory, keys: string[]): Promise<void> {
  await orm.repo(StorageReclaimMarks).insertMissing(
    category,
    keys.map((key) => ({ key, size: 5 })),
    dbNow(new Date(0)),
  );
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
  jobs = t.get(StorageJobsService);
  references = t.get(StorageReclaimRegistryService);
  for (const id of STORAGE_REFERENCE_SOURCE_IDS) references.register(fakeSource(id));
  installId = (await readAppSetting(orm, 'install_id')) ?? '';
});

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.mocked(logError).mockClear();
  for (const entry of fs.readdirSync(uploadsRoot)) {
    if (entry !== '.tmp') fs.rmSync(path.join(uploadsRoot, entry), { recursive: true, force: true });
  }
  await deleteRows(orm, StorageReclaimMarks);
  await deleteRows(orm, AppSettings, { key: { $like: 'storage.reclaim%' } });
  await deleteRows(orm, AuditLog);
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

async function markedWeekOld(orphans: string[], kept = 4): Promise<void> {
  await seedCovers(orphans, kept);
  await reclaim.setDeleteEnabled(true);
  await reclaim.run({ now: T0 });
}

describe('StorageReclaimService: mark, then sweep', () => {
  it('RCLS-001: a first pass reports and marks; the report is persisted and both states carry it', async () => {
    expect(installId).toMatch(/^[0-9a-f-]{36}$/);
    await seedCovers(['orphan.jpg']);
    const report = await reclaim.run({ now: T0 });
    expect(report.mode).toBe('report');
    expect(report.stopped).toBeNull();
    expect(report.categories.covers).toEqual({
      objects: 5,
      unreferenced: { objects: 1, bytes: 5 },
      eligible: { objects: 0, bytes: 0 },
      deleted: { objects: 0, bytes: 0 },
      confirmationRequired: false,
      skipped: null,
    });
    expect(report.categories.files).toMatchObject({ objects: 0, skipped: null });
    for (const category of ['photos', 'photos-google', 'photos-trek', 'backups'] as const) {
      expect(report.categories[category].skipped).toBe('not_reclaimed');
    }
    expect(await marksOf('covers')).toEqual([{ key: 'orphan.jpg', first_seen_at: dbNow(T0) }]);
    const expected = { deleteEnabled: false, running: false, lastRun: report, lastDeleteRun: null };
    expect(await reclaim.state()).toEqual(expected);
    expect((await t.get(StorageAdminService).state()).reclaim).toEqual(expected);
  });

  it('RCLS-002: with deletion on, a mark a week old goes through the facade, takes its mark and is audited', async () => {
    await markedWeekOld(['orphan.jpg']);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);

    const second = await reclaim.run({ now: WEEK_LATER });
    expect(second.mode).toBe('delete');
    expect(second.categories.covers.eligible).toEqual({ objects: 1, bytes: 5 });
    expect(second.categories.covers.deleted).toEqual({ objects: 1, bytes: 5 });
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(false);
    expect(fs.existsSync(objectPath('covers', 'kept-0.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([]);
    expect((await reclaim.state()).lastDeleteRun).toEqual(second);
    const audit = await findRow(orm, AuditLog, { action: 'storage.reclaim_deleted' });
    expect(audit?.user_id ?? null).toBeNull();
    expect(JSON.parse(String(audit?.details))).toEqual({ deleted: 1, bytes: 5, categories: { covers: 1 } });
  });

  it('RCLS-003: a report-only pass deletes nothing even with deletion on, and leaves the last deleting report', async () => {
    await markedWeekOld(['orphan.jpg']);
    const deleting = (await reclaim.state()).lastDeleteRun;
    const report = await reclaim.run({ now: WEEK_LATER, reportOnly: true });
    expect(report.mode).toBe('report');
    expect(report.categories.covers.eligible.objects).toBe(1);
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    const state = await reclaim.state();
    expect(state.lastRun).toEqual(report);
    expect(state.lastDeleteRun).toEqual(deleting);
    expect(await countRows(orm, AuditLog, { action: 'storage.reclaim_deleted' })).toBe(0);
  });

  it('RCLS-004: an object named again loses its mark, and its week starts over once it is unnamed', async () => {
    await markedWeekOld(['orphan.jpg']);
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

  it('RCLS-005: the fresh re-check right before the delete keeps an object named in between', async () => {
    await markedWeekOld(['orphan.jpg']);
    onAsk = (category, keys) => {
      if (category === 'covers' && keys !== null) namedIn('covers').add('orphan.jpg');
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
    fs.utimesSync(objectPath('covers', 'young.jpg'), new Date(T0.getTime() - 60_000), new Date(T0.getTime() - 60_000));
    fs.utimesSync(objectPath('covers', 'zero.jpg'), 0, 0);
    const listed = vi.spyOn(storage, 'list');
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers).toMatchObject({ objects: 2, unreferenced: { objects: 0, bytes: 0 } });
    expect(report.categories.files.objects).toBe(0);
    expect(report.categories.journey.objects).toBe(0);
    expect(await marksOf('covers')).toEqual([]);
    // Only a category's root is listed: the subtrees with sweeps of their own are never walked.
    expect(listed).toHaveBeenCalledWith('journey', '', { shallow: true });
  });

  it('RCLS-007: the owner marker is written into each category judged, never judged itself, and never counted', async () => {
    await seedCovers(['orphan.jpg']);
    await reclaim.run({ now: T0 });
    const marker = storageOwnerMarkerKey(installId);
    for (const category of STORAGE_RECLAIMABLE_CATEGORIES) {
      expect(fs.readFileSync(objectPath(category, marker), 'utf8')).toBe(installId);
    }
    fs.utimesSync(objectPath('covers', marker), new Date(0), new Date(0));
    const again = await reclaim.run({ now: WEEK_LATER });
    expect(again.categories.covers.objects).toBe(5);
    expect((await marksOf('covers')).map((mark) => mark.key)).toEqual(['orphan.jpg']);
  });
});

describe('StorageReclaimService: a large unreferenced share waits for the admin', () => {
  it('RCLS-008: more than a fifth unreferenced marks and reports, deletes nothing, and keeps the marks', async () => {
    await seedCovers(['o1.jpg', 'o2.jpg'], 1);
    await markWeekOld('covers', ['o1.jpg', 'o2.jpg']);
    await reclaim.setDeleteEnabled(true);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers).toEqual({
      objects: 3,
      unreferenced: { objects: 2, bytes: 10 },
      eligible: { objects: 2, bytes: 10 },
      deleted: { objects: 0, bytes: 0 },
      confirmationRequired: true,
      skipped: null,
    });
    expect(fs.existsSync(objectPath('covers', 'o1.jpg'))).toBe(true);
    expect(await marksOf('covers')).toEqual([
      { key: 'o1.jpg', first_seen_at: dbNow(new Date(0)) },
      { key: 'o2.jpg', first_seen_at: dbNow(new Date(0)) },
    ]);
  });

  it('RCLS-009: an admin confirmation of the shown count lets the next pass delete; a larger share waits again', async () => {
    await seedCovers(['o1.jpg', 'o2.jpg'], 1);
    await markWeekOld('covers', ['o1.jpg', 'o2.jpg']);
    await reclaim.setDeleteEnabled(true);
    await reclaim.run({ now: WEEK_LATER });
    const confirmed = await reclaim.confirm('covers');
    expect(confirmed.lastRun?.categories.covers.confirmationRequired).toBe(true);
    expect(JSON.parse(String(await readAppSetting(orm, 'storage.reclaim_confirmed')))).toEqual({
      installId,
      counts: { covers: 2 },
    });

    await put('covers', 'o3.jpg');
    await put('covers', 'o4.jpg');
    await put('covers', 'o5.jpg');
    await markWeekOld('covers', ['o3.jpg', 'o4.jpg', 'o5.jpg']);
    const bigger = await reclaim.run({ now: WEEK_LATER });
    expect(bigger.categories.covers.confirmationRequired).toBe(true);
    expect(bigger.categories.covers.deleted.objects).toBe(0);

    await reclaim.confirm('covers');
    const after = await reclaim.run({ now: WEEK_LATER });
    expect(after.categories.covers).toMatchObject({ confirmationRequired: false, deleted: { objects: 5, bytes: 25 } });
    expect(fs.existsSync(objectPath('covers', 'kept-0.jpg'))).toBe(true);
  });

  it('RCLS-010: a confirmation is refused with a code when the last report holds nothing waiting', async () => {
    await expect(reclaim.confirm('covers')).rejects.toMatchObject({ code: 'reclaim_nothing_to_confirm' });
    await seedCovers(['orphan.jpg']);
    await reclaim.run({ now: T0 });
    const refusal = await reclaim.confirm('covers').catch((err: unknown) => err);
    expect(refusal).toBeInstanceOf(DomainError);
    expect((refusal as DomainError).getStatus()).toBe(409);
    expect((refusal as DomainError).getResponse()).toEqual({
      error: 'nothing in this category waits for a confirmation',
      code: 'reclaim_nothing_to_confirm',
    });
  });

  it('RCLS-011: a confirmation another install wrote counts for nothing here', async () => {
    await seedCovers(['o1.jpg', 'o2.jpg'], 1);
    await markWeekOld('covers', ['o1.jpg', 'o2.jpg']);
    await setAppSetting(
      orm,
      'storage.reclaim_confirmed',
      JSON.stringify({ installId: '11111111-2222-4333-8444-555555555555', counts: { covers: 99 } }),
    );
    await reclaim.setDeleteEnabled(true);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.confirmationRequired).toBe(true);
    expect(report.categories.covers.deleted.objects).toBe(0);
  });
});

describe('StorageReclaimService: categories it may not judge', () => {
  it('RCLS-012: a category whose required source is missing, or answers for a part only, is skipped with its marks', async () => {
    await seedCovers(['orphan.jpg']);
    await markWeekOld('covers', ['orphan.jpg']);
    const all = [...references.sources()];
    vi.spyOn(references, 'sources').mockReturnValue(all.filter((source) => source.id !== 'auth'));
    let report = await reclaim.run({ now: T0 });
    expect(report.categories.avatars.skipped).toBe('sources_missing');
    expect(report.categories.covers.skipped).toBeNull();

    const partialTrips: StorageReferenceSource = {
      id: 'trips',
      claims: [{ category: 'covers', prefix: 'sub/' }],
      namedKeys: async () => new Set<string>(),
      referenced: async () => new Set<string>(),
    };
    vi.spyOn(references, 'sources').mockReturnValue([...all.filter((source) => source.id !== 'trips'), partialTrips]);
    report = await reclaim.run({ now: T0 });
    expect(report.categories.covers.skipped).toBe('sources_missing');
    expect((await marksOf('covers')).map((mark) => mark.key)).toEqual(['orphan.jpg']);
  });

  it('RCLS-013: a source answering for a subtree only is not asked about root keys before a delete', async () => {
    await markedWeekOld(['orphan.jpg']);
    const subtree = vi.fn(async () => new Set<string>());
    vi.spyOn(references, 'sources').mockReturnValue([
      ...references.sources(),
      {
        id: 'trips',
        claims: [{ category: 'covers', prefix: 'sub/' }],
        namedKeys: async () => new Set(),
        referenced: subtree,
      },
    ]);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(1);
    expect(subtree).not.toHaveBeenCalled();
  });

  it('RCLS-014: a category whose location holds another category is skipped with its marks', async () => {
    await seedCovers(['orphan.jpg']);
    await markWeekOld('covers', ['orphan.jpg']);
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
      expect(await marksOf('covers')).toHaveLength(1);
    } finally {
      await setAppSetting(orm, 'storage.backends', backends());
      await deleteRows(orm, AppSettings, { key: 'storage.categories' });
      await storage.reloadConfig();
    }
  });

  it('RCLS-015: another install marker in a category keeps this one off it, with its marks', async () => {
    await markedWeekOld(['orphan.jpg']);
    await put('covers', storageOwnerMarkerKey('99999999-8888-4777-8666-555555555555'), 'someone else');
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers).toMatchObject({ objects: 5, skipped: 'foreign_install' });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(report.categories.places.skipped).toBeNull();
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    expect(await marksOf('covers')).toHaveLength(1);
  });

  it('RCLS-016: an owner marker that cannot be written leaves the category unjudged as owner_unknown', async () => {
    await seedCovers(['orphan.jpg']);
    const realPut = storage.put.bind(storage);
    vi.spyOn(storage, 'put').mockImplementation(async (category, name, source, opts) => {
      if (name.startsWith('trek-owner-')) throw new Error('read-only volume');
      return realPut(category, name, source, opts);
    });
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers).toMatchObject({ objects: 5, skipped: 'owner_unknown' });
    expect(await marksOf('covers')).toEqual([]);
  });

  it('RCLS-017: a listing that fails skips the category for the night and keeps its marks', async () => {
    await markWeekOld('covers', ['x.jpg']);
    vi.spyOn(storage, 'list').mockImplementation(() => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(new Error('backend down')) }),
    }));
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers.skipped).toBe('list_failed');
    expect(report.categories.files.skipped).toBe('list_failed');
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('backend down'));
    expect(await marksOf('covers')).toEqual([{ key: 'x.jpg', first_seen_at: dbNow(new Date(0)) }]);
  });

  it('RCLS-018: a source that fails skips the category, never reads it as unreferenced, and keeps its marks', async () => {
    await seedCovers(['orphan.jpg']);
    await markWeekOld('covers', ['orphan.jpg']);
    onAsk = (category) => {
      if (category === 'covers') throw new Error('trips table locked');
    };
    const report = await reclaim.run({ now: T0 });
    expect(report.categories.covers).toMatchObject({ objects: 5, skipped: 'source_failed' });
    expect(report.categories.places.skipped).toBeNull();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('trips table locked'));
    expect(await marksOf('covers')).toHaveLength(1);
  });
});

describe('StorageReclaimService: when a pass runs at all', () => {
  it('RCLS-019: a pass refuses with a coded 409 on a demo instance and while another storage job holds the slot', async () => {
    const demo = vi.spyOn(t.get(RuntimeEnvService), 'isDemoMode').mockReturnValue(true);
    await expect(reclaim.run()).rejects.toMatchObject({ code: 'reclaim_demo' });
    expect(thrownBy(() => reclaim.start())).toMatchObject({ code: 'reclaim_demo' });
    demo.mockRestore();

    expect(jobs.claimExclusive('a test')).toBe(true);
    try {
      const refusal = await reclaim.run().catch((err: unknown) => err);
      expect(refusal).toBeInstanceOf(DomainError);
      expect((refusal as DomainError).getStatus()).toBe(409);
      expect((refusal as DomainError).getResponse()).toEqual({
        error: 'another storage job is running, one storage job at a time',
        code: 'reclaim_busy',
      });
    } finally {
      jobs.releaseExclusive('a test');
    }
  });

  it('RCLS-020: while a pass holds the slot, a migration is refused with its name, and the slot is free after', async () => {
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

  it('RCLS-021: start() runs a report-only pass in the background; the state says running until it lands', async () => {
    await markedWeekOld(['orphan.jpg']);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    onAsk = async () => gate;
    reclaim.start();
    expect((await reclaim.state()).running).toBe(true);
    expect(thrownBy(() => reclaim.start())).toMatchObject({ code: 'reclaim_busy' });
    release();
    await jobs.exclusiveIdle();
    const state = await reclaim.state();
    expect(state.running).toBe(false);
    expect(state.lastRun?.mode).toBe('report');
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
  });

  it('RCLS-022: a pass refuses to start while a restore runs, and starts again once it ended', async () => {
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

describe('StorageReclaimService: the delete itself', () => {
  it('RCLS-023: a re-check that fails keeps the object', async () => {
    await markedWeekOld(['orphan.jpg']);
    onAsk = (_category, keys) => {
      if (keys !== null) throw new Error('lookup timed out');
    };
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('lookup timed out'));
  });

  it('RCLS-024: an object gone or written again since it was judged is left and its mark dropped', async () => {
    await markedWeekOld(['gone.jpg', 'fresh.jpg'], 8);
    const listed = storage.list.bind(storage);
    vi.spyOn(storage, 'list').mockImplementation(async function* (category, prefix, opts) {
      yield* listed(category, prefix, opts);
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

  it('RCLS-025: the re-check before the delete asks about the whole batch at once, and the listing reads each source once', async () => {
    await markedWeekOld(['a.jpg', 'b.jpg', 'c.jpg'], 12);
    const asked: Array<string[] | null> = [];
    onAsk = (category, keys) => {
      if (category === 'covers') asked.push(keys === null ? null : [...keys].sort());
    };
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(3);
    const freeForm = STORAGE_REFERENCE_SOURCE_IDS.filter((id) => id !== 'auth' && id !== 'files').length;
    expect(asked.filter((keys) => keys === null)).toHaveLength(freeForm);
    expect(asked.filter((keys) => keys !== null)).toEqual(
      Array.from({ length: freeForm }, () => ['a.jpg', 'b.jpg', 'c.jpg']),
    );
  });

  it('RCLS-026: a delete that fails stops deleting in that category, keeps the mark and says why once', async () => {
    await markedWeekOld(['orphan.jpg']);
    vi.spyOn(storage, 'delete').mockRejectedValue(new Error('permission denied'));
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers).toMatchObject({ skipped: 'delete_failed', deleted: { objects: 0, bytes: 0 } });
    expect(report.categories.places.skipped).toBeNull();
    expect(await marksOf('covers')).toEqual([{ key: 'orphan.jpg', first_seen_at: dbNow(T0) }]);
    expect(vi.mocked(logError).mock.calls.filter(([line]) => String(line).includes('permission denied'))).toHaveLength(
      1,
    );
  });

  it('RCLS-027: a stat that fails on the backend stops the category the same way', async () => {
    await markedWeekOld(['orphan.jpg']);
    vi.spyOn(storage, 'stat').mockRejectedValue(new Error('503 SlowDown'));
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.skipped).toBe('delete_failed');
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
  });

  it('RCLS-028: an object the facade keeps on delete is not counted as reclaimed', async () => {
    await markedWeekOld(['orphan.jpg']);
    vi.spyOn(storage, 'keepsOnDelete').mockReturnValue(true);
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(0);
    expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
  });

  it('RCLS-029: deletion switched off mid-pass stops every later delete', async () => {
    await markedWeekOld(['orphan.jpg']);
    await put('places', 'place-orphan.jpg');
    namedIn('places').add('p1.jpg');
    await Promise.all(['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'].map((key) => put('places', key)));
    ['p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'].forEach((key) => namedIn('places').add(key));
    await markWeekOld('places', ['place-orphan.jpg']);
    const realDelete = storage.delete.bind(storage);
    vi.spyOn(storage, 'delete').mockImplementation(async (category, name) => {
      await realDelete(category, name);
      if (category === 'covers') await reclaim.setDeleteEnabled(false);
    });
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.categories.covers.deleted.objects).toBe(1);
    expect(report.categories.places).toMatchObject({ eligible: { objects: 1 }, deleted: { objects: 0 } });
    expect(fs.existsSync(objectPath('places', 'place-orphan.jpg'))).toBe(true);
  });

  it('RCLS-030: nothing is deleted while a backup reads the uploads', async () => {
    await markedWeekOld(['orphan.jpg']);
    jobs.beginBackup();
    try {
      const report = await reclaim.run({ now: WEEK_LATER });
      expect(report.mode).toBe('delete');
      expect(report.categories.covers).toMatchObject({ eligible: { objects: 1 }, deleted: { objects: 0 } });
      expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
    } finally {
      jobs.endBackup();
    }
  });
});

describe('StorageReclaimService: a pass that stops, and a restore', () => {
  it('RCLS-031: a pass stopped by a reopen keeps what it deleted and marks every unfinished category interrupted', async () => {
    await markedWeekOld(['orphan.jpg']);
    await put('places', 'p.jpg');
    const realDelete = storage.delete.bind(storage);
    vi.spyOn(storage, 'delete').mockImplementation(async (category, name) => {
      await realDelete(category, name);
      if (category === 'covers') await reopen();
    });
    const report = await reclaim.run({ now: WEEK_LATER });
    expect(report.stopped).toBe('database_reopened');
    expect(report.categories.covers).toMatchObject({ skipped: null, deleted: { objects: 1, bytes: 5 } });
    for (const category of ['avatars', 'places'] as const) {
      expect(report.categories[category]).toMatchObject({ objects: 0, skipped: 'interrupted' });
    }
    expect((await reclaim.state()).lastRun?.stopped).toBe('database_reopened');
    expect(await countRows(orm, AuditLog, { action: 'storage.reclaim_deleted' })).toBe(1);
  });

  it('RCLS-032: an unexpected failure part way still persists the report with what was deleted', async () => {
    await markedWeekOld(['orphan.jpg']);
    const spy = vi
      .spyOn(StorageReclaimMarksRepository.prototype, 'deleteKeys')
      .mockRejectedValueOnce(new Error('disk I/O error'));
    try {
      const report = await reclaim.run({ now: WEEK_LATER });
      expect(report.stopped).toBe('failed');
      expect(report.categories.covers).toMatchObject({ skipped: 'interrupted', deleted: { objects: 1, bytes: 5 } });
      expect(report.categories.places.skipped).toBe('interrupted');
      expect((await reclaim.state()).lastDeleteRun?.stopped).toBe('failed');
      expect(logError).toHaveBeenCalledWith(expect.stringContaining('disk I/O error'));
    } finally {
      spy.mockRestore();
    }
  });

  it('RCLS-033: a restore that begins mid-pass stops it before the delete, and waits for it to let go', async () => {
    await markedWeekOld(['orphan.jpg']);
    let restoreStarted: Promise<void> | null = null;
    let restoreWent = false;
    onAsk = (_category, keys) => {
      if (keys === null || restoreStarted) return;
      restoreStarted = jobs.beginRestore().then(() => {
        restoreWent = true;
      });
    };
    try {
      const report = await reclaim.run({ now: WEEK_LATER });
      expect(report.stopped).toBe('database_reopened');
      expect(report.categories.covers.skipped).toBe('interrupted');
      expect(fs.existsSync(objectPath('covers', 'orphan.jpg'))).toBe(true);
      await restoreStarted;
      expect(restoreWent).toBe(true);
    } finally {
      jobs.endRestore();
    }
  });

  it('RCLS-034: a reopen turns deletion off and drops marks, confirmations and reports, but keeps the install id', async () => {
    await markedWeekOld(['orphan.jpg']);
    await setAppSetting(orm, 'storage.reclaim_confirmed', JSON.stringify({ installId, counts: { covers: 1 } }));
    // A restored database carries another install's id and switch.
    await setAppSetting(orm, 'install_id', '12345678-aaaa-4bbb-8ccc-1234567890ab');
    await setAppSetting(orm, 'storage.reclaim_delete', '12345678-aaaa-4bbb-8ccc-1234567890ab');
    await reopen();
    expect(await readAppSetting(orm, 'install_id')).toBe(installId);
    const reset = ['storage.reclaim_delete', 'storage.reclaim_confirmed', 'storage.reclaim_report'];
    expect(await Promise.all(reset.map((key) => readAppSetting(orm, key)))).toEqual([null, null, null]);
    expect(await marksOf('covers')).toEqual([]);
    expect(await reclaim.state()).toEqual({ deleteEnabled: false, running: false, lastRun: null, lastDeleteRun: null });
  });
});

describe('StorageReclaimService: the switch and the stored reports', () => {
  it('RCLS-035: the switch is stored as this install id; any other value, another install id included, reads off', async () => {
    expect((await reclaim.setDeleteEnabled(true)).deleteEnabled).toBe(true);
    expect(await readAppSetting(orm, 'storage.reclaim_delete')).toBe(installId);
    expect((await reclaim.setDeleteEnabled(false)).deleteEnabled).toBe(false);
    expect(await readAppSetting(orm, 'storage.reclaim_delete')).toBeNull();
    const readsOff = async (value: string): Promise<boolean> => {
      await setAppSetting(orm, 'storage.reclaim_delete', value);
      return (await reclaim.state()).deleteEnabled;
    };
    expect(await readsOff('true')).toBe(false);
    expect(await readsOff('yes')).toBe(false);
    expect(await readsOff('12345678-aaaa-4bbb-8ccc-1234567890ab')).toBe(false);
  });

  it('RCLS-036: a stored report that no longer parses reads as never run', async () => {
    await setAppSetting(orm, 'storage.reclaim_report', '{not json');
    expect((await reclaim.state()).lastRun).toBeNull();
    await setAppSetting(orm, 'storage.reclaim_delete_report', JSON.stringify({ startedAt: 'yesterday' }));
    expect((await reclaim.state()).lastDeleteRun).toBeNull();
  });
});
