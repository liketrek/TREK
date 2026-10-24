import type { TourActivity, TourListItem } from '@trek/shared';
import { AlertTriangle, Check, Clock, FileDown, Footprints, Link2, Loader2, Ruler, Upload } from 'lucide-react';
import { useId, useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTripStore } from '../../../store/tripStore';
import { formatDate } from '../../../utils/formatters';
import { analyzeRouteGeometry } from '../../../utils/routeGeometry';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
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
import { PillSelect } from '../../shared/dialogParts';
import TourGpxPreviewDialog from '../TourGpxPreviewDialog';
import { CardAction, TourMetricFields, TourNotice } from '../tourParts';
import { formatPlannedTourDuration, hikeSourceBadgeLabel } from '../tourPresentation';
import { recordedDay, recordedMinutes, type TourExecution, type TrackCandidate } from './tourActivityModel';
import type { TourActivities } from './useTourActivities';
import { useTrackAssignment, type TrackAssignment } from './useTrackAssignment';

/** The value of the execution picker for "no day". */
const NO_DAY = 'none';

/** One recording of the trip to choose: its name and what it is as badges; one taken by another tour is dimmed. */
function CandidateRow({
  candidate,
  selected,
  onChoose,
}: {
  candidate: TrackCandidate;
  selected: boolean;
  onChoose: () => void;
}) {
  const { t, locale } = useTranslation();
  const unit = useSettingsStore((store) => store.settings.distance_unit) ?? 'metric';
  const { tour, takenBy } = candidate;
  const minutes = recordedMinutes(tour.track_started_at, tour.track_ended_at);
  const recordedOn = recordedDay(tour.track_started_at, locale);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={takenBy !== null}
      onClick={onChoose}
      data-testid="tour-activity-candidate"
      className={`flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-55 ${selected ? 'border-accent bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-card enabled:hover:bg-surface-hover'}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-5 w-5 flex-none place-items-center rounded-full ring-1 ring-inset ${selected ? 'bg-accent text-accent-text ring-accent' : 'ring-edge'}`}
      >
        {selected && <Check size={12} strokeWidth={2.6} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>
          {tour.name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <SoftPill icon={<FileDown size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
            {hikeSourceBadgeLabel(tour, t)}
          </SoftPill>
          {tour.distance != null && (
            <SoftPill icon={<Ruler size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
              {formatDistance(tour.distance, unit)}
            </SoftPill>
          )}
          {recordedOn && (
            <SoftPill icon={<Clock size={10} strokeWidth={2.2} className="flex-none text-content-faint" />}>
              {minutes === null ? recordedOn : `${recordedOn} ${formatPlannedTourDuration(minutes)}`}
            </SoftPill>
          )}
          {takenBy !== null && <SoftPill tone="warning">{t('tours.activity.ofTour', { name: takenBy })}</SoftPill>}
        </span>
      </span>
    </button>
  );
}

/** The recordings to choose from, or what to do while there is none. */
function CandidateList({ assignment }: { assignment: TrackAssignment }) {
  const { t } = useTranslation();
  const { candidates } = assignment;
  if (candidates === null) {
    return (
      <div className="flex justify-center py-3 text-content-faint">
        <Loader2 size={16} className="animate-spin" aria-label={t('common.loading')} />
      </div>
    );
  }
  if (candidates.length === 0) {
    return (
      <TourNotice role="status" icon={<Footprints size={13} strokeWidth={2} />}>
        {t('tours.activity.noCandidates')}
      </TourNotice>
    );
  }
  return (
    <div role="radiogroup" aria-label={t('tours.activity.track')} className="flex flex-col gap-1.5">
      {candidates.map((candidate) => (
        <CandidateRow
          key={candidate.tour.place_id}
          candidate={candidate}
          selected={candidate.tour.place_id === assignment.selected}
          onChoose={() => assignment.choose(candidate.tour.place_id)}
        />
      ))}
    </div>
  );
}

/** What the chosen recording measures, read the way the detail will show it, before anything is written. */
function ChoicePreview({ choice }: { choice: TourListItem }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((store) => store.settings.distance_unit) ?? 'metric';
  const line = useTripStore((store) => store.places.find((place) => place.id === choice.place_id)?.route_geometry);
  const analysis = useMemo(() => analyzeRouteGeometry(line), [line]);
  const minutes = recordedMinutes(choice.track_started_at, choice.track_ended_at);
  return (
    <DialogSection label={t('tours.activity.badge')}>
      <TourMetricFields
        analysis={analysis}
        unit={unit}
        extra={[
          {
            label: t('tours.activity.time'),
            value: minutes === null ? t('tours.activity.noTime') : formatPlannedTourDuration(minutes),
          },
        ]}
      />
    </DialogSection>
  );
}

/** The day picker: every day the tour is on, and no day at all. */
function ExecutionPicker({ assignment }: { assignment: TrackAssignment }) {
  const { t, locale } = useTranslation();
  const options = [
    ...assignment.executions.map((execution: TourExecution) => ({
      value: String(execution.assignmentId),
      label: t('dayplan.dayN', { n: execution.index + 1 }),
      hint: (execution.day && formatDate(execution.day.date, locale)) || undefined,
    })),
    { value: NO_DAY, label: t('tours.activity.noDay') },
  ];
  return (
    <PillSelect
      quiet
      value={assignment.assignmentId === null ? NO_DAY : String(assignment.assignmentId)}
      options={options}
      onChange={(value) => assignment.chooseExecution(value === NO_DAY ? null : Number(value))}
      label={t('tours.activity.execution')}
    />
  );
}

interface TourActivityDialogProps {
  tripId: number;
  tour: TourListItem;
  executions: readonly TourExecution[];
  state: TourActivities;
  activities: readonly TourActivity[];
  onToursChanged?: (placeIds: number[]) => Promise<void> | void;
}

/**
 * ACT-01: assigning a recorded track, on purpose and confirmed. The user picks
 * the day it was done on and a recording of the trip, or imports one through
 * the GPX import as always, sees what it measures, and only "Assign" writes.
 * The plan is not touched, and the head says so.
 */
export default function TourActivityDialog({
  tripId,
  tour,
  executions,
  state,
  activities,
  onToursChanged,
}: TourActivityDialogProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const assignment = useTrackAssignment({
    tripId,
    tour,
    executions,
    activities,
    target: state.assigning ?? {},
    canEdit: state.canEdit,
    onToursChanged,
  });
  const { gpxImport, choice, selected } = assignment;
  const importing = gpxImport.importing || gpxImport.preview !== null;
  const confirm = () => {
    if (selected !== null && assignment.ready) void state.assign(selected, assignment.assignmentId);
  };
  return (
    <>
      <DialogShell
        onClose={state.closeAssign}
        labelledBy={labelId}
        width="detail"
        blocked={state.busy || importing}
        header={
          <DialogHeader
            tile={
              <DialogTile>
                <Footprints size={20} strokeWidth={2} className="text-content" />
              </DialogTile>
            }
            tint={NEUTRAL_TINT}
            labelId={labelId}
            onClose={state.closeAssign}
            eyebrow={t('tours.activity.dialogEyebrow')}
            title={tour.name}
            sub={t('tours.activity.dialogHint')}
            subWraps
          />
        }
        footer={
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={state.closeAssign} disabled={state.busy}>
              {t('common.cancel')}
            </DialogButton>
            <DialogButton
              variant="primary"
              data-testid="tour-activity-confirm"
              disabled={!assignment.ready || state.busy || importing}
              icon={state.busy ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} strokeWidth={2} />}
              onClick={confirm}
            >
              {t('tours.activity.confirm')}
            </DialogButton>
          </DialogFooter>
        }
      >
        <DialogSection label={t('tours.activity.execution')}>
          <ExecutionPicker assignment={assignment} />
        </DialogSection>
        <DialogSection
          label={t('tours.activity.track')}
          action={
            <CardAction
              icon={
                gpxImport.importing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} strokeWidth={2.2} />
                )
              }
              onClick={gpxImport.pick}
              disabled={importing}
            >
              {t('tours.activity.importGpx')}
            </CardAction>
          }
        >
          <div className="flex flex-col gap-2">
            <CandidateList assignment={assignment} />
            {assignment.replaces.length > 0 && (
              <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
                {t('tours.activity.replaces', { name: assignment.replaces.join(', ') })}
              </TourNotice>
            )}
          </div>
        </DialogSection>
        {choice && choice.takenBy === null && <ChoicePreview choice={choice.tour} />}
      </DialogShell>
      <TourGpxPreviewDialog gpxImport={gpxImport} initial={assignment.importFields} />
    </>
  );
}
