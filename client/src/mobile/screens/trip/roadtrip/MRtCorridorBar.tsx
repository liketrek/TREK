import { AlertTriangle, Loader2, Search, WifiOff, X } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'
import { formatDistance } from '../../../../utils/units'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { MRtCorridorController } from './useMRtCorridor'
import type { TripPlanner } from '../MTripShell'

export interface MRtCorridorBarProps {
  planner: TripPlanner
  corridor: MRtCorridorController
  /** Opens the sheet where the question is asked and the answer is read. */
  onOpen: () => void
}

/**
 * The one control that puts "what is on the way" on a phone screen.
 *
 * It sits in the same band as the plan tab's POI bar, on both halves of the road trip
 * tab, and it never moves: the list and the map are two views of one stage, and a
 * control that jumps when you switch between them is a control you have to find twice.
 *
 * It is a status line as much as a button. A corridor search is several requests over a
 * mobile connection and can take the better part of half a minute, so the state it is in
 * has to be readable without opening anything: running, answered, or nothing asked yet.
 * The answer's own pins are on the map underneath either way.
 */
export default function MRtCorridorBar({ planner, corridor, onOpen }: MRtCorridorBarProps) {
  const { t } = planner
  const unit = useSettingsStore(s => s.settings.distance_unit)

  const reachLabel = corridor.reach === 'stage'
    ? t('roadtrip.poi.wholeDay')
    : t('mobileTrip.rtReachAhead', { distance: formatDistance(corridor.reachKm, unit) })

  let icon = <Search size={16} strokeWidth={2.1} aria-hidden="true" />
  let title = t('roadtrip.poi.title')
  let meta: string | null = reachLabel

  if (corridor.offline) {
    icon = <WifiOff size={16} strokeWidth={2.1} aria-hidden="true" />
    title = t('mobileTrip.rtSearchOffline')
    meta = null
  } else if (corridor.error) {
    // Never "0 on the way" after a search that failed: nothing was checked, and a count
    // of nothing reads as a stretch of road with no petrol station on it.
    icon = <AlertTriangle size={16} strokeWidth={2.1} aria-hidden="true" />
    title = t('roadtrip.poi.failed')
    meta = null
  } else if (corridor.loading) {
    icon = <Loader2 size={16} strokeWidth={2.1} className="animate-spin" aria-hidden="true" />
    title = t('roadtrip.poi.searching', { done: corridor.progress.done, total: corridor.progress.total })
    meta = null
  } else if (corridor.answered) {
    title = t('roadtrip.poi.found', { count: corridor.hits.length })
  }

  // The trailing round button is a sibling rather than nested: a button inside a button
  // is markup no browser and no screen reader agrees on. While a search runs it aborts
  // it; once one has answered it throws the answer away, pins and all.
  const trailing = corridor.loading || corridor.answered

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-3.5 text-left shadow-[0_16px_44px_-16px_rgba(0,0,0,.35)] backdrop-blur-[24px] backdrop-saturate-[1.7]"
      >
        <span className="flex-none text-m-ink">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{title}</span>
        {meta && (
          <span className="flex-none whitespace-nowrap font-geist text-[0.6875rem] font-semibold tabular-nums text-m-muted">
            {meta}
          </span>
        )}
      </button>
      {trailing && (
        <MIconBtn
          size={44}
          onClick={corridor.clear}
          ariaLabel={t(corridor.loading ? 'common.cancel' : 'roadtrip.poi.clearResults')}
        >
          <X size={16} strokeWidth={2.2} />
        </MIconBtn>
      )}
    </div>
  )
}
