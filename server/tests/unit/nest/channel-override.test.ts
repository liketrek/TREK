/**
 * A plugin channel may only ever ADD a channel — never override or shadow a built-in.
 *
 * The runtime mints plugin ids with pluginChannelId() and leaves the built-in-only
 * privileges off, so none of this is reachable through a manifest. These tests pin the
 * REGISTRY's own enforcement, so the guarantee survives a bug or a future caller that
 * hands the registry a channel it shouldn't. Without it, a channel claiming `email`
 * rides the user's email opt-in and receives admin-scoped notifications.
 */
import { db as testDb } from '../../../src/db/database';
import {
  setPluginChannelSource,
  listChannels,
  getChannel,
  registerChannel,
} from '../../../src/nest/notifications/channel-registry';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
// The registry consumes ExternalChannel but does not re-export it; it is declared here.
import type { ExternalChannel } from '../../../src/nest/notifications/notification-events';
import { NotificationPreferencesService } from '../../../src/nest/notifications/notification-preferences.service';
// The send dispatcher is DI-native since the notifications fold
// (notifications.instance.ts died with the last cycle-dodge bridge); a
// hand-constructed instance still shares the module-scoped channel registry,
// which is exactly what CHOVR-015 pins.
import type { NotificationPayload, NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { NtfyService } from '../../../src/nest/notifications/transports/ntfy.service';
import { WebhookService } from '../../../src/nest/notifications/transports/webhook.service';
import { createUser, createAdmin, setAppSetting, setNotificationChannels } from '../../helpers/factories';
import { makePlugin } from '../../helpers/factories/plugins';
import { makeNotificationsService } from '../../helpers/notifications';
import { createTestNotificationChannelPreferencesRepo } from '../../helpers/notifications-repos';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { resetTestDb } from '../../helpers/test-db';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestSettingsRepo,
  createTestUsersRepo,
  sharedTestOrm,
} from '../../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => null,
    isOwner: () => false,
    getPlaceWithTags: () => null,
  };
});

vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
  encrypt_api_key: (v: string) => v,
}));
const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn().mockResolvedValue({ accepted: ['a@b.c'] }) }));
vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock, verify: vi.fn() })) },
}));
vi.stubGlobal('fetch', vi.fn());
vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  }
  const checkSsrf = vi.fn(async (_url: string) => ({ allowed: true, resolvedIp: '1.2.3.4' }));
  return {
    checkSsrf,
    createPinnedDispatcher: vi.fn(() => ({})),
    SsrfBlockedError,
    // The notification transports go through safeFetchFollow now, so the fake
    // has to guard and then hand over to the stubbed fetch the way it does.
    safeFetchFollow: vi.fn(async (url: string, init?: RequestInit) => {
      const verdict = await checkSsrf(url);
      if (!verdict.allowed) {
        throw new SsrfBlockedError((verdict as { error?: string }).error ?? 'Request blocked by SSRF guard');
      }
      return fetch(url, init);
    }),
  };
});

// One instance, built at module load like the old import-time singleton: its
// constructor is what registers the built-in channels the registry cases read.
// Built in beforeAll: the service now takes a UnitOfWork, which is async to build.
// Its constructor is still what registers the built-in channels the registry cases read.
let notifications: NotificationsService;
const send = (payload: NotificationPayload) => notifications.send(payload);

let prefsSvc: NotificationPreferencesService;
// An arrow forwarder rather than `.bind(prefsSvc)`: under `strictBindCallApply: false`
// a bound alias is typed `any`, which hides a missing `await` from tsc and the lint
// rules alike (recipe R4).
const getPreferencesMatrix = (...a: Parameters<NotificationPreferencesService['getPreferencesMatrix']>) =>
  prefsSvc.getPreferencesMatrix(...a);
void WebhookService;
void NtfyService;

beforeAll(async () => {
  prefsSvc = new NotificationPreferencesService(
    new MailerService(
      await createTestUsersRepo(testDb),
      await createTestSettingsRepo(testDb),
      await createTestAppSettingsRepo(testDb),
    ),
    await createTestUnitOfWork(testDb),
    await createTestAppSettingsRepo(testDb),
    await createTestNotificationChannelPreferencesRepo(testDb),
  );
  notifications = await makeNotificationsService(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  setPluginChannelSource(null);
});

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

const TRIP_INVITE = {
  event: 'trip_invite',
  actorId: null,
  scope: 'user',
  targetId: 0,
  params: { trip: 'Rome', actor: 'A', invitee: 'B', tripId: '1' },
} as const;

describe('a plugin channel can never override a built-in', () => {
  beforeEach(() => {
    rogueSend.mockClear();
    rogueGlobal.mockClear();
  });

  it('CHOVR-001 — a channel claiming a built-in id is dropped from the registry', async () => {
    setPluginChannelSource(() => [rogue()]);
    expect((await listChannels()).filter((c) => c.id === 'email')).toHaveLength(1);
    expect((await getChannel('email'))!.source).toBe('builtin');
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

  it('CHOVR-003 — an un-namespaced id is dropped even when it collides with nothing', async () => {
    setPluginChannelSource(() => [rogue({ id: 'carrier-pigeon', source: 'plugin' })]);
    expect((await listChannels()).map((c) => c.id)).not.toContain('carrier-pigeon');
  });

  it('CHOVR-004 — a properly namespaced channel IS admitted', async () => {
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin' })]);
    expect((await listChannels()).map((c) => c.id)).toContain('plugin:gotify');
  });

  it('CHOVR-005 — an admitted plugin channel has its built-in-only privileges stripped', async () => {
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify' })]);
    const ch = (await getChannel('plugin:gotify'))!;
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

    await send({
      event: 'version_available',
      actorId: null,
      scope: 'admin',
      targetId: 0,
      params: { version: '9.9.9' },
    });

    expect(rogueSend).not.toHaveBeenCalled();
    expect(rogueGlobal).not.toHaveBeenCalled();
  });

  it('CHOVR-007 — duplicate plugin ids collapse to one (no double send, no double column)', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'plugin:gotify');
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify' }), rogue({ id: 'plugin:gotify' })]);

    expect((await listChannels()).filter((c) => c.id === 'plugin:gotify')).toHaveLength(1);
    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(rogueSend).toHaveBeenCalledTimes(1);
  });

  it('CHOVR-008 — the preferences matrix never shows a duplicate column', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'email');
    setPluginChannelSource(() => [rogue()]);
    const ids = (await getPreferencesMatrix(user.id, 'user')).channels.map((c) => c.id);
    expect(ids.filter((i) => i === 'email')).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('CHOVR-009 — a built-in may not claim the plugin namespace either', () => {
    expect(() => registerChannel(rogue({ id: 'plugin:sneaky' }))).toThrow(/plugin namespace/);
  });
});

describe('a live plugin channel needs no second opt-in', () => {
  beforeEach(() => {
    rogueSend.mockClear();
  });

  it('CHOVR-011 — it appears in the matrix with NOTHING in notification_channels', async () => {
    const { user } = createUser(testDb);
    setNotificationChannels(testDb, 'none'); // the admin has enabled no built-in at all
    setPluginChannelSource(() => [rogue({ id: 'plugin:gotify', source: 'plugin', label: 'Gotify' })]);

    const matrix = await getPreferencesMatrix(user.id, 'user');
    const ch = matrix.channels.find((c) => c.id === 'plugin:gotify')!;
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

    const ch = (await getPreferencesMatrix(user.id, 'user')).channels.find((c) => c.id === 'plugin:gotify')!;
    expect(ch.active).toBe(true); // shown — so they can see it and go configure it
    expect(ch.configured).toBe(false); // …but flagged as needing setup

    await send({ ...TRIP_INVITE, targetId: user.id });
    expect(rogueSend).not.toHaveBeenCalled(); // no credentials → nothing to send with
  });
});

/**
 * The seam itself, end to end.
 *
 * PluginRuntimeService pushes its channel getter into the registry at
 * onModuleInit; a separately-constructed NotificationsService (as every
 * no-Nest harness builds) only sees it because the registry is
 * a module singleton. Make it a provider and that instance gets an empty one —
 * plugin channels then go quiet with no error anywhere, which is exactly the
 * kind of failure nothing else here would catch. Every case above sets the
 * source by hand; this one goes through the runtime.
 */
describe('the plugin channel source reaches the outside-container instance', () => {
  it('CHOVR-015 — a channel the runtime publishes is delivered by a separately built instance', async () => {
    const { user } = createUser(testDb, { username: 'recipient' });
    setNotificationChannels(testDb, 'none');
    const delivered: Array<{ userId: number; title: string }> = [];

    const runtime = await createPluginRuntime(testDb);
    // Stand in for a booted supervisor: one plugin providing the hook, and an
    // invokeHook that records instead of forking a child.
    Object.defineProperty(runtime, 'supervisor', {
      value: { providersOf: (hook: string) => (hook === 'notificationChannel' ? ['gotify'] : []) },
      configurable: true,
    });
    (runtime as unknown as { invokeHook: unknown }).invokeHook = async (
      _id: string,
      _hook: string,
      _method: string,
      args: unknown[],
    ) => {
      const msg = args[0] as { title: string };
      delivered.push({ userId: user.id, title: msg.title });
      return true;
    };
    await makePlugin(await sharedTestOrm(testDb), 'gotify', {
      name: 'Gotify',
      version: '1.0.0',
      status: 'active',
      enabled: 1,
    });

    // The exact line plugin-runtime.service.ts runs in onModuleInit.
    setPluginChannelSource(() => runtime.notificationChannels());

    try {
      expect(await getChannel('plugin:gotify')).toBeDefined();

      await send({ ...TRIP_INVITE, targetId: user.id });

      expect(delivered).toHaveLength(1);
    } finally {
      setPluginChannelSource(null);
    }
  });
});
