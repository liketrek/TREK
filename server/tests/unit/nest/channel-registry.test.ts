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
  isAvailable: vi.fn(() => true),
  hasDevices: vi.fn((userId: number) => userId === 7),
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
  it('CHREG-001: the four built-in external channels are registered; in-app is not', () => {
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
    expect(getChannel('inapp')).toBeUndefined();
  });

  it('CHREG-002 — plugin channels come from the injected source and are namespaced', () => {
    setPluginChannelSource(() => [fakeChannel(pluginChannelId('gotify'))]);
    expect(listChannels().map(c => c.id)).toContain('plugin:gotify');
    expect(getChannel('plugin:gotify')?.source).toBe('plugin');
    expect(isPluginChannelId('plugin:gotify')).toBe(true);
    expect(isPluginChannelId('email')).toBe(false);
  });

  it('CHREG-003 — a plugin channel disappears when the runtime stops reporting it', () => {
    let live = true;
    setPluginChannelSource(() => (live ? [fakeChannel('plugin:gotify')] : []));
    expect(getChannel('plugin:gotify')).toBeDefined();
    live = false;
    expect(getChannel('plugin:gotify')).toBeUndefined();
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
  });

  it('CHREG-004 — a throwing plugin source cannot take notifications down', () => {
    setPluginChannelSource(() => {
      throw new Error('runtime exploded');
    });
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy', 'push']);
  });

  it('CHREG-005 — a plugin can never claim a built-in id', () => {
    // The prefix is the whole defence: an id without it is not a plugin channel id,
    // and pluginChannelId() is the only way the runtime mints one.
    expect(pluginChannelId('email')).toBe('plugin:email');
    expect(getChannel('email')?.source).toBe('builtin');
  });

  it('CHREG-006 — only email declares the admin-scoped toggle bypass', () => {
    expect(getChannel('email')?.bypassesActiveToggleForAdminEvents).toBe(true);
    expect(getChannel('webhook')?.bypassesActiveToggleForAdminEvents).toBeUndefined();
    expect(getChannel('ntfy')?.bypassesActiveToggleForAdminEvents).toBeUndefined();
    expect(getChannel('push')?.bypassesActiveToggleForAdminEvents).toBeUndefined();
  });

  it('CHREG-007 — webhook and ntfy deliver the admin-global copy; email does not', () => {
    expect(getChannel('webhook')?.supportsAdminGlobal).toBe(true);
    expect(getChannel('ntfy')?.supportsAdminGlobal).toBe(true);
    expect(getChannel('email')?.supportsAdminGlobal).toBeUndefined();
    expect(getChannel('push')?.supportsAdminGlobal).toBeUndefined();
    expect(getChannel('push')?.sendGlobal).toBeUndefined();
  });

  it('CHREG-008b: push carries every user event, but neither admin-scoped ones nor synology_session_cleared', () => {
    const push = getChannel('push')!;
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
    const push = getChannel('push')!;
    expect(push.isConfiguredFor(7)).toBe(true);
    expect(push.isConfiguredFor(8)).toBe(false);
    await push.sendToUser(7, MSG);
    expect(pushStub.sendToUser).toHaveBeenCalledWith(7, MSG);
    await expect(push.test!(7)).resolves.toEqual({ success: true });
    expect(pushStub.sendTest).toHaveBeenCalledWith(7);
  });

  it('CHREG-008d: push is ready only while it can sign, and hides meanwhile; a plugin cannot claim that', () => {
    const push = getChannel('push')!;
    expect(push.hiddenWhileInstanceUnconfigured).toBe(true);
    expect(push.isInstanceConfigured!()).toBe(true);
    pushStub.isAvailable.mockReturnValueOnce(false);
    expect(push.isInstanceConfigured!()).toBe(false);
    // Email keeps its column without SMTP, as before.
    expect(getChannel('email')?.hiddenWhileInstanceUnconfigured).toBeUndefined();

    setPluginChannelSource(() => [fakeChannel('plugin:gotify', { hiddenWhileInstanceUnconfigured: true })]);
    expect(getChannel('plugin:gotify')?.hiddenWhileInstanceUnconfigured).toBeUndefined();
  });

  it('CHREG-008 — built-ins carry every event except synology_session_cleared', () => {
    for (const id of ['email', 'webhook', 'ntfy']) {
      expect(getChannel(id)!.supportsEvent('trip_invite')).toBe(true);
      expect(getChannel(id)!.supportsEvent('version_available')).toBe(true);
      expect(getChannel(id)!.supportsEvent('synology_session_cleared')).toBe(false);
    }
  });

  it('CHREG-009 — registerChannel replaces an existing id rather than duplicating it', () => {
    registerChannel(fakeChannel('email', { source: 'builtin' }));
    expect(listChannels().filter(c => c.id === 'email')).toHaveLength(1);
  });

  it('CHREG-010 — a channel that rejects is the caller’s problem, not the registry’s', async () => {
    const boom = fakeChannel('plugin:boom', {
      sendToUser: async () => {
        throw new Error('nope');
      },
    });
    setPluginChannelSource(() => [boom]);
    await expect(getChannel('plugin:boom')!.sendToUser(1, MSG)).rejects.toThrow('nope');
    // and the registry is unharmed
    expect(listChannels()).toHaveLength(5);
  });
});
