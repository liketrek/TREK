/**
 * StorageReleaseService (#2924): what a user's delete or replace left unnamed
 * is queued by the request, which deletes nothing, and goes once it is due,
 * through the same sources and parser as the nightly pass, over a real
 * StorageModule (a LocalDriver on a temp folder) with fake sources standing in
 * for the owner domains. An object any row still names stays; the pass's
 * guards hold, the owner marker included; a failure never reaches the caller
 * and leaves its rows queued. RELS-001 to RELS-021.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { StorageReleaseQueue } from '../../../../src/db/entities/StorageReleaseQueue.entity';
import { StorageReleaseQueueRepository } from '../../../../src/db/repositories/StorageReleaseQueue.repository';
import { dbNow } from '../../../../src/db/types';
import { DataPathsService } from '../../../../src/nest/app-config/data-paths.service';
import { logWarn } from '../../../../src/nest/audit/audit-log.logger';
import { StorageInstallService } from '../../../../src/nest/storage/storage-install.service';
import { StorageJobsService } from '../../../../src/nest/storage/storage-jobs.service';
import { StorageReclaimGuardService } from '../../../../src/nest/storage/storage-reclaim-guard.service';
import { StorageReclaimRegistryService } from '../../../../src/nest/storage/storage-reclaim-registry.service';
import { MAX_LIKE_TERMS } from '../../../../src/nest/storage/storage-reclaim-source.service';
import {
  STORAGE_RECLAIMABLE_CATEGORIES,
  STORAGE_REFERENCE_SOURCE_IDS,
  storageOwnerMarkerKey,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from '../../../../src/nest/storage/storage-reclaim.types';
import {
  RELEASE_DELAY_MS,
  STORAGE_RELEASE_JOB,
  StorageReleaseService,
} from '../../../../src/nest/storage/storage-release.service';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { countRows, deleteRows, findRows } from '../../../helpers/factories/rows';
import { setAppSetting } from '../../../helpers/factories/settings';
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
let dataRoot: string;
let release: StorageReleaseService;
let storage: StorageService;
let references: StorageReclaimRegistryService;
let jobs: StorageJobsService;
let installId: string;
/** What the fake sources still name, per category, lowercased. */
let named: Map<ServedCategory, Set<string>>;
let asked: Array<{ id: StorageReferenceSourceId; category: ServedCategory; keys: string[] }>;
let failWith: Error | null;

function fakeSource(id: StorageReferenceSourceId): StorageReferenceSource {
  const categories: readonly ServedCategory[] =
    id === 'auth' ? ['avatars'] : id === 'files' ? ['files'] : STORAGE_RECLAIMABLE_CATEGORIES;
  return {
    id,
    claims: categories.map((category): StorageReferenceClaim => ({ category, prefix: '' })),
    namedKeys: async () => {
      throw new Error('a release never reads a whole category');
    },
    namedKeysByCategory: async () => {
      throw new Error('a release never reads a whole category');
    },
    async referenced(category, keys) {
      asked.push({ id, category, keys: [...keys] });
      if (failWith) throw failWith;
      const set = named.get(category) ?? new Set<string>();
      return new Set(keys.filter((key) => set.has(key.toLowerCase())));
    },
  };
}

async function put(category: ServedCategory, key: string): Promise<void> {
  await storage.put(category, key, Readable.from('bytes'));
}

function exists(category: string, key: string): boolean {
  return fs.existsSync(path.join(uploadsRoot, category, key));
}

async function queued(category: string, key?: string): Promise<number> {
  return await countRows(orm, StorageReleaseQueue, key === undefined ? { category } : { category, key });
}

/** Once everything queued so far is due. */
function due(): Date {
  return new Date(Date.now() + RELEASE_DELAY_MS + 60_000);
}

async function setBackends(extra: unknown[] = []): Promise<void> {
  await setAppSetting(
    orm,
    'storage.backends',
    JSON.stringify([{ name: 'uploads-local', type: 'local', options: { root: uploadsRoot } }, ...extra]),
  );
}

beforeAll(async () => {
  uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-release-uploads-'));
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-release-data-'));
  orm = await createTestOrm(db);
  await setBackends();
  const paths = { ...new DataPathsService(), installIdFile: path.join(dataRoot, '.trek-install-id') };
  t = await createTestModule({
    db,
    imports: [StorageModule],
    init: true,
    overrides: [{ provide: DataPathsService, useValue: paths }],
  });
  release = t.get(StorageReleaseService);
  storage = t.get(StorageService);
  references = t.get(StorageReclaimRegistryService);
  jobs = t.get(StorageJobsService);
  installId = t.get(StorageInstallService).installId() ?? '';
  await storage.reloadConfig();
  for (const id of STORAGE_REFERENCE_SOURCE_IDS) references.register(fakeSource(id));
});

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.mocked(logWarn).mockClear();
  await deleteRows(orm, StorageReleaseQueue);
  t.get(StorageReclaimGuardService).forget();
  named = new Map();
  asked = [];
  failWith = null;
});

afterAll(async () => {
  await t.close();
  await deleteRows(orm, AppSettings, { key: 'storage.backends' });
  await orm.close();
  db.close();
  fs.rmSync(uploadsRoot, { recursive: true, force: true });
  fs.rmSync(dataRoot, { recursive: true, force: true });
});

const UUID = '6f1e2d3c-4b5a-4968-8776-655443322110';

describe('StorageReleaseService: the request only queues', () => {
  it('RELS-001: queues what the values name, deletes nothing itself, and the due tick deletes what no row names', async () => {
    expect(installId).toMatch(/^[0-9a-f-]{36}$/);
    await put('covers', `${UUID}-old.jpg`);
    await put('covers', `${UUID}-shared.jpg`);
    named.set('covers', new Set([`${UUID}-shared.jpg`]));
    const before = Date.now();
    expect(await release.releaseValues([`/uploads/covers/${UUID}-old.jpg`, `covers/${UUID}-shared.jpg`])).toBe(2);
    expect(exists('covers', `${UUID}-old.jpg`)).toBe(true);
    expect(asked).toEqual([]);
    const rows = await findRows(orm, StorageReleaseQueue, { category: 'covers' });
    expect(rows.map((row) => row.key).sort()).toEqual([`${UUID}-old.jpg`, `${UUID}-shared.jpg`]);
    for (const row of rows) expect(row.due_at >= dbNow(new Date(before + RELEASE_DELAY_MS - 1000))).toBe(true);

    expect(await release.processDue(due())).toEqual({ skipped: null, deleted: 1, kept: 1 });
    expect(exists('covers', `${UUID}-old.jpg`)).toBe(false);
    expect(exists('covers', `${UUID}-shared.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(0);
  });

  it('RELS-002: reads every spelling a column holds, and a bare name with its column options', async () => {
    expect(await release.releaseValues([`https://trip.example.test/uploads/places/${UUID}.jpg?v=2`])).toBeGreaterThan(
      0,
    );
    expect(await release.releaseValues([`${UUID}.png`], { bare: 'avatars' })).toBe(1);
    expect(await release.releaseValues([`legacy/${UUID}. #4711`], { bare: 'files', basename: true })).toBeGreaterThan(
      0,
    );
    expect(await queued('places', `${UUID}.jpg`)).toBe(1);
    expect(await queued('avatars', `${UUID}.png`)).toBe(1);
    expect(await queued('files', `${UUID}. #4711`)).toBe(1);
  });

  it('RELS-003: never queues a nested key, an owner marker, a category the ledger keeps or a foreign URL', async () => {
    expect(
      await release.releaseValues([
        `/uploads/journey/thumbs/${UUID}.jpg`,
        `/uploads/covers/${storageOwnerMarkerKey(UUID)}`,
        `/uploads/photos/${UUID}.jpg`,
        `/uploads/backups/${UUID}.zip`,
        'https://elsewhere.example.test/x.jpg',
        null,
        undefined,
      ]),
    ).toBe(0);
    expect(await countRows(orm, StorageReleaseQueue)).toBe(0);
  });

  it('RELS-004: one value queues a bounded number of keys, and a key queued again waits from the later time', async () => {
    const many = Array.from({ length: 40 }, (_unused, i) => `/uploads/covers/${UUID}-${i}.jpg`).join(' ');
    expect(await release.releaseValues([many])).toBeLessThanOrEqual(16);
    await deleteRows(orm, StorageReleaseQueue);
    await release.releaseValues([`/uploads/covers/${UUID}-again.jpg`]);
    const first = (await findRows(orm, StorageReleaseQueue, { key: `${UUID}-again.jpg` }))[0]?.due_at ?? '';
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2 * DAY);
    await release.releaseValues([`/uploads/covers/${UUID}-again.jpg`]);
    vi.mocked(Date.now).mockRestore();
    const second = (await findRows(orm, StorageReleaseQueue, { key: `${UUID}-again.jpg` }))[0]?.due_at ?? '';
    expect(second > first).toBe(true);
    expect(await queued('covers', `${UUID}-again.jpg`)).toBe(1);
  });

  it('RELS-005: a queue that fails is logged and answered as nothing queued, never thrown', async () => {
    vi.spyOn(StorageReleaseQueueRepository.prototype, 'size').mockRejectedValueOnce(new Error('database is locked'));
    await expect(release.releaseValues([`/uploads/covers/${UUID}-locked.jpg`])).resolves.toBe(0);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
  });
});

describe('StorageReleaseService: a tick deletes only what is due and unnamed', () => {
  it('RELS-006: nothing goes before it is due', async () => {
    await put('places', `${UUID}-young.jpg`);
    await release.releaseValues([`/uploads/places/${UUID}-young.jpg`]);
    expect(await release.processDue(new Date())).toEqual({ skipped: null, deleted: 0, kept: 0 });
    expect(exists('places', `${UUID}-young.jpg`)).toBe(true);
    expect(await queued('places', `${UUID}-young.jpg`)).toBe(1);
  });

  it('RELS-007: a value an undo wrote back before it was due keeps its object, and its row goes', async () => {
    await put('covers', `${UUID}-undone.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-undone.jpg`]);
    named.set('covers', new Set([`${UUID}-undone.jpg`]));
    expect((await release.processDue(due())).kept).toBe(1);
    expect(exists('covers', `${UUID}-undone.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(0);
  });

  it('RELS-008: every source that claims the category is asked, at most 50 keys a question, 200 rows a tick', async () => {
    const keys = Array.from({ length: 230 }, (_unused, i) => `${UUID}-n${i}.jpg`);
    expect(await release.releaseValues(keys.map((key) => `/uploads/places/${key}`))).toBe(230);
    const result = await release.processDue(due());
    expect(result.deleted).toBe(200);
    expect(await queued('places')).toBe(30);
    expect(Math.max(...asked.map((question) => question.keys.length))).toBeLessThanOrEqual(50);
    expect([...new Set(asked.map((question) => question.id))].sort()).toEqual(
      ['collections', 'journey', 'photos', 'place-contrib', 'places', 'trips'].sort(),
    );
    expect(MAX_LIKE_TERMS).toBeLessThanOrEqual(50);
  });

  it('RELS-009: a key named in another spelling, case included, keeps its object', async () => {
    await put('covers', `${UUID}-case.jpg`);
    named.set('covers', new Set([`${UUID}-case.jpg`]));
    await release.releaseValues([`/uploads/covers/${UUID.toUpperCase()}-CASE.JPG`]);
    await release.processDue(due());
    expect(exists('covers', `${UUID}-case.jpg`)).toBe(true);
  });

  it('RELS-010: a source that fails keeps the rows and never throws; the next tick deletes', async () => {
    await put('covers', `${UUID}-f.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-f.jpg`]);
    failWith = new Error('places table locked');
    expect((await release.processDue(due())).deleted).toBe(0);
    expect(exists('covers', `${UUID}-f.jpg`)).toBe(true);
    expect(await queued('covers', `${UUID}-f.jpg`)).toBe(1);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('places table locked'));
    failWith = null;
    expect((await release.processDue(due())).deleted).toBe(1);
    expect(exists('covers', `${UUID}-f.jpg`)).toBe(false);
  });

  it('RELS-011: a delete that fails keeps its row and stops the category for the tick', async () => {
    await put('covers', `${UUID}-d1.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-d1.jpg`]);
    vi.spyOn(storage, 'delete').mockRejectedValue(new Error('permission denied'));
    expect((await release.processDue(due())).deleted).toBe(0);
    expect(exists('covers', `${UUID}-d1.jpg`)).toBe(true);
    expect(await queued('covers', `${UUID}-d1.jpg`)).toBe(1);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  });

  it('RELS-012: an object the facade keeps on delete (a demo) stays, and its row goes', async () => {
    await put('covers', `${UUID}-k.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-k.jpg`]);
    vi.spyOn(storage, 'keepsOnDelete').mockReturnValue(true);
    expect((await release.processDue(due())).kept).toBe(1);
    expect(exists('covers', `${UUID}-k.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(0);
  });

  it('RELS-013: a row that waited thirty days past its time is left to the nightly pass', async () => {
    await orm
      .repo(StorageReleaseQueue)
      .enqueue([{ category: 'covers', key: `${UUID}-ancient.jpg` }], dbNow(new Date(Date.now() - 31 * DAY)));
    await release.processDue(new Date());
    expect(await queued('covers', `${UUID}-ancient.jpg`)).toBe(0);
    expect(asked).toEqual([]);
  });
});

describe('StorageReleaseService: the guards the nightly pass keeps', () => {
  it('RELS-014: a category missing a required source keeps its rows', async () => {
    await put('avatars', `${UUID}-a.png`);
    await release.releaseValues([`${UUID}-a.png`], { bare: 'avatars' });
    vi.spyOn(references, 'sources').mockReturnValue(references.sources().filter((source) => source.id !== 'auth'));
    await release.processDue(due());
    expect(exists('avatars', `${UUID}-a.png`)).toBe(true);
    expect(await queued('avatars')).toBe(1);
  });

  it('RELS-015: nothing runs while a restore or a backup runs, or another storage job holds the slot', async () => {
    await put('covers', `${UUID}-r.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-r.jpg`]);
    await jobs.beginRestore();
    try {
      expect((await release.processDue(due())).skipped).toBe('busy');
    } finally {
      jobs.endRestore();
    }
    jobs.beginBackup();
    try {
      expect((await release.processDue(due())).skipped).toBe('busy');
    } finally {
      jobs.endBackup();
    }
    expect(jobs.claimExclusive('a test job')).toBe(true);
    try {
      expect((await release.processDue(due())).skipped).toBe('busy');
    } finally {
      jobs.releaseExclusive('a test job');
    }
    expect(exists('covers', `${UUID}-r.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(1);
    // A tick holds the slot under its own name while it runs, and lets go after.
    const holders: Array<string | null> = [];
    named.set('covers', new Set());
    vi.spyOn(storage, 'delete').mockImplementation(async () => {
      holders.push(jobs.exclusiveHolder);
    });
    await release.processDue(due());
    expect(holders).toEqual([STORAGE_RELEASE_JOB]);
    expect(jobs.exclusiveHolder).toBeNull();
  });

  it('RELS-016: a restore that begins mid-tick stops it and keeps the rest queued', async () => {
    await put('covers', `${UUID}-m1.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-m1.jpg`]);
    const realReferenced = references.sources().map((source) => source.referenced.bind(source));
    let restoring = false;
    references.sources().forEach((source, i) => {
      vi.spyOn(source, 'referenced').mockImplementation(async (category, keys) => {
        if (!restoring) {
          restoring = true;
          void jobs.beginRestore();
        }
        return await (realReferenced[i] as typeof source.referenced)(category, keys);
      });
    });
    try {
      expect((await release.processDue(due())).deleted).toBe(0);
    } finally {
      jobs.endRestore();
    }
    expect(exists('covers', `${UUID}-m1.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(1);
  });

  it('RELS-017: a category whose location overlaps another keeps its rows', async () => {
    await put('covers', `${UUID}-s.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-s.jpg`]);
    await setBackends([{ name: 'nested', type: 'local', options: { root: path.join(uploadsRoot, 'covers') } }]);
    await setAppSetting(orm, 'storage.categories', JSON.stringify({ 'photos-trek': 'nested' }));
    await storage.reloadConfig();
    try {
      await release.processDue(due());
      expect(exists('covers', `${UUID}-s.jpg`)).toBe(true);
      expect(await queued('covers')).toBe(1);
    } finally {
      await setBackends();
      await deleteRows(orm, AppSettings, { key: 'storage.categories' });
      await storage.reloadConfig();
    }
  });

  it('RELS-018: another installation marker keeps the category untouched; this one writes its own', async () => {
    await put('covers', `${UUID}-o.jpg`);
    await put('covers', storageOwnerMarkerKey('another-install-0001'));
    await release.releaseValues([`/uploads/covers/${UUID}-o.jpg`]);
    try {
      await release.processDue(due());
      expect(exists('covers', `${UUID}-o.jpg`)).toBe(true);
      expect(await queued('covers')).toBe(1);
    } finally {
      await storage.delete('covers', storageOwnerMarkerKey('another-install-0001'));
    }
    // The verdict is cached until it is forgotten (a reopen) or runs out.
    await release.processDue(due());
    expect(exists('covers', `${UUID}-o.jpg`)).toBe(true);
    t.get(StorageReclaimGuardService).forget();
    await release.processDue(due());
    expect(exists('covers', `${UUID}-o.jpg`)).toBe(false);
    expect(exists('covers', storageOwnerMarkerKey(installId))).toBe(true);
  });

  it('RELS-019: an owner marker that cannot be looked for leaves the category as owner_unknown', async () => {
    await put('covers', `${UUID}-u.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-u.jpg`]);
    vi.spyOn(storage, 'list').mockImplementation(() => {
      throw new Error('listing refused');
    });
    await release.processDue(due());
    expect(exists('covers', `${UUID}-u.jpg`)).toBe(true);
    expect(await queued('covers')).toBe(1);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('listing refused'));
  });

  it('RELS-020: without an install id nothing is released', async () => {
    await put('covers', `${UUID}-i.jpg`);
    await release.releaseValues([`/uploads/covers/${UUID}-i.jpg`]);
    vi.spyOn(t.get(StorageInstallService), 'installId').mockReturnValue(null);
    expect((await release.processDue(due())).skipped).toBe('no_install_id');
    expect(exists('covers', `${UUID}-i.jpg`)).toBe(true);
  });

  it('RELS-021: a key with no run to narrow a read by is kept without a question, for the nightly pass', async () => {
    await put('covers', 'short.jpg');
    await release.releaseValues(['/uploads/covers/short.jpg']);
    expect((await release.processDue(due())).kept).toBe(1);
    expect(asked).toEqual([]);
    expect(exists('covers', 'short.jpg')).toBe(true);
    expect(await queued('covers')).toBe(0);
  });
});
