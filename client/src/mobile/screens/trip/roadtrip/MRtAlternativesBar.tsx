import { AlertTriangle, Check, Loader2, Shuffle, X } from 'lucide-react'
import MBadge from '../../../components/MBadge'
import MIconBtn from '../../../components/MIconBtn'
import { alternativeSubline, type AlternativeOverlay } from '../../../../components/Roadtrip/alternativeOverlays'
import { useSettingsStore } from '../../../../store/settingsStore'
import { formatDistance } from '../../../../utils/units'
import { badgeLabel } from './stageBadges'
import { RT_ALT_BAR_HEIGHT, type MRtAlternativesController } from './useMRtAlternatives'
import type { TripPlanner } from '../MTripShell'

export interface MRtAlternativesBarProps {
  planner: TripPlanner
  alts: MRtAlternativesController
}

/**
 * The ways of driving one leg, over the map that draws them.
 *
 * It takes the stage bar's slot rather than a sheet: the answer is the lines on the map,
 * and a sheet big enough for three offers would cover the very roads it asks about.
 *
 * Three rows at fixed heights, because the map lifts its credit and its round controls by
 * this bar's height (RT_ALT_BAR_LIFT), and a bar that grew with its text would slide under
 * them. So every line truncates or clamps instead of wrapping into another row.
 *
 * A chip previews and the button takes. The chip lights its road on the map, and so does
 * a tap on the line itself; nothing is written until the confirm, which stays off until a
 * road other than the one already driven is picked. The chips go quiet while the choice
 * is being saved, so a second tap cannot pick another road under a write in flight.
 */
export default function MRtAlternativesBar({ planner, alts }: MRtAlternativesBarProps) {
  const { t } = planner
  const title = t('roadtrip.alt.title')

  return (
    <section
      aria-label={title}
      className="flex flex-col gap-2 rounded-[22px] border border-[color:var(--m-cbr)] bg-[color:var(--m-card)] px-[14px] py-[11px] shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[24px] backdrop-saturate-[1.6]"
      style={{ height: RT_ALT_BAR_HEIGHT }}
    >
      <div className="flex h-8 flex-none items-center gap-2">
        <Shuffle size={14} strokeWidth={2} className="flex-none text-m-muted" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-muted">
          {title}
        </span>
        <MIconBtn variant="neutral" size={32} ariaLabel={t('common.close')} onClick={alts.cancel}>
          <X size={15} strokeWidth={2.2} aria-hidden="true" />
        </MIconBtn>
      </div>

      <div className="h-[58px] flex-none">
        <AlternativesBody planner={planner} alts={alts} />
      </div>

      <div className="flex h-11 flex-none items-center gap-2.5">
        {/* The desk hides this sentence in a tooltip on the chip. There is no hover here,
            so it stands beside the button whose choice it qualifies. */}
        {alts.picked?.otherEngine && (
          <span className="line-clamp-2 min-w-0 flex-1 font-geist text-[0.65625rem] leading-[1.35] text-m-muted">
            {t('roadtrip.alt.otherEngine')}
          </span>
        )}
        <button
          type="button"
          onClick={alts.confirm}
          disabled={!alts.canConfirm}
          aria-busy={alts.saving}
          // Saving keeps the fill: the button is busy with the choice, not unavailable.
          className={`flex h-11 min-w-0 items-center justify-center gap-[7px] rounded-full bg-m-act px-5 text-[0.8125rem] font-semibold text-m-actfg ${
            alts.saving ? '' : 'disabled:bg-[color:var(--m-ic)] disabled:text-m-faint'
          } ${alts.picked?.otherEngine ? 'flex-none' : 'flex-1'}`}
        >
          {alts.saving
            ? <Loader2 size={15} strokeWidth={2.2} className="flex-none animate-spin" aria-hidden="true" />
            : <Check size={15} strokeWidth={2.2} className="flex-none" aria-hidden="true" />}
          <span className="truncate">{t('common.confirm')}</span>
        </button>
      </div>
    </section>
  )
}

/** The middle row: what the router said, or the roads to pick from. */
function AlternativesBody({ planner, alts }: MRtAlternativesBarProps) {
  const { t } = planner
  const unit = useSettingsStore(s => s.settings.distance_unit)

  if (alts.phase === 'loading') {
    return (
      <p role="status" className="flex h-full items-center gap-2 text-[0.8125rem] font-medium text-m-muted">
        <Loader2 size={15} strokeWidth={2.2} className="flex-none animate-spin" aria-hidden="true" />
        <span className="truncate">{t('roadtrip.alt.loading')}</span>
      </p>
    )
  }
  if (alts.phase === 'failed') {
    return (
      <p role="status" className="flex h-full items-center gap-2 text-[0.8125rem] font-medium text-m-ink">
        <AlertTriangle size={15} strokeWidth={2.2} className="flex-none text-[color:var(--m-st-pending)]" aria-hidden="true" />
        <span className="line-clamp-2">{t('roadtrip.alt.failed')}</span>
      </p>
    )
  }
  if (alts.phase === 'onlyOne') {
    // One road back is genuinely one sensible way to drive the leg, not a failure.
    return (
      <p role="status" className="flex h-full items-center text-[0.8125rem] font-medium text-m-muted">
        <span className="line-clamp-2">{t('roadtrip.alt.onlyOne')}</span>
      </p>
    )
  }
  // No phase means no open picker. The tab mounts the bar only while one is open, so this
  // is at most the render it closes in, and "only one way" there would describe no leg.
  if (alts.phase !== 'choose') return null

  // Scrolls sideways rather than wrapping, because the row has a fixed height. The negative
  // margin lets a chip slide under the bar's own edge instead of stopping short of it.
  return (
    <div className="-mx-[14px] flex h-full snap-x gap-2 overflow-x-auto px-[14px]">
      {alts.overlays.map(alt => (
        <AlternativeChip
          key={alt.index}
          alt={alt}
          picked={alts.picked?.index === alt.index}
          disabled={alts.saving}
          distance={formatDistance(alt.distance / 1000, unit)}
          subline={alternativeSubline(alt, time => t('roadtrip.alt.slower', { time }))}
          onPick={() => alts.pick(alt.index)}
        />
      ))}
    </div>
  )
}

/**
 * One offered road: its colour, its drive time, its length and what sets it apart.
 *
 * The drive time comes first because it is the exact text of the pill on the map, and it
 * is that text rather than the swatch that ties a chip to its line: every offer is drawn
 * in the same pale blue. The distance is a badge, a figure on its own the way the stage
 * bar sets its figures, and the chip spells its parts out in its name for the reason the
 * stage bar does.
 */
function AlternativeChip({ alt, picked, disabled, distance, subline, onPick }: {
  alt: AlternativeOverlay
  picked: boolean
  disabled: boolean
  distance: string
  subline: string
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={picked}
      aria-label={badgeLabel([alt.label, distance, subline])}
      className={`flex h-full min-w-[128px] max-w-[232px] flex-none snap-start items-center gap-2.5 rounded-[16px] border px-3 text-start disabled:opacity-60 ${
        picked ? 'border-[color:var(--m-act)] bg-[color:var(--m-inner)]' : 'border-[color:var(--m-cbr)] bg-[color:var(--m-ic)]'
      }`}
    >
      <span
        aria-hidden="true"
        className="h-3 w-3 flex-none rounded-full"
        // theme-lint-disable: the very colour this road is drawn in on the map, see alternativeColors.ts.
        style={{ background: alt.color }}
      />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[0.8125rem] font-semibold tabular-nums text-m-ink">{alt.label}</span>
          <MBadge caps={false}>{distance}</MBadge>
        </span>
        <span className="mt-[3px] block truncate font-geist text-[0.6875rem] text-m-muted">{subline}</span>
      </span>
    </button>
  )
}
