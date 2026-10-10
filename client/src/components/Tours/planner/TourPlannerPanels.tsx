import { useRef, useState, type ReactNode } from 'react'
import type { TourListItem } from '@trek/shared'
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Info, MapPin, Plus, Redo2, RotateCcw, Save, ShieldAlert, Trash2, Undo2 } from 'lucide-react'
import type { Day } from '../../../types'
import { useTranslation } from '../../../i18n'
import { useSettingsStore } from '../../../store/settingsStore'
import { formatDistance, formatElevation } from '../../../utils/units'
import ConfirmDialog from '../../shared/ConfirmDialog'
import CustomSelect from '../../shared/CustomSelect'
import { DialogButton, NEUTRAL_TINT, fs } from '../../shared/DialogShell'
import { INPUT, LABEL } from '../../shared/dialogParts'
import EmptyState from '../../shared/EmptyState'
import { useToast } from '../../shared/Toast'
import { Tooltip } from '../../shared/Tooltip'
import { BOX } from '../../Planner/bookings/bookingParts'
import { BarButton, SoftPill } from '../../Planner/planParts'
import TourListRow from '../TourListRow'
import ElevationProfile from '../../shared/ElevationProfile'
import { hikeSourceBadgeLabel, tourSource } from '../tourPresentation'
import { FoldButton, TourDayMenu, TourMetricFields, TourNotice, TourSection } from '../tourParts'
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry'
import type { TourPlannerController, TourPlannerStatus } from './useTourPlanner'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'

const STATUS_KEY: Partial<Record<TourPlannerStatus, string>> = {
  dirty: 'tours.planner.status.dirty',
  routing: 'tours.planner.status.routing',
  'routing-failed': 'tours.planner.status.routingFailed',
  'enriching-elevation': 'tours.planner.status.elevation',
  'elevation-failed': 'tours.planner.status.elevationFailed',
  ready: 'tours.planner.status.ready',
  saving: 'tours.planner.status.saving',
  saved: 'tours.planner.saved',
}

/** The tinted head band both rails open with, like every panel head in the planner. */
const RAIL_HEAD = 'flex flex-none items-start gap-2 border-b border-edge-faint px-3 py-2.5'

type Translate = (key: string, params?: Record<string, string | number | null>) => string

function roleLabel(role: 'start' | 'via' | 'end', t: (key: string) => string) {
  return t(`tours.planner.${role}`)
}

function profileFocusLabel(focus: RouteProfileFocus, t: Translate, unit: 'metric' | 'imperial'): string {
  return t('tours.planner.inspector.profileFocus', {
    distance: formatDistance(focus.distanceMeters / 1000, unit),
    elevation: focus.elevationMeters == null ? '-' : formatElevation(focus.elevationMeters, unit),
  })
}

/** The title of a rail's head band, with an optional line under it. */
function RailTitle({ title, sub, aside }: { title: string; sub?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 pt-[5px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <h2 className="m-0 min-w-0 truncate font-bold tracking-[-0.01em] text-content" style={fs(14, 'body')}>{title}</h2>
        {aside}
      </div>
      {sub && <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11.5, 'body')}>{sub}</p>}
    </div>
  )
}

export function TourPlannerRail({ planner, canEdit: editPermission, canAssign: assignPermission }: { planner: TourPlannerController } & TourPermissionProps) {
  const { canEdit } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [pendingDifficulty, setPendingDifficulty] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)
  const alpineAcknowledged = useRef(false)
  const isSaving = planner.isSaving
  const statusKey = isSaving ? STATUS_KEY.saving : STATUS_KEY[planner.status]
  const canRetry = planner.status === 'routing-failed' || planner.status === 'elevation-failed'
  const requestClose = () => {
    if (isSaving) return
    if (planner.hasUnsavedChanges) setConfirmDiscard(true)
    else planner.returnToNeutral()
  }

  if (planner.mode.type === 'neutral') {
    return (
      <section className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.title')}>
        <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
          <button type="button" disabled={!canEdit} onClick={() => { if (canEdit) planner.startNewTour() }}
            className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
            style={fs(12.5, 'body')}>
            <Plus size={14} strokeWidth={2.2} className="flex-none" />
            <span className="truncate">{t('tours.planner.newTour')}</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EmptyState
            scene="tours"
            size={116}
            fill
            surface="var(--bg-secondary)"
            title={t('tours.planner.neutralTitle')}
            action={<p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>{t('tours.planner.neutralBody')}</p>}
          />
        </div>
      </section>
    )
  }

  if (planner.mode.type === 'view-gpx') {
    const { tour } = planner.readOnlyGpxTour
    const analysis = planner.readOnlyGpxAnalysis
    const extra = tour.duration != null
      ? [{ label: t('tours.planner.inspector.duration'), value: t('tours.durationMinutes', { count: Math.max(1, Math.round(tour.duration)) }) }]
      : []
    return (
      <>
        <section className="flex h-full min-h-0 flex-col" aria-label={tour.name}>
          <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
            <BarButton label={t('tours.planner.backToTours')} onClick={() => planner.returnToNeutral()} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <ArrowLeft size={16} strokeWidth={2} />
            </BarButton>
            <RailTitle title={t('tours.planner.gpxTitle')} sub={tour.name} aside={<SoftPill>{hikeSourceBadgeLabel(tour, t)}</SoftPill>} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
            <TourNotice icon={<Info size={13} strokeWidth={2} className="text-content-faint" />}>{t('tours.detail.gpxReadOnly')}</TourNotice>
            {analysis ? (
              <>
                <TourSection label={t('tours.planner.inspector.title')}>
                  <TourMetricFields analysis={analysis} unit={distanceUnit} extra={extra} columns={2} />
                </TourSection>
                <ElevationSection
                  id="tour-planner-gpx-elevation-profile"
                  samples={analysis.distanceIndexedProfileSamples}
                  gradientId={`planner-gpx-elevation-${tour.place_id}`}
                  planner={planner}
                />
              </>
            ) : (
              <TourNotice>{t('tours.planner.gpxNoGeometry')}</TourNotice>
            )}
          </div>
        </section>
        <NewTourConfirmDialog planner={planner} canEdit={canEdit} />
      </>
    )
  }

  const isSavedEdit = planner.mode.type === 'edit-saved'
  const lastIndex = planner.waypoints.length - 1

  return (
    <>
      <section className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.title')}>
        <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
          <BarButton label={t('tours.planner.backToTours')} onClick={() => requestClose()} disabled={isSaving} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <ArrowLeft size={16} strokeWidth={2} />
          </BarButton>
          <RailTitle title={t(isSavedEdit ? 'tours.planner.editTitle' : 'tours.planner.newTitle')} sub={t('tours.planner.mapHint')} />
          <BarButton label={t('tours.planner.undo')} onClick={() => { if (canEdit && !isSaving) planner.undo() }} disabled={!canEdit || isSaving || !planner.canUndo}>
            <Undo2 size={15} strokeWidth={2} />
          </BarButton>
          <BarButton label={t('tours.planner.redo')} onClick={() => { if (canEdit && !isSaving) planner.redo() }} disabled={!canEdit || isSaving || !planner.canRedo}>
            <Redo2 size={15} strokeWidth={2} />
          </BarButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
          {planner.draftRestored && planner.hasUnsavedChanges && (
            <TourNotice role="status" icon={<RotateCcw size={13} strokeWidth={2} className="text-content-faint" />}>{t('tours.planner.restored')}</TourNotice>
          )}

          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <label className={LABEL} htmlFor="tour-planner-name">{t('tours.planner.name')}</label>
              <input
                id="tour-planner-name"
                disabled={!canEdit || isSaving}
                value={planner.name}
                onChange={event => { if (canEdit && !isSaving) planner.setName(event.target.value) }}
                maxLength={255}
                placeholder={t('tours.planner.namePlaceholder')}
                className={INPUT}
              />
            </div>
            <div className="min-w-0">
              <label className={LABEL} htmlFor="tour-planner-difficulty">{t('tours.planner.maxDifficulty')}</label>
              <CustomSelect
                id="tour-planner-difficulty"
                disabled={!canEdit || isSaving}
                ariaLabel={t('tours.planner.maxDifficulty')}
                value={planner.maxHikingDifficulty}
                onChange={nextValue => {
                  if (!canEdit || isSaving) return
                  const value = Number(nextValue) as 1 | 2 | 3 | 4 | 5 | 6
                  if (value >= 4 && !alpineAcknowledged.current) setPendingDifficulty(value)
                  else planner.setMaxHikingDifficulty(value)
                }}
                options={[1, 2, 3, 4, 5, 6].map(value => ({ value, label: t(`tours.planner.difficulty.t${value}`) }))}
              />
            </div>
            {planner.maxHikingDifficulty === 3 && (
              <TourNotice tone="warning" role="status" icon={<AlertTriangle size={13} strokeWidth={2} />}>{t('tours.planner.difficulty.t3Warning')}</TourNotice>
            )}
          </div>

          <TourSection label={t('tours.planner.waypoints')}>
            {planner.waypoints.length === 0 ? (
              <div data-testid="tour-planner-empty-state" className="flex items-start gap-2 rounded-[12px] border border-dashed border-edge px-3 py-3 leading-snug text-content-muted" style={fs(12, 'body')}>
                <MapPin size={14} strokeWidth={2} className="mt-px flex-none text-content-faint" />
                <p className="m-0">{t('tours.planner.startingPoint')} {t('tours.planner.firstUseDetails')}</p>
              </div>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-px p-0">
                {planner.waypoints.map((point, index) => {
                  const selected = planner.selectedWaypointId === point.id
                  return (
                    <li key={point.id}>
                      <button
                        type="button"
                        onClick={() => planner.setSelectedWaypointId(point.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] ${selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'}`}
                        aria-current={selected ? 'true' : undefined}
                      >
                        <span
                          aria-label={t('tours.planner.waypointLabel', { n: index + 1 })}
                          data-waypoint-number={index + 1}
                          className={`grid h-7 w-7 flex-none place-items-center rounded-[9px] font-geist font-semibold tabular-nums shadow-sm ${selected ? 'bg-accent text-accent-text' : 'bg-surface-card text-content'}`}
                          style={fs(11.5)}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold leading-tight text-content" style={fs(12.5, 'body')}>{roleLabel(point.role, t)}</span>
                          <span className="mt-0.5 block truncate font-geist tabular-nums text-content-faint" style={fs(10.5)}>{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
                        </span>
                        {canEdit && (
                          <span className={`flex flex-none items-center gap-0.5 transition-opacity ${selected ? '' : 'opacity-50 group-hover:opacity-100 group-focus-within:opacity-100'}`}>
                            <WaypointAction label={t('tours.planner.moveUp')} disabled={isSaving || index === 0} onAct={() => planner.moveWaypoint(point.id, -1)}>
                              <ArrowUp size={13} strokeWidth={2.2} />
                            </WaypointAction>
                            <WaypointAction label={t('tours.planner.moveDown')} disabled={isSaving || index === lastIndex} onAct={() => planner.moveWaypoint(point.id, 1)}>
                              <ArrowDown size={13} strokeWidth={2.2} />
                            </WaypointAction>
                            <WaypointAction label={t('tours.planner.remove')} disabled={isSaving} danger onAct={() => planner.removeWaypoint(point.id)}>
                              <Trash2 size={13} strokeWidth={2} />
                            </WaypointAction>
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </TourSection>

          {(statusKey || planner.error) && (
            <TourNotice
              role="status"
              tone={planner.error ? 'warning' : 'neutral'}
              icon={planner.error ? <AlertTriangle size={13} strokeWidth={2} /> : <Info size={13} strokeWidth={2} className="text-content-faint" />}
            >
              {planner.error === 'save' ? t('tours.planner.status.saveFailed') : statusKey ? t(statusKey) : null}
              {canRetry && (
                <button type="button" onClick={planner.retry}
                  className="ms-2 inline-flex items-center rounded-full bg-surface-card px-2 py-[1px] font-semibold text-content shadow-sm hover:bg-surface-secondary"
                  style={fs(11)}>
                  {t('tours.planner.retry')}
                </button>
              )}
            </TourNotice>
          )}
        </div>

        <div className="flex flex-none flex-col gap-2.5 border-t border-edge-faint px-3 py-3">
          <p className="m-0 flex items-start gap-1.5 leading-snug text-content-faint" style={fs(11)}>
            <ShieldAlert size={13} strokeWidth={2} className="mt-px flex-none" />
            <span>{t('tours.planner.safetyNote')} {t('tours.planner.safetyNoteDetails')}</span>
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-2 [&>button]:justify-center">
            <DialogButton icon={<RotateCcw size={14} strokeWidth={2} />} onClick={requestClose} disabled={isSaving || (!planner.hasUnsavedChanges && !isSavedEdit)}>
              {t(isSavedEdit ? 'tours.planner.discardChanges' : 'tours.planner.discard')}
            </DialogButton>
            <DialogButton variant="primary" icon={<Save size={14} strokeWidth={2} />} onClick={() => { if (canEdit && !isSaving) void planner.save() }} disabled={!canEdit || isSaving || !planner.canSave}>
              {t(isSavedEdit ? 'tours.planner.saveChanges' : 'tours.planner.save')}
            </DialogButton>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmDiscard && !isSaving}
          onClose={() => setConfirmDiscard(false)}
          onConfirm={planner.returnToNeutral}
          title={t('tours.planner.discardTitle')}
          message={t('tours.planner.discardBody')}
          confirmLabel={t('tours.planner.discardUnsaved')}
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

/** A quiet icon control on a waypoint row; a span, because the row itself is the button. */
function WaypointAction({ label, disabled, danger = false, onAct, children }: { label: string; disabled: boolean; danger?: boolean; onAct: () => void; children: ReactNode }) {
  return (
    <Tooltip label={label}>
      <span
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        onClick={event => { event.stopPropagation(); if (!disabled) onAct() }}
        onKeyDown={event => { if (!disabled && event.key === 'Enter') { event.stopPropagation(); onAct() } }}
        className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${disabled ? 'pointer-events-none opacity-25' : danger ? 'text-danger hover:bg-surface-card' : 'text-content-muted hover:bg-surface-card hover:text-content'}`}
      >
        {children}
      </span>
    </Tooltip>
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
  onAssignToDay: (placeId: number, dayId: number) => void | boolean | Promise<void | boolean>
  onViewGpxTour: (tour: TourListItem) => void
  onDeleteTour?: (placeId: number) => void
}

export function TourPlannerToursRail({ planner, tours, days, loading, onAssignToDay, onViewGpxTour, onDeleteTour, canEdit: editPermission, canAssign: assignPermission }: TourPlannerToursRailProps) {
  const { canEdit, canAssign } = useTourPermissions({ canEdit: editPermission ?? planner.canEdit, canAssign: assignPermission ?? planner.canAssign })
  const { t } = useTranslation()
  const toast = useToast()
  const distanceUnit = useSettingsStore(state => state.settings.distance_unit)
  const [pendingTour, setPendingTour] = useState<TourListItem | null>(null)
  const isSaving = planner.isSaving
  const hasRoute = (planner.mode.type === 'new-draft' || planner.mode.type === 'edit-saved') && planner.route !== null
  const routeAnalysis = planner.routeAnalysis

  const openTour = async (tour: TourListItem) => {
    const opened = await planner.openTour(tour)
    if (!opened) toast.error(t('tours.planner.openFailed'))
  }

  const selectTour = (tour: TourListItem) => {
    if (tourSource(tour) === 'gpx') onViewGpxTour(tour)
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

  const walkingTime = { label: t('tours.planner.inspector.duration'), value: t('tours.durationMinutes', { count: Math.max(1, Math.round((planner.durationSeconds ?? 0) / 60)) }) }

  return (
    <aside className="flex h-full min-h-0 flex-col" aria-label={t('tours.planner.tripTours')}>
      <div className={RAIL_HEAD} style={{ background: NEUTRAL_TINT }}>
        <RailTitle title={t('tours.planner.tripTours')} sub={t('tours.subtitle')} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3.5">
        {hasRoute && (
          <>
            <TourSection label={t('tours.planner.inspector.title')}>
              <TourMetricFields analysis={routeAnalysis} unit={distanceUnit} extra={[walkingTime]} columns={2} />
            </TourSection>
            {routeAnalysis && (
              <ElevationSection
                id="tour-planner-editable-elevation-profile"
                samples={routeAnalysis.distanceIndexedProfileSamples}
                gradientId={`planner-editable-elevation-${planner.editingPlaceId ?? 'draft'}`}
                planner={planner}
              />
            )}
          </>
        )}

        {planner.saveOutcome && (
          <div className={`${BOX} flex flex-col gap-3 p-3`} role="status">
            <div className="flex items-center gap-2 font-semibold text-content" style={fs(13, 'body')}>
              <CheckCircle2 size={16} strokeWidth={2} className="flex-none text-success" />
              {t('tours.planner.saved')}
            </div>
            <DialogButton onClick={() => { if (canEdit && !isSaving) planner.startNewTour() }} disabled={!canEdit || isSaving}>
              {t('tours.planner.planAnother')}
            </DialogButton>
          </div>
        )}

        {!loading && tours.length === 0 ? (
          <EmptyState scene="tours" size={116} fill surface="var(--bg-secondary)" title={t('tours.empty.title')} className="flex-1"
            action={<p className="m-0 max-w-[260px] text-content-muted" style={fs(12, 'body')}>{t('tours.empty.body')}</p>} />
        ) : (
          <TourSection label={t('tours.mode.tours')}>
            {tours.length === 0 ? (
              <p className="m-0 py-6 text-center text-content-faint" style={fs(12, 'body')}>{t('common.loading')}</p>
            ) : (
              <ul role="listbox" aria-label={t('tours.planner.tripTours')} className="-mx-1 m-0 list-none p-0">
                {tours.map(tour => (
                  <TourListRow
                    key={tour.place_id}
                    tour={tour}
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
                            onPick={day => { if (canAssign) void onAssignToDay(tour.place_id, day.id) }}
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
              </ul>
            )}
          </TourSection>
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
