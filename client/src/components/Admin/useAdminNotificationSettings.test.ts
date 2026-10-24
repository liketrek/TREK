import { act, renderHook, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MASK, useAdminNotificationSettings } from './useAdminNotificationSettings';

// FE-HOOK-ADMNOTIF-001 to FE-HOOK-ADMNOTIF-013

const api = vi.hoisted(() => ({
  updateAppSettings: vi.fn(),
  getAppConfig: vi.fn(),
  testSmtp: vi.fn(),
  testWebhook: vi.fn(),
  testNtfy: vi.fn(),
}));
vi.mock('../../api/client', () => ({
  authApi: { updateAppSettings: api.updateAppSettings, getAppConfig: api.getAppConfig },
  notificationsApi: { testSmtp: api.testSmtp, testWebhook: api.testWebhook, testNtfy: api.testNtfy },
}));

const t = (key: string) => key;

function mount(initial: Record<string, string>) {
  const toast = { success: vi.fn(), error: vi.fn() };
  const setTripRemindersEnabled = vi.fn();
  const hook = renderHook(() => {
    const [smtpValues, setSmtpValues] = useState(initial);
    return {
      smtpValues,
      settings: useAdminNotificationSettings({ smtpValues, setSmtpValues, setTripRemindersEnabled, toast }, t),
    };
  });
  return { ...hook, toast, setTripRemindersEnabled };
}

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  api.updateAppSettings.mockResolvedValue({});
  api.getAppConfig.mockResolvedValue({ trip_reminders_enabled: true });
  api.testSmtp.mockResolvedValue({ success: true });
  api.testWebhook.mockResolvedValue({ success: true });
  api.testNtfy.mockResolvedValue({ success: true });
});

describe('useAdminNotificationSettings', () => {
  it('FE-HOOK-ADMNOTIF-001: derives the reminder switch and whether SMTP is configured', () => {
    expect(mount({}).result.current.settings.tripRemindersActive).toBe(true);
    expect(mount({ notify_trip_reminder: 'false' }).result.current.settings.tripRemindersActive).toBe(false);
    expect(mount({ smtp_host: '  ' }).result.current.settings.smtpConfigured).toBe(false);
    expect(mount({ smtp_host: 'mail.example.com' }).result.current.settings.smtpConfigured).toBe(true);
  });

  it('FE-HOOK-ADMNOTIF-002: saving SMTP sends only the loaded credential keys and refreshes the reminders', async () => {
    const { result, toast, setTripRemindersEnabled } = mount({
      smtp_host: 'h',
      smtp_pass: MASK,
      admin_webhook_url: 'x',
    });
    await act(() => result.current.settings.saveSmtp());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ smtp_host: 'h', smtp_pass: MASK });
    expect(toast.success).toHaveBeenCalledWith('admin.notifications.saved');
    await waitFor(() => expect(setTripRemindersEnabled).toHaveBeenCalledWith(true));
  });

  it('FE-HOOK-ADMNOTIF-003: a failed SMTP save toasts the error; a config without the flag changes nothing', async () => {
    api.getAppConfig.mockResolvedValue({});
    const { result, toast, setTripRemindersEnabled } = mount({ smtp_host: 'h' });
    await act(() => result.current.settings.saveSmtp());
    await waitFor(() => expect(api.getAppConfig).toHaveBeenCalled());
    expect(setTripRemindersEnabled).not.toHaveBeenCalled();
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    await act(() => result.current.settings.saveSmtp());
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMNOTIF-004: the SMTP test saves first, even when that fails, then reports the result', async () => {
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    api.testSmtp.mockResolvedValue({ success: false, error: 'Auth failed' });
    const { result, toast } = mount({ smtp_host: 'h' });
    await act(() => result.current.settings.testSmtp());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ smtp_host: 'h' });
    expect(toast.error).toHaveBeenCalledWith('Auth failed');
    api.testSmtp.mockResolvedValue({ success: false });
    await act(() => result.current.settings.testSmtp());
    expect(toast.error).toHaveBeenLastCalledWith('admin.smtp.testFailed');
    api.testSmtp.mockResolvedValue({ success: true });
    await act(() => result.current.settings.testSmtp());
    expect(toast.success).toHaveBeenCalledWith('admin.smtp.testSuccess');
    api.testSmtp.mockRejectedValue(new Error('x'));
    await act(() => result.current.settings.testSmtp());
    expect(toast.error).toHaveBeenLastCalledWith('admin.smtp.testFailed');
  });

  it('FE-HOOK-ADMNOTIF-005: toggling reminders off saves, toasts and refreshes the flag', async () => {
    const { result, toast, setTripRemindersEnabled } = mount({});
    await act(() => result.current.settings.toggleTripReminders());
    expect(result.current.smtpValues.notify_trip_reminder).toBe('false');
    expect(api.updateAppSettings).toHaveBeenCalledWith({ notify_trip_reminder: 'false' });
    expect(toast.success).toHaveBeenCalledWith('admin.notifications.tripReminders.disabled');
    await waitFor(() => expect(setTripRemindersEnabled).toHaveBeenCalledWith(true));
  });

  it('FE-HOOK-ADMNOTIF-006: a failed reminder toggle puts the old value back and toasts', async () => {
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    const { result, toast } = mount({ notify_trip_reminder: 'false' });
    await act(() => result.current.settings.toggleTripReminders());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ notify_trip_reminder: 'true' });
    expect(result.current.smtpValues.notify_trip_reminder).toBe('false');
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMNOTIF-007: saving the admin webhook sends the url or an empty string', async () => {
    const { result, toast } = mount({});
    await act(() => result.current.settings.saveAdminWebhook());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ admin_webhook_url: '' });
    expect(toast.success).toHaveBeenCalledWith('admin.notifications.adminWebhookPanel.saved');
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    await act(() => result.current.settings.saveAdminWebhook());
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMNOTIF-008: testing a typed webhook saves it first and passes it on', async () => {
    const { result, toast } = mount({ admin_webhook_url: 'https://hook' });
    await act(() => result.current.settings.testAdminWebhook());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ admin_webhook_url: 'https://hook' });
    expect(api.testWebhook).toHaveBeenCalledWith('https://hook');
    expect(toast.success).toHaveBeenCalledWith('admin.notifications.adminWebhookPanel.testSuccess');
  });

  it('FE-HOOK-ADMNOTIF-009: a masked webhook is tested as stored, without a save', async () => {
    api.testWebhook.mockResolvedValue({ success: false, error: '404' });
    const { result, toast } = mount({ admin_webhook_url: MASK });
    await act(() => result.current.settings.testAdminWebhook());
    expect(api.updateAppSettings).not.toHaveBeenCalled();
    expect(api.testWebhook).toHaveBeenCalledWith(undefined);
    expect(toast.error).toHaveBeenCalledWith('404');
    api.testWebhook.mockRejectedValue(new Error('x'));
    await act(() => result.current.settings.testAdminWebhook());
    expect(toast.error).toHaveBeenLastCalledWith('admin.notifications.adminWebhookPanel.testFailed');
  });

  it('FE-HOOK-ADMNOTIF-010: clearing the ntfy token saves an empty token and empties the field', async () => {
    const { result, toast } = mount({ admin_ntfy_token: MASK });
    await act(() => result.current.settings.clearNtfyToken());
    expect(api.updateAppSettings).toHaveBeenCalledWith({ admin_ntfy_token: '' });
    expect(result.current.smtpValues.admin_ntfy_token).toBe('');
    expect(toast.success).toHaveBeenCalledWith('admin.notifications.adminNtfyPanel.tokenCleared');
  });

  it('FE-HOOK-ADMNOTIF-011: a failed token clear keeps the mask and toasts', async () => {
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    const { result, toast } = mount({ admin_ntfy_token: MASK });
    await act(() => result.current.settings.clearNtfyToken());
    expect(result.current.smtpValues.admin_ntfy_token).toBe(MASK);
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMNOTIF-012: saving ntfy sends a typed token but never the mask', async () => {
    const typed = mount({ admin_ntfy_server: 'https://ntfy', admin_ntfy_topic: 'trek', admin_ntfy_token: 'tk' });
    await act(() => typed.result.current.settings.saveAdminNtfy());
    expect(api.updateAppSettings).toHaveBeenLastCalledWith({
      admin_ntfy_server: 'https://ntfy',
      admin_ntfy_topic: 'trek',
      admin_ntfy_token: 'tk',
    });
    expect(typed.toast.success).toHaveBeenCalledWith('admin.notifications.adminNtfyPanel.saved');
    const masked = mount({ admin_ntfy_token: MASK });
    await act(() => masked.result.current.settings.saveAdminNtfy());
    expect(api.updateAppSettings).toHaveBeenLastCalledWith({ admin_ntfy_server: '', admin_ntfy_topic: '' });
    api.updateAppSettings.mockRejectedValue(new Error('x'));
    await act(() => masked.result.current.settings.saveAdminNtfy());
    expect(masked.toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-HOOK-ADMNOTIF-013: the ntfy test needs a topic and sends the token only when typed', async () => {
    const empty = mount({ admin_ntfy_topic: '  ' });
    await act(() => empty.result.current.settings.testAdminNtfy());
    expect(api.testNtfy).not.toHaveBeenCalled();
    const masked = mount({ admin_ntfy_topic: ' trek ', admin_ntfy_token: MASK });
    await act(() => masked.result.current.settings.testAdminNtfy());
    expect(api.testNtfy).toHaveBeenLastCalledWith({ topic: 'trek', server: null, token: null });
    expect(masked.toast.success).toHaveBeenCalledWith('admin.notifications.adminNtfyPanel.testSuccess');
    api.testNtfy.mockResolvedValue({ success: false });
    const typed = mount({ admin_ntfy_topic: 'trek', admin_ntfy_server: 'https://n', admin_ntfy_token: 'tk' });
    await act(() => typed.result.current.settings.testAdminNtfy());
    expect(api.testNtfy).toHaveBeenLastCalledWith({ topic: 'trek', server: 'https://n', token: 'tk' });
    expect(typed.toast.error).toHaveBeenCalledWith('admin.notifications.adminNtfyPanel.testFailed');
    api.testNtfy.mockRejectedValue(new Error('x'));
    await act(() => typed.result.current.settings.testAdminNtfy());
    expect(typed.toast.error).toHaveBeenLastCalledWith('admin.notifications.adminNtfyPanel.testFailed');
  });
});
