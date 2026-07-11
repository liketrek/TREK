/**
 * Plugin settings isolation.
 *
 * A plugin's settings live in its OWN storage — instance config in `plugins.config`,
 * per-user config in `plugin_user_config` keyed by (plugin_id, user_id). Plugin code
 * never writes the core `settings` table, and every read helper is host-bound to one
 * plugin id. These tests pin that, plus the settings-key constraint: an unconstrained
 * key (`__proto__`, `constructor`) used to resolve off Object.prototype, so a REQUIRED
 * field with such a name reported as configured for a user who had configured nothing —
 * which for a notification channel meant being dispatched to everyone with no credentials.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null } };
});
vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({ JWT_SECRET: 'x'.repeat(40), ENCRYPTION_KEY: 'a'.repeat(64), updateJwtSecret: () => {} }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { createUser } from '../../helpers/factories';
import { readUserSettingsDecrypted, hasRequiredUserSettings, readUserSettingDecrypted } from '../../../src/nest/plugins/plugins.service';
import { parseManifest, ManifestError } from '../../../src/nest/plugins/install/manifest';

let uid: number;

function declareField(pluginId: string, key: string, opts: { required?: boolean; secret?: boolean } = {}) {
  testDb.prepare(
    `INSERT INTO plugin_settings_fields (plugin_id, field_key, label, input_type, required, secret, scope, sort_order)
     VALUES (?, ?, ?, 'text', ?, ?, 'user', 0)`,
  ).run(pluginId, key, key, opts.required ? 1 : 0, opts.secret ? 1 : 0);
}
function setUserConfig(pluginId: string, config: Record<string, unknown>) {
  testDb.prepare('INSERT OR REPLACE INTO plugin_user_config (plugin_id, user_id, config) VALUES (?, ?, ?)').run(pluginId, uid, JSON.stringify(config));
}

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => {
  testDb.prepare('DELETE FROM plugin_settings_fields').run();
  testDb.prepare('DELETE FROM plugin_user_config').run();
  testDb.prepare('DELETE FROM settings').run();
  testDb.prepare('DELETE FROM users').run();
  uid = createUser(testDb).user.id;
});

describe('plugin settings are isolated from core and from each other', () => {
  it('PSET-001 — a plugin declaring "webhook_url" cannot touch the CORE settings row', () => {
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'webhook_url', 'https://core.example.com/real')").run(uid);
    declareField('evil', 'webhook_url');
    setUserConfig('evil', { webhook_url: 'https://attacker.example.com' });

    // The user's REAL notification webhook is untouched — the plugin's value lives in
    // its own blob, in its own table. The namespacing is structural, not by key naming.
    const core = testDb.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'webhook_url'").get(uid) as { value: string };
    expect(core.value).toBe('https://core.example.com/real');
    expect(readUserSettingsDecrypted('evil', uid)).toEqual({ webhook_url: 'https://attacker.example.com' });
  });

  it('PSET-002 — plugin A cannot read plugin B’s config, even with the same key name', () => {
    declareField('a', 'token', { secret: true });
    declareField('b', 'token', { secret: true });
    setUserConfig('b', { token: 'B-SECRET' });

    expect(readUserSettingsDecrypted('a', uid)).toEqual({});
    expect(readUserSettingDecrypted('a', uid, 'token')).toBeUndefined();
    expect(readUserSettingDecrypted('b', uid, 'token')).toBe('B-SECRET');
  });

  it('PSET-003 — a plugin only ever sees its own DECLARED keys', () => {
    declareField('p', 'declared');
    // An undeclared key that somehow reached the blob is not handed to the plugin.
    setUserConfig('p', { declared: 'yes', sneaked: 'no' });
    expect(readUserSettingsDecrypted('p', uid)).toEqual({ declared: 'yes' });
  });
});

describe('settings keys cannot resolve off the prototype chain', () => {
  it.each(['__proto__', 'constructor', 'prototype'])(
    'PSET-004 — a REQUIRED field named "%s" is NOT reported as configured',
    (key) => {
      declareField('evil', key, { required: true });
      // The user has configured nothing at all.
      expect(hasRequiredUserSettings('evil', uid)).toBe(false);
      expect(readUserSettingsDecrypted('evil', uid)).toEqual({});
    },
  );

  it('PSET-005 — a genuinely configured required field still reports configured', () => {
    declareField('good', 'appToken', { required: true, secret: true });
    expect(hasRequiredUserSettings('good', uid)).toBe(false);
    setUserConfig('good', { appToken: 'T' });
    expect(hasRequiredUserSettings('good', uid)).toBe(true);
  });

  it('PSET-006 — the manifest rejects such a key at install', () => {
    const base = { id: 'evil', name: 'Evil', version: '1.0.0', apiVersion: 1, type: 'integration', nativeModules: false, permissions: [] };
    for (const key of ['__proto__', 'constructor', 'prototype', 'has space', '1leading', 'a'.repeat(65)]) {
      expect(() => parseManifest({ ...base, settings: [{ key, scope: 'user' }] })).toThrow(ManifestError);
    }
    // …and still accepts an ordinary one.
    expect(parseManifest({ ...base, settings: [{ key: 'appToken', scope: 'user', secret: true, required: true }] }).settings[0].key).toBe('appToken');
  });
});

/**
 * The channel label is a plugin-supplied string that becomes a column header in the
 * user's notification preferences matrix, so the host bounds it like every other
 * plugin string it renders (cf. cap()/stripEmoji in the calendar + photo controllers).
 */
describe('a plugin channel label is bounded by the host', () => {
  it('PSET-007 — an oversized, emoji-laden capabilities.title is capped and stripped', async () => {
    const { PluginRuntimeService } = await import('../../../src/nest/plugins/plugin-runtime.service');
    process.env.TREK_PLUGINS_ENABLED = 'true';

    testDb.prepare(
      `INSERT OR REPLACE INTO plugins (id, name, status, enabled, version, permissions, granted_permissions, capabilities, config)
       VALUES ('loud', 'Loud', 'active', 1, '1.0.0', '[]', '[]', ?, '{}')`,
    ).run(JSON.stringify({ notificationChannel: { title: '🎉'.repeat(5) + 'A'.repeat(500) } }));

    const rt = new PluginRuntimeService();
    // Stand the plugin up as a granted, active notificationChannel provider.
    (rt as unknown as { supervisor: { running: Map<string, unknown> } }).supervisor.running.set('loud', {
      id: 'loud', status: 'active', hooks: ['notificationChannel'], granted: new Set(['hook:notification-channel']),
    });

    const [channel] = rt.notificationChannels();
    expect(channel.id).toBe('plugin:loud');
    expect(channel.label!.length).toBeLessThanOrEqual(40);
    expect(channel.label).not.toMatch(/\p{Extended_Pictographic}/u);
    delete process.env.TREK_PLUGINS_ENABLED;
  });
});
