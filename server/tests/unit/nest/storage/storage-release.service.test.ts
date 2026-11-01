/**
 * StorageReleaseService (#2924): what a user's delete or replace left unnamed
 * goes right after it, through the same sources and parser as the nightly
 * pass, over a real StorageModule (a LocalDriver on a temp folder) with fake
 * sources standing in for the owner domains. An object any row still names
 * stays; the pass's guards hold; a failure never reaches the caller.
 * RELS-001 to RELS-010.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { logWarn } from '../../../../src/nest/audit/audit-log.logger';
import { StorageJobsService } from '../../../../src/nest/storage/storage-jobs.service';
import { StorageReclaimRegistryService } from '../../../../src/nest/storage/storage-reclaim-registry.service';
import {
  STORAGE_RECLAIMABLE_CATEGORIES,
  STORAGE_REFERENCE_SOURCE_IDS,
  storageOwnerMarkerKey,
  type StorageReferenceClaim,
  type StorageReferenceSource,
  type StorageReferenceSourceId,
} from '../../../../src/nest/storage/storage-reclaim.types';
import { StorageReleaseService } from '../../../../src/nest/storage/storage-release.service';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import type { ServedCategory } from '../../../../src/nest/storage/storage.types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows } from '../../../helpers/factories/rows';
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

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let uploadsRoot: string;
let release: StorageReleaseService;
let storage: StorageService;
let references: StorageReclaimRegistryService;
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

beforeAll(async () => {
  uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-release-uploads-'));
  orm = await createTestOrm(db);
  await setAppSetting(
    orm,
    'storage.backends',
    JSON.stringify([{ name: 'uploads-local', type: 'local', options: { root: uploadsRoot } }]),
  );
  t = await createTestModule({ db, imports: [StorageModule], init: true });
  release = t.get(StorageReleaseService);
  storage = t.get(StorageService);
  references = t.get(StorageReclaimRegistryService);
  await storage.reloadConfig();
  for (const id of STORAGE_REFERENCE_SOURCE_IDS) references.register(fakeSource(id));
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(logWarn).mockClear();
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
});

const UUID = '6f1e2d3c-4b5a-4968-8776-655443322110';

describe('StorageReleaseService', () => {
  it('RELS-001: deletes what no row names, keeps what one still does, and answers what went', async () => {
    await put('covers', `${UUID}-old.jpg`);
    await put('covers', `${UUID}-shared.jpg`);
    named.set('covers', new Set([`${UUID}-shared.jpg`]));
    const released = await release.releaseValues([`/uploads/covers/${UUID}-old.jpg`, `covers/${UUID}-shared.jpg`]);
    expect(released).toEqual([{ category: 'covers', key: `${UUID}-old.jpg` }]);
    expect(exists('covers', `${UUID}-old.jpg`)).toBe(false);
    expect(exists('covers', `${UUID}-shared.jpg`)).toBe(true);
  });

  it('RELS-002: reads every spelling a column holds, and a bare name with its column options', async () => {
    await put('places', `${UUID}.jpg`);
    await put('avatars', `${UUID}.png`);
    await put('files', `${UUID}. #4711`);
    const released = await release.releaseValues([`https://trip.example.test/uploads/places/${UUID}.jpg?v=2`]);
    expect(released).toEqual([{ category: 'places', key: `${UUID}.jpg` }]);
    expect(await release.releaseValues([`${UUID}.png`], { bare: 'avatars' })).toEqual([
      { category: 'avatars', key: `${UUID}.png` },
    ]);
    expect(await release.releaseValues([`legacy/${UUID}. #4711`], { bare: 'files', basename: true })).toEqual([
      { category: 'files', key: `${UUID}. #4711` },
    ]);
    // Every source that claims the category was asked about the keys, narrowed, never about the whole category.
    expect(
      asked
        .filter((question) => question.category === 'files')
        .map((question) => question.id)
        .sort(),
    ).toEqual(['collections', 'files', 'journey', 'photos', 'place-contrib', 'places', 'trips'].sort());
  });

  it('RELS-003: never touches a nested key, an owner marker or a category the ledger keeps', async () => {
    await put('journey', `thumbs/${UUID}.jpg`);
    await put('covers', storageOwnerMarkerKey(UUID));
    await put('photos', `${UUID}.jpg`);
    expect(
      await release.releaseValues([
        `/uploads/journey/thumbs/${UUID}.jpg`,
        `/uploads/covers/${storageOwnerMarkerKey(UUID)}`,
        `/uploads/photos/${UUID}.jpg`,
        'https://elsewhere.example.test/x.jpg',
        null,
      ]),
    ).toEqual([]);
    expect(exists('journey', `thumbs/${UUID}.jpg`)).toBe(true);
    expect(exists('covers', storageOwnerMarkerKey(UUID))).toBe(true);
    expect(exists('photos', `${UUID}.jpg`)).toBe(true);
    expect(asked).toEqual([]);
  });

  it('RELS-004: a category missing a required source is left to the nightly pass', async () => {
    await put('avatars', `${UUID}-a.png`);
    vi.spyOn(references, 'sources').mockReturnValue(references.sources().filter((source) => source.id !== 'auth'));
    expect(await release.releaseIfUnreferenced('avatars', [`${UUID}-a.png`])).toEqual([]);
    expect(exists('avatars', `${UUID}-a.png`)).toBe(true);
  });

  it('RELS-005: nothing goes while a restore runs', async () => {
    await put('covers', `${UUID}-r.jpg`);
    const jobs = t.get(StorageJobsService);
    await jobs.beginRestore();
    try {
      expect(await release.releaseIfUnreferenced('covers', [`${UUID}-r.jpg`])).toEqual([]);
    } finally {
      jobs.endRestore();
    }
    expect(exists('covers', `${UUID}-r.jpg`)).toBe(true);
  });

  it('RELS-006: a category whose location overlaps another is left alone', async () => {
    await put('covers', `${UUID}-s.jpg`);
    await setAppSetting(
      orm,
      'storage.backends',
      JSON.stringify([
        { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
        { name: 'nested', type: 'local', options: { root: path.join(uploadsRoot, 'covers') } },
      ]),
    );
    await setAppSetting(orm, 'storage.categories', JSON.stringify({ 'photos-trek': 'nested' }));
    await storage.reloadConfig();
    try {
      expect(await release.releaseIfUnreferenced('covers', [`${UUID}-s.jpg`])).toEqual([]);
      expect(exists('covers', `${UUID}-s.jpg`)).toBe(true);
    } finally {
      await setAppSetting(
        orm,
        'storage.backends',
        JSON.stringify([{ name: 'uploads-local', type: 'local', options: { root: uploadsRoot } }]),
      );
      await deleteRows(orm, AppSettings, { key: 'storage.categories' });
      await storage.reloadConfig();
    }
  });

  it('RELS-007: a source that fails keeps everything and never throws', async () => {
    await put('covers', `${UUID}-f.jpg`);
    failWith = new Error('places table locked');
    await expect(release.releaseValues([`/uploads/covers/${UUID}-f.jpg`])).resolves.toEqual([]);
    expect(exists('covers', `${UUID}-f.jpg`)).toBe(true);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('places table locked'));
  });

  it('RELS-008: a delete that fails is logged and answered as kept, the others still go', async () => {
    await put('covers', `${UUID}-d1.jpg`);
    await put('covers', `${UUID}-d2.jpg`);
    const realDelete = storage.delete.bind(storage);
    vi.spyOn(storage, 'delete').mockImplementation(async (category, name) => {
      if (name.endsWith('-d1.jpg')) throw new Error('permission denied');
      await realDelete(category, name);
    });
    const released = await release.releaseIfUnreferenced('covers', [`${UUID}-d1.jpg`, `${UUID}-d2.jpg`]);
    expect(released).toEqual([`${UUID}-d2.jpg`]);
    expect(exists('covers', `${UUID}-d1.jpg`)).toBe(true);
    expect(logWarn).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  });

  it('RELS-009: an object the facade keeps on delete (a demo) and one that is not there are not reported', async () => {
    await put('covers', `${UUID}-k.jpg`);
    const keeps = vi.spyOn(storage, 'keepsOnDelete').mockReturnValue(true);
    expect(await release.releaseIfUnreferenced('covers', [`${UUID}-k.jpg`])).toEqual([]);
    expect(exists('covers', `${UUID}-k.jpg`)).toBe(true);
    keeps.mockRestore();
    expect(await release.releaseIfUnreferenced('covers', [`${UUID}-missing.jpg`])).toEqual([]);
  });

  it('RELS-010: a key named in another spelling, case included, keeps its object', async () => {
    await put('covers', `${UUID}-case.jpg`);
    named.set('covers', new Set([`${UUID}-case.jpg`]));
    expect(await release.releaseValues([`/uploads/covers/${UUID.toUpperCase()}-CASE.JPG`])).toEqual([]);
    expect(exists('covers', `${UUID}-case.jpg`)).toBe(true);
  });
});
