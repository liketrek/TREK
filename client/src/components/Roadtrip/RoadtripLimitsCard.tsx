import React, { useState } from 'react'
import { Clock, Fuel, CalendarClock, SlidersHorizontal, ChevronRight, Coins, Signpost, Ship, Car, Zap } from 'lucide-react'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { convertDistance, formatDistance } from '../../utils/units'
import { formatDurationShort, parseAvoid, serializeAvoid, AVOIDABLE } from './roadtripModel'
import { valhallaAvailable } from '../Map/valhallaRoute'
import ToggleSwitch from '../Settings/ToggleSwitch'
import type { DistanceUnit, RouteAvoidClass } from '../../types'
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
  // Typed here, saved on blur or Enter. Writing on every keystroke sent one
  // settings PUT per character — typing "180" produced three, carrying 1, 18 and
  // 180, unordered and concurrent over HTTP/2. Whichever the server committed
  // last won, so the limit that decides every over-budget warning could quietly
  // end up a tenth of what was typed, and only show it after the next reload.
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value ? String(value) : '')
  const commit = () => {
    if (draft === null) return
    const next = parseLimit(draft)
    setDraft(null)
    if (next !== (value ?? 0)) onChange(next)
  }

  return (
    <label className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-content-faint" aria-hidden />
      <span className="min-w-0 flex-1 text-body text-content-secondary">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={shown}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        // Committed here rather than by blurring and letting onBlur do it: a
        // second commit is a no-op anyway, and going through blur made Enter
        // depend on focus handling instead of on the key.
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur() } }}
        className="w-20 rounded-lg border border-edge bg-surface px-2 py-1 text-end text-body tabular-nums text-content focus:border-accent focus:outline-none"
      />
      <span className="w-7 text-caption text-content-faint">{suffix}</span>
    </label>
  )
}

/**
 * One class the drive should leave out, with the switch that asks for it.
 *
 * Disabled rather than hidden when there is no engine that can answer: an operator who
 * pointed the instance at their own OSRM has no second engine, and a switch that flips
 * and changes nothing is worse than one that says why it cannot.
 */
function AvoidRow({ icon: Icon, label, on, disabled, onToggle }: {
  icon: typeof Coins
  label: string
  on: boolean
  disabled: boolean
  onToggle: () => void
}): React.ReactElement {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <Icon size={16} className="shrink-0 text-content-faint" aria-hidden />
      <span className="min-w-0 flex-1 text-body text-content-secondary">{label}</span>
      {disabled
        ? <span className="text-caption text-content-faint">{'—'}</span>
        : <ToggleSwitch on={on} onToggle={onToggle} label={label} />}
    </div>
  )
}

/** Not said, petrol, electric. "Not said" first, because it is what everybody starts on. */
const VEHICLES: { key: 'combustion' | 'electric' | null; labelKey: string; Icon: typeof Car }[] = [
  { key: null, labelKey: 'roadtrip.limit.vehicleAny', Icon: Car },
  { key: 'combustion', labelKey: 'roadtrip.limit.vehicleCombustion', Icon: Fuel },
  { key: 'electric', labelKey: 'roadtrip.limit.vehicleElectric', Icon: Zap },
]

export default function RoadtripLimitsCard({ onSave }: {
  /**
   * Persists one setting. Absent leaves the dialog read-only.
   *
   * A string as well as a number since the avoidance is stored as a comma list: one
   * decision with three parts, which goes to the router as one request either way.
   */
  onSave?: (key: string, value: number | string) => void
}): React.ReactElement {
  const { t } = useTranslation()
  const settings = useSettingsStore(s => s.settings)
  const [open, setOpen] = useState(false)
  const distanceUnit: DistanceUnit = settings.distance_unit === 'imperial' ? 'imperial' : 'metric'

  const legMinutes = settings.roadtrip_leg_minutes
  const dayMinutes = settings.roadtrip_day_minutes
  const rangeKm = settings.roadtrip_range_km

  // Parsed rather than trusted: a per-user setting gets no server-side validation, and
  // an unknown word here would become a costing option the router does not have.
  const vehicle = settings.roadtrip_vehicle ?? ''
  const avoiding = parseAvoid(settings.roadtrip_avoid)
  // No second engine, no avoidance. An instance pointed at its own OSRM has one, and its
  // car profile is built without excludable classes on every public host.
  const canAvoid = valhallaAvailable()
  const toggleAvoid = (cls: RouteAvoidClass) => {
    const next = avoiding.includes(cls) ? avoiding.filter(c => c !== cls) : [...avoiding, cls]
    onSave?.('roadtrip_avoid', serializeAvoid(next))
  }

  const AVOID_ROWS: { cls: RouteAvoidClass; icon: typeof Coins; label: string }[] = [
    { cls: 'toll', icon: Coins, label: t('roadtrip.avoid.toll') },
    { cls: 'motorway', icon: Signpost, label: t('roadtrip.avoid.motorway') },
    { cls: 'ferry', icon: Ship, label: t('roadtrip.avoid.ferry') },
  ]

  // Kilometres in storage, the traveller's own unit on screen. Without the round trip an
  // imperial user types 400 meaning miles, 400 km gets stored, and the warnings arrive a
  // third too early for ever after.
  const rangeShown = rangeKm ? Math.round(convertDistance(rangeKm, distanceUnit)) : undefined
  const setRange = (shown: number) => {
    const km = distanceUnit === 'imperial' ? shown / 0.621371 : shown
    onSave?.('roadtrip_range_km', Math.round(km))
  }

  // What is set, on the button itself, so the form does not have to be open to read it.
  // Each one keeps its own icon, because three numbers in a row say nothing about which
  // is which: a clock, a calendar and a pump do. Distances go through formatDistance, so
  // an imperial traveller reads miles here and types miles in the dialog, while what is
  // stored stays kilometres either way.
  const badges = [
    legMinutes ? { key: 'leg', Icon: Clock, text: formatDurationShort(legMinutes * 60) } : null,
    dayMinutes ? { key: 'day', Icon: CalendarClock, text: formatDurationShort(dayMinutes * 60) } : null,
    rangeKm ? { key: 'range', Icon: Fuel, text: formatDistance(rangeKm, distanceUnit) } : null,
    // The avoidance rides here too, and as ONE badge rather than three: it is a single
    // decision, the three icons already say which parts of it are on, and a fourth,
    // fifth and sixth badge would wrap the row onto a second line in a narrow rail.
    avoiding.length && canAvoid
      ? { key: 'avoid', Icon: AVOID_ROWS.find(r => r.cls === avoiding[0])!.icon, text: t('roadtrip.avoid.badge', { count: avoiding.length }) }
      : null,
  ].filter(Boolean) as { key: string; Icon: typeof Clock; text: string }[]

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
        {/* No icon tile on the trigger: the three badges below already carry a clock, a
            calendar and a pump, and a fourth mark in front of the title only ate the width
            they need to sit on one line. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-body font-semibold text-content">
            {t('roadtrip.limit.title')}
          </span>
          {badges.length ? (
            <span className="flex flex-wrap items-center gap-1">
              {badges.map(({ key, Icon, text }) => (
                <span
                  key={key}
                  className="inline-flex h-[16px] items-stretch overflow-hidden rounded border border-edge"
                >
                  <span className="flex items-center bg-surface-tertiary px-1 text-content-faint">
                    <Icon size={9} aria-hidden />
                  </span>
                  <span
                    className="flex items-center border-s border-edge bg-surface-card px-1.5 font-semibold tabular-nums text-content-secondary"
                    style={{ fontSize: FS.label }}
                  >
                    {text}
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="truncate text-content-faint" style={{ fontSize: FS.label }}>
              {t('roadtrip.limit.none')}
            </span>
          )}
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
            {/* Above the range, because it decides what the range even means: with no
                vehicle named, a petrol station and a charger both fill the tank, which
                is arithmetic that is wrong for everybody who drives just one of them. */}
            <label className="flex items-center gap-3">
              <Car size={16} className="shrink-0 text-content-faint" aria-hidden />
              <span className="min-w-0 flex-1 text-body text-content-secondary">{t('roadtrip.limit.vehicleLabel')}</span>
              <span className="w-[132px] shrink-0">
                <CustomSelect
                  value={vehicle}
                  onChange={next => onSave?.('roadtrip_vehicle', String(next))}
                  size="sm"
                  options={VEHICLES.map(({ key, labelKey, Icon }) => ({
                    value: key ?? '',
                    label: t(labelKey),
                    icon: <Icon size={14} aria-hidden />,
                  }))}
                />
              </span>
            </label>
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

            {/* A heading and a rule, because six rows in one list stop reading as a form
                and start reading as a wall. The three above are numbers that warn; the
                three below change the road itself, which is a different kind of setting
                and worth the separation. */}
            <div className="mt-1 border-t border-edge-faint pt-4">
              <p className="mb-3 text-caption font-semibold uppercase tracking-wide text-content-faint">
                {t('roadtrip.avoid.section')}
              </p>
              <div className="flex flex-col gap-3">
                {AVOID_ROWS.map(({ cls, icon, label }) => (
                  <AvoidRow
                    key={cls}
                    icon={icon}
                    label={label}
                    on={avoiding.includes(cls)}
                    disabled={!canAvoid}
                    onToggle={() => toggleAvoid(cls)}
                  />
                ))}
              </div>
              {/* "Where possible" is doing real work in the label, so it is spelled out
                  here: the router weights a class down rather than banning it, and on a
                  drive with no way round one the road still uses it. The day says so
                  itself when that happens, which is the only honest way to offer this. */}
              <p className="mt-3 text-caption text-content-faint">
                {canAvoid ? t('roadtrip.avoid.hint') : t('roadtrip.avoid.unavailable')}
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
