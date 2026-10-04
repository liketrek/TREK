import React, { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Bell, Lock, Plug, Send, Webhook } from 'lucide-react'
import { WEB_PUSH_CHANNEL_ID } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { notificationsApi, settingsApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import ToggleSwitch from './ToggleSwitch'
import Section from './Section'
import WebPushCard from './WebPushCard'
import { EVENT_LABEL_KEYS, channelLabel, isLockedCell } from './notificationLabels'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { EditorField, GRID_2, INPUT } from '../shared/dialogParts'
import { SettingsCard, SettingsHint, StatusPill, SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SETTINGS_BUTTON_PRIMARY } from './settingsKit'

interface ChannelDescriptor {
  id: string
  source: 'builtin' | 'plugin'
  /** Built-ins: an i18n key. */
  labelKey?: string
  /** Plugin channels: a literal name, already resolved by the server. */
  label?: string
  settingsPath?: string
  active: boolean
  configured: boolean
}

interface PreferencesMatrix {
  preferences: Record<string, Record<string, boolean>>
  channels: ChannelDescriptor[]
  event_types: string[]
  implemented_combos: Record<string, string[]>
  /** Cells the admin switched off for everyone (#1536). */
  locked?: Record<string, string[]>
  defaults?: { ntfyServer: string | null }
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
  const [channelTesting, setChannelTesting] = useState<string | null>(null)

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

  // Columns are whatever the server says exists and the admin turned on — so a
  // plugin channel gets a column here with no client change.
  const visibleChannels = matrix
    ? matrix.channels.filter(ch => {
        if (!ch.active) return false
        return matrix.event_types.some(evt => matrix.implemented_combos[evt]?.includes(ch.id))
      })
    : []

  const hasChannel = (id: string) => matrix?.channels.some(ch => ch.id === id && ch.active) ?? false

  // Plugin channels have no bespoke credential form here — the user fills those in on the
  // plugin's own settings page. What they DO get is a test send, through the generic route.
  const pluginChannels = matrix?.channels.filter(ch => ch.source === 'plugin' && ch.active) ?? []

  const testChannel = async (ch: ChannelDescriptor) => {
    setChannelTesting(ch.id)
    try {
      const result = await notificationsApi.testChannel(ch.id)
      if (result.success) toast.success(t('settings.notificationPreferences.testSuccess'))
      else toast.error(result.error || t('settings.notificationPreferences.testFailed'))
    } catch {
      toast.error(t('settings.notificationPreferences.testFailed'))
    } finally {
      setChannelTesting(null)
    }
  }

  const toggle = async (eventType: string, channel: string) => {
    if (!matrix || isLockedCell(matrix.locked, eventType, channel)) return
    const current = matrix.preferences[eventType]?.[channel] ?? true
    setMatrix(m => m ? {
      ...m,
      preferences: { ...m.preferences, [eventType]: { ...m.preferences[eventType], [channel]: !current } },
    } : m)
    setSaving(true)
    try {
      // Only the toggled cell goes out. The server merges what it gets, and sending the
      // whole matrix would carry this render's value for every other cell — a second
      // toggle made while this request is in flight would be overwritten by it.
      await notificationsApi.updatePreferences({ [eventType]: { [channel]: !current } })
    } catch {
      // Only this cell rolls back — restoring the whole snapshot would also undo a
      // toggle the user made while this request was in flight.
      setMatrix(m => m ? {
        ...m,
        preferences: { ...m.preferences, [eventType]: { ...m.preferences[eventType], [channel]: current } },
      } : m)
      toast.error(t('common.error'))
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
        ...(ntfyToken ? { ntfy_token: ntfyToken } : {}),
      })
      if (ntfyToken) setNtfyTokenIsSet(true)
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
        // A stored token is only masked in the placeholder, never in state — sending
        // null makes the server fall back to the saved one.
        token: ntfyToken || null,
      })
      if (result.success) toast.success(t('settings.ntfyUrl.testSuccess'))
      else toast.error(result.error || t('settings.ntfyUrl.testFailed'))
    } catch {
      toast.error(t('settings.ntfyUrl.testFailed'))
    } finally {
      setNtfyTesting(false)
    }
  }

  const renderMatrix = () => {
    if (!matrix) return <MatrixSkeleton label={t('common.loading')} />

    if (visibleChannels.length === 0) {
      return <SettingsHint>{t('settings.notificationPreferences.noChannels')}</SettingsHint>
    }

    // The event column takes what is left; every channel gets the same narrow
    // column, so the switches line up under their headers.
    const columns = `minmax(0, 1fr) ${visibleChannels.map(() => '72px').join(' ')}`

    return (
      <div className="overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card">
        <div className="min-w-fit divide-y divide-edge-faint">
          {/* Header row */}
          <div className="grid items-center gap-1 bg-surface-secondary px-3.5 py-2.5" style={{ gridTemplateColumns: columns }}>
            <span />
            {visibleChannels.map(ch => (
              <Tooltip key={ch.id} label={t('settings.notificationPreferences.notConfigured')} disabled={ch.configured}>
                <span
                  className={`line-clamp-2 break-words text-center font-geist font-bold uppercase leading-tight tracking-[.08em] ${ch.configured ? 'text-content-faint' : 'text-warning'}`}
                  style={fs(10)}
                >
                  {channelLabel(ch, t)}
                </span>
              </Tooltip>
            ))}
          </div>
          {/* Event rows */}
          {matrix.event_types.map(eventType => {
            const implementedForEvent = matrix.implemented_combos[eventType] ?? []
            const relevantChannels = visibleChannels.filter(ch => implementedForEvent.includes(ch.id))
            if (relevantChannels.length === 0) return null
            return (
              <div key={eventType} className="grid items-center gap-1 px-3.5 py-3" style={{ gridTemplateColumns: columns }}>
                <span className="min-w-0 pr-2 font-medium text-content" style={fs(13, 'body')}>
                  {t(EVENT_LABEL_KEYS[eventType]) || eventType}
                </span>
                {visibleChannels.map(ch => {
                  if (!implementedForEvent.includes(ch.id)) {
                    return <span key={ch.id} className="text-center text-content-faint" style={fs(13, 'body')}>—</span>
                  }
                  const isOn = matrix.preferences[eventType]?.[ch.id] ?? true
                  // Switched off for everyone by the admin (#1536): the same footprint as
                  // the switch, so the grid keeps its columns, and a lock that says why.
                  if (isLockedCell(matrix.locked, eventType, ch.id)) {
                    return (
                      <div key={ch.id} className="flex justify-center">
                        <Tooltip label={t('settings.notificationPreferences.lockedByAdmin')}>
                          <span role="img" aria-label={t('settings.notificationPreferences.lockedByAdmin')} data-locked
                            className="inline-flex h-6 w-11 items-center justify-center rounded-full bg-surface-tertiary text-content-faint">
                            <Lock size={12} />
                          </span>
                        </Tooltip>
                      </div>
                    )
                  }
                  return (
                    <div key={ch.id} className="flex justify-center">
                      <ToggleSwitch on={isOn} onToggle={() => toggle(eventType, ch.id)} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const webhookTestDisabled = (!webhookUrl && !webhookIsSet) || webhookTesting
  // The channel cards only make sense once there is a matrix to send through.
  const ready = !!matrix && visibleChannels.length > 0

  return (
    <div>
      <Section
        title={t('settings.notifications')}
        icon={Bell}
        badge={saving ? <StatusPill>{t('common.saving')}</StatusPill> : undefined}
      >
        {renderMatrix()}
      </Section>

      {ready && hasChannel('webhook') && (
        <SettingsCard icon={Webhook} title={t('settings.webhookUrl.label')} hint={t('settings.webhookUrl.hint')}>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="notifications-webhook-url"
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder={webhookIsSet ? '••••••••' : t('settings.webhookUrl.placeholder')}
              aria-label={t('settings.webhookUrl.label')}
              className={`${INPUT} min-w-[220px] flex-1`}
            />
            <button type="button" onClick={testWebhookUrl} disabled={webhookTestDisabled} className={SETTINGS_BUTTON} style={fs(13, 'body')}>
              {t('settings.webhookUrl.test')}
            </button>
            <button type="button" onClick={saveWebhookUrl} disabled={webhookSaving} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
              {t('common.save')}
            </button>
          </div>
        </SettingsCard>
      )}

      {ready && hasChannel('ntfy') && (
        <SettingsCard icon={Send} title={t('settings.notificationPreferences.ntfy')} hint={t('settings.ntfyUrl.hint')}>
          <div className={GRID_2}>
            <EditorField label={t('settings.ntfyUrl.topicLabel')} htmlFor="notifications-ntfy-topic">
              <input
                id="notifications-ntfy-topic"
                type="text"
                value={ntfyTopic}
                onChange={e => setNtfyTopic(e.target.value)}
                placeholder={t('settings.ntfyUrl.topicPlaceholder')}
                className={INPUT}
              />
            </EditorField>
            <EditorField label={t('settings.ntfyUrl.serverLabel')} htmlFor="notifications-ntfy-server">
              <input
                id="notifications-ntfy-server"
                type="text"
                value={ntfyServer}
                onChange={e => setNtfyServer(e.target.value)}
                placeholder={matrix?.defaults?.ntfyServer || t('settings.ntfyUrl.serverPlaceholder')}
                className={INPUT}
              />
            </EditorField>
          </div>
          <EditorField label={t('settings.ntfyUrl.tokenLabel')} htmlFor="notifications-ntfy-token" hint={t('settings.ntfyUrl.tokenHint')}>
            <div className="flex items-center gap-2">
              <input
                id="notifications-ntfy-token"
                type="password"
                value={ntfyToken}
                onChange={e => setNtfyToken(e.target.value)}
                placeholder={ntfyTokenIsSet ? '••••••••' : ''}
                className={`${INPUT} flex-1`}
              />
              {ntfyTokenIsSet && (
                <button type="button" onClick={clearNtfyToken} className={SETTINGS_BUTTON_DANGER} style={fs(13, 'body')}>
                  {t('common.clear')}
                </button>
              )}
            </div>
          </EditorField>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={testNtfySettings} disabled={!ntfyTopic || ntfyTesting} className={SETTINGS_BUTTON} style={fs(13, 'body')}>
              {t('settings.ntfyUrl.test')}
            </button>
            <button type="button" onClick={saveNtfySettings} disabled={ntfySaving} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
              {t('common.save')}
            </button>
          </div>
        </SettingsCard>
      )}

      {/* Per device rather than per account: the matrix above picks the events,
          this card decides whether this browser is one of the places they go. */}
      {ready && hasChannel(WEB_PUSH_CHANNEL_ID) && <WebPushCard />}

      {ready && pluginChannels.map(ch => (
        <SettingsCard
          key={ch.id}
          icon={Plug}
          title={channelLabel(ch, t)}
          hint={ch.configured
            ? t('settings.notificationPreferences.pluginConfigured')
            : t('settings.notificationPreferences.notConfigured')}
          action={
            <>
              {/* Unconfigured is the common case on first use — send them to where the
                  credentials actually live rather than just naming the place. */}
              {!ch.configured && ch.settingsPath && (
                <Link to={ch.settingsPath} className={`${SETTINGS_BUTTON_PRIMARY} no-underline`} style={fs(13, 'body')}>
                  {t('settings.notificationPreferences.configure')}
                </Link>
              )}
              <button type="button"
                onClick={() => testChannel(ch)}
                disabled={!ch.configured || channelTesting === ch.id}
                className={SETTINGS_BUTTON}
                style={fs(13, 'body')}
              >
                {t('settings.notificationPreferences.sendTest')}
              </button>
            </>
          }
        />
      ))}
    </div>
  )
}

/** A calm placeholder for the matrix while the preferences load. */
function MatrixSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      <SettingsHint>{label}</SettingsHint>
      <div className="divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-4 px-3.5 py-3">
            <span className="h-3 flex-1 animate-pulse rounded-full bg-surface-tertiary" />
            <span className="h-6 w-11 animate-pulse rounded-full bg-surface-tertiary" />
          </div>
        ))}
      </div>
    </div>
  )
}
