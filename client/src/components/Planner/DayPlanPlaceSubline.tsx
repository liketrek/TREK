import type { TourListItem } from '@trek/shared';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from '../../i18n';
import '../../styles/fadeEnd.css';
import type { Category, Place } from '../../types';
import { formatTime } from '../../utils/formatters';
import { fs } from '../shared/DialogShell';
import { stageNumberOf } from '../Tours/stages/stageNames';
import { TourStageDayPills } from '../Tours/stages/TourStageDayPills';
import { TourDayRowPills } from '../Tours/TourDayRowFacts';
import { TourDayTimeText } from '../Tours/TourDayTimeParts';
import { movingTimeLabel } from '../Tours/tourFacts';
import { formatPlannedTourDuration, plannedTotalText, type TourPlannedTimes } from '../Tours/tourPresentation';
import { WalkProgressPill } from '../Tours/walk/WalkStations';
import { TimePill } from './planParts';

type DayRowTourTimes = TourPlannedTimes & { tour?: TourListItem };

interface DayPlanPlaceSublineProps {
  place: Place;
  cat: Category | undefined;
  tourTimes: DayRowTourTimes | undefined;
  isTourPlace: boolean;
  timeFormat: string;
  /** CW-03: the row's day assignment, which a city walk's progress belongs to. */
  assignmentId?: number;
  /** MDT-02: the stage of a multi-day tour the day holds, by its starting stop's key; absent for the whole tour. */
  tourStageKey?: string | null;
}

function hasPlannedTimes(tourTimes: DayRowTourTimes | undefined): boolean {
  if (!tourTimes) return false;
  return tourTimes.walkingMinutes != null || tourTimes.breakMinutes != null || tourTimes.plannedTotalMinutes != null;
}

// Walking, break and planned-total pills of a tour stop that has no tour row of its own.
function PlannedTourPills({ tourTimes }: { tourTimes: DayRowTourTimes }) {
  const { t } = useTranslation();
  const manual = tourTimes.manuallyOverridden;
  return (
    <>
      {tourTimes.walkingMinutes != null && (
        <TimePill>
          <span
            data-testid="trip-plan-tour-walking-time"
            aria-label={`${movingTimeLabel(tourTimes.tour, t('tours.planner.inspector.duration'), t)}: ${formatPlannedTourDuration(tourTimes.walkingMinutes)}`}
          >
            {movingTimeLabel(tourTimes.tour, t('tours.planner.walkingShort'), t)}:{' '}
            {formatPlannedTourDuration(tourTimes.walkingMinutes)}
          </span>
        </TimePill>
      )}
      {tourTimes.breakMinutes != null && (
        <TimePill>
          <span
            data-testid="trip-plan-tour-breaks"
            aria-label={`${t('tours.planner.breaksAdditional')}: ${formatPlannedTourDuration(tourTimes.breakMinutes)}`}
          >
            {t('tours.planner.breaksShort')}: {formatPlannedTourDuration(tourTimes.breakMinutes)}
          </span>
        </TimePill>
      )}
      {tourTimes.plannedTotalMinutes != null && (
        <TimePill>
          <span
            data-testid="trip-plan-tour-planned-duration"
            aria-label={`${t('tours.planner.plannedTotalDuration')}: ${plannedTotalText(tourTimes, t)}${manual ? `, ${t('tours.planner.plannedTotalManual')}` : ''}`}
          >
            {t('tours.planner.plannedShort')}: {plannedTotalText(tourTimes, t, true)}
            {manual ? ` · ${t('tours.planner.plannedTotalManual')}` : ''}
          </span>
        </TimePill>
      )}
    </>
  );
}

// The tour's own pills, or a stage's where the day holds one stage of a multi-day tour (MDT-02).
function DayRowTourPills({ tour, stageKey }: { tour: TourListItem; stageKey?: string | null }) {
  if (stageKey && stageNumberOf(tour, stageKey) !== null) return <TourStageDayPills tour={tour} stageKey={stageKey} />;
  return <TourDayRowPills tour={tour} />;
}

// Description line, one line like every stop's.
function SublineDescription({ text, isTourPlace }: { text: string; isTourPlace: boolean }) {
  return (
    <div
      data-testid={isTourPlace ? 'trip-plan-tour-description' : undefined}
      className="collab-note-md min-w-0 flex-1 text-content-faint"
      style={{
        ...fs(10.5),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        maxHeight: '1.3em',
      }}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  );
}

// Second line of a place row in the day plan: time, tour facts or planned
// tour durations, then the clamped description.
export function DayPlanPlaceSubline({
  place,
  cat,
  tourTimes,
  isTourPlace,
  timeFormat,
  assignmentId,
  tourStageKey,
}: DayPlanPlaceSublineProps) {
  const { locale } = useTranslation();
  const dayRowTour = tourTimes?.tour;
  const description = place.description || place.address || cat?.name;
  if (!(dayRowTour || place.place_time || hasPlannedTimes(tourTimes) || description)) return null;
  return (
    // One line like the row's name: when the hover controls come out, the description
    // gives way and the pills keep their place instead of wrapping onto a second line.
    <div className="trek-fade-end mt-0.5 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
      {place.place_time && dayRowTour && (
        // TIME-02: a tour's end, typed or worked out from its start and its time.
        <TimePill quiet>
          <TourDayTimeText
            entry={{ start: place.place_time, end: place.end_time, stageKey: tourStageKey }}
            tour={dayRowTour}
          />
        </TimePill>
      )}
      {place.place_time && !dayRowTour && (
        <TimePill quiet>
          {formatTime(place.place_time, locale, timeFormat)}
          {place.end_time ? ` – ${formatTime(place.end_time, locale, timeFormat)}` : ''}
        </TimePill>
      )}
      {dayRowTour ? (
        <DayRowTourPills tour={dayRowTour} stageKey={tourStageKey} />
      ) : (
        tourTimes && <PlannedTourPills tourTimes={tourTimes} />
      )}
      {dayRowTour && <WalkProgressPill tour={dayRowTour} assignmentId={assignmentId} />}
      {description && <SublineDescription text={description} isTourPlace={isTourPlace} />}
    </div>
  );
}
