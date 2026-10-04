/**
 * Unit tests for the external notification channel registry.
 * Covers CHREG-001 to CHREG-008.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  listChannels,
  getChannel,
  registerChannel,
  setPluginChannelSource,
  pluginChannelId,
  isPluginChannelId,
  __resetChannelsForTest,
} from '../../../src/nest/notifications/channel-registry';
// The channel contract lives in notification-events; channel-registry only consumes it.
import type { ChannelMessage, ExternalChannel } from '../../../src/nest/notifications/notification-events';
import { registerBuiltinChannels } from '../../../src/nest/notifications/channels/builtins';
import type { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import type { NtfyService } from '../../../src/nest/notifications/transports/ntfy.service';
import type { WebhookService } from '../../../src/nest/notifications/transports/webhook.service';
import type { WebPushService } from '../../../src/nest/notifications/transports/web-push.service';

// The built-ins take their transports as an argument now; these cases only care
// that the four ids land in the registry with the right privileges, so the
// transports are stubs.
const pushStub = {
  isAvailable: vi.fn(async () => true),
  hasDevices: vi.fn(async (userId: number) => userId === 7),
  sendToUser: vi.fn(async () => true),
  sendTest: vi.fn(async () => ({ success: true })),
};
const stubTransports = {
  mailer: { isSmtpConfigured: () => true, getUserEmail: () => null } as unknown as MailerService,
  webhook: { getUserWebhookUrl: () => null, getAdminWebhookUrl: () => null } as unknown as WebhookService,
  ntfy: { getUserNtfyConfig: () => null, getAdminNtfyConfig: () => ({ server: null, topic: null, token: null }) } as unknown as NtfyService,
  push: pushStub as unknown as WebPushService,
};

function fakeChannel(id: string, over: Partial<ExternalChannel> = {}): ExternalChannel {
  return {
    id,
    source: 'plugin',
    label: id,
    supportsEvent: () => true,
    isConfiguredFor: () => true,
    sendToUser: async () => true,
    ...over,
  };
}

const MSG: ChannelMessage = { event: 'trip_invite', title: 't', body: 'b' };

beforeEach(() => {
  __resetChannelsForTest();
  registerBuiltinChannels(stubTransports);
});

afterEach(() => {
  setPluginChannelSource(null);
});

describe('channelRegistry', () => {
  it('CHREG-001: the four built-in external channels are registered; in-app is not', async () => {
    expect((await listChannels()).map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
    expect(await getChannel('inapp')).toBeUndefined();
  });

  it('CHREG-002 — plugin channels come from the injected source and are namespaced', async () => {
    setPluginChannelSource(() => [fakeChannel(pluginChannelId('gotify'))]);
    expect((await listChannels()).map(c => c.id)).toContain('plugin:gotify');
    expect((await getChannel('plugin:gotify'))?.source).toBe('plugin');
    expect(isPluginChannelId('plugin:gotify')).toBe(true);
    expect(isPluginChannelId('email')).toBe(false);
  });

  it('CHREG-003 — a plugin channel disappears when the runtime stops reporting it', async () => {
    let live = true;
    setPluginChannelSource(() => (live ? [fakeChannel('plugin:gotify')] : []));
    expect(await getChannel('plugin:gotify')).toBeDefined();
    live = false;
    expect(await getChannel('plugin:gotify')).toBeUndefined();
    expect((await listChannels()).map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
  });

  it('CHREG-004 — a throwing plugin source cannot take notifications down', async () => {
    setPluginChannelSource(() => {
      throw new Error('runtime exploded');
    });
    expect((await listChannels()).map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
  });

  it('CHREG-005 — a plugin can never claim a built-in id', async () => {
    // The prefix is the whole defence: an id without it is not a plugin channel id,
    // and pluginChannelId() is the only way the runtime mints one.
    expect(pluginChannelId('email')).toBe('plugin:email');
    expect((await getChannel('email'))?.source).toBe('builtin');
  });

  it('CHREG-006 — only email declares the admin-scoped toggle bypass', async () => {
    expect((await getChannel('email'))?.bypassesActiveToggleForAdminEvents).toBe(true);
    expect((await getChannel('webhook'))?.bypassesActiveToggleForAdminEvents).toBeUndefined();
    expect((await getChannel('ntfy'))?.bypassesActiveToggleForAdminEvents).toBeUndefined();
    expect((await getChannel('push'))?.bypassesActiveToggleForAdminEvents).toBeUndefined();
  });

  it('CHREG-007 — webhook and ntfy deliver the admin-global copy; email does not', async () => {
    expect((await getChannel('webhook'))?.supportsAdminGlobal).toBe(true);
    expect((await getChannel('ntfy'))?.supportsAdminGlobal).toBe(true);
    expect((await getChannel('email'))?.supportsAdminGlobal).toBeUndefined();
    expect((await getChannel('push'))?.supportsAdminGlobal).toBeUndefined();
    expect((await getChannel('push'))?.sendGlobal).toBeUndefined();
  });

  it('CHREG-008b: push carries every user event, but neither admin-scoped ones nor synology_session_cleared', async () => {
    const push = (await getChannel('push'))!;
    expect(push.source).toBe('builtin');
    expect(push.labelKey).toBe('settings.notificationPreferences.push');
    for (const event of ['trip_invite', 'collab_message', 'trip_reminder', 'plugin_notification'] as const) {
      expect(push.supportsEvent(event)).toBe(true);
    }
    expect(push.supportsEvent('version_available')).toBe(false);
    expect(push.supportsEvent('replica_failure')).toBe(false);
    expect(push.supportsEvent('synology_session_cleared')).toBe(false);
  });

  it('CHREG-008c: push is configured for a user with a device and hands sends and tests to the transport', async () => {
    const push = (await getChannel('push'))!;
    expect(await push.isConfiguredFor(7)).toBe(true);
    expect(await push.isConfiguredFor(8)).toBe(false);
    await push.sendToUser(7, MSG);
    expect(pushStub.sendToUser).toHaveBeenCalledWith(7, MSG);
    await expect(push.test!(7)).resolves.toEqual({ success: true });
    expect(pushStub.sendTest).toHaveBeenCalledWith(7);
  });

  it('CHREG-008d: push is ready only while it can sign, and hides meanwhile; a plugin cannot claim that', async () => {
    const push = (await getChannel('push'))!;
    expect(push.hiddenWhileInstanceUnconfigured).toBe(true);
    expect(await push.isInstanceConfigured!()).toBe(true);
    pushStub.isAvailable.mockResolvedValueOnce(false);
    expect(await push.isInstanceConfigured!()).toBe(false);
    // Email keeps its column without SMTP, as before.
    expect((await getChannel('email'))?.hiddenWhileInstanceUnconfigured).toBeUndefined();

    setPluginChannelSource(() => [fakeChannel('plugin:gotify', { hiddenWhileInstanceUnconfigured: true })]);
    expect((await getChannel('plugin:gotify'))?.hiddenWhileInstanceUnconfigured).toBeUndefined();
  });

  it('CHREG-008 — built-ins carry every event except synology_session_cleared', async () => {
    for (const id of ['email', 'webhook', 'ntfy']) {
      expect((await getChannel(id))!.supportsEvent('trip_invite')).toBe(true);
      expect((await getChannel(id))!.supportsEvent('version_available')).toBe(true);
      expect((await getChannel(id))!.supportsEvent('synology_session_cleared')).toBe(false);
    }
  });

  it('CHREG-009 — registerChannel replaces an existing id rather than duplicating it', async () => {
    registerChannel(fakeChannel('email', { source: 'builtin' }));
    expect((await listChannels()).filter(c => c.id === 'email')).toHaveLength(1);
  });

  it('CHREG-010 — a channel that rejects is the caller’s problem, not the registry’s', async () => {
    const boom = fakeChannel('plugin:boom', {
      sendToUser: async () => {
        throw new Error('nope');
      },
    });
    setPluginChannelSource(() => [boom]);
    await expect((await getChannel('plugin:boom'))!.sendToUser(1, MSG)).rejects.toThrow('nope');
    // and the registry is unharmed
    expect(await listChannels()).toHaveLength(5);
  });
});
