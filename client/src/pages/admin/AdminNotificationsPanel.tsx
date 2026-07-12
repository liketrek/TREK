import React, { useEffect, useState } from 'react'
import { adminApi } from '../../api/client'
import { useToast } from '../../components/shared/Toast'
import { ADMIN_EVENT_LABEL_KEYS, ADMIN_CHANNEL_LABEL_KEYS } from './AdminPage.constants'

// Per-event × per-channel admin notification preference matrix.
// Loads its own data and auto-saves each toggle. Markup identical to AdminPage.
export default function AdminNotificationsPanel({ t, toast }: { t: (k: string) => string; toast: ReturnType<typeof useToast> }) {
  const [matrix, setMatrix] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.getNotificationPreferences().then((data: any) => setMatrix(data)).catch(() => {})
  }, [])

  if (!matrix) return <p className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontStyle: 'italic', padding: 16 }}>Loading…</p>

  // Admin-scoped events only ever go out over the built-in channels (plugin channels
  // are user-scoped), so this list stays explicit rather than server-driven.
  const isActive = (id: string) => matrix.channels?.some((c: { id: string; active: boolean }) => c.id === id && c.active) ?? false
  const visibleChannels = (['inapp', 'email', 'webhook', 'ntfy'] as const).filter(ch => {
    if (!isActive(ch)) return false
    return matrix.event_types.some((evt: string) => matrix.implemented_combos[evt]?.includes(ch))
  })

  const toggle = async (eventType: string, channel: string) => {
    const current = matrix.preferences[eventType]?.[channel] ?? true
    const updated = { ...matrix.preferences, [eventType]: { ...matrix.preferences[eventType], [channel]: !current } }
    setMatrix((m: any) => m ? { ...m, preferences: updated } : m)
    setSaving(true)
    try {
      await adminApi.updateNotificationPreferences(updated)
    } catch {
      setMatrix((m: any) => m ? { ...m, preferences: matrix.preferences } : m)
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  if (matrix.event_types.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-content-faint" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('settings.notificationPreferences.noChannels')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t('admin.tabs.notifications')}</h2>
          <p className="text-xs text-slate-400 mt-1">{t('admin.notifications.adminNotificationsHint')}</p>
        </div>
        <div className="p-6">
          {saving && <p className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginBottom: 8 }}>Saving…</p>}
          {/* Header row */}
          <div className="border-b border-edge" style={{ display: 'grid', gridTemplateColumns: `1fr ${visibleChannels.map(() => '80px').join(' ')}`, gap: 4, paddingBottom: 6, marginBottom: 4 }}>
            <span />
            {visibleChannels.map(ch => (
              <span key={ch} className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t(ADMIN_CHANNEL_LABEL_KEYS[ch]) || ch}
              </span>
            ))}
          </div>
          {/* Event rows */}
          {matrix.event_types.map((eventType: string) => {
            const implementedForEvent = matrix.implemented_combos[eventType] ?? []
            return (
              <div key={eventType} className="border-b border-edge" style={{ display: 'grid', gridTemplateColumns: `1fr ${visibleChannels.map(() => '80px').join(' ')}`, gap: 4, alignItems: 'center', padding: '8px 0' }}>
                <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>
                  {t(ADMIN_EVENT_LABEL_KEYS[eventType]) || eventType}
                </span>
                {visibleChannels.map(ch => {
                  if (!implementedForEvent.includes(ch)) {
                    return <span key={ch} className="text-content-faint" style={{ textAlign: 'center', fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>—</span>
                  }
                  const isOn = matrix.preferences[eventType]?.[ch] ?? true
                  return (
                    <div key={ch} style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => toggle(eventType, ch)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${isOn ? 'bg-content' : 'bg-edge'}`}
                      >
                        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200"
                          style={{ transform: isOn ? 'translateX(16px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
