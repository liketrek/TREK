import { importableTourTypeSchema, type TourListItem } from '@trek/shared';
import { ArrowUp, CheckCheck, Clock, Gauge, Pause, Ruler, type LucideIcon } from 'lucide-react';
import { createElement, useId, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDistance, formatElevation } from '../../utils/units';
import { WhiteBadge } from '../Planner/planParts';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { paddleCheckFact } from './paddle/paddleCheckModel';
import { runPaceText } from './run/runPaceText';
import { SkiCornerMark } from './ski/skiMarks';
import { tourDayRowIcon } from './tourDayRowIcon';
import { movingTimeLabel } from './tourFacts';
import {
  estimateBadgeText,
  estimateLabel,
  formatPlannedTourDuration,
  plannedTotalText,
  tourPlannedTimes,
  type TourPlannedTimes,
} from './tourPresentation';
import { useWalkProgress } from './walk/walkProgress';
import { walkStaysText } from './walk/walkTimeFields';

/** Whether the app names this type: one it plans or keeps, not a key only the catalogue holds. */
function knownType(type: string): boolean {
  return importableTourTypeSchema.safeParse(type).success;
}

/**
 * The icon the time on the move goes by: a bike tour, a ride on horseback, a
 * run, a paddle or a ski tour by its type's own, any walk by footprints.
 */
function movingIconType(type: string): string {
  return type === 'kayak' || type === 'bike' || type === 'run' || type === 'horse' || type === 'ski' ? type : 'walk';
}

export function TourDayRowIcon({ type, size = 27 }: { type: string; size?: number }) {
  const { t } = useTranslation();
  const known = knownType(type);
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
 * shows. A GPX import has no grade and shows its type's icon instead. A ski
 * tour's discipline (SKI-02) sits on the tile's corner, as in the tour lists.
 */
export function TourDayRowAvatar({
  tour,
  size = 32,
}: {
  tour: Pick<TourListItem, 'tour_type' | 'max_hiking_difficulty'> &
    Partial<Pick<TourListItem, 'ski_discipline' | 'ski_technique'>>;
  size?: number;
}) {
  const avatar = <TourGradeAvatar tour={tour} size={size} />;
  if (tour.tour_type !== 'ski' || !tour.ski_discipline) return avatar;
  const markSize = Math.round(size * 0.44);
  return (
    <span className="relative flex flex-none">
      {avatar}
      <SkiCornerMark tour={tour} size={markSize} />
    </span>
  );
}

function TourGradeAvatar({
  tour,
  size,
}: {
  tour: Pick<TourListItem, 'tour_type' | 'max_hiking_difficulty'>;
  size: number;
}) {
  const { t } = useTranslation();
  const level = tour.max_hiking_difficulty;
  const known = knownType(tour.tour_type);
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
 * TIME-01: what an import is estimated to take as a row says it, the badge
 * marked with ≈ and its words saying what it was worked out by; both null
 * while it is unknown or there is none, since a row has no room for a badge
 * that says nothing. The detail names an unknown one.
 */
function estimateFact(
  times: TourPlannedTimes,
  t: Parameters<typeof estimateLabel>[1]
): { value: string | null; label: string | null } {
  const value = estimateBadgeText(times.estimate);
  return value && times.estimate ? { value, label: estimateLabel(times.estimate, t) } : { value: null, label: null };
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
  const walking = times.walkingMinutes == null ? null : formatPlannedTourDuration(times.walkingMinutes);
  const total = plannedTotalText(times, t);
  const staysText = times.walk ? walkStaysText(times.walk, t) : null;
  const pace = runPaceText(tour, t, unit);
  const estimate = estimateFact(times, t);
  const timeParts = [
    walking ? `${movingTimeLabel(tour, t('tours.planner.inspector.duration'), t)}: ${walking}` : null,
    // RUN-01: the pace the running time is planned at.
    pace ? `${t('tours.run.pace')}: ${pace}` : null,
    times.breakMinutes
      ? `${t('tours.planner.breaksAdditional')}: ${formatPlannedTourDuration(times.breakMinutes)}`
      : null,
    // CW-02: a city walk's stays, which its total adds to the walking time.
    staysText ? `${t('tours.walk.stays')}: ${staysText}` : null,
    total
      ? `${t('tours.planner.plannedTotalDuration')}: ${total}${times.manuallyOverridden ? ` (${t('tours.planner.plannedTotalManual')})` : ''}`
      : null,
    // TIME-01: an import's estimate, apart from any total the travellers entered.
    estimate.label,
  ].filter((part): part is string => part !== null);
  const check = paddleCheckOf(tour, t);
  const shown = plannedTotalText(times, t, true) ?? walking ?? estimate.value;
  const time = shown != null && (
    <TourDayRowPill key="time" icon={Clock} value={shown} label={timeParts.join(', ')} testId="trip-plan-tour-time" />
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

export default function TourDayRowFacts({
  tour,
  assignmentId,
  mobile = false,
}: {
  tour: TourListItem;
  /** The row's day assignment, for a city walk's progress on that day (CW-03). */
  assignmentId?: number;
  mobile?: boolean;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) || 'metric';
  const progress = useWalkProgress(tour, assignmentId);
  const times = tourPlannedTimes(tour);
  const facts: Array<{ icon: LucideIcon; value: string; label: string; testId: string; said?: string }> = [];
  const add = (icon: LucideIcon, value: string, label: string, testId: string, said?: string) =>
    facts.push({ icon, value, label, testId, said });
  if (tour.distance != null)
    add(Ruler, formatDistance(tour.distance, unit), t('tours.detail.distance'), 'plan-tour-distance');
  if (tour.elevation_gain != null)
    add(ArrowUp, formatElevation(tour.elevation_gain, unit), t('tours.detail.ascent'), 'plan-tour-ascent');
  if (times.walkingMinutes != null)
    add(
      tourDayRowIcon(movingIconType(tour.tour_type)),
      formatPlannedTourDuration(times.walkingMinutes),
      movingTimeLabel(tour, t('tours.planner.inspector.duration'), t),
      'trip-plan-tour-walking-time'
    );
  // TIME-01: an import's estimate, said in full where it is opened. A total
  // the travellers entered is the time shown; the estimate then only joins its words.
  const estimate = estimateFact(times, t);
  if (estimate.value && estimate.label && times.plannedTotalMinutes == null)
    add(
      tourDayRowIcon(movingIconType(tour.tour_type)),
      estimate.value,
      t('tours.estimate.label'),
      'trip-plan-tour-estimate',
      estimate.label
    );
  const pace = runPaceText(tour, t, unit);
  if (pace) add(Gauge, pace, t('tours.run.pace'), 'plan-tour-run-pace');
  if (times.breakMinutes != null && times.breakMinutes > 0)
    add(
      Pause,
      formatPlannedTourDuration(times.breakMinutes),
      t('tours.planner.breaksAdditional'),
      'trip-plan-tour-breaks'
    );
  const total = plannedTotalText(times, t, true);
  if (total) {
    const label = `${t('tours.planner.plannedTotalDuration')}${times.manuallyOverridden ? `, ${t('tours.planner.plannedTotalManual')}` : ''}`;
    const said = estimate.label ? `${label}: ${total}. ${estimate.label}` : undefined;
    add(Clock, total, label, 'trip-plan-tour-planned-duration', said);
  }
  const check = paddleCheckOf(tour, t);
  if (check) add(check.icon, check.value, t('tours.paddle.check.title'), 'plan-tour-paddle-check');
  return (
    <span data-testid="plan-tour-facts" className="flex min-w-0 flex-wrap items-center gap-1">
      {facts.map(({ said, ...fact }) => (
        <Fact key={fact.testId} {...fact} label={said ?? `${fact.label}: ${fact.value}`} mobile={mobile} />
      ))}
      {progress && (
        <Fact
          icon={CheckCheck}
          value={`${progress.visited}/${progress.total}`}
          label={t('tours.walk.progress', progress)}
          testId="plan-walk-progress"
          mobile={mobile}
        />
      )}
    </span>
  );
}
