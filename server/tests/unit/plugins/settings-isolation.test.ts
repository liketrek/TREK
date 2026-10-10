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
import { db as testDb } from '../../../src/db/database';
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { NotificationChannelPreferences } from '../../../src/db/entities/NotificationChannelPreferences.entity';
import { PluginActions } from '../../../src/db/entities/PluginActions.entity';
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { PluginEgressHosts } from '../../../src/db/entities/PluginEgressHosts.entity';
import { PluginEntityMetadata } from '../../../src/db/entities/PluginEntityMetadata.entity';
import { PluginErrorLog } from '../../../src/db/entities/PluginErrorLog.entity';
import { PluginMetaMigrations } from '../../../src/db/entities/PluginMetaMigrations.entity';
import { PluginOauthState } from '../../../src/db/entities/PluginOauthState.entity';
import { PluginOauthTokens } from '../../../src/db/entities/PluginOauthTokens.entity';
import { PluginScheduledTasks } from '../../../src/db/entities/PluginScheduledTasks.entity';
import { PluginSettingsFields } from '../../../src/db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../../src/db/entities/PluginUserConfig.entity';
import { PluginUserErasureQueue } from '../../../src/db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import { Settings } from '../../../src/db/entities/Settings.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { parseManifest, ManifestError } from '../../../src/nest/plugins/install/manifest';
import { PluginUserSettingsService } from '../../../src/nest/plugins/plugin-user-settings.service';
import { createUser } from '../../helpers/factories';
import { makePluginSettingsField, setPluginUserConfig } from '../../helpers/factories/plugins';
import { deleteRows, insertRow, upsertRow } from '../../helpers/factories/rows';
import { readUserSetting } from '../../helpers/factories/settings';
import { createTestAddonsService } from '../../helpers/test-addons';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: async () => null };
});

/**
 * The host-side settings reads, over the same connection the test seeded. `t` is
 * initialized in `beforeAll` (below) before any test runs — this reaches for
 * `PluginSettingsFieldsRepository`/`PluginUserConfigRepository` through it, matching
 * PSET-007's own `PluginRuntimeService` construction further down, which reuses the
 * SAME `t` rather than a second ORM over the same connection.
 */
const userSettings = () =>
  new PluginUserSettingsService((t as TestOrm).repo(PluginSettingsFields), (t as TestOrm).repo(PluginUserConfig));

let uid: number;
let t: TestOrm | undefined;

afterAll(async () => {
  await t?.close();
});

const orm = () => t as TestOrm;

async function declareField(pluginId: string, key: string, opts: { required?: boolean; secret?: boolean } = {}) {
  await makePluginSettingsField(orm(), pluginId, key, {
    label: key,
    input_type: 'text',
    required: opts.required ? 1 : 0,
    secret: opts.secret ? 1 : 0,
    scope: 'user',
    sort_order: 0,
  });
}
async function setUserConfig(pluginId: string, config: Record<string, unknown>) {
  await setPluginUserConfig(orm(), pluginId, uid, config);
}

beforeAll(async () => {
  // Plan 3j Task 4 — `userSettings()` above now needs repositories, so the ORM this
  // file eventually built only inside PSET-007 is built here instead, before any
  // test runs (PSET-001..006 call `userSettings()` with no ORM of their own).
  t = await createTestOrm(testDb);
});
beforeEach(async () => {
  await deleteRows(orm(), PluginSettingsFields);
  await deleteRows(orm(), PluginUserConfig);
  await deleteRows(orm(), Settings);
  await deleteRows(orm(), Users);
  uid = createUser(testDb).user.id;
});

describe('plugin settings are isolated from core and from each other', () => {
  it('PSET-001 — a plugin declaring "webhook_url" cannot touch the CORE settings row', async () => {
    await insertRow(orm(), Settings, { user: uid, key: 'webhook_url', value: 'https://core.example.com/real' });
    await declareField('evil', 'webhook_url');
    await setUserConfig('evil', { webhook_url: 'https://attacker.example.com' });

    // The user's REAL notification webhook is untouched — the plugin's value lives in
    // its own blob, in its own table. The namespacing is structural, not by key naming.
    expect(await readUserSetting(orm(), uid, 'webhook_url')).toBe('https://core.example.com/real');
    expect(await userSettings().readAll('evil', uid)).toEqual({ webhook_url: 'https://attacker.example.com' });
  });

  it('PSET-002 — plugin A cannot read plugin B’s config, even with the same key name', async () => {
    await declareField('a', 'token', { secret: true });
    await declareField('b', 'token', { secret: true });
    await setUserConfig('b', { token: 'B-SECRET' });

    expect(await userSettings().readAll('a', uid)).toEqual({});
    expect(await userSettings().readOne('a', uid, 'token')).toBeUndefined();
    expect(await userSettings().readOne('b', uid, 'token')).toBe('B-SECRET');
  });

  it('PSET-003 — a plugin only ever sees its own DECLARED keys', async () => {
    await declareField('p', 'declared');
    // An undeclared key that somehow reached the blob is not handed to the plugin.
    await setUserConfig('p', { declared: 'yes', sneaked: 'no' });
    expect(await userSettings().readAll('p', uid)).toEqual({ declared: 'yes' });
  });
});

describe('settings keys cannot resolve off the prototype chain', () => {
  it.each(['__proto__', 'constructor', 'prototype'])(
    'PSET-004 — a REQUIRED field named "%s" is NOT reported as configured',
    async (key) => {
      await declareField('evil', key, { required: true });
      // The user has configured nothing at all.
      expect(await userSettings().hasRequired('evil', uid)).toBe(false);
      expect(await userSettings().readAll('evil', uid)).toEqual({});
    },
  );

  it('PSET-005 — a genuinely configured required field still reports configured', async () => {
    await declareField('good', 'appToken', { required: true, secret: true });
    expect(await userSettings().hasRequired('good', uid)).toBe(false);
    await setUserConfig('good', { appToken: 'T' });
    expect(await userSettings().hasRequired('good', uid)).toBe(true);
  });

  it('PSET-006 — the manifest rejects such a key at install', () => {
    const base = {
      id: 'evil',
      name: 'Evil',
      version: '1.0.0',
      apiVersion: 1,
      type: 'integration',
      nativeModules: false,
      permissions: [],
    };
    for (const key of ['__proto__', 'constructor', 'prototype', 'has space', '1leading', 'a'.repeat(65)]) {
      expect(() => parseManifest({ ...base, settings: [{ key, scope: 'user' }] })).toThrow(ManifestError);
    }
    // …and still accepts an ordinary one.
    expect(
      parseManifest({ ...base, settings: [{ key: 'appToken', scope: 'user', secret: true, required: true }] })
        .settings[0].key,
    ).toBe('appToken');
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

    await upsertRow(orm(), Plugins, {
      id: 'loud',
      name: 'Loud',
      status: 'active',
      enabled: 1,
      version: '1.0.0',
      permissions: '[]',
      granted_permissions: '[]',
      capabilities: JSON.stringify({ notificationChannel: { title: '🎉'.repeat(5) + 'A'.repeat(500) } }),
      config: '{}',
    });

    const rt = new PluginRuntimeService(
      new AuditService(t.repo(AuditLog), t.repo(Users)),
      await createTestAddonsService(testDb),
      userSettings(),
      t.repo(Plugins),
      t.repo(PluginErrorLog),
      t.repo(PluginScheduledTasks),
      t.repo(PluginUserErasureQueue),
      t.repo(PluginEgressHosts),
      t.repo(PluginSettingsFields),
      t.repo(PluginActions),
      t.repo(PluginUserConfig),
      t.repo(PluginEntityMetadata),
      t.repo(PluginOauthTokens),
      t.repo(PluginOauthState),
      t.repo(PluginMetaMigrations),
      t.repo(PluginCapabilityAudit),
      t.repo(Settings),
      t.repo(NotificationChannelPreferences),
      // Plan 4 Task 4: `uow` is no longer `@Optional()`.
      new UnitOfWork(t.em),
    );
    // Stand the plugin up as a granted, active notificationChannel provider.
    (rt as unknown as { supervisor: { running: Map<string, unknown> } }).supervisor.running.set('loud', {
      id: 'loud',
      status: 'active',
      hooks: ['notificationChannel'],
      granted: new Set(['hook:notification-channel']),
    });

    const [channel] = await rt.notificationChannels();
    expect(channel.id).toBe('plugin:loud');
    expect(channel.label!.length).toBeLessThanOrEqual(40);
    expect(channel.label).not.toMatch(/\p{Extended_Pictographic}/u);
    delete process.env.TREK_PLUGINS_ENABLED;
  });
});
