import type { ReactNode } from 'react'
import { Car, Fuel, Zap } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useRoadtripSettings } from '../../../../hooks/useRoadtripSettings'
import { useVehicleRange } from '../../../../components/Roadtrip/useVehicleRange'
import { blockMask } from '../../../../components/Roadtrip/RangeStrip'
import { dayWindow } from '../../../../components/Roadtrip/dayWindow'
import { formatDurationShort, parseAvoid } from '../../../../components/Roadtrip/roadtripModel'
import { valhallaAvailable } from '../../../../components/Map/valhallaRoute'
import { convertDistance, formatDistance, getDistanceUnitLabel } from '../../../../utils/units'
import { Eyebrow, TileHeader } from '../sheets/MTripSheetUi'
import type { DistanceUnit } from '../../../../types'

/**
 * The figures the stage plans with, read out loud.
 *
 * The chain says a stretch is too long, or that there is nothing to fill up at before the
 * tank runs dry, and on a phone there was nothing behind those sentences: the numbers they
 * are measured against live in a desktop dialog with seven panels and two columns. Without
 * them a warning is an opinion. So two of those panels come along, the two that decide what
 * the stage is allowed to say, and nothing else does.
 *
 * Nothing here can be changed. That is the point rather than a gap: driving limits are set
 * once, at a table, before anybody is in the car, and a form in the passenger seat is a way
 * to break a trip while it is happening. So there is no field, no slider and no greyed-out
 * button that looks like one, and the last line says plainly where the settings are and what
 * else that screen can do that this one cannot.
 */

/**
 * How many kilometres one block of the bar stands for.
 *
 * The same fifty as `RangeStrip`, whose `blockMask` cuts the bar here too. The mask comes
 * from that module so the two pictures cannot drift apart; the figure the note quotes is
 * the one thing it does not hand out, so it is stated once here.
 */
const BLOCK_KM = 50

/** One value of the driving limits, with the row rule above every row but the first. */
function LimitLine({ label, value, fallback, first }: {
  label: string
  value: string | null
  fallback: string
  first: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${first ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}>
      <span className="min-w-0 flex-1 text-[0.8125rem] text-m-muted">{label}</span>
      <span
        className={`flex-none text-[0.8125rem] font-semibold tabular-nums ${value ? 'text-m-ink' : 'text-m-faint'}`}
      >
        {value ?? fallback}
      </span>
    </div>
  )
}

/** One card of the sheet: eyebrow plus whatever the section is made of. */
function InfoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-[color:var(--m-ic)] px-3.5 py-3">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  )
}

/**
 * Driving figures sheet ('rtinfo'): the vehicle's range as the tank it leaves the factory
 * with, and the limits every warning on the stage is measured against. Read-only.
 */
export default function MRtInfoSheet({ planner, shell }: MTripSheetsProps) {
  const { t } = useTranslation()
  const open = shell.sheet?.id === 'rtinfo'
  const tripId = planner.tripId

  const unitSetting = useSettingsStore(s => s.settings.distance_unit)
  const unit: DistanceUnit = unitSetting === 'imperial' ? 'imperial' : 'metric'

  // The same range the stage plans with: the vehicle's own figures when they add up,
  // the typed one otherwise. Reading it through the shared hook is what keeps the sheet
  // from becoming a second opinion about the tank.
  const { vehicleKind, rangeKm } = useVehicleRange(tripId)
  const legMinutes = useRoadtripSettings(s => s.roadtrip_leg_minutes, tripId)
  const dayMinutes = useRoadtripSettings(s => s.roadtrip_day_minutes, tripId)
  const dayStart = useRoadtripSettings(s => s.roadtrip_day_start, tripId)
  const dayEnd = useRoadtripSettings(s => s.roadtrip_day_end, tripId)
  const fillPercent = useRoadtripSettings(s => s.roadtrip_fill_percent, tripId)
  const degradation = useRoadtripSettings(s => s.roadtrip_battery_degradation, tripId)
  const avoidRaw = useRoadtripSettings(s => s.roadtrip_avoid, tripId)

  const electric = vehicleKind === 'electric'
  const VehicleIcon = electric ? Zap : vehicleKind === 'combustion' ? Fuel : Car

  // Capped where the arithmetic caps it, so no picture can claim a battery is gone. The
  // range above the bar already has this taken off it, which is exactly why it gets said.
  const wear = electric ? Math.min(90, Math.max(0, degradation ?? 0)) : 0
  const fill = fillPercent && fillPercent > 0 && fillPercent < 100 ? fillPercent : 100

  // Split rather than formatted whole, so the unit can sit smaller beside the figure. The
  // rounding is formatDistance's own, because the stage header uses that and the two must
  // not disagree by a tenth.
  const shown = rangeKm ? Math.round(convertDistance(rangeKm, unit) * 10) / 10 : null
  const mask = blockMask(rangeKm)

  const notes = [
    shown === null ? t('roadtrip.limit.rangeEmptyHint') : null,
    shown !== null && fill < 100
      ? t('roadtrip.limit.afterFill', { percent: fill, distance: formatDistance((rangeKm ?? 0) * fill / 100, unit) })
      : null,
    mask ? t('roadtrip.limit.blockNote', { distance: formatDistance(BLOCK_KM, unit) }) : null,
    wear > 0 ? t('roadtrip.limit.wearNote', { percent: wear }) : null,
  ].filter((note): note is string => note !== null)

  const unitLabel = getDistanceUnitLabel(unit)
  const perLabel = t(electric ? 'roadtrip.limit.perCharge' : 'roadtrip.limit.perFill')
  const barLabel = shown === null
    ? t('roadtrip.limit.rangeEmpty')
    : `${shown} ${unitLabel} ${perLabel}`

  // Both times on one line, in the separator the desktop badge already uses. A dash
  // between two clock readings is the one place a phone line breaks in the wrong spot.
  const windowText = dayWindow(dayStart, dayEnd) ? `${dayStart} · ${dayEnd}` : null

  // No second routing engine, no avoidance: the stored classes would be a promise the
  // router cannot keep, so the row says the same "off" it would say with none set.
  const avoiding = parseAvoid(avoidRaw)
  const avoidText = valhallaAvailable() && avoiding.length > 0
    ? t('roadtrip.avoid.badge', { count: avoiding.length })
    : null

  const off = t('roadtrip.limit.off')
  const lines: { key: string; label: string; value: string | null; fallback: string }[] = [
    {
      key: 'leg',
      label: t('roadtrip.limit.legLabel'),
      value: legMinutes ? formatDurationShort(legMinutes * 60) : null,
      fallback: off,
    },
    {
      key: 'day',
      label: t('roadtrip.limit.dayLabel'),
      value: dayMinutes ? formatDurationShort(dayMinutes * 60) : null,
      fallback: off,
    },
    { key: 'window', label: t('roadtrip.window.title'), value: windowText, fallback: off },
    {
      key: 'fill',
      label: t('roadtrip.limit.fillLabel'),
      value: fill < 100 ? `${fill} %` : null,
      // "off" is the wrong word for a tank: not saying how far you fill it means you fill
      // it right up, which is what the arithmetic then does.
      fallback: t('roadtrip.limit.fillFull'),
    },
    { key: 'avoid', label: t('roadtrip.avoid.section'), value: avoidText, fallback: off },
  ]

  return (
    <MSheet open={open} onClose={shell.closeSheet} variant="bottom" material="opaque" ariaLabel={t('mobileTrip.rtInfoTitle')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<VehicleIcon size={19} strokeWidth={1.8} />}
          title={<span className="truncate">{t('mobileTrip.rtInfoTitle')}</span>}
          onClose={shell.closeSheet}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
        {/* ── Vehicle: how far it goes, drawn as the tank it leaves the factory with ── */}
        <div className="mt-[14px]">
          <InfoCard label={t('roadtrip.limit.sectionVehicle')}>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="flex items-baseline gap-1">
                <span className="text-[1.375rem] font-extrabold leading-none tabular-nums text-m-ink">
                  {shown ?? '-'}
                </span>
                {shown !== null && (
                  <span className="text-[0.875rem] font-semibold leading-none text-m-muted">{unitLabel}</span>
                )}
              </span>
              <span className="font-geist text-[0.65625rem] text-m-faint">
                {shown === null ? t('roadtrip.limit.rangeEmpty') : perLabel}
              </span>
            </div>

            <div
              className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--m-trackoff)]"
              role="img"
              aria-label={barLabel}
            >
              {/* Cut as a mask rather than painted over, so the gaps are real holes and
                  the glass behind the sheet shows through them. */}
              <div
                className="flex h-full w-full"
                style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
                aria-hidden="true"
              >
                <div className="h-full bg-m-act" style={{ width: `${shown === null ? 0 : fill}%` }} />
              </div>
            </div>

            {notes.length > 0 && (
              <div className="mt-2 font-geist text-[0.65625rem] leading-snug text-m-faint">
                {notes.join(' · ')}
              </div>
            )}
          </InfoCard>
        </div>

        {/* ── Limits: what every warning on the stage is measured against ── */}
        <div className="mt-2.5">
          <InfoCard label={t('roadtrip.limit.title')}>
            <div className="mt-1">
              {lines.map((line, i) => (
                <LimitLine
                  key={line.key}
                  label={line.label}
                  value={line.value}
                  fallback={line.fallback}
                  first={i === 0}
                />
              ))}
            </div>
          </InfoCard>
        </div>

        <p className="mt-3 font-geist text-[0.6875rem] leading-snug text-m-faint">
          {t('mobileTrip.rtDesktopNote')}
        </p>
      </div>
    </MSheet>
  )
}
