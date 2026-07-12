/**
 * A plugin channel may only ever ADD a channel — never override or shadow a built-in.
 *
 * The runtime mints plugin ids with pluginChannelId() and leaves the built-in-only
 * privileges off, so none of this is reachable through a manifest. These tests pin the
 * REGISTRY's own enforcement, so the guarantee survives a bug or a future caller that
 * hands the registry a channel it shouldn't. Without it, a channel claiming `email`
 * rides the user's email opt-in and receives admin-scoped notifications.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => null, isOwner: () => false, getPlaceWithTags: () => null } };
});
vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({ JWT_SECRET: 'x'.repeat(40), ENCRYPTION_KEY: 'a'.repeat(64), updateJwtSecret: () => {} }));
vi.mock('../../../src/services/apiKeyCrypto', () => ({ decrypt_api_key: (v: string) => v, maybe_encrypt_api_key: (v: string) => v, encrypt_api_key: (v: string) => v }));
const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn().mockResolvedValue({ accepted: ['a@b.c'] }) }));
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock, verify: vi.fn() })) } }));
vi.stubGlobal('fetch', vi.fn());
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', () => ({ checkSsrf: vi.fn(async () => ({ allowed: true, resolvedIp: '1.2.3.4' })), createPinnedDispatcher: vi.fn(() => ({})) }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, setAppSetting, setNotificationChannels } from '../../helpers/factories';
import { send } from '../../../src/services/notificationService';
import { getPreferencesMatrix } from '../../../src/services/notificationPreferencesService';
import {
  setPluginChannelSource,
  listChannels,
  getChannel,
  registerChannel,
  type ExternalChannel,
} from '../../../src/services/notifications/channelRegistry';

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => { resetTestDb(testDb); setPluginChannelSource(null); });

const rogueSend = vi.fn().mockResolvedValue(true);
const rogueGlobal = vi.fn().mockResolvedValue(true);

function setSmtp(): void {
  setAppSetting(testDb, 'smtp_host', 'mail.test.com');
  setAppSetting(testDb, 'smtp_port', '587');
  setAppSetting(testDb, 'smtp_from', 'trek@test.com');
}

/** A channel claiming a BUILT-IN id plus the built-in-only privilege flags. */
function rogue(over: Partial<ExternalChannel> = {}): ExternalChannel {
  return {
    id: 'email',
    source: 'builtin',
    bypassesActiveToggleForAdminEvents: true,
    supportsAdminGlobal: true,
    supportsEvent: () => true,
    isConfiguredFor: () => true,
    sendToUser: rogueSend,
    sendGlobal: rogueGlobal,
    ...over,
  } as ExternalChannel;
}

const TRIP_INVITE = { event: 'trip_invite', actorId: null, scope: 'user', targetId: 0, params: { trip: 'Rome', actor: 'A', invitee: 'B', tripId: '1' } } as const;

describe('a plugin channel can never override a built-in', () => {
  beforeEach(() => { rogueSend.mockClear(); rogueGlobal.mockClear(); });

  it('CHOVR-001 — a channel claiming a built-in id is dropped from the registry', () => {
    setPluginChannelSource(() => [rogue()]);
    expect(listChannels().filter(c => c.id === 'email')).toHaveLength(1);
    expect(getChannel('email')!.source).toBe('builtin');
  });

  it('CHOVR-002 — it does NOT ride the user’s email opt-in', async () => {
    const { user } = createUser(testDb);
    setSmtp();
    setNotificationChannels(testDb, 'email'); // the user enabled EMAIL, not a plugin
    setPluginChannelSource(() => [rogue()]);

    await send({ ...TRIP_INVITE, targetId: user.id });

    expect(rogueSend).not.toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledTimes(1); // the real email channel still delivers
  });

  it('CHOVR-003 — an un-namespaced id is dropped even when it collides with nothing', () => {
    setPluginChannelSource(() => [rogue({ id: 'carrier-pigeon', source: 'plugin' })]);
    expect(listChannels().map(c => c.id)).not.toContain('carrier-pigeon');
  });

  it('CHOVR-004 — a properly namespaced channel IS admitted', () => {
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin' })]);
    expect(listChannels().map(c => c.id)).toContain('plugin:gotify');
  });

  it('CHOVR-005 — an admitted plugin channel has its built-in-only privileges stripped', () => {
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify' })]);
    const ch = getChannel('plugin:gotify')!;
    expect(ch.source).toBe('plugin'); // it cannot self-declare as a built-in
    expect(ch.bypassesActiveToggleForAdminEvents).toBe(false);
    expect(ch.supportsAdminGlobal).toBe(false);
    expect(ch.sendGlobal).toBeUndefined();
  });

  it('CHOVR-006 — a plugin channel gets NO admin-scoped event, even claiming to support one', async () => {
    createAdmin(testDb);
    setSmtp();
    setNotificationChannels(testDb, 'plugin:gotify');
    // supportsEvent lies and says yes to everything; the registry strips what makes it matter.
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', supportsEvent: () => true })]);

    await send({ event: 'version_available', actorId: null, scope: 'admin', targetId: 0, params: { version: '9.9.9' } });

    expect(rogueSend).not.toHaveBeenCalled();
    expect(rogueGlobal).not.toHaveBeenCalled();
  });

  it('CHOVR-007 — duplicate plugin ids collapse to one (no double send, no double column)', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'plugin:gotify');
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify' }), rogue({ id: 'plugin:gotify' })]);

    expect(listChannels().filter(c => c.id === 'plugin:gotify')).toHaveLength(1);
    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(rogueSend).toHaveBeenCalledTimes(1);
  });

  it('CHOVR-008 — the preferences matrix never shows a duplicate column', () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email');
    setPluginChannelSource(() => [rogue()]);
    const ids = getPreferencesMatrix(user.id, 'user').channels.map(c => c.id);
    expect(ids.filter(i => i === 'email')).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('CHOVR-009 — a built-in may not claim the plugin namespace either', () => {
    expect(() => registerChannel(rogue({ id: 'plugin:sneaky' }))).toThrow(/plugin namespace/);
  });
});

describe('a live plugin channel needs no second opt-in', () => {
  beforeEach(() => { rogueSend.mockClear(); });

  it('CHOVR-011 — it appears in the matrix with NOTHING in notification_channels', () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'none'); // the admin has enabled no built-in at all
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin', label: 'Gotify' })]);

    const matrix = getPreferencesMatrix(user.id, 'user');
    const ch = matrix.channels.find(c => c.id === 'plugin:gotify')!;
    // Enabling the PLUGIN is the opt-in. There is no UI that can write a `plugin:` id into
    // the notification_channels CSV, so requiring one meant the channel could never show.
    expect(ch.active).toBe(true);
    expect(ch.label).toBe('Gotify');
    expect(matrix.implemented_combos['trip_invite']).toContain('plugin:gotify');
  });

  it('CHOVR-012 — and it actually DELIVERS with nothing in notification_channels', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'none');
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin' })]);

    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(rogueSend).toHaveBeenCalledTimes(1);
  });

  it('CHOVR-013 — a BUILT-IN still needs its explicit switch', async () => {
    const { user } = createUser(testDb);
    setSmtp();
    setNotificationChannels(testDb, 'none'); // email NOT enabled
    sendMailMock.mockClear();

    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('CHOVR-014 — an unconfigured user sees the column but gets no delivery', async () => {
    const { user } = createUser(testDb);
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin', isConfiguredFor: () => false })]);

    const ch = getPreferencesMatrix(user.id, 'user').channels.find(c => c.id === 'plugin:gotify')!;
    expect(ch.active).toBe(true);      // shown — so they can see it and go configure it
    expect(ch.configured).toBe(false); // …but flagged as needing setup

    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(rogueSend).not.toHaveBeenCalled(); // no credentials → nothing to send with
  });
});
