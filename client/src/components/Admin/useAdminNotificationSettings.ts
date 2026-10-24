import type { Dispatch, SetStateAction } from 'react';

import { authApi, notificationsApi } from '../../api/client';
import type { TranslationFn } from '../../types';

/** A stored secret comes back from the server as this mask. */
export const MASK = '••••••••';

const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify'];

interface NotificationSettingsHost {
  smtpValues: Record<string, string>;
  setSmtpValues: Dispatch<SetStateAction<Record<string, string>>>;
  setTripRemindersEnabled: (enabled: boolean) => void;
  toast: { success: (message: string) => void; error: (message: string) => void };
}

/** The SMTP credentials as they stand, without the keys that were never loaded. */
function smtpPayload(values: Record<string, string>): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const k of SMTP_KEYS) {
    if (values[k] !== undefined) payload[k] = values[k];
  }
  return payload;
}

/**
 * The saves and tests behind the admin notification settings, shared by the desktop
 * Notifications tab and its phone twin: SMTP credentials, the trip reminder switch, and
 * the admin webhook and ntfy targets. The values live in the admin hook; this only reads
 * and writes them. The channel switches are useNotificationChannels.
 */
export function useAdminNotificationSettings(
  { smtpValues, setSmtpValues, setTripRemindersEnabled, toast }: NotificationSettingsHost,
  t: TranslationFn
) {
  const tripRemindersActive = smtpValues.notify_trip_reminder !== 'false';
  const smtpConfigured = !!smtpValues.smtp_host?.trim();

  const refreshTripReminders = () => {
    authApi
      .getAppConfig()
      .then((c: { trip_reminders_enabled?: boolean }) => {
        if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled);
      })
      .catch(() => {
        /* the switch keeps what it shows */
      });
  };

  const saveSmtp = async () => {
    // Saves credentials only: channel activation is auto-saved by the toggle.
    try {
      await authApi.updateAppSettings(smtpPayload(smtpValues));
      toast.success(t('admin.notifications.saved'));
      refreshTripReminders();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const testSmtp = async () => {
    await authApi.updateAppSettings(smtpPayload(smtpValues)).catch(() => {
      /* the test below reports what the server has */
    });
    try {
      const result = await notificationsApi.testSmtp();
      if (result.success) toast.success(t('admin.smtp.testSuccess'));
      else toast.error(result.error || t('admin.smtp.testFailed'));
    } catch {
      toast.error(t('admin.smtp.testFailed'));
    }
  };

  const toggleTripReminders = async () => {
    const next = !tripRemindersActive;
    setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: next ? 'true' : 'false' }));
    try {
      await authApi.updateAppSettings({ notify_trip_reminder: next ? 'true' : 'false' });
      toast.success(
        next ? t('admin.notifications.tripReminders.enabled') : t('admin.notifications.tripReminders.disabled')
      );
      refreshTripReminders();
    } catch {
      setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: tripRemindersActive ? 'true' : 'false' }));
      toast.error(t('common.error'));
    }
  };

  const saveAdminWebhook = async () => {
    try {
      await authApi.updateAppSettings({ admin_webhook_url: smtpValues.admin_webhook_url || '' });
      toast.success(t('admin.notifications.adminWebhookPanel.saved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const testAdminWebhook = async () => {
    // A masked value means the URL only lives on the server: send no url and let the
    // server test the stored one instead of pre-saving the mask.
    const url = smtpValues.admin_webhook_url === MASK ? undefined : smtpValues.admin_webhook_url;
    try {
      if (url)
        await authApi.updateAppSettings({ admin_webhook_url: url }).catch(() => {
          /* the test below reports what the server has */
        });
      const result = await notificationsApi.testWebhook(url);
      if (result.success) toast.success(t('admin.notifications.adminWebhookPanel.testSuccess'));
      else toast.error(result.error || t('admin.notifications.adminWebhookPanel.testFailed'));
    } catch {
      toast.error(t('admin.notifications.adminWebhookPanel.testFailed'));
    }
  };

  const clearNtfyToken = async () => {
    try {
      await authApi.updateAppSettings({ admin_ntfy_token: '' });
      setSmtpValues((prev) => ({ ...prev, admin_ntfy_token: '' }));
      toast.success(t('admin.notifications.adminNtfyPanel.tokenCleared'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const saveAdminNtfy = async () => {
    try {
      await authApi.updateAppSettings({
        admin_ntfy_server: smtpValues.admin_ntfy_server || '',
        admin_ntfy_topic: smtpValues.admin_ntfy_topic || '',
        ...(smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== MASK
          ? { admin_ntfy_token: smtpValues.admin_ntfy_token }
          : {}),
      });
      toast.success(t('admin.notifications.adminNtfyPanel.saved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const testAdminNtfy = async () => {
    const topic = smtpValues.admin_ntfy_topic?.trim();
    if (!topic) return;
    try {
      const token =
        smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== MASK ? smtpValues.admin_ntfy_token : null;
      const result = await notificationsApi.testNtfy({ topic, server: smtpValues.admin_ntfy_server || null, token });
      if (result.success) toast.success(t('admin.notifications.adminNtfyPanel.testSuccess'));
      else toast.error(result.error || t('admin.notifications.adminNtfyPanel.testFailed'));
    } catch {
      toast.error(t('admin.notifications.adminNtfyPanel.testFailed'));
    }
  };

  return {
    tripRemindersActive,
    smtpConfigured,
    saveSmtp,
    testSmtp,
    toggleTripReminders,
    saveAdminWebhook,
    testAdminWebhook,
    clearNtfyToken,
    saveAdminNtfy,
    testAdminNtfy,
  };
}
