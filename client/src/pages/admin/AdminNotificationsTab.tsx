import React, { useId } from 'react'
import { Bell, BellRing, Mail, Save, Send, Webhook } from 'lucide-react'
import type { TranslationFn } from '../../types'
import type { useAdmin } from './useAdmin'
import AdminNotificationsPanel from './AdminNotificationsPanel'
import AdminNotificationDefaultsPanel from './AdminNotificationDefaultsPanel'
import { SWITCH_ONLY_CHANNELS, useNotificationChannels } from '../../components/Admin/useNotificationChannels'
import { MASK, useAdminNotificationSettings } from '../../components/Admin/useAdminNotificationSettings'
import ToggleSwitch from '../../components/Settings/ToggleSwitch'
import {
  SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY, SettingRow, SettingRows, SettingsCard, SettingsColumns,
} from '../../components/Settings/settingsKit'
import { EditorField, GRID_2, INPUT } from '../../components/shared/dialogParts'
import { fs } from '../../components/shared/DialogShell'

interface AdminNotificationsTabProps {
  admin: ReturnType<typeof useAdmin>
  t: TranslationFn
}

/** The save and test buttons under a card's fields, on a hairline of their own. */
function CardActions({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="flex flex-wrap items-center gap-2 border-t border-edge-faint pt-4" style={fs(13, 'body')}>{children}</div>
}

/**
 * In-app delivery cannot be switched off, so its card shows the switch in the
 * on position, greyed and out of reach: the look of a ToggleSwitch, not a button.
 */
function LockedSwitch(): React.ReactElement {
  return (
    <span aria-hidden="true" className="relative inline-block h-6 w-11 flex-none cursor-not-allowed rounded-full bg-accent opacity-50">
      <span className="absolute left-[22px] top-0.5 h-5 w-5 rounded-full bg-accent-text shadow-sm" />
    </span>
  )
}

const SMTP_FIELDS: { key: string; label: string; placeholder: string; type?: string }[] = [
  { key: 'smtp_host', label: 'SMTP Host', placeholder: 'mail.example.com' },
  { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
  { key: 'smtp_user', label: 'SMTP User', placeholder: 'trek@example.com' },
  { key: 'smtp_pass', label: 'SMTP Password', placeholder: MASK, type: 'password' },
  { key: 'smtp_from', label: 'From Address', placeholder: 'trek@example.com' },
]

// "Notifications" admin tab: email/webhook/ntfy/web push channel toggles, SMTP
// credentials, trip reminders, admin webhook + ntfy targets, and the per-event
// preference matrix. The channel switches come from useNotificationChannels,
// which the phone section shares.
export default function AdminNotificationsTab({ admin, t }: AdminNotificationsTabProps): React.ReactElement {
  const { toast, smtpValues, setSmtpValues, smtpLoaded, managed } = admin
  const ids = useId()

  const channels = useNotificationChannels(admin, t)
  const emailActive = channels.isActive('email')
  const {
    tripRemindersActive, smtpConfigured, saveSmtp: saveNotifications, testSmtp, toggleTripReminders, saveAdminWebhook,
    testAdminWebhook, clearNtfyToken, saveAdminNtfy, testAdminNtfy,
  } = useAdminNotificationSettings(admin, t)

  const smtpField = (field: typeof SMTP_FIELDS[number]) => (
    <EditorField key={field.key} label={field.label} htmlFor={`${ids}-${field.key}`}>
      {/* A stored password comes back masked. Showing the mask as the VALUE meant
          typing a new one appended it to eight bullet characters and saved that,
          so the same treatment as the webhook URL below: mask as placeholder. */}
      <input
        id={`${ids}-${field.key}`}
        type={field.type || 'text'}
        value={smtpValues[field.key] === MASK ? '' : smtpValues[field.key] || ''}
        onChange={e => setSmtpValues(prev => ({ ...prev, [field.key]: e.target.value }))}
        placeholder={field.placeholder}
        className={INPUT}
      />
    </EditorField>
  )

  return (<>
    {/* Every channel users can receive on is one switch in one card, the SMTP
        relay's fields a section under them; the operator's own targets and the
        admin-only matrix on the right. */}
    <SettingsColumns
      start={
        <SettingsCard icon={Bell} title={t('admin.notifications.channels')}>
          <SettingRows>
            {/* The relay is the operator's on a managed install: their host, their
                credential, their sending reputation. */}
            {!managed && (
              <SettingRow
                label={t('admin.notifications.emailPanel.title')}
                hint={t('admin.smtp.hint')}
                control={<ToggleSwitch on={emailActive} label={t('admin.notifications.emailPanel.title')} onToggle={() => channels.toggle('email')} />}
              />
            )}
            {SWITCH_ONLY_CHANNELS.map(ch => (
              <SettingRow
                key={ch.id}
                label={t(ch.titleKey)}
                hint={t(ch.hintKey)}
                control={<ToggleSwitch on={channels.isActive(ch.id)} label={t(ch.titleKey)} onToggle={() => channels.toggle(ch.id)} />}
              />
            ))}
            <SettingRow
              label={t('admin.notifications.inappPanel.title')}
              hint={t('admin.notifications.inappPanel.hint')}
              control={<LockedSwitch />}
            />
            <SettingRow
              label={t('admin.notifications.tripReminders.title')}
              hint={t('admin.notifications.tripReminders.hint')}
              control={
                <ToggleSwitch
                  on={tripRemindersActive}
                  label={t('admin.notifications.tripReminders.title')}
                  onToggle={toggleTripReminders}
                />
              }
            />
          </SettingRows>

          {/* The SMTP relay, a section of this card: greyed and out of reach while
              the email channel is off, never hidden. */}
          {!managed && (
            <SettingsCard icon={Mail} title={t('admin.notifications.emailPanel.title')}>
              <div data-testid="smtp-fields" className={`flex flex-col gap-4 transition-opacity ${!emailActive ? 'opacity-50 pointer-events-none' : ''}`}>
                {smtpLoaded && (<>
                  <div className={GRID_2}>
                    {smtpField(SMTP_FIELDS[0])}
                    {smtpField(SMTP_FIELDS[1])}
                  </div>
                  <div className={GRID_2}>
                    {smtpField(SMTP_FIELDS[2])}
                    {smtpField(SMTP_FIELDS[3])}
                  </div>
                  {smtpField(SMTP_FIELDS[4])}
                </>)}
                <SettingRows>
                  <SettingRow
                    label={t('admin.smtp.skipTls')}
                    hint={t('admin.smtp.skipTlsHint')}
                    control={
                      <ToggleSwitch
                        on={smtpValues.smtp_skip_tls_verify === 'true'}
                        label={t('admin.smtp.skipTls')}
                        onToggle={() => {
                          const newVal = smtpValues.smtp_skip_tls_verify === 'true' ? 'false' : 'true'
                          setSmtpValues(prev => ({ ...prev, smtp_skip_tls_verify: newVal }))
                        }}
                      />
                    }
                  />
                </SettingRows>
              </div>
              <CardActions>
                <button type="button" onClick={saveNotifications} className={SETTINGS_BUTTON_PRIMARY}>
                  <Save size={14} strokeWidth={2.2} />{t('common.save')}
                </button>
                <button type="button"
                  onClick={testSmtp}
                  disabled={!smtpConfigured}
                  className={SETTINGS_BUTTON}
                >
                  <Send size={14} strokeWidth={2.2} />{t('admin.smtp.testButton')}
                </button>
              </CardActions>
            </SettingsCard>
          )}
        </SettingsCard>
      }
      end={
      // What the operator receives about running the instance: one card, the
      // two targets as its blocks, then which event goes out over which channel.
      <SettingsCard icon={BellRing} title={t('admin.notifications.adminAlerts')} hint={t('admin.notifications.adminNotificationsHint')}>
        {/* Admin alerts are about running the instance (version notices, and what else
            lands there later). On a managed install those go to whoever runs it. */}
        {!managed && (<>
          {/* Admin Webhook Panel */}
          <SettingsCard icon={Webhook} title={t('admin.notifications.adminWebhookPanel.title')} hint={t('admin.notifications.adminWebhookPanel.hint')}>
            {smtpLoaded && (
              <EditorField label={t('admin.notifications.adminWebhookPanel.title')} htmlFor={`${ids}-admin-webhook`}>
                <input
                  id={`${ids}-admin-webhook`}
                  type="text"
                  value={smtpValues.admin_webhook_url === MASK ? '' : smtpValues.admin_webhook_url || ''}
                  onChange={e => setSmtpValues(prev => ({ ...prev, admin_webhook_url: e.target.value }))}
                  placeholder={smtpValues.admin_webhook_url === MASK ? MASK : 'https://discord.com/api/webhooks/...'}
                  className={INPUT}
                />
              </EditorField>
            )}
            <CardActions>
              <button type="button"
                onClick={saveAdminWebhook}
                className={SETTINGS_BUTTON_PRIMARY}>
                <Save size={14} strokeWidth={2.2} />{t('common.save')}
              </button>
              <button type="button"
                onClick={testAdminWebhook}
                disabled={!smtpValues.admin_webhook_url?.trim()}
                className={SETTINGS_BUTTON}
              >
                <Send size={14} strokeWidth={2.2} />{t('admin.notifications.testWebhook')}
              </button>
            </CardActions>
          </SettingsCard>

          {/* Admin Ntfy Panel — same audience as the webhook above, and inside the
              same wrapper. */}
          <SettingsCard icon={BellRing} title={t('admin.notifications.adminNtfyPanel.title')} hint={t('admin.notifications.adminNtfyPanel.hint')}>
            {smtpLoaded && (<>
              <EditorField label={t('admin.notifications.adminNtfyPanel.serverLabel')} htmlFor={`${ids}-ntfy-server`} hint={t('admin.notifications.adminNtfyPanel.serverHint')}>
                <input
                  id={`${ids}-ntfy-server`}
                  type="text"
                  value={smtpValues.admin_ntfy_server || ''}
                  onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_server: e.target.value }))}
                  placeholder={t('admin.notifications.adminNtfyPanel.serverPlaceholder')}
                  className={INPUT}
                />
              </EditorField>
              <EditorField label={t('admin.notifications.adminNtfyPanel.topicLabel')} htmlFor={`${ids}-ntfy-topic`}>
                <input
                  id={`${ids}-ntfy-topic`}
                  type="text"
                  value={smtpValues.admin_ntfy_topic || ''}
                  onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_topic: e.target.value }))}
                  placeholder={t('admin.notifications.adminNtfyPanel.topicPlaceholder')}
                  className={INPUT}
                />
              </EditorField>
              <EditorField label={t('admin.notifications.adminNtfyPanel.tokenLabel')} htmlFor={`${ids}-ntfy-token`}>
                <div className="flex gap-2">
                  <input
                    id={`${ids}-ntfy-token`}
                    type="password"
                    value={smtpValues.admin_ntfy_token === MASK ? '' : smtpValues.admin_ntfy_token || ''}
                    onChange={e => setSmtpValues(prev => ({ ...prev, admin_ntfy_token: e.target.value }))}
                    placeholder={smtpValues.admin_ntfy_token === MASK ? MASK : ''}
                    className={INPUT}
                  />
                  {smtpValues.admin_ntfy_token === MASK && (
                    <button type="button"
                      onClick={clearNtfyToken}
                      className={`${SETTINGS_BUTTON_DANGER} flex-none`}
                    >
                      {t('common.clear')}
                    </button>
                  )}
                </div>
              </EditorField>
            </>)}
            <CardActions>
              <button type="button"
                onClick={saveAdminNtfy}
                className={SETTINGS_BUTTON_PRIMARY}>
                <Save size={14} strokeWidth={2.2} />{t('common.save')}
              </button>
              <button type="button"
                onClick={testAdminNtfy}
                disabled={!smtpValues.admin_ntfy_topic?.trim()}
                className={SETTINGS_BUTTON}
              >
                <Send size={14} strokeWidth={2.2} />{t('admin.notifications.adminNtfyPanel.test')}
              </button>
            </CardActions>
          </SettingsCard>
        </>)}

        {/* The matrix decides which of those channels each admin-only event goes out
            over, so it belongs under the targets it routes to rather than across the
            full width below both columns. */}
        <AdminNotificationsPanel t={t} toast={toast} bare />
      </SettingsCard>
      }
    />

    {/* What users' own notifications start as, across the full width: one row per
        user event, one column per channel users can pick (#1536). */}
    <AdminNotificationDefaultsPanel />
  </>)
}
