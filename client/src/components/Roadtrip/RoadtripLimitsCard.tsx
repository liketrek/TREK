import React, { useState } from 'react'
import {
  Clock, Fuel, CalendarClock, SlidersHorizontal, ChevronRight, Coins, Signpost, Ship,
  Car, Zap, BatteryCharging, BatteryFull, BatteryWarning, Gauge, Route, Sparkles,
} from 'lucide-react'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { convertDistance, formatDistance, getDistanceUnitLabel } from '../../utils/units'
import { formatDurationShort, parseAvoid, serializeAvoid, type VehicleKind } from './roadtripModel'
import { effectiveRangeKm, rangeFromSpec, showSpec, storeSpec, specUnit, type SpecKey, type VehicleSpec } from './vehicleRange'
import { valhallaAvailable } from '../Map/valhallaRoute'
import ToggleSwitch from '../Settings/ToggleSwitch'
import type { DistanceUnit, RouteAvoidClass } from '../../types'
import { FS } from './typeScale'

/**
 * Everything that decides when the rail speaks up about the driving.
 *
 * Behind a button rather than laid out in the column, because this is set once and then
 * read never: a permanent card costs rows of a narrow sidebar for something most
 * travellers touch on the first day of planning and leave alone after. The button carries
 * the current answers, so what is set stays visible without the form being.
 *
 * All of it is personal rather than instance configuration: how long somebody is willing
 * to sit behind a wheel, and what their car is, belong to the traveller. They are plain
 * per-user settings, which is why this needs no migration.
 *
 * The dialog has two halves because the settings are two kinds. The left is the trip: how
 * long a day may be and what the road may not be. The right is the car, and it is the
 * half that earns the width — a range can be typed as one number or worked out from what
 * the vehicle is made of, and the gauge shows the second turning into the first as it is
 * typed. Nothing here asks the router about a vehicle; OSM has no idea what car this is,
 * and neither has TREK.
 */

/** Empty means no limit, and so does zero — both are stored as 0 and read as off. */
function parseLimit(raw: string): number {
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * One number in the form, or one number the form worked out.
 *
 * `derived` turns the row read-only and states where the figure came from. The row keeps
 * its shape either way, because a range that switched between an input and a line of text
 * would move every row under it the moment a consumption was typed.
 */
function LimitRow({ icon: Icon, label, suffix, value, placeholder, step, derived, wide, onDraft, onChange }: {
  icon: typeof Clock
  label: string
  suffix: string
  value: number | undefined
  placeholder: string
  step?: number
  derived?: string
  /**
   * Room for a unit longer than a symbol, set per section rather than per row.
   *
   * "kWh/100 km" and "L/100 km" are units people actually quote, and a column sized for
   * "min" wrapped them onto a second line, which made one row of the vehicle section
   * taller than the rest. Sizing it from the string would have done the same thing
   * sideways: only the consumption row would widen, and the section's right edge would
   * come out ragged.
   */
  wide?: boolean
  /**
   * What is in the field right now, on every keystroke, saved or not.
   *
   * Separate from `onChange` because the two answer different questions. `onChange` is
   * "this is the new setting", which must stay rare — it is an HTTP write. This one is
   * "this is what the traveller is looking at", which the gauge needs on every keystroke
   * or it would sit still until the field is left and the promise it makes, that these
   * figures are the range, would only pay out after the fact.
   */
  onDraft?: (next: number) => void
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
      {derived ? (
        // A mark rather than a word: "computed" is eight characters in English and
        // fourteen in half the locales, and the column is as wide as the input it
        // replaces. The sentence lives in the title and in the screen-reader text.
        <span
          className={`flex items-center justify-end gap-1.5 ${wide ? 'w-16' : 'w-20'}`}
          title={derived}
          data-testid="limit-derived"
        >
          <Sparkles size={12} className="shrink-0 text-accent-on" aria-hidden />
          <span className="text-body font-semibold tabular-nums text-content">{value ?? 0}</span>
          <span className="sr-only">{derived}</span>
        </span>
      ) : (
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step ?? 1}
          value={shown}
          placeholder={placeholder}
          onChange={e => { setDraft(e.target.value); onDraft?.(parseLimit(e.target.value)) }}
          onBlur={commit}
          // Committed here rather than by blurring and letting onBlur do it: a
          // second commit is a no-op anyway, and going through blur made Enter
          // depend on focus handling instead of on the key.
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur() } }}
          className={`${wide ? 'w-16' : 'w-20'} rounded-lg border border-edge bg-surface px-2 py-1 text-end text-body tabular-nums text-content focus:border-accent focus:outline-none`}
        />
      )}
      <span className={`${wide ? 'w-[86px]' : 'w-7'} whitespace-nowrap text-caption text-content-faint`}>{suffix}</span>
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

/** The name of one half of the form. */
function SectionTitle({ icon: Icon, children }: {
  icon: typeof Clock
  children: React.ReactNode
}): React.ReactElement {
  return (
    <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-content-faint">
      <Icon size={13} aria-hidden />
      {children}
    </p>
  )
}

/**
 * The range, drawn as the thing it describes.
 *
 * The bar is the tank the day it left the factory, left to right, and it carries the two
 * figures a bare number cannot say on its own:
 *
 *  - The filled part is what a stop actually puts back in. Nobody charges to 100 % on the
 *    road, and a traveller who set 80 % is looking at four fifths of a bar, which is the
 *    honest picture of what the next leg has.
 *  - The hatched tail is what age has taken off an electric car's battery. It is already
 *    out of the number above, so without the tail that figure looks like an unexplained
 *    disagreement with the car's own data sheet.
 *
 * Widths animate because this sits directly under the fields that feed it: typing a
 * consumption and watching the bar move is what makes the two ways of stating a range
 * visibly the same thing.
 */
function RangeGauge({ rangeKm, fillPercent, wearPercent, unit, electric, t }: {
  rangeKm: number | null
  fillPercent: number | null
  wearPercent: number | null
  unit: DistanceUnit
  electric: boolean
  t: (key: string, params?: Record<string, string | number>) => string
}): React.ReactElement {
  // Capped where the arithmetic caps it, so the picture cannot claim a battery is gone.
  const wear = rangeKm ? Math.min(90, Math.max(0, wearPercent ?? 0)) : 0
  const fill = fillPercent && fillPercent > 0 && fillPercent < 100 ? fillPercent : 100
  const usable = 100 - wear
  const filled = rangeKm ? (usable * fill) / 100 : 0
  const rest = 100 - wear - filled
  // Split rather than formatted whole, so the unit can sit smaller beside the figure.
  // The rounding is formatDistance's own, because the badge on the trigger uses that and
  // the two must not disagree by a tenth.
  const shown = rangeKm ? Math.round(convertDistance(rangeKm, unit) * 10) / 10 : null
  const stripes = 'repeating-linear-gradient(135deg, var(--border-primary) 0 3px, transparent 3px 6px)'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-edge-faint bg-surface-tertiary px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-on">
          {electric ? <Zap size={18} aria-hidden /> : <Fuel size={18} aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline gap-1">
            <span className="font-semibold tabular-nums leading-none text-content" style={{ fontSize: FS.total }}>
              {shown ?? '—'}
            </span>
            {shown !== null ? (
              <span className="font-semibold leading-none text-content-muted" style={{ fontSize: FS.totalUnit }}>
                {getDistanceUnitLabel(unit)}
              </span>
            ) : null}
          </span>
          <span className="truncate text-caption text-content-muted">
            {shown === null
              ? t('roadtrip.limit.rangeEmpty')
              : t(electric ? 'roadtrip.limit.perCharge' : 'roadtrip.limit.perFill')}
          </span>
        </span>
      </div>

      {/* The quarter marks are painted over the whole bar rather than drawn into each
          segment, so they stay put while the segments under them move. They are the
          card's own colour, which makes them read as cut-outs: visible across the filled
          part, invisible over the empty track, where there is nothing to divide. */}
      <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-surface">
        <div className="flex h-full w-full">
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${filled}%`, background: 'linear-gradient(90deg, var(--accent-hover), var(--accent))' }}
          />
          <div className="h-full transition-[width] duration-500 ease-out" style={{ width: `${rest}%` }} />
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${wear}%`, backgroundImage: stripes }}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0, transparent calc(25% - 1px), var(--bg-tertiary) calc(25% - 1px), var(--bg-tertiary) 25%)',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-caption leading-snug text-content-faint">
        {shown === null ? (
          <span>{t('roadtrip.limit.rangeEmptyHint')}</span>
        ) : (
          <>
            <span>
              {fill < 100
                ? t('roadtrip.limit.afterFill', { percent: fill, distance: formatDistance((rangeKm! * fill) / 100, unit) })
                : t('roadtrip.limit.fullNote')}
            </span>
            {/* The swatch is what ties the sentence to the tail of the bar. Without it the
                hatching is an unexplained stripe and the sentence an unexplained loss. */}
            {wear > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3.5 shrink-0 rounded-sm" style={{ backgroundImage: stripes }} aria-hidden />
                {t('roadtrip.limit.wearNote', { percent: wear })}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

/** Not said, petrol, electric. "Not said" first, because it is what everybody starts on. */
const VEHICLES: { key: VehicleKind | null; labelKey: string; Icon: typeof Car }[] = [
  { key: null, labelKey: 'roadtrip.limit.vehicleAny', Icon: Car },
  { key: 'combustion', labelKey: 'roadtrip.limit.vehicleCombustion', Icon: Fuel },
  { key: 'electric', labelKey: 'roadtrip.limit.vehicleElectric', Icon: Zap },
]

/**
 * What each kind of car is made of, and where each figure is kept.
 *
 * Two rows for petrol and three for electric, because that is the difference that
 * matters: a tank does not lose capacity to the years and a battery does. Everything else
 * ABRP asks for — plug type, reference speed, relative speed, drive style — shapes a
 * consumption PREDICTION. This dialog does not predict one; it divides a capacity by a
 * consumption the traveller states, so those fields would add typing without moving a
 * single kilometre of the answer.
 */
const SPEC_ROWS: Record<VehicleKind, { key: SpecKey; setting: string; Icon: typeof Fuel; labelKey: string; step: number }[]> = {
  combustion: [
    { key: 'tankLitres', setting: 'roadtrip_tank_litres', Icon: Fuel, labelKey: 'roadtrip.limit.tankLabel', step: 1 },
    { key: 'litresPer100', setting: 'roadtrip_litres_per_100', Icon: Gauge, labelKey: 'roadtrip.limit.useLabel', step: 0.1 },
  ],
  electric: [
    { key: 'batteryKwh', setting: 'roadtrip_battery_kwh', Icon: BatteryFull, labelKey: 'roadtrip.limit.batteryLabel', step: 1 },
    { key: 'kwhPer100', setting: 'roadtrip_kwh_per_100', Icon: Gauge, labelKey: 'roadtrip.limit.useLabel', step: 0.1 },
    { key: 'degradationPercent', setting: 'roadtrip_battery_degradation', Icon: BatteryWarning, labelKey: 'roadtrip.limit.wearLabel', step: 1 },
  ],
}

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
  const imperial = distanceUnit === 'imperial'

  const legMinutes = settings.roadtrip_leg_minutes
  const dayMinutes = settings.roadtrip_day_minutes
  const rangeKm = settings.roadtrip_range_km

  // Parsed rather than trusted: a per-user setting gets no server-side validation, and
  // an unknown word here would become a costing option the router does not have.
  const vehicle = settings.roadtrip_vehicle ?? ''
  const vehicleKind: VehicleKind | null =
    vehicle === 'combustion' || vehicle === 'electric' ? vehicle : null
  const saved: VehicleSpec = {
    tankLitres: settings.roadtrip_tank_litres,
    litresPer100: settings.roadtrip_litres_per_100,
    batteryKwh: settings.roadtrip_battery_kwh,
    kwhPer100: settings.roadtrip_kwh_per_100,
    degradationPercent: settings.roadtrip_battery_degradation,
  }
  /**
   * The one field being typed in, ahead of the write that will save it.
   *
   * One slot rather than a copy of the form, because only one field can be typed in at a
   * time, and a second copy of the settings is exactly the hand-mirrored state this
   * codebase refuses everywhere else. It exists so the gauge answers while the traveller
   * is still typing: the figures below it are only convincingly "the range" if changing
   * one moves the bar, and a settings PUT per keystroke is not on offer.
   *
   * The value arrives in whatever unit the field is labelled with, so it goes back
   * through the same conversion the save would have used.
   */
  const [preview, setPreview] = useState<{ key: SpecKey | 'range' | 'fill'; value: number } | null>(null)
  const spec: VehicleSpec = preview && preview.key !== 'range' && preview.key !== 'fill'
    ? { ...saved, [preview.key]: storeSpec(preview.key, preview.value, imperial) }
    : saved
  const typedKm = preview?.key === 'range'
    ? (imperial ? preview.value / 0.621371 : preview.value)
    : rangeKm
  const shownFill = preview?.key === 'fill' ? preview.value : settings.roadtrip_fill_percent ?? null

  // What the parts say, and what the trip will actually plan with. The second is the
  // first when there is one, which is the rule effectiveRangeKm states once for
  // everybody who needs it.
  const computedKm = rangeFromSpec(vehicleKind, spec)
  const planningKm = effectiveRangeKm(vehicleKind, spec, typedKm)

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
  // third too early for ever after. The same rule runs through the vehicle's own figures,
  // where showSpec and storeSpec do it per field.
  const rangeShown = planningKm ? Math.round(convertDistance(planningKm, distanceUnit)) : undefined
  const setRange = (shown: number) => {
    const km = imperial ? shown / 0.621371 : shown
    onSave?.('roadtrip_range_km', Math.round(km))
  }

  // What is set, on the button itself, so the form does not have to be open to read it.
  // Each one keeps its own icon, because numbers in a row say nothing about which is
  // which: a clock, a calendar and a pump do. Distances go through formatDistance, so an
  // imperial traveller reads miles here and types miles in the dialog, while what is
  // stored stays kilometres either way.
  const badges = [
    legMinutes ? { key: 'leg', Icon: Clock, text: formatDurationShort(legMinutes * 60) } : null,
    dayMinutes ? { key: 'day', Icon: CalendarClock, text: formatDurationShort(dayMinutes * 60) } : null,
    // The planning range, not the typed one: when the vehicle's figures win, the badge
    // has to say what the warnings will actually use.
    planningKm ? { key: 'range', Icon: vehicleKind === 'electric' ? Zap : Fuel, text: formatDistance(planningKm, distanceUnit) } : null,
    // Only worth a badge when it is NOT a full tank, which is the case that changes the
    // arithmetic. "100 %" on the trigger would be a badge for the default.
    settings.roadtrip_fill_percent && settings.roadtrip_fill_percent < 100
      ? { key: 'fill', Icon: BatteryCharging, text: `${settings.roadtrip_fill_percent} %` }
      : null,
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
        {/* No icon tile on the trigger: the badges below already carry a clock, a
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
        <Modal isOpen onClose={() => { setOpen(false); setPreview(null) }} size="2xl" title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-content-faint" aria-hidden />
            {t('roadtrip.limit.title')}
          </span>
        }>
          {/* Two columns from the small breakpoint up. One narrow column stopped reading
              as a form and started reading as a wall, and the halves are different in
              kind anyway: the left is the trip, the right is the car. */}
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            <div className="flex flex-col gap-7">
              <section className="flex flex-col gap-4">
                <SectionTitle icon={Clock}>{t('roadtrip.limit.sectionDriving')}</SectionTitle>
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
                {/* Said out loud rather than left to be discovered: the day figure this is
                    measured against is driving time only. It does not include how long
                    anyone stands still, and it does not include the leg to the hotel,
                    because the rail does not model one. A limit called "travel time per
                    day" over that number would be a lie that looks tidy. */}
                <p className="text-caption leading-snug text-content-faint">{t('roadtrip.limit.hint')}</p>
              </section>

              <section className="flex flex-col gap-3">
                <SectionTitle icon={Signpost}>{t('roadtrip.avoid.section')}</SectionTitle>
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
                {/* "Where possible" is doing real work in the label, so it is spelled out
                    here: the router weights a class down rather than banning it, and on a
                    drive with no way round one the road still uses it. The day says so
                    itself when that happens, which is the only honest way to offer this. */}
                <p className="text-caption leading-snug text-content-faint">
                  {canAvoid ? t('roadtrip.avoid.hint') : t('roadtrip.avoid.unavailable')}
                </p>
              </section>
            </div>

            <section className="flex flex-col gap-4">
              <SectionTitle icon={Car}>{t('roadtrip.limit.sectionVehicle')}</SectionTitle>
              {/* First, because it decides what everything under it means: with no vehicle
                  named, a petrol station and a charger both fill the tank, which is
                  arithmetic that is wrong for everybody who drives just one of them. */}
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

              <RangeGauge
                rangeKm={planningKm}
                fillPercent={shownFill}
                wearPercent={vehicleKind === 'electric' ? spec.degradationPercent ?? null : null}
                unit={distanceUnit}
                electric={vehicleKind === 'electric'}
                t={t}
              />

              {/* The parts, when there is a kind of car to have parts of. Nothing here is
                  required: a traveller who knows their range types it below and never
                  looks at these. */}
              {vehicleKind ? SPEC_ROWS[vehicleKind].map(({ key, setting, Icon, labelKey, step }) => (
                <LimitRow
                  key={key}
                  icon={Icon}
                  label={t(labelKey)}
                  suffix={specUnit(key, imperial)}
                  step={step}
                  wide
                  value={showSpec(key, saved[key], imperial)}
                  placeholder={t('roadtrip.limit.off')}
                  onDraft={v => setPreview({ key, value: v })}
                  onChange={v => onSave?.(setting, storeSpec(key, v, imperial))}
                />
              )) : null}

              {/* Read-only once the parts add up, because then it IS the parts. Leaving it
                  editable would offer a second answer to a question that already has
                  one, and the traveller would have no way of telling which the warnings
                  were using. Clearing a field above hands the row straight back. */}
              <LimitRow
                icon={Route}
                // "on one tank" is the wrong noun for half the travellers who set this.
                label={t(vehicleKind === 'electric' ? 'roadtrip.limit.rangeLabelCharge' : 'roadtrip.limit.rangeLabel')}
                suffix={imperial ? 'mi' : 'km'}
                value={rangeShown}
                placeholder={t('roadtrip.limit.off')}
                derived={computedKm ? t('roadtrip.limit.computed') : undefined}
                wide
                onDraft={v => setPreview({ key: 'range', value: v })}
                onChange={setRange}
              />
              {/* Under the range, because it is a fraction OF it. Nobody charges to 100 %
                  on the road: the last fifth takes as long as the first four, so a stop
                  counted as a full tank overstates everything after it by that fifth. */}
              <LimitRow
                icon={BatteryCharging}
                label={t('roadtrip.limit.fillLabel')}
                suffix="%"
                value={settings.roadtrip_fill_percent}
                placeholder={t('roadtrip.limit.fillFull')}
                wide
                onDraft={v => setPreview({ key: 'fill', value: v > 100 ? 100 : v })}
                onChange={v => onSave?.('roadtrip_fill_percent', v > 100 ? 100 : v)}
              />
              <p className="text-caption leading-snug text-content-faint">
                {vehicleKind ? t('roadtrip.limit.specHint') : t('roadtrip.limit.vehicleHint')}
              </p>
            </section>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
