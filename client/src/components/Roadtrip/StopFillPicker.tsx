import React from 'react'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import AnchoredPopover from './AnchoredPopover'
import { useVehicleRange } from './useVehicleRange'
import { FS } from './typeScale'
import type { DistanceUnit } from '../../types'

/**
 * How full THIS stop fills up.
 *
 * A property of the stop rather than of the traveller, which is the whole reason it is
 * here and not only in the settings dialog: a motorway rapid charger is worth about 80 %
 * because the last fifth costs as long again, while the one at the hotel is worth all of
 * it because the car stands there all night. One figure for the whole trip cannot say
 * both, and the difference between them is a leg.
 *
 * Six pills rather than a slider or a field. A tank is not filled to 63 %, and the number
 * being chosen is a decision — "top up" or "fill right up" — not a measurement, so a
 * control that offers the six answers people actually give is one tap where a slider is a
 * drag and a field is a keyboard.
 *
 * Under them, what the choice is worth in kilometres, because 80 % is an abstraction and
 * "about 290 km from here" is the thing the traveller is actually deciding.
 */

/** The answers people actually give. Below half a tank nobody stops on purpose. */
const PRESETS = [50, 60, 70, 80, 90, 100] as const

export default function StopFillPicker({ anchor, current, onPick, onClose }: {
  /** The element the popover hangs under: the stop's own fill badge. */
  anchor: HTMLElement | null
  /** What this stop says, or null when it follows the traveller's own setting. */
  current: number | null
  /** A percentage for this stop, or null to hand it back to the setting. */
  onPick: (percent: number | null) => void
  onClose: () => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  const unit: DistanceUnit = useSettingsStore(s => s.settings.distance_unit) === 'imperial' ? 'imperial' : 'metric'
  const fallback = useSettingsStore(s => s.settings.roadtrip_fill_percent)
  const { rangeKm } = useVehicleRange()

  // Zero, absent and 100 all mean the same thing in the settings, so they read as full
  // here too rather than as three different defaults.
  const settingPercent = fallback && fallback > 0 && fallback < 100 ? fallback : 100
  const shown = current ?? settingPercent

  return (
    <AnchoredPopover anchor={anchor} label={t('roadtrip.stop.fillTitle')} onClose={onClose}>
      <div className="flex flex-col gap-2 p-0.5">
        <p
          className="px-1 font-geist font-semibold uppercase tracking-[0.12em] text-content-faint"
          style={{ fontSize: FS.label }}
        >
          {t('roadtrip.stop.fillTitle')}
        </p>

        <div className="flex gap-1">
          {PRESETS.map(percent => {
            // Pressed against what the stop will actually use, inherited or not, so the
            // panel opens showing where the stop stands rather than showing nothing.
            const on = shown === percent
            return (
              <button
                key={percent}
                type="button"
                aria-pressed={on}
                // Picking what it already is hands it back to the setting, the same way
                // the kind picker un-picks a kind it already has.
                onClick={() => onPick(current === percent ? null : percent)}
                className={`h-9 w-9 rounded-xl border text-caption font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  on
                    ? 'border-accent bg-accent text-accent-text'
                    : 'border-edge bg-surface-card text-content-secondary hover:bg-surface-hover'
                }`}
              >
                {percent}
              </button>
            )
          })}
        </div>

        {/* What the choice buys. Absent rather than guessed when no range is set: a
            kilometre figure worked out from nothing would be the most convincing wrong
            number on the screen. */}
        <p className="px-1 text-caption text-content-muted">
          {rangeKm
            ? t('roadtrip.stop.fillGives', { distance: formatDistance((rangeKm * shown) / 100, unit) })
            : t('roadtrip.stop.fillNoRange')}
        </p>

        {/* Only once there is something to undo. Without an override it would be a button
            that says "leave everything as it is". */}
        {current !== null ? (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-caption text-content-secondary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RotateCcw size={14} className="shrink-0 text-content-faint" aria-hidden />
            <span className="flex-1 text-start">{t('roadtrip.stop.fillDefault')}</span>
            <span className="tabular-nums text-content-faint">{`${settingPercent} %`}</span>
          </button>
        ) : null}
      </div>
    </AnchoredPopover>
  )
}
