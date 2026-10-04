/**
 * Where the server's VAPID identity comes from (VKEY-*): the environment pair
 * when it is complete and consistent, else a pair generated once into
 * app_settings with the private half encrypted. Push is off, with every row
 * left as it was, while the pair it would sign with cannot be used: a stored
 * pair is never regenerated, and a broken environment pair falls back on
 * neither a stored nor a new one. And the `sub` contact.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

// One snapshot connection per file, created inside the factory so nothing has
// to be hoisted above the imports; the tests reach it through the mocked module.
vi.mock('../../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
});
vi.mock('../../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
const { logInfo, logError } = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo,
  logDebug: vi.fn(),
  logError,
  logWarn: vi.fn(),
}));

import { db as testDb } from '../../../../src/db/database';
import type { MikroORM } from '@mikro-orm/core';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestAppSettingsRepo, createTestUnitOfWork, sharedTestOrm } from '../../../helpers/test-uow';
import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import type { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { decrypt_api_key, encrypt_api_key } from '../../../../src/nest/common/crypto/apiKeyCrypto';
import {
  FALLBACK_VAPID_SUBJECT,
  PushUnavailableError,
  VAPID_PRIVATE_KEY_SETTING,
  VAPID_PUBLIC_KEY_SETTING,
  VapidKeysService,
} from '../../../../src/nest/notifications/push/vapid-keys.service';
import { generateVapidKeyPair, isVapidKeyPair } from '../../../../src/nest/notifications/push/web-push-crypto';

// The service's three providers, resolved once on this file's handle: the
// app_settings repository, the UnitOfWork its create runs in, and the ORM the
// bootstrap hook opens its request context on.
let appSettings: AppSettingsRepository;
let uow: UnitOfWork;
let orm: MikroORM;

/** A fresh instance over the same database: what a restart looks like. */
function make(repo: AppSettingsRepository = appSettings): VapidKeysService {
  return new VapidKeysService(repo, uow, orm);
}

/** An enc:v1: value the current ENCRYPTION_KEY cannot open. */
const UNREADABLE = 'enc:v1:bm90IGEgY2lwaGVydGV4dA';

function setting(key: string): string | undefined {
  return (testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)
    ?.value;
}

beforeAll(async () => {
  appSettings = await createTestAppSettingsRepo(testDb);
  uow = await createTestUnitOfWork(testDb);
  orm = (await sharedTestOrm(testDb)).orm;
});

beforeEach(() => {
  resetTestDb(testDb);
  logInfo.mockClear();
  logError.mockClear();
  for (const name of [
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_SUBJECT',
    'APP_URL',
    'ALLOWED_ORIGINS',
    'ADMIN_EMAIL',
  ]) {
    vi.stubEnv(name, '');
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  testDb.close();
});

describe('VapidKeysService key pair', () => {
  it('VKEY-001: generates the pair once, the private half encrypted, and keeps serving it', async () => {
    const svc = make();
    const keys = await svc.getKeys();
    expect(keys.source).toBe('database');
    expect(isVapidKeyPair(keys.publicKey, keys.privateKey)).toBe(true);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(keys.publicKey);
    const stored = setting(VAPID_PRIVATE_KEY_SETTING)!;
    expect(stored.startsWith('enc:v1:')).toBe(true);
    expect(decrypt_api_key(stored)).toBe(keys.privateKey);
    expect(logInfo).toHaveBeenCalledTimes(1);

    // Another instance over the same database (a restart) reads the same pair.
    const again = make();
    expect(await again.getKeys()).toEqual(keys);
    expect(await svc.getPublicKey()).toBe(keys.publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(stored);
    expect(logInfo).toHaveBeenCalledTimes(1);
  });

  it('VKEY-001b: a pair another instance stored between the first look and the write is the one used', async () => {
    const theirs = generateVapidKeyPair();
    const svc = make();
    const transactional = uow.transactional.bind(uow);
    const spy = vi.spyOn(uow, 'transactional').mockImplementationOnce((fn) => {
      testDb
        .prepare('INSERT INTO app_settings (key, value) VALUES (?, ?), (?, ?)')
        .run(VAPID_PUBLIC_KEY_SETTING, theirs.publicKey, VAPID_PRIVATE_KEY_SETTING, encrypt_api_key(theirs.privateKey));
      return transactional(fn);
    });
    try {
      expect(await svc.getKeys()).toEqual({ ...theirs, source: 'database' });
      expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(theirs.publicKey);
      expect(logInfo).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('VKEY-002: bootstrap creates the pair, so the public-key GET only reads', async () => {
    await make().onApplicationBootstrap();
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeTruthy();
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBeTruthy();
  });

  it('VKEY-003: a bootstrap failure is logged, not thrown', async () => {
    const broken = {
      getValue: async () => {
        throw new Error('no such table: app_settings');
      },
    } as unknown as AppSettingsRepository;
    await expect(make(broken).onApplicationBootstrap()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('no such table'));
  });

  it('VKEY-004: a consistent pair in the environment wins and the database is left alone', async () => {
    const pair = generateVapidKeyPair();
    // Padding on the way in is fine; the key handed to browsers has none.
    vi.stubEnv('VAPID_PUBLIC_KEY', `${pair.publicKey}=`);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const keys = await make().getKeys();
    expect(keys).toEqual({ ...pair, source: 'env' });
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeUndefined();
    expect(logError).not.toHaveBeenCalled();
  });

  it('VKEY-005: a mismatched environment pair turns push off, reported once, and the stored pair is not used', async () => {
    const stored = await make().getKeys();
    const ciphertext = setting(VAPID_PRIVATE_KEY_SETTING);
    vi.stubEnv('VAPID_PUBLIC_KEY', generateVapidKeyPair().publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', generateVapidKeyPair().privateKey);
    const svc = make();
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    await expect(svc.getPublicKey()).rejects.toThrow(PushUnavailableError);
    expect(await svc.isAvailable()).toBe(false);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Web Push is off: VAPID_PUBLIC_KEY does not belong to VAPID_PRIVATE_KEY'),
    );
    // Both stored rows are exactly as they were, for when the variables go again.
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(stored.publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(ciphertext);
    expect(logInfo).toHaveBeenCalledTimes(1);
  });

  it('VKEY-006: half a pair in the environment turns push off over a stored pair, and is reported again after a fix and relapse', async () => {
    const stored = await make().getKeys();
    const ciphertext = setting(VAPID_PRIVATE_KEY_SETTING);
    const pair = generateVapidKeyPair();
    const svc = make();
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(await svc.isAvailable()).toBe(false);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('VAPID_PRIVATE_KEY is set without its other half'));

    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    expect(await svc.getKeys()).toEqual({ ...pair, source: 'env' });
    // An existingSecret rotated without the private half: the devices hold the
    // environment key, so signing with the stored pair would drop every one.
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(await svc.isAvailable()).toBe(false);
    expect(logError).toHaveBeenCalledTimes(2);
    expect(logError).toHaveBeenLastCalledWith(
      expect.stringContaining('VAPID_PUBLIC_KEY is set without its other half'),
    );
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(stored.publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(ciphertext);

    // Both variables removed on purpose: the stored pair, as on any install without them.
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    expect(await svc.getKeys()).toEqual(stored);
  });

  it('VKEY-006b: an install that only ran on the environment pair generates nothing when that pair breaks', async () => {
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const svc = make();
    await svc.onApplicationBootstrap();
    expect(await svc.isAvailable()).toBe(true);

    // An existingSecret without the private half: the variable is simply gone.
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    await make().onApplicationBootstrap();
    expect(await svc.isAvailable()).toBe(false);
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeUndefined();
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBeUndefined();
    expect(logInfo).not.toHaveBeenCalled();
    // Once per instance, with what to do and without the key.
    expect(logError).toHaveBeenCalledTimes(2);
    const line = logError.mock.calls[0][0] as string;
    expect(line).toContain('Web Push is off: VAPID_PUBLIC_KEY is set without its other half');
    expect(line).toContain('Set both variables');
    expect(line).not.toContain(pair.publicKey);

    // Halves that do not belong together are refused the same way.
    vi.stubEnv('VAPID_PRIVATE_KEY', generateVapidKeyPair().privateKey);
    expect(await svc.isAvailable()).toBe(false);
    expect(logError).toHaveBeenLastCalledWith(
      expect.stringContaining('Web Push is off: VAPID_PUBLIC_KEY does not belong to VAPID_PRIVATE_KEY'),
    );
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeUndefined();

    // The pair fixed: the same key as before, so every device receives again as it was.
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    expect(await svc.getKeys()).toEqual({ ...pair, source: 'env' });
  });

  it('VKEY-006c: a broken environment pair over an unusable stored pair names the variables and touches no row', async () => {
    await make().getKeys();
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    vi.stubEnv('VAPID_PUBLIC_KEY', generateVapidKeyPair().publicKey);
    const svc = make();
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(UNREADABLE);
    // The variables are what push would sign with, so they are what the log names.
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Web Push is off: VAPID_PUBLIC_KEY is set without its other half'),
    );
  });

  it('VKEY-007: a stored private key that no longer decrypts is kept, and push is off until the key is back', async () => {
    const svc = make();
    const original = await svc.getKeys();
    const ciphertext = setting(VAPID_PRIVATE_KEY_SETTING)!;
    // What a restore under a different ENCRYPTION_KEY looks like from here.
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    logInfo.mockClear();

    const broken = make();
    await expect(broken.getKeys()).rejects.toThrow(PushUnavailableError);
    await expect(broken.getPublicKey()).rejects.toThrow(PushUnavailableError);
    // Nothing was replaced: both rows are exactly as they were.
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(original.publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(UNREADABLE);
    expect(logInfo).not.toHaveBeenCalled();
    // Said once, with the way out, and without any key material.
    expect(logError).toHaveBeenCalledTimes(1);
    const line = logError.mock.calls[0][0] as string;
    expect(line).toContain('cannot be decrypted with the current ENCRYPTION_KEY');
    expect(line).not.toContain(original.publicKey);
    expect(line).not.toContain(UNREADABLE);
    expect(line).not.toContain(ciphertext);

    // The right key again (here: the original ciphertext back) brings the same pair back.
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(ciphertext, VAPID_PRIVATE_KEY_SETTING);
    expect(await broken.getKeys()).toEqual(original);
  });

  it('VKEY-008: half a stored pair is not completed with a new pair either', async () => {
    const publicKey = generateVapidKeyPair().publicKey;
    testDb.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run(VAPID_PUBLIC_KEY_SETTING, publicKey);
    await expect(make().getKeys()).rejects.toThrow(PushUnavailableError);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('only one half of the stored VAPID key pair'));
    expect(logError).toHaveBeenCalledWith(expect.not.stringContaining(publicKey));
  });

  it('VKEY-008b: only the private half stored counts as incomplete too', async () => {
    const { privateKey } = generateVapidKeyPair();
    testDb
      .prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)')
      .run(VAPID_PRIVATE_KEY_SETTING, encrypt_api_key(privateKey));
    await expect(make().getKeys()).rejects.toThrow(PushUnavailableError);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeUndefined();
  });

  it('VKEY-008c: halves that decrypt but do not belong together are refused, not replaced', async () => {
    const stored = generateVapidKeyPair();
    testDb
      .prepare('INSERT INTO app_settings (key, value) VALUES (?, ?), (?, ?)')
      .run(
        VAPID_PUBLIC_KEY_SETTING,
        stored.publicKey,
        VAPID_PRIVATE_KEY_SETTING,
        encrypt_api_key(generateVapidKeyPair().privateKey),
      );
    await expect(make().getKeys()).rejects.toThrow(PushUnavailableError);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(stored.publicKey);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('does not belong to the stored public key'));
  });

  it('VKEY-008d: an unusable pair is reported once per state, and again after it was fixed and broke again', async () => {
    const svc = make();
    await svc.getKeys();
    const ciphertext = setting(VAPID_PRIVATE_KEY_SETTING)!;
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    for (let i = 0; i < 3; i++) await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(logError).toHaveBeenCalledTimes(1);

    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(ciphertext, VAPID_PRIVATE_KEY_SETTING);
    await svc.getKeys();
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    await expect(svc.getKeys()).rejects.toThrow(PushUnavailableError);
    expect(logError).toHaveBeenCalledTimes(2);
  });

  it('VKEY-008e: bootstrap over an unusable pair logs the reason once and does not throw', async () => {
    await make().getKeys();
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    logError.mockClear();
    await expect(make().onApplicationBootstrap()).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('Web Push is off'));
  });

  it('VKEY-008f: a consistent environment pair still works while the stored one is unusable', async () => {
    await make().getKeys();
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    const pair = generateVapidKeyPair();
    vi.stubEnv('VAPID_PUBLIC_KEY', pair.publicKey);
    vi.stubEnv('VAPID_PRIVATE_KEY', pair.privateKey);
    const svc = make();
    expect(await svc.getKeys()).toEqual({ ...pair, source: 'env' });
    expect(await svc.isAvailable()).toBe(true);
    // The stored rows are still exactly what was there.
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(UNREADABLE);
  });

  it('VKEY-008g: isAvailable only reads: it creates nothing, and never touches an unusable pair', async () => {
    const svc = make();
    // Neither row yet: available, since the next send or subscribe creates the
    // pair, but nothing is written now (the preference matrix GET asks this).
    expect(await svc.isAvailable()).toBe(true);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBeUndefined();
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBeUndefined();
    expect(logInfo).not.toHaveBeenCalled();

    const { publicKey } = await svc.getKeys();
    expect(await svc.isAvailable()).toBe(true);
    testDb.prepare('UPDATE app_settings SET value = ? WHERE key = ?').run(UNREADABLE, VAPID_PRIVATE_KEY_SETTING);
    expect(await svc.isAvailable()).toBe(false);
    expect(await svc.isAvailable()).toBe(false);
    expect(setting(VAPID_PUBLIC_KEY_SETTING)).toBe(publicKey);
    expect(setting(VAPID_PRIVATE_KEY_SETTING)).toBe(UNREADABLE);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('VKEY-008h: isAvailable turns any other failure into a logged false', async () => {
    const svc = make();
    const spy = vi.spyOn(appSettings, 'getValue').mockRejectedValueOnce(new Error('database is locked'));
    expect(await svc.isAvailable()).toBe(false);
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('database is locked'));
    spy.mockRestore();
    expect(await svc.isAvailable()).toBe(true);
  });
});

describe('VapidKeysService subject', () => {
  // getSubject() only reads the environment, so no provider is touched.
  const svc = new VapidKeysService({} as AppSettingsRepository, {} as UnitOfWork, {} as MikroORM);

  it('VKEY-009: VAPID_SUBJECT comes first', () => {
    vi.stubEnv('VAPID_SUBJECT', 'mailto:push@example.test');
    vi.stubEnv('APP_URL', 'https://trek.example.test');
    expect(svc.getSubject()).toBe('mailto:push@example.test');
  });

  it('VKEY-010: then APP_URL, when it is public https', () => {
    vi.stubEnv('APP_URL', ' https://trek.example.test/ ');
    expect(svc.getSubject()).toBe('https://trek.example.test');
  });

  it('VKEY-010b: never an ALLOWED_ORIGINS entry, which can be another site allowed to call the API', () => {
    vi.stubEnv('ALLOWED_ORIGINS', 'https://companion.example.test,https://trek.example.test');
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
    vi.stubEnv('APP_URL', 'https://trek.example.test');
    expect(svc.getSubject()).toBe('https://trek.example.test');
  });

  it('VKEY-010c: an APP_URL that does not parse is no candidate', () => {
    vi.stubEnv('APP_URL', 'not a url');
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
  });

  it('VKEY-011: never the bootstrap admin address, which would travel to every push service', () => {
    vi.stubEnv('ADMIN_EMAIL', 'admin@example.test');
    vi.stubEnv('APP_URL', 'https://trek.example.test');
    expect(svc.getSubject()).toBe('https://trek.example.test');
    vi.stubEnv('APP_URL', 'http://trek.lan');
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
  });

  it('VKEY-012: then the project URL when the instance URL is plain http or localhost', () => {
    vi.stubEnv('APP_URL', 'http://trek.lan');
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
    vi.stubEnv('APP_URL', 'https://localhost:3000');
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
  });

  it('VKEY-013: and never a subject Apple would refuse, even when one is configured', () => {
    vi.stubEnv('VAPID_SUBJECT', 'push@example.test'); // not mailto:, not https: (boot would have refused it)
    expect(svc.getSubject()).toBe(FALLBACK_VAPID_SUBJECT);
    vi.stubEnv('APP_URL', 'https://trek.example.test');
    expect(svc.getSubject()).toBe('https://trek.example.test');
  });
});
