/**
 * Encryption key migration script.
 *
 * Re-encrypts all at-rest secrets in the TREK database from one ENCRYPTION_KEY
 * to another without requiring the application to be running.
 *
 * Usage (host):
 *   cd server
 *   node --import tsx scripts/migrate-encryption.ts
 *
 * Usage (Docker):
 *   docker exec -it -u node -w /app/server trek node --import tsx scripts/migrate-encryption.ts
 *
 * The script will prompt for the old and new keys interactively so they never
 * appear in shell history, process arguments, or log output.
 *
 * It works on the database the server runs on. Without TREK_DB_URL that is the
 * SQLite file (DB_PATH, TREK_DB_FILE or data/travel.db), opened with better-sqlite3. With
 * TREK_DB_URL it is the Postgres database, reached through the server's own
 * engine (its pool, SSL settings and write lock): from src/ in a source
 * checkout, from the built dist/ in the image. Either way the rotation is one
 * transaction, taken after a copy of the database.
 */
import {
  loadServer,
  postgresStore,
  sqliteStore,
  type SecretStore,
  type ServerModules,
} from './migrate-encryption-stores';
import { MikroORM } from '@mikro-orm/core';

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { config as loadDotenv } from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ---------------------------------------------------------------------------
// Crypto helpers — mirrors apiKeyCrypto.ts and mfaCrypto.ts but with
// explicit key arguments so the script is independent of config.ts / env vars.
// ---------------------------------------------------------------------------

const ENCRYPTED_PREFIX = 'enc:v1:';

function apiKey(encryptionKey: string): Buffer {
  return crypto.createHash('sha256').update(`${encryptionKey}:api_keys:v1`).digest();
}

function mfaKey(encryptionKey: string): Buffer {
  return crypto.createHash('sha256').update(`${encryptionKey}:mfa:v1`).digest();
}

function encryptApiKey(plain: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', apiKey(encryptionKey), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${Buffer.concat([iv, tag, enc]).toString('base64')}`;
}

function decryptApiKey(value: string, encryptionKey: string): string | null {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return null;
  try {
    const buf = Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', apiKey(encryptionKey), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function encryptMfa(plain: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', mfaKey(encryptionKey), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decryptMfa(value: string, encryptionKey: string): string | null {
  try {
    const buf = Buffer.from(value, 'base64');
    if (buf.length < 28) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', mfaKey(encryptionKey), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------
// A single readline interface is shared for the entire script lifetime so
// stdin is never paused between prompts.
//
// Lines are collected into a queue as soon as readline emits them — this
// prevents the race where a line event fires before the next listener is
// registered (common with piped / pasted input that arrives all at once).
//
// Opened when the command starts, not on import: the Postgres-lane test
// imports the rotation and must not hold stdin open.

let rl: readline.Interface;

const lineQueue: string[] = [];
const lineWaiters: ((line: string) => void)[] = [];

function openPrompts(): void {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on('line', (line) => {
    if (lineWaiters.length > 0) {
      lineWaiters.shift()!(line);
    } else {
      lineQueue.push(line);
    }
  });
}

function nextLine(): Promise<string> {
  return new Promise((resolve) => {
    if (lineQueue.length > 0) {
      resolve(lineQueue.shift()!);
    } else {
      lineWaiters.push(resolve);
    }
  });
}

// Muted prompt — typed/pasted characters are not echoed.
// _writeToOutput is suppressed only while waiting for this line.
async function promptSecret(question: string): Promise<string> {
  process.stdout.write(question);
  (rl as any)._writeToOutput = () => {};
  const line = await nextLine();
  (rl as any)._writeToOutput = (s: string) => process.stdout.write(s);
  process.stdout.write('\n');
  return line.trim();
}

async function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  const line = await nextLine();
  return line.trim();
}
// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

export interface MigrationResult {
  migrated: number;
  alreadyMigrated: number;
  skipped: number;
  errors: string[];
}

/** A JSON column's value: text on SQLite, and on Postgres too except for `addons.config`, which is `jsonb` there. */
function parseJson(raw: unknown): unknown {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

/**
 * Re-encrypts every stored secret from `oldKey` to `newKey` through `store`.
 * A value already under the new key is left alone, one neither key opens is
 * reported in `errors`, so running it twice is harmless.
 */
async function rotateSecrets(store: SecretStore, oldKey: string, newKey: string): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: 0, alreadyMigrated: 0, skipped: 0, errors: [] };

  // Helper: migrate a single api-key-style value (enc:v1: prefix)
  function migrateApiKeyValue(raw: string, label: string): string | null {
    if (!raw || !raw.startsWith(ENCRYPTED_PREFIX)) {
      result.skipped++;
      console.warn(`  SKIP ${label}: not an encrypted value (missing enc:v1: prefix)`);
      return null;
    }

    const plain = decryptApiKey(raw, oldKey);
    if (plain !== null) {
      result.migrated++;
      return encryptApiKey(plain, newKey);
    }

    // Try new key — already migrated?
    const check = decryptApiKey(raw, newKey);
    if (check !== null) {
      result.alreadyMigrated++;
      return null; // no change needed
    }

    result.errors.push(`${label}: decryption failed with both keys`);
    console.error(`  ERROR ${label}: could not decrypt with either key — skipping`);
    return null;
  }

  // Helper: migrate a single MFA value (no prefix, raw base64)
  function migrateMfaValue(raw: string, label: string): string | null {
    if (!raw) {
      result.skipped++;
      return null;
    }

    const plain = decryptMfa(raw, oldKey);
    if (plain !== null) {
      result.migrated++;
      return encryptMfa(plain, newKey);
    }

    const check = decryptMfa(raw, newKey);
    if (check !== null) {
      result.alreadyMigrated++;
      return null;
    }

    result.errors.push(`${label}: decryption failed with both keys`);
    console.error(`  ERROR ${label}: could not decrypt with either key — skipping`);
    return null;
  }

  // --- app_settings: oidc_client_secret, smtp_pass, admin_webhook_url, admin_ntfy_token,
  // plus the instance-wide provider keys (#1939) ---
  //
  // The last two mirror INSTANCE_API_KEY_NAMES in
  // src/nest/settings/instance-api-keys.ts. Spelled out rather than imported,
  // because that module pulls in DatabaseService and this script deliberately
  // stays independent of src/ (see the crypto note above). Miss one and a
  // rotation leaves it encrypted under the old key, which reads back as "no
  // key" and silently drops the install to OpenStreetMap, so the copy is
  // pinned by tests/unit/db/migrate-encryption-parity.test.ts.
  //
  // web_push_vapid_private_key is the Web Push signing key VapidKeysService
  // generates. Missed here it would no longer decrypt under the new key, and
  // push would stay off on every device until the old key came back.
  //
  // service_key is the installation's key towards the liketrek services.
  // Missed here it reads back as unusable, the installation registers anew and
  // loses its id, and a revoked key would come back as a fresh one.
  //
  // The mail import's IMAP password and webhook secret: missed, the box stops
  // being read and every signed mail is refused until an admin types them again.
  for (const key of [
    'oidc_client_secret',
    'smtp_pass',
    'admin_webhook_url',
    'admin_ntfy_token',
    'maps_api_key',
    'unsplash_api_key',
    'amap_api_key',
    'web_push_vapid_private_key',
    'service_key',
    'mail_ingest_imap_pass',
    'mail_ingest_webhook_secret',
  ]) {
    const row = await store.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
    if (!row?.value) continue;
    const newVal = migrateApiKeyValue(row.value, `app_settings.${key}`);
    if (newVal !== null) {
      await store.run('UPDATE app_settings SET value = ? WHERE key = ?', [newVal, key]);
    }
  }

  // --- users: api key columns + synology credentials ---
  // unsplash_api_key was missing here for as long as the column has existed. It
  // matters now that the resolver reads it as the per-user fallback (#1939): left
  // out of a rotation it stays encrypted under the old key and reads back as unset.
  // airtrail_api_key arrived with a later migration, so an older database may
  // not have the column at all — filter the list against the real table rather
  // than letting one missing column throw the whole rotation.
  const userColumns = await store.columnsOf('users');
  const apiKeyColumns = [
    'maps_api_key',
    'unsplash_api_key',
    // Added with the Amap provider; filtered against the real table below, so a
    // database that has not run that migration yet is not a rotation failure.
    'amap_api_key',
    'openweather_api_key',
    'immich_api_key',
    'synology_password',
    'synology_sid',
    'synology_did',
    'airtrail_api_key',
  ].filter((c) => userColumns.has(c));
  const users = await store.all<{ id: number }>('SELECT id FROM users');

  for (const user of users) {
    const row = await store.get<Record<string, string>>(`SELECT ${apiKeyColumns.join(', ')} FROM users WHERE id = ?`, [
      user.id,
    ]);
    if (!row) continue;

    for (const col of apiKeyColumns) {
      if (!row[col]) continue;
      const newVal = migrateApiKeyValue(row[col], `users[${user.id}].${col}`);
      if (newVal !== null) {
        await store.run(`UPDATE users SET ${col} = ? WHERE id = ?`, [newVal, user.id]);
      }
    }

    // mfa_secret (mfa crypto)
    const mfaRow = await store.get<{ mfa_secret: string }>(
      'SELECT mfa_secret FROM users WHERE id = ? AND mfa_secret IS NOT NULL',
      [user.id],
    );
    if (mfaRow?.mfa_secret) {
      const newVal = migrateMfaValue(mfaRow.mfa_secret, `users[${user.id}].mfa_secret`);
      if (newVal !== null) {
        await store.run('UPDATE users SET mfa_secret = ? WHERE id = ?', [newVal, user.id]);
      }
    }
  }

  // --- app_settings: storage.backends ---
  // Storage backend secrets live encrypted INSIDE the storage.backends JSON
  // array (BACKENDS_KEY in src/nest/storage/storage-registry.service.ts is
  // its own app_settings row — 'storage.categories' is a sibling row with no
  // secrets), on the fields the shared type registry marks `secret` (only
  // options.secretAccessKey for s3 today; src/nest/storage/storage-secrets.ts
  // encrypts it with the same enc:v1: scheme as the api-key columns above).
  // This script can't import storageSecretFields from @trek/shared (kept
  // independent of the app, see the header note), so the field list per
  // backend type is pinned here. Miss one and that backend's secret stays
  // encrypted under the old key after rotation, then fails to decrypt on the
  // next read (StorageBackendError) — pinned by
  // tests/unit/db/migrate-encryption-parity.test.ts.
  const STORAGE_BACKEND_SECRET_FIELDS: Record<string, readonly string[]> = {
    s3: ['secretAccessKey'],
  };
  {
    const row = await store.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'storage.backends'");
    if (row?.value) {
      let backends: unknown;
      try {
        backends = JSON.parse(row.value);
      } catch {
        result.errors.push('app_settings.storage.backends: invalid JSON — skipping');
        backends = undefined;
      }
      if (backends !== undefined) {
        if (Array.isArray(backends)) {
          let changed = false;
          for (const backend of backends as Record<string, unknown>[]) {
            if (!backend || typeof backend !== 'object') continue;
            const type = typeof backend.type === 'string' ? backend.type : undefined;
            const fields = type ? STORAGE_BACKEND_SECRET_FIELDS[type] : undefined;
            if (!fields || fields.length === 0) continue;
            const options = backend.options;
            if (!options || typeof options !== 'object') continue;
            const name = typeof backend.name === 'string' ? backend.name : '?';
            for (const field of fields) {
              const raw = (options as Record<string, unknown>)[field];
              if (typeof raw !== 'string' || !raw) continue;
              const newVal = migrateApiKeyValue(raw, `app_settings.storage.backends[${name}].${field}`);
              if (newVal !== null) {
                (options as Record<string, unknown>)[field] = newVal;
                changed = true;
              }
            }
          }
          if (changed) {
            await store.run("UPDATE app_settings SET value = ? WHERE key = 'storage.backends'", [
              JSON.stringify(backends),
            ]);
          }
        } else {
          result.errors.push('app_settings.storage.backends: not an array — skipping');
        }
      }
    }
  }

  // --- settings: per-user encrypted keys ---
  const encryptedSettingKeys = ['webhook_url', 'ntfy_token', 'mapbox_access_token', 'carto_api_key', 'llm_api_key'];
  const settingRows = await store.all<{ user_id: number; key: string; value: string }>(
    `SELECT user_id, key, value FROM settings WHERE key IN (${encryptedSettingKeys.map(() => '?').join(', ')})`,
    encryptedSettingKeys,
  );

  for (const row of settingRows) {
    if (!row.value) continue;
    const newVal = migrateApiKeyValue(row.value, `settings[user=${row.user_id}].${row.key}`);
    if (newVal !== null) {
      await store.run('UPDATE settings SET value = ? WHERE user_id = ? AND key = ?', [newVal, row.user_id, row.key]);
    }
  }

  // --- plugins: OAuth tokens and secret settings fields ---
  // The plugin host encrypts with the same enc:v1: scheme as everything above:
  // plugin-oauth.service stores both tokens encrypted, and plugins.service
  // encrypts every settings field the manifest marked secret (instance scope in
  // plugins.config, user scope in plugin_user_config.config). Left out of a
  // rotation, a connected plugin reads back as "not connected" and a secret
  // setting as unset, with nothing in the log to say why. Every table here
  // arrived with a later migration, so each block checks that it exists.
  if (await store.tableExists('plugin_oauth_tokens')) {
    const tokenRows = await store.all<{
      plugin_id: string;
      user_id: number;
      access_token: string | null;
      refresh_token: string | null;
    }>('SELECT plugin_id, user_id, access_token, refresh_token FROM plugin_oauth_tokens');
    for (const row of tokenRows) {
      for (const col of ['access_token', 'refresh_token'] as const) {
        const raw = row[col];
        if (!raw) continue;
        const newVal = migrateApiKeyValue(raw, `plugin_oauth_tokens[${row.plugin_id},${row.user_id}].${col}`);
        if (newVal !== null) {
          await store.run(`UPDATE plugin_oauth_tokens SET ${col} = ? WHERE plugin_id = ? AND user_id = ?`, [
            newVal,
            row.plugin_id,
            row.user_id,
          ]);
        }
      }
    }
  }

  if (await store.tableExists('plugin_settings_fields')) {
    // Which keys are secret is per plugin and per scope, and it lives in the DB
    // rather than in this script, so nothing has to be pinned by hand here.
    const secretFields = await store.all<{ plugin_id: string; field_key: string; scope: string | null }>(
      'SELECT plugin_id, field_key, scope FROM plugin_settings_fields WHERE secret = 1',
    );
    const secretKeysFor = (pluginId: string, scope: string): string[] =>
      secretFields.filter((f) => f.plugin_id === pluginId && (f.scope ?? 'instance') === scope).map((f) => f.field_key);

    const migrateConfigJson = (raw: string | null, keys: string[], label: string): string | null => {
      if (!raw || keys.length === 0) return null;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        result.errors.push(`${label}: invalid JSON — skipping`);
        return null;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        result.errors.push(`${label}: not an object — skipping`);
        return null;
      }
      const config = parsed as Record<string, unknown>;
      let changed = false;
      for (const key of keys) {
        const value = config[key];
        if (typeof value !== 'string' || !value) continue;
        const newVal = migrateApiKeyValue(value, `${label}.${key}`);
        if (newVal !== null) {
          config[key] = newVal;
          changed = true;
        }
      }
      return changed ? JSON.stringify(config) : null;
    };

    if (await store.tableExists('plugins')) {
      const pluginRows = await store.all<{ id: string; config: string | null }>('SELECT id, config FROM plugins');
      for (const row of pluginRows) {
        const next = migrateConfigJson(row.config, secretKeysFor(row.id, 'instance'), `plugins[${row.id}].config`);
        if (next !== null) {
          await store.run('UPDATE plugins SET config = ? WHERE id = ?', [next, row.id]);
        }
      }
    }

    if (await store.tableExists('plugin_user_config')) {
      const userConfigRows = await store.all<{ plugin_id: string; user_id: number; config: string | null }>(
        'SELECT plugin_id, user_id, config FROM plugin_user_config',
      );
      for (const row of userConfigRows) {
        const next = migrateConfigJson(
          row.config,
          secretKeysFor(row.plugin_id, 'user'),
          `plugin_user_config[${row.plugin_id},${row.user_id}].config`,
        );
        if (next !== null) {
          await store.run('UPDATE plugin_user_config SET config = ? WHERE plugin_id = ? AND user_id = ?', [
            next,
            row.plugin_id,
            row.user_id,
          ]);
        }
      }
    }
  }

  // --- mail_ingest: forwarding address tokens and the stored mails ---
  // A person sees their address again through its token_enc; a forwarded mail
  // waits for its reading, and for the inbox's ways out, as raw_eml_enc. Missed,
  // the addresses still take mail (they are found by hash) but show as unset,
  // and every stored mail reads as unreadable.
  for (const [table, column] of [
    ['mail_ingest_addresses', 'token_enc'],
    ['mail_ingest_messages', 'raw_eml_enc'],
  ] as const) {
    if (!(await store.tableExists(table))) continue;
    const rows = await store.all<{ id: number; value: string }>(
      `SELECT id, ${column} AS value FROM ${table} WHERE ${column} IS NOT NULL`,
    );
    for (const row of rows) {
      const newVal = migrateApiKeyValue(row.value, `${table}[${row.id}].${column}`);
      if (newVal !== null) {
        await store.run(`UPDATE ${table} SET ${column} = ? WHERE id = ?`, [newVal, row.id]);
      }
    }
  }

  // --- addons: the AI Parsing addon's instance-wide API key ---
  // Stored encrypted as `apiKey` inside the addon's JSON config
  // (llm-parse/llm-config.ts). Left out, LLM parsing quietly runs without a
  // key after the rotation, since a failed decrypt reads as "no key". The
  // column is text on SQLite and jsonb on Postgres, whose driver hands it back
  // parsed; the JSON text written back fits both.
  if (await store.tableExists('addons')) {
    const addonRows = await store.all<{ id: string; config: unknown }>(
      'SELECT id, config FROM addons WHERE config IS NOT NULL',
    );
    for (const row of addonRows) {
      let config: unknown;
      try {
        config = parseJson(row.config);
      } catch {
        continue;
      }
      if (!config || typeof config !== 'object' || Array.isArray(config)) continue;
      const apiKey = (config as Record<string, unknown>).apiKey;
      if (typeof apiKey !== 'string' || !apiKey) continue;
      const newVal = migrateApiKeyValue(apiKey, `addons[${row.id}].config.apiKey`);
      if (newVal !== null) {
        await store.run('UPDATE addons SET config = ? WHERE id = ?', [
          JSON.stringify({ ...(config as Record<string, unknown>), apiKey: newVal }),
          row.id,
        ]);
      }
    }
  }

  // --- trip_album_links: passphrase ---
  const albumLinks = await store.all<{ id: number; passphrase: string }>(
    'SELECT id, passphrase FROM trip_album_links WHERE passphrase IS NOT NULL',
  );
  for (const row of albumLinks) {
    const newVal = migrateApiKeyValue(row.passphrase, `trip_album_links[${row.id}].passphrase`);
    if (newVal !== null) {
      await store.run('UPDATE trip_album_links SET passphrase = ? WHERE id = ?', [newVal, row.id]);
    }
  }

  // --- dawarich_connections: api_key ---
  // Its own table rather than a users column, so it needs its own block. The
  // table arrived with a later migration, hence the existence check: an older
  // database simply has nothing to rotate here.
  if (await store.tableExists('dawarich_connections')) {
    const connections = await store.all<{ user_id: number; api_key: string }>(
      'SELECT user_id, api_key FROM dawarich_connections WHERE api_key IS NOT NULL',
    );
    for (const row of connections) {
      const newVal = migrateApiKeyValue(row.api_key, `dawarich_connections[${row.user_id}].api_key`);
      if (newVal !== null) {
        await store.run('UPDATE dawarich_connections SET api_key = ? WHERE user_id = ?', [newVal, row.user_id]);
      }
    }
  }

  if (await store.tableExists('web_push_subscriptions')) {
    const rows = await store.all<{ id: number; subscription_encrypted: string }>(
      'SELECT id, subscription_encrypted FROM web_push_subscriptions',
    );
    for (const row of rows) {
      const next = migrateApiKeyValue(row.subscription_encrypted, `web_push_subscriptions[${row.id}]`);
      if (next !== null) {
        await store.run('UPDATE web_push_subscriptions SET subscription_encrypted = ? WHERE id = ?', [next, row.id]);
      }
    }
  }

  // --- wanderer_connections: token ---
  // One row per user, like dawarich_connections. Left out of a rotation, the
  // connection still shows as connected but every call goes out without a token.
  if (await store.tableExists('wanderer_connections')) {
    const connections = await store.all<{ user_id: number; token: string }>(
      'SELECT user_id, token FROM wanderer_connections WHERE token IS NOT NULL',
    );
    for (const row of connections) {
      const newVal = migrateApiKeyValue(row.token, `wanderer_connections[${row.user_id}].token`);
      if (newVal !== null) {
        await store.run('UPDATE wanderer_connections SET token = ? WHERE user_id = ?', [newVal, row.user_id]);
      }
    }
  }

  // --- trek_photos: passphrase ---
  const photos = await store.all<{ id: number; passphrase: string }>(
    'SELECT id, passphrase FROM trek_photos WHERE passphrase IS NOT NULL',
  );
  for (const row of photos) {
    const newVal = migrateApiKeyValue(row.passphrase, `trek_photos[${row.id}].passphrase`);
    if (newVal !== null) {
      await store.run('UPDATE trek_photos SET passphrase = ? WHERE id = ?', [newVal, row.id]);
    }
  }

  // --- document_connections: secrets ---
  // Every credential of a document connection sits in ONE encrypted JSON blob
  // (src/nest/doc-sync/doc-sync-secrets.ts) rather than in a column per
  // provider, so a new provider changes nothing here: the blob is rotated as
  // an opaque value. It also holds secrets the provider handed out itself,
  // such as the DSM device token, which no form can re-enter. Left out of a
  // rotation, every trip binding on the instance reads back as unauthorized
  // and Synology needs a fresh OTP pairing. The table arrived with a later
  // migration, hence the existence check.
  if (await store.tableExists('document_connections')) {
    const documentConnections = await store.all<{ id: number; secrets: string }>(
      'SELECT id, secrets FROM document_connections WHERE secrets IS NOT NULL',
    );
    for (const row of documentConnections) {
      const newVal = migrateApiKeyValue(row.secrets, `document_connections[${row.id}].secrets`);
      if (newVal !== null) {
        await store.run('UPDATE document_connections SET secrets = ? WHERE id = ?', [newVal, row.id]);
      }
    }
  }

  // --- ai_connections: secrets ---
  // The AI assistant's connections keep their credential in ONE encrypted
  // JSON blob (src/nest/ai-connections/ai-secrets.ts): an API key, or a
  // ChatGPT sign-in's tokens. Left out of a rotation, the instance's
  // connection asks the admin for its key again and every ChatGPT user has
  // to sign in anew. The table arrived with a later migration, hence the
  // existence check.
  if (await store.tableExists('ai_connections')) {
    const aiConnections = await store.all<{ id: number; secrets: string }>(
      'SELECT id, secrets FROM ai_connections WHERE secrets IS NOT NULL',
    );
    for (const row of aiConnections) {
      const newVal = migrateApiKeyValue(row.secrets, `ai_connections[${row.id}].secrets`);
      if (newVal !== null) {
        await store.run('UPDATE ai_connections SET secrets = ? WHERE id = ?', [newVal, row.id]);
      }
    }
  }

  // --- trip_document_links: webhook_secret ---
  // The secret a provider signs its webhook calls with, stored through the
  // same blob helper. It is written once when the link is created and never
  // regenerated, so a rotation that misses it leaves the link with nothing to
  // check a signature against.
  if (await store.tableExists('trip_document_links')) {
    const documentLinks = await store.all<{ id: number; webhook_secret: string }>(
      'SELECT id, webhook_secret FROM trip_document_links WHERE webhook_secret IS NOT NULL',
    );
    for (const row of documentLinks) {
      const newVal = migrateApiKeyValue(row.webhook_secret, `trip_document_links[${row.id}].webhook_secret`);
      if (newVal !== null) {
        await store.run('UPDATE trip_document_links SET webhook_secret = ? WHERE id = ?', [newVal, row.id]);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// The two engines
// ---------------------------------------------------------------------------

/**
 * The rotation on the SQLite file, in one transaction. better-sqlite3's
 * `transaction()` takes no async function, so it is opened by hand; nothing
 * else uses this connection meanwhile. IMMEDIATE takes the write lock up
 * front, waiting out busy_timeout while a running server writes, instead of
 * failing at the first UPDATE when the server wrote after the first read.
 */
async function rotateOnSqlite(db: Database.Database, oldKey: string, newKey: string): Promise<MigrationResult> {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = await rotateSecrets(sqliteStore(db), oldKey, newKey);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    if (db.inTransaction) db.exec('ROLLBACK');
    throw err;
  }
}

/**
 * The rotation on Postgres, in one transaction that first takes the engine's
 * write lock (`serializeWrites`), the one every `UnitOfWork` transaction of a
 * running server takes too: the server's writes wait until the rotation has
 * committed or rolled back.
 */
export async function rotateOnPostgres(
  orm: MikroORM,
  engine: Pick<import('../src/db/engine').DatabaseEngine, 'serializeWrites'>,
  oldKey: string,
  newKey: string,
): Promise<MigrationResult> {
  return orm.em.fork().transactional(async (em) => {
    await engine.serializeWrites(em);
    return rotateSecrets(postgresStore(em), oldKey, newKey);
  });
}

// ---------------------------------------------------------------------------
// The command
// ---------------------------------------------------------------------------

/** The first of `paths` this process may not write, if any. */
function firstNotWritable(paths: string[]): string | undefined {
  return paths.find((p) => {
    try {
      fs.accessSync(p, fs.constants.W_OK);
      return false;
    } catch {
      return true;
    }
  });
}

function refuseNotWritable(notWritable: string): never {
  rl.close();
  console.error(`Cannot write to ${notWritable} as uid ${process.getuid?.() ?? '?'}.`);
  console.error('Run this script as the user that owns the data directory. In the Docker image that is node:');
  console.error('  docker exec -it -u node -w /app/server trek node --import tsx scripts/migrate-encryption.ts');
  process.exit(1);
}

/** Both keys and the confirmation, or the process ends. */
async function askKeys(): Promise<{ oldKey: string; newKey: string }> {
  const oldKey = await promptSecret('Old ENCRYPTION_KEY: ');
  const newKey = await promptSecret('New ENCRYPTION_KEY: ');

  if (!oldKey || !newKey) {
    rl.close();
    console.error('Both keys are required.');
    process.exit(1);
  }

  if (oldKey === newKey) {
    rl.close();
    console.error('Old and new keys are identical — nothing to do.');
    process.exit(0);
  }

  // Confirm
  const confirm = await prompt('\nProceed with migration? This will modify the database. Type "yes" to confirm: ');
  if (confirm.trim().toLowerCase() !== 'yes') {
    rl.close();
    console.log('Aborted.');
    process.exit(0);
  }
  return { oldKey, newKey };
}

/**
 * Prints the outcome. On success the key file follows the rotation: the
 * server refuses to start when ENCRYPTION_KEY and the key file disagree
 * (src/config.ts). Only an existing file is touched; anything else is left
 * to the operator.
 */
function finish(result: MigrationResult, backupPath: string, keyFile: string, newKey: string, noKeyFile: string): void {
  rl.close();

  console.log('\n=== Migration complete ===');
  console.log(`  Migrated:        ${result.migrated}`);
  console.log(`  Already on new key: ${result.alreadyMigrated}`);
  console.log(`  Skipped (empty): ${result.skipped}`);
  if (result.errors.length > 0) {
    console.warn(`  Errors:          ${result.errors.length}`);
    result.errors.forEach((e) => console.warn(`    - ${e}`));
    console.warn('\nSome secrets could not be migrated. Check the errors above.');
    console.warn(`Your original database is backed up at: ${backupPath}`);
    process.exit(1);
  } else {
    console.log('\nAll secrets successfully re-encrypted.');
    if (fs.existsSync(keyFile)) {
      fs.writeFileSync(keyFile, newKey, { mode: 0o600 });
      console.log(`Key file updated: ${keyFile}`);
    } else {
      console.log(noKeyFile);
    }
    console.log(`Backup retained at: ${backupPath}`);
  }
}

/**
 * The Postgres database TREK_DB_URL names. Every check that can fail runs
 * before the keys are asked for: the database is reached and holds TREK's
 * tables, and the data directory, which takes the copy and holds the key
 * file, is writable. The copy is a pg_dump custom-format file, the format of
 * the copy a migration takes (wiki: Updating, Rolling back a Postgres update);
 * without it nothing is changed.
 */
async function mainPostgres(): Promise<void> {
  for (const name of ['DB_PATH', 'TREK_DB_FILE']) {
    if (process.env[name]?.trim()) {
      rl.close();
      console.error(
        `TREK_DB_URL and ${name} are both set, so it is not clear which database is meant; nothing was changed.`,
      );
      process.exit(1);
    }
  }

  let server: ServerModules;
  try {
    server = loadServer();
  } catch (err) {
    rl.close();
    console.error(`The server's code is needed to reach a Postgres database: ${(err as Error).message}`);
    console.error('Run this inside the TREK container, or from a source checkout with its dependencies installed.');
    process.exit(1);
  }

  const engine = server.engine.resolveEngine();
  const target = server.engine.postgresTarget(server.appConfig.readEnv().db);
  if (!target) {
    rl.close();
    console.error('TREK_DB_URL does not name a Postgres database; nothing was changed.');
    process.exit(1);
  }
  const paths = server.appConfig.resolveDataPaths();
  const notWritable = firstNotWritable(
    fs.existsSync(paths.encryptionKeyFile) ? [paths.dataDir, paths.encryptionKeyFile] : [paths.dataDir],
  );
  if (notWritable) refuseNotWritable(notWritable);

  console.log(`Database: ${engine.describe()}\n`);

  let orm: MikroORM;
  let hasTables: boolean;
  try {
    orm = await MikroORM.init({ ...server.engine.buildOrmConfig(engine), pool: { min: 0, max: 1 } });
    hasTables = await postgresStore(orm.em.fork()).tableExists('app_settings');
  } catch (err) {
    rl.close();
    console.error(`Could not reach the database TREK_DB_URL names: ${(err as Error).message}`);
    console.error('Nothing was changed.');
    process.exit(1);
  }
  let outcome: { result: MigrationResult; backupPath: string; newKey: string };
  try {
    if (!hasTables) {
      rl.close();
      console.error('The database TREK_DB_URL names holds no TREK tables; nothing was changed.');
      process.exit(1);
    }

    const { oldKey, newKey } = await askKeys();

    const backupPath = path.join(paths.dataDir, `pre-key-rotation-${Date.now()}.pgdump`);
    try {
      await server.pgTools.pgDump(target.url, backupPath, target.binDir);
    } catch (err) {
      rl.close();
      console.error(`Could not copy the database before the rotation: ${(err as Error).message}`);
      console.error('Nothing was changed.');
      process.exit(1);
    }
    console.log(`\nBackup created: ${backupPath}`);

    outcome = { result: await rotateOnPostgres(orm, engine, oldKey, newKey), backupPath, newKey };
  } finally {
    await orm.close(true);
  }
  finish(
    outcome.result,
    outcome.backupPath,
    paths.encryptionKeyFile,
    outcome.newKey,
    'No key file in the data directory. Store the new key wherever TREK reads it from (ENCRYPTION_KEY or data/.encryption_key).',
  );
}

async function main() {
  // The server reads its .env too (index.ts), so TREK_DB_URL kept there picks the same database here.
  loadDotenv({ path: path.join(__dirname, '../.env'), quiet: true });
  openPrompts();
  console.log('=== TREK Encryption Key Migration ===\n');
  console.log('This script re-encrypts all stored secrets under a new ENCRYPTION_KEY.');
  console.log('A backup of the database will be created before any changes are made.\n');

  // A Postgres install keeps its secrets in the database TREK_DB_URL names. No
  // SQLite file is opened, created or backed up then: rotating one left over
  // from before the move would rewrite the key file while the secrets in
  // Postgres stay under the old key.
  if (process.env.TREK_DB_URL?.trim()) {
    await mainPostgres();
    return;
  }

  // The file the server opens: TREK_DB_FILE, else data/travel.db. DB_PATH names it for this script alone.
  const dataDir = path.join(__dirname, '../data');
  const scriptDbPath = process.env.DB_PATH?.trim();
  const serverDbFile = process.env.TREK_DB_FILE?.trim();
  if (scriptDbPath && serverDbFile && path.resolve(scriptDbPath) !== path.resolve(serverDbFile)) {
    rl.close();
    console.error(
      'DB_PATH and TREK_DB_FILE name different files, so it is not clear which database is meant; nothing was changed.',
    );
    process.exit(1);
  }
  const dbPath = path.resolve(scriptDbPath || serverDbFile || path.join(dataDir, 'travel.db'));

  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at: ${dbPath}`);
    console.error('Set TREK_DB_FILE (or DB_PATH) if your database is in a non-standard location.');
    process.exit(1);
  }

  console.log(`Database: ${dbPath}\n`);

  // SQLite silently opens an unwritable file read-only (#2933); db.readonly can't tell.
  const notWritable = firstNotWritable([dbPath, path.dirname(dbPath)]);
  if (notWritable) refuseNotWritable(notWritable);

  const { oldKey, newKey } = await askKeys();

  // Backup
  const backupPath = `${dbPath}.backup-${Date.now()}`;

  const db = new Database(dbPath);
  db.pragma('busy_timeout = 5000');
  // Temp files in memory, like every connection src/db/connection.ts opens: a
  // container with a read-only root and no tmpfs on /tmp has nowhere to put
  // them, and the rotation below runs as one long transaction (#2518).
  db.pragma('temp_store = MEMORY');

  // The rollback copy has to be a consistent snapshot, not a plain file copy:
  // this script is documented as running against a live server, so in WAL mode
  // the committed tail sits in the -wal sidecar a copy would leave behind.
  // VACUUM INTO snapshots even while the server writes; the checkpoint plus
  // copy is only the fallback for when it cannot (disk, lock).
  try {
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
  } catch (err) {
    console.warn(`VACUUM INTO failed (${(err as Error).message}); falling back to checkpoint + copy.`);
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    fs.copyFileSync(dbPath, backupPath);
  }
  console.log(`\nBackup created: ${backupPath}`);

  // journal_mode lives in the file header, so hardcoding WAL here would quietly
  // undo a deliberate DELETE/TRUNCATE setup (network storage) on the first key
  // rotation. This script ships without src/ in the image and cannot import
  // src/app-config, so it reads the same variables directly — keep the defaults
  // in step with parsers.resolveDurability().
  const journalModes = ['DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'WAL', 'OFF'];
  const syncLevels = ['OFF', 'NORMAL', 'FULL', 'EXTRA'];

  const wantedJournal = (process.env.TREK_DB_JOURNAL_MODE ?? '').trim().toUpperCase();
  const journalMode = journalModes.includes(wantedJournal) ? wantedJournal : 'WAL';
  if (wantedJournal && journalMode !== wantedJournal) {
    console.warn(
      `TREK_DB_JOURNAL_MODE="${process.env.TREK_DB_JOURNAL_MODE}" is not a SQLite journal mode — using ${journalMode}.`,
    );
  }

  const wantedSync = (process.env.TREK_DB_SYNCHRONOUS ?? '').trim().toUpperCase();
  const defaultSync = journalMode === 'WAL' ? 'NORMAL' : 'FULL';
  const synchronous = syncLevels.includes(wantedSync) ? wantedSync : defaultSync;
  if (wantedSync && synchronous !== wantedSync) {
    console.warn(
      `TREK_DB_SYNCHRONOUS="${process.env.TREK_DB_SYNCHRONOUS}" is not a SQLite synchronous level — using ${synchronous}.`,
    );
  }

  db.pragma(`journal_mode = ${journalMode}`);
  db.pragma(`synchronous = ${synchronous}`);
  console.log(`Journal mode: ${db.pragma('journal_mode', { simple: true })}\n`);

  const result = await rotateOnSqlite(db, oldKey, newKey);
  db.close();

  // The key file next to a DB_PATH database, else the one the server reads in its data directory.
  finish(
    result,
    backupPath,
    path.join(scriptDbPath ? path.dirname(dbPath) : dataDir, '.encryption_key'),
    newKey,
    'No key file found. Store the new key wherever TREK reads it from (ENCRYPTION_KEY or data/.encryption_key).',
  );
}

// Run as a command only; the Postgres-lane test imports the rotation itself.
if (require.main === module) {
  main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}
