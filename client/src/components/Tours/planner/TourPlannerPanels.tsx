import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { TourListItem } from '@trek/shared'
import { AlertTriangle, ArrowLeft, Circle, FileDown, History, Loader2, Mountain, Plus, Redo2, RotateCcw, Route, Save, Trash2, Undo2 } from 'lucide-react'
import type { Day } from '../../../types'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { useTourFerrataCrossingStore } from '../../../store/tourFerrataCrossingStore'
import { formatDistance, formatElevation } from '../../../utils/units'
import ConfirmDialog from '../../shared/ConfirmDialog'
import { DialogButton, NEUTRAL_TINT, fs } from '../../shared/DialogShell'
import EmptyState from '../../shared/EmptyState'
import { useToast } from '../../shared/Toast'
import { Tooltip } from '../../shared/Tooltip'
import { BOX } from '../../Planner/bookings/bookingParts'
import { BarButton, SoftPill } from '../../Planner/planParts'
import TourListRow from '../TourListRow'
import ElevationProfile from '../../shared/ElevationProfile'
import { formatPlannedTourDuration, hikeSourceBadgeLabel, tourSource } from '../tourPresentation'
import { CardAction, FoldButton, RailCard, RailFacts, TourDayMenu, TourListCard, TourNotice, TourSection } from '../tourParts'
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
import { TourTypeFields } from './TourTypeFields'
import TourWaypointList from './TourWaypointList'
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry'
import type { TourPlannerController, TourPlannerStatus } from './useTourPlanner'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'
import TourConversionSection from '../conversion/TourConversionSection'
import type { GpxConversion } from '../conversion/useGpxConversion'
import type { RecordedTrack } from '../useRecordedTrack'
import type { TourGpxImport } from '../useTourGpxImport'
import { type AssignTourToDay, useTourDayAssignment } from '../useTourDayAssignment'
import WandererMark from '../wanderer/WandererMark'

const STATUS_KEY: Partial<Record<TourPlannerStatus, string>> = {
  dirty: 'tours.planner.status.dirty',
  routing: 'tours.planner.status.routing',
  'routing-failed': 'tours.planner.status.routingFailed',
  'enriching-elevation': 'tours.planner.status.elevation',
  'elevation-failed': 'tours.planner.status.elevationFailed',
  saving: 'tours.planner.status.saving',
}

/** The tinted head band both rails open with, like every panel head in the planner. */
export const RAIL_HEAD = 'flex flex-none items-start gap-2 border-b border-edge-faint px-3 py-2.5'

type Translate = (key: string, params?: Record<string, string | number | null>) => string

function profileFocusLabel(focus: RouteProfileFocus, t: Translate, unit: 'metric' | 'imperial'): string {
  return t('tours.planner.inspector.profileFocus', {
    distance: formatDistance(focus.distanceMeters / 1000, unit),
    elevation: focus.elevationMeters == null ? '-' : formatElevation(focus.elevationMeters, unit),
  })
}

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

/** A status as a small round icon beside the title, its words in the tooltip and for a screen reader. */
function StatusDot({ label, tone, children }: { label: string; tone: 'neutral' | 'info' | 'warning'; children: ReactNode }) {
  const look = tone === 'warning' ? 'text-warning' : tone === 'info' ? 'text-info' : 'text-content-muted'
  return (
    <Tooltip label={label}>
      <span aria-label={label} className={`grid h-[20px] w-[20px] flex-none place-items-center rounded-full bg-surface-card shadow-sm ring-1 ring-inset ring-edge-faint ${look}`}>
        {children}
      </span>
    </Tooltip>
  )
}

/** Whether the head offers to try again; a paddle leg that failed has its own actions on its row (PAD-11). */
function retryable(planner: TourPlannerController): boolean {
  if (planner.error === 'paddle-route') return false
  return planner.status === 'routing-failed' || planner.status === 'elevation-failed'
}

/** The status in words; a paddle tour with legs the router could not plan says how many (PAD-11). */
function statusText(planner: TourPlannerController, key: string, t: Translate): string {
  if (planner.error === 'paddle-route') return t('tours.paddle.status.unrouted', { count: planner.paddleRoute?.failures.length ?? 1 })
  return t(key)
}

/**
 * What the editor is doing right now, as icon badges beside the head's title:
 * a restored draft, routing or saving, and a failure with its retry. Nothing
 * when there is nothing to say.
 */
function RailStatusBadges({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation()
  const statusKey = planner.isSaving ? STATUS_KEY.saving : STATUS_KEY[planner.status]
  const restored = planner.draftRestored && planner.hasUnsavedChanges
  const onFerrata = useTourFerrataCrossingStore(state => state.crossings.length > 0)
  const failed = planner.error === 'save'
  const canRetry = retryable(planner)
  if (!restored && !statusKey && !failed && !onFerrata) return null
  const warning = planner.error != null || canRetry
  const statusLabel = failed ? t('tours.planner.status.saveFailed') : statusKey ? statusText(planner, statusKey, t) : null
  const busy = planner.isSaving || planner.status === 'routing' || planner.status === 'enriching-elevation'
  return (
    <span role="status" data-testid="tour-planner-status" className="ms-1.5 flex flex-none items-center gap-1">
      {restored && (
        <StatusDot label={t('tours.planner.restored')} tone="info">
          <RotateCcw size={11} strokeWidth={2.2} />
        </StatusDot>
      )}
      {onFerrata && (
        <StatusDot label={t('tours.ferrata.crossingShort')} tone="warning">
          <Route size={11} strokeWidth={2.2} />
        </StatusDot>
      )}
      {statusLabel && (
        <StatusDot label={statusLabel} tone={warning ? 'warning' : 'neutral'}>
          {warning
            ? <AlertTriangle size={11} strokeWidth={2.2} />
            : busy ? <Loader2 size={11} strokeWidth={2.2} className="animate-spin" /> : <Circle size={7} strokeWidth={3} />}
        </StatusDot>
      )}
      {canRetry && (
        <button type="button" onClick={planner.retry}
          className="inline-flex h-[20px] items-center rounded-full bg-accent px-2 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          style={fs(10.5)}>
          {t('tours.planner.retry')}
        </button>
      )}
    </span>
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
}: {
  planner: TourPlannerController
  canEdit: boolean
  conversion?: GpxConversion
  trackPaddlePlan?: TrackPaddlePlan
  paddleChecklist?: PaddleChecklist
}) {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore((state) => state.settings.distance_unit)
  if (planner.mode.type !== 'view-gpx') return null
  const { readOnlyGpxTour } = planner
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
            onClick={() => planner.returnToNeutral()}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </BarButton>
          <RailTitle
            title={t(fromWanderer ? 'wanderer.tourTitle' : 'tours.planner.gpxTitle')}
            sub={tour.name}
            aside={<SoftPill>{hikeSourceBadgeLabel(tour, t)}</SoftPill>}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          {conversion && <TourConversionSection conversion={conversion} />}
          {trackPaddlePlan && <TrackPaddlePlanCards plan={trackPaddlePlan} tour={tour} />}
          {paddleChecklist && tour.tour_type === 'kayak' && <PaddleCheckCard checklist={paddleChecklist} />}
          {tour.tour_type === 'kayak' && (
            <PaddleWindSection placeId={tour.place_id} start={trackStart(analysis?.routeCoordinates)} />
          )}
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
  recordedTrack, trackPaddlePlan, canEdit: editPermission, canAssign: assignPermission }: { planner: TourPlannerController
  /** Planning an editable tour from the import in view. */
  conversion?: GpxConversion
  /** The way back to the recorded track of an import planned over in place. */
  recordedTrack?: RecordedTrack
  /** The portages and locks of a recorded paddle track in view (PAD-03). */
  trackPaddlePlan?: TrackPaddlePlan
  /** The obstacle checklist of the paddle tour open in the rail (PAD-06). */
  paddleChecklist?: PaddleChecklist
  /** Browse the user's wanderer trails instead; offered while nothing is being edited. */
  onOpenWanderer?: () => void
} & TourPermissionProps) {
  const { canEdit } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [pendingDifficulty, setPendingDifficulty] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)
  const alpineAcknowledged = useRef(false)
  const isSaving = planner.isSaving
  // Nothing in the editor changes while the viewer may not edit or a save is in flight.
  const locked = !canEdit || isSaving
  const requestClose = () => {
    if (isSaving) return
    if (planner.hasUnsavedChanges) setConfirmDiscard(true)
    else planner.returnToNeutral()
  }
  const changeDifficulty = (value: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (value >= 4 && !alpineAcknowledged.current) setPendingDifficulty(value)
    else planner.setMaxHikingDifficulty(value)
  }

  if (planner.mode.type === 'neutral')
    return <NeutralRail planner={planner} canEdit={canEdit} onOpenWanderer={onOpenWanderer}
          />
  if (planner.mode.type === 'view-gpx')
    return <GpxViewRail planner={planner} canEdit={canEdit} conversion={conversion} trackPaddlePlan={trackPaddlePlan}
      paddleChecklist={paddleChecklist} />

  const isSavedEdit = planner.mode.type === 'edit-saved'

  return (
    <>
      <section className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.title')}>
        <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
          <BarButton label={t('tours.planner.backToTours')} onClick={() => requestClose()} disabled={isSaving} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <ArrowLeft size={16} strokeWidth={2} />
          </BarButton>
          <RailTitle title={t(isSavedEdit ? 'tours.planner.editTitle' : 'tours.planner.newTitle')} aside={<RailStatusBadges planner={planner} />} />
          <BarButton label={t('tours.planner.undo')} onClick={() => { if (canEdit && !isSaving) planner.undo() }} disabled={locked || !planner.canUndo}>
            <Undo2 size={15} strokeWidth={2} />
          </BarButton>
          <BarButton label={t('tours.planner.redo')} onClick={() => { if (canEdit && !isSaving) planner.redo() }} disabled={locked || !planner.canRedo}>
            <Redo2 size={15} strokeWidth={2} />
          </BarButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
          <TourNameField planner={planner} locked={locked} />

          <TourTypeFields planner={planner} locked={locked} />

          {recordedTrack?.available && <RecordedTrackCard recordedTrack={recordedTrack} disabled={isSaving} />}

          <TourWaypointList planner={planner} canEdit={canEdit} isSaving={isSaving} />

          <PaddleEditorCards planner={planner} locked={locked} checklist={paddleChecklist} />

          <TourDetailsSection planner={planner} locked={locked} onDifficultyChange={changeDifficulty} />
        </div>

        <div className="flex flex-none flex-col gap-2 border-t border-edge-faint px-3 py-3">
          {planner.isPaddle && <PaddleSafetyRow />}
          <div className="grid grid-cols-[auto_1fr] gap-2 [&>button]:justify-center">
            <DialogButton icon={<RotateCcw size={14} strokeWidth={2} />} onClick={requestClose} disabled={isSaving || (!planner.hasUnsavedChanges && !isSavedEdit)}>
              {t('common.discard')}
            </DialogButton>
            <DialogButton variant="primary" icon={<Save size={14} strokeWidth={2} />} onClick={() => { if (canEdit && !isSaving) void planner.save() }} disabled={locked || !planner.canSave}>
              {t('common.save')}
            </DialogButton>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmDiscard && !isSaving}
          onClose={() => setConfirmDiscard(false)}
          onConfirm={planner.returnToNeutral}
          title={t('tours.planner.discardTitle')}
          message={t('tours.planner.discardBody')}
          confirmLabel={t('tours.planner.discardChanges')}
        />
        <NewTourConfirmDialog planner={planner} canEdit={canEdit} />
        <ConfirmDialog
          isOpen={pendingDifficulty !== null && !isSaving}
          onClose={() => setPendingDifficulty(null)}
          onConfirm={() => {
            if (canEdit && !isSaving && pendingDifficulty !== null) {
              alpineAcknowledged.current = true
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

/** The round GPX import button in the tours rail's head; the file drop on the workspace does the same. */
function RailImportButton({ gpxImport, disabled }: { gpxImport: TourGpxImport; disabled: boolean }) {
  const { t } = useTranslation()
  return (
    <Tooltip label={t('tours.import.hint')}>
      <button
        type="button"
        aria-label={t('tours.import.button')}
        data-testid="tour-rail-import-gpx"
        disabled={gpxImport.importing || disabled}
        onClick={gpxImport.pick}
        className="mt-1 grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:bg-accent enabled:hover:text-accent-text enabled:hover:ring-transparent disabled:cursor-default disabled:opacity-40"
      >
        {gpxImport.importing ? (
          <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
        ) : (
          <FileDown size={13} strokeWidth={2.4} />
        )}
      </button>
    </Tooltip>
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
  /** The workspace's GPX import; its button sits beside "New tour". */
  gpxImport?: TourGpxImport
}

/** The time facts of the overview: the estimate (walking, or paddling for a paddle tour), the breaks and the planned total. */
function plannerTimeFields(planner: TourPlannerController, t: Translate) {
  return [
    planner.isPaddle ? {
      label: t('tours.paddle.timeEstimated'),
      shortLabel: t('tours.paddle.timeEstimatedShort'),
      info: { label: t('tours.paddle.timeEstimatedInfoLabel'), description: t('tours.paddle.timeEstimatedInfo') },
      value: planner.walkingDurationMinutes == null
        ? t('tours.planner.walkingTimeUnknown')
        : formatPlannedTourDuration(planner.walkingDurationMinutes),
    } : {
      label: t('tours.planner.walkingEstimated'),
      shortLabel: t('tours.planner.walkingEstimatedShort'),
      info: { label: t('tours.planner.walkingEstimatedInfoLabel'), description: t('tours.planner.walkingEstimatedInfo') },
      value: planner.walkingDurationMinutes == null
        ? t('tours.planner.walkingTimeUnknown')
        : formatPlannedTourDuration(planner.walkingDurationMinutes),
    },
    {
      label: t('tours.planner.breaksShort'),
      value: planner.breakAdditionalMinutes == null ? '—' : formatPlannedTourDuration(planner.breakAdditionalMinutes),
    },
    {
      label: `${t('tours.planner.plannedShort')}${planner.plannedDurationMinutes != null ? ` (${t('tours.planner.plannedTotalManual')})` : ''}`,
      value: planner.plannedTotalMinutes == null ? t('tours.planner.walkingTimeUnknown') : formatPlannedTourDuration(planner.plannedTotalMinutes),
    },
  ]
}

export function TourPlannerToursRail({ planner, tours, days, loading, onAssignToDay, onViewGpxTour, onDeleteTour,
  gpxImport, canEdit: editPermission, canAssign: assignPermission }: TourPlannerToursRailProps) {
  const { canEdit, canAssign } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const toast = useToast()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const [pendingTour, setPendingTour] = useState<TourListItem | null>(null)
  const dayAssignment = useTourDayAssignment({ canAssign, onAssignToDay })
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

  const openTour = async (tour: TourListItem) => {
    const opened = await planner.openTour(tour)
    if (!opened) toast.error(t('tours.planner.openFailed'))
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

  const tourTimeFields = plannerTimeFields(planner, t)

  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.tripTours')}>
      <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
        <RailTitle title={t('tours.planner.tripTours')} />
        {canEdit && gpxImport && <RailImportButton gpxImport={gpxImport} disabled={isSaving} />}
        {canEdit && planner.mode.type !== 'neutral' && (
          <Tooltip label={t('tours.planner.newTour')}>
            <button type="button" aria-label={t('tours.planner.newTour')} data-testid="tour-rail-new-tour"
              disabled={isSaving} onClick={() => { if (!isSaving) planner.startNewTour() }}
              className="mt-1 grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-accent text-accent-text shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-40">
              <Plus size={14} strokeWidth={2.4} />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
        {hasRoute && (
          <div data-testid="tour-planner-overview">
            <RailCard icon={<Route size={14} strokeWidth={2} />} title={t('tours.planner.inspector.title')}>
              <div className="flex flex-col gap-3">
                <FerrataCrossingBadges />
              <RailFacts facts={tourMetricFacts(routeAnalysis, distanceUnit, t, tourTimeFields)} />
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
              <TourListCard
            icon={<Mountain size={14} strokeWidth={2} />}
            title={t('tours.mode.tours')}
            aside={
              <span className="flex-none tabular-nums text-content-faint" style={fs(11.5, 'body')}>
                {tours.length}
              </span>
            }
            label={t('tours.planner.tripTours')}
          >
                {tours.map(tour => (
                  <TourListRow
                    key={tour.place_id}
                    tour={tour}
                days={days}
                    disabled={isSaving}
                    selected={(planner.mode.type === 'edit-saved' || planner.mode.type === 'view-gpx') && planner.mode.placeId === tour.place_id}
                    onSelect={requestOpenTour}
                    action={((canAssign && days.length > 0) || (canEdit && onDeleteTour)) ? (
                      <>
                        {canAssign && days.length > 0 && (
                          <TourDayMenu
                            days={days}
                            placeId={tour.place_id}
                            label={`${t('tours.addToDay')}: ${tour.name}`}
                            assignment={dayAssignment}
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
                  />
                ))}
              </TourListCard>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingTour !== null}
        onClose={() => setPendingTour(null)}
        onConfirm={() => {
          const tour = pendingTour
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
