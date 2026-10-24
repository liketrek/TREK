import { Check, Lock, Minus, UsersRound } from 'lucide-react'
import type { NotificationDefault } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../../components/shared/Tooltip'
import { SettingsCard } from '../../components/Settings/settingsKit'
import { fs } from '../../components/shared/DialogShell'
import { EVENT_LABEL_KEYS, channelLabel } from '../../components/Settings/notificationLabels'
import { useNotificationDefaults } from './useNotificationDefaults'

const NEXT: Record<NotificationDefault, NotificationDefault> = { on: 'off', off: 'blocked', blocked: 'on' }
const ICON = { on: Check, off: Minus, blocked: Lock } as const
const TONE: Record<NotificationDefault, string> = {
  on: 'bg-accent text-accent-text border-transparent',
  off: 'bg-surface-card text-content-muted border-edge',
  blocked: 'bg-danger-soft text-danger border-transparent',
}
const LABEL_KEYS: Record<NotificationDefault, string> = {
  on: 'admin.notificationDefaults.on',
  off: 'admin.notificationDefaults.off',
  blocked: 'admin.notificationDefaults.blocked',
}

/**
 * What every user's notification cells start as (#1536). One cell per event and
 * channel, cycling On → Off → Blocked: Off is a default each user may still turn
 * on, Blocked is off for everyone and shows as locked in their settings.
 */
export default function AdminNotificationDefaultsPanel() {
  const { t } = useTranslation()
  const { matrix, saving, cycle } = useNotificationDefaults()
  if (!matrix) return null

  const channels = matrix.channels.filter(ch => matrix.event_types.some(evt => matrix.implemented_combos[evt]?.includes(ch.id)))
  const columns = `minmax(0, 1fr) ${channels.map(() => '76px').join(' ')}`

  return (
    <SettingsCard id="notif-defaults" icon={UsersRound} title={t('admin.notificationDefaults.title')} hint={t('admin.notificationDefaults.hint')}>
      {/* The legend is the key to the cells below, so it reads in the same three chips. */}
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
        {(['on', 'off', 'blocked'] as const).map(state => {
          const Icon = ICON[state]
          return (
            <span key={state} className={`inline-flex items-center gap-1 rounded-full border px-2 py-[2px] font-semibold ${TONE[state]}`} style={fs(11)}>
              <Icon size={11} strokeWidth={2.6} />
              {t(LABEL_KEYS[state])}
            </span>
          )
        })}
      </div>
      <div className={`overflow-x-auto rounded-[12px] border border-edge-faint bg-surface-card transition-opacity ${saving ? 'opacity-60' : ''}`}>
        <div className="min-w-max">
          <div className="grid items-end gap-1 border-b border-edge-faint px-3.5 pb-2 pt-2.5" style={{ gridTemplateColumns: columns }}>
            <span />
            {channels.map(ch => (
              <span key={ch.id} className="truncate text-center font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{channelLabel(ch, t)}</span>
            ))}
          </div>
          <div className="divide-y divide-edge-faint">
            {matrix.event_types.map(eventType => {
              const implemented = matrix.implemented_combos[eventType] ?? []
              return (
                <div key={eventType} className="grid items-center gap-1 px-3.5 py-2" style={{ gridTemplateColumns: columns }}>
                  <span className="min-w-0 truncate font-medium text-content" style={fs(13, 'body')}>{t(EVENT_LABEL_KEYS[eventType]) || eventType}</span>
                  {channels.map(ch => {
                    if (!implemented.includes(ch.id)) return <span key={ch.id} className="text-center text-content-faint" style={fs(13, 'body')}>—</span>
                    const state = matrix.defaults[eventType]?.[ch.id] ?? 'on'
                    const Icon = ICON[state]
                    const label = `${t(EVENT_LABEL_KEYS[eventType]) || eventType}, ${channelLabel(ch, t)}: ${t(LABEL_KEYS[state])}`
                    return (
                      <div key={ch.id} className="flex justify-center">
                        <Tooltip label={t('admin.notificationDefaults.cycle', { next: t(LABEL_KEYS[NEXT[state]]) })}>
                          <button type="button" aria-label={label} data-state={state} disabled={saving}
                            onClick={() => void cycle(eventType, ch.id, NEXT[state])}
                            className={`inline-flex h-7 w-12 items-center justify-center rounded-full border transition-colors hover:opacity-85 disabled:cursor-default ${TONE[state]}`}>
                            <Icon size={13} strokeWidth={2.6} />
                          </button>
                        </Tooltip>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}
