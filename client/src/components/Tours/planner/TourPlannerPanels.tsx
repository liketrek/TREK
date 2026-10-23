import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PlannableTourType, TourListItem } from '@trek/shared'
import { AlertTriangle, ArrowLeft, History, Loader2, MapPin, Mountain, Plus, Redo2, Route, Trash2, Undo2 } from 'lucide-react'
import type { Day } from '../../../types'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTourFerrataCrossingStore } from '../../../store/tourFerrataCrossingStore'
import { formatDistance } from '../../../utils/units'
import ConfirmDialog from '../../shared/ConfirmDialog'
import { NEUTRAL_TINT, fs } from '../../shared/DialogShell'
import EmptyState from '../../shared/EmptyState'
import { useToast } from '../../shared/Toast'
import { Tooltip } from '../../shared/Tooltip'
import { BOX } from '../../Planner/bookings/bookingParts'
import { BarButton, SoftPill } from '../../Planner/planParts'
import TourListRow from '../TourListRow'
import ElevationProfile from '../../shared/ElevationProfile'
import { formatPlannedTourDuration, hikeSourceBadgeLabel, profileFocusLabel, tourSource } from '../tourPresentation'
import { CardAction, FoldButton, RailCard, RailFacts, TourDayMenu, TourListCard, TourNotice, TourSection, type TourMetricField } from '../tourParts'
import { movingTimeLabel, tourMetricFacts, withoutHeights } from '../tourFacts'
import { TourDetailsSection, TourNameField } from './TourEditorFields'
import { crossesLake } from '../paddle/lakeStyleAdvice'
import { PaddleCheckCard } from '../paddle/PaddleCheckCard'
import { PaddleSafetyRow } from '../paddle/PaddleSafety'
import { PaddleTimeCard } from '../paddle/PaddleTimeCard'
import { PaddleWindSection } from '../paddle/PaddleWindCard'
import { TrackPaddlePlanCards } from '../paddle/TrackPaddlePlanCard'
import type { PaddleChecklist } from '../paddle/usePaddleChecklist'
import type { TrackPaddlePlan } from '../paddle/useTrackPaddlePlan'
import { SkiTrackCard } from '../ski/SkiTrackCard'
import type { SkiClassification } from '../ski/useSkiClassification'
import { TourTypeFields } from './TourTypeFields'
import TourWaypointList from './TourWaypointList'
import { TourStageLossNotice } from '../stages/TourStageLossNotice'
import { TourStageDayNotice } from '../stages/TourStageDayNotice'
import { TourStageModeField } from '../stages/TourStageModeField'
import { TourStagesSection } from '../stages/TourStagesSection'
import { stageBoundariesM } from '../stages/tourStages'
import { stageKeysOfTour } from '../stages/stageSpread'
import { TourStageOverview } from '../stages/TourStageOverview'
import { useTourStageRail } from '../stages/useTourStageRail'
import { useTripStore } from '../../../store/tripStore'
import type { DistanceIndexedProfileSample } from '../../../utils/routeGeometry'
import type { TourPlannerController } from './useTourPlanner'
import { RailStatusBadges } from './TourRailStatus'
import type { Translate } from './railStatusText'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'
import TourConversionSection from '../conversion/TourConversionSection'
import type { GpxConversion } from '../conversion/useGpxConversion'
import type { RecordedTrack } from '../useRecordedTrack'
import type { TourGpxImport } from '../useTourGpxImport'
import { TourAddMenu } from './TourAddMenu'
import { type AssignTourToDay, useTourDayAssignment } from '../useTourDayAssignment'
import WandererMark from '../wanderer/WandererMark'
import { TourGpxExportBarButton } from '../TourGpxExportButton'
import { plannerShareFacts, tourShareFactsOf } from '../tourShareText'
import { TourSaveToCollectionBarButton } from '../collection/TourSaveToCollectionButton'
import { TourRemoteChangeNotice, TourRevisionConflictDialog } from './TourRevisionNotice'
import { WalkImportDraftNotice } from '../walk/WalkImportDialog'
import { WalkFerryNotice } from '../walk/WalkFerryNotice'
import { WalkRoutePendingNotice } from '../walk/WalkRoutePending'
import TourListFilterMenu, { TourFilterEmpty } from '../TourListFilterMenu'
import { TourScopeSummary } from '../TourScopeSummary'
import { useTourListFilters } from '../useTourListFilters'
import { useTourUndoShortcut } from './useTourUndoShortcut'
import { TourEditorRailFooter } from './TourEditorRailFooter'
import { TourPoiSearchCard } from '../poi/TourPoiSearchCard'
import { BikeWaysCard } from '../bike/BikeWaysCard'
import { RunWaysCard } from '../run/RunWaysCard'
import { HorseRoutesCard } from '../horse/HorseRoutesCard'
import { RecordedRideCard } from '../horse/RecordedRideFacts'
import { HikeWaysCard } from '../hike/HikeWaysCard'
import { SkiPlannerSummary } from '../ski/SkiRouteSummary'
import { walkTimeFields } from '../walk/walkTimeFields'

/** The tinted head band both rails open with, like every panel head in the planner. */
export const RAIL_HEAD = 'flex flex-none items-start gap-2 border-b border-edge-faint px-3 py-2.5'

/** The title of a rail's head band, with an optional line under it. */
export function RailTitle({ title, sub, aside }: { title: string; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 pt-[5px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <h2 className="m-0 min-w-0 truncate font-bold tracking-[-0.01em] text-content" style={fs(14, 'body')}>{title}</h2>
        {aside}
      </div>
      {typeof sub === 'string'
        ? <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11.5, 'body')}>{sub}</p>
        : sub}
    </div>
  )
}

/**
 * The via ferratas the tour climbs, one warning badge each over the overview,
 * the stretch and what it asks of a hiker in its tooltip. The router takes a
 * ferrata like any trail once the difficulty allows alpine routes, so this is
 * the one place that says so.
 */
function FerrataCrossingBadges() {
  const { t } = useTranslation()
  const unit = useSettingsStore(state => state.settings.distance_unit)
  const crossings = useTourFerrataCrossingStore(state => state.crossings)
  if (crossings.length === 0) return null
  const byFerrata = new Map<string, { name: string; grade: string | null; metres: number }>()
  for (const crossing of crossings) {
    const entry = byFerrata.get(crossing.id) ?? { name: crossing.name, grade: crossing.grade, metres: 0 }
    entry.metres += crossing.toM - crossing.fromM
    byFerrata.set(crossing.id, entry)
  }
  return (
    <div data-testid="tour-ferrata-crossings" className="mb-2.5 flex min-w-0 flex-wrap gap-1">
      {[...byFerrata].map(([id, ferrata]) => {
        const info = t('tours.ferrata.crossingInfo', { length: formatDistance(ferrata.metres / 1000, unit ?? 'metric'), name: ferrata.name })
        return (
          <Tooltip key={id} label={info}>
            <span aria-label={info} className="inline-flex min-w-0">
              <SoftPill tone="warning" icon={<AlertTriangle size={10} strokeWidth={2.2} className="flex-none" />}>
                <span className="min-w-0 truncate">{ferrata.grade ? t('tours.ferrata.badge', { grade: ferrata.grade }) : t('tours.ferrata.badgeNoGrade')}</span>
              </SoftPill>
            </span>
          </Tooltip>
        )
      })}
    </div>
  )
}

/** The rail while nothing is open: a new tour, or the wanderer trails. */
function NeutralRail({
  planner,
  canEdit,
  onOpenWanderer,
}: {
  planner: TourPlannerController
  canEdit: boolean
  onOpenWanderer?: () => void
}) {
  const { t } = useTranslation()
  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.title')}>
      <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (canEdit) planner.startNewTour()
          }}
          className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
          style={fs(12.5, 'body')}
        >
          <Plus size={14} strokeWidth={2.2} className="flex-none" />
          <span className="truncate">{t('tours.planner.newTour')}</span>
        </button>
        {canEdit && onOpenWanderer && (
          <Tooltip label={t('wanderer.browser.openHint')}>
            <button
              type="button"
              onClick={onOpenWanderer}
              data-testid="tour-rail-open-wanderer"
              className="flex h-8 flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-surface-card px-3 font-semibold text-content-secondary shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:text-content"
              style={fs(12.5, 'body')}
            >
              <WandererMark size={14} className="flex-none" />
              {t('wanderer.browser.open')}
            </button>
          </Tooltip>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmptyState
          scene="tours"
          size={116}
          fill
          surface="var(--bg-secondary)"
          title={t('tours.planner.neutralTitle')}
          action={
            <p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>
              {t('tours.planner.neutralBody')}
            </p>
          }
        />
      </div>
    </section>
  )
}

/** Where a recorded track starts, the place its wind is asked for. */
function trackStart(line: readonly (readonly [number, number])[] | undefined): { lat: number; lng: number } | null {
  const first = line?.[0]
  return first ? { lat: first[0], lng: first[1] } : null
}

/** The rail for an imported tour: shown as it came in, measured, never edited. */
function GpxViewRail({
  planner,
  canEdit,
  conversion,
  trackPaddlePlan,
  paddleChecklist,
  skiClassification,
}: {
  planner: TourPlannerController
  canEdit: boolean
  conversion?: GpxConversion
  trackPaddlePlan?: TrackPaddlePlan
  paddleChecklist?: PaddleChecklist
  skiClassification?: SkiClassification
}) {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore((state) => state.settings.distance_unit)
  const { readOnlyGpxTour } = planner
  if (planner.mode.type !== 'view-gpx' || !readOnlyGpxTour) return null
  const { tour } = readOnlyGpxTour
  const fromWanderer = tourSource(tour) === 'wanderer'
  const analysis = planner.readOnlyGpxAnalysis
  const extra =
    tour.duration != null
      ? [
          {
            label: movingTimeLabel(tour, t('tours.planner.inspector.duration'), t),
            value: t('tours.durationMinutes', { count: Math.max(1, Math.round(tour.duration)) }),
          },
        ]
      : []
  return (
    <>
      <section className="flex h-full min-h-0 flex-col" aria-label={tour.name}>
        <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
          <BarButton
            label={t('tours.planner.backToTours')}
            onClick={() => planner.returnToNeutral({ keepView: true })}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </BarButton>
          <RailTitle
            title={t(fromWanderer ? 'wanderer.tourTitle' : 'tours.planner.gpxTitle')}
            sub={tour.name}
            aside={<SoftPill>{hikeSourceBadgeLabel(tour, t)}</SoftPill>}
          />
          {tour.place_id > 0 && (
            <>
              <TourGpxExportBarButton target={{ tripId: planner.tripId, placeId: tour.place_id, name: tour.name, revision: tour.revision, facts: tourShareFactsOf(tour, analysis) }} unsaved={false} />
              <TourSaveToCollectionBarButton target={{ tripId: planner.tripId, placeId: tour.place_id, name: tour.name }} unsaved={false} />
            </>
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          {conversion && <TourConversionSection conversion={conversion} />}
          {skiClassification && <SkiTrackCard ski={skiClassification} />}
          {trackPaddlePlan && <TrackPaddlePlanCards plan={trackPaddlePlan} tour={tour} />}
          {paddleChecklist && tour.tour_type === 'kayak' && <PaddleCheckCard checklist={paddleChecklist} />}
          {tour.tour_type === 'kayak' && (
            <PaddleWindSection placeId={tour.place_id} start={trackStart(analysis?.routeCoordinates)} />
          )}
          {/* HOR-02: a recorded ride says what the import did not do for it. */}
          {tour.tour_type === 'horse' && <RecordedRideCard heightsMissing={!!analysis && analysis.gain == null} />}
          <RailCard icon={<Mountain size={14} strokeWidth={2} />} title={t('tours.planner.inspector.title')}>
            {analysis ? (
              <div className="flex flex-col gap-3">
                <RailFacts facts={tourMetricFacts(analysis, distanceUnit, t, extra)} />
                <ElevationSection
                  id="tour-planner-gpx-elevation-profile"
                  samples={analysis.distanceIndexedProfileSamples}
                  gradientId={`planner-gpx-elevation-${tour.place_id}`}
                  planner={planner}
                />
              </div>
            ) : (
              <p className="m-0 text-content-muted" style={fs(12, 'body')}>
                {t('tours.planner.gpxNoGeometry')}
              </p>
            )}
          </RailCard>
          {tour.tour_type === 'hike' && (
            <HikeWaysCard tripId={planner.tripId} route={analysis?.routeCoordinates ?? null} routingLimit={null} />
          )}
        </div>
        {tour.tour_type === 'kayak' && (
          <div className="flex-none border-t border-edge-faint px-3 py-3">
            <PaddleSafetyRow />
          </div>
        )}
      </section>
      <NewTourConfirmDialog planner={planner} canEdit={canEdit} />
    </>
  )
}

/** A paddle tour's cards in the editor, after its control points: the obstacle checklist, the time and the wind. */
function PaddleEditorCards({ planner, locked, checklist }: {
  planner: TourPlannerController
  locked: boolean
  checklist?: PaddleChecklist
}) {
  if (!planner.isPaddle) return null
  return (
    <>
      {checklist && <PaddleCheckCard checklist={checklist} />}
      <PaddleTimeCard planner={planner} locked={locked} />
      <PaddleWindSection
        placeId={planner.editingPlaceId}
        start={planner.waypoints[0] ?? null}
        lakes={!locked && crossesLake(planner.paddleRoute) ? { value: planner.paddle.lakeStyle, onChoose: planner.paddle.setLakeStyle } : undefined}
      />
    </>
  )
}

export function TourPlannerRail({ planner,
  onOpenWanderer,
  conversion,
  paddleChecklist,
  recordedTrack, trackPaddlePlan, skiClassification, tourPlaceIds, canEdit: editPermission, canAssign: assignPermission }: { planner: TourPlannerController
  /** Planning an editable tour from the import in view. */
  conversion?: GpxConversion
  /** The way back to the recorded track of an import planned over in place. */
  recordedTrack?: RecordedTrack
  /** The portages and locks of a recorded paddle track in view (PAD-03). */
  trackPaddlePlan?: TrackPaddlePlan
  /** The obstacle checklist of the paddle tour open in the rail (PAD-06). */
  paddleChecklist?: PaddleChecklist
  /** The classification of the ski track in view (SKI-02). */
  skiClassification?: SkiClassification
  /** Browse the user's wanderer trails instead; offered while nothing is being edited. */
  onOpenWanderer?: () => void
  /** The trip's tours, never offered as a stop of another tour (PR1-10). */
  tourPlaceIds?: ReadonlySet<number>
} & TourPermissionProps) {
  const { canEdit } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [pendingDifficulty, setPendingDifficulty] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)
  const isSaving = planner.isSaving
  // Nothing in the editor changes while the viewer may not edit or a save is in flight.
  const locked = !canEdit || isSaving
  const requestClose = () => {
    if (isSaving) return
    if (planner.hasUnsavedChanges) setConfirmDiscard(true)
    else planner.returnToNeutral({ keepView: true })
  }
  const changeDifficulty = (value: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (value >= 4 && !planner.alpineAcknowledged) setPendingDifficulty(value)
    else planner.setMaxHikingDifficulty(value)
  }
  useTourUndoShortcut({
    enabled: !locked && (planner.mode.type === 'new-draft' || planner.mode.type === 'edit-saved'),
    canUndo: planner.canUndo,
    canRedo: planner.canRedo,
    undo: planner.undo,
    redo: planner.redo,
  })

  if (planner.mode.type === 'neutral')
    return <NeutralRail planner={planner} canEdit={canEdit} onOpenWanderer={onOpenWanderer}
          />
  if (planner.mode.type === 'view-gpx')
    return <GpxViewRail planner={planner} canEdit={canEdit} conversion={conversion} trackPaddlePlan={trackPaddlePlan}
      paddleChecklist={paddleChecklist} skiClassification={skiClassification} />

  const isSavedEdit = planner.mode.type === 'edit-saved'

  return (
    <>
      <section className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.title')}>
        <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
          <BarButton label={t('tours.planner.backToTours')} onClick={() => requestClose()} disabled={isSaving} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <ArrowLeft size={16} strokeWidth={2} />
          </BarButton>
          <RailTitle title={t(isSavedEdit ? 'tours.planner.editTitle' : 'tours.planner.newTitle')} aside={<RailStatusBadges planner={planner} />} />
          {planner.mode.type === 'edit-saved' && planner.mode.placeId > 0 && (
            <>
              <TourGpxExportBarButton target={{ tripId: planner.tripId, placeId: planner.mode.placeId, name: planner.name, facts: plannerShareFacts(planner) }} unsaved={planner.hasUnsavedChanges} />
              <TourSaveToCollectionBarButton
                target={{ tripId: planner.tripId, placeId: planner.mode.placeId, name: planner.name }}
                unsaved={planner.hasUnsavedChanges}
              />
            </>
          )}
          <BarButton label={t('tours.planner.undo')} onClick={() => { if (canEdit && !isSaving) planner.undo() }} disabled={locked || !planner.canUndo}>
            <Undo2 size={15} strokeWidth={2} />
          </BarButton>
          <BarButton label={t('tours.planner.redo')} onClick={() => { if (canEdit && !isSaving) planner.redo() }} disabled={locked || !planner.canRedo}>
            <Redo2 size={15} strokeWidth={2} />
          </BarButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
          <TourRemoteChangeNotice planner={planner} />
          <WalkImportDraftNotice planner={planner} />
          <WalkRoutePendingNotice planner={planner} />
          <TourNameField planner={planner} locked={locked} />

          <TourTypeFields planner={planner} locked={locked} />

          <TourStageModeField planner={planner} locked={locked} />

          {recordedTrack?.available && <RecordedTrackCard recordedTrack={recordedTrack} disabled={isSaving} />}

          <UnreachableNotice planner={planner} />
          <WalkFerryNotice planner={planner} />

          <TourStageLossNotice planner={planner} />
          <TourStageDayNotice planner={planner} />

          <TourWaypointList planner={planner} canEdit={canEdit} isSaving={isSaving} tourPlaceIds={tourPlaceIds} />

          <BikeWaysCard planner={planner} />

          <RunWaysCard planner={planner} />

          <HorseRoutesCard planner={planner} />

          <SkiPlannerSummary planner={planner} />

          {planner.tourType === 'hike' && (
            <HikeWaysCard tripId={planner.tripId} route={planner.route} routeCurrent={planner.routeCurrent}
              routingLimit={planner.maxHikingDifficulty} />
          )}

          <TourPoiSearchCard planner={planner} />

          <PaddleEditorCards planner={planner} locked={locked} checklist={paddleChecklist} />

          <TourDetailsSection planner={planner} locked={locked} onDifficultyChange={changeDifficulty} />
        </div>

        <TourEditorRailFooter planner={planner} canEdit={canEdit} locked={locked} isSavedEdit={isSavedEdit} onDiscard={requestClose} />

        <ConfirmDialog
          isOpen={confirmDiscard && !isSaving}
          onClose={() => setConfirmDiscard(false)}
          onConfirm={() => planner.returnToNeutral({ keepView: true })}
          title={t('tours.planner.discardTitle')}
          message={t('tours.planner.discardBody')}
          confirmLabel={t('tours.planner.discardChanges')}
        />
        <NewTourConfirmDialog planner={planner} canEdit={canEdit} />
        <TourRevisionConflictDialog planner={planner} />
        <ConfirmDialog
          isOpen={pendingDifficulty !== null && !isSaving}
          onClose={() => setPendingDifficulty(null)}
          onConfirm={() => {
            if (canEdit && !isSaving && pendingDifficulty !== null) {
              planner.acknowledgeAlpine()
              planner.setMaxHikingDifficulty(pendingDifficulty)
            }
            setPendingDifficulty(null)
          }}
          title={t('tours.planner.difficulty.alpineTitle')}
          message={t('tours.planner.difficulty.alpineBody')}
          confirmLabel={t('tours.planner.difficulty.enable')}
        />
      </section>
    </>
  )
}

/**
 * In the editor of an import planned over in place: the recorded track is still
 * kept, and one press (after a confirm) takes the tour back to it.
 */
function RecordedTrackCard({ recordedTrack, disabled }: { recordedTrack: RecordedTrack; disabled: boolean }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  return (
    <RailCard icon={<History size={14} strokeWidth={2} />} title={t('tours.recorded.title')}>
      <div className="flex flex-col items-start gap-2.5">
        <p className="m-0 leading-snug text-content-secondary" style={fs(12, 'body')}>
          {t('tours.recorded.hint')}
        </p>
        <CardAction
          onClick={() => setConfirming(true)}
          disabled={disabled || recordedTrack.restoring}
          icon={
            recordedTrack.restoring ? (
              <Loader2 size={12} strokeWidth={2.2} className="animate-spin" />
            ) : (
              <History size={12} strokeWidth={2.2} />
            )
          }
        >
          {t('tours.recorded.restore')}
        </CardAction>
      </div>
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          void recordedTrack.restore()
        }}
        title={t('tours.recorded.confirmTitle')}
        message={t('tours.recorded.confirmBody')}
        confirmLabel={t('tours.recorded.restore')}
      />
    </RailCard>
  )
}

/** The elevation profile under its label, folded away with the chevron beside it. */
function ElevationSection({ id, samples, gradientId, planner }: {
  id: string
  samples: DistanceIndexedProfileSample[]
  gradientId: string
  planner: TourPlannerController
}) {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  // The stretches that climb a via ferrata, banded behind the line in the ferrata violet.
  const crossings = useTourFerrataCrossingStore(state => state.crossings)
  if (samples.length < 2) {
    return (
      <TourSection label={t('tours.planner.inspector.elevation')}>
        <TourNotice>{t('tours.planner.inspector.elevationPlaceholder')}</TourNotice>
      </TourSection>
    )
  }
  const expanded = planner.elevationProfileExpanded
  return (
    <TourSection
      label={t('tours.planner.inspector.elevation')}
      action={<FoldButton expanded={expanded} onToggle={planner.toggleElevationProfile} controls={id} label={t(expanded ? 'tours.planner.collapseElevation' : 'tours.planner.expandElevation')} />}
    >
      <div id={id} hidden={!expanded} className={`${BOX} p-2`}>
        {expanded && <ElevationProfile
          samples={samples}
          color="var(--text-secondary)"
          gradientId={gradientId}
          ariaLabel={t('tours.planner.inspector.elevation')}
          focus={planner.routeProfileFocus}
          onFocusChange={planner.setRouteProfileFocus}
          formatFocus={focus => profileFocusLabel(focus, t, distanceUnit)}
          bands={crossings}
          marks={stageBoundariesM(planner.stages.stages)}
        />}
      </div>
    </TourSection>
  )
}

function NewTourConfirmDialog({ planner, canEdit }: { planner: TourPlannerController; canEdit: boolean }) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      isOpen={canEdit && planner.newTourConfirmationOpen}
      onClose={planner.cancelNewTour}
      onConfirm={() => { if (canEdit) planner.startNewTour(true) }}
      title={t('tours.planner.newTourConfirmTitle')}
      message={t('tours.planner.newTourConfirmBody')}
      confirmLabel={t('tours.planner.newTourConfirm')}
    />
  )
}

interface TourPlannerToursRailProps extends TourPermissionProps {
  planner: TourPlannerController
  tours: TourListItem[]
  days: Day[]
  loading: boolean
  onAssignToDay: AssignTourToDay
  onViewGpxTour: (tour: TourListItem) => void
  onDeleteTour?: (placeId: number) => void
  /** The workspace's GPX import, an entry of "Add tour". */
  gpxImport?: TourGpxImport
  /** LIB-02: takes a tour of another trip in, an entry of "Add tour". */
  onTakenOver?: (tour: TourListItem) => Promise<void>
}

/** The words of the time estimate: walking, riding (BIK-01), running (RUN-01) or paddling, each saying how it is reckoned, and a ride none. */
const ESTIMATE_KEYS = {
  hike: { labelKey: 'tours.planner.walkingEstimated', shortKey: 'tours.planner.walkingEstimatedShort', infoLabelKey: 'tours.planner.walkingEstimatedInfoLabel', infoKey: 'tours.planner.walkingEstimatedInfo' },
  bike: { labelKey: 'tours.bike.timeEstimated', shortKey: 'tours.bike.timeEstimatedShort', infoLabelKey: 'tours.bike.timeEstimatedInfoLabel', infoKey: 'tours.bike.timeEstimatedInfo' },
  kayak: { labelKey: 'tours.paddle.timeEstimated', shortKey: 'tours.paddle.timeEstimatedShort', infoLabelKey: 'tours.paddle.timeEstimatedInfoLabel', infoKey: 'tours.paddle.timeEstimatedInfo' },
  walk: { labelKey: 'tours.walk.timeEstimated', shortKey: 'tours.walk.timeEstimatedShort', infoLabelKey: 'tours.walk.timeEstimatedInfoLabel', infoKey: 'tours.walk.timeEstimatedInfo' },
  run: { labelKey: 'tours.run.timeEstimated', shortKey: 'tours.run.timeEstimatedShort', infoLabelKey: 'tours.run.timeEstimatedInfoLabel', infoKey: 'tours.run.timeEstimatedInfo' },
  // HOR-01: a ride has no estimate; the field says why, and the planned total is the rider's own.
  horse: { labelKey: 'tours.horse.time', shortKey: 'tours.horse.time', infoLabelKey: 'tours.horse.timeInfoLabel', infoKey: 'tours.horse.timeInfo' },
  // SKI-02: a ski tour's time is the piste router's, given once every leg is planned; the field says so.
  ski: { labelKey: 'tours.ski.time', shortKey: 'tours.ski.time', infoLabelKey: 'tours.ski.timeInfoLabel', infoKey: 'tours.ski.timeInfo' },
} as const

/** Which ways a point is out of reach of: paths for hikes, city walks and rides, ways for bikes, runnable ways. */
const UNREACHABLE_WAYS: Record<PlannableTourType, 'hike' | 'bike' | 'run'> = {
  hike: 'hike',
  walk: 'hike',
  kayak: 'hike',
  horse: 'hike',
  ski: 'hike',
  bike: 'bike',
  run: 'run',
}

/**
 * A point no way of the tour's type reaches: the router would have bound it
 * that far off, so no route is drawn to a place the tour does not go. The
 * notice names the point and what helps; the last route that was planned stays.
 */
function UnreachableNotice({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const point = planner.unreachable
  if (!point) return null
  const select = () => planner.setSelectedWaypointId(planner.waypoints[point.unreachable]?.id ?? null)
  return (
    <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
      <span className="flex flex-col items-start gap-1.5">
        <span data-testid="tour-planner-unreachable">
          {t(`tours.planner.unreachable.${UNREACHABLE_WAYS[planner.tourType]}`, {
            point: point.unreachable + 1,
            distance: formatDistance(point.snappedMeters / 1000, distanceUnit),
          })}
        </span>
        <CardAction icon={<MapPin size={12} strokeWidth={2} />} onClick={select}>
          {t('tours.planner.unreachable.show', { point: point.unreachable + 1 })}
        </CardAction>
      </span>
    </TourNotice>
  )
}

/**
 * The time facts of the overview: the estimate (walking, riding or paddling),
 * the breaks and the planned total; a city walk its walking time, its stays and
 * their total in the wording the tour detail uses too (CW-02).
 */
function plannerTimeFields(planner: TourPlannerController, t: Translate): TourMetricField[] {
  const keys = ESTIMATE_KEYS[planner.tourType]
  const estimate = {
    label: t(keys.labelKey),
    shortLabel: t(keys.shortKey),
    info: { label: t(keys.infoLabelKey), description: t(keys.infoKey) },
  }
  if (planner.stationStays) {
    return walkTimeFields({ walking: estimate, walkingMinutes: planner.walkingDurationMinutes, stays: planner.stationStays,
      manualMinutes: planner.plannedDurationMinutes, t })
  }
  return [
    {
      ...estimate,
      value: planner.walkingDurationMinutes == null
        ? t(planner.isSki ? 'tours.ski.timeUnknown' : 'tours.planner.walkingTimeUnknown')
        : formatPlannedTourDuration(planner.walkingDurationMinutes),
    },
    {
      label: t('tours.planner.breaksShort'),
      value: planner.breakAdditionalMinutes == null ? '—' : formatPlannedTourDuration(planner.breakAdditionalMinutes),
    },
    {
      label: `${t('tours.planner.plannedShort')}${planner.plannedDurationMinutes != null ? ` (${t('tours.planner.plannedTotalManual')})` : ''}`,
      value: planner.plannedTotalMinutes == null
        ? t('tours.planner.walkingTimeUnknown')
        : formatPlannedTourDuration(planner.plannedTotalMinutes),
    },
  ]
}

/** MDT-02: the id of a tour's unfolded stages, which its fold button controls. */
const stageListId = (tour: TourListItem) => `tour-stages-${tour.place_id}`

/** The fold of a multi-day tour's row in the list; none for a day tour. */
function stagesFold(tour: TourListItem, rail: ReturnType<typeof useTourStageRail>, t: (key: string) => string) {
  if ((tour.stage_count ?? 0) < 2) return undefined
  const expanded = rail.isUnfolded(tour.place_id)
  return {
    expanded,
    onToggle: () => rail.toggle(tour.place_id),
    label: t(expanded ? 'tours.stages.fold' : 'tours.stages.unfold'),
    controls: stageListId(tour),
  }
}

export function TourPlannerToursRail({ planner, tours, days, loading, onAssignToDay, onViewGpxTour, onDeleteTour,
  gpxImport, onTakenOver, canEdit: editPermission, canAssign: assignPermission }: TourPlannerToursRailProps) {
  const { canEdit, canAssign } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const toast = useToast()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const tripId = useTripStore(state => state.trip?.id)
  const [pendingTour, setPendingTour] = useState<TourListItem | null>(null)
  // Set by the dialog's confirm, which closes it as well, so its close tells a discard from a kept draft.
  const discarding = useRef(false)
  const dayAssignment = useTourDayAssignment({ canAssign, onAssignToDay })
  // STA-01: one filter for the list and the summary above it, the same as the plan's tour list.
  const filters = useTourListFilters(tours)
  const isSaving = planner.isSaving
  const hasRoute = (planner.mode.type === 'new-draft' || planner.mode.type === 'edit-saved') && planner.route !== null
  // A paddle tour's heights are read off the banks, not the water: they stay unknown.
  const routeAnalysis = planner.isPaddle && planner.routeAnalysis ? withoutHeights(planner.routeAnalysis) : planner.routeAnalysis

  // A finished save is said once, as the app says it everywhere: a toast.
  // Once per save: the toast helper and t are fresh objects on every render, so the
  // effect reruns often; only a save it has not announced yet gets the toast.
  const savedTour = planner.saveOutcome
  const announced = useRef<typeof savedTour>(null)
  useEffect(() => {
    if (!savedTour || announced.current === savedTour) return
    announced.current = savedTour
    toast.success(t('tours.planner.saved'))
  }, [savedTour, t, toast])

  // MDT-02: the stage rail is set up after the opening it asks for, so a failed open reaches its cancel through a ref.
  const cancelStage = useRef<() => void>(() => undefined)
  const openTour = async (tour: TourListItem) => {
    const opened = await planner.openTour(tour)
    if (opened) return
    toast.error(t('tours.planner.openFailed'))
    // MDT-02: a stage asked for with this tour is not shown on a later open of it.
    cancelStage.current()
  }

  const selectTour = (tour: TourListItem) => {
    // An import (a GPX file, a wanderer snapshot) has no waypoints of its own and is viewed as it came in.
    if (tour.has_waypoints === false) onViewGpxTour(tour)
    else void openTour(tour)
  }

  const requestOpenTour = (tour: TourListItem) => {
    if (isSaving) return
    if (planner.hasUnsavedChanges) {
      setPendingTour(tour)
      return
    }
    selectTour(tour)
  }
  // MDT-02: a multi-day tour unfolds its stages here, and a stage opens in the planner.
  const stageRail = useTourStageRail(planner, requestOpenTour)
  useEffect(() => {
    cancelStage.current = stageRail.cancel
  }, [stageRail.cancel])

  const tourTimeFields = plannerTimeFields(planner, t)

  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.tripTours')}>
      <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
        <RailTitle title={t('tours.planner.tripTours')} />
        {canEdit && <TourAddMenu planner={planner} gpxImport={gpxImport} onTakenOver={onTakenOver} disabled={isSaving} />}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
        {hasRoute && (
          <div data-testid="tour-planner-overview">
            <RailCard icon={<Route size={14} strokeWidth={2} />} title={t('tours.planner.inspector.title')} foldId="tour-summary">
              <div className="flex flex-col gap-3">
                <FerrataCrossingBadges />
              <RailFacts facts={tourMetricFacts(routeAnalysis, distanceUnit, t, tourTimeFields)} />
              <TourStagesSection planner={planner} />
            {routeAnalysis && !planner.isPaddle && (
              <ElevationSection
                id="tour-planner-editable-elevation-profile"
                samples={routeAnalysis.distanceIndexedProfileSamples}
                gradientId={`planner-editable-elevation-${planner.editingPlaceId ?? 'draft'}`}
                planner={planner}
              />
            )}
              </div>
            </RailCard>
          </div>
        )}

        {!loading && tours.length === 0 ? (
          <EmptyState scene="tours" size={116} fill surface="var(--bg-secondary)" title={t('tours.empty.title')} className="flex-1"
            action={<p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>{t('tours.empty.body')}</p>} />
        ) : tours.length === 0 ? (
              <p className="m-0 py-6 text-center text-content-faint" style={fs(12, 'body')}>{t('common.loading')}</p>
            ) : (
          <>
            <TourListFilterMenu filters={filters} />
            <TourScopeSummary tours={filters.filtered} />
            {filters.emptyByFilter ? <TourFilterEmpty filters={filters} /> : (
              <TourListCard
            icon={<Mountain size={14} strokeWidth={2} />}
            title={t('tours.mode.tours')}
            aside={
              <span className="flex-none tabular-nums text-content-faint" style={fs(11.5, 'body')}>
                {filters.filtered.length}
              </span>
            }
            label={t('tours.planner.tripTours')}
          >
                {filters.filtered.map(tour => (
                  <TourListRow
                    key={tour.place_id}
                    tour={tour}
                days={days}
                    disabled={isSaving}
                    selected={(planner.mode.type === 'edit-saved' || planner.mode.type === 'view-gpx') && planner.mode.placeId === tour.place_id}
                    onSelect={requestOpenTour}
                    fold={stagesFold(tour, stageRail, t)}
                    action={((canAssign && days.length > 0) || (canEdit && onDeleteTour)) ? (
                      <>
                        {canAssign && days.length > 0 && (
                          <TourDayMenu
                            days={days}
                            placeId={tour.place_id}
                            label={`${t('tours.addToDay')}: ${tour.name}`}
                            assignment={dayAssignment}
                            stageCount={stageKeysOfTour(tour).length}
                          />
                        )}
                        {canEdit && onDeleteTour && (
                          <Tooltip label={`${t('common.delete')}: ${tour.name}`}>
                            <button
                              type="button"
                              aria-label={`${t('common.delete')} ${tour.name}`}
                              disabled={isSaving}
                              onClick={event => { event.stopPropagation(); if (!isSaving) onDeleteTour(tour.place_id) }}
                              className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors enabled:hover:bg-danger-soft enabled:hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40"
                            >
                              <Trash2 size={13} strokeWidth={2.2} aria-hidden="true" />
                            </button>
                          </Tooltip>
                        )}
                      </>
                    ) : undefined}
                  >
                    {stageRail.isUnfolded(tour.place_id) && (tour.stage_count ?? 0) > 1 && (
                      <TourStageOverview id={stageListId(tour)} tripId={tripId} tour={tour} days={days} canAssign={canAssign}
                        onOpenStage={isSaving ? undefined : stageRail.openStage} />
                    )}
                  </TourListRow>
                ))}
              </TourListCard>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingTour !== null}
        onClose={() => {
          setPendingTour(null)
          // MDT-02: the dialog closes after a confirm too; only kept changes let the stage asked for go.
          if (!discarding.current) stageRail.cancel()
          discarding.current = false
        }}
        onConfirm={() => {
          const tour = pendingTour
          discarding.current = true
          setPendingTour(null)
          if (tour) selectTour(tour)
        }}
        title={t('tours.planner.discardTitle')}
        message={t('tours.planner.discardBody')}
        confirmLabel={t('tours.planner.discardChanges')}
      />
    </aside>
  )
}
