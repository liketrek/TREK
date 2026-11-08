import { AlertTriangle, Check, RotateCw, Spline } from 'lucide-react';
import { useState } from 'react';
import type { FollowTrackOutcome } from '../../../../components/Roadtrip/useFollowTrack';
import { useIsWide } from '../../../../hooks/sizeClass';
import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import { formatDistance } from '../../../../utils/units';
import MSheet from '../../../components/MSheet';
import type { MTripSheetsProps } from '../MTripShell';
import { SHEET_PRIMARY, SHEET_SECONDARY, TileHeader } from '../sheets/MTripSheetUi';

/**
 * Which imported track a day drives along, on an iPad or an unfolded Duo.
 *
 * The desktop's track dialog (RoadtripTrackModal) as a sheet, over the same `followTrack`
 * of the planner: it lists the trip's tracks nearest to the day first, fits the drive to
 * the one picked with via points, and drops those vias again. The phone has no entry to
 * it; the stage there stays a plan read on the road, and reshaping a whole day's drive
 * is work for the larger screen. The sheet opens when the planner's `followTrack` has a
 * day, which only the large screen's stage card asks for.
 */

/** Within this many kilometres a track counts as running along the day. */
const ON_THIS_DAY_KM = 2;

/** The sentence for a finished fit: nothing to do, as close as asked, or as close as it got. */
function outcomeKey(outcome: FollowTrackOutcome): string {
  if (outcome.vias === 0) return 'roadtrip.track.already';
  return outcome.capped ? 'roadtrip.track.capped' : 'roadtrip.track.done';
}

const NOTE = 'font-geist text-caption leading-snug';

/**
 * The stage card's way into the sheet, on a large screen only: the track the day follows,
 * or the offer to follow one. Absent on the phone, for a day not stored yet, for a trip
 * without tracks (its only answer would be "no tracks") and for a reader who may not edit
 * days, since following a track writes via points onto the day.
 */
export function MRtTrackEntry({ planner, dayId }: { planner: MTripSheetsProps['planner']; dayId: number }) {
  const { t } = useTranslation();
  const large = useIsWide();
  const follow = planner.followTrack;
  if (!large || dayId < 0 || !follow.available || !planner.can('day_edit', planner.trip)) return null;
  const name = follow.namesByDay[dayId];
  return (
    <button
      type="button"
      onClick={() => follow.open(dayId)}
      className="mt-2.5 flex min-h-10 w-full items-center gap-2 rounded-[13px] bg-[color:var(--m-ic)] px-3 py-2 text-start"
    >
      <Spline size={15} strokeWidth={1.9} className="flex-none text-m-muted" aria-hidden />
      <span dir="auto" className="min-w-0 flex-1 truncate text-caption font-semibold text-m-ink">
        {name ? t('roadtrip.track.current', { name }) : t('roadtrip.track.hint')}
      </span>
    </button>
  );
}

export default function MRtTrackSheet({ planner }: MTripSheetsProps) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit);
  const large = useIsWide();
  const follow = planner.followTrack;
  const { dayId, busy, round, error, outcome, tracks, viaCount, current } = follow;
  // The pick belongs to the day it was made on: a track picked on one day means nothing
  // on the next, so it is kept together with that day and read only while they match.
  const [pick, setPick] = useState<{ dayId: number; trackId: number } | null>(null);
  const picked = pick && pick.dayId === dayId ? pick.trackId : null;
  const chosen = tracks.find((track) => track.id === picked) ?? null;
  const open = large && dayId !== null;
  const dayNumber = planner.roadtripRoutes.days.find((d) => d.dayId === dayId)?.dayNumber ?? 0;

  return (
    <MSheet
      open={open}
      onClose={follow.close}
      variant="bottom"
      material="glass"
      ariaLabel={t('roadtrip.track.title', { number: dayNumber })}
    >
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<Spline size={19} strokeWidth={1.8} />}
          title={<span className="truncate">{t('roadtrip.track.title', { number: dayNumber })}</span>}
          sub={current ? t('roadtrip.track.current', { name: current.name }) : undefined}
          subWrap
          onClose={follow.close}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="m-scroll-fade mt-2 min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-[14px]">
        {tracks.length === 0 ? (
          <div className="rounded-[16px] bg-[color:var(--m-ic)] px-4 py-5 text-center">
            <div className="text-body font-semibold text-m-ink">{t('roadtrip.track.empty')}</div>
            <p className={`mt-1 ${NOTE} text-m-faint`}>{t('roadtrip.track.emptyHint')}</p>
          </div>
        ) : (
          <ul
            className="m-0 flex list-none flex-col gap-1 rounded-[16px] bg-[color:var(--m-ic)] p-1.5"
            data-testid="rt-track-list"
          >
            {tracks.map((track) => {
              const on = track.id === picked;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    disabled={busy}
                    aria-pressed={on}
                    onClick={() => setPick(on || dayId === null ? null : { dayId, trackId: track.id })}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-[12px] px-3 py-2 text-start disabled:opacity-50 ${
                      on ? 'bg-[color:var(--m-card)] ring-1 ring-[color:var(--m-cbr)]' : ''
                    }`}
                  >
                    {/* The line's own colour as a short stroke: it is a line on the map. */}
                    <span
                      className="h-1 w-6 flex-none rounded-full"
                      style={{ background: track.color || 'var(--m-faint)' }}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span dir="auto" className="truncate text-body font-semibold text-m-ink">
                        {track.name || t('roadtrip.track.untitled')}
                      </span>
                      <span className={`${NOTE} text-m-faint`}>
                        {t('roadtrip.track.length', { distance: formatDistance(track.lengthKm, unit) })}
                        {' · '}
                        {track.gapKm <= ON_THIS_DAY_KM
                          ? t('roadtrip.track.onDay')
                          : t('roadtrip.track.gap', { distance: formatDistance(track.gapKm, unit) })}
                      </span>
                    </span>
                    {on && <Check size={16} className="flex-none text-m-ink" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* What the pick will do, before it is done: a track becomes via points on the day. */}
        {chosen && <p className={`mt-2.5 ${NOTE} text-m-muted`}>{t('roadtrip.track.explain')}</p>}

        {busy && (
          <p role="status" className={`mt-2.5 flex items-center gap-2 ${NOTE} text-m-muted`}>
            <RotateCw size={13} className="flex-none animate-spin" aria-hidden />
            {t('roadtrip.track.working', { round })}
          </p>
        )}

        {error && (
          <p role="alert" className={`mt-2.5 flex items-start gap-1.5 ${NOTE} text-danger`}>
            <AlertTriangle size={13} className="mt-0.5 flex-none" aria-hidden />
            {t(error === 'route' ? 'roadtrip.track.errorRoute' : 'roadtrip.track.errorSave')}
          </p>
        )}

        {outcome && !busy && !error && (
          <p role="status" className={`mt-2.5 flex items-start gap-1.5 ${NOTE} text-m-muted`}>
            <Check size={13} className="mt-0.5 flex-none" aria-hidden />
            {t(outcomeKey(outcome), { count: outcome.vias, distance: formatDistance(outcome.strayKm, unit) })}
          </p>
        )}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        {/* Whenever the day carries vias, whoever put them there: back to the router's way. */}
        {viaCount > 0 && (
          <button type="button" disabled={busy} onClick={() => void follow.clear()} className={SHEET_SECONDARY}>
            {t('roadtrip.track.clear', { count: viaCount })}
          </button>
        )}
        <button
          type="button"
          disabled={!chosen || busy}
          onClick={() => {
            if (chosen) void follow.apply(chosen.id);
          }}
          className={`ms-auto ${SHEET_PRIMARY}`}
        >
          {t('roadtrip.track.action')}
        </button>
      </div>
    </MSheet>
  );
}
