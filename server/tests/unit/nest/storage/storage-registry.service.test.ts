import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { Logger } from '@nestjs/common';

// ── DB setup (the permissions.service.test.ts pattern: real in-memory SQLite
// so the app_settings SQL is exercised faithfully) ────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
});

vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/config', () => ({ ENCRYPTION_KEY: 'storage-registry-test-key' }));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { encrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { StorageRegistryService } from '../../../../src/nest/storage/storage-registry.service';
import { LocalDriver } from '../../../../src/nest/storage/drivers/local.driver';
import { MirrorDriver, type ReplicaFailure } from '../../../../src/nest/storage/drivers/mirror.driver';
import { S3Driver } from '../../../../src/nest/storage/drivers/s3.driver';
import {
  GLOBAL_TEMP_DIR,
  DEFAULT_BACKUPS_ROOT,
  DEFAULT_UPLOADS_ROOT,
  SEED_CONFIG_PATH,
} from '../../../../src/nest/storage/storage-paths';
import { STORAGE_CATEGORIES } from '../../../../src/nest/storage/storage.types';

const db = new DatabaseService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

// ── helpers ───────────────────────────────────────────────────────────────────

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-registry-'));
  tmpDirs.push(dir);
  return dir;
}

interface EnvPaths {
  placePhotoDir?: string;
}

function makeEnvStub(initial: EnvPaths): { env: RuntimeEnvService } {
  const paths = initial;
  return {
    env: { env: () => ({ paths }) } as unknown as RuntimeEnvService,
  };
}

function setSetting(key: string, value: string): void {
  testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

function uploadsOverride(root: string): unknown {
  return { name: 'uploads-local', type: 'local', options: { root } };
}

interface RegistryOpts {
  uploadsRoot?: string;
  placePhotoDir?: string;
  boot?: boolean;
  /** Extra storage.backends entries, appended after the uploads-local override. */
  backends?: unknown[];
  categories?: Record<string, string>;
}

/**
 * The uploads-local root is the computed default, relocatable only via a
 * settings override row bearing the built-in's name (first-class
 * merge-by-name). The helper seeds that override so unit runs never write
 * into the real server/uploads.
 */
function makeRegistry(opts: RegistryOpts = {}) {
  const uploadsRoot = opts.uploadsRoot ?? makeTmpDir();
  setSetting('storage.backends', JSON.stringify([uploadsOverride(uploadsRoot), ...(opts.backends ?? [])]));
  if (opts.categories) setSetting('storage.categories', JSON.stringify(opts.categories));
  const stub = makeEnvStub({ placePhotoDir: opts.placePhotoDir });
  const registry = new StorageRegistryService(db, stub.env, new StorageEventsService());
  if (opts.boot !== false) registry.onModuleInit();
  return { registry, uploadsRoot, setUploadsRoot: (root: string) => rewriteUploadsOverride(root) };
}

/** For reload tests: swap the override row's root in place. */
function rewriteUploadsOverride(root: string): void {
  const row = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.backends'").get() as
    | { value: string }
    | undefined;
  const entries = row?.value ? (JSON.parse(row.value) as Array<{ name: string; options: { root: string } }>) : [];
  const next = entries.map((e) => (e.name === 'uploads-local' ? { ...e, options: { root } } : e));
  setSetting('storage.backends', JSON.stringify(next));
}

beforeEach(() => {
  testDb.prepare("DELETE FROM app_settings WHERE key LIKE 'storage.%'").run();
});

afterEach(() => {
  vi.restoreAllMocks();
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

// ── defaults ──────────────────────────────────────────────────────────────────

describe('StorageRegistryService defaults', () => {
  it('resolves every category with the built-in defaults and no settings rows', () => {
    const { registry, uploadsRoot } = makeRegistry();

    for (const category of STORAGE_CATEGORIES) {
      expect(registry.resolve(category)).toBeDefined();
    }

    const files = registry.resolve('files');
    expect(files.backendName).toBe('uploads-local');
    expect(files.keyPrefix).toBe('files/');
    expect(files.driver).toBeInstanceOf(LocalDriver);
    expect(files.driver.getLocalPath!('files/x.pdf')).toBe(path.join(fs.realpathSync(uploadsRoot), 'files/x.pdf'));

    // backups: bare keys, root IS the backups dir (spec rev 3.1)
    const backups = registry.resolve('backups');
    expect(backups.backendName).toBe('backups-local');
    expect(backups.keyPrefix).toBe('');
    expect(backups.driver.getLocalPath!('backup-1.zip')).toBe(path.join(fs.realpathSync(DEFAULT_BACKUPS_ROOT), 'backup-1.zip'));

    // photos-google without TREK_PLACE_PHOTO_DIR: today's layout under uploads
    const googlePhotos = registry.resolve('photos-google');
    expect(googlePhotos.backendName).toBe('uploads-local');
    expect(googlePhotos.keyPrefix).toBe('photos/google/');
  });

  it('honors TREK_PLACE_PHOTO_DIR via the conditional third backend (mode B: bare keys)', () => {
    const photoDir = makeTmpDir();
    const { registry } = makeRegistry({ placePhotoDir: photoDir });

    const googlePhotos = registry.resolve('photos-google');
    expect(googlePhotos.backendName).toBe('place-photos-local');
    expect(googlePhotos.keyPrefix).toBe('');
    expect(googlePhotos.driver.getLocalPath!('abc.jpg')).toBe(path.join(fs.realpathSync(photoDir), 'abc.jpg'));

    // Everything else stays on uploads-local, unchanged.
    expect(registry.resolve('photos-trek').backendName).toBe('uploads-local');
    expect(registry.resolve('photos-trek').keyPrefix).toBe('photos/trek/');
  });

  it('creates roots, spools, category prefix dirs, and the global temp dir on load', () => {
    const { uploadsRoot } = makeRegistry();

    for (const sub of ['.tmp', 'files', 'journey', 'covers', 'avatars', 'places', 'photos', 'photos/trek', 'photos/google']) {
      expect(fs.statSync(path.join(uploadsRoot, sub)).isDirectory()).toBe(true);
    }
    expect(fs.statSync(GLOBAL_TEMP_DIR).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(DEFAULT_BACKUPS_ROOT, '.tmp')).isDirectory()).toBe(true);
  });

  it('roots uploads-local at the computed default when no override row exists', () => {
    const { registry } = makeRegistry({ boot: false });
    testDb.prepare("DELETE FROM app_settings WHERE key = 'storage.backends'").run();
    registry.onModuleInit();
    const files = registry.resolve('files');
    expect(files.backendName).toBe('uploads-local');
    expect(files.driver.getLocalPath!('files/x.pdf')).toBe(
      path.join(fs.realpathSync(DEFAULT_UPLOADS_ROOT), 'files/x.pdf'),
    );
  });

  it('a settings row bearing a built-in name replaces it (first-class override)', () => {
    const relocated = makeTmpDir();
    const { registry } = makeRegistry({ uploadsRoot: relocated });
    expect(registry.resolve('files').driver.getLocalPath!('files/x.pdf')).toBe(
      path.join(fs.realpathSync(relocated), 'files/x.pdf'),
    );
  });

  it('serves the legacy photos category from uploads-local without any config (ServedCategory seam)', () => {
    const relocated = makeTmpDir();
    const { registry } = makeRegistry({ uploadsRoot: relocated });
    const photos = registry.resolve('photos');
    expect(photos.backendName).toBe('uploads-local');
    expect(photos.keyPrefix).toBe('photos/');
    // Override-following: relocating uploads moves the legacy photos with it.
    expect(photos.driver.getLocalPath!('photos/x.jpg')).toBe(
      path.join(fs.realpathSync(relocated), 'photos/x.jpg'),
    );
  });

  it('the admin snapshot exposes only the 8 configurable categories — photos is served, not configurable', () => {
    const { registry } = makeRegistry();
    const keys = Object.keys(registry.snapshot().categories);
    expect(keys).toHaveLength(8);
    expect(keys).not.toContain('photos');
  });
});

// ── keyPrefixFor (extracted for the category-migration job) ───────────────────

describe('StorageRegistryService keyPrefixFor', () => {
  it('returns the plain category prefix regardless of which backend is asked', () => {
    const { registry } = makeRegistry();
    expect(registry.keyPrefixFor('files', 'uploads-local')).toBe('files/');
    expect(registry.keyPrefixFor('files', 'some-other-backend')).toBe('files/');
    expect(registry.keyPrefixFor('backups', 'backups-local')).toBe('');
    expect(registry.keyPrefixFor('covers', 'anything')).toBe('covers/');
  });

  it('photos-google is bare-key (mode A) ONLY on place-photos-local; every other backend gets the prefixed mode-B layout', () => {
    const { registry } = makeRegistry();
    expect(registry.keyPrefixFor('photos-google', 'place-photos-local')).toBe('');
    expect(registry.keyPrefixFor('photos-google', 'uploads-local')).toBe('photos/google/');
    expect(registry.keyPrefixFor('photos-google', 'dest-local')).toBe('photos/google/');
  });

  it('agrees with resolve() for the category\'s CURRENT backend — no drift between the two rules', () => {
    const photoDir = makeTmpDir();
    const { registry } = makeRegistry({ placePhotoDir: photoDir });
    const resolved = registry.resolve('photos-google');
    expect(registry.keyPrefixFor('photos-google', resolved.backendName)).toBe(resolved.keyPrefix);
  });
});

// ── settings merge + validation ───────────────────────────────────────────────

describe('StorageRegistryService settings', () => {
  it('merges app_settings backends/categories over the defaults (backup mirror)', () => {
    const nasRoot = makeTmpDir();
    const { registry } = makeRegistry({
      backends: [
        { name: 'nas-backups', type: 'local', options: { root: nasRoot } },
        { name: 'backup-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas-backups'] } },
      ],
      categories: { backups: 'backup-mirror' },
    });
    const backups = registry.resolve('backups');
    expect(backups.backendName).toBe('backup-mirror');
    expect(backups.keyPrefix).toBe('');
    expect(backups.driver).toBeInstanceOf(MirrorDriver);
    // untouched categories keep their defaults
    expect(registry.resolve('files').backendName).toBe('uploads-local');
  });

  it('a mirror may serve any category — the backups-only rule is lifted (replicas-on-primary spec)', () => {
    const extraRoot = makeTmpDir();
    const { registry, uploadsRoot } = makeRegistry({
      backends: [
        { name: 'extra-local', type: 'local', options: { root: extraRoot } },
        { name: 'm', type: 'mirror', options: { primary: 'uploads-local', replicas: ['extra-local'] } },
      ],
      categories: { covers: 'm' },
    });
    const covers = registry.resolve('covers');
    expect(covers.backendName).toBe('m');
    expect(covers.driver).toBeInstanceOf(MirrorDriver);
    expect(covers.keyPrefix).toBe('covers/');
    // Hot-path reads stay free: getLocalPath delegates to the local primary.
    expect(covers.driver.getLocalPath!('covers/x.jpg')).toBe(
      path.join(fs.realpathSync(uploadsRoot), 'covers/x.jpg'),
    );
  });

  it.each([
    ['unknown backend name in categories', undefined, JSON.stringify({ files: 'nope' })],
    [
      'nested mirror',
      JSON.stringify([
        { name: 'extra-local', type: 'local', options: { root: '/tmp/x' } },
        { name: 'm1', type: 'mirror', options: { primary: 'backups-local', replicas: ['extra-local'] } },
        { name: 'm2', type: 'mirror', options: { primary: 'm1', replicas: [] } },
      ]),
      JSON.stringify({ backups: 'm2' }),
    ],
    [
      'settings s3 backend with invalid options',
      JSON.stringify([{ name: 'x', type: 's3', options: {} }]),
      undefined,
    ],
    ['unknown category name', undefined, JSON.stringify({ 'not-a-category': 'uploads-local' })],
    ['retired photos category in settings', undefined, JSON.stringify({ photos: 'uploads-local' })],
    ['malformed JSON', 'not json at all', undefined],
  ])('falls back to built-in defaults at boot on invalid settings: %s', (_label, backendsRow, categoriesRow) => {
    const { registry } = makeRegistry({ boot: false });
    if (backendsRow !== undefined) setSetting('storage.backends', backendsRow);
    if (categoriesRow !== undefined) setSetting('storage.categories', categoriesRow);
    registry.onModuleInit();

    expect(registry.resolve('files').backendName).toBe('uploads-local');
    expect(registry.resolve('backups').backendName).toBe('backups-local');
  });

  it('lastLoadError() is null on a clean boot', () => {
    const { registry } = makeRegistry();
    expect(registry.lastLoadError()).toBeNull();
  });

  it.each([
    ['unknown backend name in categories', undefined, JSON.stringify({ files: 'nope' })],
    ['malformed JSON', 'not json at all', undefined],
  ])(
    'lastLoadError() records the exact failure at boot and stays set (silent-fallback audit minor): %s',
    (_label, backendsRow, categoriesRow) => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const { registry } = makeRegistry({ boot: false });
      if (backendsRow !== undefined) setSetting('storage.backends', backendsRow);
      if (categoriesRow !== undefined) setSetting('storage.categories', categoriesRow);
      registry.onModuleInit();

      expect(registry.lastLoadError()).not.toBeNull();
      // Still resolves on built-in defaults — the fallback itself is unchanged,
      // only the silence around it.
      expect(registry.resolve('files').backendName).toBe('uploads-local');
    },
  );

  it('a malformed row never leaks a secret-looking token into lastLoadError() (admin-facing configError)', () => {
    // JSON.parse's own SyntaxError can echo a snippet of the raw input around
    // the failure position (Node 24 V8) — an unquoted value like this is
    // exactly the shape a corrupted/hand-edited secretAccessKey row takes.
    // lastLoadError() must never carry that snippet through to the
    // admin-facing configError banner.
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { registry } = makeRegistry({ boot: false });
    const secretToken = 'AKIA_SUPER_SECRET_TOKEN_1234567890';
    setSetting('storage.backends', `{"secretAccessKey": ${secretToken}_undefined_broken}`);
    registry.onModuleInit();

    const err = registry.lastLoadError();
    expect(err).not.toBeNull();
    expect(err).not.toContain(secretToken);
    expect(err).not.toContain('secretAccessKey');
    expect(err).toContain("'storage.backends' contains malformed JSON");
  });

  it('lastLoadError() clears on the next successful load/reload', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { registry } = makeRegistry({ boot: false });
    setSetting('storage.categories', 'garbage {');
    registry.onModuleInit();
    expect(registry.lastLoadError()).not.toBeNull();

    setSetting('storage.categories', '{}');
    registry.reload();
    expect(registry.lastLoadError()).toBeNull();
  });

  it('keeps the last-good config (not defaults) when a reload() sees invalid settings', () => {
    const nasRoot = makeTmpDir();
    const { registry } = makeRegistry({
      backends: [
        { name: 'nas-backups', type: 'local', options: { root: nasRoot } },
        { name: 'backup-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas-backups'] } },
      ],
      categories: { backups: 'backup-mirror' },
    });
    expect(registry.resolve('backups').backendName).toBe('backup-mirror');

    setSetting('storage.categories', 'garbage {');
    registry.reload();

    // last-good, i.e. the mirror config — NOT the built-in defaults
    expect(registry.resolve('backups').backendName).toBe('backup-mirror');
    // ...and the operator can find out about it (audit minor: this used to be silent).
    expect(registry.lastLoadError()).toBeTruthy();
  });
});

// ── reload semantics ──────────────────────────────────────────────────────────

describe('StorageRegistryService reload', () => {
  it('swaps the map atomically: new resolves see the new instance, held refs stay usable', async () => {
    const { registry, setUploadsRoot } = makeRegistry();
    const before = registry.resolve('files');
    await before.driver.put('files/pre-reload.bin', Readable.from('old root'));

    setUploadsRoot(makeTmpDir());
    registry.reload();

    const after = registry.resolve('files');
    expect(after.driver).not.toBe(before.driver);
    expect(await after.driver.stat('files/pre-reload.bin')).toBeNull(); // new root is empty

    // in-flight semantics: the held old driver still serves reads
    const { stream } = await before.driver.getStream('files/pre-reload.bin');
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(Buffer.from(c as Buffer));
    expect(Buffer.concat(chunks).toString()).toBe('old root');
  });

  it('cleans spool leftovers at boot only, never on reload()', () => {
    const uploadsRoot = makeTmpDir();
    const stray = path.join(uploadsRoot, '.tmp', 'in-flight.part');

    fs.mkdirSync(path.dirname(stray), { recursive: true });
    fs.writeFileSync(stray, 'crash leftover');
    // Aged past the reap gate: the boot sweep spares fresh entries (another
    // process may be spooling into the same tree — see LocalDriver.init).
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(stray, old, old);
    const { registry } = makeRegistry({ uploadsRoot });
    expect(fs.existsSync(stray)).toBe(false); // boot reclaimed it

    fs.writeFileSync(stray, 'in-flight upload');
    registry.reload();
    expect(fs.existsSync(stray)).toBe(true); // reload must not touch it
  });
});

// ── assignCategory ────────────────────────────────────────────────────────────

describe('StorageRegistryService assignCategory', () => {
  it('REG-ASSIGN-001 throws on an unknown backend and persists nothing (belt-and-braces alongside the migration job\'s own guard)', () => {
    const { registry } = makeRegistry();
    const before = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.categories'").get() as
      | { value: string }
      | undefined;

    expect(() => registry.assignCategory('files', 'ghost-backend')).toThrow(
      "cannot assign 'files' to unknown backend 'ghost-backend'",
    );

    const after = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.categories'").get() as
      | { value: string }
      | undefined;
    expect(after).toEqual(before); // no write happened
    expect(registry.snapshot().categories.files.backend).toBe('uploads-local'); // unchanged
  });

  it('REG-ASSIGN-002 assigns and persists when the backend exists', () => {
    const { registry } = makeRegistry({ backends: [{ name: 'dest-local', type: 'local', options: { root: makeTmpDir() } }] });

    registry.assignCategory('files', 'dest-local');

    expect(registry.snapshot().categories.files.backend).toBe('dest-local');
    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.categories'").get() as {
      value: string;
    };
    expect((JSON.parse(row.value) as Record<string, string>).files).toBe('dest-local');
  });

  it('REG-ASSIGN-003 bumps the shared optimistic-concurrency version counter by exactly one, in the same write (audit #7)', () => {
    const { registry } = makeRegistry({ backends: [{ name: 'dest-local', type: 'local', options: { root: makeTmpDir() } }] });
    expect(registry.currentConfigVersion()).toBe(0);

    registry.assignCategory('files', 'dest-local');
    expect(registry.currentConfigVersion()).toBe(1);

    registry.assignCategory('journey', 'dest-local');
    expect(registry.currentConfigVersion()).toBe(2);

    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = 'storage.config_version'").get() as
      | { value: string }
      | undefined;
    expect(row?.value).toBe('2');
  });

  it('REG-ASSIGN-004 an unknown-backend refusal bumps nothing — the version write shares the categories transaction', () => {
    const { registry } = makeRegistry();
    expect(() => registry.assignCategory('files', 'ghost-backend')).toThrow();
    expect(registry.currentConfigVersion()).toBe(0);
  });

  it('REG-ASSIGN-005 refuses the migration flip onto a backend that is currently a mirror replica (validateConfig, other direction)', () => {
    const { registry } = makeRegistry({
      backends: [
        { name: 'nas-backups', type: 'local', options: { root: makeTmpDir() } },
        { name: 'backups-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas-backups'] } },
      ],
      categories: { backups: 'backups-mirror' },
    });

    expect(() => registry.assignCategory('files', 'nas-backups')).toThrow(
      /cannot assign 'files' to 'nas-backups' — 'nas-backups' is a mirror replica of 'backups-mirror'/,
    );
    expect(registry.snapshot().categories.files.backend).toBe('uploads-local'); // unchanged
    expect(registry.currentConfigVersion()).toBe(0); // nothing written
  });

  it('REG-ASSIGN-006 refuses the flip onto a MIRROR whose primary is a replica of another mirror', () => {
    const { registry } = makeRegistry({
      backends: [
        { name: 'nas', type: 'local', options: { root: makeTmpDir() } },
        { name: 'extra', type: 'local', options: { root: makeTmpDir() } },
        { name: 'nas-mirror', type: 'mirror', options: { primary: 'nas', replicas: ['extra'] } },
        { name: 'backups-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
      ],
      categories: { backups: 'backups-mirror' },
    });

    expect(() => registry.assignCategory('files', 'nas-mirror')).toThrow(
      /cannot assign 'files' to 'nas-mirror' — 'nas' is a mirror replica of 'backups-mirror'/,
    );
    expect(registry.currentConfigVersion()).toBe(0);
  });
});

// ── replica-failure health ────────────────────────────────────────────────────

describe('StorageRegistryService replica health', () => {
  it('keeps a bounded ring of replica failures (last 50)', () => {
    const { registry } = makeRegistry();
    for (let i = 0; i < 60; i++) {
      registry.recordReplicaFailure({
        backend: 'nas-backups',
        key: `backup-${i}.zip`,
        op: 'put',
        error: 'disk full',
        at: i,
      } satisfies ReplicaFailure);
    }
    const failures = registry.replicaFailures();
    expect(failures).toHaveLength(50);
    expect(failures[0].key).toBe('backup-10.zip'); // oldest 10 dropped
    expect(failures[49].key).toBe('backup-59.zip');
  });
});

// ── settings-declared s3 backends (admin-config slice: acceptance) ───────────

describe('settings-declared s3 backends', () => {
  const s3Options = {
    endpoint: 'http://127.0.0.1:9000',
    bucket: 'trek',
    accessKeyId: 'ak',
    secretAccessKey: 'sk-plain',
    region: 'us-east-1',
    keyPrefix: '',
    retries: 1,
    timeoutMs: 30000,
  };

  it('accepts a settings s3 backend and assigns it to a category', () => {
    const { registry } = makeRegistry({
      backends: [{ name: 'off-box', type: 's3', options: s3Options }],
      categories: { covers: 'off-box' },
    });
    const resolved = registry.resolve('covers');
    expect(resolved.backendName).toBe('off-box');
    expect(resolved.driver).toBeInstanceOf(S3Driver);
    expect(resolved.keyPrefix).toBe('covers/');
  });

  it('decrypts an enc:v1: secretAccessKey at build (decrypt-at-build)', () => {
    const { registry } = makeRegistry({
      backends: [{ name: 'off-box', type: 's3', options: { ...s3Options, secretAccessKey: encrypt_api_key('sk-secret') } }],
      categories: { backups: 'off-box' },
    });
    expect(registry.resolve('backups').driver).toBeInstanceOf(S3Driver);
  });

  it('applies the shared-schema defaults for omitted optional fields', () => {
    const { endpoint, bucket, accessKeyId, secretAccessKey } = s3Options;
    const { registry } = makeRegistry({
      backends: [{ name: 'off-box', type: 's3', options: { endpoint, bucket, accessKeyId, secretAccessKey } }],
      categories: { backups: 'off-box' },
    });
    expect(registry.resolve('backups').backendName).toBe('off-box');
  });

  it('serves as a mirror replica (local primary + settings s3 replica on backups)', () => {
    const nasRoot = makeTmpDir();
    const { registry } = makeRegistry({
      backends: [
        { name: 'off-box', type: 's3', options: s3Options },
        { name: 'nas-backups', type: 'local', options: { root: nasRoot } },
        { name: 'backup-mirror', type: 'mirror', options: { primary: 'nas-backups', replicas: ['off-box'] } },
      ],
      categories: { backups: 'backup-mirror' },
    });
    expect(registry.resolve('backups').backendName).toBe('backup-mirror');
    expect(registry.resolve('backups').driver).toBeInstanceOf(MirrorDriver);
  });

  it('falls back with the pinned message when s3 options fail the shared schema', () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { registry } = makeRegistry({
      backends: [{ name: 'off-box', type: 's3', options: { ...s3Options, endpoint: 'not a url' } }],
    });
    expect(registry.resolve('backups').backendName).toBe('backups-local');
    const logged = errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(logged).toContain("s3 backend 'off-box' has invalid options — endpoint:");
  });

  it('falls back with the pinned message when the ciphertext cannot be decrypted', () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { registry } = makeRegistry({
      backends: [{ name: 'off-box', type: 's3', options: { ...s3Options, secretAccessKey: 'enc:v1:AAAA' } }],
      categories: { backups: 'off-box' },
    });
    expect(registry.resolve('backups').backendName).toBe('backups-local');
    const logged = errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(logged).toContain("s3 backend 'off-box': could not decrypt 'secretAccessKey'");
  });
});

// ── preview() — admin writes never take the silent fallback ──────────────────

describe('preview()', () => {
  it('throws the exact registry error for an invalid candidate and mutates nothing', () => {
    const { registry } = makeRegistry();
    const before = registry.resolve('backups').driver;
    expect(() =>
      registry.preview({ backends: [], categories: { backups: 'nope' } }),
    ).toThrow("category 'backups' maps to unknown backend 'nope'");
    expect(registry.resolve('backups').driver).toBe(before); // same instance — state untouched
  });

  it('accepts a valid candidate without changing resolution', () => {
    const nasRoot = makeTmpDir();
    const { registry } = makeRegistry();
    const before = registry.resolve('backups').driver;
    registry.preview({
      backends: [{ name: 'nas-backups', type: 'local', options: { root: nasRoot } }],
      categories: { backups: 'nas-backups' },
    });
    expect(registry.resolve('backups').driver).toBe(before);
    expect(registry.resolve('backups').backendName).toBe('backups-local');
  });
});

// ── shared replica backends (audit critical: the backfill deletion sweep) ─────
//
// A mirror's "Sync now" sweep DELETES replica keys under the swept category
// prefixes that the primary doesn't hold. `backups` sweeps prefix '' — the
// replica's ENTIRE root — so any backend that is both a replica and a category
// target would have that category's objects swept away by the first sync. The
// sweep itself is correct; the fix is that no config can express the setup.

describe('StorageRegistryService shared-replica refusals', () => {
  it('REG-SHARED-001 refuses the config that would let a backups sync sweep another category\'s objects (uploads-local as a backups-mirror replica)', () => {
    const { registry } = makeRegistry();
    expect(() =>
      registry.preview({
        backends: [
          { name: 'nas-backups', type: 'local', options: { root: makeTmpDir() } },
          { name: 'backups-mirror', type: 'mirror', options: { primary: 'nas-backups', replicas: ['uploads-local'] } },
        ],
        categories: { backups: 'backups-mirror' },
      }),
    ).toThrow(/backend 'uploads-local' is a mirror replica of 'backups-mirror' and also serves category/);
  });

  it('REG-SHARED-002 refuses a replica that serves a category as ANOTHER mirror\'s primary', () => {
    const { registry } = makeRegistry();
    expect(() =>
      registry.preview({
        backends: [
          { name: 'nas', type: 'local', options: { root: makeTmpDir() } },
          { name: 'extra', type: 'local', options: { root: makeTmpDir() } },
          { name: 'files-mirror', type: 'mirror', options: { primary: 'nas', replicas: ['extra'] } },
          { name: 'backups-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
        ],
        categories: { files: 'files-mirror', backups: 'backups-mirror' },
      }),
    ).toThrow(/backend 'nas' is a mirror replica of 'backups-mirror' and also serves category 'files'/);
  });

  it('REG-SHARED-003 refuses one backend replicating two mirrors whose swept prefixes overlap (\'\' overlaps everything)', () => {
    const { registry } = makeRegistry();
    expect(() =>
      registry.preview({
        backends: [
          { name: 'nas', type: 'local', options: { root: makeTmpDir() } },
          { name: 'p1', type: 'local', options: { root: makeTmpDir() } },
          { name: 'p2', type: 'local', options: { root: makeTmpDir() } },
          { name: 'm-backups', type: 'mirror', options: { primary: 'p1', replicas: ['nas'] } },
          { name: 'm-files', type: 'mirror', options: { primary: 'p2', replicas: ['nas'] } },
        ],
        categories: { backups: 'm-backups', files: 'm-files' },
      }),
    ).toThrow(/backend 'nas' replicates both 'm-backups' and 'm-files', whose swept key prefixes overlap/);
  });

  it('REG-SHARED-004 accepts one backend replicating two mirrors with DISJOINT swept prefixes', () => {
    const { registry } = makeRegistry();
    expect(() =>
      registry.preview({
        backends: [
          { name: 'nas', type: 'local', options: { root: makeTmpDir() } },
          { name: 'p1', type: 'local', options: { root: makeTmpDir() } },
          { name: 'p2', type: 'local', options: { root: makeTmpDir() } },
          { name: 'm-files', type: 'mirror', options: { primary: 'p1', replicas: ['nas'] } },
          { name: 'm-covers', type: 'mirror', options: { primary: 'p2', replicas: ['nas'] } },
        ],
        categories: { files: 'm-files', covers: 'm-covers' },
      }),
    ).not.toThrow();
  });

  it('REG-SHARED-005 still accepts the ordinary shape: a dedicated, unassigned replica', () => {
    const { registry } = makeRegistry();
    expect(() =>
      registry.preview({
        backends: [
          { name: 'nas-backups', type: 'local', options: { root: makeTmpDir() } },
          { name: 'backups-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas-backups'] } },
        ],
        categories: { backups: 'backups-mirror' },
      }),
    ).not.toThrow();
  });
});

// ── seed-once boot import ─────────────────────────────────────────────────────

describe('seed-once storage-config.json import', () => {
  const nasRoot = () => makeTmpDir();

  function writeSeed(content: string): void {
    fs.mkdirSync(path.dirname(SEED_CONFIG_PATH), { recursive: true });
    fs.writeFileSync(SEED_CONFIG_PATH, content);
  }

  /** A registry with NO storage.* rows (makeRegistry seeds an override row, so build raw). */
  function makeUnseededRegistry() {
    const stub = makeEnvStub({});
    return new StorageRegistryService(db, stub.env, new StorageEventsService());
  }

  function readRow(key: string): string | undefined {
    const row = testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
      | { value: string }
      | undefined;
    return row?.value;
  }

  afterEach(() => {
    fs.rmSync(SEED_CONFIG_PATH, { force: true });
  });

  it('SEED-001 imports a valid file when no rows exist: encrypted rows, live drivers, pinned log', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const root = nasRoot();
    writeSeed(
      JSON.stringify({
        backends: [
          { name: 'nas-backups', type: 'local', options: { root } },
          {
            name: 'off-box',
            type: 's3',
            options: {
              endpoint: 'http://127.0.0.1:9000',
              bucket: 'trek',
              accessKeyId: 'ak',
              secretAccessKey: 'sk-seed',
            },
          },
        ],
        categories: { backups: 'off-box' },
      }),
    );
    const registry = makeUnseededRegistry();
    registry.onModuleInit();

    expect(registry.resolve('backups').driver).toBeInstanceOf(S3Driver);
    const storedBackends = JSON.parse(readRow('storage.backends')!) as Array<{
      name: string;
      options: Record<string, unknown>;
    }>;
    const offBox = storedBackends.find((b) => b.name === 'off-box')!;
    expect(String(offBox.options.secretAccessKey).startsWith('enc:v1:')).toBe(true); // never plaintext at rest
    expect(readRow('storage.categories')).toBe(JSON.stringify({ backups: 'off-box' }));
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('storage config seeded from');
    expect(logged).toContain('the file is now ignored; manage storage in the admin UI');
  });

  it('SEED-002 rows exist → file not read, pinned ignore log, rows unchanged', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    writeSeed('{ this would explode if parsed');
    const { registry } = makeRegistry(); // helper writes the uploads override row
    expect(registry.resolve('files').backendName).toBe('uploads-local');
    const logged = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('storage config rows exist — ignoring');
  });

  it('SEED-003 no rows, no file → boots on built-in defaults (no seed side effects)', () => {
    const registry = makeUnseededRegistry();
    registry.onModuleInit();
    expect(registry.resolve('backups').backendName).toBe('backups-local');
    expect(readRow('storage.backends')).toBeUndefined();
  });

  it('SEED-004 unparseable JSON aborts boot with the exact error', () => {
    writeSeed('not json at all');
    const registry = makeUnseededRegistry();
    expect(() => registry.onModuleInit()).toThrow(/invalid storage seed file .*storage-config\.json: /);
  });

  it('SEED-005 schema violation aborts boot — including the reserved readOnly key', () => {
    writeSeed(JSON.stringify({ backends: [], categories: {}, readOnly: true }));
    expect(() => makeUnseededRegistry().onModuleInit()).toThrow(/invalid storage seed file/);
  });

  it('SEED-006 semantic violation aborts boot with the registry error verbatim', () => {
    writeSeed(JSON.stringify({ backends: [], categories: { backups: 'nope' } }));
    expect(() => makeUnseededRegistry().onModuleInit()).toThrow(
      /category 'backups' maps to unknown backend 'nope'/,
    );
  });

  it('SEED-007 a plaintext-secret seed imports without an explicit ENCRYPTION_KEY and encrypts at rest', () => {
    writeSeed(
      JSON.stringify({
        backends: [
          {
            name: 'off-box',
            type: 's3',
            options: {
              endpoint: 'http://127.0.0.1:9000',
              bucket: 'trek',
              accessKeyId: 'ak',
              secretAccessKey: 'sk-seed',
            },
          },
        ],
        categories: {},
      }),
    );
    const registry = makeUnseededRegistry();
    registry.onModuleInit();
    // No key-presence gate: the implicit key covers encryption when
    // ENCRYPTION_KEY is unset, and the plaintext never persists.
    const row = readRow('storage.backends')!;
    expect(row).not.toContain('sk-seed');
    expect(row).toContain('enc:v1:');
  });

  it('SEED-008 a mask sentinel in the seed file aborts boot', () => {
    writeSeed(
      JSON.stringify({
        backends: [
          {
            name: 'off-box',
            type: 's3',
            options: {
              endpoint: 'http://127.0.0.1:9000',
              bucket: 'trek',
              accessKeyId: 'ak',
              secretAccessKey: '••••••••',
            },
          },
        ],
        categories: {},
      }),
    );
    expect(() => makeUnseededRegistry().onModuleInit()).toThrow(/mask/);
  });

  it('SEED-009 a second boot after a successful seed ignores the file (seed-once)', () => {
    const root = nasRoot();
    writeSeed(JSON.stringify({ backends: [{ name: 'nas', type: 'local', options: { root } }], categories: { backups: 'nas' } }));
    makeUnseededRegistry().onModuleInit();
    const firstRow = readRow('storage.backends');

    writeSeed(JSON.stringify({ backends: [], categories: { backups: 'other' } })); // would fail preview if read
    const second = makeUnseededRegistry();
    second.onModuleInit(); // must not throw — rows exist, file ignored
    expect(readRow('storage.backends')).toBe(firstRow);
    expect(second.resolve('backups').backendName).toBe('nas');
  });

  it('SEED-010 an all-encrypted seed imports and keeps its ciphertext byte-for-byte', () => {
    const cipher = encrypt_api_key('sk-seed');
    writeSeed(
      JSON.stringify({
        backends: [
          {
            name: 'off-box',
            type: 's3',
            options: {
              endpoint: 'http://127.0.0.1:9000',
              bucket: 'trek',
              accessKeyId: 'ak',
              secretAccessKey: cipher,
            },
          },
        ],
        categories: { backups: 'off-box' },
      }),
    );
    const registry = makeUnseededRegistry();
    registry.onModuleInit();
    // enc:v1: values pass through the idempotent encrypt — the ciphertext
    // must persist byte-for-byte.
    expect(registry.resolve('backups').driver).toBeInstanceOf(S3Driver);
    expect(readRow('storage.backends')).toContain(cipher);
  });
});

// ── snapshot() — effective world with provenance ──────────────────────────────

describe('snapshot()', () => {
  it('reports built-ins, env backends, and settings entries with their sources', () => {
    const photoDir = makeTmpDir();
    const nasRoot = makeTmpDir();
    const { registry, uploadsRoot } = makeRegistry({
      placePhotoDir: photoDir,
      backends: [{ name: 'nas-backups', type: 'local', options: { root: nasRoot } }],
      categories: { backups: 'nas-backups' },
    });
    const snap = registry.snapshot();
    const byName = new Map(snap.backends.map((b) => [b.name, b]));

    // uploads-local is overridden by the helper's settings row → source 'settings'
    expect(byName.get('uploads-local')).toMatchObject({ type: 'local', source: 'settings', options: { root: uploadsRoot } });
    expect(byName.get('backups-local')).toMatchObject({ source: 'built-in' });
    expect(byName.get('place-photos-local')).toMatchObject({ source: 'env', options: { root: photoDir } });
    expect(byName.get('nas-backups')).toMatchObject({ source: 'settings' });

    expect(snap.categories.backups).toEqual({ backend: 'nas-backups', source: 'settings' });
    expect(snap.categories.files).toEqual({ backend: 'uploads-local', source: 'default' });
    expect(snap.categories['photos-google']).toEqual({ backend: 'place-photos-local', source: 'default' });
    expect(Object.keys(snap.categories).sort()).toEqual([...STORAGE_CATEGORIES].sort());
  });

  it('reports pure built-in defaults when no settings rows exist', () => {
    const { registry } = makeRegistry({ boot: false });
    testDb.prepare("DELETE FROM app_settings WHERE key = 'storage.backends'").run();
    registry.onModuleInit();
    const snap = registry.snapshot();
    expect(snap.backends.map((b) => [b.name, b.source])).toEqual([
      ['uploads-local', 'built-in'],
      ['backups-local', 'built-in'],
    ]);
  });

  it('keeps encrypted secrets encrypted in the snapshot (never plaintext)', () => {
    const cipher = encrypt_api_key('sk-secret');
    const { registry } = makeRegistry({
      backends: [
        {
          name: 'off-box',
          type: 's3',
          options: {
            endpoint: 'http://127.0.0.1:9000',
            bucket: 'trek',
            accessKeyId: 'ak',
            secretAccessKey: cipher,
          },
        },
      ],
      categories: { backups: 'off-box' },
    });
    const offBox = registry.snapshot().backends.find((b) => b.name === 'off-box')!;
    expect(offBox.options.secretAccessKey).toBe(cipher); // byte-identical ciphertext
    expect(offBox.options).toMatchObject({ region: 'us-east-1', retries: 1 }); // schema defaults visible
  });

  it('shows the last-good world after an invalid reload (snapshot = live state)', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { registry } = makeRegistry();
    const before = registry.snapshot();
    setSetting('storage.categories', 'garbage {');
    registry.reload();
    expect(registry.snapshot()).toEqual(before);
  });
});
