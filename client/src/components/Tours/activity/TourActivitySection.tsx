import type { TourActivity, TourListItem } from '@trek/shared';
import { CalendarDays, CheckCheck, Clock, CloudOff, FileDown, Footprints, Plus, RefreshCw, Unlink } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import type { AssignmentsMap, Day } from '../../../types';
import { BOX } from '../../Planner/bookings/bookingParts';
import { SoftPill } from '../../Planner/planParts';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { DialogSection, fs } from '../../shared/DialogShell';
import ElevationProfile from '../../shared/ElevationProfile';
import { Tooltip } from '../../shared/Tooltip';
import { dayMenuLabel } from '../tourDays';
import { CardAction, TourNotice } from '../tourParts';
import TourActivityCompare from './TourActivityCompare';
import TourActivityDialog from './TourActivityDialog';
import { ACTUAL_TRACK_COLOR } from './activityCompareParts';
import type { PlanValues } from './planComparison';
import { analysisOfLine, executionOf, executionsOf, recordedDay, type TourExecution } from './tourActivityModel';
import { useActivityComparison, type ActivityComparisonState } from './useActivityComparison';
import { useTourActivities, type TourActivities } from './useTourActivities';

/** What a card compares its track with: the plan's values and colour, and the map switch where there is a plan map. */
interface PlanSide {
  plan: PlanValues;
  planColor: string;
  /** Null on the phone, whose detail has no plan map beside it. */
  comparison: ActivityComparisonState | null;
}

/**
 * The tile of a recording: the done mark every actual track goes by (on the
 * list row, in the tour's head and here), with a small dot at its foot that
 * says it was recorded. Never footprints, which name a city walk and a walk's
 * moving time.
 */
function RecordedTile() {
  return (
    <span className="relative grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-secondary text-content-secondary">
      <CheckCheck size={15} strokeWidth={2} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-surface-card"
      />
    </span>
  );
}

/** Where and when: the execution, the file it came from, the day it was recorded, each a badge of its own. */
function ActivityBadges({ activity, execution }: { activity: TourActivity; execution: TourExecution }) {
  const { t, locale } = useTranslation();
  const dayLabel = execution.day ? t('dayplan.dayN', { n: execution.index + 1 }) : t('tours.activity.noDay');
  const dayTitle = execution.day ? dayMenuLabel(execution.day, execution.index, t, locale) : dayLabel;
  const recordedOn = recordedDay(activity.metrics.started_at, locale);
  const source =
    activity.track.file_name ?? t(activity.track.origin === 'wanderer' ? 'tours.badge.wanderer' : 'tours.badge.gpx');
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <Tooltip label={dayTitle}>
        <span className="inline-flex" data-testid="tour-activity-day">
          <SoftPill icon={<CalendarDays size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
            {dayLabel}
          </SoftPill>
        </span>
      </Tooltip>
      <SoftPill
        className="max-w-[180px]"
        icon={<FileDown size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}
      >
        <span className="min-w-0 truncate">{source}</span>
      </SoftPill>
      {recordedOn && (
        <SoftPill icon={<Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
          {t('tours.activity.recordedOn', { date: recordedOn })}
        </SoftPill>
      )}
    </div>
  );
}

/**
 * One recording: who it is, its values beside the plan's (ACT-02), its
 * profile, and what the user can do with it.
 */
function ActivityCard({
  activity,
  execution,
  state,
  side,
}: {
  activity: TourActivity;
  execution: TourExecution;
  state: TourActivities;
  side: PlanSide;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((store) => store.settings.distance_unit) ?? 'metric';
  const analysis = useMemo(() => analysisOfLine(activity.geometry), [activity.geometry]);
  const trackPlaceId = activity.track.place_id;
  const { comparison } = side;
  return (
    <article data-testid="tour-activity" className={`${BOX} overflow-hidden`}>
      <header className="flex items-start gap-2.5 px-3 py-2.5">
        <RecordedTile />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-content" style={fs(13, 'body')}>
            {activity.track.name}
          </div>
          <ActivityBadges activity={activity} execution={execution} />
        </div>
        <Tooltip label={t('tours.activity.badgeHint')}>
          <span className="inline-flex">
            <SoftPill tone="success" caps>
              {t('tours.activity.badge')}
            </SoftPill>
          </span>
        </Tooltip>
      </header>
      <div className="flex flex-col gap-2 border-t border-edge-faint p-2.5">
        <TourActivityCompare
          activity={activity}
          plan={side.plan}
          planColor={side.planColor}
          unit={unit}
          map={
            comparison
              ? { shown: comparison.comparedTrack === trackPlaceId, onToggle: () => comparison.toggle(trackPlaceId) }
              : undefined
          }
        />
        {analysis && analysis.distanceIndexedProfileSamples.length >= 2 && (
          <ElevationProfile
            samples={analysis.distanceIndexedProfileSamples}
            color={ACTUAL_TRACK_COLOR}
            gradientId={`tour-activity-${activity.id}`}
          />
        )}
      </div>
      {state.canEdit && (
        <footer className="flex flex-wrap gap-1.5 border-t border-edge-faint px-2.5 py-2">
          <CardAction
            icon={<RefreshCw size={12} strokeWidth={2.2} />}
            onClick={() => state.openAssign({ assignmentId: activity.assignment_id, activityId: activity.id })}
            disabled={state.busy}
          >
            {t('tours.activity.change')}
          </CardAction>
          <CardAction
            icon={<Unlink size={12} strokeWidth={2.2} />}
            onClick={() => state.askRemove(activity)}
            disabled={state.busy}
          >
            {t('tours.activity.remove')}
          </CardAction>
        </footer>
      )}
    </article>
  );
}

/** No recording yet: a quiet line, dimmed rather than hidden, so the place for one is known. */
function NoActivity() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="tour-activity-empty"
      className={`${BOX} flex items-center gap-2.5 px-3 py-2.5 text-content-faint`}
      style={fs(12, 'body')}
    >
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-dashed border-edge">
        <Footprints size={13} strokeWidth={2} aria-hidden="true" />
      </span>
      {t('tours.activity.empty')}
    </div>
  );
}

/** What the section holds: the tracks, the empty place for one, or word that the tour's tracks could not be read. */
function ActivityList({
  state,
  executions,
  side,
}: {
  state: TourActivities;
  executions: readonly TourExecution[];
  side: PlanSide;
}) {
  const { t } = useTranslation();
  const activities = state.activities ?? [];
  if (state.unavailable) {
    return (
      <TourNotice role="status" icon={<CloudOff size={13} strokeWidth={2} />}>
        {t('tours.activity.unavailable')}
      </TourNotice>
    );
  }
  if (activities.length === 0) return <NoActivity />;
  return (
    <div className="flex flex-col gap-2">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          execution={executionOf(executions, activity.assignment_id)}
          state={state}
          side={side}
        />
      ))}
    </div>
  );
}

interface TourActivitySectionProps {
  tripId: number;
  tour: TourListItem;
  days: Day[];
  assignments: AssignmentsMap;
  canEdit: boolean;
  /** ACT-02: what the plan says, for each track's values to stand beside. */
  plan: PlanValues;
  /** The plan's track colour, as the map and the table draw it. */
  planColor: string;
  /** Offers to compare a track on the plan map; only where one is beside the detail and the map can draw it. */
  mapCompare?: boolean;
  onToursChanged?: (placeIds: number[]) => Promise<void> | void;
}

/**
 * ACT-01 in the tour's detail: the tracks the tour was actually done with,
 * each with the values its own recording measures and its profile, apart from
 * the planned values above; and for someone who may change the tour, the way
 * to assign one, change it or take it off. Each track's values stand beside
 * the plan's, and one track at a time can be compared with the plan on the map
 * (ACT-02). A tour that is itself the recording of another shows none: it says
 * so in its head instead.
 */
export default function TourActivitySection({
  tripId,
  tour,
  days,
  assignments,
  canEdit,
  plan,
  planColor,
  mapCompare = false,
  onToursChanged,
}: TourActivitySectionProps) {
  const { t } = useTranslation();
  const executions = useMemo(() => executionsOf(tour.place_id, days, assignments), [assignments, days, tour.place_id]);
  const state = useTourActivities({ tripId, tour, executions, canEdit, onToursChanged });
  const { activities, unavailable } = state;
  const comparison = useActivityComparison(tour.place_id, activities);
  // The plan map says whether it can draw a comparison; where it cannot, no switch is offered.
  const mapAvailable = useTourActivityCompareStore((store) => store.mapAvailable);
  const side: PlanSide = { plan, planColor, comparison: mapCompare && mapAvailable ? comparison : null };
  if (activities === null || tour.activity_of != null || (activities.length === 0 && !canEdit && !unavailable)) {
    return null;
  }
  return (
    <DialogSection
      className="flex-none"
      label={t('tours.activity.label')}
      action={
        canEdit && (
          <Tooltip label={t('tours.activity.assignHint')}>
            <span className="inline-flex">
              <CardAction
                icon={<Plus size={12} strokeWidth={2.2} />}
                onClick={() => state.openAssign()}
                disabled={state.busy || unavailable}
              >
                {t('tours.activity.assign')}
              </CardAction>
            </span>
          </Tooltip>
        )
      }
    >
      <ActivityList state={state} executions={executions} side={side} />
      {state.assigning && (
        <TourActivityDialog
          tripId={tripId}
          tour={tour}
          executions={executions}
          state={state}
          activities={activities}
          onToursChanged={onToursChanged}
        />
      )}
      <ConfirmDialog
        isOpen={state.removing !== null}
        onClose={state.cancelRemove}
        onConfirm={() => void state.remove()}
        title={t('tours.activity.removeTitle')}
        message={t('tours.activity.removeBody')}
        confirmLabel={t('tours.activity.remove')}
      />
    </DialogSection>
  );
}
