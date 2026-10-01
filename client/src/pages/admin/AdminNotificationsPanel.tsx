import React, { useEffect, useRef, useState } from 'react'
import { BellRing, Loader2 } from 'lucide-react'
import { adminApi } from '../../api/client'
import { useToast } from '../../components/shared/Toast'
import ToggleSwitch from '../../components/Settings/ToggleSwitch'
import { SettingsCard, SettingsHint } from '../../components/Settings/settingsKit'
import { fs } from '../../components/shared/DialogShell'
import { ADMIN_EVENT_LABEL_KEYS, ADMIN_CHANNEL_LABEL_KEYS } from './AdminPage.constants'

type Preferences = Record<string, Record<string, boolean>>

interface AdminPreferenceMatrix {
  event_types: string[]
  channels?: { id: string; active: boolean }[]
  implemented_combos: Record<string, string[] | undefined>
  preferences: Preferences
}

const EYEBROW = 'text-center font-geist font-bold uppercase tracking-[.08em] text-content-faint'

// Per-event × per-channel admin notification preference matrix.
// Loads its own data and auto-saves each toggle.
export default function AdminNotificationsPanel({ t, toast }: { t: (k: string) => string; toast: ReturnType<typeof useToast> }) {
  const [matrix, setMatrix] = useState<AdminPreferenceMatrix | null>(null)
  const [saving, setSaving] = useState(false)
  // Toggles fire faster than React re-renders, so the live preferences are mirrored in a
  // ref. Reading state out of the render closure would let a second toggle undo the first.
  const prefsRef = useRef<Preferences | null>(null)

  const writePrefs = (prefs: Preferences) => {
    prefsRef.current = prefs
    setMatrix(m => m ? { ...m, preferences: prefs } : m)
  }

  useEffect(() => {
    adminApi.getNotificationPreferences().then((data: AdminPreferenceMatrix) => {
      prefsRef.current = data.preferences
      setMatrix(data)
    }).catch(() => {})
  }, [])

  const card = (children: React.ReactNode) => (
    <SettingsCard icon={BellRing} title={t('admin.tabs.notifications')} hint={t('admin.notifications.adminNotificationsHint')}>
      {children}
    </SettingsCard>
  )

  if (!matrix) {
    return card(
      <div className="flex items-center gap-2 text-content-faint" style={fs(12, 'body')}>
        <Loader2 size={14} className="animate-spin" />
        <span>Loading…</span>
      </div>,
    )
  }

  // Admin-scoped events only ever go out over the built-in channels (plugin channels
  // are user-scoped), so this list stays explicit rather than server-driven.
  const isActive = (id: string) => matrix.channels?.some(c => c.id === id && c.active) ?? false
  const visibleChannels = (['inapp', 'email', 'webhook', 'ntfy'] as const).filter(ch => {
    if (!isActive(ch)) return false
    return matrix.event_types.some(evt => matrix.implemented_combos[evt]?.includes(ch))
  })

  const toggle = async (eventType: string, channel: string) => {
    const before = prefsRef.current ?? matrix.preferences
    const current = before[eventType]?.[channel] ?? true
    const updated = { ...before, [eventType]: { ...before[eventType], [channel]: !current } }
    writePrefs(updated)
    setSaving(true)
    try {
      await adminApi.updateNotificationPreferences(updated)
    } catch {
      // Revert this cell only — a toggle that already went through keeps its value.
      const latest = prefsRef.current ?? updated
      writePrefs({ ...latest, [eventType]: { ...latest[eventType], [channel]: current } })
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (matrix.event_types.length === 0) {
    return card(<SettingsHint>{t('settings.notificationPreferences.noChannels')}</SettingsHint>)
  }

  const columns = `minmax(0, 1fr) ${visibleChannels.map(() => '76px').join(' ')}`
  const channelName = (ch: string) => t(ADMIN_CHANNEL_LABEL_KEYS[ch]) || ch
  const eventName = (evt: string) => t(ADMIN_EVENT_LABEL_KEYS[evt]) || evt

  return card(
    <div className={`overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card transition-opacity ${saving ? 'opacity-60' : ''}`}>
      <div className="min-w-max">
        {/* The channel names over their columns */}
        <div className="grid items-end gap-1 border-b border-edge-faint px-3.5 pb-2 pt-2.5" style={{ gridTemplateColumns: columns }}>
          <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
            {saving ? 'Saving…' : null}
          </span>
          {visibleChannels.map(ch => (
            <span key={ch} className={EYEBROW} style={fs(9.5)}>{channelName(ch)}</span>
          ))}
        </div>
        {/* One row per event, a switch per channel that implements it */}
        <div className="divide-y divide-edge-faint">
          {matrix.event_types.map(eventType => {
            const implementedForEvent = matrix.implemented_combos[eventType] ?? []
            return (
              <div key={eventType} className="grid items-center gap-1 px-3.5 py-2.5" style={{ gridTemplateColumns: columns }}>
                <span className="min-w-0 truncate font-medium text-content" style={fs(13, 'body')}>{eventName(eventType)}</span>
                {visibleChannels.map(ch => {
                  if (!implementedForEvent.includes(ch)) {
                    return <span key={ch} className="text-center text-content-faint" style={fs(13, 'body')}>—</span>
                  }
                  const isOn = matrix.preferences[eventType]?.[ch] ?? true
                  return (
                    <div key={ch} className="flex justify-center">
                      <ToggleSwitch on={isOn} label={`${eventName(eventType)}, ${channelName(ch)}`} onToggle={() => { void toggle(eventType, ch) }} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>,
  )
}
