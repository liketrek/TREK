// FE-COMP-NOTIFSETTINGS-001 onwards: the notification settings behind both settings shells.
import { act, renderHook, waitFor } from '@testing-library/react';

import { notificationsApi, settingsApi } from '../../api/client';
import { MASKED, type PreferencesMatrix, useNotificationSettings } from './useNotificationSettings';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const MATRIX: PreferencesMatrix = {
  preferences: { trip_invite: { inapp: true, email: false } },
  channels: [
    { id: 'inapp', source: 'builtin', labelKey: 'x', active: true, configured: true },
    { id: 'email', source: 'builtin', labelKey: 'y', active: true, configured: true },
    { id: 'webhook', source: 'builtin', labelKey: 'z', active: false, configured: true },
    { id: 'gotify', source: 'plugin', label: 'Gotify', active: true, configured: false },
  ],
  event_types: ['trip_invite', 'todo_due'],
  implemented_combos: { trip_invite: ['inapp', 'email'], todo_due: ['inapp'] },
  locked: { todo_due: ['inapp'] },
};

function stubLoad(settings: Record<string, unknown> = {}) {
  vi.spyOn(notificationsApi, 'getPreferences').mockResolvedValue(
    JSON.parse(JSON.stringify(MATRIX)) as PreferencesMatrix
  );
  vi.spyOn(settingsApi, 'get').mockResolvedValue({ settings });
}

async function loaded(options?: Parameters<typeof useNotificationSettings>[0]) {
  const hook = renderHook(() => useNotificationSettings(options));
  await waitFor(() => expect(hook.result.current.matrix).not.toBeNull());
  return hook;
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe('useNotificationSettings', () => {
  it('FE-COMP-NOTIFSETTINGS-001: loads the matrix and derives visible, active and plugin channels', async () => {
    stubLoad();
    const { result } = await loaded();
    expect(result.current.visibleChannels.map((c) => c.id)).toEqual(['inapp', 'email']);
    expect(result.current.hasChannel('inapp')).toBe(true);
    expect(result.current.hasChannel('webhook')).toBe(false);
    expect(result.current.pluginChannels.map((c) => c.id)).toEqual(['gotify']);
  });

  it('FE-COMP-NOTIFSETTINGS-002: a masked webhook and token load as set but empty, plain values load as typed', async () => {
    stubLoad({ webhook_url: MASKED, ntfy_topic: 'alerts', ntfy_server: 'https://n.example', ntfy_token: MASKED });
    const { result } = await loaded();
    await waitFor(() => expect(result.current.webhookIsSet).toBe(true));
    expect(result.current.webhookUrl).toBe('');
    expect(result.current.ntfyTokenIsSet).toBe(true);
    expect(result.current.ntfyToken).toBe('');
    expect(result.current.ntfyTopic).toBe('alerts');
    expect(result.current.ntfyServer).toBe('https://n.example');

    stubLoad({ webhook_url: 'https://h.example', ntfy_token: 'tk' });
    const second = await loaded();
    await waitFor(() => expect(second.result.current.webhookUrl).toBe('https://h.example'));
    expect(second.result.current.webhookIsSet).toBe(false);
    expect(second.result.current.ntfyToken).toBe('tk');
  });

  it('FE-COMP-NOTIFSETTINGS-003: the desktop toggle sends only the toggled cell', async () => {
    stubLoad();
    const update = vi.spyOn(notificationsApi, 'updatePreferences').mockResolvedValue({});
    const { result } = await loaded();
    await act(() => result.current.toggle('trip_invite', 'email'));
    expect(update).toHaveBeenCalledWith({ trip_invite: { email: true } });
    expect(result.current.matrix?.preferences.trip_invite).toEqual({ inapp: true, email: true });
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-NOTIFSETTINGS-004: the phone toggle sends only the toggled cell too', async () => {
    stubLoad();
    const update = vi.spyOn(notificationsApi, 'updatePreferences').mockResolvedValue({});
    const { result } = await loaded({ skipMaskedToken: true });
    await act(() => result.current.toggle('trip_invite', 'inapp'));
    expect(update).toHaveBeenCalledWith({ trip_invite: { inapp: false } });
    expect(result.current.matrix?.preferences.trip_invite).toEqual({ inapp: false, email: false });
  });

  it('FE-COMP-NOTIFSETTINGS-005: a failed toggle rolls only its cell back with an error toast; a locked cell sends nothing', async () => {
    stubLoad();
    const update = vi.spyOn(notificationsApi, 'updatePreferences').mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    await act(() => result.current.toggle('trip_invite', 'email'));
    expect(result.current.matrix?.preferences.trip_invite.email).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('common.error');

    update.mockClear();
    await act(() => result.current.toggle('todo_due', 'inapp'));
    expect(update).not.toHaveBeenCalled();
  });

  it('FE-COMP-NOTIFSETTINGS-006: webhook save marks it set or unset, and its test reports the server verdict', async () => {
    stubLoad();
    const set = vi.spyOn(settingsApi, 'set').mockResolvedValue({});
    const test = vi.spyOn(notificationsApi, 'testWebhook').mockResolvedValue({ success: false, error: 'nope' });
    const { result } = await loaded();

    await act(() => result.current.testWebhookUrl());
    expect(test).not.toHaveBeenCalled();

    act(() => result.current.setWebhookUrl('https://h.example'));
    await act(() => result.current.saveWebhookUrl());
    expect(set).toHaveBeenCalledWith('webhook_url', 'https://h.example');
    expect(result.current.webhookIsSet).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('settings.webhookUrl.saved');

    await act(() => result.current.testWebhookUrl());
    expect(test).toHaveBeenCalledWith('https://h.example');
    expect(toast.error).toHaveBeenCalledWith('nope');

    act(() => result.current.setWebhookUrl(''));
    await act(() => result.current.saveWebhookUrl());
    expect(result.current.webhookIsSet).toBe(false);
  });

  it('FE-COMP-NOTIFSETTINGS-007: ntfy save and test send the token only when one was typed', async () => {
    stubLoad();
    const bulk = vi.spyOn(settingsApi, 'setBulk').mockResolvedValue({});
    const test = vi.spyOn(notificationsApi, 'testNtfy').mockResolvedValue({ success: true });
    const { result } = await loaded();

    await act(() => result.current.testNtfySettings());
    expect(test).not.toHaveBeenCalled();

    act(() => result.current.setNtfyTopic('alerts'));
    await act(() => result.current.saveNtfySettings());
    expect(bulk).toHaveBeenCalledWith({ ntfy_topic: 'alerts', ntfy_server: '' });
    expect(result.current.ntfyTokenIsSet).toBe(false);

    act(() => result.current.setNtfyToken('tk'));
    await act(() => result.current.saveNtfySettings());
    expect(bulk).toHaveBeenLastCalledWith({ ntfy_topic: 'alerts', ntfy_server: '', ntfy_token: 'tk' });
    expect(result.current.ntfyTokenIsSet).toBe(true);

    await act(() => result.current.testNtfySettings());
    expect(test).toHaveBeenCalledWith({ topic: 'alerts', server: null, token: 'tk' });
    expect(toast.success).toHaveBeenCalledWith('settings.ntfyUrl.testSuccess');
  });

  it('FE-COMP-NOTIFSETTINGS-008: a token typed as the mask is sent by the desktop but skipped by the phone', async () => {
    stubLoad();
    const bulk = vi.spyOn(settingsApi, 'setBulk').mockResolvedValue({});
    const test = vi.spyOn(notificationsApi, 'testNtfy').mockResolvedValue({ success: true });

    const desktop = await loaded();
    act(() => {
      desktop.result.current.setNtfyTopic('a');
      desktop.result.current.setNtfyToken(MASKED);
    });
    await act(() => desktop.result.current.saveNtfySettings());
    expect(bulk).toHaveBeenLastCalledWith({ ntfy_topic: 'a', ntfy_server: '', ntfy_token: MASKED });
    await act(() => desktop.result.current.testNtfySettings());
    expect(test).toHaveBeenLastCalledWith({ topic: 'a', server: null, token: MASKED });

    const phone = await loaded({ skipMaskedToken: true });
    act(() => {
      phone.result.current.setNtfyTopic('a');
      phone.result.current.setNtfyToken(MASKED);
    });
    await act(() => phone.result.current.saveNtfySettings());
    expect(bulk).toHaveBeenLastCalledWith({ ntfy_topic: 'a', ntfy_server: '' });
    expect(phone.result.current.ntfyTokenIsSet).toBe(false);
    await act(() => phone.result.current.testNtfySettings());
    expect(test).toHaveBeenLastCalledWith({ topic: 'a', server: null, token: null });
  });

  it('FE-COMP-NOTIFSETTINGS-009: clearing the token and testing a plugin channel', async () => {
    stubLoad({ ntfy_token: MASKED });
    vi.spyOn(settingsApi, 'set').mockResolvedValue({});
    const testChannel = vi.spyOn(notificationsApi, 'testChannel').mockRejectedValue(new Error('x'));
    const { result } = await loaded();
    await waitFor(() => expect(result.current.ntfyTokenIsSet).toBe(true));

    await act(() => result.current.clearNtfyToken());
    expect(settingsApi.set).toHaveBeenCalledWith('ntfy_token', '');
    expect(result.current.ntfyTokenIsSet).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('settings.ntfyUrl.tokenCleared');

    await act(() => result.current.testChannel(MATRIX.channels[3]));
    expect(testChannel).toHaveBeenCalledWith('gotify');
    expect(toast.error).toHaveBeenCalledWith('settings.notificationPreferences.testFailed');
    expect(result.current.channelTesting).toBeNull();
  });

  it('FE-COMP-NOTIFSETTINGS-010: a failed load flags the matrix as failed and toasts once, however many requests failed', async () => {
    vi.spyOn(notificationsApi, 'getPreferences').mockRejectedValue(new Error('x'));
    vi.spyOn(settingsApi, 'get').mockRejectedValue(new Error('y'));
    const { result } = renderHook(() => useNotificationSettings());
    await waitFor(() => expect(result.current.loadFailed).toBe(true));
    // Let both rejections settle before counting toasts.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('common.error');
    expect(result.current.matrix).toBeNull();
  });

  it('FE-COMP-NOTIFSETTINGS-011: a load that settles after unmount touches nothing', async () => {
    let rejectPrefs!: (e: Error) => void;
    let rejectSettings!: (e: Error) => void;
    vi.spyOn(notificationsApi, 'getPreferences').mockReturnValue(
      new Promise((_, reject) => {
        rejectPrefs = reject;
      })
    );
    vi.spyOn(settingsApi, 'get').mockReturnValue(
      new Promise((_, reject) => {
        rejectSettings = reject;
      })
    );
    const { unmount } = renderHook(() => useNotificationSettings());
    unmount();
    await act(async () => {
      rejectPrefs(new Error('x'));
      rejectSettings(new Error('y'));
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
