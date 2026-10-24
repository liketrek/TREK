import type { TourActivityTotals, TourTypeKey } from '@trek/shared';
import { Footprints } from 'lucide-react';
import { createElement, useId } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { InfoDot, TourFactFields, type TourMetricField } from '../../Tours/tourParts';
import { TourActivityEntryRow } from './TourActivityEntryRow';
import { ActivityFilters, ActivityStatusLine, BasisBadges, MeasurePills, UncountedBadges } from './tourActivityParts';
import { distanceReading, heightReading, partialHint, typeIcon, useDistanceUnit } from './tourActivityReading';
import type { TourActivityStats } from './useTourActivityStats';

type Translate = (key: string, params?: Record<string, unknown>) => string;

/** The sums as labelled fields; a sum nobody knows is left out, a short one says at least and why. */
function totalFields(totals: TourActivityTotals, unit: DistanceUnit, t: Translate): TourMetricField[] {
  const fields: TourMetricField[] = [{ label: t('tours.mode.tours'), value: String(totals.count) }];
  const sums = [
    { label: t('tours.detail.distance'), sum: totals.distanceKm, reading: distanceReading(totals, unit) },
    { label: t('tours.detail.ascent'), sum: totals.ascentM, reading: heightReading(totals.ascentM, unit) },
    { label: t('tours.detail.descent'), sum: totals.descentM, reading: heightReading(totals.descentM, unit) },
  ];
  for (const { label, sum, reading } of sums) {
    if (!reading) continue;
    const info = reading.partial ? { label, description: partialHint(sum, t) } : undefined;
    fields.push({ label, value: reading.text, info });
  }
  return fields;
}

/** One type of the period: its icon with how many tours at the corner, its name, its distance and climb. */
function TypeLine({ type, totals }: { type: TourTypeKey; totals: TourActivityTotals }) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const distance = distanceReading(totals, unit);
  const ascent = heightReading(totals.ascentM, unit);
  return (
    <li className="flex min-w-0 items-center gap-3 py-1" data-testid={`tour-activity-type-${type}`}>
      <span className="relative flex-none">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-edge text-content-secondary">
          {createElement(typeIcon(type), { size: 14, strokeWidth: 1.9 })}
        </span>
        <span
          aria-hidden="true"
          className="absolute -end-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-surface-card px-1 font-geist font-semibold tabular-nums text-content shadow-sm ring-1 ring-edge-faint"
          style={fs(9)}
        >
          {totals.count}
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(12.5, 'body')}>
        {t(`tourTypes.${type}`)}
        <span className="sr-only">{`: ${t('tours.mode.tours')} ${totals.count}`}</span>
      </span>
      <span className="flex flex-none items-center gap-1.5">
        <MeasurePills
          distance={distance?.text ?? null}
          ascent={ascent?.text ?? null}
          testId={`tour-activity-type-${type}`}
        />
      </span>
    </li>
  );
}

/** The sums, what they rest on, the split by type, and every tour of the period with its switch. */
function StatsBody({ stats }: { stats: TourActivityStats }) {
  const { t } = useTranslation();
  const unit = useDistanceUnit();
  const { summary, data } = stats;
  if (!summary || !data) return <ActivityStatusLine stats={stats} />;
  const showTypes = stats.type === 'all' && summary.types.length > 1;
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <TourFactFields fields={totalFields(summary.totals, unit, t)} />
        <div className="flex flex-wrap items-center gap-1.5">
          <BasisBadges byBasis={summary.totals.byBasis} />
          <UncountedBadges upcoming={summary.upcoming} {...data.uncounted} />
          <InfoDot label={t('tours.stats.title')} description={t('tours.stats.basisInfo')} />
        </div>
      </div>
      {showTypes && (
        <DialogSection label={t('tours.stats.byType')}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {summary.types.map(({ type, ...totals }) => (
              <TypeLine key={type} type={type} totals={totals} />
            ))}
          </ul>
        </DialogSection>
      )}
      <DialogSection
        label={t('tours.mode.tours')}
        action={
          <span className="font-geist tabular-nums text-content-faint" style={fs(11)}>
            {summary.done.length}
          </span>
        }
      >
        {summary.done.length === 0 ? (
          <p className="m-0 py-4 text-center text-content-muted" style={fs(12.5, 'body')}>
            {t(data.entries.length === 0 ? 'tours.stats.empty' : 'tours.stats.none')}
          </p>
        ) : (
          <ul className="-mx-2.5 my-0 flex list-none flex-col gap-0.5 p-0" data-testid="tour-activity-list">
            {summary.done.map((entry) => (
              <TourActivityEntryRow
                key={entry.track ? `${entry.place_id}-${entry.track.place_id}` : entry.place_id}
                entry={entry}
                busy={stats.pending.has(entry.place_id)}
                onToggleExcluded={(target) => void stats.setExcluded(target, !target.excluded)}
              />
            ))}
          </ul>
        )}
      </DialogSection>
    </>
  );
}

/**
 * STA-02: the user's tour activities in full, opened from the Atlas: the
 * period and type on the head band, the sums with what they rest on, the
 * split by type, and every tour done in the period, each one able to be left
 * out (a tour that fell through) and counted again without touching its plan.
 */
export function TourActivityStatsDialog({
  stats,
  open,
  onClose,
}: {
  stats: TourActivityStats;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      labelledBy={labelId}
      width="editor"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Footprints size={20} strokeWidth={2} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('tours.stats.title')}
          sub={t('tours.stats.sub')}
          subWraps
          pills={<ActivityFilters stats={stats} />}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.close')}</DialogButton>
        </DialogFooter>
      }
    >
      <StatsBody stats={stats} />
    </DialogShell>
  );
}
