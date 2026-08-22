import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
});
vi.mock('../../../../src/db/database', () => dbMock);
vi.mock('../../../../src/config', () => ({ ENCRYPTION_KEY: 'storage-admin-test-key' }));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Logger } from '@nestjs/common';
import { MASKED_SETTING_VALUE, type StorageConfig } from '@trek/shared';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { encrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import { StorageAdminService } from '../../../../src/nest/storage/storage-admin.service';
import { StorageEventsService } from '../../../../src/nest/storage/storage-events.service';
import { StorageJobsService } from '../../../../src/nest/storage/storage-jobs.service';
import { StorageStatsService } from '../../../../src/nest/storage/storage-stats.service';
import { StorageRegistryService, BACKENDS_KEY, CATEGORIES_KEY } from '../../../../src/nest/storage/storage-registry.service';
import { StorageService } from '../../../../src/nest/storage/storage.service';
import { StorageConflictError } from '../../../../src/nest/storage/storage.types';

const db = new DatabaseService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

const tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-storage-admin-'));
  tmpDirs.push(dir);
  return dir;
}
function setSetting(key: string, value: string): void {
  testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}
function readRow(key: string): string | undefined {
  const row = testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

const S3_OPTIONS = {
  endpoint: 'http://127.0.0.1:9000',
  bucket: 'trek',
  accessKeyId: 'ak',
  secretAccessKey: 'sk-plain',
  region: 'us-east-1',
  keyPrefix: '',
  retries: 1,
  timeoutMs: 30000,
};

/** Real registry + real service over the in-memory DB. */
function makeService(opts: { uploadsRoot?: string } = {}) {
  const uploadsRoot = opts.uploadsRoot ?? makeTmpDir();
  setSetting(BACKENDS_KEY, JSON.stringify([{ name: 'uploads-local', type: 'local', options: { root: uploadsRoot } }]));
  const env = { env: () => ({ paths: {} }) } as unknown as RuntimeEnvService;
  const registry = new StorageRegistryService(db, env, new StorageEventsService());
  registry.onModuleInit();
  const storage = new StorageService(registry);
  const jobs = new StorageJobsService(registry);
  const stats = new StorageStatsService(storage, db);
  const service = new StorageAdminService(db, registry, storage, jobs, stats);
  return { service, registry, uploadsRoot, stats, jobs };
}

/** The settings-owned document the service persists (uploads override + extras). */
function configWith(uploadsRoot: string, extra: Partial<StorageConfig> = {}): StorageConfig {
  return {
    backends: [
      { name: 'uploads-local', type: 'local', options: { root: uploadsRoot } },
      ...(extra.backends ?? []),
    ],
    categories: extra.categories ?? {},
  };
}

/**
 * applyConfig now requires the current version (optimistic concurrency,
 * audit #7) — most tests just want "the current one", read fresh at call
 * time so a second call in the same test picks up the bump from the first.
 */
function put(service: StorageAdminService, config: StorageConfig): void {
  service.applyConfig({ ...config, version: service.state().version });
}

beforeEach(() => {
  testDb.prepare("DELETE FROM app_settings WHERE key LIKE 'storage.%'").run();
});
afterEach(() => {
  vi.restoreAllMocks();
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe('StorageAdminService.state', () => {
  it('STORADM-001 renders the effective world: sources, categories-per-backend, flags', () => {
    const { service, uploadsRoot } = makeService();
    const state = service.state();
    const uploads = state.backends.find((b) => b.name === 'uploads-local')!;
    expect(uploads).toMatchObject({ type: 'local', source: 'settings', options: { root: uploadsRoot } });
    expect(uploads.categories).toContain('files');
    expect(uploads.categories).not.toContain('backups');
    expect(state.backends.find((b) => b.name === 'backups-local')).toMatchObject({ source: 'built-in' });
    expect(state.categories.backups).toEqual({ backend: 'backups-local', source: 'default' });
    expect(state.seedFilePresent).toBe(false);
    expect(state.health).toEqual({ replicaFailures: [] });
  });

  it('STORADM-002 masks exactly the secret fields (accessKeyId stays visible)', () => {
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: S3_OPTIONS }],
      categories: { backups: 'off-box' },
    }));
    const offBox = service.state().backends.find((b) => b.name === 'off-box')!;
    expect(offBox.options.secretAccessKey).toBe(MASKED_SETTING_VALUE);
    expect(offBox.options.accessKeyId).toBe('ak');
  });

  it('STORADM-003 surfaces replica failures through StorageService.health()', () => {
    const { service, registry } = makeService();
    registry.recordReplicaFailure({ backend: 'nas', key: 'backup-1.zip', op: 'put', error: 'disk full', at: 123 });
    expect(service.state().health.replicaFailures).toEqual([
      { backend: 'nas', key: 'backup-1.zip', op: 'put', error: 'disk full', at: 123 },
    ]);
  });

  it('STORADM-027 configError is null on a clean load, and mirrors registry.lastLoadError() after a bad reload', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { service, registry } = makeService();
    expect(service.state().configError).toBeNull();

    setSetting(CATEGORIES_KEY, 'garbage {');
    registry.reload();
    expect(service.state().configError).toBe(registry.lastLoadError());
    expect(service.state().configError).not.toBeNull();
  });

  it('STORADM-026 state embeds usage (null until computed) and live backfill statuses', async () => {
    const { service, stats } = makeService();
    expect(service.state().usage).toBeNull();
    expect(service.state().backfills).toEqual([]);
    await stats.scan();
    expect(service.state().usage).not.toBeNull();
    expect(service.state().usage!.computedAt).toBeGreaterThan(0);
  });
});

describe('StorageAdminService.applyConfig', () => {
  it('STORADM-010 happy path: persists both rows, reloads, new config is live', () => {
    const { service, registry, uploadsRoot } = makeService();
    const nasRoot = makeTmpDir();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'nas-backups', type: 'local', options: { root: nasRoot } }],
      categories: { backups: 'nas-backups' },
    }));
    expect(registry.resolve('backups').backendName).toBe('nas-backups'); // reload() ran
    expect(JSON.parse(readRow(CATEGORIES_KEY)!)).toEqual({ backups: 'nas-backups' });
  });

  it('STORADM-011 encrypts plaintext secrets at rest', () => {
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: S3_OPTIONS }],
      categories: { backups: 'off-box' },
    }));
    const stored = JSON.parse(readRow(BACKENDS_KEY)!) as Array<{ name: string; options: Record<string, unknown> }>;
    const secret = String(stored.find((b) => b.name === 'off-box')!.options.secretAccessKey);
    expect(secret.startsWith('enc:v1:')).toBe(true);
  });

  it('STORADM-012 mask echo preserves the stored ciphertext byte-for-byte', () => {
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: S3_OPTIONS }],
      categories: { backups: 'off-box' },
    }));
    const before = JSON.parse(readRow(BACKENDS_KEY)!) as Array<{ name: string; options: Record<string, unknown> }>;
    const cipherBefore = before.find((b) => b.name === 'off-box')!.options.secretAccessKey;

    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, secretAccessKey: MASKED_SETTING_VALUE } }],
      categories: { backups: 'off-box' },
    }));
    const after = JSON.parse(readRow(BACKENDS_KEY)!) as Array<{ name: string; options: Record<string, unknown> }>;
    expect(after.find((b) => b.name === 'off-box')!.options.secretAccessKey).toBe(cipherBefore);
  });

  it('STORADM-013 a mask on a renamed/new backend throws the re-enter error, persists nothing', () => {
    const { service, uploadsRoot } = makeService();
    const before = readRow(BACKENDS_KEY);
    expect(() =>
      put(service, configWith(uploadsRoot, {
        backends: [{ name: 'brand-new', type: 's3', options: { ...S3_OPTIONS, secretAccessKey: MASKED_SETTING_VALUE } }],
        categories: {},
      })),
    ).toThrow("re-enter the secret 'secretAccessKey' for 'brand-new'");
    expect(readRow(BACKENDS_KEY)).toBe(before);
  });

  it('STORADM-014 a plaintext secret saves without an explicit ENCRYPTION_KEY and is still encrypted at rest', () => {
    // No key-presence gate: the implicit key covers encryption when ENCRYPTION_KEY is unset.
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: S3_OPTIONS }],
      categories: {},
    }));
    const stored = JSON.parse(readRow(BACKENDS_KEY)!) as Array<{ name: string; options: Record<string, string> }>;
    const offBox = stored.find((b) => b.name === 'off-box')!;
    expect(offBox.options.secretAccessKey.startsWith('enc:v1:')).toBe(true);
  });

  it('STORADM-015 an encrypted (mask-echoed or enc:v1:) secret resaves fine', () => {
    // Resaving stored ciphertext must not lock admins out.
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, secretAccessKey: encrypt_api_key('sk') } }],
      categories: { backups: 'off-box' },
    }));
    expect(readRow(BACKENDS_KEY)).toBeDefined();
  });

  it('STORADM-016 preview() refusals surface verbatim and persist nothing', () => {
    const { service, uploadsRoot, registry } = makeService();
    const before = readRow(CATEGORIES_KEY);
    expect(() =>
      put(service, configWith(uploadsRoot, { categories: { backups: 'nope' } })),
    ).toThrow("category 'backups' maps to unknown backend 'nope'");
    expect(readRow(CATEGORIES_KEY)).toBe(before);
    expect(registry.resolve('backups').backendName).toBe('backups-local'); // live state untouched
  });

  it('STORADM-018 a mask sentinel in a NON-secret field throws and persists nothing', () => {
    const { service, uploadsRoot } = makeService();
    const before = readRow(BACKENDS_KEY);
    expect(() =>
      put(service, configWith(uploadsRoot, {
        backends: [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, accessKeyId: MASKED_SETTING_VALUE } }],
        categories: {},
      })),
    ).toThrow("backend 'off-box' field 'accessKeyId' is the mask sentinel — a mask can never become a stored value");
    expect(readRow(BACKENDS_KEY)).toBe(before);
  });

  it('STORADM-017 persists both rows in ONE transaction and reloads once', () => {
    const { service, registry, uploadsRoot } = makeService();
    const txSpy = vi.spyOn(db, 'transaction');
    const reloadSpy = vi.spyOn(registry, 'reload');
    put(service, configWith(uploadsRoot));
    expect(txSpy).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('STORADM-019 applyConfig invokes the dissolved-job cancellation after reload', () => {
    const { service, registry, uploadsRoot, jobs } = makeService();
    const reloadSpy = vi.spyOn(registry, 'reload');
    const cancelSpy = vi.spyOn(jobs, 'cancelJobsForMissingBackends');
    put(service, configWith(uploadsRoot));
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    const reloadOrder = reloadSpy.mock.invocationCallOrder[0]!;
    const cancelOrder = cancelSpy.mock.invocationCallOrder[0]!;
    expect(cancelOrder).toBeGreaterThan(reloadOrder);
  });

  it('STORADM-030 a successful save bumps the version counter by exactly one', () => {
    const { service, uploadsRoot } = makeService();
    expect(service.state().version).toBe(0);
    put(service, configWith(uploadsRoot));
    expect(service.state().version).toBe(1);
    put(service, configWith(uploadsRoot));
    expect(service.state().version).toBe(2);
  });

  it('STORADM-031 a stale submitted version throws StorageConflictError and persists nothing (→ 409, audit #7)', () => {
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot)); // version is now 1
    const beforeBackends = readRow(BACKENDS_KEY);
    const beforeCategories = readRow(CATEGORIES_KEY);
    expect(() =>
      service.applyConfig({ ...configWith(uploadsRoot), version: 0 }), // stale — current is 1
    ).toThrow(StorageConflictError);
    try {
      service.applyConfig({ ...configWith(uploadsRoot), version: 0 });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(StorageConflictError);
      expect((err as StorageConflictError).currentVersion).toBe(1);
      expect((err as StorageConflictError).submittedVersion).toBe(0);
    }
    expect(readRow(BACKENDS_KEY)).toBe(beforeBackends);
    expect(readRow(CATEGORIES_KEY)).toBe(beforeCategories);
    expect(service.state().version).toBe(1); // unchanged — the conflicting save never wrote
  });

  it('STORADM-032 the version check runs before preview/unmask — a stale submit never reaches those refusals', () => {
    // If the version check ran AFTER preview, this would throw the registry's
    // "unknown backend" StorageBackendError instead of StorageConflictError.
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot)); // version is now 1
    expect(() =>
      service.applyConfig({ ...configWith(uploadsRoot, { categories: { backups: 'nope' } }), version: 0 }),
    ).toThrow(StorageConflictError);
  });

  it('STORADM-033 regression (audit #7): a migration flip bumps the version; a stale admin PUT built before the flip 409s and the flip survives untouched', () => {
    const { service, registry, uploadsRoot } = makeService();
    const destRoot = makeTmpDir();
    // The admin loads the form: draft carries version 0, categories.files → uploads-local.
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'dest', type: 'local', options: { root: destRoot } }],
      categories: {},
    })); // version is now 1; 'files' still defaults to uploads-local
    const staleDraft = configWith(uploadsRoot, {
      backends: [{ name: 'dest', type: 'local', options: { root: destRoot } }],
      categories: {}, // the admin's draft never touched 'files'
    });
    const staleVersion = service.state().version; // 1 — what the admin's form is holding

    // Meanwhile, a category migration flips 'files' to 'dest' — the exact
    // write path assignCategory uses, bumping the shared version counter.
    registry.assignCategory('files', 'dest');
    expect(registry.snapshot().categories.files.backend).toBe('dest');
    expect(service.state().version).toBe(2); // the flip bumped it past the admin's stale draft

    // The admin's stale PUT (still holding version 1, and no opinion on
    // 'files') must 409, NOT silently reassign 'files' back to its old default.
    expect(() => service.applyConfig({ ...staleDraft, version: staleVersion })).toThrow(StorageConflictError);

    // The flip survives untouched.
    expect(registry.snapshot().categories.files.backend).toBe('dest');
    expect(service.state().version).toBe(2);
  });
});

describe('StorageAdminService.testBackend', () => {
  it('STORADM-020 probes a healthy local candidate: ok with one green target', async () => {
    const { service } = makeService();
    const result = await service.testBackend({ name: 'cand', type: 'local', options: { root: makeTmpDir() } });
    expect(result).toEqual({ ok: true, targets: [{ name: 'cand', ok: true }] });
  });

  it('STORADM-021 an unreachable s3 candidate fails fast with a per-target error (no registry impact)', async () => {
    const { service, registry } = makeService();
    const result = await service.testBackend({
      name: 'cand',
      type: 's3',
      options: {
        endpoint: 'http://127.0.0.1:1',
        bucket: 'trek',
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
        region: 'us-east-1',
        keyPrefix: '',
        retries: 0,
        timeoutMs: 200,
      },
    });
    expect(result.ok).toBe(false);
    expect(result.targets[0]!.ok).toBe(false);
    expect(result.targets[0]!.error).toBeTruthy();
    expect(registry.resolve('backups').backendName).toBe('backups-local'); // state untouched
  });

  it('STORADM-022 a mirror is probed per target, replica failures reported individually', async () => {
    const goodRoot = makeTmpDir();
    // Not yet a file: registry.build() eagerly driver.init()s EVERY local
    // backend (used or not) during applyConfig's preview, so a root that's
    // already a file at that point would make applyConfig itself throw
    // (unrelated to testBackend). Register it as a fresh, empty dir, then
    // corrupt it afterward — testBackend's ephemeralDriverFor re-runs
    // init() fresh at probe time and hits the same EEXIST there instead.
    const badRoot = path.join(makeTmpDir(), 'a-file');
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [
        { name: 'good-local', type: 'local', options: { root: goodRoot } },
        { name: 'bad-local', type: 'local', options: { root: badRoot } },
      ],
      categories: {},
    }));
    fs.rmSync(badRoot, { recursive: true, force: true });
    fs.writeFileSync(badRoot, 'not a dir');
    const result = await service.testBackend({
      name: 'cand-mirror',
      type: 'mirror',
      options: { primary: 'good-local', replicas: ['bad-local'] },
    });
    expect(result.ok).toBe(false);
    expect(result.targets).toEqual([
      { name: 'good-local', ok: true },
      expect.objectContaining({ name: 'bad-local', ok: false }),
    ]);
  });

  it('STORADM-023 a mirror referencing an unknown or mirror-typed backend throws (→ 400)', async () => {
    const { service } = makeService();
    await expect(
      service.testBackend({ name: 'm', type: 'mirror', options: { primary: 'nope', replicas: [] } }),
    ).rejects.toThrow("mirror 'm' references unknown backend 'nope'");
  });

  it('STORADM-024 unmasks a stored backend by name before probing (mask echo works on /test)', async () => {
    const { service, uploadsRoot } = makeService();
    const root = makeTmpDir();
    put(service, configWith(uploadsRoot, {
      backends: [{ name: 'nas', type: 'local', options: { root } }],
      categories: {},
    }));
    // local has no secrets — the unmask contract is pinned via an s3 mask with no counterpart:
    await expect(
      service.testBackend({
        name: 'ghost',
        type: 's3',
        options: {
          endpoint: 'http://127.0.0.1:1',
          bucket: 'trek',
          accessKeyId: 'ak',
          secretAccessKey: MASKED_SETTING_VALUE,
          region: 'us-east-1',
          keyPrefix: '',
          retries: 0,
          timeoutMs: 200,
        },
      }),
    ).rejects.toThrow("re-enter the secret 'secretAccessKey' for 'ghost'");
  });

  it('STORADM-025 a mirror with a stored s3 replica decrypts the enc:v1: secret for the probe', async () => {
    const goodRoot = makeTmpDir();
    const { service, uploadsRoot } = makeService();
    put(service, configWith(uploadsRoot, {
      backends: [
        { name: 'good-local', type: 'local', options: { root: goodRoot } },
        {
          name: 'off-box',
          type: 's3',
          options: { ...S3_OPTIONS, endpoint: 'http://127.0.0.1:1', retries: 0, timeoutMs: 200 },
        },
      ],
      categories: {},
    }));
    // applyConfig encrypted the secret at rest — the snapshot the mirror
    // expansion reads holds ciphertext, so this probe exercises the full
    // snapshot → decryptBackendSecrets → ephemeral S3Driver chain.
    expect(readRow(BACKENDS_KEY)).toContain('enc:v1:');
    const result = await service.testBackend({
      name: 'cand-mirror',
      type: 'mirror',
      options: { primary: 'good-local', replicas: ['off-box'] },
    });
    expect(result.targets).toEqual([
      { name: 'good-local', ok: true },
      expect.objectContaining({ name: 'off-box', ok: false }),
    ]);
    // Decrypt succeeded: the replica failed on the network. A decrypt failure
    // would reject the whole call (decryptBackendSecrets throws), not mark a target.
    expect(result.targets[1]!.error).not.toContain('could not decrypt');
  });
});
