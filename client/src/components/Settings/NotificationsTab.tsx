import React, { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { notificationsApi, settingsApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import ToggleSwitch from './ToggleSwitch'
import Section from './Section'

interface PreferencesMatrix {
  preferences: Record<string, Record<string, boolean>>
  available_channels: { email: boolean; webhook: boolean; inapp: boolean; ntfy: boolean }
  event_types: string[]
  implemented_combos: Record<string, string[]>
  defaults?: { ntfyServer: string | null }
}

const CHANNEL_LABEL_KEYS: Record<string, string> = {
  email: 'settings.notificationPreferences.email',
  webhook: 'settings.notificationPreferences.webhook',
  inapp: 'settings.notificationPreferences.inapp',
  ntfy: 'settings.notificationPreferences.ntfy',
}

const EVENT_LABEL_KEYS: Record<string, string> = {
  trip_invite: 'settings.notifyTripInvite',
  booking_change: 'settings.notifyBookingChange',
  trip_reminder: 'settings.notifyTripReminder',
  todo_due: 'settings.notifyTodoDue',
  vacay_invite: 'settings.notifyVacayInvite',
  photos_shared: 'settings.notifyPhotosShared',
  collab_message: 'settings.notifyCollabMessage',
  packing_tagged: 'settings.notifyPackingTagged',
  version_available: 'settings.notifyVersionAvailable',
}

export default function NotificationsTab(): React.ReactElement {
  const { t } = useTranslation()
  const toast = useToast()
  const [matrix, setMatrix] = useState<PreferencesMatrix | null>(null)
  const [saving, setSaving] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookIsSet, setWebhookIsSet] = useState(false)
  const [webhookSaving, setWebhookSaving] = useState(false)
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [ntfyTopic, setNtfyTopic] = useState('')
  const [ntfyServer, setNtfyServer] = useState('')
  const [ntfyToken, setNtfyToken] = useState('')
  const [ntfyTokenIsSet, setNtfyTokenIsSet] = useState(false)
  const [ntfySaving, setNtfySaving] = useState(false)
  const [ntfyTesting, setNtfyTesting] = useState(false)

  useEffect(() => {
    notificationsApi.getPreferences().then((data: PreferencesMatrix) => setMatrix(data)).catch(() => {})
    settingsApi.get().then((data: { settings: Record<string, unknown> }) => {
      const val = (data.settings?.webhook_url as string) || ''
      if (val === '••••••••') {
        setWebhookIsSet(true)
        setWebhookUrl('')
      } else {
        setWebhookUrl(val)
      }
      setNtfyTopic((data.settings?.ntfy_topic as string) || '')
      setNtfyServer((data.settings?.ntfy_server as string) || '')
      const rawToken = (data.settings?.ntfy_token as string) || ''
      if (rawToken === '••••••••') {
        setNtfyTokenIsSet(true)
        setNtfyToken('')
      } else {
        setNtfyToken(rawToken)
      }
    }).catch(() => {})
  }, [])

  const visibleChannels = matrix
    ? (['email', 'webhook', 'ntfy', 'inapp'] as const).filter(ch => {
        if (!matrix.available_channels[ch as keyof typeof matrix.available_channels]) return false
        return matrix.event_types.some(evt => matrix.implemented_combos[evt]?.includes(ch))
      })
    : []

  const toggle = async (eventType: string, channel: string) => {
    if (!matrix) return
    const current = matrix.preferences[eventType]?.[channel] ?? true
    const updated = {
      ...matrix.preferences,
      [eventType]: { ...matrix.preferences[eventType], [channel]: !current },
    }
    setMatrix(m => m ? { ...m, preferences: updated } : m)
    setSaving(true)
    try {
      await notificationsApi.updatePreferences(updated)
    } catch {
      setMatrix(m => m ? { ...m, preferences: matrix.preferences } : m)
    } finally {
      setSaving(false)
    }
  }

  const saveWebhookUrl = async () => {
    setWebhookSaving(true)
    try {
      await settingsApi.set('webhook_url', webhookUrl)
      if (webhookUrl) setWebhookIsSet(true)
      else setWebhookIsSet(false)
      toast.success(t('settings.webhookUrl.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setWebhookSaving(false)
    }
  }

  const testWebhookUrl = async () => {
    if (!webhookUrl && !webhookIsSet) return
    setWebhookTesting(true)
    try {
      const result = await notificationsApi.testWebhook(webhookUrl || undefined)
      if (result.success) toast.success(t('settings.webhookUrl.testSuccess'))
      else toast.error(result.error || t('settings.webhookUrl.testFailed'))
    } catch {
      toast.error(t('settings.webhookUrl.testFailed'))
    } finally {
      setWebhookTesting(false)
    }
  }

  const saveNtfySettings = async () => {
    setNtfySaving(true)
    try {
      await settingsApi.setBulk({
        ntfy_topic: ntfyTopic,
        ntfy_server: ntfyServer,
        ...(ntfyToken && ntfyToken !== '••••••••' ? { ntfy_token: ntfyToken } : {}),
      })
      if (ntfyToken && ntfyToken !== '••••••••') setNtfyTokenIsSet(true)
      toast.success(t('settings.ntfyUrl.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setNtfySaving(false)
    }
  }

  const clearNtfyToken = async () => {
    try {
      await settingsApi.set('ntfy_token', '')
      setNtfyToken('')
      setNtfyTokenIsSet(false)
      toast.success(t('settings.ntfyUrl.tokenCleared'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const testNtfySettings = async () => {
    if (!ntfyTopic) return
    setNtfyTesting(true)
    try {
      const result = await notificationsApi.testNtfy({
        topic: ntfyTopic,
        server: ntfyServer || null,
        token: ntfyToken && ntfyToken !== '••••••••' ? ntfyToken : null,
      })
      if (result.success) toast.success(t('settings.ntfyUrl.testSuccess'))
      else toast.error(result.error || t('settings.ntfyUrl.testFailed'))
    } catch {
      toast.error(t('settings.ntfyUrl.testFailed'))
    } finally {
      setNtfyTesting(false)
    }
  }

  const renderContent = () => {
    if (!matrix) return <p style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', fontStyle: 'italic' }}>{t('common.loading')}</p>

    if (visibleChannels.length === 0) {
      return (
        <p style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', fontStyle: 'italic' }}>
          {t('settings.notificationPreferences.noChannels')}
        </p>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {saving && <p style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginBottom: 8 }}>{t('common.saving')}</p>}
        {matrix.available_channels.webhook && (
          <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
            <label style={{ display: 'block', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t('settings.webhookUrl.label')}
            </label>
            <p style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginBottom: 8 }}>{t('settings.webhookUrl.hint')}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder={webhookIsSet ? '••••••••' : t('settings.webhookUrl.placeholder')}
                style={{ flex: 1, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '6px 10px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={saveWebhookUrl}
                disabled={webhookSaving}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '6px 12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 6, cursor: webhookSaving ? 'not-allowed' : 'pointer', opacity: webhookSaving ? 0.6 : 1 }}
              >
                {t('common.save')}
              </button>
              <button
                onClick={testWebhookUrl}
                disabled={(!webhookUrl && !webhookIsSet) || webhookTesting}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '6px 12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, cursor: ((!webhookUrl && !webhookIsSet) || webhookTesting) ? 'not-allowed' : 'pointer', opacity: ((!webhookUrl && !webhookIsSet) || webhookTesting) ? 0.5 : 1 }}
              >
                {t('settings.webhookUrl.test')}
              </button>
            </div>
          </div>
        )}
        {matrix.available_channels.ntfy && (
          <div style={{ marginBottom: 16, padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
            <label style={{ display: 'block', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t('settings.ntfyUrl.topicLabel')}
            </label>
            <p style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginBottom: 8 }}>{t('settings.ntfyUrl.hint')}</p>
            <input
              type="text"
              value={ntfyTopic}
              onChange={e => setNtfyTopic(e.target.value)}
              placeholder={t('settings.ntfyUrl.topicPlaceholder')}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '6px 10px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: 6 }}
            />
            <label style={{ display: 'block', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t('settings.ntfyUrl.serverLabel')}
            </label>
            <input
              type="text"
              value={ntfyServer}
              onChange={e => setNtfyServer(e.target.value)}
              placeholder={matrix.defaults?.ntfyServer || t('settings.ntfyUrl.serverPlaceholder')}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '6px 10px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: 6 }}
            />
            <label style={{ display: 'block', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {t('settings.ntfyUrl.tokenLabel')}
            </label>
            <p style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginBottom: 4 }}>{t('settings.ntfyUrl.tokenHint')}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="password"
                value={ntfyToken}
                onChange={e => setNtfyToken(e.target.value)}
                placeholder={ntfyTokenIsSet ? '••••••••' : ''}
                style={{ flex: 1, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '6px 10px', border: '1px solid var(--border-primary)', borderRadius: 6, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              {ntfyTokenIsSet && (
                <button
                  onClick={clearNtfyToken}
                  style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '6px 12px', background: 'transparent', color: 'var(--color-danger, #e53e3e)', border: '1px solid var(--color-danger, #e53e3e)', borderRadius: 6, cursor: 'pointer' }}
                >
                  {t('common.clear')}
                </button>
              )}
              <button
                onClick={saveNtfySettings}
                disabled={ntfySaving}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '6px 12px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 6, cursor: ntfySaving ? 'not-allowed' : 'pointer', opacity: ntfySaving ? 0.6 : 1 }}
              >
                {t('common.save')}
              </button>
              <button
                onClick={testNtfySettings}
                disabled={!ntfyTopic || ntfyTesting}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '6px 12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, cursor: (!ntfyTopic || ntfyTesting) ? 'not-allowed' : 'pointer', opacity: (!ntfyTopic || ntfyTesting) ? 0.5 : 1 }}
              >
                {t('settings.ntfyUrl.test')}
              </button>
            </div>
          </div>
        )}
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: `1fr ${visibleChannels.map(() => '64px').join(' ')}`, gap: 4, paddingBottom: 6, marginBottom: 4, borderBottom: '1px solid var(--border-primary)' }}>
          <span />
          {visibleChannels.map(ch => (
            <span key={ch} style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t(CHANNEL_LABEL_KEYS[ch]) || ch}
            </span>
          ))}
        </div>
        {/* Event rows */}
        {matrix.event_types.map(eventType => {
          const implementedForEvent = matrix.implemented_combos[eventType] ?? []
          const relevantChannels = visibleChannels.filter(ch => implementedForEvent.includes(ch))
          if (relevantChannels.length === 0) return null
          return (
            <div key={eventType} style={{ display: 'grid', gridTemplateColumns: `1fr ${visibleChannels.map(() => '64px').join(' ')}`, gap: 4, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-primary)' }}>
                {t(EVENT_LABEL_KEYS[eventType]) || eventType}
              </span>
              {visibleChannels.map(ch => {
                if (!implementedForEvent.includes(ch)) {
                  return <span key={ch} style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>—</span>
                }
                const isOn = matrix.preferences[eventType]?.[ch] ?? true
                return (
                  <div key={ch} style={{ display: 'flex', justifyContent: 'center' }}>
                    <ToggleSwitch on={isOn} onToggle={() => toggle(eventType, ch)} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Section title={t('settings.notifications')} icon={Lock}>
      {renderContent()}
    </Section>
  )
}
