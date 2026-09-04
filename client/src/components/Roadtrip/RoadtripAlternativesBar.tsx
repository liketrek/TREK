import React from 'react'
import { Shuffle, X, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { formatDurationShort } from './roadtripModel'
import type { LegAlternatives } from './useRouteAlternatives'
import type { AlternativeOverlay } from './alternativeOverlays'

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

      {open.loading ? (
        <p className="text-caption text-content-muted">{t('roadtrip.alt.loading')}</p>
      ) : open.error ? (
        <p className="flex items-start gap-1.5 text-caption text-warning">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
          {t('roadtrip.alt.failed')}
        </p>
      ) : overlays.length < 2 ? (
        // One route back means there is genuinely only one sensible way to drive it.
        <p className="text-caption text-content-muted">{t('roadtrip.alt.onlyOne')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {overlays.map(alt => (
            <button
              key={alt.index}
              type="button"
              onClick={() => onChoose(alt.index)}
              onMouseEnter={() => onHighlight?.(alt.index)}
              onMouseLeave={() => onHighlight?.(null)}
              onFocus={() => onHighlight?.(alt.index)}
              onBlur={() => onHighlight?.(null)}
              className="flex items-center gap-2 rounded-xl border border-edge bg-surface-card px-2.5 py-1.5 text-start transition-colors hover:border-content-faint"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                // theme-lint-disable — the very colour this route is drawn in on the map;
                // a token here would break the one link between list and picture.
                style={{ background: alt.color }}
                aria-hidden
              />
              <span className="flex flex-col">
                <span className="text-caption font-medium tabular-nums text-content">
                  {formatDistance(alt.distance / 1000, distanceUnit)}
                </span>
                <span className="text-caption tabular-nums text-content-muted">
                  {alt.note
                    ? alt.note
                    : t('roadtrip.alt.slower', { time: formatDurationShort(alt.slowerThanQuickest) })}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
