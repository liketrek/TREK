/**
 * Unit tests for notificationPreferencesService.
 * Covers NPREF-001 to NPREF-021.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string | null) => v,
  maybe_encrypt_api_key: (v: string) => v,
  encrypt_api_key: (v: string) => v,
}));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, setAppSetting, setNotificationChannels, disableNotificationPref } from '../../helpers/factories';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { NotificationPreferencesService } from '../../../src/nest/notifications/notification-preferences.service';
import { registerBuiltinChannels } from '../../../src/nest/notifications/channels/builtins';
import { NtfyService } from '../../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../../src/nest/notifications/transports/webhook.service';
import { __resetChannelsForTest } from '../../../src/nest/notifications/channel-registry';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestSettingsRepo, createTestUsersRepo } from '../../helpers/test-uow';
import { createTestNotificationChannelPreferencesRepo } from '../../helpers/notifications-repos';
import { makeWebPushService } from '../../helpers/notifications';

// Built in beforeAll: MailerService/WebhookService/NtfyService now take
// repositories, resolved async through test-uow.ts's memoised factories.
let mailer: MailerService;
// Constructed in beforeAll: the service now takes a UnitOfWork, which is async to build.
let svc: NotificationPreferencesService;

// Legacy free-function names bound to the service, so the moved cases read as before.
// Arrow forwarders rather than `.bind(svc)`: under `strictBindCallApply: false` a bound
// alias is typed `any`, which hides a missing `await` from tsc AND from the type-aware
// lint rules (recipe R4).
type Svc = NotificationPreferencesService;
const isEnabledForEvent = (...a: Parameters<Svc['isEnabledForEvent']>) => svc.isEnabledForEvent(...a);
const getPreferencesMatrix = (...a: Parameters<Svc['getPreferencesMatrix']>) => svc.getPreferencesMatrix(...a);
const setPreferences = (...a: Parameters<Svc['setPreferences']>) => svc.setPreferences(...a);
const setAdminPreferences = (...a: Parameters<Svc['setAdminPreferences']>) => svc.setAdminPreferences(...a);
const getAdminGlobalPref = (...a: Parameters<Svc['getAdminGlobalPref']>) => svc.getAdminGlobalPref(...a);
const getActiveChannels = (...a: Parameters<Svc['getActiveChannels']>) => svc.getActiveChannels(...a);
const isSmtpConfigured = (...a: Parameters<Svc['isSmtpConfigured']>) => svc.isSmtpConfigured(...a);
const isWebhookConfigured = (...a: Parameters<Svc['isWebhookConfigured']>) => svc.isWebhookConfigured(...a);

beforeAll(async () => {
  const usersRepo = await createTestUsersRepo(testDb);
  const settingsRepo = await createTestSettingsRepo(testDb);
  const appSettingsRepoForChannels = await createTestAppSettingsRepo(testDb);
  mailer = new MailerService(usersRepo, settingsRepo, appSettingsRepoForChannels);
  registerBuiltinChannels({
    mailer,
    webhook: new WebhookService(settingsRepo, appSettingsRepoForChannels),
    ntfy: new NtfyService(settingsRepo, appSettingsRepoForChannels),
    push: await makeWebPushService(testDb),
  });
  svc = new NotificationPreferencesService(
    mailer,
    await createTestUnitOfWork(testDb),
    await createTestAppSettingsRepo(testDb),
    await createTestNotificationChannelPreferencesRepo(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// isEnabledForEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('isEnabledForEvent', () => {
  it('NPREF-001 — returns true when no row exists (default enabled)', async () => {
    const { user } = createUser(testDb);
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(true);
  });

  it('NPREF-002 — returns true when row exists with enabled=1', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO notification_channel_preferences (user_id, event_type, channel, enabled) VALUES (?, ?, ?, 1)'
    ).run(user.id, 'trip_invite', 'email');
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(true);
  });

  it('NPREF-003 — returns false when row exists with enabled=0', async () => {
    const { user } = createUser(testDb);
    disableNotificationPref(testDb, user.id, 'trip_invite', 'email');
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPreferencesMatrix
// ─────────────────────────────────────────────────────────────────────────────

describe('getPreferencesMatrix', () => {
  it('NPREF-004 — regular user does not see version_available in event_types', async () => {
    const { user } = createUser(testDb);
    const { event_types } = await getPreferencesMatrix(user.id, 'user');
    expect(event_types).not.toContain('version_available');
    // +1 for plugin_notification: users can mute host-mediated plugin notifications.
    expect(event_types.length).toBe(12);
  });

  it('NPREF-005 — user scope excludes version_available for everyone including admins', async () => {
    const { user } = createAdmin(testDb);
    const { event_types } = await getPreferencesMatrix(user.id, 'admin', 'user');
    expect(event_types).not.toContain('version_available');
    expect(event_types.length).toBe(12);
  });

  it('NPREF-005b — admin scope returns the admin-scoped events', async () => {
    const { user } = createAdmin(testDb);
    const { event_types } = await getPreferencesMatrix(user.id, 'admin', 'admin');
    expect(event_types).toContain('version_available');
    expect(event_types).toContain('replica_failure');
    expect(event_types.length).toBe(2);
  });

  it('NPREF-006 — returns default true for all preferences when no stored prefs', async () => {
    const { user } = createUser(testDb);
    const { preferences } = await getPreferencesMatrix(user.id, 'user');
    for (const [, channels] of Object.entries(preferences)) {
      for (const [, enabled] of Object.entries(channels as Record<string, boolean>)) {
        expect(enabled).toBe(true);
      }
    }
  });

  it('NPREF-007 — reflects stored disabled preferences in the matrix', async () => {
    const { user } = createUser(testDb);
    disableNotificationPref(testDb, user.id, 'trip_invite', 'email');
    disableNotificationPref(testDb, user.id, 'collab_message', 'webhook');
    const { preferences } = await getPreferencesMatrix(user.id, 'user');
    expect(preferences['trip_invite']!['email']).toBe(false);
    expect(preferences['collab_message']!['webhook']).toBe(false);
    // Others unaffected
    expect(preferences['trip_invite']!['webhook']).toBe(true);
    expect(preferences['booking_change']!['email']).toBe(true);
  });

  it('NPREF-008 — the inapp channel is always active', async () => {
    const { user } = createUser(testDb);
    const { channels } = await getPreferencesMatrix(user.id, 'user');
    expect(channels.find(c => c.id === 'inapp')?.active).toBe(true);
  });

  it('NPREF-009 — email is active when email is in notification_channels', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email');
    const { channels } = await getPreferencesMatrix(user.id, 'user');
    expect(channels.find(c => c.id === 'email')?.active).toBe(true);
  });

  it('NPREF-010 — email is inactive when email is not in notification_channels', async () => {
    const { user } = createUser(testDb);
    // No notification_channels set → defaults to none
    const { channels } = await getPreferencesMatrix(user.id, 'user');
    expect(channels.find(c => c.id === 'email')?.active).toBe(false);
  });

  it('NPREF-011 — implemented_combos maps version_available to [inapp, email, webhook, ntfy]', async () => {
    const { user } = createAdmin(testDb);
    const { implemented_combos } = await getPreferencesMatrix(user.id, 'admin', 'admin');
    expect(implemented_combos['version_available']).toEqual(['inapp', 'email', 'webhook', 'ntfy']);
    // All events now support all four channels
    expect(implemented_combos['trip_invite']).toContain('inapp');
    expect(implemented_combos['trip_invite']).toContain('email');
    expect(implemented_combos['trip_invite']).toContain('webhook');
    expect(implemented_combos['trip_invite']).toContain('ntfy');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setPreferences
// ─────────────────────────────────────────────────────────────────────────────

describe('setPreferences', () => {
  it('NPREF-012 — disabling a preference inserts a row with enabled=0', async () => {
    const { user } = createUser(testDb);
    await setPreferences(user.id, { trip_invite: { email: false } });
    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'trip_invite', 'email') as { enabled: number } | undefined;
    expect(row).toBeDefined();
    expect(row!.enabled).toBe(0);
  });

  it('NPREF-013 — re-enabling a preference removes the disabled row', async () => {
    const { user } = createUser(testDb);
    // First disable
    disableNotificationPref(testDb, user.id, 'trip_invite', 'email');
    // Then re-enable
    await setPreferences(user.id, { trip_invite: { email: true } });
    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'trip_invite', 'email');
    // Row should be deleted — default is enabled
    expect(row).toBeUndefined();
  });

  it('NPREF-014 — bulk update handles multiple event+channel combos', async () => {
    const { user } = createUser(testDb);
    await setPreferences(user.id, {
      trip_invite: { email: false, webhook: false },
      booking_change: { email: false },
      trip_reminder: { webhook: true },
    });
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(false);
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'webhook')).toBe(false);
    expect(await isEnabledForEvent(user.id, 'booking_change', 'email')).toBe(false);
    // trip_reminder webhook was set to true → no row, default enabled
    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'trip_reminder', 'webhook');
    expect(row).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getActiveChannels
// ─────────────────────────────────────────────────────────────────────────────

describe('getActiveChannels', () => {
  it('NPREF-015 — returns [] when notification_channels is none', async () => {
    setAppSetting(testDb, 'notification_channels', 'none');
    expect(await getActiveChannels()).toEqual([]);
  });

  it('NPREF-016 — returns [email] when notification_channels is email', async () => {
    setAppSetting(testDb, 'notification_channels', 'email');
    expect(await getActiveChannels()).toEqual(['email']);
  });

  it('NPREF-017 — returns [email, webhook] when notification_channels is email,webhook', async () => {
    setAppSetting(testDb, 'notification_channels', 'email,webhook');
    expect(await getActiveChannels()).toEqual(['email', 'webhook']);
  });

  it('NPREF-018 — falls back to notification_channel (singular) when plural key absent', async () => {
    // Only set the singular key
    setAppSetting(testDb, 'notification_channel', 'webhook');
    // No notification_channels key
    expect(await getActiveChannels()).toEqual(['webhook']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SMTP / active-channel detection
// ─────────────────────────────────────────────────────────────────────────────

describe('channel availability', () => {
  it('NPREF-019 — detects SMTP config from app_settings.smtp_host', async () => {
    setAppSetting(testDb, 'smtp_host', 'mail.example.com');
    expect(await isSmtpConfigured()).toBe(true);
  });

  it('NPREF-020 — webhook is active when admin has enabled the webhook channel', async () => {
    setNotificationChannels(testDb, 'webhook');
    expect(await getActiveChannels()).toContain('webhook');
  });

  it('NPREF-021 — detects SMTP config from env var SMTP_HOST', async () => {
    const original = process.env.SMTP_HOST;
    process.env.SMTP_HOST = 'env-mail.example.com';
    try {
      expect(await isSmtpConfigured()).toBe(true);
    } finally {
      if (original === undefined) delete process.env.SMTP_HOST;
      else process.env.SMTP_HOST = original;
    }
  });

  it('NPREF-022 — an unknown channel id in notification_channels is ignored', async () => {
    // e.g. a plugin channel left in the CSV after the plugin was uninstalled
    setNotificationChannels(testDb, 'webhook,plugin:long-gone');
    expect(await getActiveChannels()).toEqual(['webhook']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setAdminPreferences
// ─────────────────────────────────────────────────────────────────────────────

describe('setAdminPreferences', () => {
  it('NPREF-022 — disabling email for version_available stores global pref in app_settings', async () => {
    const { user } = createAdmin(testDb);
    await setAdminPreferences(user.id, { version_available: { email: false } });
    expect(await getAdminGlobalPref('version_available', 'email')).toBe(false);
    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = ?").get('admin_notif_pref_version_available_email') as { value: string } | undefined;
    expect(row?.value).toBe('0');
  });

  it('NPREF-023 — disabling inapp for version_available stores per-user row in notification_channel_preferences', async () => {
    const { user } = createAdmin(testDb);
    await setAdminPreferences(user.id, { version_available: { inapp: false } });
    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'version_available', 'inapp') as { enabled: number } | undefined;
    expect(row).toBeDefined();
    expect(row!.enabled).toBe(0);
    // Global app_settings should NOT have an inapp key
    const globalRow = testDb.prepare("SELECT value FROM app_settings WHERE key = ?").get('admin_notif_pref_version_available_inapp');
    expect(globalRow).toBeUndefined();
  });

  it('NPREF-024 — re-enabling inapp removes the disabled per-user row', async () => {
    const { user } = createAdmin(testDb);
    // First disable
    disableNotificationPref(testDb, user.id, 'version_available', 'inapp');
    // Then re-enable via setAdminPreferences
    await setAdminPreferences(user.id, { version_available: { inapp: true } });
    const row = testDb.prepare(
      'SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?'
    ).get(user.id, 'version_available', 'inapp');
    expect(row).toBeUndefined();
  });

  it('NPREF-025 — enabling email stores global pref as "1" in app_settings', async () => {
    const { user } = createAdmin(testDb);
    // First disable, then re-enable
    await setAdminPreferences(user.id, { version_available: { email: false } });
    await setAdminPreferences(user.id, { version_available: { email: true } });
    expect(await getAdminGlobalPref('version_available', 'email')).toBe(true);
    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = ?").get('admin_notif_pref_version_available_email') as { value: string } | undefined;
    expect(row?.value).toBe('1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isWebhookConfigured
// ─────────────────────────────────────────────────────────────────────────────

describe('isWebhookConfigured', () => {
  it('NPREF-026 — returns false when webhook is not in active channels', async () => {
    // No notification_channels configured → defaults don't include webhook
    expect(await isWebhookConfigured()).toBe(false);
  });

  it('NPREF-027 — returns true when webhook is in active channels', async () => {
    setNotificationChannels(testDb, 'webhook');
    expect(await isWebhookConfigured()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Instance defaults (#1536)
// ─────────────────────────────────────────────────────────────────────────────

describe('instance defaults', () => {
  it('NPREF-028 — "off" as the default turns a cell off for everyone who never touched it', async () => {
    const { user } = createUser(testDb);
    await svc.setInstanceDefaults({ trip_invite: { email: 'off' } });
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(false);
    expect((await getPreferencesMatrix(user.id, 'user')).preferences.trip_invite?.email).toBe(false);
    // Other cells keep the old default.
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'inapp')).toBe(true);
  });

  it('NPREF-029 — a user may still turn an "off" default on, and that choice is kept', async () => {
    const { user } = createUser(testDb);
    await svc.setInstanceDefaults({ trip_invite: { email: 'off' } });
    await setPreferences(user.id, { trip_invite: { email: true } });
    expect(await isEnabledForEvent(user.id, 'trip_invite', 'email')).toBe(true);
    // Switching back to the default leaves no row behind.
    await setPreferences(user.id, { trip_invite: { email: false } });
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM notification_channel_preferences WHERE user_id = ?').get(user.id)).toEqual({ n: 0 });
  });

  it('NPREF-030 — a blocked cell is off, locked in the matrix, and a user cannot turn it on', async () => {
    const { user } = createUser(testDb);
    await svc.setInstanceDefaults({ booking_change: { email: 'blocked' } });
    await setPreferences(user.id, { booking_change: { email: true } });
    expect(await isEnabledForEvent(user.id, 'booking_change', 'email')).toBe(false);
    const matrix = await getPreferencesMatrix(user.id, 'user');
    expect(matrix.preferences.booking_change?.email).toBe(false);
    expect(matrix.locked?.booking_change).toEqual(['email']);
  });

  it('NPREF-031 — admin-scoped events and unknown cells are never touched by defaults', async () => {
    const { user: admin } = createAdmin(testDb);
    await svc.setInstanceDefaults({ version_available: { inapp: 'blocked' }, trip_invite: { carrier_pigeon: 'off' } } as never);
    expect(await isEnabledForEvent(admin.id, 'version_available', 'inapp')).toBe(true);
    expect(testDb.prepare("SELECT COUNT(*) AS n FROM app_settings WHERE key LIKE 'notif_default_%'").get()).toEqual({ n: 0 });
  });

  it('NPREF-032 — the defaults matrix lists user events only, "on" stores nothing', async () => {
    const { user: admin } = createAdmin(testDb);
    await svc.setInstanceDefaults({ trip_invite: { email: 'off' } });
    const before = await svc.getInstanceDefaults(admin.id);
    expect(before.event_types).not.toContain('version_available');
    expect(before.defaults.trip_invite?.email).toBe('off');
    expect(before.defaults.trip_invite?.inapp).toBe('on');
    await svc.setInstanceDefaults({ trip_invite: { email: 'on' } });
    expect(testDb.prepare("SELECT COUNT(*) AS n FROM app_settings WHERE key LIKE 'notif_default_%'").get()).toEqual({ n: 0 });
  });
});
