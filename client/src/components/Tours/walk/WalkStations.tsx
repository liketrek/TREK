import type { TourListItem, TourVisitStatus } from '@trek/shared';
import { Check, CheckCheck, Info, Redo2, SkipForward, Undo2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useTourVisitStore } from '../../../store/tourVisitStore';
import type { Assignment, AssignmentsMap, Day } from '../../../types';
import { SoftPill } from '../../Planner/planParts';
import { DialogSection, fs } from '../../shared/DialogShell';
import { useToast } from '../../shared/Toast';
import { stationMarkNote, stationRingClass } from '../planner/stationMarks';
import { StationPills, StationShield } from '../planner/stationParts';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { TourDayRowPill } from '../TourDayRowFacts';
import { CardAction, TourNotice } from '../tourParts';
import { StationScheduleLine } from './StationSchedule';
import { useWalkDay } from './useWalkDay';
import { useLinkedPlaceOf, useWalkSchedule } from './useWalkSchedule';
import { useWalkStations } from './useWalkStations';
import { WalkDayLine } from './WalkDayLine';
import { useDayVisits, useWalkProgress } from './walkProgress';
import { useWalkRemaining } from './walkRemaining';
import { WalkRemainingPill } from './WalkRemainingPill';
import type { StationSchedule } from './walkSchedule';

const NO_DAYS: Day[] = [];
const NO_ASSIGNMENTS: AssignmentsMap = {};

/**
 * CW-03: a walk's progress on one of its days, as a pill of the day row:
 * how many of its stations were visited. Nothing is shown before any is.
 */
export function WalkProgressPill({ tour, assignmentId }: { tour: TourListItem; assignmentId: number | undefined }) {
  const { t } = useTranslation();
  const progress = useWalkProgress(tour, assignmentId);
  if (!progress) return null;
  return (
    <TourDayRowPill
      icon={CheckCheck}
      value={`${progress.visited}/${progress.total}`}
      label={t('tours.walk.progress', progress)}
      testId="plan-walk-progress"
    />
  );
}

/**
 * Whether the stations can be checked off from here: not without a day or the
 * right to plan it, and not yet on a day put on the plan offline, which the
 * server does not know until it synced.
 */
function markState(canMark: boolean, assignmentId: number | null): 'none' | 'ready' | 'notSynced' {
  if (!canMark || assignmentId === null) return 'none';
  return assignmentId < 0 ? 'notSynced' : 'ready';
}

function StatusActions({
  status,
  onMark,
}: {
  status: TourVisitStatus | undefined;
  onMark: (status: TourVisitStatus | 'planned') => void;
}) {
  const { t } = useTranslation();
  if (status)
    return (
      <CardAction icon={<Undo2 size={12} strokeWidth={2} />} onClick={() => onMark('planned')}>
        {t('tours.walk.visit.undo')}
      </CardAction>
    );
  return (
    <span className="flex flex-wrap gap-1.5">
      <CardAction icon={<Check size={12} strokeWidth={2.2} />} onClick={() => onMark('visited')}>
        {t('tours.walk.visit.visited')}
      </CardAction>
      <CardAction icon={<SkipForward size={12} strokeWidth={2} />} onClick={() => onMark('skipped')}>
        {t('tours.walk.visit.skip')}
      </CardAction>
    </span>
  );
}

/**
 * One station of the list: its number or mark, its name (its own, else the
 * trip place it stands for), stay, the day's arrival and opening hours, and
 * what can be marked.
 */
function StationRow({
  station,
  index,
  status,
  placeName,
  schedule,
  onMark,
}: {
  station: TourPlannerWaypoint;
  index: number;
  status: TourVisitStatus | undefined;
  placeName: string | undefined;
  schedule: StationSchedule | undefined;
  onMark: ((status: TourVisitStatus | 'planned') => void) | null;
}) {
  const { t } = useTranslation();
  const name = station.name ?? placeName ?? t('tours.walk.stationNumbered', { number: index + 1 });
  return (
    <li
      data-testid="walk-station"
      className={`flex items-start gap-2.5 rounded-[10px] px-1.5 py-1.5 ${status ? 'opacity-70' : ''}`}
    >
      {/* How much the station matters rings its number; a protection is a shield at its corner (CW-03, CW-10). */}
      <span
        className={`relative grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-tertiary font-geist tabular-nums text-content-secondary ${stationRingClass(station.importance)}`}
        style={fs(11)}
        title={stationMarkNote(station, t) ?? undefined}
      >
        {status === 'visited' ? (
          <Check size={12} strokeWidth={2.4} />
        ) : status === 'skipped' ? (
          <Redo2 size={12} strokeWidth={2} />
        ) : (
          index + 1
        )}
        {station.protected && <StationShield />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`truncate font-semibold text-content ${status === 'skipped' ? 'line-through' : ''}`}
          style={fs(12.5, 'body')}
        >
          {name}
        </span>
        <StationPills point={station} />
        <StationScheduleLine schedule={schedule} name={name} />
        {status && (
          <span className="text-content-faint" style={fs(11, 'body')}>
            {t(status === 'visited' ? 'tours.walk.visit.isVisited' : 'tours.walk.visit.isSkipped')}
          </span>
        )}
      </span>
      {onMark && <StatusActions status={status} onMark={onMark} />}
    </li>
  );
}

/** The lines above the stations: loading, stations that could not be read, where to check off. */
function WalkStationsNotes({
  loading,
  unread,
  any,
  fromDay,
  notSynced,
}: {
  loading: boolean;
  unread: boolean;
  any: boolean;
  fromDay: boolean;
  notSynced: boolean;
}) {
  const { t } = useTranslation();
  const quiet = (text: string) => (
    <span className="text-content-faint" style={fs(11, 'body')}>
      {text}
    </span>
  );
  if (loading) return quiet(t('common.loading'));
  return (
    <>
      {unread && quiet(t('tours.walk.stationsUnread'))}
      {/* A card with a frame of its own: how to check stops off is easy to miss as a quiet line. */}
      {any && fromDay && (
        <TourNotice icon={<Info size={13} strokeWidth={2} />}>{t('tours.walk.visit.fromDay')}</TourNotice>
      )}
      {any && notSynced && quiet(t('tours.walk.visit.notSynced'))}
    </>
  );
}

/**
 * CW-03, CW-04: a city walk's stations in its detail, in order, each with its
 * stay, importance and protection, and its arrival and opening hours on the
 * day looked at. Opened from one of the walk's days, that day holds, and each
 * station can be marked visited or skipped for it and taken back; opened
 * otherwise, a day of the walk can be picked for the times and nothing is
 * checked off. Neither changes a route, place or order.
 */
export function WalkStationsCard({
  tour,
  tripId,
  assignment,
  canMark,
  days = NO_DAYS,
  assignments = NO_ASSIGNMENTS,
  route = null,
}: {
  tour: TourListItem;
  tripId: number | string;
  /** The walk's entry on the day the dialog was opened from; without one there is nothing to check off. */
  assignment: Pick<Assignment, 'id' | 'day_id'> | null;
  canMark: boolean;
  days?: readonly Day[];
  assignments?: AssignmentsMap;
  /** The walk's line, along which its walking time is shared out. */
  route?: ReadonlyArray<readonly [number, number]> | null;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const isWalk = tour.tour_type === 'walk';
  const walk = useWalkStations(tripId, tour.place_id, isWalk, tour.revision);
  const stations = walk?.stations ?? null;
  const ferries = walk?.ferries;
  const assignmentId = assignment?.id ?? null;
  const visits = useDayVisits(assignmentId);
  const mark = useTourVisitStore((state) => state.mark);
  const placeOf = useLinkedPlaceOf();
  const choice = useWalkDay(isWalk ? tour.place_id : null, days, assignments, assignment?.day_id ?? null);
  const walkingMinutes = tour.duration ?? null;
  const schedule = useWalkSchedule({ stations, route, walkingMinutes, day: choice.day, placeOf, ferries });
  const remainder = useWalkRemaining({ stations, visits, route, walkingMinutes, placeOf, ferries });
  if (!isWalk) return null;
  const onMark = (key: string, status: TourVisitStatus | 'planned') => {
    if (assignmentId === null) return;
    mark(tripId, assignmentId, key, status).catch(() => toast.error(t('tours.walk.visit.failed')));
  };
  const listed = stations ?? [];
  const visited = listed.filter((station) => station.key && visits?.[station.key] === 'visited').length;
  const marking = markState(canMark, assignmentId);
  return (
    <DialogSection
      className="flex-none"
      label={t('tours.walk.stations')}
      action={
        // No count where the stations could not be read: it would contradict the day row's.
        assignmentId !== null && listed.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1.5">
            {remainder && <WalkRemainingPill remainder={remainder} />}
            <SoftPill>{t('tours.walk.progress', { visited, total: listed.length })}</SoftPill>
          </span>
        ) : undefined
      }
    >
      <div data-testid="walk-stations" className="flex flex-col gap-2">
        <WalkDayLine choice={choice} schedule={schedule} stationCount={listed.length} />
        <WalkStationsNotes
          loading={stations === null}
          unread={stations?.length === 0 && tour.station_count !== 0}
          any={listed.length > 0}
          fromDay={assignmentId === null}
          notSynced={marking === 'notSynced'}
        />
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {listed.map((station, index) => (
            <StationRow
              key={station.id}
              station={station}
              index={index}
              status={station.key ? visits?.[station.key] : undefined}
              placeName={placeOf(station)?.name}
              schedule={schedule.byStation.get(station.id)}
              onMark={marking === 'ready' && station.key ? (next) => onMark(station.key ?? '', next) : null}
            />
          ))}
        </ol>
      </div>
    </DialogSection>
  );
}
