import { Pencil } from 'lucide-react'
import EndDayControl, { type EndDayControlProps } from './EndDayControl'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'
import { DialogSection, fs } from '../shared/DialogShell'

export interface RoadtripStayControl {
  minutes: number | null
  /** The time the visit is set to be left at, which is what makes its stay. */
  until?: string | null
  onEdit?: () => void
}

/** The white field box the inspector's other sections (rating, hours, files) use. */
const VISIT_BOX = 'flex min-h-[38px] min-w-0 items-center justify-between gap-2 rounded-[10px] border border-edge-faint bg-surface-card px-3 py-2'

/**
 * A stop's road trip controls in the place inspector: how long it takes and whether the
 * day ends here, each under its eyebrow in the field box the sections around it use.
 */
export default function VisitControls({ endDay, stay }: { endDay?: EndDayControlProps; stay?: RoadtripStayControl }) {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const until = stay?.until ? t('roadtrip.stay.until', { time: formatClockTime(stay.until, is12h) }) : null
  return (
    <div className={`grid items-start gap-3 ${endDay && stay ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {stay && (
        <DialogSection label={t('roadtrip.stop.stayShort')}>
          <button type="button" onClick={stay.onEdit} disabled={!stay.onEdit}
            className={`${VISIT_BOX} w-full text-start transition-colors enabled:hover:bg-surface-hover disabled:cursor-default`}>
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-content" style={fs(12.5, 'body')}>
              {stay.minutes === null ? (until ? null : '+') : formatDurationShort(stay.minutes * 60)}
              {until ? <span className="truncate text-content-faint">{until}</span> : null}
            </span>
            {stay.onEdit && <Pencil size={12} className="shrink-0 text-content-faint" aria-hidden />}
          </button>
        </DialogSection>
      )}
      {endDay && (
        <DialogSection label={t('roadtrip.window.title')}>
          <EndDayControl {...endDay} />
        </DialogSection>
      )}
    </div>
  )
}
