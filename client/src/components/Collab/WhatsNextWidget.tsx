import React, { useMemo } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { MapPin, Sparkles } from 'lucide-react'
import { fs } from '../shared/DialogShell'
import CollabPanelHead from './CollabPanelHead'
import EmptyState from '../shared/EmptyState'
import { localToday } from '../Planner/today'

function formatTime(timeStr, is12h) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  if (is12h) {
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDayLabel(date, t, locale) {
  const now = new Date()
  // Day dates are plain calendar strings, so "today"/"tomorrow" have to be
  // compared against the local calendar day, not the UTC one.
  const nowDate = localToday(now)
  const tomorrowDate = localToday(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))

  if (date === nowDate) return t('collab.whatsNext.today') || 'Today'
  if (date === tomorrowDate) return t('collab.whatsNext.tomorrow') || 'Tomorrow'

  return new Date(date + 'T00:00:00Z').toLocaleDateString(locale || undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

interface TripMember {
  id: number
  username: string
  avatar?: string | null
  avatar_url?: string | null
}

interface WhatsNextWidgetProps {
  tripMembers?: TripMember[]
}

export default function WhatsNextWidget({ tripMembers = [] }: WhatsNextWidgetProps) {
  const { days, assignments } = useTripStore()
  const { t, locale } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'

  const upcoming = useMemo(() => {
    const now = new Date()
    const nowDate = localToday(now)
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const items = []

    for (const day of (days || [])) {
      if (!day.date) continue
      const dayAssignments = assignments[String(day.id)] || []
      for (const a of dayAssignments) {
        if (!a.place) continue
        // Include: today (future times) + all future days
        const isFutureDay = day.date > nowDate
        const isTodayFuture = day.date === nowDate && (!a.place.place_time || a.place.place_time >= nowTime)
        if (isFutureDay || isTodayFuture) {
          items.push({
            id: a.id,
            name: a.place.name,
            time: a.place.place_time,
            endTime: a.place.end_time,
            date: day.date,
            dayTitle: day.title,
            category: a.place.category,
            participants: (a.participants && a.participants.length > 0)
              ? a.participants
              : tripMembers.map(m => ({ user_id: m.id, username: m.username, avatar: m.avatar })),
            address: a.place.address,
          })
        }
      }
    }

    items.sort((a, b) => {
      const da = a.date + (a.time || '99:99')
      const db = b.date + (b.time || '99:99')
      return da.localeCompare(db)
    })

    return items.slice(0, 8)
  }, [days, assignments, tripMembers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <CollabPanelHead icon={Sparkles} title={t('collab.whatsNext.title') || "What's Next"} count={upcoming.length} />

      {/* List: one card per stop, grouped under its day like the planner's days */}
      <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {upcoming.length === 0 ? (
          <EmptyState scene="guide" title={t('collab.whatsNext.empty')} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {upcoming.map((item, idx) => {
              const prevItem = upcoming[idx - 1]
              const showDayHeader = !prevItem || prevItem.date !== item.date

              return (
                <React.Fragment key={item.id}>
                  {showDayHeader && (
                    <div className={`flex min-w-0 items-center gap-2 px-1 pb-0.5 ${idx === 0 ? '' : 'pt-2.5'}`}>
                      <span className="flex-none font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
                        {formatDayLabel(item.date, t, locale)}
                      </span>
                      {item.dayTitle && <span className="truncate font-semibold text-content-muted" style={fs(11)}>{item.dayTitle}</span>}
                    </div>
                  )}

                  <div className="flex gap-3 rounded-[14px] border border-edge-faint bg-surface-card px-3 py-2.5 transition-shadow hover:shadow-md">
                    {/* Time column */}
                    <div className="flex min-w-[44px] flex-none flex-col items-center justify-center font-geist tabular-nums">
                      <span className="whitespace-nowrap font-bold leading-none text-content" style={fs(12, 'body')}>
                        {item.time ? formatTime(item.time, is12h) : 'TBD'}
                      </span>
                      {item.endTime && (
                        <>
                          <span className="my-[3px] font-bold uppercase tracking-[.06em] text-content-faint" style={fs(7.5)}>
                            {t('collab.whatsNext.until') || 'bis'}
                          </span>
                          <span className="whitespace-nowrap font-bold leading-none text-content" style={fs(12, 'body')}>
                            {formatTime(item.endTime, is12h)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="my-0.5 w-px flex-none self-stretch bg-edge-faint" />

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold leading-snug text-content" style={fs(13, 'body')}>
                        {item.name}
                      </div>
                      {item.address && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <MapPin size={10} className="flex-none text-content-faint" />
                          <span className="truncate text-content-faint" style={fs(10.5)}>{item.address}</span>
                        </div>
                      )}

                      {/* Participants */}
                      {item.participants.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.participants.map(p => (
                            <span key={p.user_id} className="flex items-center gap-1 rounded-full border border-edge-faint bg-surface-secondary py-[2px] pl-[2px] pr-2">
                              <span className="grid h-4 w-4 flex-none place-items-center overflow-hidden rounded-full bg-surface-tertiary font-bold text-content-muted" style={fs(7)}>
                                {p.avatar
                                  ? <img src={avatarSrc(p.avatar)!} alt="" className="h-full w-full object-cover" />
                                  : p.username?.[0]?.toUpperCase()
                                }
                              </span>
                              <span className="font-semibold text-content-muted" style={fs(10.5)}>{p.username}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
