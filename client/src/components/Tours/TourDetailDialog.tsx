import type { TourListItem } from '@trek/shared';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  CopyPlus,
  ExternalLink,
  File,
  FileDown,
  FileImage,
  FileText,
  Loader2,
  Minus,
  Navigation,
  Pencil,
  Route,
  Ruler,
  Upload,
} from 'lucide-react';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { translateApiError, useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Assignment, AssignmentsMap, Day, DistanceUnit, Place, TripFile } from '../../types';
import { openFile } from '../../utils/fileDownload';
import { filesForPlace } from '../../utils/placeFiles';
import { analyzeRouteGeometry } from '../../utils/routeGeometry';
import { formatDistance, formatElevation } from '../../utils/units';
import { inheritedTrackColor, resolveTrackColor } from '../Map/trackColors';
import { BOX } from '../Planner/bookings/bookingParts';
import { getNavigationTargets, navigationTargetLabel, openNavigationTarget } from '../Planner/placeNavigation';
import { SoftPill, tintOf } from '../Planner/planParts';
import DetailShell from '../shared/DetailShell';
import { DeleteButton, DialogButton, DialogSection, FooterSpacer, fs } from '../shared/DialogShell';
import ElevationProfile from '../shared/ElevationProfile';
import { NavigationMenu } from '../shared/NavigationMenu';
import { useToast } from '../shared/Toast';
import { Tooltip } from '../shared/Tooltip';
import TrackColorPicker from '../shared/TrackColorPicker';
import { markdownLinkComponents } from '../shared/markdownLink';
import { TourDayRowAvatar } from './TourDayRowFacts';
import { TourGpxExportButton } from './TourGpxExportButton';
import { TourTypeSections } from './TourTypeSections';
import TourActivitySection from './activity/TourActivitySection';
import type { PlanValues } from './activity/planComparison';
import { TourSaveToCollectionButton } from './collection/TourSaveToCollectionButton';
import { TourPackingSection } from './packing/TourPackingSection';
import { TourProvenanceBlock } from './provenance/TourProvenanceSection';
import { RunHeadPills } from './run/RunHeadPills';
import { SkiHeadPill } from './ski/skiMarks';
import { TourDayAddButton } from './stages/TourDayAddButton';
import { stageKeysOfTour, type TourDayHow } from './stages/stageSpread';
import { tourDayRowIcon } from './tourDayRowIcon';
import { tourDaysOf } from './tourDays';
import { heightsUnknown, movingTimeLabel, withoutHeights } from './tourFacts';
import { TourDayTiles, TourFactFields, TourMetricFields, type TourMetricField } from './tourParts';
import {
  estimateBadgeText,
  estimateField,
  formatPlannedTourDuration,
  hikeSourceBadgeLabel,
  plannedTotalText,
  tourPlannedTimes,
  tourSource,
  tourWebsitePresentation,
  type TourPlannedTimes,
} from './tourPresentation';
import { tourShareFactsOf } from './tourShareText';
import { useTourDayAssignment } from './useTourDayAssignment';
import { useTourPermissions, type TourPermissionProps } from './useTourPermissions';
import { WalkRoutePendingHint } from './walk/WalkRoutePending';
import { walkTimeFields } from './walk/walkTimeFields';

interface TourDetailDialogProps extends TourPermissionProps {
  tour: TourListItem;
  place: Place;
  days?: Day[];
  selectedDayId?: number | null;
  selectedAssignmentId?: number | null;
  assignments?: AssignmentsMap;
  files?: TripFile[];
  onClose: () => void;
  onUpdatePlace?: (placeId: number, data: Partial<Place>) => Promise<void> | void;
  onFileUpload?: (formData: FormData) => Promise<unknown>;
  /** A wanderer snapshot's source check brought the changed trail in as a new tour (MF-03). */
  onSourceReimported?: (tour: TourListItem) => Promise<void> | void;
  /** P2C-07: save this tour again as a new, independent one. */
  onSaveAsNew?: (tour: TourListItem) => Promise<void> | void;
  /** ACT-01: a recorded track was assigned, taken off or imported; the lists take in these tours. */
  onToursChanged?: (placeIds: number[]) => Promise<void> | void;
  /** P2D-XD-01: opens the trip's packing list the tour points at. */
  onOpenPacking?: () => void;
  /** `how` is the answer the day menu got for a multi-day tour (MDT-02); without it the plan asks. */
  onAssignToDay?: (placeId: number, dayId?: number, position?: number, how?: TourDayHow) => void;
  onRemoveAssignment?: (dayId: number, assignmentId: number) => void;
  onDelete?: () => void;
  leftWidth?: number;
  rightWidth?: number;
  desktopNonModal?: boolean;
  readOnly?: boolean;
  /** Desktop-only opener; the map detail stays non-modal and returns focus when closed. */
  desktopFocusReturnTarget?: HTMLElement | null;
}

/** The pills of the head band: white like a place's, one fact each. */
const HEAD_PILL =
  'inline-flex flex-none items-center gap-1 h-[22px] whitespace-nowrap rounded-full px-2 font-geist font-medium tabular-nums text-content-secondary bg-surface-card shadow-sm';

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function assignmentForSelectedDay(
  assignments: AssignmentsMap,
  selectedDayId: number | null,
  selectedAssignmentId: number | null,
  placeId: number
): Assignment | null {
  if (selectedDayId == null) return null;
  const dayAssignments = assignments[String(selectedDayId)] || [];
  return (
    (selectedAssignmentId ? dayAssignments.find((assignment) => assignment.id === selectedAssignmentId) : null) ??
    dayAssignments.find((assignment) => assignment.place?.id === placeId) ??
    null
  );
}

/** The tour's measures, its times and its profile. Without heights the distance joins the times in one row. */
function TourDetailMeasures({
  analysis,
  unit,
  timeFields,
  trackColor,
  placeId,
}: {
  analysis: NonNullable<ReturnType<typeof analyzeRouteGeometry>>;
  unit: DistanceUnit;
  timeFields: TourMetricField[];
  trackColor: string;
  placeId: number;
}) {
  return (
    <div className="flex flex-none flex-col gap-2">
      {analysis.minEle == null && analysis.gain == null ? (
        <TourMetricFields
          analysis={analysis}
          unit={unit}
          extra={timeFields}
          columns={timeFields.length === 1 ? 2 : timeFields.length === 2 ? 3 : undefined}
        />
      ) : (
        <>
          <TourMetricFields analysis={analysis} unit={unit} columns={5} />
          {/* The times fill the row: two share it, three take a third each. */}
          {timeFields.length > 0 && (
            <TourFactFields
              fields={timeFields}
              columns={timeFields.length === 2 ? 2 : timeFields.length >= 3 ? 3 : undefined}
            />
          )}
        </>
      )}
      {analysis.distanceIndexedProfileSamples.length >= 2 && (
        <div className={`${BOX} p-2`}>
          <ElevationProfile
            samples={analysis.distanceIndexedProfileSamples}
            color={trackColor}
            gradientId={`tour-elevation-${placeId}`}
          />
        </div>
      )}
    </div>
  );
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

/**
 * The parts of the time a tour takes, as fields: walking, breaks, the planned
 * total; a city walk its walking time, its stays and their total, in the
 * planner's wording (CW-02).
 */
function tourTimeFields(
  times: TourPlannedTimes,
  t: Translate,
  tour: Pick<TourListItem, 'tour_type'>
): TourMetricField[] {
  const walking = { label: movingTimeLabel(tour, t('tours.planner.walkingShort'), t) };
  if (times.walk) {
    return walkTimeFields({
      walking,
      walkingMinutes: times.walkingMinutes,
      stays: times.walk,
      manualMinutes: times.manuallyOverridden ? times.plannedTotalMinutes : null,
      t,
    });
  }
  return [
    times.walkingMinutes != null ? { ...walking, value: formatPlannedTourDuration(times.walkingMinutes) } : null,
    times.breakMinutes
      ? { label: t('tours.planner.breaksShort'), value: formatPlannedTourDuration(times.breakMinutes) }
      : null,
    times.plannedTotalMinutes != null
      ? {
          label: times.manuallyOverridden
            ? `${t('tours.planner.plannedShort')} (${t('tours.planner.plannedTotalManual')})`
            : t('tours.planner.plannedShort'),
          value: formatPlannedTourDuration(times.plannedTotalMinutes),
        }
      : null,
    // TIME-01: what an import is estimated to take, or that it is unknown, apart from the times above.
    times.estimate ? estimateField(times.estimate, t) : null,
  ].filter((field): field is TourMetricField => field !== null);
}

/**
 * The head's facts as pills: the type, a run's profile and pace or a ski tour's
 * discipline, where it came from, the time (its parts
 * in the tooltip), distance, ascent, descent, and a caution.
 */
function TourHeadPills({
  tour,
  trackColor,
  timeFields,
  times,
  metrics,
}: {
  tour: TourListItem;
  trackColor: string;
  timeFields: TourMetricField[];
  /** The planned total where there is one, as the day row shows it, otherwise the walking time. */
  times: TourPlannedTimes;
  /** Measured from the line as it is now, so the head says what the fields below say. */
  metrics: { distanceKm: number | null; gain: number | null; loss: number | null };
}) {
  const { t } = useTranslation();
  const distanceUnit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const timeTooltip = timeFields.map((field) => `${field.label}: ${field.value}`).join(', ');
  const shownTime =
    plannedTotalText(times, t, true) ??
    (times.walkingMinutes == null ? null : formatPlannedTourDuration(times.walkingMinutes)) ??
    estimateBadgeText(times.estimate);
  const source = tourSource(tour);
  // The import this tour was planned from, named while it is still in the trip.
  const derivedFromName = useTripStore((state) =>
    tour.derived_from_place_id == null
      ? null
      : (state.places.find((p) => p.id === tour.derived_from_place_id)?.name ?? null)
  );
  // ACT-01: the tour this one is the recorded track of.
  const documentsName = useTripStore((state) =>
    tour.activity_of == null ? null : (state.places.find((p) => p.id === tour.activity_of)?.name ?? null)
  );
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className={HEAD_PILL} style={fs(10.5)}>
        {createElement(tourDayRowIcon(tour.tour_type), {
          size: 11,
          strokeWidth: 2,
          className: 'flex-none',
          style: { color: trackColor },
        })}
        {t(`tourTypes.${tour.tour_type}`)}
      </span>
      {/* RUN-01: a run's profile and the pace its time is planned at. */}
      <RunHeadPills tour={tour} className={HEAD_PILL} />
      {/* SKI-02: a ski tour's discipline, a cross-country technique inside it. */}
      <SkiHeadPill tour={tour} className={HEAD_PILL} />
      {/* A paddle tour names its boat and its water, each a badge of its own. */}
      {tour.boat_type && (
        <span className={HEAD_PILL} style={fs(10.5)} data-testid="tour-detail-boat">
          {t(`tours.paddle.boat.${tour.boat_type}`)}
        </span>
      )}
      {tour.water_context && (
        <span className={HEAD_PILL} style={fs(10.5)} data-testid="tour-detail-water">
          {t(`tours.paddle.water.${tour.water_context}`)}
        </span>
      )}
      {source !== 'trek' && (
        <span className={HEAD_PILL} style={fs(10.5)}>
          <FileDown size={11} strokeWidth={2} className="flex-none text-content-faint" />
          {hikeSourceBadgeLabel(tour, t)}
        </span>
      )}
      {derivedFromName && (
        <Tooltip label={t('tours.derivedFromHint')}>
          <span className={`${HEAD_PILL} max-w-[220px]`} style={fs(10.5)}>
            <Route size={11} strokeWidth={2} className="flex-none text-content-faint" />
            <span className="min-w-0 truncate">{t('tours.derivedFrom', { name: derivedFromName })}</span>
          </span>
        </Tooltip>
      )}
      {documentsName && (
        <Tooltip label={t('tours.activity.isTrackHint')}>
          <span data-testid="tour-detail-track-of" className={`${HEAD_PILL} max-w-[220px]`} style={fs(10.5)}>
            <CheckCheck size={11} strokeWidth={2} className="flex-none text-success" />
            <span className="min-w-0 truncate">{t('tours.activity.ofTour', { name: documentsName })}</span>
          </span>
        </Tooltip>
      )}
      {shownTime != null && (
        <Tooltip label={timeTooltip}>
          <span aria-label={timeTooltip} className={HEAD_PILL} style={fs(10.5)}>
            <Clock size={11} strokeWidth={2} className="flex-none text-content-faint" />
            {shownTime}
          </span>
        </Tooltip>
      )}
      {metrics.distanceKm != null && (
        <span
          aria-label={`${t('tours.detail.distance')}: ${formatDistance(metrics.distanceKm, distanceUnit)}`}
          className={HEAD_PILL}
          style={fs(10.5)}
        >
          <Ruler size={11} strokeWidth={2} className="flex-none text-content-faint" />
          {formatDistance(metrics.distanceKm, distanceUnit)}
        </span>
      )}
      {metrics.gain != null && (
        <span
          aria-label={`${t('tours.detail.ascent')}: ${formatElevation(metrics.gain, distanceUnit)}`}
          className={HEAD_PILL}
          style={fs(10.5)}
        >
          <ArrowUp size={11} strokeWidth={2} className="flex-none text-content-faint" />
          {formatElevation(metrics.gain, distanceUnit)}
        </span>
      )}
      {metrics.loss != null && (
        <span
          aria-label={`${t('tours.detail.descent')}: ${formatElevation(metrics.loss, distanceUnit)}`}
          className={HEAD_PILL}
          style={fs(10.5)}
        >
          <ArrowDown size={11} strokeWidth={2} className="flex-none text-content-faint" />
          {formatElevation(metrics.loss, distanceUnit)}
        </span>
      )}
      {tour.caution && (
        <Tooltip label={t('tours.caution.tooltip')}>
          <span className="inline-flex">
            <SoftPill tone="warning" icon={<AlertTriangle size={11} strokeWidth={2} className="flex-none" />}>
              {t('tours.caution.badge')}
            </SoftPill>
          </span>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * The card a tour opens over the map, made like the place inspector: a head band
 * tinted by the track colour with the grade tile, the name, what kind of tour it
 * is and where it came from, its facts as pills; then the days it is on, its
 * numbers with the elevation profile, its texts and files; the actions in a
 * footer that stays in reach.
 */
/**
 * The non-modal desktop dialog closes on Escape like a modal would, and gives
 * focus back to what opened it.
 */
function useDesktopEscape(active: boolean, onClose: () => void, focusReturnTarget: HTMLElement | null) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const focusReturnRef = useRef(focusReturnTarget);
  focusReturnRef.current = focusReturnTarget;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      closeRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const opener = focusReturnRef.current;
      if (opener?.isConnected) opener.focus();
    };
  }, [active]);
}

/** Renaming the tour in place; `onUpdatePlace` is given only to someone who may change it. */
function useTourNameEditor(place: Place, onUpdatePlace?: TourDetailDialogProps['onUpdatePlace']) {
  const { t } = useTranslation();
  const toast = useToast();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(place.name);
  const [savingName, setSavingName] = useState(false);

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name || name === place.name || !onUpdatePlace) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onUpdatePlace(place.id, { name });
      setEditingName(false);
    } catch (error: unknown) {
      toast.error(translateApiError(t, error, 'common.error'));
    } finally {
      setSavingName(false);
    }
  };

  return { editingName, setEditingName, nameDraft, setNameDraft, savingName, saveName };
}

/** The tour's name in the head; `onUpdatePlace` is given only to someone who may rename it, in place. */
function TourNameHeading({
  place,
  onUpdatePlace,
}: {
  place: Place;
  onUpdatePlace?: TourDetailDialogProps['onUpdatePlace'];
}) {
  const { t } = useTranslation();
  const { editingName, setEditingName, nameDraft, setNameDraft, savingName, saveName } = useTourNameEditor(
    place,
    onUpdatePlace
  );
  if (onUpdatePlace && editingName) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void saveName();
            if (event.key === 'Escape') {
              event.preventDefault();
              setNameDraft(place.name);
              setEditingName(false);
            }
          }}
          aria-label={t('places.formName')}
          className="-ms-1.5 block min-w-0 flex-1 rounded-[8px] border-0 bg-surface-card px-1.5 py-0.5 font-bold tracking-[-0.01em] text-content shadow-sm outline-none"
          style={fs(17, 'subtitle')}
        />
        <Tooltip label={t('common.save')}>
          <button
            type="button"
            onClick={() => void saveName()}
            disabled={savingName}
            aria-label={t('common.save')}
            className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent text-accent-text shadow-sm disabled:opacity-50"
          >
            <Check size={15} strokeWidth={2.4} />
          </button>
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <h2
        className="m-0 min-w-0 break-words font-bold leading-snug tracking-[-0.01em] text-content"
        style={fs(17, 'subtitle')}
      >
        {place.name}
      </h2>
      {onUpdatePlace && (
        <Tooltip label={t('common.edit')}>
          <button
            type="button"
            onClick={() => {
              setNameDraft(place.name);
              setEditingName(true);
            }}
            aria-label={t('common.edit')}
            className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-card hover:text-content"
          >
            <Pencil size={12} strokeWidth={2.2} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

export default function TourDetailDialog({
  tour,
  place,
  days = [],
  selectedDayId = null,
  selectedAssignmentId = null,
  assignments = {},
  files = [],
  onClose,
  onUpdatePlace,
  onFileUpload,
  onSourceReimported,
  onSaveAsNew,
  onToursChanged,
  onOpenPacking,
  onAssignToDay,
  onRemoveAssignment,
  onDelete,
  leftWidth = 0,
  rightWidth = 0,
  desktopNonModal = false,
  readOnly = false,
  desktopFocusReturnTarget = null,
  canEdit: editPermission,
  canAssign: assignPermission,
}: TourDetailDialogProps) {
  const { canEdit: hasEditPermission, canAssign } = useTourPermissions({
    tripId: place.trip_id,
    canEdit: editPermission,
    canAssign: assignPermission,
  });
  const canEdit = hasEditPermission && !readOnly;
  const dayAssignment = useTourDayAssignment({
    canAssign,
    onAssignToDay: (id, dayId, position, how) =>
      how ? onAssignToDay?.(id, dayId, position, how) : onAssignToDay?.(id, dayId),
  });
  const { t } = useTranslation();
  const distanceUnit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const [colorOpen, setColorOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationAnchorRef = useRef<HTMLSpanElement>(null);
  useDesktopEscape(desktopNonModal, onClose, desktopFocusReturnTarget);

  const heightsHidden = heightsUnknown(tour);
  const analysis = useMemo(() => {
    const measured = analyzeRouteGeometry(place.route_geometry);
    return measured && heightsHidden ? withoutHeights(measured) : measured;
  }, [heightsHidden, place.route_geometry]);
  const trackColor = resolveTrackColor(place);
  const inheritedColor = inheritedTrackColor(place);
  const assignment = assignmentForSelectedDay(assignments, selectedDayId, selectedAssignmentId, place.id);
  const tourDays = tourDaysOf(place.id, days, assignments);
  const placeFiles = filesForPlace(files, place.id, [], assignment ? [assignment.id] : []);
  const navigationTargets = getNavigationTargets(place);
  const navigationLabel =
    navigationTargets.length === 1 ? navigationTargetLabel(navigationTargets[0], t) : t('inspector.navigation');
  const description = tour.description !== undefined ? tour.description : place.description;
  const website = tourWebsitePresentation(tour.website !== undefined ? tour.website : place.website);
  const times = tourPlannedTimes(tour);

  const timeFields = tourTimeFields(times, t, tour);
  // The plan as the line measures it now: the head says it, and an actual track is compared with it (ACT-02).
  const planDistanceKm = analysis?.distanceKm ?? tour.distance;
  const planGain = analysis ? analysis.gain : tour.elevation_gain;
  const planLoss = analysis ? analysis.loss : tour.elevation_loss;
  const plan = useMemo<PlanValues>(
    () => ({
      distanceKm: planDistanceKm,
      gain: planGain,
      loss: planLoss,
      minutes: times.plannedTotalMinutes,
      minutesAtLeast: times.atLeast,
      line: analysis?.routeCoordinates ?? null,
    }),
    [analysis, planDistanceKm, planGain, planLoss, times.atLeast, times.plannedTotalMinutes]
  );

  const header = (
    <>
      <div className="relative flex-none">
        <div className="rounded-full bg-surface-card p-[2.5px] shadow-sm">
          <TourDayRowAvatar tour={tour} size={52} />
        </div>
        {/* The track colour, picked where it shows: a dot on the tile, the picker below the head. */}
        <Tooltip label={t('tours.detail.trackColor')}>
          <button
            type="button"
            onClick={() => {
              if (canEdit && onUpdatePlace) setColorOpen((open) => !open);
            }}
            disabled={!canEdit || !onUpdatePlace}
            aria-label={t('tours.detail.trackColor')}
            aria-expanded={colorOpen}
            className="absolute -bottom-0.5 -end-0.5 grid h-[20px] w-[20px] place-items-center rounded-full bg-surface-card shadow-sm ring-1 ring-edge-faint transition-transform enabled:hover:scale-110 disabled:cursor-default"
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: trackColor }} />
          </button>
        </Tooltip>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <TourNameHeading place={place} onUpdatePlace={canEdit ? onUpdatePlace : undefined} />
        <TourHeadPills
          tour={tour}
          trackColor={trackColor}
          timeFields={timeFields}
          times={times}
          metrics={{ distanceKm: plan.distanceKm, gain: plan.gain, loss: plan.loss }}
        />
      </div>
    </>
  );

  const footer = (
    <>
      {canAssign &&
        selectedDayId != null &&
        (assignment
          ? onRemoveAssignment && (
              <DialogButton
                onClick={() => {
                  if (canAssign) onRemoveAssignment(selectedDayId, assignment.id);
                }}
                icon={<Minus size={14} strokeWidth={2} />}
                aria-label={t('inspector.removeFromDay')}
              >
                <span className="max-sm:hidden">{t('inspector.removeFromDay')}</span>
              </DialogButton>
            )
          : onAssignToDay && (
              <TourDayAddButton
                placeId={place.id}
                dayId={selectedDayId}
                days={days}
                stageCount={stageKeysOfTour(tour).length}
                assignment={dayAssignment}
              />
            ))}
      {navigationTargets.length > 0 && (
        <>
          <Tooltip label={t('tours.detail.navigationHint')}>
            <span ref={navigationAnchorRef} className="inline-flex">
              <DialogButton
                onClick={() => {
                  if (navigationTargets.length === 1) openNavigationTarget(navigationTargets[0]);
                  else setNavigationOpen((open) => !open);
                }}
                aria-label={navigationLabel}
                aria-haspopup={navigationTargets.length > 1 ? 'menu' : undefined}
                aria-expanded={navigationTargets.length > 1 ? navigationOpen : undefined}
                icon={<Navigation size={14} strokeWidth={2} />}
              >
                <span className="max-sm:hidden">{navigationLabel}</span>
              </DialogButton>
            </span>
          </Tooltip>
          {navigationOpen && (
            <NavigationMenu
              targets={navigationTargets}
              anchor={navigationAnchorRef.current}
              onClose={() => setNavigationOpen(false)}
            />
          )}
        </>
      )}
      {website && (
        <Tooltip label={website.domain}>
          <span className="inline-flex">
            <DialogButton
              onClick={() => window.open(website.href, '_blank', 'noopener,noreferrer')}
              icon={<ExternalLink size={14} strokeWidth={2} />}
              aria-label={`${t('places.formWebsite')}: ${website.provider ?? website.domain}`}
            >
              <span className="max-sm:hidden">{website.provider ?? t('places.formWebsite')}</span>
            </DialogButton>
          </span>
        </Tooltip>
      )}
      {/* A tour written here offline has no server copy to export until it syncs. */}
      {analysis && place.id > 0 && (
        <TourGpxExportButton
          target={{
            tripId: place.trip_id,
            placeId: place.id,
            name: place.name,
            revision: tour.revision,
            facts: tourShareFactsOf(tour, analysis),
          }}
        />
      )}
      {place.id > 0 && (
        <TourSaveToCollectionButton target={{ tripId: place.trip_id, placeId: place.id, name: place.name }} />
      )}
      {canEdit && onSaveAsNew && <SaveAsNewButton onSave={() => onSaveAsNew(tour)} />}
      <FooterSpacer />
      {canEdit && onDelete && (
        <DeleteButton
          onClick={() => {
            if (canEdit) onDelete();
          }}
        />
      )}
    </>
  );

  return (
    <DetailShell
      testId="tour-detail"
      header={header}
      footer={footer}
      onClose={onClose}
      closeLabel={t('common.close')}
      leftWidth={leftWidth}
      rightWidth={rightWidth}
      clearMapPill={desktopNonModal}
      tint={tintOf(trackColor)}
      closeButtonClassName="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      {colorOpen && canEdit && onUpdatePlace && (
        <DialogSection className="flex-none" label={t('tours.detail.trackColor')}>
          <div className={`${BOX} px-3 py-2.5`}>
            <TrackColorPicker
              value={place.route_color ?? null}
              inheritedColor={inheritedColor}
              onChange={(color) => {
                if (canEdit) void onUpdatePlace(place.id, { route_color: color });
              }}
            />
          </div>
        </DialogSection>
      )}

      <DialogSection className="flex-none" label={t('tours.days.label')}>
        {tourDays.length > 0 ? (
          <TourDayTiles tourDays={tourDays} />
        ) : (
          <p className="m-0 text-content-faint" style={fs(12, 'body')}>
            {t('tours.days.none')}
          </p>
        )}
      </DialogSection>

      {tour.route_pending && <WalkRoutePendingHint />}
      {analysis && (
        <TourDetailMeasures
          analysis={analysis}
          unit={distanceUnit}
          timeFields={timeFields}
          trackColor={trackColor}
          placeId={place.id}
        />
      )}
      <TourTypeSections
        tour={tour}
        place={place}
        assignment={assignment}
        canAssign={canAssign}
        days={days}
        assignments={assignments}
        route={analysis?.routeCoordinates ?? null}
        measured={!!analysis}
      />
      {/* A tour written here offline has no server copy to assign a recording to until it syncs. */}
      {place.id > 0 && (
        <TourActivitySection
          tripId={place.trip_id}
          tour={tour}
          days={days}
          assignments={assignments}
          canEdit={canEdit}
          plan={plan}
          planColor={trackColor}
          mapCompare={desktopNonModal}
          onToursChanged={onToursChanged}
        />
      )}
      <TourPackingSection
        tripId={place.trip_id}
        tour={tour}
        tourName={place.name}
        canEdit={canEdit}
        onOpenPacking={onOpenPacking}
      />

      {description && (
        <DialogSection className="flex-none" label={t('places.formDescription')}>
          <MarkdownBox>{description}</MarkdownBox>
        </DialogSection>
      )}
      {place.notes && (
        <DialogSection className="flex-none" label={t('places.formNotes')}>
          <MarkdownBox>{place.notes}</MarkdownBox>
        </DialogSection>
      )}
      {assignment?.notes && (
        <DialogSection className="flex-none" label={t('places.assignmentNotes')}>
          <MarkdownBox>{assignment.notes}</MarkdownBox>
        </DialogSection>
      )}

      <TourProvenanceBlock tripId={place.trip_id} tour={tour} canCheck={canEdit} onReimported={onSourceReimported} />
      <TourFilesSection placeId={place.id} files={placeFiles} onFileUpload={canEdit ? onFileUpload : undefined} />
    </DetailShell>
  );
}

/** P2C-07 in the footer: one press, the copy opens; the button waits while the server makes it. */
function SaveAsNewButton({ onSave }: { onSave: () => Promise<void> | void }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Tooltip label={t('tours.copy.hint')}>
      <span className="inline-flex">
        <DialogButton
          onClick={() => void save()}
          disabled={saving}
          icon={saving ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} strokeWidth={2} />}
          aria-label={t('tours.copy.action')}
        >
          <span className="max-sm:hidden">{t('common.copy')}</span>
        </DialogButton>
      </span>
    </Tooltip>
  );
}

/** A tour's files: the count to unfold, each file to open, and an upload for who may change the tour. */
function TourFilesSection({
  placeId,
  files,
  onFileUpload,
}: {
  placeId: number;
  files: TripFile[];
  /** Given only to someone who may change the tour. */
  onFileUpload?: (formData: FormData) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const placeFiles = files;

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (!onFileUpload || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('place_id', String(placeId));
        await onFileUpload(formData);
      }
      setFilesExpanded(true);
    } catch (error: unknown) {
      toast.error(translateApiError(t, error, 'files.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  if (placeFiles.length === 0 && !onFileUpload) return null;
  return (
    <DialogSection
      className="flex-none"
      label={t('inspector.files')}
      action={
        onFileUpload && (
          <label
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-semibold text-content-muted shadow-sm transition-colors focus-within:ring-2 focus-within:ring-accent hover:text-content"
            style={fs(10.5)}
          >
            <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={uploadFiles} />
            {uploading ? (
              <span aria-live="polite">…</span>
            ) : (
              <>
                <Upload size={11} strokeWidth={2} />
                {t('common.upload')}
              </>
            )}
          </label>
        )
      }
    >
      <div className={BOX}>
        <button
          type="button"
          onClick={() => setFilesExpanded((expanded) => !expanded)}
          aria-expanded={filesExpanded}
          className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-start transition-colors hover:bg-surface-hover"
        >
          <FileText size={13} strokeWidth={2} className="flex-none text-content-faint" />
          <span className="min-w-0 flex-1 truncate font-medium text-content-secondary" style={fs(12, 'body')}>
            {placeFiles.length ? t('inspector.filesCount', { count: placeFiles.length }) : t('inspector.files')}
          </span>
          {filesExpanded ? (
            <ChevronUp size={13} className="flex-none text-content-faint" />
          ) : (
            <ChevronDown size={13} className="flex-none text-content-faint" />
          )}
        </button>
        {filesExpanded && placeFiles.length > 0 && (
          <div className="flex flex-col gap-0.5 border-t border-edge-faint p-1">
            {placeFiles.map((file) => (
              <button
                type="button"
                key={file.id}
                onClick={() => void openFile(file.url)}
                className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-start transition-colors hover:bg-surface-hover"
              >
                {(file.mime_type || '').startsWith('image/') ? (
                  <FileImage size={12} strokeWidth={2} className="flex-none text-content-muted" />
                ) : (
                  <File size={12} strokeWidth={2} className="flex-none text-content-muted" />
                )}
                <span className="min-w-0 flex-1 truncate text-content-secondary" style={fs(12, 'body')}>
                  {file.original_name}
                </span>
                {file.file_size ? (
                  <span className="flex-none tabular-nums text-content-faint" style={fs(11)}>
                    {formatFileSize(file.file_size)}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </DialogSection>
  );
}

/** Markdown in a framed box, like the inspector's; long words wrap instead of widening the card. */
function MarkdownBox({ children }: { children: string }) {
  return (
    <div
      className={`${BOX} collab-note-md px-3 py-2 text-content-secondary`}
      style={{ ...fs(12.5, 'body'), lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>
        {children}
      </Markdown>
    </div>
  );
}
