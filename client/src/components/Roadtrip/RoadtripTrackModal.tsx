import React, { useEffect, useState } from 'react'
import { AlertTriangle, Check, RotateCw, Spline, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import EmptyState from '../shared/EmptyState'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import { FS } from './typeScale'
import type { FollowTrack, TrackChoice } from './useFollowTrack'

/**
 * Picking the track a day drives along.
 *
 * The list is the whole dialog. Everything a traveller needs to tell two imported tracks
 * apart is on the row — the colour the map draws it in, how long it runs, and how far it
 * is from this particular day — and the last of those is why the list is ordered the way
 * it is: a trip carrying every track of a three-week tour still opens on the one beside
 * today's drive.
 *
 * Applying is slow and says so. It is a routing round trip per refinement, half a minute
 * on a long scenic route, and a dialog that went blank for that long would read as broken.
 */

/** A track close enough that it is plainly about this day rather than another one. */
const ON_THIS_DAY_KM = 2

function TrackRow({ track, disabled, onPick }: {
  track: TrackChoice
  disabled: boolean
  onPick: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const onDay = track.gapKm <= ON_THIS_DAY_KM

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-surface-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* The line's own colour, as a short stroke rather than a dot: it is a line on the
            map, and a dot beside a name reads as a place. */}
        <span
          className="h-1 w-6 shrink-0 rounded-full"
          // theme-lint-disable — the colour the track carries, the same one the map draws.
          style={{ background: track.color || 'var(--text-faint)' }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-content" style={{ fontSize: FS.name }}>
            {track.name || t('roadtrip.track.untitled')}
          </span>
          <span className="block truncate tabular-nums text-content-faint" style={{ fontSize: FS.meta }}>
            {t('roadtrip.track.length', { distance: formatDistance(track.lengthKm, distanceUnit) })}
            {' · '}
            {onDay
              ? t('roadtrip.track.onDay')
              : t('roadtrip.track.gap', { distance: formatDistance(track.gapKm, distanceUnit) })}
          </span>
        </span>
      </button>
    </li>
  )
}

export default function RoadtripTrackModal({ follow, dayNumber }: {
  follow: FollowTrack
  /** The day's number, so the dialog says which drive it is about to reshape. */
  dayNumber: number
}): React.ReactElement | null {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [picked, setPicked] = useState<number | null>(null)

  const { dayId, busy, round, error, outcome, tracks, viaCount, current } = follow

  // A track picked on one day means nothing on the next.
  useEffect(() => { setPicked(null) }, [dayId])

  if (dayId === null) return null

  const chosen = tracks.find(track => track.id === picked) ?? null

  return (
    <Modal
      isOpen
      onClose={follow.close}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <Spline size={15} className="text-content-faint" aria-hidden />
          {t('roadtrip.track.title', { number: dayNumber })}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* What the day follows today, before anything is picked. Read back from the day
            rather than remembered from the run that applied it, which is the whole reason
            it is stored: it has to survive a reload. */}
        {current ? (
          <p className="rounded-xl bg-surface-secondary px-3 py-2 text-caption text-content-secondary">
            {t('roadtrip.track.current', { name: current.name })}
          </p>
        ) : null}
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <EmptyState scene="transport" size={96} compact title={t('roadtrip.track.empty')} />
            <p className="text-center text-caption text-content-faint">{t('roadtrip.track.emptyHint')}</p>
          </div>
        ) : (
          <ul className="-mx-2 max-h-[280px] overflow-y-auto">
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                disabled={busy}
                onPick={() => setPicked(track.id === picked ? null : track.id)}
              />
            ))}
          </ul>
        )}

        {/* What the pick will do, before it is done. The count is the honest part: a track
            becomes a dozen waypoints on the day, and a traveller who later wonders where
            they came from should have been told here. */}
        {chosen ? (
          <p className="rounded-xl bg-surface-secondary px-3 py-2 text-caption text-content-secondary">
            {t('roadtrip.track.explain')}
          </p>
        ) : null}

        {busy ? (
          <p className="flex items-center gap-2 text-caption text-content-secondary" role="status">
            <RotateCw size={13} className="animate-spin shrink-0" aria-hidden />
            {t('roadtrip.track.working', { round })}
          </p>
        ) : null}

        {error ? (
          <p className="flex items-start gap-1.5 text-caption text-danger" role="alert">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
            {t(error === 'route' ? 'roadtrip.track.errorRoute' : 'roadtrip.track.errorSave')}
          </p>
        ) : null}

        {outcome && !busy && !error ? (
          <p className="flex items-start gap-1.5 text-caption text-content-secondary" role="status">
            <Check size={13} className="mt-px shrink-0 text-success" aria-hidden />
            {outcome.vias === 0
              ? t('roadtrip.track.already')
              : outcome.capped
                ? t('roadtrip.track.capped', {
                    count: outcome.vias,
                    distance: formatDistance(outcome.strayKm, distanceUnit),
                  })
                : t('roadtrip.track.done', {
                    count: outcome.vias,
                    distance: formatDistance(outcome.strayKm, distanceUnit),
                  })}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          {/* Offered whenever the day carries vias, whether this dialog put them there or
              a dragged handle did: "put it back the way the router had it" is the same
              wish either way. */}
          {viaCount > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => { void follow.clear() }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-caption text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              <Trash2 size={13} aria-hidden />
              {t('roadtrip.track.clear', { count: viaCount })}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!chosen || busy}
            onClick={() => { if (chosen) void follow.apply(chosen.id) }}
            className="ms-auto rounded-lg bg-accent px-3 py-2 text-caption font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t('roadtrip.track.action')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
