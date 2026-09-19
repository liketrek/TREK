import { Clock, Pencil } from 'lucide-react'
import EndDayControl, { type EndDayControlProps } from './EndDayControl'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'

export interface RoadtripStayControl {
  minutes: number | null
  /** The time the visit is set to be left at, which is what makes its stay. */
  until?: string | null
  onEdit?: () => void
}

export default function VisitControls({ endDay, stay }: { endDay?: EndDayControlProps; stay?: RoadtripStayControl }) {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const until = stay?.until ? t('roadtrip.stay.until', { time: formatClockTime(stay.until, is12h) }) : null
  return (
    <div className={`grid gap-2 ${endDay && stay ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {endDay && <EndDayControl {...endDay} />}
      {stay && <button type="button" onClick={stay.onEdit} disabled={!stay.onEdit}
        className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] bg-surface-hover px-3 py-2 text-start enabled:hover:bg-surface-tertiary disabled:cursor-default">
        <span className="flex items-center gap-1.5 text-[length:calc(12px*var(--fs-scale-body,1))] font-medium uppercase text-content-secondary"><Clock size={13} className="shrink-0 text-content-faint" aria-hidden />{t('roadtrip.stop.stayShort')}</span>
        {' '}<span className="flex min-w-0 items-center gap-1.5 text-[length:calc(12px*var(--fs-scale-body,1))] font-medium text-content-secondary">
          {stay.minutes === null ? (until ? null : '+') : formatDurationShort(stay.minutes * 60)}
          {until ? <>{' '}<span className="truncate text-content-faint">{until}</span></> : null}
          {stay.onEdit && <Pencil size={12} className="shrink-0 text-content-faint" aria-hidden />}
        </span>
      </button>}
    </div>
  )
}
