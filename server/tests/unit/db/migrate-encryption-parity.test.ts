/**
 * Parity guard for scripts/migrate-encryption.ts.
 *
 * The rotation script re-encrypts at-rest secrets from one ENCRYPTION_KEY to the
 * next, and it walks a hardcoded list of app_settings keys. It cannot import the
 * canonical list from src/, because it deliberately runs without config.ts and
 * without the Nest container, so the list is a copy.
 *
 * A missing name does not fail loudly: the value stays encrypted under the old
 * key, decrypt_api_key returns null on the next read, and the instance quietly
 * behaves as if no key were configured. This pins the copy instead.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { INSTANCE_API_KEY_NAMES } from '../../../src/nest/settings/instance-api-keys';
import { storageSecretFields } from '@trek/shared';

const SERVER_ROOT = path.join(__dirname, '..', '..', '..');

const script = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'scripts', 'migrate-encryption.ts'),
  'utf8',
);

// The app_settings loop only, so a name that happens to appear elsewhere in the
// script (a users column of the same name, a comment) cannot satisfy the test.
const appSettingsLoop = (() => {
  const start = script.indexOf("'oidc_client_secret'");
  expect(start).toBeGreaterThan(-1);
  const end = script.indexOf('--- users:', start);
  expect(end).toBeGreaterThan(start);
  return script.slice(start, end);
})();

// The storage.backends section only — bounded by its own marker and the next
// one (`--- settings:`), so a field name appearing elsewhere in the script
// cannot satisfy the test.
const storageBackendsSection = (() => {
  const start = script.indexOf('--- app_settings: storage.backends ---');
  expect(start).toBeGreaterThan(-1);
  const end = script.indexOf('--- settings:', start);
  expect(end).toBeGreaterThan(start);
  return script.slice(start, end);
})();

describe('migrate-encryption.ts app_settings parity', () => {
  it('ROTPAR-001: rotates every instance-wide API key', () => {
    for (const name of INSTANCE_API_KEY_NAMES) {
      expect(appSettingsLoop).toContain(`'${name}'`);
    }
  });

  it('ROTPAR-002: still rotates the app_settings secrets that predate them', () => {
    for (const name of ['oidc_client_secret', 'smtp_pass', 'admin_webhook_url', 'admin_ntfy_token']) {
      expect(appSettingsLoop).toContain(`'${name}'`);
    }
  });

  it('ROTPAR-003: the canonical list is not empty, so ROTPAR-001 cannot pass vacuously', () => {
    expect(INSTANCE_API_KEY_NAMES.length).toBeGreaterThan(0);
  });

  it('ROTPAR-004: rotates every storage.backends secret field for s3', () => {
    const fields = storageSecretFields('s3');
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(storageBackendsSection).toContain(`'${field}'`);
    }
  });
});

describe('migrate-encryption.ts storage.backends: malformed shape', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-migrate-encryption-'));
    dbPath = path.join(tmpDir, 'travel.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ROTPAR-005: reports an error instead of silently skipping a non-array storage.backends value', () => {
    const seed = new Database(dbPath);
    seed.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        maps_api_key TEXT, unsplash_api_key TEXT, openweather_api_key TEXT,
        immich_api_key TEXT, synology_password TEXT, synology_sid TEXT,
        synology_did TEXT, mfa_secret TEXT
      );
      CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE settings (user_id INTEGER, key TEXT, value TEXT);
      CREATE TABLE trip_album_links (id INTEGER PRIMARY KEY, passphrase TEXT);
      CREATE TABLE trek_photos (id INTEGER PRIMARY KEY, passphrase TEXT);
    `);
    // Valid JSON, but not an array — the malformed shape the fix must not
    // silently skip.
    seed.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run(
      'storage.backends',
      JSON.stringify({ not: 'an array' }),
    );
    seed.close();

    let output: string;
    let threw = false;
    try {
      const stdout = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/migrate-encryption.ts'], {
        cwd: SERVER_ROOT,
        env: { ...process.env, DB_PATH: dbPath },
        input: 'old-key\nnew-key\nyes\n',
        stdio: 'pipe',
        encoding: 'utf8',
      });
      output = stdout;
    } catch (err) {
      // A non-empty result.errors makes the script exit(1) — the SUT's
      // documented posture for "some secrets could not be migrated". The
      // error itself is written via console.warn (stderr), not stdout.
      threw = true;
      const e = err as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }

    expect(threw).toBe(true);
    expect(output).toContain('app_settings.storage.backends: not an array — skipping');
  }, 30000);
});
