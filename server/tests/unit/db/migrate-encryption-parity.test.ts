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
import crypto from 'node:crypto';
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

// The users loop only, bounded by its own marker and the next section.
const usersSection = (() => {
  const start = script.indexOf('--- users:');
  expect(start).toBeGreaterThan(-1);
  const end = script.indexOf('--- app_settings: storage.backends ---', start);
  expect(end).toBeGreaterThan(start);
  return script.slice(start, end);
})();

// The per-user settings loop only.
const settingsSection = (() => {
  const start = script.indexOf('--- settings:');
  expect(start).toBeGreaterThan(-1);
  const end = script.indexOf('--- plugins:', start);
  expect(end).toBeGreaterThan(start);
  return script.slice(start, end);
})();

// ENCRYPTED_SETTING_KEYS is module-private in settings.service.ts, so the
// canonical list is read off the source rather than imported.
const canonicalSettingKeys = (() => {
  const source = fs.readFileSync(path.join(SERVER_ROOT, 'src', 'nest', 'settings', 'settings.service.ts'), 'utf8');
  const marker = 'const ENCRYPTED_SETTING_KEYS = new Set([';
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf(']', start + marker.length);
  return source
    .slice(start + marker.length, end)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((quoted) => quoted.slice(1, -1));
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

  // VapidKeysService stores the Web Push signing key with encrypt_api_key.
  // Missed by a rotation it no longer decrypts, and push stays off on every
  // device until the old key is back.
  it('ROTPAR-012: rotates the stored Web Push private key', () => {
    const vapid = fs.readFileSync(
      path.join(SERVER_ROOT, 'src', 'nest', 'notifications', 'push', 'vapid-keys.service.ts'),
      'utf8',
    );
    expect(vapid).toContain("VAPID_PRIVATE_KEY_SETTING = 'web_push_vapid_private_key'");
    expect(vapid).toContain('encrypt_api_key(keys.privateKey)');
    expect(appSettingsLoop).toContain("'web_push_vapid_private_key'");
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

  // airtrail.service.ts stores the key with maybe_encrypt_api_key, i.e. the same
  // enc:v1: scheme; missed by a rotation the integration reads back as unset.
  it('ROTPAR-006: rotates the per-user AirTrail key', () => {
    const airtrail = fs.readFileSync(
      path.join(SERVER_ROOT, 'src', 'nest', 'integrations', 'airtrail.service.ts'),
      'utf8',
    );
    expect(airtrail).toContain('maybe_encrypt_api_key');
    expect(airtrail).toContain('airtrail_api_key');
    expect(usersSection).toContain("'airtrail_api_key'");
  });

  it('ROTPAR-007: rotates every encrypted per-user setting key', () => {
    expect(canonicalSettingKeys.length).toBeGreaterThan(0);
    for (const key of canonicalSettingKeys) {
      expect(settingsSection).toContain(`'${key}'`);
    }
  });

  // Both plugin secret stores use the same scheme: OAuth tokens encrypted by
  // plugin-oauth.service, and the config fields a manifest marked secret.
  it('ROTPAR-008: rotates the plugin OAuth tokens and both config stores', () => {
    expect(script).toContain('plugin_oauth_tokens');
    expect(script).toContain('access_token');
    expect(script).toContain('refresh_token');
    expect(script).toContain('plugin_settings_fields');
    expect(script).toContain("UPDATE plugins SET config = ?");
    expect(script).toContain('plugin_user_config');
  });

  // doc-sync-secrets.ts wraps every document connection credential and the
  // per-link webhook secret in one blob under the same enc:v1: scheme. Missed
  // by a rotation, every trip binding reads back as unauthorized and the
  // webhook signature check has nothing to compare against.
  it('ROTPAR-010: rotates the document connection blob and the link webhook secret', () => {
    const docSyncSecrets = fs.readFileSync(
      path.join(SERVER_ROOT, 'src', 'nest', 'doc-sync', 'doc-sync-secrets.ts'),
      'utf8',
    );
    expect(docSyncSecrets).toContain('maybe_encrypt_api_key');
    expect(script).toContain('SELECT id, secrets FROM document_connections');
    expect(script).toContain('UPDATE document_connections SET secrets = ?');
    expect(script).toContain('SELECT id, webhook_secret FROM trip_document_links');
    expect(script).toContain('UPDATE trip_document_links SET webhook_secret = ?');
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

// The same enc:v1: scheme the app and the script share, so a fixture can be
// written under the OLD key and read back under the NEW one.
const ENCRYPTED_PREFIX = 'enc:v1:';
const apiKeyFor = (key: string) => crypto.createHash('sha256').update(`${key}:api_keys:v1`).digest();

function encryptWith(key: string, plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', apiKeyFor(key), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64')}`;
}

function decryptWith(key: string, value: string): string | null {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return null;
  try {
    const buf = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', apiKeyFor(key), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

const BASE_SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    maps_api_key TEXT, unsplash_api_key TEXT, openweather_api_key TEXT,
    immich_api_key TEXT, synology_password TEXT, synology_sid TEXT,
    synology_did TEXT, airtrail_api_key TEXT, mfa_secret TEXT
  );
  CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE settings (user_id INTEGER, key TEXT, value TEXT);
  CREATE TABLE trip_album_links (id INTEGER PRIMARY KEY, passphrase TEXT);
  CREATE TABLE trek_photos (id INTEGER PRIMARY KEY, passphrase TEXT);
  CREATE TABLE plugins (id TEXT PRIMARY KEY, config TEXT);
  CREATE TABLE plugin_settings_fields (plugin_id TEXT, field_key TEXT, scope TEXT, secret INTEGER);
  CREATE TABLE plugin_oauth_tokens (
    plugin_id TEXT, user_id INTEGER, access_token TEXT, refresh_token TEXT,
    PRIMARY KEY (plugin_id, user_id)
  );
  CREATE TABLE plugin_user_config (plugin_id TEXT, user_id INTEGER, config TEXT);
`;

describe('migrate-encryption.ts rotates the stores the app writes', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-migrate-encryption-plugins-'));
    dbPath = path.join(tmpDir, 'travel.db');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('ROTPAR-009: re-encrypts AirTrail, llm_api_key, plugin OAuth tokens and plugin configs', () => {
    const seed = new Database(dbPath);
    seed.exec(BASE_SCHEMA);
    seed.prepare('INSERT INTO users (id, airtrail_api_key) VALUES (1, ?)').run(encryptWith('old-key', 'at-token'));
    seed.prepare('INSERT INTO settings (user_id, key, value) VALUES (1, ?, ?)').run('llm_api_key', encryptWith('old-key', 'sk-llm'));
    seed.prepare('INSERT INTO plugins (id, config) VALUES (?, ?)').run(
      'koffi',
      JSON.stringify({ api_key: encryptWith('old-key', 'plugin-secret'), server: 'https://h' }),
    );
    seed.prepare('INSERT INTO plugin_settings_fields (plugin_id, field_key, scope, secret) VALUES (?, ?, ?, ?)').run('koffi', 'api_key', 'instance', 1);
    seed.prepare('INSERT INTO plugin_settings_fields (plugin_id, field_key, scope, secret) VALUES (?, ?, ?, ?)').run('koffi', 'token', 'user', 1);
    seed.prepare('INSERT INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)').run(
      'koffi',
      1,
      JSON.stringify({ token: encryptWith('old-key', 'user-secret') }),
    );
    seed.prepare('INSERT INTO plugin_oauth_tokens (plugin_id, user_id, access_token, refresh_token) VALUES (?, ?, ?, ?)').run(
      'koffi',
      1,
      encryptWith('old-key', 'access'),
      encryptWith('old-key', 'refresh'),
    );
    seed.close();

    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/migrate-encryption.ts'], {
      cwd: SERVER_ROOT,
      env: { ...process.env, DB_PATH: dbPath },
      input: ['old-key', 'new-key', 'yes', ''].join(String.fromCharCode(10)),
      stdio: 'pipe',
      encoding: 'utf8',
    });

    const after = new Database(dbPath, { readonly: true });
    const airtrail = (after.prepare('SELECT airtrail_api_key AS v FROM users WHERE id = 1').get() as { v: string }).v;
    expect(decryptWith('new-key', airtrail)).toBe('at-token');

    const llm = (after.prepare("SELECT value AS v FROM settings WHERE key = 'llm_api_key'").get() as { v: string }).v;
    expect(decryptWith('new-key', llm)).toBe('sk-llm');

    const tokens = after.prepare('SELECT access_token, refresh_token FROM plugin_oauth_tokens').get() as {
      access_token: string;
      refresh_token: string;
    };
    expect(decryptWith('new-key', tokens.access_token)).toBe('access');
    expect(decryptWith('new-key', tokens.refresh_token)).toBe('refresh');

    const pluginConfig = JSON.parse((after.prepare("SELECT config AS v FROM plugins WHERE id = 'koffi'").get() as { v: string }).v);
    expect(decryptWith('new-key', pluginConfig.api_key)).toBe('plugin-secret');
    // A non-secret field is left exactly as it was.
    expect(pluginConfig.server).toBe('https://h');

    const userConfig = JSON.parse((after.prepare('SELECT config AS v FROM plugin_user_config').get() as { v: string }).v);
    expect(decryptWith('new-key', userConfig.token)).toBe('user-secret');
    after.close();
  }, 30000);

  // The columns the doc-sync tables keep encrypted, and only those: the blob
  // is one opaque enc:v1: value per row, exactly what doc-sync-secrets.ts writes.
  const DOC_SYNC_SCHEMA = `
    CREATE TABLE document_connections (id INTEGER PRIMARY KEY, secrets TEXT);
    CREATE TABLE trip_document_links (id INTEGER PRIMARY KEY, webhook_secret TEXT);
  `;

  it('ROTPAR-011: re-encrypts document connection secrets and link webhook secrets, leaving rows already on the new key alone', () => {
    const seed = new Database(dbPath);
    seed.exec(BASE_SCHEMA);
    seed.exec(DOC_SYNC_SCHEMA);
    const connectionBlob = JSON.stringify({ token: 'paperless-token', deviceId: 'dsm-device' });
    seed.prepare('INSERT INTO document_connections (id, secrets) VALUES (1, ?)').run(encryptWith('old-key', connectionBlob));
    // A second run over a half-rotated database must not touch a row that is
    // already readable under the new key, let alone re-encrypt it under the old.
    const alreadyRotated = encryptWith('new-key', JSON.stringify({ token: 'nextcloud-app-password' }));
    seed.prepare('INSERT INTO document_connections (id, secrets) VALUES (2, ?)').run(alreadyRotated);
    seed.prepare('INSERT INTO document_connections (id, secrets) VALUES (3, NULL)').run();
    seed.prepare('INSERT INTO trip_document_links (id, webhook_secret) VALUES (1, ?)').run(
      encryptWith('old-key', JSON.stringify({ webhook: 'hook-secret' })),
    );
    seed.close();

    const output = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/migrate-encryption.ts'], {
      cwd: SERVER_ROOT,
      env: { ...process.env, DB_PATH: dbPath },
      input: ['old-key', 'new-key', 'yes', ''].join(String.fromCharCode(10)),
      stdio: 'pipe',
      encoding: 'utf8',
    });

    const after = new Database(dbPath, { readonly: true });
    const rotated = (after.prepare('SELECT secrets AS v FROM document_connections WHERE id = 1').get() as { v: string }).v;
    expect(decryptWith('old-key', rotated)).toBeNull();
    expect(JSON.parse(decryptWith('new-key', rotated) ?? 'null')).toEqual({ token: 'paperless-token', deviceId: 'dsm-device' });

    const untouched = (after.prepare('SELECT secrets AS v FROM document_connections WHERE id = 2').get() as { v: string }).v;
    expect(untouched).toBe(alreadyRotated);

    const empty = (after.prepare('SELECT secrets AS v FROM document_connections WHERE id = 3').get() as { v: string | null }).v;
    expect(empty).toBeNull();

    const webhook = (after.prepare('SELECT webhook_secret AS v FROM trip_document_links WHERE id = 1').get() as { v: string }).v;
    expect(JSON.parse(decryptWith('new-key', webhook) ?? 'null')).toEqual({ webhook: 'hook-secret' });
    after.close();

    // The summary counts these rows like every other store the script walks.
    expect(output).toMatch(/Migrated:\s+2\b/);
    expect(output).toMatch(/Already on new key:\s+1\b/);
    expect(output).toContain('All secrets successfully re-encrypted.');
  }, 30000);
});
