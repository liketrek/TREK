import { authApi, notificationsApi } from '../../../api/client'
import type { TranslationFn } from '../../../types'
import type { useAdmin } from '../../../pages/admin/useAdmin'
import MToggle from '../../components/MToggle'
import MAdminNotifyMatrix from './MAdminNotifyMatrix'
import { MAdminButton, MAdminCard, MAdminCardHead, MAdminField, MAdminInput, MAdminRow } from './MAdminUi'

interface MAdminNotificationsSectionProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

const SMTP_FIELDS = [
  { key: 'smtp_host', label: 'SMTP Host', placeholder: 'mail.example.com' },
  { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
  { key: 'smtp_user', label: 'SMTP User', placeholder: 'trek@example.com' },
  { key: 'smtp_pass', label: 'SMTP Password', placeholder: '••••••••', type: 'password' },
  { key: 'smtp_from', label: 'From Address', placeholder: 'trek@example.com' },
]

// Notifications section: channel toggles (email/webhook/ntfy/in-app), SMTP
// credentials, trip reminders, admin webhook + ntfy targets and the per-event
// preference matrix — the desktop notifications tab in mobile cards.
export default function MAdminNotificationsSection({ admin, t }: MAdminNotificationsSectionProps) {
  const { toast, smtpValues, setSmtpValues, smtpLoaded, setTripRemindersEnabled } = admin

  // Derive active channels from notification_channels (plural) with fallback
  // to notification_channel (singular) for existing installs.
  const rawChannels = smtpValues.notification_channels ?? smtpValues.notification_channel ?? 'none'
  const activeChans = rawChannels === 'none' ? [] : rawChannels.split(',').map((c: string) => c.trim())
  const emailActive = activeChans.includes('email')
  const webhookActive = activeChans.includes('webhook')
  const ntfyActive = activeChans.includes('ntfy')
  const tripRemindersActive = smtpValues.notify_trip_reminder !== 'false'
  const smtpConfigured = !!smtpValues.smtp_host?.trim()

  const setChannels = async (email: boolean, webhook: boolean, ntfy: boolean) => {
    // Preserve channel ids this toggle doesn't know about instead of
    // rebuilding the CSV from just these three booleans.
    const others = activeChans.filter((c: string) => c !== 'email' && c !== 'webhook' && c !== 'ntfy')
    const chans = [email && 'email', webhook && 'webhook', ntfy && 'ntfy', ...others].filter(Boolean).join(',') || 'none'
    setSmtpValues((prev) => ({ ...prev, notification_channels: chans }))
    try {
      await authApi.updateAppSettings({ notification_channels: chans })
    } catch {
      const reverted =
        [emailActive && 'email', webhookActive && 'webhook', ntfyActive && 'ntfy', ...others].filter(Boolean).join(',') ||
        'none'
      setSmtpValues((prev) => ({ ...prev, notification_channels: reverted }))
      toast.error(t('common.error'))
    }
  }

  const saveSmtp = async () => {
    // Saves credentials only — channel activation is auto-saved by the toggle.
    const notifKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify']
    const payload: Record<string, string> = {}
    for (const k of notifKeys) {
      if (smtpValues[k] !== undefined) payload[k] = smtpValues[k]
    }
    try {
      await authApi.updateAppSettings(payload)
      toast.success(t('admin.notifications.saved'))
      authApi
        .getAppConfig()
        .then((c: { trip_reminders_enabled?: boolean }) => {
          if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled)
        })
        .catch(() => {})
    } catch {
      toast.error(t('common.error'))
    }
  }

  const testSmtp = async () => {
    const smtpKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_skip_tls_verify']
    const payload: Record<string, string> = {}
    for (const k of smtpKeys) {
      if (smtpValues[k] !== undefined) payload[k] = smtpValues[k]
    }
    await authApi.updateAppSettings(payload).catch(() => {})
    try {
      const result = await notificationsApi.testSmtp()
      if (result.success) toast.success(t('admin.smtp.testSuccess'))
      else toast.error(result.error || t('admin.smtp.testFailed'))
    } catch {
      toast.error(t('admin.smtp.testFailed'))
    }
  }

  const toggleTripReminders = async () => {
    const next = !tripRemindersActive
    setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: next ? 'true' : 'false' }))
    try {
      await authApi.updateAppSettings({ notify_trip_reminder: next ? 'true' : 'false' })
      toast.success(
        next ? t('admin.notifications.tripReminders.enabled') : t('admin.notifications.tripReminders.disabled'),
      )
      authApi
        .getAppConfig()
        .then((c: { trip_reminders_enabled?: boolean }) => {
          if (c?.trip_reminders_enabled !== undefined) setTripRemindersEnabled(c.trip_reminders_enabled)
        })
        .catch(() => {})
    } catch {
      setSmtpValues((prev) => ({ ...prev, notify_trip_reminder: tripRemindersActive ? 'true' : 'false' }))
      toast.error(t('common.error'))
    }
  }

  const saveAdminWebhook = async () => {
    try {
      await authApi.updateAppSettings({ admin_webhook_url: smtpValues.admin_webhook_url || '' })
      toast.success(t('admin.notifications.adminWebhookPanel.saved'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const testAdminWebhook = async () => {
    const url = smtpValues.admin_webhook_url === '••••••••' ? undefined : smtpValues.admin_webhook_url
    if (!url && smtpValues.admin_webhook_url !== '••••••••') return
    try {
      if (url) await authApi.updateAppSettings({ admin_webhook_url: url }).catch(() => {})
      const result = await notificationsApi.testWebhook(url)
      if (result.success) toast.success(t('admin.notifications.adminWebhookPanel.testSuccess'))
      else toast.error(result.error || t('admin.notifications.adminWebhookPanel.testFailed'))
    } catch {
      toast.error(t('admin.notifications.adminWebhookPanel.testFailed'))
    }
  }

  const saveAdminNtfy = async () => {
    try {
      await authApi.updateAppSettings({
        admin_ntfy_server: smtpValues.admin_ntfy_server || '',
        admin_ntfy_topic: smtpValues.admin_ntfy_topic || '',
        ...(smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••'
          ? { admin_ntfy_token: smtpValues.admin_ntfy_token }
          : {}),
      })
      toast.success(t('admin.notifications.adminNtfyPanel.saved'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const testAdminNtfy = async () => {
    const topic = smtpValues.admin_ntfy_topic?.trim()
    if (!topic) return
    try {
      const token =
        smtpValues.admin_ntfy_token && smtpValues.admin_ntfy_token !== '••••••••' ? smtpValues.admin_ntfy_token : null
      const result = await notificationsApi.testNtfy({ topic, server: smtpValues.admin_ntfy_server || null, token })
      if (result.success) toast.success(t('admin.notifications.adminNtfyPanel.testSuccess'))
      else toast.error(result.error || t('admin.notifications.adminNtfyPanel.testFailed'))
    } catch {
      toast.error(t('admin.notifications.adminNtfyPanel.testFailed'))
    }
  }

  const clearNtfyToken = async () => {
    try {
      await authApi.updateAppSettings({ admin_ntfy_token: '' })
      setSmtpValues((prev) => ({ ...prev, admin_ntfy_token: '' }))
      toast.success(t('admin.notifications.adminNtfyPanel.tokenCleared'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className="space-y-3">
      {/* Email (SMTP) */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.emailPanel.title')}
          hint={t('admin.smtp.hint')}
          trailing={
            <MToggle
              checked={emailActive}
              ariaLabel={t('admin.notifications.emailPanel.title')}
              onChange={() => setChannels(!emailActive, webhookActive, ntfyActive)}
            />
          }
        />
        <div className={`space-y-3 ${!emailActive ? 'pointer-events-none opacity-50' : ''}`}>
          {smtpLoaded &&
            SMTP_FIELDS.map((field) => (
              <MAdminField key={field.key} label={field.label}>
                <MAdminInput
                  type={field.type || 'text'}
                  value={smtpValues[field.key] || ''}
                  onChange={(e) => setSmtpValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </MAdminField>
            ))}
          <MAdminRow
            first
            title="Skip TLS certificate check"
            hint="Enable for self-signed certificates on local mail servers"
            trailing={
              <MToggle
                checked={smtpValues.smtp_skip_tls_verify === 'true'}
                ariaLabel="Skip TLS certificate check"
                onChange={(v) => setSmtpValues((prev) => ({ ...prev, smtp_skip_tls_verify: v ? 'true' : 'false' }))}
              />
            }
          />
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-[color:var(--m-rowbr)] pt-3">
          <MAdminButton onClick={saveSmtp}>{t('common.save')}</MAdminButton>
          <MAdminButton variant="ghost" disabled={!smtpConfigured} onClick={testSmtp}>
            {t('admin.smtp.testButton')}
          </MAdminButton>
        </div>
      </MAdminCard>

      {/* Webhook */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.webhookPanel.title')}
          hint={t('admin.webhook.hint')}
          trailing={
            <MToggle
              checked={webhookActive}
              ariaLabel={t('admin.notifications.webhookPanel.title')}
              onChange={() => setChannels(emailActive, !webhookActive, ntfyActive)}
            />
          }
        />
      </MAdminCard>

      {/* Ntfy */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.ntfy')}
          hint={t('admin.ntfy.hint')}
          trailing={
            <MToggle
              checked={ntfyActive}
              ariaLabel={t('admin.notifications.ntfy')}
              onChange={() => setChannels(emailActive, webhookActive, !ntfyActive)}
            />
          }
        />
      </MAdminCard>

      {/* In-App (always on) */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.inappPanel.title')}
          hint={t('admin.notifications.inappPanel.hint')}
          trailing={<MToggle checked disabled ariaLabel={t('admin.notifications.inappPanel.title')} onChange={() => {}} />}
        />
      </MAdminCard>

      {/* Trip reminders */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.tripReminders.title')}
          hint={t('admin.notifications.tripReminders.hint')}
          trailing={
            <MToggle
              checked={tripRemindersActive}
              ariaLabel={t('admin.notifications.tripReminders.title')}
              onChange={toggleTripReminders}
            />
          }
        />
      </MAdminCard>

      {/* Admin webhook */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.adminWebhookPanel.title')}
          hint={t('admin.notifications.adminWebhookPanel.hint')}
        />
        {smtpLoaded && (
          <div className="mb-3">
            <MAdminInput
              type="text"
              value={smtpValues.admin_webhook_url === '••••••••' ? '' : smtpValues.admin_webhook_url || ''}
              onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_webhook_url: e.target.value }))}
              placeholder={smtpValues.admin_webhook_url === '••••••••' ? '••••••••' : 'https://discord.com/api/webhooks/...'}
            />
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[color:var(--m-rowbr)] pt-3">
          <MAdminButton onClick={saveAdminWebhook}>{t('common.save')}</MAdminButton>
          <MAdminButton variant="ghost" disabled={!smtpValues.admin_webhook_url?.trim()} onClick={testAdminWebhook}>
            {t('admin.notifications.testWebhook')}
          </MAdminButton>
        </div>
      </MAdminCard>

      {/* Admin ntfy */}
      <MAdminCard>
        <MAdminCardHead
          title={t('admin.notifications.adminNtfyPanel.title')}
          hint={t('admin.notifications.adminNtfyPanel.hint')}
        />
        {smtpLoaded && (
          <div className="mb-3 space-y-3">
            <MAdminField
              label={t('admin.notifications.adminNtfyPanel.serverLabel')}
              hint={t('admin.notifications.adminNtfyPanel.serverHint')}
            >
              <MAdminInput
                type="text"
                value={smtpValues.admin_ntfy_server || ''}
                onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_server: e.target.value }))}
                placeholder={t('admin.notifications.adminNtfyPanel.serverPlaceholder')}
              />
            </MAdminField>
            <MAdminField label={t('admin.notifications.adminNtfyPanel.topicLabel')}>
              <MAdminInput
                type="text"
                value={smtpValues.admin_ntfy_topic || ''}
                onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_topic: e.target.value }))}
                placeholder={t('admin.notifications.adminNtfyPanel.topicPlaceholder')}
              />
            </MAdminField>
            <MAdminField label={t('admin.notifications.adminNtfyPanel.tokenLabel')}>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <MAdminInput
                    type="password"
                    value={smtpValues.admin_ntfy_token === '••••••••' ? '' : smtpValues.admin_ntfy_token || ''}
                    onChange={(e) => setSmtpValues((prev) => ({ ...prev, admin_ntfy_token: e.target.value }))}
                    placeholder={smtpValues.admin_ntfy_token === '••••••••' ? '••••••••' : ''}
                  />
                </div>
                {smtpValues.admin_ntfy_token === '••••••••' && (
                  <MAdminButton variant="danger" className="h-[42px]" onClick={clearNtfyToken}>
                    {t('common.clear')}
                  </MAdminButton>
                )}
              </div>
            </MAdminField>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-[color:var(--m-rowbr)] pt-3">
          <MAdminButton onClick={saveAdminNtfy}>{t('common.save')}</MAdminButton>
          <MAdminButton variant="ghost" disabled={!smtpValues.admin_ntfy_topic?.trim()} onClick={testAdminNtfy}>
            {t('admin.notifications.adminNtfyPanel.test')}
          </MAdminButton>
        </div>
      </MAdminCard>

      <MAdminNotifyMatrix t={t} toast={toast} />
    </div>
  )
}
