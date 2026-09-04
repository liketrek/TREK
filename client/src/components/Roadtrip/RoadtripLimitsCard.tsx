import React from 'react'
import { Clock, Fuel, CalendarClock } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { convertDistance } from '../../utils/units'
import type { DistanceUnit } from '../../types'
import { FS } from './typeScale'

/**
 * The three numbers that decide when the rail speaks up about the driving.
 *
 * All three are personal rather than instance configuration: how long somebody is willing
 * to sit behind a wheel, and how far their car goes on a tank, belong to the traveller.
 * They are stored as plain per-user settings, which is why this needs no migration.
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
    <label className="flex items-center gap-2.5">
      <Icon size={14} className="shrink-0 text-content-faint" aria-hidden />
      <span className="min-w-0 flex-1 text-content-secondary" style={{ fontSize: FS.label }}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value || ''}
        placeholder={placeholder}
        onChange={e => onChange(parseLimit(e.target.value))}
        className="w-16 rounded-md border border-edge bg-surface px-1.5 py-0.5 text-end tabular-nums text-content focus:border-accent focus:outline-none"
        style={{ fontSize: FS.label }}
      />
      <span className="w-6 text-content-faint" style={{ fontSize: FS.label }}>{suffix}</span>
    </label>
  )
}

export default function RoadtripLimitsCard({ onSave }: {
  /** Persists one setting. Absent leaves the card read-only. */
  onSave?: (key: string, value: number) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const settings = useSettingsStore(s => s.settings)
  const distanceUnit: DistanceUnit = settings.distance_unit === 'imperial' ? 'imperial' : 'metric'

  // Kilometres in storage, the traveller's own unit on screen. Without the round trip an
  // imperial user types 400 meaning miles, 400 km gets stored, and the warnings arrive a
  // third too early for ever after.
  const rangeShown = settings.roadtrip_range_km
    ? Math.round(convertDistance(settings.roadtrip_range_km, distanceUnit))
    : undefined
  const setRange = (shown: number) => {
    const km = distanceUnit === 'imperial' ? shown / 0.621371 : shown
    onSave?.('roadtrip_range_km', Math.round(km))
  }

  return (
    <section className="rounded-xl border border-edge-faint bg-surface-card p-3.5">
      <h3 className="mb-2.5 font-geist font-semibold uppercase tracking-[0.15em] text-content-faint" style={{ fontSize: FS.label }}>
        {t('roadtrip.limit.title')}
      </h3>
      <div className="flex flex-col gap-2">
        <LimitRow
          icon={Clock}
          label={t('roadtrip.limit.legLabel')}
          suffix={t('roadtrip.limit.minutes')}
          value={settings.roadtrip_leg_minutes}
          placeholder={t('roadtrip.limit.off')}
          onChange={v => onSave?.('roadtrip_leg_minutes', v)}
        />
        <LimitRow
          icon={CalendarClock}
          label={t('roadtrip.limit.dayLabel')}
          suffix={t('roadtrip.limit.minutes')}
          value={settings.roadtrip_day_minutes}
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
      </div>
      {/* Said out loud rather than left to be discovered: the day figure this is measured
          against is driving time only. It does not include how long anyone stands still,
          and it does not include the leg to the hotel, because the rail does not model
          one. A limit called "travel time per day" over that number would be a lie that
          looks tidy. */}
      <p className="mt-2.5 text-content-faint" style={{ fontSize: FS.label }}>
        {t('roadtrip.limit.hint')}
      </p>
    </section>
  )
}
