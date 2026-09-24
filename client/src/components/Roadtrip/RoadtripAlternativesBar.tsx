import React from 'react'
import { Shuffle, X, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import type { LegAlternatives } from './useRouteAlternatives'
import { alternativesBusy, alternativesPhase, alternativeSubline, otherEngineNote, type AlternativeOverlay } from './alternativeOverlays'

interface RoadtripAlternativesBarProps {
  open: LegAlternatives | null
  /** The very rows the map draws, so the two can never disagree about which is fastest. */
  overlays: AlternativeOverlay[]
  onChoose: (index: number) => void
  onClose: () => void
  /** Reports which option the pointer is on, so the map can light that road up. */
  onHighlight?: (index: number | null) => void
}

/**
 * The ways of driving one leg, offered over the map.
 *
 * A bar rather than a dialog: the answer is on the map behind it — which road each option
 * takes — so covering the map to ask about it would hide the only thing worth looking at.
 *
 * Every value here comes from the same overlay the map draws. Working them out separately
 * is what made the list label the driven route "Fastest" while offering another one
 * "58 min quicker" beside it: it assumed the first entry was the quickest, which stopped
 * being true the moment the road currently driven was put at the top.
 */
export default function RoadtripAlternativesBar({
  open, overlays, onChoose, onClose, onHighlight,
}: RoadtripAlternativesBarProps): React.ReactElement | null {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  if (!open) return null
  const phase = alternativesPhase(open, overlays)
  // While a choice is checked against the router and written, the list stands still: a
  // second click would race the first, and its answer could land on the leg after it.
  const busy = alternativesBusy(open)
  // What the check is doing, and why the last one saved nothing. A toast says the latter
  // too, but it is announced to nobody and gone in seconds, while this line sits beside
  // the chips it is about.
  const status = busy ? t('roadtrip.alt.checking') : (open.notice ?? '')

  return (
    <div className="pointer-events-auto flex max-w-[min(92vw,640px)] flex-col gap-2 rounded-2xl border border-edge-faint bg-surface-elevated px-3 py-2.5 shadow-modal backdrop-blur">
      <div className="flex items-center gap-2">
        <Shuffle size={13} className="shrink-0 text-content-faint" aria-hidden />
        <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
          {t('roadtrip.alt.title')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="ms-auto rounded-full p-1 text-content-faint transition-colors hover:bg-surface-hover hover:text-content"
        >
          <X size={13} aria-hidden />
        </button>
      </div>

      {phase === 'loading' ? (
        <p className="text-caption text-content-muted">{t('roadtrip.alt.loading')}</p>
      ) : phase === 'failed' ? (
        <p className="flex items-start gap-1.5 text-caption text-warning">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
          {t('roadtrip.alt.failed')}
        </p>
      ) : phase === 'onlyOne' ? (
        // One route back means there is genuinely only one sensible way to drive it.
        <p className="text-caption text-content-muted">{t('roadtrip.alt.onlyOne')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5" aria-busy={busy}>
          {overlays.map(alt => {
            const note = otherEngineNote(alt)
            return (
              <button
                key={alt.index}
                type="button"
                // Refused rather than disabled: a disabled button gives its focus up, and a
                // keyboard that chose it would land on the page with the check still running.
                aria-disabled={busy}
                aria-busy={open.proving === alt.index}
                onClick={() => { if (!busy) onChoose(alt.index) }}
                onMouseEnter={() => onHighlight?.(alt.index)}
                onMouseLeave={() => onHighlight?.(null)}
                onFocus={() => onHighlight?.(alt.index)}
                onBlur={() => onHighlight?.(null)}
                className="flex items-center gap-2 rounded-xl border border-edge bg-surface-card px-2.5 py-1.5 text-start transition-colors hover:border-content-faint aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:border-edge"
              >
                {open.proving === alt.index ? (
                  <Loader2 size={10} className="shrink-0 animate-spin text-content-faint" aria-hidden />
                ) : (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    // theme-lint-disable: the very colour this route is drawn in on the map;
                    // a token here would break the one link between list and picture.
                    style={{ background: alt.color }}
                    aria-hidden
                  />
                )}
                <span className="flex flex-col">
                  <span className="text-caption font-medium tabular-nums text-content">
                    {formatDistance(alt.distance / 1000, distanceUnit)}
                  </span>
                  <span className="text-caption tabular-nums text-content-muted">
                    {alternativeSubline(alt, time => t('roadtrip.alt.slower', { time }))}
                  </span>
                </span>
                {/* Only where the drive time on the map came from the other engine. The
                    road and the length are the same question either way; the time is not,
                    and two engines' times sitting next to each other on the map invite a
                    subtraction that means nothing. Saying so here, where the choice is
                    actually made, is cheaper than a second request per offer to restate
                    the whole list in one engine's terms. */}
                {note ? (
                  <Tooltip label={t(note)}>
                    <Info size={12} className="shrink-0 text-content-faint" aria-label={t(note)} />
                  </Tooltip>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
      {/* Kept in the tree while empty, so a screen reader is listening before it speaks. */}
      <p role="status" className={status ? 'text-caption text-content-muted' : 'sr-only'}>{status}</p>
    </div>
  )
}
