import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { formatLocationName } from '../../utils/formatters'
import { useTranslation } from '../../i18n'
import JourneyMap from './JourneyMapAuto'
import type { JourneyMapAutoHandle as JourneyMapHandle } from './JourneyMapAuto'
import type { JourneyEntry } from '../../store/journeyStore'
import { formatDate } from '../../pages/journeyDetail/JourneyDetailPage.helpers'

export function MapView({ entries, mapEntries, sortedDates, activeLocationId, fullMapRef, onLocationClick }: {
  entries: JourneyEntry[]
  mapEntries: JourneyEntry[]
  sortedDates: string[]
  activeLocationId: string | null
  fullMapRef: React.RefObject<JourneyMapHandle | null>
  onLocationClick: (id: string) => void
}) {
  const { t, locale } = useTranslation()
  // group map entries by date
  const byDate = new Map<string, { entry: JourneyEntry; globalIdx: number }[]>()
  mapEntries.forEach((e, i) => {
    const d = e.entry_date
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push({ entry: e, globalIdx: i })
  })
  const dates = [...byDate.keys()].sort()

  // find first and last entry indices
  const firstId = mapEntries[0]?.id
  const lastId = mapEntries[mapEntries.length - 1]?.id

  const mapItems = useMemo(() => mapEntries.map(e => ({
    id: String(e.id),
    lat: e.location_lat!,
    lng: e.location_lng!,
    title: e.title || '',
    mood: e.mood,
    entry_date: e.entry_date,
  })), [mapEntries])

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <JourneyMap
        ref={fullMapRef}
        checkins={[]}
        entries={mapItems as any}
        height={560}
        activeMarkerId={activeLocationId}
        onMarkerClick={onLocationClick}
      />

      {/* Locations list */}
      <div>
        {/* Stats header */}
        {mapEntries.length > 0 && (
          <div className="mx-5 mt-4 mb-2 grid grid-cols-3 gap-2">
            {[
              { value: mapEntries.length, label: t('journey.stats.places') },
              { value: dates.length, label: t('journey.stats.days') },
              { value: entries.filter(e => e.type === 'entry').length, label: 'Stories' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[17px] font-bold text-zinc-900 dark:text-white tracking-tight">{s.value}</div>
                <div className="text-[9px] font-medium text-zinc-500 uppercase tracking-[0.06em]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Day groups */}
        <div className="px-5 pb-5">
          {dates.map((date, dayIdx) => {
            const items = byDate.get(date)!
            const fd = formatDate(date, locale)

            return (
              <div key={date}>
                {/* Day separator */}
                <div className="flex items-center gap-2.5 py-3">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.12em] uppercase">{t('journey.detail.day', { number: dayIdx + 1 })}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">{fd.month} {fd.day}</span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                </div>

                {/* Location items */}
                {items.map(({ entry: e, globalIdx }, itemIdx) => {
                  const isActive = activeLocationId === String(e.id)
                  const isFirst = e.id === firstId
                  const isLast = e.id === lastId
                  const showConnector = itemIdx < items.length - 1

                  return (
                    <div key={e.id}>
                      <div
                        onClick={() => onLocationClick(String(e.id))}
                        className={`flex items-center gap-3 p-3 rounded-[14px] cursor-pointer transition-all ${
                          isActive
                            ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-100 translate-x-0.5'
                            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:translate-x-0.5'
                        }`}
                      >
                        {/* Number badge */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 border-2 border-white dark:border-zinc-900 ${
                          isActive
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_0_0_2px_rgba(0,0,0,0.15)]'
                            : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]'
                        }`}>
                          {globalIdx + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[14px] font-semibold text-zinc-900 dark:text-white truncate">{e.title || e.location_name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {formatLocationName(e.location_name)}{e.entry_time ? ` · ${e.entry_time}` : ''}
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight size={14} className={`flex-shrink-0 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`} />
                      </div>

                      {/* Connector line */}
                      {showConnector && (
                        <div className="w-0.5 h-2 bg-zinc-200 dark:bg-zinc-700 ml-[18px] rounded-full" />
                      )}
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
