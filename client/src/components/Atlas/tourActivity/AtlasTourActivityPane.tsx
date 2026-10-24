import type { TourActivitySummary } from '@trek/shared';
import { Footprints, ListOrdered } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { CardAction, InfoDot } from '../../Tours/tourParts';
import { ActivityFilters, ActivityStatusLine, BasisBadges, UncountedBadges } from './tourActivityParts';
import { distanceReading, heightReading, typeIcon, typeLabel, useDistanceUnit } from './tourActivityReading';
import { TourActivityStatsDialog } from './TourActivityStatsDialog';
import { splitMeasure } from './tourActivityStatsModel';
import { useTourActivityStats, type TourActivityStats } from './useTourActivityStats';

/** The wash the hero tile sits on, as the Atlas numbers do: the text colour, faintly, over the glass. */
const HERO_TINT = 'color-mix(in srgb, var(--text-primary) 7%, transparent)';
/** How many types the strip names before the dialog takes over. */
const STRIP_TYPES = 3;
const EYEBROW = 'mt-1.5 whitespace-nowrap font-semibold uppercase tracking-wide text-content-faint';

function Divider() {
  return <span aria-hidden="true" className="mx-3 my-3 w-0.5 flex-none rounded-full bg-edge-faint" />;
}

/**
 * The distance of the period, large, with how many tours at its corner; the
 * tour count stands in when no tour knows its distance.
 */
function Hero({ summary, unit }: { summary: TourActivitySummary; unit: DistanceUnit }) {
  const { t } = useTranslation();
  const reading = distanceReading(summary.totals, unit);
  const shown = reading ? splitMeasure(reading.text) : { value: String(summary.totals.count), unit: '' };
  const countLabel = `${t('tours.mode.tours')}: ${summary.totals.count}`;
  return (
    <div
      className="relative mx-2 my-2 flex flex-col justify-center rounded-xl px-5 py-4"
      style={{ background: HERO_TINT }}
    >
      <div className="flex items-baseline gap-1.5" data-testid="atlas-tour-activity-distance">
        <span className="font-black tabular-nums leading-none text-content" style={fs(40, 'title')}>
          {shown.value}
        </span>
        {shown.unit && (
          <span className="font-medium text-content-muted" style={fs(14, 'body')}>
            {shown.unit}
          </span>
        )}
      </div>
      <span className={EYEBROW} style={fs(9)}>
        {reading ? t('tours.detail.distance') : t('tours.mode.tours')}
      </span>
      {reading && (
        <Tooltip label={countLabel}>
          <span
            aria-label={countLabel}
            data-testid="atlas-tour-activity-count"
            className="absolute -end-2 -top-2 inline-flex h-[22px] items-center gap-1 rounded-full bg-surface-card px-2 font-geist font-semibold tabular-nums text-content shadow-sm ring-1 ring-inset ring-edge-faint"
            style={fs(11)}
          >
            <Footprints size={11} strokeWidth={2.2} className="flex-none text-content-muted" />
            {summary.totals.count}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

/** A height sum as the Atlas numbers stand: the value, its unit, and what it is below. */
function Figure({ label, text, testId }: { label: string; text: string; testId: string }) {
  const { value, unit } = splitMeasure(text);
  return (
    <div className="flex flex-none flex-col items-center justify-center px-3 py-4" data-testid={testId}>
      <span className="flex items-baseline gap-1">
        <span className="font-black tabular-nums leading-none text-content" style={fs(24, 'subtitle')}>
          {value}
        </span>
        <span className="font-medium text-content-muted" style={fs(11, 'body')}>
          {unit}
        </span>
      </span>
      <span className={EYEBROW} style={fs(9)}>
        {label}
      </span>
    </div>
  );
}

/** The types of the period, the most tours first: each an icon with its count at the corner, its distance below. */
function TypeColumns({ summary, unit }: { summary: TourActivitySummary; unit: DistanceUnit }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-none items-center gap-4 px-2 py-3">
      {summary.types.slice(0, STRIP_TYPES).map((scope) => {
        const Icon = typeIcon(scope.type);
        const distance = distanceReading(scope, unit);
        const label = `${typeLabel(scope.type, t)}: ${scope.count}${distance ? `, ${distance.text}` : ''}`;
        return (
          <Tooltip key={scope.type} label={label}>
            <span
              aria-label={label}
              className="flex flex-col items-center gap-1.5"
              data-testid={`atlas-tour-activity-type-${scope.type}`}
            >
              <span className="relative">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-card text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint">
                  <Icon size={15} strokeWidth={1.9} />
                </span>
                <span
                  className="absolute -end-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-geist font-semibold tabular-nums text-accent-text ring-2 ring-surface-card"
                  style={fs(9)}
                >
                  {scope.count}
                </span>
              </span>
              {distance && (
                <span
                  className="whitespace-nowrap font-semibold tabular-nums text-content-secondary"
                  style={fs(11, 'body')}
                >
                  {distance.text}
                </span>
              )}
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** What the sums rest on, what does not count, and the way into the full list. */
interface StripProps {
  stats: TourActivityStats;
  summary: TourActivitySummary;
  onOpen: () => void;
}

function SideColumn({ stats, summary, onOpen }: StripProps) {
  const { t } = useTranslation();
  const uncounted = stats.data?.uncounted ?? { unassigned: 0, undated: 0 };
  return (
    <div className="flex flex-none flex-col items-start justify-center gap-1.5 px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <BasisBadges byBasis={summary.totals.byBasis} />
        <InfoDot label={t('tours.stats.title')} description={t('tours.stats.basisInfo')} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <UncountedBadges upcoming={summary.upcoming} {...uncounted} />
      </div>
      {summary.done.length > 0 && (
        <CardAction icon={<ListOrdered size={13} strokeWidth={2.2} />} onClick={onOpen}>
          {t('tours.stats.showTours')}
        </CardAction>
      )}
    </div>
  );
}

/** The numbers of the period, or why there are none, with the filters before them. */
function Strip({ stats, summary, onOpen }: StripProps) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const ascent = heightReading(summary.totals.ascentM, unit);
  const descent = heightReading(summary.totals.descentM, unit);
  const counted = summary.totals.count > 0;
  return (
    <>
      <div className="flex flex-none flex-col items-start justify-center gap-1.5 px-3 py-3">
        <ActivityFilters stats={stats} quiet />
      </div>
      {counted ? (
        <>
          <Hero summary={summary} unit={unit} />
          {ascent && <Figure label={t('tours.detail.ascent')} text={ascent.text} testId="atlas-tour-activity-ascent" />}
          {descent && (
            <Figure label={t('tours.detail.descent')} text={descent.text} testId="atlas-tour-activity-descent" />
          )}
          {stats.type === 'all' && summary.types.length > 1 && (
            <>
              <Divider />
              <TypeColumns summary={summary} unit={unit} />
            </>
          )}
        </>
      ) : (
        <p className="m-0 flex max-w-[260px] items-center px-4 py-5 text-content-muted" style={fs(12, 'body')}>
          {t(stats.data?.entries.length ? 'tours.stats.none' : 'tours.stats.empty')}
        </p>
      )}
      <Divider />
      <SideColumn stats={stats} summary={summary} onOpen={onOpen} />
    </>
  );
}

/**
 * STA-02: the Atlas tab of the user's own tour activities: the period and type,
 * the distance done with how many tours at its corner, the climb, the types,
 * and what the numbers rest on (the trip planning, or recorded tracks where
 * linked). The full list, where a tour can be left out, opens in a dialog. The
 * read waits until the tab is first shown.
 */
export function AtlasTourActivityPane({ active, maxWidth }: { active: boolean; maxWidth?: number }) {
  const stats = useTourActivityStats(active);
  const [open, setOpen] = useState(false);
  return (
    <div
      className="flex w-full items-stretch justify-center overflow-x-auto px-2"
      style={{ maxWidth }}
      data-testid="atlas-tour-activity"
    >
      {stats.summary ? (
        <Strip stats={stats} summary={stats.summary} onOpen={() => setOpen(true)} />
      ) : (
        <div className="flex items-center px-6 py-5">
          <ActivityStatusLine stats={stats} />
        </div>
      )}
      <TourActivityStatsDialog stats={stats} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
