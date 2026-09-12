import { ArrowRight, Moon, Sunrise } from 'lucide-react'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { ScheduleEntry } from './roadtripModel'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime } from '../../utils/formatters'
import Tooltip from '../shared/Tooltip'
import { FS } from './typeScale'

export default function AutomaticDayStop({ stop, entry, onFocus }: {
  stop: RoadtripStop
  entry?: ScheduleEntry
  onFocus?: (lat: number, lng: number) => void
}) {
  const { t } = useTranslation()
  const is12h = useSettingsStore(s => s.settings.time_format === '12h')
  const ending = stop.automaticNight?.phase === 'end'
  const Icon = ending ? Moon : Sunrise
  const Row = onFocus ? 'button' : 'div'
  return (
    <Tooltip label={t('roadtrip.window.pointHint')} placement="top">
      <Row
        type={onFocus ? 'button' : undefined}
        onClick={onFocus ? () => onFocus(stop.lat, stop.lng) : undefined}
        className={`my-1 flex min-h-8 w-full items-center gap-2 rounded-md bg-surface-secondary px-2 py-1 text-start text-caption text-content-muted ${onFocus ? 'cursor-pointer transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent' : ''}`}
      >
        <Icon size={13} className="shrink-0 text-content-faint" aria-hidden />
        <span className="min-w-0 flex-1 font-medium">{t(ending ? 'roadtrip.window.stop' : 'roadtrip.window.resume')}</span>{' '}
        <span className="shrink-0 whitespace-nowrap font-medium leading-6 tabular-nums" style={{ fontSize: FS.time }}>{entry?.arrival ? formatClockTime(entry.arrival, is12h) : ''}</span>
        {entry?.departure && entry.departure !== entry.arrival ? (
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-medium leading-6 tabular-nums" style={{ fontSize: FS.time }} aria-label={t('roadtrip.window.departure', { time: formatClockTime(entry.departure, is12h) })}>
            <ArrowRight size={10} aria-hidden />
            <span>{formatClockTime(entry.departure, is12h)}</span>
          </span>
        ) : null}
      </Row>
    </Tooltip>
  )
}
