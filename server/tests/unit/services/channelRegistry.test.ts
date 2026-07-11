/**
 * Unit tests for the external notification channel registry.
 * Covers CHREG-001 to CHREG-008.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  listChannels,
  getChannel,
  registerChannel,
  setPluginChannelSource,
  pluginChannelId,
  isPluginChannelId,
  __resetChannelsForTest,
  type ChannelMessage,
  type ExternalChannel,
} from '../../../src/services/notifications/channelRegistry';
import { registerBuiltinChannels } from '../../../src/services/notifications/builtins';

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
  registerBuiltinChannels();
});

afterEach(() => {
  setPluginChannelSource(null);
});

describe('channelRegistry', () => {
  it('CHREG-001 — the three built-in external channels are registered; in-app is not', () => {
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy']);
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
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy']);
  });

  it('CHREG-004 — a throwing plugin source cannot take notifications down', () => {
    setPluginChannelSource(() => {
      throw new Error('runtime exploded');
    });
    expect(listChannels().map(c => c.id)).toEqual(['email', 'webhook', 'ntfy']);
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
  });

  it('CHREG-007 — webhook and ntfy deliver the admin-global copy; email does not', () => {
    expect(getChannel('webhook')?.supportsAdminGlobal).toBe(true);
    expect(getChannel('ntfy')?.supportsAdminGlobal).toBe(true);
    expect(getChannel('email')?.supportsAdminGlobal).toBeUndefined();
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
    expect(listChannels()).toHaveLength(4);
  });
});
