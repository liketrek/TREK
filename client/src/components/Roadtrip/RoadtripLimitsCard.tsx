import React, { useState } from 'react'
import {
  Clock, Fuel, CalendarClock, SlidersHorizontal, ChevronRight, Coins, Signpost, Ship,
  Car, Zap, BatteryCharging, BatteryFull, BatteryWarning, Gauge, Route, Sparkles, Link2, Palette,
} from 'lucide-react'
import Modal from '../shared/Modal'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { convertDistance, formatDistance } from '../../utils/units'
import { formatDurationShort, parseAvoid, serializeAvoid, type VehicleKind } from './roadtripModel'
import { effectiveRangeKm, rangeFromSpec, showSpec, storeSpec, specUnit, type SpecKey, type VehicleSpec } from './vehicleRange'
import RangeStrip from './RangeStrip'
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
function LimitRow({ icon: Icon, label, suffix, value, placeholder, step, derived, testId, onDraft, onChange }: {
  icon: typeof Clock
  label: string
  suffix: string
  value: number | undefined
  placeholder: string
  step?: number
  derived?: string
  /**
   * A stable handle for the tests, because the rows are no longer at fixed indices.
   *
   * The vehicle figures now live behind a disclosure, so "the fourth number field" means
   * different things depending on whether it is open.
   */
  testId?: string
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
    <label className="flex min-h-9 items-center gap-4">
      <Icon size={16} className="shrink-0 text-content-faint" aria-hidden />
      {/* Label and unit in one wrapping flow, not in two columns. The unit used to have a
          column of its own, sized per section, because "kWh/100 km" does not fit where
          "min" does — and that column was the reason every section had a right edge of
          its own. In the flow it simply wraps under a long label and costs nothing. */}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-body text-content-secondary">{label}</span>
        {/* The unit as a chip rather than as more grey words after the label. "kWh/100 km"
            set as prose reads as part of the question; on a chip it reads as what the
            number beside it will be measured in, which is what it is. */}
        <span className="inline-flex items-center rounded-md bg-surface-tertiary px-1.5 py-0.5 text-caption leading-none text-content-muted">
          {suffix}
        </span>
      </span>
      {/* The one right edge of the whole dialog. Sized from the type rather than in fixed
          pixels, so it grows with the reader's text-size setting instead of clipping: six
          digits of tabular figures plus the field's own padding, and never narrower than
          a switch. Geometry, which the styleguide allows inline. */}
      <span className="flex shrink-0 justify-end" style={{ width: 'max(5.5rem, calc(6ch + 1.75rem))' }}>
        {derived ? (
          // A mark rather than a word: "computed" is eight characters in English and
          // fourteen in half the locales. The sentence lives in the title and in the
          // screen-reader text.
          <span className="flex items-center gap-1.5" title={derived} data-testid="limit-derived">
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
            aria-label={`${label}, ${suffix}`}
            data-testid={testId}
            onChange={e => { setDraft(e.target.value); onDraft?.(parseLimit(e.target.value)) }}
            onBlur={commit}
            // Committed here rather than by blurring and letting onBlur do it: a
            // second commit is a no-op anyway, and going through blur made Enter
            // depend on focus handling instead of on the key.
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur() } }}
            // The spinners are the other half of the width problem: they eat a third of a
            // narrow field and nobody sets a driving limit by clicking an arrow.
            className="w-full rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-end text-body tabular-nums text-content [appearance:textfield] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        )}
      </span>
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

/**
 * One section of the dialog, as a panel of its own.
 *
 * The complaint the redesign started from was "untidy", and the cause was that four
 * sections sat in two columns with nothing between them but a heading: no edges, so the
 * eye had to work out where one ended, and two right edges, so nothing lined up across
 * the middle. A panel draws that boundary once and the rows inside inherit one rhythm.
 *
 * The closing note is part of the panel rather than a paragraph somebody remembers to add:
 * every one of these sections has a sentence that has to be said (driving time is driving
 * time only; avoidance is a weighting, not a ban), and left to each caller they drifted
 * apart in spacing and in colour.
 */
function Panel({ icon: Icon, title, note, children }: {
  icon: typeof Clock
  title: string
  note?: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-edge-faint bg-surface-secondary px-4 py-3.5">
      <SectionTitle icon={Icon}>{title}</SectionTitle>
      {children}
      {note ? <p className="text-caption leading-snug text-content-faint">{note}</p> : null}
    </section>
  )
}

/** The name of one section, inside its panel. */
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

/**
 * The settings every one of the car's own figures is stored under.
 *
 * Read once, to decide whether the disclosure below the range starts open: a stored
 * figure means the range row is derived, and its cause has to be in sight.
 */
const SPEC_SETTINGS = ['roadtrip_tank_litres', 'roadtrip_litres_per_100', 'roadtrip_battery_kwh', 'roadtrip_kwh_per_100', 'roadtrip_battery_degradation'] as const

export default function RoadtripLimitsCard({ onSave }: {
  /**
   * Persists one setting. Absent leaves the dialog read-only.
   *
   * A string as well as a number since the avoidance is stored as a comma list: one
   * decision with three parts, which goes to the router as one request either way.
   */
  onSave?: (key: string, value: number | string | boolean) => void
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
  /**
   * Whether the car's own figures are unfolded.
   *
   * Open from the start the moment any of them is stored, because then the range row is
   * read-only and folding its cause away would leave a field nobody can edit with no
   * visible reason. Read once at mount: re-deriving it would slam the panel shut under
   * the hand of somebody clearing the last field.
   */
  const [specOpen, setSpecOpen] = useState(() =>
    SPEC_SETTINGS.some(k => typeof (settings as unknown as Record<string, unknown>)[k] === 'number'))
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
        <Modal isOpen onClose={() => { setOpen(false); setPreview(null) }} size="4xl" title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-content-faint" aria-hidden />
            {t('roadtrip.limit.title')}
          </span>
        }>
          <div className="flex flex-col gap-4">
            {/* Two columns, kept. One column reads more tidily but turns the dialog into
                something that has to be scrolled, and a setting you cannot see while you
                change another is worse than a seam down the middle.

                What answers the seam is not the count of columns but what is in them: each
                section is now a panel of its own with a visible edge, every row inside it
                ends on the same right edge, and the panels are stacked to one rhythm. The
                left column is the trip, the right one is the car. */}
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Panel icon={Clock} title={t('roadtrip.limit.sectionDriving')} note={t('roadtrip.limit.hint')}>
                  <LimitRow
                    icon={Clock}
                    label={t('roadtrip.limit.legLabel')}
                    suffix={t('roadtrip.limit.minutes')}
                    value={legMinutes}
                    placeholder={t('roadtrip.limit.off')}
                    testId="limit-legMinutes"
                    onChange={v => onSave?.('roadtrip_leg_minutes', v)}
                  />
                  <LimitRow
                    icon={CalendarClock}
                    label={t('roadtrip.limit.dayLabel')}
                    suffix={t('roadtrip.limit.minutes')}
                    value={dayMinutes}
                    placeholder={t('roadtrip.limit.off')}
                    testId="limit-dayMinutes"
                    onChange={v => onSave?.('roadtrip_day_minutes', v)}
                  />
                </Panel>

                <Panel
                  icon={Signpost}
                  title={t('roadtrip.avoid.section')}
                  note={canAvoid ? t('roadtrip.avoid.hint') : t('roadtrip.avoid.unavailable')}
                >
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
                </Panel>

                <Panel icon={Route} title={t('roadtrip.line.section')} note={t('roadtrip.line.hint')}>
                  {/* The road between one day's last stop and the next day's first is real
                      driving that the rail has never drawn: days are routed one at a time,
                      so that gap was never asked for. Off by default because it costs a
                      routing request per join and changes every day's kilometres. */}
                  <AvoidRow
                    icon={Link2}
                    label={t('roadtrip.line.connect')}
                    on={!!settings.roadtrip_connect_days}
                    disabled={false}
                    onToggle={() => onSave?.('roadtrip_connect_days', !settings.roadtrip_connect_days)}
                  />
                  {/* Which matters most once the line IS continuous: end to end it is one
                      stroke, and a colour per day is what puts the days back into it. */}
                  <AvoidRow
                    icon={Palette}
                    label={t('roadtrip.line.dayColors')}
                    on={!!settings.roadtrip_day_colors}
                    disabled={false}
                    onToggle={() => onSave?.('roadtrip_day_colors', !settings.roadtrip_day_colors)}
                  />
                </Panel>
              </div>

              <Panel
                icon={Car}
                title={t('roadtrip.limit.sectionVehicle')}
                note={vehicleKind ? t('roadtrip.limit.specHint') : t('roadtrip.limit.vehicleHint')}
              >
                {/* First, because it decides what everything under it means: with no
                    vehicle named, a petrol station and a charger both fill the tank, which
                    is arithmetic that is wrong for everybody who drives just one of them.

                    Radios in a segmented shell rather than a dropdown: three options that
                    change the meaning of everything below them should be readable without
                    being opened, and the arrow keys, the names and the roles then come
                    from the browser instead of from a rebuilt listbox. */}
                <fieldset className="min-w-0">
                  <legend className="sr-only">{t('roadtrip.limit.vehicleLabel')}</legend>
                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-edge bg-surface-tertiary p-1">
                    {VEHICLES.map(({ key, labelKey, Icon }) => (
                      <label key={key ?? 'unset'} className="min-w-0">
                        <input
                          type="radio"
                          name="roadtrip-vehicle"
                          className="peer sr-only"
                          checked={(settings.roadtrip_vehicle || '') === (key ?? '')}
                          onChange={() => {
                            // Never writes the car's figures away: switching kind leaves
                            // both sets stored, `rangeFromSpec` simply returns null for
                            // the other one, and the typed range comes back as an editable
                            // field. Deleting the other kind's values here would lose data
                            // on a mis-click.
                            setPreview(null)
                            onSave?.('roadtrip_vehicle', key ?? '')
                          }}
                        />
                        <span className="flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-center text-body text-content-secondary transition-colors hover:bg-surface-hover peer-checked:bg-accent peer-checked:text-accent-text peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                          <Icon size={14} className="shrink-0" aria-hidden />
                          {t(labelKey)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <RangeStrip
                  rangeKm={planningKm}
                  fillPercent={shownFill}
                  wearPercent={vehicleKind === 'electric' ? spec.degradationPercent ?? null : null}
                  unit={distanceUnit}
                  electric={vehicleKind === 'electric'}
                />

                {/* Read-only once the parts add up, because then it IS the parts. Leaving
                    it editable would offer a second answer to a question that already has
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
                  testId="limit-range"
                  onDraft={v => setPreview({ key: 'range', value: v })}
                  onChange={setRange}
                />
                {/* Under the range, because it is a fraction OF it. Nobody charges to
                    100 % on the road: the last fifth takes as long as the first four, so a
                    stop counted as a full tank overstates everything after it by that
                    fifth. */}
                <LimitRow
                  icon={BatteryCharging}
                  label={t('roadtrip.limit.fillLabel')}
                  suffix="%"
                  value={settings.roadtrip_fill_percent}
                  placeholder={t('roadtrip.limit.fillFull')}
                  testId="limit-fill"
                  onDraft={v => setPreview({ key: 'fill', value: v > 100 ? 100 : v })}
                  onChange={v => onSave?.('roadtrip_fill_percent', v > 100 ? 100 : v)}
                />

                {/* The car's own figures, folded away. Nothing here is required — somebody
                    who knows their range types it above and never opens this — but it
                    starts open the moment any of them is stored, because otherwise the
                    range row is read-only with its cause out of sight. */}
                {vehicleKind ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setSpecOpen(o => !o); setPreview(null) }}
                      aria-expanded={specOpen}
                      aria-controls="roadtrip-spec"
                      className="-mx-1 flex items-center gap-1.5 self-start rounded-lg px-1 py-0.5 text-caption font-semibold text-accent-on transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ChevronRight
                        size={13}
                        className={`shrink-0 transition-transform ${specOpen ? 'rotate-90' : ''}`}
                        aria-hidden
                      />
                      {t('roadtrip.limit.specToggle')}
                    </button>
                    {/* `hidden` rather than unmounting: it really leaves the tab order,
                        and a field that kept a draft while folded away would be a draft
                        nobody can see. */}
                    {/* The display class only while it is open. `[hidden]` sets
                        `display: none` in the preflight, but a `flex` class beats it on
                        specificity — so the attribute flipped, the semantics were right,
                        and the panel stayed on screen. */}
                    <div id="roadtrip-spec" hidden={!specOpen} className={specOpen ? 'flex flex-col gap-3' : ''}>
                      {SPEC_ROWS[vehicleKind].map(({ key, setting, Icon, labelKey, step }) => (
                        <LimitRow
                          key={key}
                          icon={Icon}
                          label={t(labelKey)}
                          suffix={specUnit(key, imperial)}
                          step={step}
                          value={showSpec(key, saved[key], imperial)}
                          placeholder={t('roadtrip.limit.off')}
                          testId={`limit-${key}`}
                          onDraft={v => setPreview({ key, value: v })}
                          onChange={v => onSave?.(setting, storeSpec(key, v, imperial))}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </Panel>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
