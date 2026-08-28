import { Save } from 'lucide-react';
import React from 'react';
import { authApi, notificationsApi } from '../../api/client';
import type { TranslationFn } from '../../types';
import AdminNotificationsPanel from './AdminNotificationsPanel';
import type { useAdmin } from './useAdmin';

interface AdminNotificationsTabProps {
  admin: ReturnType<typeof useAdmin>;
  t: TranslationFn;
}

// "Notifications" admin tab: email/webhook/ntfy channel toggles, SMTP credentials,
// trip reminders, admin webhook + ntfy targets, and the per-event preference matrix.
// Derives channel state from smtpValues exactly as the original inline IIFE did.
export default function AdminNotificationsTab({ admin, t }: AdminNotificationsTabProps): React.ReactElement {
  const { toast, smtpValues, setSmtpValues, smtpLoaded, setTripRemindersEnabled, managed } = admin;

  // Derive active channels from smtpValues.notification_channels (plural)
  // with fallback to notification_channel (singular) for existing installs
  const rawChannels = smtpValues.notification_channels ?? smtpValues.notification_channel ?? 'none';
  const activeChans = rawChannels === 'none' ? [] : rawChannels.split(',').map((c: string) => c.trim());
  const emailActive = activeChans.includes('email');
  const webhookActive = activeChans.includes('webhook');
  const ntfyActive = activeChans.includes('ntfy');
  const webPushActive = activeChans.includes('webpush');
  const tripRemindersActive = smtpValues.notify_trip_reminder !== 'false';

  const setChannels = async (email: boolean, webhook: boolean, ntfy: boolean, webPush: boolean) => {
    // Preserve any id this toggle doesn't know about instead of rebuilding the CSV from
    // just these three booleans — that used to silently DROP anything else stored here.
    const others = activeChans.filter((c: string) => !['email', 'webhook', 'ntfy', 'webpush'].includes(c));
    const chans =
      [email && 'email', webhook && 'webhook', ntfy && 'ntfy', webPush && 'webpush', ...others]
        .filter(Boolean)
        .join(',') || 'none';
    setSmtpValues((prev) => ({ ...prev, notification_channels: chans }));
    try {
      await authApi.updateAppSettings({ notification_channels: chans });
    } catch {
      // Revert state on failure
      const reverted =
        [
          emailActive && 'email',
          webhookActive && 'webhook',
          ntfyActive && 'ntfy',
          webPushActive && 'webpush',
          ...others,
        ]
          .filter(Boolean)
          .join(',') || 'none';
      setSmtpValues((prev) => ({ ...prev, notification_channels: reverted }));
      toast.error(t('common.error'));
    }
  };

  const smtpConfigured = !!smtpValues.smtp_host?.trim();
  const saveNotifications = async () => {
    // Saves credentials only — channel activation is auto-saved by the toggle
    const notifKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify'];
    const payload: Record<string, string> = {};
    for (const k of notifKeys) {
      if (smtpValues[k] !== undefined) payload[k] = smtpValues[k];
    }
    try {
      await authApi.updateAppSettings(payload);
      toast.success(t('admin.notifications.saved'));
      authApi
        .getAppConfig()
        .then((c: { trip_reminders_enabled?: boolean }) => {
          if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled);
        })
        .catch(() => {});
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* The relay is the operator's: their host, their credential, their sending
          reputation. An instance that could point it elsewhere would send under a
          domain it does not own. */}
        {!managed && (
          <>
            {/* Email Panel */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{t('admin.notifications.emailPanel.title')}</h2>
                  <p className="mt-1 text-xs text-slate-400">{t('admin.smtp.hint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChannels(!emailActive, webhookActive, ntfyActive, webPushActive)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${emailActive ? 'bg-content' : 'bg-edge'}`}
                >
                  <span
                    className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: emailActive ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
              <div className={`space-y-3 p-6 ${!emailActive ? 'pointer-events-none opacity-50' : ''}`}>
                {smtpLoaded &&
                  [
                    { key: 'smtp_host', label: 'SMTP Host', placeholder: 'mail.example.com' },
                    { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
                    { key: 'smtp_user', label: 'SMTP User', placeholder: 'trek@example.com' },
                    { key: 'smtp_pass', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
                    { key: 'smtp_from', label: 'From Address', placeholder: 'trek@example.com' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-xs font-medium text-slate-500">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={smtpValues[field.key] || ''}
                        onChange={(e) => setSmtpValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  ))}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}
                >
                  <div>
                    <span className="text-xs font-medium text-slate-500">Skip TLS certificate check</span>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Enable for self-signed certificates on local mail servers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = smtpValues.smtp_skip_tls_verify === 'true' ? 'false' : 'true';
                      setSmtpValues((prev) => ({ ...prev, smtp_skip_tls_verify: newVal }));
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${smtpValues.smtp_skip_tls_verify === 'true' ? 'bg-content' : 'bg-edge'}`}
                  >
                    <span
                      className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                      style={{
                        transform: smtpValues.smtp_skip_tls_verify === 'true' ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 px-6 pb-4 pt-4">
                <button
                  type="button"
                  onClick={saveNotifications}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <Save className="h-4 w-4" />
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const smtpKeys = [
                      'smtp_host',
                      'smtp_port',
                      'smtp_user',
                      'smtp_pass',
                      'smtp_from',
                      'smtp_skip_tls_verify',
                    ];
                    const payload: Record<string, string> = {};
                    for (const k of smtpKeys) {
                      if (smtpValues[k] !== undefined) payload[k] = smtpValues[k];
                    }
                    await authApi.updateAppSettings(payload).catch(() => {});
                    try {
                      const result = await notificationsApi.testSmtp();
                      if (result.success) toast.success(t('admin.smtp.testSuccess'));
                      else toast.error(result.error || t('admin.smtp.testFailed'));
                    } catch {
                      toast.error(t('admin.smtp.testFailed'));
                    }
                  }}
                  disabled={!smtpConfigured}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {t('admin.smtp.testButton')}
                </button>
              </div>
            </div>
          </>
        )}
        {/* Webhook Panel */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{t('admin.notifications.webhookPanel.title')}</h2>
              <p className="mt-1 text-xs text-slate-400">{t('admin.webhook.hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setChannels(emailActive, !webhookActive, ntfyActive, webPushActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${webhookActive ? 'bg-content' : 'bg-edge'}`}
            >
              <span
                className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: webhookActive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* Ntfy Panel */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{t('admin.notifications.ntfy')}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {t('admin.ntfy.hint') || 'Allow users to configure their own ntfy topics for push notifications.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChannels(emailActive, webhookActive, !ntfyActive, webPushActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${ntfyActive ? 'bg-content' : 'bg-edge'}`}
            >
              <span
                className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: ntfyActive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* Direct Web Push Panel */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{t('settings.webPush.title')}</h2>
              <p className="mt-1 text-xs text-slate-400">{t('settings.webPush.description')}</p>
            </div>
            <button
              type="button"
              onClick={() => setChannels(emailActive, webhookActive, ntfyActive, !webPushActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${webPushActive ? 'bg-content' : 'bg-edge'}`}
            >
              <span
                className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: webPushActive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* In-App Panel */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{t('admin.notifications.inappPanel.title')}</h2>
              <p className="mt-1 text-xs text-slate-400">{t('admin.notifications.inappPanel.hint')}</p>
            </div>
            <div
              className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full bg-content"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              <span
                className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: 'translateX(20px)' }}
              />
            </div>
          </div>
        </div>

        {/* Trip Reminders Toggle */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{t('admin.notifications.tripReminders.title')}</h2>
              <p className="mt-1 text-xs text-slate-400">{t('admin.notifications.tripReminders.hint')}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const next = !tripRemindersActive;
                setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: next ? 'true' : 'false' }));
                try {
                  await authApi.updateAppSettings({ notify_trip_reminder: next ? 'true' : 'false' });
                  toast.success(
                    next
                      ? t('admin.notifications.tripReminders.enabled')
                      : t('admin.notifications.tripReminders.disabled')
                  );
                  authApi
                    .getAppConfig()
                    .then((c: { trip_reminders_enabled?: boolean }) => {
                      if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled);
                    })
                    .catch(() => {});
                } catch {
                  setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: tripRemindersActive ? 'true' : 'false' }));
                  toast.error(t('common.error'));
                }
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${tripRemindersActive ? 'bg-content' : 'bg-edge'}`}
            >
              <span
                className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: tripRemindersActive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        </div>

        {/* Admin alerts are about running the instance (version notices, and what else
          lands there later). On a managed install those go to whoever runs it. */}
        {!managed && (
          <>
            {/* Admin Webhook Panel */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">{t('admin.notifications.adminWebhookPanel.title')}</h2>
                <p className="mt-1 text-xs text-slate-400">{t('admin.notifications.adminWebhookPanel.hint')}</p>
              </div>
              <div className="space-y-3 p-6">
                {smtpLoaded && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {t('admin.notifications.adminWebhookPanel.title')}
                    </label>
                    <input
                      type="text"
                      value={smtpValues.admin_webhook_url === '••••••••' ? '' : smtpValues.admin_webhook_url || ''}
                      onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_webhook_url: e.target.value }))}
                      placeholder={
                        smtpValues.admin_webhook_url === '••••••••'
                          ? '••••••••'
                          : 'https://discord.com/api/webhooks/...'
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 px-6 pb-4 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await authApi.updateAppSettings({ admin_webhook_url: smtpValues.admin_webhook_url || '' });
                      toast.success(t('admin.notifications.adminWebhookPanel.saved'));
                    } catch {
                      toast.error(t('common.error'));
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <Save className="h-4 w-4" />
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // A masked value means the URL only lives on the server — send no url and let
                    // the server test the stored one instead of pre-saving the mask.
                    const url = smtpValues.admin_webhook_url === '••••••••' ? undefined : smtpValues.admin_webhook_url;
                    try {
                      if (url) await authApi.updateAppSettings({ admin_webhook_url: url }).catch(() => {});
                      const result = await notificationsApi.testWebhook(url);
                      if (result.success) toast.success(t('admin.notifications.adminWebhookPanel.testSuccess'));
                      else toast.error(result.error || t('admin.notifications.adminWebhookPanel.testFailed'));
                    } catch {
                      toast.error(t('admin.notifications.adminWebhookPanel.testFailed'));
                    }
                  }}
                  disabled={!smtpValues.admin_webhook_url?.trim()}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {t('admin.notifications.testWebhook')}
                </button>
              </div>
            </div>

            {/* Admin Ntfy Panel — same audience as the webhook above, and inside the
          same wrapper. */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">{t('admin.notifications.adminNtfyPanel.title')}</h2>
                <p className="mt-1 text-xs text-slate-400">{t('admin.notifications.adminNtfyPanel.hint')}</p>
              </div>
              <div className="space-y-3 p-6">
                {smtpLoaded && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        {t('admin.notifications.adminNtfyPanel.serverLabel')}
                      </label>
                      <input
                        type="text"
                        value={smtpValues.admin_ntfy_server || ''}
                        onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_server: e.target.value }))}
                        placeholder={t('admin.notifications.adminNtfyPanel.serverPlaceholder')}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        {t('admin.notifications.adminNtfyPanel.serverHint')}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        {t('admin.notifications.adminNtfyPanel.topicLabel')}
                      </label>
                      <input
                        type="text"
                        value={smtpValues.admin_ntfy_topic || ''}
                        onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_topic: e.target.value }))}
                        placeholder={t('admin.notifications.adminNtfyPanel.topicPlaceholder')}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        {t('admin.notifications.adminNtfyPanel.tokenLabel')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={smtpValues.admin_ntfy_token === '••••••••' ? '' : smtpValues.admin_ntfy_token || ''}
                          onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_token: e.target.value }))}
                          placeholder={smtpValues.admin_ntfy_token === '••••••••' ? '••••••••' : ''}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-400"
                        />
                        {smtpValues.admin_ntfy_token === '••••••••' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await authApi.updateAppSettings({ admin_ntfy_token: '' });
                                setSmtpValues((prev) => ({ ...prev, admin_ntfy_token: '' }));
                                toast.success(t('admin.notifications.adminNtfyPanel.tokenCleared'));
                              } catch {
                                toast.error(t('common.error'));
                              }
                            }}
                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            {t('common.clear')}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 px-6 pb-4 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await authApi.updateAppSettings({
                        admin_ntfy_server: smtpValues.admin_ntfy_server || '',
                        admin_ntfy_topic: smtpValues.admin_ntfy_topic || '',
                        ...(smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••'
                          ? { admin_ntfy_token: smtpValues.admin_ntfy_token }
                          : {}),
                      });
                      toast.success(t('admin.notifications.adminNtfyPanel.saved'));
                    } catch {
                      toast.error(t('common.error'));
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <Save className="h-4 w-4" />
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const topic = smtpValues.admin_ntfy_topic?.trim();
                    if (!topic) return;
                    try {
                      const token =
                        smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••'
                          ? smtpValues.admin_ntfy_token
                          : null;
                      const result = await notificationsApi.testNtfy({
                        topic,
                        server: smtpValues.admin_ntfy_server || null,
                        token,
                      });
                      if (result.success) toast.success(t('admin.notifications.adminNtfyPanel.testSuccess'));
                      else toast.error(result.error || t('admin.notifications.adminNtfyPanel.testFailed'));
                    } catch {
                      toast.error(t('admin.notifications.adminNtfyPanel.testFailed'));
                    }
                  }}
                  disabled={!smtpValues.admin_ntfy_topic?.trim()}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  {t('admin.notifications.adminNtfyPanel.test')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-6">
        <AdminNotificationsPanel t={t} toast={toast} />
      </div>
    </>
  );
}
