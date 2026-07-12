import React from 'react'
import { authApi, notificationsApi } from '../../api/client'
import { Save } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { useAdmin } from './useAdmin'
import AdminNotificationsPanel from './AdminNotificationsPanel'

interface AdminNotificationsTabProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

// "Notifications" admin tab: email/webhook/ntfy channel toggles, SMTP credentials,
// trip reminders, admin webhook + ntfy targets, and the per-event preference matrix.
// Derives channel state from smtpValues exactly as the original inline IIFE did.
export default function AdminNotificationsTab({ admin, t }: AdminNotificationsTabProps): React.ReactElement {
  const { toast, smtpValues, setSmtpValues, smtpLoaded, setTripRemindersEnabled } = admin

  // Derive active channels from smtpValues.notification_channels (plural)
  // with fallback to notification_channel (singular) for existing installs
  const rawChannels = smtpValues.notification_channels ?? smtpValues.notification_channel ?? 'none'
  const activeChans = rawChannels === 'none' ? [] : rawChannels.split(',').map((c: string) => c.trim())
  const emailActive = activeChans.includes('email')
  const webhookActive = activeChans.includes('webhook')
  const ntfyActive = activeChans.includes('ntfy')
  const tripRemindersActive = smtpValues.notify_trip_reminder !== 'false'

  const setChannels = async (email: boolean, webhook: boolean, ntfy: boolean) => {
    // Preserve any id this toggle doesn't know about instead of rebuilding the CSV from
    // just these three booleans — that used to silently DROP anything else stored here.
    const others = activeChans.filter((c: string) => c !== 'email' && c !== 'webhook' && c !== 'ntfy')
    const chans = [email && 'email', webhook && 'webhook', ntfy && 'ntfy', ...others].filter(Boolean).join(',') || 'none'
    setSmtpValues(prev => ({ ...prev, notification_channels: chans }))
    try {
      await authApi.updateAppSettings({ notification_channels: chans })
    } catch {
      // Revert state on failure
      const reverted = [emailActive && 'email', webhookActive && 'webhook', ntfyActive && 'ntfy', ...others].filter(Boolean).join(',') || 'none'
      setSmtpValues(prev => ({ ...prev, notification_channels: reverted }))
      toast.error(t('common.error'))
    }
  }

  const smtpConfigured = !!(smtpValues.smtp_host?.trim())
  const saveNotifications = async () => {
    // Saves credentials only — channel activation is auto-saved by the toggle
    const notifKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify']
    const payload: Record<string, string> = {}
    for (const k of notifKeys) { if (smtpValues[k] !== undefined) payload[k] = smtpValues[k] }
    try {
      await authApi.updateAppSettings(payload)
      toast.success(t('admin.notifications.saved'))
      authApi.getAppConfig().then((c: { trip_reminders_enabled?: boolean }) => {
        if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled)
      }).catch(() => {})
    } catch { toast.error(t('common.error')) }
  }

  return (<>
    <div className="space-y-4">
      {/* Email Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.notifications.emailPanel.title')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('admin.smtp.hint')}</p>
          </div>
          <button
            onClick={() => setChannels(!emailActive, webhookActive, ntfyActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${emailActive ? 'bg-content' : 'bg-edge'}`}
          >
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: emailActive ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
        <div className={`p-6 space-y-3 ${!emailActive ? 'opacity-50 pointer-events-none' : ''}`}>
          {smtpLoaded && [
            { key: 'smtp_host', label: 'SMTP Host', placeholder: 'mail.example.com' },
            { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
            { key: 'smtp_user', label: 'SMTP User', placeholder: 'trek@example.com' },
            { key: 'smtp_pass', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
            { key: 'smtp_from', label: 'From Address', placeholder: 'trek@example.com' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-slate-500 mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={smtpValues[field.key] || ''}
                onChange={e => setSmtpValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <div>
              <span className="text-xs font-medium text-slate-500">Skip TLS certificate check</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Enable for self-signed certificates on local mail servers</p>
            </div>
            <button onClick={() => {
              const newVal = smtpValues.smtp_skip_tls_verify === 'true' ? 'false' : 'true'
              setSmtpValues(prev => ({ ...prev, smtp_skip_tls_verify: newVal }))
            }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${smtpValues.smtp_skip_tls_verify === 'true' ? 'bg-content' : 'bg-edge'}`}>
              <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: smtpValues.smtp_skip_tls_verify === 'true' ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>
        </div>
        <div className="px-6 pb-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button onClick={saveNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            <Save className="w-4 h-4" />{t('common.save')}
          </button>
          <button
            onClick={async () => {
              const smtpKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify']
              const payload: Record<string, string> = {}
              for (const k of smtpKeys) { if (smtpValues[k] !== undefined) payload[k] = smtpValues[k] }
              await authApi.updateAppSettings(payload).catch(() => {})
              try {
                const result = await notificationsApi.testSmtp()
                if (result.success) toast.success(t('admin.smtp.testSuccess'))
                else toast.error(result.error || t('admin.smtp.testFailed'))
              } catch { toast.error(t('admin.smtp.testFailed')) }
            }}
            disabled={!smtpConfigured}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {t('admin.smtp.testButton')}
          </button>
        </div>
      </div>

      {/* Webhook Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.notifications.webhookPanel.title')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('admin.webhook.hint')}</p>
          </div>
          <button
            onClick={() => setChannels(emailActive, !webhookActive, ntfyActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${webhookActive ? 'bg-content' : 'bg-edge'}`}
          >
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: webhookActive ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      {/* Ntfy Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.notifications.ntfy')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('admin.ntfy.hint') || 'Allow users to configure their own ntfy topics for push notifications.'}</p>
          </div>
          <button
            onClick={() => setChannels(emailActive, webhookActive, !ntfyActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${ntfyActive ? 'bg-content' : 'bg-edge'}`}
          >
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: ntfyActive ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      {/* In-App Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.notifications.inappPanel.title')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.inappPanel.hint')}</p>
          </div>
          <div className="relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 bg-content"
            style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: 'translateX(20px)' }} />
          </div>
        </div>
      </div>

      {/* Trip Reminders Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t('admin.notifications.tripReminders.title')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.tripReminders.hint')}</p>
          </div>
          <button
            onClick={async () => {
              const next = !tripRemindersActive
              setSmtpValues(prev => ({ ...prev, notify_trip_reminder: next ? 'true' : 'false' }))
              try {
                await authApi.updateAppSettings({ notify_trip_reminder: next ? 'true' : 'false' })
                toast.success(next ? t('admin.notifications.tripReminders.enabled') : t('admin.notifications.tripReminders.disabled'))
                authApi.getAppConfig().then((c: { trip_reminders_enabled?: boolean }) => {
                  if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled)
                }).catch(() => {})
              } catch {
                setSmtpValues(prev => ({ ...prev, notify_trip_reminder: tripRemindersActive ? 'true' : 'false' }))
                toast.error(t('common.error'))
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${tripRemindersActive ? 'bg-content' : 'bg-edge'}`}
          >
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: tripRemindersActive ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
      </div>

      {/* Admin Webhook Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t('admin.notifications.adminWebhookPanel.title')}</h2>
          <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.adminWebhookPanel.hint')}</p>
        </div>
        <div className="p-6 space-y-3">
          {smtpLoaded && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.notifications.adminWebhookPanel.title')}</label>
              <input
                type="text"
                value={smtpValues.admin_webhook_url === '••••••••' ? '' : smtpValues.admin_webhook_url || ''}
                onChange={e => setSmtpValues(prev => ({ ...prev, admin_webhook_url: e.target.value }))}
                placeholder={smtpValues.admin_webhook_url === '••••••••' ? '••••••••' : 'https://discord.com/api/webhooks/...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              />
            </div>
          )}
        </div>
        <div className="px-6 pb-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={async () => {
              try {
                await authApi.updateAppSettings({ admin_webhook_url: smtpValues.admin_webhook_url || '' })
                toast.success(t('admin.notifications.adminWebhookPanel.saved'))
              } catch { toast.error(t('common.error')) }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            <Save className="w-4 h-4" />{t('common.save')}
          </button>
          <button
            onClick={async () => {
              const url = smtpValues.admin_webhook_url === '••••••••' ? undefined : smtpValues.admin_webhook_url
              if (!url && smtpValues.admin_webhook_url !== '••••••••') return
              try {
                if (url) await authApi.updateAppSettings({ admin_webhook_url: url }).catch(() => {})
                const result = await notificationsApi.testWebhook(url)
                if (result.success) toast.success(t('admin.notifications.adminWebhookPanel.testSuccess'))
                else toast.error(result.error || t('admin.notifications.adminWebhookPanel.testFailed'))
              } catch { toast.error(t('admin.notifications.adminWebhookPanel.testFailed')) }
            }}
            disabled={!smtpValues.admin_webhook_url?.trim()}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {t('admin.notifications.testWebhook')}
          </button>
        </div>
      </div>

      {/* Admin Ntfy Panel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t('admin.notifications.adminNtfyPanel.title')}</h2>
          <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.adminNtfyPanel.hint')}</p>
        </div>
        <div className="p-6 space-y-3">
          {smtpLoaded && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.notifications.adminNtfyPanel.serverLabel')}</label>
                <input
                  type="text"
                  value={smtpValues.admin_ntfy_server || ''}
                  onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_server: e.target.value }))}
                  placeholder={t('admin.notifications.adminNtfyPanel.serverPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.adminNtfyPanel.serverHint')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.notifications.adminNtfyPanel.topicLabel')}</label>
                <input
                  type="text"
                  value={smtpValues.admin_ntfy_topic || ''}
                  onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_topic: e.target.value }))}
                  placeholder={t('admin.notifications.adminNtfyPanel.topicPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('admin.notifications.adminNtfyPanel.tokenLabel')}</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={smtpValues.admin_ntfy_token === '••••••••' ? '' : smtpValues.admin_ntfy_token || ''}
                    onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_token: e.target.value }))}
                    placeholder={smtpValues.admin_ntfy_token === '••••••••' ? '••••••••' : ''}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  />
                  {smtpValues.admin_ntfy_token === '••••••••' && (
                    <button
                      onClick={async () => {
                        try {
                          await authApi.updateAppSettings({ admin_ntfy_token: '' })
                          setSmtpValues(prev => ({ ...prev, admin_ntfy_token: '' }))
                          toast.success(t('admin.notifications.adminNtfyPanel.tokenCleared'))
                        } catch { toast.error(t('common.error')) }
                      }}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      {t('common.clear')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-4 flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={async () => {
              try {
                await authApi.updateAppSettings({
                  admin_ntfy_server: smtpValues.admin_ntfy_server || '',
                  admin_ntfy_topic: smtpValues.admin_ntfy_topic || '',
                  ...(smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••'
                    ? { admin_ntfy_token: smtpValues.admin_ntfy_token }
                    : {}),
                })
                toast.success(t('admin.notifications.adminNtfyPanel.saved'))
              } catch { toast.error(t('common.error')) }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            <Save className="w-4 h-4" />{t('common.save')}
          </button>
          <button
            onClick={async () => {
              const topic = smtpValues.admin_ntfy_topic?.trim()
              if (!topic) return
              try {
                const token = smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••'
                  ? smtpValues.admin_ntfy_token : null
                const result = await notificationsApi.testNtfy({
                  topic,
                  server: smtpValues.admin_ntfy_server || null,
                  token,
                })
                if (result.success) toast.success(t('admin.notifications.adminNtfyPanel.testSuccess'))
                else toast.error(result.error || t('admin.notifications.adminNtfyPanel.testFailed'))
              } catch { toast.error(t('admin.notifications.adminNtfyPanel.testFailed')) }
            }}
            disabled={!smtpValues.admin_ntfy_topic?.trim()}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            {t('admin.notifications.adminNtfyPanel.test')}
          </button>
        </div>
      </div>

    </div>
    <div className="mt-6">
      <AdminNotificationsPanel t={t} toast={toast} />
    </div>
  </>)
}
