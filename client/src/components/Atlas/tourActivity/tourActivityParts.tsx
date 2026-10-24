import type { TourActivityBasis, TourActivityStatsEntry } from '@trek/shared';
import {
  AlertTriangle,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Footprints,
  Loader2,
  Ruler,
  WifiOff,
} from 'lucide-react';
import { createElement } from 'react';
import { useTranslation } from '../../../i18n';
import { PillSelect } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { FigureBadge } from '../../Tours/paddle/FigureBadge';
import { TourDayRowPill } from '../../Tours/TourDayRowFacts';
import { tourDayRowIcon } from '../../Tours/tourDayRowIcon';
import { typeIcon, typeLabel, type Translate } from './tourActivityReading';
import { periodYear, type ActivityPeriod, type ActivityType } from './tourActivityStatsModel';
import type { TourActivityStats } from './useTourActivityStats';

/** What a period is called in the filter. */
function periodLabel(period: ActivityPeriod, t: Translate): string {
  if (period === 'all') return t('tours.stats.period.all');
  if (period === 'thisYear') return t('tours.stats.period.thisYear');
  if (period === 'last12') return t('tours.stats.period.last12');
  return String(periodYear(period));
}

/** The period and type filters, as head band pills or quiet ones in a panel. */
export function ActivityFilters({ stats, quiet = false }: { stats: TourActivityStats; quiet?: boolean }) {
  const { t } = useTranslation();
  const typeOption = (type: ActivityType) => ({
    value: type,
    label: typeLabel(type, t),
    icon: createElement(typeIcon(type), { size: 12, strokeWidth: 2.2, className: 'flex-none text-content-muted' }),
  });
  return (
    <>
      <PillSelect
        quiet={quiet}
        label={t('tours.stats.period')}
        value={stats.period}
        options={stats.periods.map((period) => ({
          value: period,
          label: periodLabel(period, t),
          icon: <CalendarRange size={12} strokeWidth={2.2} className="flex-none text-content-muted" />,
        }))}
        fallback={{ label: periodLabel(stats.period, t) }}
        onChange={stats.setPeriod}
      />
      <PillSelect
        quiet={quiet}
        label={t('tours.filter.type')}
        value={stats.type}
        options={stats.types.map(typeOption)}
        fallback={typeOption(stats.type)}
        onChange={stats.setType}
      />
    </>
  );
}

/** A distance and a climb as white badges, each named in full by its tooltip; one not known is left out. */
export function MeasurePills({
  distance,
  ascent,
  testId,
}: {
  distance: string | null;
  ascent: string | null;
  /** Prefix of the badges' test ids: `<testId>-distance`, `<testId>-ascent`. */
  testId: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      {distance !== null && (
        <TourDayRowPill
          icon={Ruler}
          value={distance}
          label={`${t('tours.detail.distance')}: ${distance}`}
          testId={`${testId}-distance`}
        />
      )}
      {ascent !== null && (
        <TourDayRowPill
          icon={ArrowUp}
          value={ascent}
          label={`${t('tours.detail.ascent')}: ${ascent}`}
          testId={`${testId}-ascent`}
        />
      )}
    </>
  );
}

/**
 * What the sums rest on, each as a figure badge: how many tours count with
 * their planned values and how many with a recorded track. The planned values
 * are never passed off as measured, so they always say so.
 */
export function BasisBadges({ byBasis }: { byBasis: Record<TourActivityBasis, number> }) {
  const { t } = useTranslation();
  return (
    <>
      {byBasis.plan > 0 && (
        <FigureBadge
          testId="tour-activity-basis-plan"
          label={t('tours.stats.basisPlan')}
          value={String(byBasis.plan)}
          icon={<CalendarDays size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
          info={t('tours.stats.basisPlanHint')}
        />
      )}
      {byBasis.track > 0 && (
        <FigureBadge
          testId="tour-activity-basis-track"
          label={t('tours.stats.basisTrack')}
          value={String(byBasis.track)}
          icon={<Footprints size={10} strokeWidth={2.2} className="flex-none text-success" />}
          info={t('tours.stats.basisTrackCountHint')}
        />
      )}
    </>
  );
}

/** What does not count, said as quiet figure badges: tours still ahead, on no day, on days without a date. */
export function UncountedBadges({
  upcoming,
  unassigned,
  undated,
}: {
  upcoming: number;
  unassigned: number;
  undated: number;
}) {
  const { t } = useTranslation();
  const badges = [
    { key: 'upcoming', value: upcoming, labelKey: 'tours.stats.upcoming', infoKey: 'tours.stats.upcomingHint' },
    {
      key: 'unassigned',
      value: unassigned,
      labelKey: 'tours.stats.unassigned',
      infoKey: 'tours.stats.unassignedHint',
    },
    { key: 'undated', value: undated, labelKey: 'tours.stats.undated', infoKey: 'tours.stats.undatedHint' },
  ];
  return (
    <>
      {badges
        .filter((badge) => badge.value > 0)
        .map((badge) => (
          <FigureBadge
            key={badge.key}
            testId={`tour-activity-${badge.key}`}
            label={t(badge.labelKey)}
            value={String(badge.value)}
            icon={<CalendarClock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
            info={t(badge.infoKey)}
          />
        ))}
    </>
  );
}

/**
 * A tour's type as a round tile; a tour done with a recorded track carries
 * the footprints at its corner, the way a waypoint's number carries its kind.
 */
export function EntryTile({ entry }: { entry: Pick<TourActivityStatsEntry, 'tour_type' | 'basis'> }) {
  const { t } = useTranslation();
  return (
    <Tooltip label={t(`tourTypes.${entry.tour_type}`)}>
      <span className="relative flex-none" aria-label={t(`tourTypes.${entry.tour_type}`)}>
        <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-edge text-content-secondary">
          {createElement(tourDayRowIcon(entry.tour_type), { size: 15, strokeWidth: 1.9 })}
        </span>
        {entry.basis === 'track' && (
          <span
            aria-hidden="true"
            data-testid="tour-activity-track-corner"
            className="absolute -bottom-1 -end-1 grid h-4 w-4 place-items-center rounded-full bg-success-soft text-success ring-2 ring-surface-card"
          >
            <Footprints size={9} strokeWidth={2.6} />
          </span>
        )}
      </span>
    </Tooltip>
  );
}

/**
 * Where the read stands while there is nothing to show yet: on its way, refused
 * offline, or failed with a way to try again.
 */
export function ActivityStatusLine({ stats }: { stats: Pick<TourActivityStats, 'status' | 'retry'> }) {
  const { t } = useTranslation();
  // Not asked yet: the tab has not been shown, so there is nothing to say.
  if (stats.status === 'idle') return null;
  if (stats.status === 'offline')
    return (
      <p className="m-0 flex items-center gap-2 text-content-muted" style={fs(12, 'body')}>
        <WifiOff size={13} strokeWidth={2} className="flex-none" />
        {t('common.needsConnection')}
      </p>
    );
  if (stats.status === 'error')
    return (
      <p role="alert" className="m-0 flex flex-wrap items-center gap-2 text-content-muted" style={fs(12, 'body')}>
        <AlertTriangle size={13} strokeWidth={2} className="flex-none text-warning" />
        {t('tours.stats.unavailable')}
        <button
          type="button"
          onClick={stats.retry}
          className="font-semibold text-content underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t('common.errorRetry')}
        </button>
      </p>
    );
  return (
    <p role="status" className="m-0 flex items-center gap-2 text-content-faint" style={fs(12, 'body')}>
      <Loader2 size={13} strokeWidth={2.2} className="flex-none animate-spin" />
      {t('common.loading')}
    </p>
  );
}
