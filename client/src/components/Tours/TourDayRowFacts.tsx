import type { TourListItem } from '@trek/shared';
import { ArrowUp, Clock, Pause, Ruler, type LucideIcon } from 'lucide-react';
import { createElement, useId, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { WhiteBadge } from '../Planner/planParts';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { paddleCheckFact } from './paddle/paddleCheckModel';
import { tourDayRowIcon } from './tourDayRowIcon';
import { movingTimeLabel } from './tourFacts';
import { formatPlannedTourDuration, tourPlannedTimes } from './tourPresentation';

export function TourDayRowIcon({ type, size = 27 }: { type: string; size?: number }) {
  const { t } = useTranslation();
  const known = ['hike', 'bike', 'walk', 'kayak'].includes(type);
  return (
    <span
      data-testid="plan-tour-icon"
      aria-label={known ? t(`tourTypes.${type}`) : t('tours.mode.tours')}
      className="grid flex-none place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      {createElement(tourDayRowIcon(type), { size: Math.round(size * 0.6), 'aria-hidden': 'true' })}
    </span>
  );
}

function Fact({
  icon: Icon,
  value,
  label,
  testId,
  mobile,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  testId: string;
  mobile: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex max-w-full">
      <Tooltip label={label}>
        <button
          type="button"
          data-testid={testId}
          aria-label={label}
          aria-expanded={open}
          aria-controls={id}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => !current);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') setOpen(false);
          }}
          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-caption tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${mobile ? 'bg-[color:var(--m-ic)] text-m-muted' : 'bg-surface-card text-content-secondary'}`}
        >
          <Icon size={11} aria-hidden="true" />
          {value}
        </button>
      </Tooltip>
      <span
        id={id}
        hidden={!open}
        role="note"
        className={`absolute start-0 top-full z-30 mt-1 w-40 whitespace-normal rounded-[6px] border p-2 text-caption shadow-sm ${mobile ? 'bg-[color:var(--m-ic)] text-m-ink' : 'border-edge bg-surface-card text-content'}`}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * A tour's tile in the day plan and in its detail: the T-scale grade in a round
 * tile, the same tile the tour lists use, so a tour reads alike wherever it
 * shows. A GPX import has no grade and shows its type's icon instead.
 */
export function TourDayRowAvatar({
  tour,
  size = 32,
}: {
  tour: Pick<TourListItem, 'tour_type' | 'max_hiking_difficulty'>;
  size?: number;
}) {
  const { t } = useTranslation();
  const level = tour.max_hiking_difficulty;
  const known = ['hike', 'bike', 'walk', 'kayak'].includes(tour.tour_type);
  const label =
    level != null
      ? t(`tours.planner.difficulty.t${level}`)
      : known
        ? t(`tourTypes.${tour.tour_type}`)
        : t('tours.mode.tours');
  return (
    <span
      data-testid="plan-tour-icon"
      role="img"
      aria-label={label}
      className="grid flex-none place-items-center rounded-full bg-edge font-geist font-semibold tabular-nums text-content"
      style={{ width: size, height: size, ...fs(size >= 44 ? 17 : 12, 'body') }}
    >
      {level != null
        ? `T${level}`
        : createElement(tourDayRowIcon(tour.tour_type), {
            size: Math.round(size * 0.46),
            strokeWidth: 1.9,
            className: 'text-content-secondary',
            'aria-hidden': 'true',
          })}
    </span>
  );
}

/** One fact of a tour as the white badge a place's time sits in, named by its tooltip. */
export function TourDayRowPill({
  icon: Icon,
  value,
  label,
  testId,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  testId: string;
}) {
  return (
    <Tooltip label={label}>
      <span data-testid={testId} aria-label={label} className="inline-flex">
        <WhiteBadge icon={<Icon size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {value}
        </WhiteBadge>
      </span>
    </Tooltip>
  );
}

/**
 * A paddle tour's check bench as one fact (PAD-09), or null for a hike, a tour
 * listed without one, or an area without obstacle data: a row has no room for
 * a badge that says nothing, and the checklist itself still names the gap.
 */
function paddleCheckOf(tour: TourListItem, t: Parameters<typeof paddleCheckFact>[1]) {
  const check = tour.tour_type === 'kayak' ? tour.paddle_check : null;
  return check && check.data !== 'none' ? paddleCheckFact(check, t) : null;
}

/**
 * A tour's facts on its day-plan row, in the badges every other stop uses: the
 * time it takes (the planned total where there is one, otherwise the walking
 * time, the parts in the tooltip), how far, how much climbing and, for a paddle
 * tour, its check bench. `compact` (the tour list) keeps the three that matter
 * most, in that order: the time, then a paddle tour's check bench and its
 * distance, or a hike's distance and climbing.
 */
export function TourDayRowPills({ tour, compact = false }: { tour: TourListItem; compact?: boolean }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) || 'metric';
  const times = tourPlannedTimes(tour);
  const shownMinutes = times.plannedTotalMinutes ?? times.walkingMinutes;
  const timeParts = [
    times.walkingMinutes != null
      ? `${movingTimeLabel(tour, t('tours.planner.inspector.duration'), t)}: ${formatPlannedTourDuration(times.walkingMinutes)}`
      : null,
    times.breakMinutes
      ? `${t('tours.planner.breaksAdditional')}: ${formatPlannedTourDuration(times.breakMinutes)}`
      : null,
    times.plannedTotalMinutes != null
      ? `${t('tours.planner.plannedTotalDuration')}: ${formatPlannedTourDuration(times.plannedTotalMinutes)}${times.manuallyOverridden ? ` (${t('tours.planner.plannedTotalManual')})` : ''}`
      : null,
  ].filter((part): part is string => part !== null);
  const check = paddleCheckOf(tour, t);
  const time = shownMinutes != null && (
    <TourDayRowPill
      key="time"
      icon={Clock}
      value={formatPlannedTourDuration(shownMinutes)}
      label={timeParts.join(', ')}
      testId="trip-plan-tour-time"
    />
  );
  const distance = tour.distance != null && (
    <TourDayRowPill
      key="distance"
      icon={Ruler}
      value={formatDistance(tour.distance, unit)}
      label={`${t('tours.detail.distance')}: ${formatDistance(tour.distance, unit)}`}
      testId="plan-tour-distance"
    />
  );
  const ascent = tour.elevation_gain != null && (
    <TourDayRowPill
      key="ascent"
      icon={ArrowUp}
      value={formatElevation(tour.elevation_gain, unit)}
      label={`${t('tours.detail.ascent')}: ${formatElevation(tour.elevation_gain, unit)}`}
      testId="plan-tour-ascent"
    />
  );
  const bench = check && <TourDayRowPill key="check" {...check} testId="plan-tour-paddle-check" />;
  if (!compact) return <>{[time, distance, ascent, bench]}</>;
  // A paddle tour's climbing is the river's fall, nothing to plan by; its check bench is.
  return <>{tour.tour_type === 'kayak' ? [time, bench, distance] : [time, distance, ascent]}</>;
}

export default function TourDayRowFacts({ tour, mobile = false }: { tour: TourListItem; mobile?: boolean }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) || 'metric';
  const times = tourPlannedTimes(tour);
  const facts: Array<{ icon: LucideIcon; value: string; label: string; testId: string }> = [];
  const add = (icon: LucideIcon, value: string, label: string, testId: string) =>
    facts.push({ icon, value, label, testId });
  if (tour.distance != null)
    add(Ruler, formatDistance(tour.distance, unit), t('tours.detail.distance'), 'plan-tour-distance');
  if (tour.elevation_gain != null)
    add(ArrowUp, formatElevation(tour.elevation_gain, unit), t('tours.detail.ascent'), 'plan-tour-ascent');
  if (times.walkingMinutes != null)
    add(
      tourDayRowIcon(tour.tour_type === 'kayak' ? 'kayak' : 'walk'),
      formatPlannedTourDuration(times.walkingMinutes),
      movingTimeLabel(tour, t('tours.planner.inspector.duration'), t),
      'trip-plan-tour-walking-time'
    );
  if (times.breakMinutes != null && times.breakMinutes > 0)
    add(
      Pause,
      formatPlannedTourDuration(times.breakMinutes),
      t('tours.planner.breaksAdditional'),
      'trip-plan-tour-breaks'
    );
  if (times.plannedTotalMinutes != null)
    add(
      Clock,
      formatPlannedTourDuration(times.plannedTotalMinutes),
      `${t('tours.planner.plannedTotalDuration')}${times.manuallyOverridden ? `, ${t('tours.planner.plannedTotalManual')}` : ''}`,
      'trip-plan-tour-planned-duration'
    );
  const check = paddleCheckOf(tour, t);
  if (check) add(check.icon, check.value, t('tours.paddle.check.title'), 'plan-tour-paddle-check');
  return (
    <span data-testid="plan-tour-facts" className="flex min-w-0 flex-wrap items-center gap-1">
      {facts.map((fact) => (
        <Fact key={fact.testId} {...fact} label={`${fact.label}: ${fact.value}`} mobile={mobile} />
      ))}
    </span>
  );
}
