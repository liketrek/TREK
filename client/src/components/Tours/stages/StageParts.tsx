import type { TourListItem } from '@trek/shared';
import { ArrowDown, ArrowRight, ArrowUp, Clock, Moon, Ruler, Sunrise, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance, formatElevation } from '../../../utils/units';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { formatPlannedTourDuration } from '../tourPresentation';
import type { TourStage } from './tourStages';

/**
 * MDT-01: the moon at the corner of a stop's number where a stage ends, the
 * night between two days of the tour; the map pin carries it at the same corner.
 */
export function StageEndCorner() {
  return (
    <span
      aria-hidden="true"
      data-waypoint-stage-end="true"
      className="absolute -bottom-1 -end-1 grid h-4 w-4 place-items-center rounded-full bg-accent text-accent-text ring-2 ring-[color:var(--bg-card)]"
    >
      <Moon size={9} strokeWidth={2.6} />
    </span>
  );
}

/**
 * A stage by its number, in the accent: the one strong mark of a stage
 * wherever it is named. Its sunrise opens the day, as the moon at its last
 * stop closes it.
 */
export function StagePill({ number }: { number: number }) {
  const { t } = useTranslation();
  return (
    <span
      data-stage-pill={number}
      className="inline-flex h-[22px] flex-none items-center gap-1 whitespace-nowrap rounded-full bg-accent pe-2.5 ps-2 font-semibold text-accent-text"
      style={fs(11, 'body')}
    >
      <Sunrise size={11} strokeWidth={2.4} aria-hidden="true" />
      {t('tours.stages.stage', { number })}
    </span>
  );
}

/** A stage's number as the list numbers a stop, with the moon at its corner where a night follows. */
function StageNumber({ number, night }: { number: number; night: boolean }) {
  return (
    <span
      className="relative grid h-7 w-7 flex-none place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content"
      style={fs(11.5)}
    >
      {number}
      {night && <StageEndCorner />}
    </span>
  );
}

/**
 * What a stage measures, as the plan's white badges: its distance, climb and
 * descent where the route has heights, and its moving time. A time over a day
 * turns to the warning tone and says why. Nothing the route does not tell is
 * shown: an unknown value leaves its badge out rather than guess.
 */
export function StageMetricBadges({
  stage,
  compact = false,
  align = 'start',
  unmeasured,
}: {
  stage: TourStage;
  /** Distance and time only, for the narrow head of a stage in the list of points. */
  compact?: boolean;
  align?: 'start' | 'end';
  /** Said instead, where the route tells nothing about the stage yet (MDT-02). */
  unmeasured?: ReactNode;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const icon = (Icon: LucideIcon) => <Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />;
  const known = [stage.distanceKm, stage.gain, stage.loss, stage.minutes].some((value) => value !== null);
  if (!known && unmeasured) return <>{unmeasured}</>;
  return (
    <span className={`flex min-w-0 flex-wrap items-center gap-1 ${align === 'end' ? 'justify-end' : 'justify-start'}`}>
      {stage.distanceKm !== null && (
        <WhiteBadge icon={icon(Ruler)}>{formatDistance(stage.distanceKm, unit)}</WhiteBadge>
      )}
      {!compact && stage.gain !== null && (
        <WhiteBadge icon={icon(ArrowUp)}>{formatElevation(stage.gain, unit)}</WhiteBadge>
      )}
      {!compact && stage.loss !== null && (
        <WhiteBadge icon={icon(ArrowDown)}>{formatElevation(stage.loss, unit)}</WhiteBadge>
      )}
      {stage.minutes !== null && (
        <Tooltip label={t(stage.overDay ? 'tours.stages.overDay' : 'tours.stages.timeInfo')}>
          <span data-stage-over-day={stage.overDay || undefined} className="inline-flex">
            {stage.overDay ? (
              <SoftPill tone="warning" icon={<Clock size={10} strokeWidth={2.2} className="flex-none" />}>
                {formatPlannedTourDuration(stage.minutes)}
              </SoftPill>
            ) : (
              <WhiteBadge icon={icon(Clock)}>{formatPlannedTourDuration(stage.minutes)}</WhiteBadge>
            )}
          </span>
        </Tooltip>
      )}
    </span>
  );
}

/**
 * A stage at a glance: its number (with the moon where a night follows), the
 * stops it runs from and to, and what it measures. The planner's overview and
 * the list's (MDT-02) show a stage alike.
 */
export function StageSummary({
  stage,
  night,
  from,
  to,
  unmeasured,
}: {
  stage: TourStage;
  night: boolean;
  from: string;
  to: string;
  unmeasured?: ReactNode;
}) {
  return (
    <>
      <StageNumber number={stage.number} night={night} />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span
          className="flex w-full min-w-0 items-center gap-1 font-semibold leading-tight text-content"
          style={fs(12.5, 'body')}
        >
          <span className="min-w-0 truncate">{from}</span>
          <ArrowRight
            size={12}
            strokeWidth={2.2}
            aria-hidden="true"
            className="flex-none text-content-faint rtl:rotate-180"
          />
          <span className="min-w-0 truncate">{to}</span>
        </span>
        <StageMetricBadges stage={stage} unmeasured={unmeasured} />
      </span>
    </>
  );
}

/**
 * The head of a stage in the list of points, where the stage begins: its pill,
 * a hairline, and what it measures. The rows of its points follow; the stop
 * that ends it carries the moon on its number.
 */
export function StageDivider({ stage }: { stage: TourStage }) {
  return (
    <li
      data-testid="tour-stage-divider"
      data-stage={stage.number}
      className="flex min-w-0 items-center gap-2 px-1.5 pb-1 pt-2.5 first:pt-0.5"
    >
      <StagePill number={stage.number} />
      <span aria-hidden="true" className="h-px min-w-3 flex-1 bg-edge-faint" />
      <StageMetricBadges stage={stage} compact align="end" />
    </li>
  );
}

/**
 * MDT-02: how many stages a multi-day tour has, as a small moon with the
 * number beside it, in the corner of what it sits on. Its words are said by
 * whatever carries it.
 */
export function StageCountCorner({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      data-testid="tour-stages-count"
      className="pointer-events-none absolute -end-1.5 -top-1 inline-flex h-3.5 items-center gap-px rounded-full bg-accent px-1 font-geist font-semibold tabular-nums leading-none text-accent-text"
      style={fs(9)}
    >
      <Moon size={7} strokeWidth={2.6} />
      {count}
    </span>
  );
}

/**
 * MDT-01: a multi-day tour in a list says how many stages it has: a moon with
 * the count at its corner, beside the row rather than in its line of badges,
 * so it is always in sight and never pushes the days it is on out of it. A row
 * that unfolds its stages carries the count on its fold button instead.
 */
export function TourStagesBadge({ tour }: { tour: Pick<TourListItem, 'stage_count'> }) {
  const { t } = useTranslation();
  if (!tour.stage_count) return null;
  const label = t('tours.stages.count', { count: tour.stage_count });
  return (
    <Tooltip label={label}>
      <span
        data-testid="tour-stages-badge"
        role="img"
        aria-label={label}
        className="relative grid h-6 w-6 flex-none place-items-center text-content-faint"
      >
        <Moon size={13} strokeWidth={2.2} aria-hidden="true" />
        <StageCountCorner count={tour.stage_count} />
      </span>
    </Tooltip>
  );
}
