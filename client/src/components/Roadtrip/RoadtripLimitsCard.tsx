import React, { useState } from 'react'
import { Clock, Fuel, CalendarClock, SlidersHorizontal, ChevronRight } from 'lucide-react'
import Modal from '../shared/Modal'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { convertDistance, formatDistance } from '../../utils/units'
import { formatDurationShort } from './roadtripModel'
import type { DistanceUnit } from '../../types'
import { FS } from './typeScale'

/**
 * The three numbers that decide when the rail speaks up about the driving.
 *
 * Behind a button rather than laid out in the column, because this is set once and then
 * read never: a permanent card costs three rows of a narrow sidebar for something most
 * travellers touch on the first day of planning and leave alone after. The button carries
 * the current answer, so what is set stays visible without the form being.
 *
 * All three are personal rather than instance configuration: how long somebody is willing
 * to sit behind a wheel, and how far their car goes on a tank, belong to the traveller.
 * They are plain per-user settings, which is why this needs no migration.
 *
 * Nothing here suggests a stop, adds one, or knows anything about a vehicle. OSM has no
 * idea what car this is, and neither has TREK, so the range is a number the traveller
 * types. Furkot does exactly the same, for the same reason.
 */

/** Empty means no limit, and so does zero — both are stored as 0 and read as off. */
function parseLimit(raw: string): number {
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

function LimitRow({ icon: Icon, label, suffix, value, placeholder, onChange }: {
  icon: typeof Clock
  label: string
  suffix: string
  value: number | undefined
  placeholder: string
  onChange: (next: number) => void
}): React.ReactElement {
  return (
    <label className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-content-faint" aria-hidden />
      <span className="min-w-0 flex-1 text-body text-content-secondary">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value || ''}
        placeholder={placeholder}
        onChange={e => onChange(parseLimit(e.target.value))}
        className="w-20 rounded-lg border border-edge bg-surface px-2 py-1 text-end text-body tabular-nums text-content focus:border-accent focus:outline-none"
      />
      <span className="w-7 text-caption text-content-faint">{suffix}</span>
    </label>
  )
}

export default function RoadtripLimitsCard({ onSave }: {
  /** Persists one setting. Absent leaves the dialog read-only. */
  onSave?: (key: string, value: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const settings = useSettingsStore(s => s.settings)
  const [open, setOpen] = useState(false)
  const distanceUnit: DistanceUnit = settings.distance_unit === 'imperial' ? 'imperial' : 'metric'

  const legMinutes = settings.roadtrip_leg_minutes
  const dayMinutes = settings.roadtrip_day_minutes
  const rangeKm = settings.roadtrip_range_km

  // Kilometres in storage, the traveller's own unit on screen. Without the round trip an
  // imperial user types 400 meaning miles, 400 km gets stored, and the warnings arrive a
  // third too early for ever after.
  const rangeShown = rangeKm ? Math.round(convertDistance(rangeKm, distanceUnit)) : undefined
  const setRange = (shown: number) => {
    const km = distanceUnit === 'imperial' ? shown / 0.621371 : shown
    onSave?.('roadtrip_range_km', Math.round(km))
  }

  // What is set, on the button itself, so the form does not have to be open to see it.
  // Nothing set reads as "off" rather than as an empty string, which would look broken.
  const summary = [
    legMinutes ? formatDurationShort(legMinutes * 60) : null,
    dayMinutes ? formatDurationShort(dayMinutes * 60) : null,
    rangeKm ? formatDistance(rangeKm, distanceUnit) : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      {/* Full width and card-sized, the same weight as the search controls above it: this
          is one of three things this column does, not a footnote under the other two.
          The current answer rides on the button, so what is set stays visible without the
          form being open. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-edge-faint bg-surface-card px-3.5 py-3 text-start transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-content-secondary">
          <SlidersHorizontal size={16} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-body font-semibold text-content">
            {t('roadtrip.limit.title')}
          </span>
          <span className={`truncate tabular-nums ${summary ? 'text-content-secondary' : 'text-content-faint'}`} style={{ fontSize: FS.label }}>
            {summary || t('roadtrip.limit.none')}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-content-faint" aria-hidden />
      </button>

      {open ? (
        <Modal isOpen onClose={() => setOpen(false)} size="sm" title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-content-faint" aria-hidden />
            {t('roadtrip.limit.title')}
          </span>
        }>
          <div className="flex flex-col gap-4">
            <LimitRow
              icon={Clock}
              label={t('roadtrip.limit.legLabel')}
              suffix={t('roadtrip.limit.minutes')}
              value={legMinutes}
              placeholder={t('roadtrip.limit.off')}
              onChange={v => onSave?.('roadtrip_leg_minutes', v)}
            />
            <LimitRow
              icon={CalendarClock}
              label={t('roadtrip.limit.dayLabel')}
              suffix={t('roadtrip.limit.minutes')}
              value={dayMinutes}
              placeholder={t('roadtrip.limit.off')}
              onChange={v => onSave?.('roadtrip_day_minutes', v)}
            />
            <LimitRow
              icon={Fuel}
              label={t('roadtrip.limit.rangeLabel')}
              suffix={distanceUnit === 'imperial' ? 'mi' : 'km'}
              value={rangeShown}
              placeholder={t('roadtrip.limit.off')}
              onChange={setRange}
            />
            {/* Said out loud rather than left to be discovered: the day figure this is
                measured against is driving time only. It does not include how long anyone
                stands still, and it does not include the leg to the hotel, because the
                rail does not model one. A limit called "travel time per day" over that
                number would be a lie that looks tidy. */}
            <p className="text-caption text-content-faint">{t('roadtrip.limit.hint')}</p>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
