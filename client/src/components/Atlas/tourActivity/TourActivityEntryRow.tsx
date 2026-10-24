import type { TourActivityStatsEntry } from '@trek/shared';
import { Ban, Briefcase, CalendarDays, Footprints, Loader2, Repeat, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../i18n';
import { formatDate } from '../../../utils/formatters';
import { formatDistance, formatElevation } from '../../../utils/units';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { EntryTile, MeasurePills } from './tourActivityParts';
import { useDistanceUnit } from './tourActivityReading';

const ROW_BADGE_ICON = 'flex-none text-content-faint';

/** What the entry's values rest on, as a pill: the plan, or the track that replaced it, named in the tooltip. */
function BasisPill({ entry }: { entry: TourActivityStatsEntry }) {
  const { t } = useTranslation();
  const track = entry.basis === 'track';
  const hint = track
    ? t('tours.stats.basisTrackHint', { name: entry.track?.name ?? '' })
    : t('tours.stats.basisPlanHint');
  return (
    <Tooltip label={hint}>
      <span
        className="inline-flex"
        aria-label={hint}
        data-testid={`tour-activity-basis-${entry.basis}-${entry.place_id}`}
      >
        <SoftPill
          tone={track ? 'success' : 'neutral'}
          icon={
            track ? (
              <Footprints size={10} strokeWidth={2.2} className="flex-none" />
            ) : (
              <CalendarDays size={10} strokeWidth={2.2} className={ROW_BADGE_ICON} />
            )
          }
        >
          {t(track ? 'tours.stats.basisTrack' : 'tours.stats.basisPlan')}
        </SoftPill>
      </span>
    </Tooltip>
  );
}

/** The day it counts on, the trip it is in (a way into that trip), and how many days the plan has it on. */
function EntryFacts({ entry }: { entry: TourActivityStatsEntry }) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  return (
    <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
      <WhiteBadge icon={<CalendarDays size={10} strokeWidth={2.2} className={ROW_BADGE_ICON} />}>
        {formatDate(entry.date, locale) ?? entry.date}
      </WhiteBadge>
      <Tooltip label={t('tours.stats.openTrip')}>
        <button
          type="button"
          onClick={() => void navigate(`/trips/${entry.trip.id}`)}
          className="inline-flex min-w-0 max-w-[220px] rounded-full transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <WhiteBadge
            className="min-w-0 max-w-full"
            icon={<Briefcase size={10} strokeWidth={2.2} className={ROW_BADGE_ICON} />}
          >
            <span className="truncate">{entry.trip.title}</span>
          </WhiteBadge>
        </button>
      </Tooltip>
      {entry.day_count > 1 && (
        <Tooltip label={t('tours.stats.multiDayHint')}>
          <span className="inline-flex" aria-label={t('tours.stats.multiDayHint')}>
            <WhiteBadge icon={<Repeat size={10} strokeWidth={2.2} className={ROW_BADGE_ICON} />}>
              {entry.day_count}
            </WhiteBadge>
          </span>
        </Tooltip>
      )}
      <BasisPill entry={entry} />
      {entry.excluded && <SoftPill caps>{t('tours.stats.excluded')}</SoftPill>}
    </span>
  );
}

/** The round button that leaves the tour out, or counts it again; named by its tooltip. */
function ExcludeToggle({
  entry,
  busy,
  onToggle,
}: {
  entry: TourActivityStatsEntry;
  busy: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const label = entry.excluded ? t('tours.stats.include') : t('tours.stats.exclude');
  const hint = entry.excluded ? label : `${label}: ${t('tours.stats.excludeHint')}`;
  let icon = <Ban size={14} strokeWidth={2} />;
  if (busy) icon = <Loader2 size={14} strokeWidth={2} className="animate-spin" />;
  else if (entry.excluded) icon = <RotateCcw size={14} strokeWidth={2} />;
  return (
    <Tooltip label={hint}>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-label={label}
        aria-pressed={entry.excluded}
        data-testid={`tour-activity-toggle-${entry.place_id}`}
        className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50"
      >
        {icon}
      </button>
    </Tooltip>
  );
}

/**
 * STA-02: one tour of the user's activities: its type, name and where it
 * counts, its distance and climb, and the switch to leave it out. A tour left
 * out stays in the list, dimmed, so it can be counted again in place.
 */
export function TourActivityEntryRow({
  entry,
  busy,
  onToggleExcluded,
}: {
  entry: TourActivityStatsEntry;
  busy: boolean;
  onToggleExcluded: (entry: TourActivityStatsEntry) => void;
}) {
  const unit = useDistanceUnit();
  const key = entry.track ? `${entry.place_id}-${entry.track.place_id}` : String(entry.place_id);
  return (
    <li
      data-testid={`tour-activity-row-${key}`}
      className="flex min-w-0 items-center gap-3 rounded-[12px] px-2.5 py-2 transition-colors hover:bg-surface-hover"
    >
      <span
        className={`flex min-w-0 flex-1 items-center gap-3 transition-opacity ${entry.excluded ? 'opacity-50' : ''}`}
      >
        <EntryTile entry={entry} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>
            {entry.name}
          </span>
          <EntryFacts entry={entry} />
        </span>
        <span className="flex flex-none flex-col items-end gap-1">
          <MeasurePills
            distance={entry.distance_km === null ? null : formatDistance(entry.distance_km, unit)}
            ascent={entry.ascent_m === null ? null : formatElevation(entry.ascent_m, unit)}
            testId={`tour-activity-${key}`}
          />
        </span>
      </span>
      <ExcludeToggle entry={entry} busy={busy} onToggle={() => onToggleExcluded(entry)} />
    </li>
  );
}
