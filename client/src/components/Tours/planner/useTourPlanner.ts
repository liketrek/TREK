import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hikingPreferencesOf, isClosedLoop, paddleSpeedKmhSchema, tourWebsiteSchema, type BikeProfile, type HikingPreferences, type PlannableTourType, type RunProfile, type TourCreateResponse, type TourListItem, type TourMaxHikingDifficulty } from '@trek/shared'
import { paddleRouteRepo } from '../../../repo/paddleRouteRepo'
import { tourRepo } from '../../../repo/tourRepo'
import { randomId } from '../../../utils/randomId'
import { analyzeRouteGeometry, type RouteProfileFocus } from '../../../utils/routeGeometry'
import { hasCompleteElevation, useTourRoute } from './useTourRoute'
import { normalizePlannerWaypoints, plannerWaypointsOf, ridablePoints, routeInputsKey, sameWaypointSnapshot, savedWaypointsOf, withSavedKeys, type TourPlannerWaypoint } from './tourPlannerWaypoints'
import { openedTourFields, tourPlannerFacts } from './tourPlannerFacts'
import { usePlannerHistory } from './usePlannerHistory'
import { useTourDraftStorage } from './useTourDraftStorage'
import { useTourRevisionGuard } from './useTourRevisionGuard'
import { useRouteShaping } from './useRouteShaping'
import { useLegVariants } from './useLegVariants'
import { useRoundHikes } from './useRoundHikes'
import { useTourMapView } from './useTourMapView'
import { DEFAULT_ROUTING_CHOICES, useRoutingChoices, type RoutingChoices } from './useRoutingChoices'
import { draftChoices, type DerivedTourDraft, type DraftPayload, type DraftSource } from './tourPlannerDraft'
import { paddleEstimateOf } from './paddlePlanOf'
import { adoptChangedPoints } from './paddleRouting'
import { NO_PADDLE_FIELDS, paddleFieldsOf, usePaddleFields } from './usePaddleFields'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'
import { useRunPace } from '../run/useRunPace'
import { NO_SKI_CHOICE } from '../ski/skiChoice'
import { savedSkiSeed } from '../ski/savedSkiRoute'
import { useSkiFields } from '../ski/useSkiFields'
import { lostStageEnds } from '../stages/tourStages'
import { useTourStages } from '../stages/useTourStages'
import { useWalkFerries, useWalkStays } from '../walk/useWalkFerries'
import { useWaypointCommands } from './useWaypointCommands'

export type TourPlannerStatus =
  | 'empty'
  | 'dirty'
  | 'routing'
  | 'routing-failed'
  | 'enriching-elevation'
  | 'elevation-failed'
  | 'ready'
  | 'saving'
  | 'saved'

/** One step of the history: the route, and what the route depends on. */
interface HistoryEntry extends RoutingChoices {
  waypoints: TourPlannerWaypoint[]; tourType: PlannableTourType
}

/** CW-02: two steps plan the same route: their points alike but for a station's own fields, and the same choices. */
function sameRoute(a: HistoryEntry, b: HistoryEntry): boolean {
  const { waypoints: pointsA, ...choicesA } = a
  const { waypoints: pointsB, ...choicesB } = b
  return routeInputsKey(pointsA) === routeInputsKey(pointsB) && JSON.stringify(choicesA) === JSON.stringify(choicesB)
}

/** Where a new tour was planned from; an edit leaves it as it was saved. */
function derivedFromField(placeId: number | null, derivedFrom: number | null): { derived_from_place_id?: number } {
  return placeId === null && derivedFrom !== null ? { derived_from_place_id: derivedFrom } : {}
}

/** SKI-02: the line a ski tour was saved with, as this device keeps it; a tour of another type has none to read. */
async function savedSkiLineOf(tripId: number | string, tour: TourListItem): Promise<string | null> {
  return tour.tour_type === 'ski' ? await tourRepo.savedLine(tripId, tour.place_id) : null
}

function trimmedOrNull(value: string): string | null {
  return value.trim() || null
}

function parsedWebsiteOrNull(value: string) {
  return value.trim() ? tourWebsiteSchema.parse(value) : null
}

export interface UseTourPlannerOptions extends TourPermissionProps {
  tripId: number | string
  active?: boolean
  onSaved?: (result: TourCreateResponse) => void | Promise<void>
}

export type TourPlannerMode =
  | { type: 'neutral' }
  | { type: 'new-draft' }
  | { type: 'edit-saved'; placeId: number }
  | { type: 'view-gpx'; placeId: number; tour: TourListItem }

export function selectTourPlannerMode(state: {
  readOnlyGpxTour: { tour: TourListItem } | null
  editingPlaceId: number | null
  hasUnsavedChanges: boolean
}): TourPlannerMode {
  if (state.readOnlyGpxTour) {
    return { type: 'view-gpx', placeId: state.readOnlyGpxTour.tour.place_id, tour: state.readOnlyGpxTour.tour }
  }
  if (state.editingPlaceId !== null) return { type: 'edit-saved', placeId: state.editingPlaceId }
  if (state.hasUnsavedChanges) return { type: 'new-draft' }
  return { type: 'neutral' }
}

export function useTourPlanner({ tripId, active = true, onSaved, canEdit: editPermission, canAssign: assignPermission }: UseTourPlannerOptions) {
  const { canEdit, canAssign } = useTourPermissions({ tripId, canEdit: editPermission, canAssign: assignPermission })
  const editPermissionRef = useRef(canEdit)
  editPermissionRef.current = canEdit
  const [name, setNameState] = useState('')
  const [description, setDescriptionState] = useState('')
  const [website, setWebsiteState] = useState('')
  const [plannedDurationMinutes, setPlannedDurationMinutesState] = useState<number | null>(null)
  const [breakAdditionalMinutes, setBreakAdditionalMinutesState] = useState<number | null>(null)
  const [waypoints, setWaypoints] = useState<TourPlannerWaypoint[]>([])
  // MF-08, BIK-01, RUN-01: what the route is planned with besides its points and type.
  const routingChoices = useRoutingChoices(DEFAULT_ROUTING_CHOICES)
  const { ref: choicesRef, load: loadChoices } = routingChoices
  const { difficulty: maxHikingDifficulty, preferences: hikingPreferences, bikeProfile, runProfile } = routingChoices.choices
  const [tourType, setTourTypeState] = useState<PlannableTourType>('hike')
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null)
  const history = usePlannerHistory<HistoryEntry>()
  const { record: recordStep, clear: clearHistory } = history
  const revision = useTourRevisionGuard(null)
  const { adopt: adoptRevision, refuse: refuseRevision, baseRef: revisionBaseRef } = revision
  const [status, setStatus] = useState<TourPlannerStatus>('empty')
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null)
  const [derivedFromPlaceId, setDerivedFromPlaceId] = useState<number | null>(null)
  const [draftSource, setDraftSource] = useState<DraftSource | null>(null)
  // CW-11: the open walk was saved with its stations only; its way is planned here and kept by the next save.
  const [routePending, setRoutePending] = useState(false)
  const [openingTourId, setOpeningTourId] = useState<number | null>(null)
  const [saveOutcome, setSaveOutcome] = useState<TourListItem | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const mapView = useTourMapView()
  const [readOnlyGpxTour, setReadOnlyGpxTour] = useState<{ tour: TourListItem; routeGeometry: string | null } | null>(null)
  const [newTourConfirmationOpen, setNewTourConfirmationOpen] = useState(false)
  const [elevationProfileExpanded, setElevationProfileExpanded] = useState(true)
  const [routeProfileFocus, setRouteProfileFocus] = useState<RouteProfileFocus | null>(null)
  const [newDraftGeneration, setNewDraftGeneration] = useState(0)
  const [mapFocusKey, setMapFocusKey] = useState(0)
  // Asked once while the planner lives, not each time its rail mounts again (a tab switch).
  const [alpineAcknowledged, setAlpineAcknowledged] = useState(false)
  const acknowledgeAlpine = useCallback(() => setAlpineAcknowledged(true), [])
  // MDT-01: stage ends the last change of the points could not keep. Said until the user's next change,
  // undo or redo, or another draft, so a point the router lays in afterwards does not take the notice away.
  const [stageLoss, setStageLoss] = useState(0)
  const draftRevisionRef = useRef(0)
  const saveRequestIdRef = useRef(0)
  const saveInFlightRef = useRef(false)
  const deletedTourPlaceIdsRef = useRef(new Set<number>())
  const mountedRef = useRef(false)
  const contextGenerationRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const detailAbortRef = useRef<AbortController | null>(null)
  const detailPlaceIdRef = useRef<number | null>(null)
  const activeRef = useRef(active)
  const readOnlyGpxTourRef = useRef(readOnlyGpxTour)
  const tripIdRef = useRef(tripId)
  const editingPlaceIdRef = useRef(editingPlaceId)
  activeRef.current = active
  readOnlyGpxTourRef.current = readOnlyGpxTour
  tripIdRef.current = tripId
  editingPlaceIdRef.current = editingPlaceId
  const waypointsRef = useRef(waypoints)
  const tourTypeRef = useRef(tourType)
  waypointsRef.current = waypoints
  const snapshot = useCallback((): HistoryEntry => ({
    waypoints: waypointsRef.current, ...choicesRef.current, tourType: tourTypeRef.current,
  }), [choicesRef])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      saveRequestIdRef.current += 1
      saveInFlightRef.current = false
      detailRequestIdRef.current += 1
      detailPlaceIdRef.current = null
      detailAbortRef.current?.abort()
      detailAbortRef.current = null
    }
  }, [])

  const invalidateDetailRequest = useCallback(() => {
    detailRequestIdRef.current += 1
    detailPlaceIdRef.current = null
    detailAbortRef.current?.abort()
    detailAbortRef.current = null
    if (mountedRef.current) setOpeningTourId(null)
  }, [])

  useEffect(() => {
    if (!active) invalidateDetailRequest()
  }, [active, invalidateDetailRequest])

  useEffect(() => {
    invalidateDetailRequest()
  }, [tripId, invalidateDetailRequest])

  /** A field other than the route changed: the draft is unsaved again, and a finished save is no longer current. */
  const markEdited = useCallback(() => {
    if (!editPermissionRef.current) return false
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus(current => current === 'saved' || current === 'saving' ? (waypointsRef.current.length < 2 ? 'dirty' : 'ready') : current)
    return true
  }, [invalidateDetailRequest])

  const paddle = usePaddleFields(NO_PADDLE_FIELDS, markEdited)
  const runPace = useRunPace(null, markEdited)
  const loadRunPace = runPace.load
  // SKI-02: a ski tour's discipline and technique, nothing chosen until the traveller picks.
  const ski = useSkiFields(NO_SKI_CHOICE, markEdited)
  const loadSki = ski.load
  const loadPaddle = paddle.load
  const paddleBoat = paddle.boatType
  // The router's own default where the tour names none, so a plan and its cache key agree.
  const paddleLakeStyle = paddle.lakeStyle ?? 'direct'

  // A point the router set (a paddle tour's) is laid in without a step of the history.
  const patchWaypoints = useCallback((next: TourPlannerWaypoint[]) => {
    waypointsRef.current = next
    setWaypoints(next)
  }, [])
  const forgetFocus = useCallback(() => setRouteProfileFocus(null), [])
  const routing = useTourRoute({
    tripId, waypoints, tourType, maxHikingDifficulty, hikingPreferences, bikeProfile, runProfile, paddleBoat, paddleLakeStyle, skiChoice: ski.choice, retryToken,
    error, setStatus, setError, onCleared: forgetFocus, patchWaypoints,
  })
  const { route, routeParts, paddleRoute, skiRoute, enrichedGeometry, routeCurrent, distanceMeters, durationSeconds,
    unreachable, interruptRouting, clearRoute, openSavedSkiRoute } = routing

  const commitWaypoints = useCallback((nextValue: TourPlannerWaypoint[] | ((current: TourPlannerWaypoint[]) => TourPlannerWaypoint[])) => {
    if (!editPermissionRef.current) return
    const current = waypointsRef.current
    const changed = typeof nextValue === 'function' ? nextValue(current) : nextValue
    const paddle = tourTypeRef.current === 'kayak'
    // A point the router set that the paddler moves or edits is theirs from then on.
    const next = normalizePlannerWaypoints(paddle ? adoptChangedPoints(current, changed) : changed, tourTypeRef.current)
    if (sameWaypointSnapshot(current, next)) return
    recordStep(snapshot())
    waypointsRef.current = next
    setWaypoints(next)
    const lost = lostStageEnds(current, changed, next)
    setStageLoss(lost)
    // CW-02: a station's own fields (its stay, its name) plan no route: the routing goes on, and Save stays as it was.
    if (routeInputsKey(current) === routeInputsKey(next)) {
      markEdited()
      return
    }
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [recordStep, invalidateDetailRequest, interruptRouting, markEdited, snapshot])

  /** Whether the points may change now: the viewer may edit and no save is on its way. */
  const mayEditPoints = useCallback(() => editPermissionRef.current && !saveInFlightRef.current, [])

  // Detail laid in after the step that asked for it (a portage's way on land), with no step of its own.
  const amendWaypoints = useCallback((change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
    if (!editPermissionRef.current || saveInFlightRef.current) return
    const changed = change(waypointsRef.current)
    if (changed === waypointsRef.current) return
    interruptRouting()
    draftRevisionRef.current += 1
    waypointsRef.current = normalizePlannerWaypoints(changed, tourTypeRef.current)
    setWaypoints(waypointsRef.current)
    setHasUnsavedChanges(true)
    setStatus('dirty')
  }, [interruptRouting])

  /**
   * The routing choices, as one step of the history: a hike's limit and its
   * preferences (MF-08), a bike tour's profile (BIK-01), a run's (RUN-01). The route is planned again.
   */
  const setRoutingChoice = useCallback((change: Partial<RoutingChoices>) => {
    if (!editPermissionRef.current) return
    const current = choicesRef.current
    const preferences = change.preferences === undefined ? current.preferences : hikingPreferencesOf(change.preferences)
    const next = { ...current, ...change, preferences }
    if (next.difficulty === current.difficulty && next.bikeProfile === current.bikeProfile && next.runProfile === current.runProfile
      && JSON.stringify(preferences) === JSON.stringify(current.preferences)) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    recordStep(snapshot())
    loadChoices(next)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [choicesRef, loadChoices, recordStep, invalidateDetailRequest, interruptRouting, snapshot])
  const setMaxHikingDifficulty = useCallback((difficulty: TourMaxHikingDifficulty) => setRoutingChoice({ difficulty }), [setRoutingChoice])
  const setHikingPreferences = useCallback((preferences: HikingPreferences | null) => setRoutingChoice({ preferences }), [setRoutingChoice])
  const setBikeProfile = useCallback((profile: BikeProfile) => setRoutingChoice({ bikeProfile: profile }), [setRoutingChoice])
  const setRunProfile = useCallback((profile: RunProfile) => setRoutingChoice({ runProfile: profile }), [setRoutingChoice])

  const { addWaypoint, appendFixedLeg, setWaypointPosition, returnToStart, reverse, editPaddlePoints,
    toggleWaypointFreeLeg, removeWaypoint, moveWaypoint, reorderWaypoint } = useWaypointCommands({
    commitWaypoints, editPermissionRef, saveInFlightRef, waypointsRef, tourTypeRef, setSelectedWaypointId,
  })

  /** A snapshot of the history put back: the route and what it depends on. */
  const restoreStep = useCallback((entry: HistoryEntry) => {
    // CW-02: a step that changed a station's own fields only comes back without planning the route again.
    const routeKept = sameRoute(entry, snapshot())
    invalidateDetailRequest()
    if (!routeKept) interruptRouting()
    draftRevisionRef.current += 1
    const { waypoints: points, tourType: type, ...choices } = entry
    waypointsRef.current = points
    tourTypeRef.current = type
    setWaypoints(points)
    setStageLoss(0)
    loadChoices(choices)
    setTourTypeState(type)
    setSelectedWaypointId(id => entry.waypoints.some(point => point.id === id) ? id : entry.waypoints[0]?.id ?? null)
    setHasUnsavedChanges(true)
    if (routeKept) return
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting, loadChoices, snapshot])

  const { undo: undoStep, redo: redoStep } = history
  const undo = useCallback(() => {
    if (!editPermissionRef.current) return
    const previous = undoStep(snapshot())
    if (previous) restoreStep(previous)
  }, [restoreStep, snapshot, undoStep])

  const redo = useCallback(() => {
    if (!editPermissionRef.current) return
    const next = redoStep(snapshot())
    if (next) restoreStep(next)
  }, [redoStep, restoreStep, snapshot])

  const setName = useCallback((value: string) => {
    if (value !== name && markEdited()) setNameState(value)
  }, [markEdited, name])

  const setDescription = useCallback((value: string) => {
    if (value !== description && markEdited()) setDescriptionState(value)
  }, [description, markEdited])

  const setWebsite = useCallback((value: string) => {
    if (value !== website && markEdited()) setWebsiteState(value)
  }, [markEdited, website])

  const setPlannedDurationMinutes = useCallback((value: number | null) => {
    if (value !== plannedDurationMinutes && markEdited()) setPlannedDurationMinutesState(value)
  }, [markEdited, plannedDurationMinutes])

  const setBreakAdditionalMinutes = useCallback((value: number | null) => {
    if (value !== breakAdditionalMinutes && markEdited()) setBreakAdditionalMinutesState(value)
  }, [breakAdditionalMinutes, markEdited])

  /**
   * PAD-01, BIK-01, RUN-01, HOR-01, SKI-02: the type, as one step of the history
   * with the route, since a paddle tour draws every leg by hand, neither a bike
   * tour, a run nor a ski tour takes a via ferrata and a ride takes every leg
   * from a horse route or by hand. Nothing is put on a day by the choice itself.
   */
  const setTourType = useCallback((value: PlannableTourType) => {
    if (!editPermissionRef.current || saveInFlightRef.current || value === tourTypeRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    recordStep(snapshot())
    tourTypeRef.current = value
    setTourTypeState(value)
    setStageLoss(0)
    const noFerrata = value === 'bike' || value === 'run' || value === 'ski'
    const next = normalizePlannerWaypoints(noFerrata ? ridablePoints(waypointsRef.current) : waypointsRef.current, value)
    waypointsRef.current = next
    setWaypoints(next)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [recordStep, invalidateDetailRequest, interruptRouting, snapshot])

  const routeAnalysis = useMemo(
    () => analyzeRouteGeometry(JSON.stringify(enrichedGeometry ?? route)),
    [enrichedGeometry, route],
  )
  const isPaddle = tourType === 'kayak'
  const paddleSpeedInvalid = paddle.speedKmh !== null && !paddleSpeedKmhSchema.safeParse(paddle.speedKmh).success
  const { effectiveSpeedKmh, portageSpeedKmh, boatType, waterContext, speedKmh, lakeStyle } = paddle
  // The routed length of each leg while the route is the current points' (PAD-11); straight lines before that.
  const routedLegLengths = paddleRoute && routeCurrent ? paddleRoute.legLengths : undefined
  const paddleEstimate = useMemo(() => isPaddle ? paddleEstimateOf(waypoints, { effectiveSpeedKmh, portageSpeedKmh }, paddleSpeedInvalid, routedLegLengths) : null,
    [effectiveSpeedKmh, isPaddle, paddleSpeedInvalid, portageSpeedKmh, routedLegLengths, waypoints])
  // CW-02: a city walk's stays, what of them is known; CW-12: and the minutes of its boats, never walking.
  const stays = useWalkStays(tourType, waypoints, routeCurrent ? routing.ferries : null)
  const runPaceSecondsPerKm = runPace.paceSecondsPerKm
  // MDT-01: the stages, cut from the route while it is the one planned for these points.
  const stagePaddle = useMemo(() => isPaddle
    ? { effectiveSpeedKmh, portageSpeedKmh, speedInvalid: paddleSpeedInvalid, legLengths: routedLegLengths }
    : null, [effectiveSpeedKmh, isPaddle, paddleSpeedInvalid, portageSpeedKmh, routedLegLengths])
  const stages = useTourStages({
    waypoints, line: routeCurrent ? (enrichedGeometry ?? route) : null, tourType, routerSeconds: durationSeconds,
    paddle: stagePaddle, runPaceSecondsPerKm, commit: commitWaypoints, mayEdit: mayEditPoints,
    draftKey: `${editingPlaceId ?? 'new'}:${newDraftGeneration}`,
    lost: stageLoss,
  })
  const stageCount = Math.max(1, stages.stages.length)
  const facts = useMemo(() => tourPlannerFacts({
    tourType, maxHikingDifficulty, hikingPreferences, bikeProfile, ski: ski.choice, runProfile, runPaceSecondsPerKm, website,
    skiRouteBuild: skiRoute?.build ?? null, skiPlannedLegs: skiRoute?.plannedLegs ?? null, plannedDurationMinutes, breakAdditionalMinutes,
    paddle: { boatType, waterContext, speedKmh, portageSpeedKmh, lakeStyle },
    paddleSpeedInvalid, paddleEstimate, routeAnalysis, durationSeconds, stays, stageCount,
  }), [bikeProfile, boatType, breakAdditionalMinutes, durationSeconds, hikingPreferences, lakeStyle, maxHikingDifficulty, paddleEstimate, paddleSpeedInvalid,
    plannedDurationMinutes, portageSpeedKmh, routeAnalysis, runPaceSecondsPerKm, runProfile, speedKmh, stageCount, stays, tourType, waterContext,
    website, ski.choice, skiRoute])
  // CW-02: a city walk's times as the overview says them, from the same derivation as its planned total.
  const { websiteInvalid, plannedDurationInvalid, breakAdditionalInvalid, paddleIncomplete, walkingDurationMinutes,
    plannedTotalMinutes, plannedTotalInvalid, savedDurationSeconds, savedBreakAdditionalMinutes, typeFields, stationStays,
    runPaceMissing, runPaceInvalid, skiMissing } = facts

  // The account's draft, once its read is back, laid in as it was left; not over anything begun meanwhile.
  const restoreDraft = useCallback((draft: DraftPayload) => {
    if (saveInFlightRef.current || draftRevisionRef.current !== 0 || readOnlyGpxTourRef.current) return
    const type = draft.tourType ?? 'hike'
    setNameState(draft.name)
    setDescriptionState(draft.description ?? '')
    setWebsiteState(draft.website ?? '')
    setPlannedDurationMinutesState(draft.plannedDurationMinutes ?? null)
    setBreakAdditionalMinutesState(draft.breakAdditionalMinutes ?? null)
    waypointsRef.current = draft.waypoints
    setWaypoints(draft.waypoints)
    setSelectedWaypointId(draft.waypoints[0]?.id ?? null)
    tourTypeRef.current = type
    setTourTypeState(type)
    loadChoices(draftChoices(draft))
    loadPaddle(draft.paddle ?? NO_PADDLE_FIELDS)
    loadRunPace(draft.runPaceSecondsPerKm ?? null)
    loadSki(draft.ski ?? NO_SKI_CHOICE)
    adoptRevision(draft.baseRevision ?? null)
    const editing = draft.editingPlaceId ?? null
    setEditingPlaceId(editing)
    editingPlaceIdRef.current = editing
    setDerivedFromPlaceId(draft.derivedFromPlaceId ?? null)
    setDraftSource(draft.draftSource ?? null)
    setStatus(draft.waypoints.length ? 'dirty' : 'empty')
    setHasUnsavedChanges(true)
    setDraftRestored(true)
    setMapFocusKey(key => key + 1)
  }, [adoptRevision, loadChoices, loadPaddle, loadRunPace, loadSki])
  const { keep: keepDraft, forget: forgetDraft } = useTourDraftStorage(tripId, restoreDraft)

  /**
   * Back to nothing open. The map is framed on the trip again unless `keepView` says the traveller
   * is only leaving the tour they were looking at, whose view is then theirs to keep.
   */
  const returnToNeutral = useCallback((options?: { keepView?: boolean }) => {
    if (saveInFlightRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    contextGenerationRef.current += 1
    draftRevisionRef.current += 1
    setRouteProfileFocus(null)
    forgetDraft()
    setNameState('')
    setDescriptionState('')
    setWebsiteState('')
    setPlannedDurationMinutesState(null)
    setBreakAdditionalMinutesState(null)
    setWaypoints([])
    setTourTypeState('hike')
    loadPaddle(NO_PADDLE_FIELDS)
    waypointsRef.current = []
    loadChoices(DEFAULT_ROUTING_CHOICES)
    loadRunPace(null)
    loadSki(NO_SKI_CHOICE)
    tourTypeRef.current = 'hike'
    setSelectedWaypointId(null)
    clearHistory()
    setStageLoss(0)
    setStatus('empty')
    clearRoute()
    setError(null)
    setHasUnsavedChanges(false)
    setDraftRestored(false)
    setEditingPlaceId(null)
    editingPlaceIdRef.current = null
    setDerivedFromPlaceId(null)
    setDraftSource(null)
    setRoutePending(false)
    adoptRevision(null)
    setOpeningTourId(null)
    setSaveOutcome(null)
    setReadOnlyGpxTour(null)
    setNewTourConfirmationOpen(false)
    setElevationProfileExpanded(true)
    setNewDraftGeneration(generation => generation + 1)
    if (!options?.keepView) setMapFocusKey(key => key + 1)
  }, [adoptRevision, clearHistory, clearRoute, invalidateDetailRequest, interruptRouting, loadChoices, loadPaddle, loadRunPace, loadSki, forgetDraft])

  const forgetDeletedTour = useCallback((placeId: number) => {
    deletedTourPlaceIdsRef.current.add(placeId)
    const editorReferencesTour = editingPlaceIdRef.current === placeId
      || readOnlyGpxTourRef.current?.tour.place_id === placeId
      || detailPlaceIdRef.current === placeId
    if (!editorReferencesTour) return
    if (saveInFlightRef.current) {
      saveRequestIdRef.current += 1
      saveInFlightRef.current = false
      setIsSaving(false)
    }
    returnToNeutral()
  }, [returnToNeutral])

  const startNewTour = useCallback((confirmed = false) => {
    if (!editPermissionRef.current || saveInFlightRef.current) return
    const currentDraftIsEmpty = editingPlaceId === null && waypoints.length === 0 && name.trim().length === 0
    if (!confirmed && hasUnsavedChanges && !currentDraftIsEmpty) {
      setNewTourConfirmationOpen(true)
      return
    }
    returnToNeutral({ keepView: true })
    setHasUnsavedChanges(true)
  }, [editingPlaceId, hasUnsavedChanges, name, returnToNeutral, waypoints.length]
  )

  /**
   * A draft through the control points taken from an import: a new tour that
   * remembers the import, or the import itself planned over in place. Nothing
   * is stored until the draft is saved like any other.
   */
  const startDerivedTour = useCallback(
    (draft: DerivedTourDraft) => {
      if (!editPermissionRef.current || saveInFlightRef.current || draft.points.length < 2) return false
      returnToNeutral()
      const type = draft.tourType ?? 'hike'
      const points = normalizePlannerWaypoints(
        draft.points.map(({ lat, lng, name }) => ({
          id: randomId(), lat, lng, role: 'via' as const, ...(name ? { name } : {}),
        })),
        type,
      )
      setDraftSource(draft.source ?? null)
      tourTypeRef.current = type
      setTourTypeState(type)
      if (draft.paddle) loadPaddle(draft.paddle)
      loadChoices({ difficulty: draft.difficulty, ...(draft.bikeProfile ? { bikeProfile: draft.bikeProfile } : {}),
        ...(draft.runProfile ? { runProfile: draft.runProfile } : {}) })
      loadRunPace(draft.runPaceSecondsPerKm ?? null)
      if (draft.ski) loadSki(draft.ski)
      setNameState(draft.name)
      setDescriptionState(draft.description ?? '')
      setWebsiteState(draft.website ?? '')
      setWaypoints(points)
      waypointsRef.current = points
      setSelectedWaypointId(points[0].id)
      if (draft.inPlace && draft.sourcePlaceId !== undefined) {
        setEditingPlaceId(draft.sourcePlaceId)
        editingPlaceIdRef.current = draft.sourcePlaceId
        adoptRevision(draft.revision)
      } else {
        setDerivedFromPlaceId(draft.sourcePlaceId ?? null)
      }
      setStatus('dirty')
      setHasUnsavedChanges(true)
      return true
    },
    [adoptRevision, loadChoices, loadPaddle, loadRunPace, loadSki, returnToNeutral])

  const cancelNewTour = useCallback(() => setNewTourConfirmationOpen(false), [])
  const toggleElevationProfile = useCallback(() => {
    if (elevationProfileExpanded) setRouteProfileFocus(null)
    setElevationProfileExpanded(expanded => !expanded)
  }, [elevationProfileExpanded])
  const discard = useCallback(() => returnToNeutral({ keepView: true }), [returnToNeutral])

  const viewGpxTour = useCallback((tour: TourListItem, routeGeometry: string | null) => {
    if (saveInFlightRef.current) return
    invalidateDetailRequest()
    contextGenerationRef.current += 1
    returnToNeutral()
    setReadOnlyGpxTour({ tour, routeGeometry })
  }, [invalidateDetailRequest, returnToNeutral])

  const closeGpxTour = useCallback(() => {
    invalidateDetailRequest()
    contextGenerationRef.current += 1
    setRouteProfileFocus(null)
    setReadOnlyGpxTour(null)
  }, [invalidateDetailRequest])

  const openTour = useCallback(async (tour: Pick<TourListItem, 'place_id'> & Partial<TourListItem>) => {
    if (!mountedRef.current || !activeRef.current || saveInFlightRef.current || deletedTourPlaceIdsRef.current.has(tour.place_id)) return false
    detailAbortRef.current?.abort()
    const controller = new AbortController()
    detailAbortRef.current = controller
    const requestId = ++detailRequestIdRef.current
    const submittedTripId = String(tripId)
    const submittedPlaceId = tour.place_id
    const submittedContextGeneration = contextGenerationRef.current
    const submittedRevision = draftRevisionRef.current
    const submittedEditingPlaceId = editingPlaceIdRef.current
    const submittedGpxPlaceId = readOnlyGpxTourRef.current?.tour.place_id ?? null
    detailPlaceIdRef.current = submittedPlaceId
    const requestIsCurrent = () => mountedRef.current
      && activeRef.current
      && requestId === detailRequestIdRef.current
      && detailPlaceIdRef.current === submittedPlaceId
      && String(tripIdRef.current) === submittedTripId
      && contextGenerationRef.current === submittedContextGeneration
      && draftRevisionRef.current === submittedRevision
      && editingPlaceIdRef.current === submittedEditingPlaceId
      && (readOnlyGpxTourRef.current?.tour.place_id ?? null) === submittedGpxPlaceId
    const superseded = () => !requestIsCurrent() || saveInFlightRef.current
    setRouteProfileFocus(null)
    setOpeningTourId(tour.place_id)
    setError(null)
    try {
      const result = await tourRepo.detail(tripId, tour.place_id, controller.signal)
      if (superseded()) return false
      if (result.waypoints.length < 2) {
        setError('open')
        return false
      }
      // SKI-02: a saved ski tour opens with the line it was saved with, read from this device.
      const skiLine = await savedSkiLineOf(tripId, result.tour)
      if (superseded()) return false

      interruptRouting()
      const opened = openedTourFields(result.tour)
      const nextWaypoints = normalizePlannerWaypoints(plannerWaypointsOf(result.waypoints, randomId), opened.tourType)
      forgetDraft()
      contextGenerationRef.current += 1
      draftRevisionRef.current += 1
      setNameState(opened.name)
      setDescriptionState(opened.description)
      setWebsiteState(opened.website)
      setPlannedDurationMinutesState(opened.plannedDurationMinutes)
      setBreakAdditionalMinutesState(opened.breakAdditionalMinutes)
      setWaypoints(nextWaypoints)
      setTourTypeState(opened.tourType)
      loadPaddle(paddleFieldsOf(result.tour))
      waypointsRef.current = nextWaypoints
      loadChoices({ difficulty: opened.difficulty, preferences: opened.preferences, bikeProfile: opened.bikeProfile,
        runProfile: opened.runProfile })
      loadRunPace(opened.runPaceSecondsPerKm)
      loadSki(opened.ski)
      tourTypeRef.current = opened.tourType
      setSelectedWaypointId(nextWaypoints[0]?.id ?? null)
      clearHistory()
      setStageLoss(0)
      setStatus('dirty')
      clearRoute()
      openSavedSkiRoute(savedSkiSeed(result.tour, skiLine, nextWaypoints, opened.ski))
      // CW-11: a walk without its way yet is planned on opening and can be saved with it at once.
      const pending = result.tour.route_pending === true
      setRoutePending(pending)
      setHasUnsavedChanges(pending && editPermissionRef.current)
      setDraftRestored(false)
      setEditingPlaceId(result.tour.place_id)
      editingPlaceIdRef.current = result.tour.place_id
      adoptRevision(result.tour.revision)
      setMapFocusKey(key => key + 1)
      setSaveOutcome(null)
      setReadOnlyGpxTour(null)
      setDraftSource(null)
      return true
    } catch {
      if (requestIsCurrent() && !saveInFlightRef.current) setError('open')
      return false
    } finally {
      if (mountedRef.current && requestId === detailRequestIdRef.current) {
        detailPlaceIdRef.current = null
        if (detailAbortRef.current === controller) detailAbortRef.current = null
        setOpeningTourId(null)
      }
    }
  }, [adoptRevision, clearHistory, clearRoute, interruptRouting, loadChoices, loadPaddle, loadRunPace, loadSki, forgetDraft, openSavedSkiRoute,
    tripId])

  const retry = useCallback(() => {
    if (waypointsRef.current.length < 2) return
    interruptRouting()
    setError(null)
    setStatus('dirty')
    setRetryToken(value => value + 1)
  }, [interruptRouting])

  // P2A-03/P2A-05/PAD-11: shaping points, a leg planned afresh, drawn legs handed back to the router.
  const shaping = useRouteShaping({
    commit: commitWaypoints, waypointsRef, retry, mayEdit: mayEditPoints,
    isPaddle: useCallback(() => tourTypeRef.current === 'kayak', []),
    forgetLeg: useCallback((from: TourPlannerWaypoint, to: TourPlannerWaypoint) =>
      paddleRouteRepo.forget(tripId, from, to, { boat: paddleBoat ?? 'kayak', lakeStyle: paddleLakeStyle }), [paddleBoat, paddleLakeStyle, tripId]),
  })
  // RTE-02: other ways for one routed section of a hike, compared and taken on purpose.
  const legVariants = useLegVariants({
    waypoints, route, enrichedGeometry, routeCurrent, tourType, maxHikingDifficulty, hikingPreferences, undo, mayEdit: mayEditPoints,
    insertShapingPoints: shaping.insertShapingPoints,
  })
  // RTE-03: round hikes of about a wished length out of a stop, put in place of the plan on purpose.
  const roundHikes = useRoundHikes({
    waypoints, tourType, maxHikingDifficulty, hikingPreferences, replaceWaypoints: commitWaypoints, undo, mayEdit: mayEditPoints,
  })

  const readOnlyGpxAnalysis = useMemo(
    () => analyzeRouteGeometry(readOnlyGpxTour?.routeGeometry),
    [readOnlyGpxTour?.routeGeometry],
  )
  const mode = useMemo(() => selectTourPlannerMode({ readOnlyGpxTour, editingPlaceId, hasUnsavedChanges }), [editingPlaceId, hasUnsavedChanges, readOnlyGpxTour])
  const focusOwner = mode.type === 'view-gpx' || mode.type === 'edit-saved' ? `${mode.type}:${mode.placeId}` : mode.type
  useEffect(() => { setRouteProfileFocus(null) }, [focusOwner, routeAnalysis, readOnlyGpxAnalysis, readOnlyGpxTour])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const draft: DraftPayload = { version: 11, name, description, website, plannedDurationMinutes, breakAdditionalMinutes, waypoints, maxHikingDifficulty, editingPlaceId,
      derivedFromPlaceId, draftSource, tourType, baseRevision: revision.base, hikingPreferences, bikeProfile, ski: ski.choice,
      runProfile, runPaceSecondsPerKm,
      paddle: { boatType: paddle.boatType, waterContext: paddle.waterContext, speedKmh: paddle.speedKmh, portageSpeedKmh: paddle.portageSpeedKmh, lakeStyle: paddle.lakeStyle },
    }
    keepDraft(draft)
  }, [breakAdditionalMinutes,
    derivedFromPlaceId, draftSource, description, editingPlaceId, hasUnsavedChanges, maxHikingDifficulty, name, plannedDurationMinutes, keepDraft, waypoints, website,
    tourType, paddle.boatType, paddle.waterContext, paddle.speedKmh, paddle.portageSpeedKmh, paddle.lakeStyle, revision.base, hikingPreferences,
    bikeProfile, ski.choice, runProfile, runPaceSecondsPerKm])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  // CW-12: a city walk's crossings by boat; one the travellers have not taken on purpose holds the save.
  const walkFerries = useWalkFerries({ tourType, ferries: routing.ferries, routeCurrent, walkGap: routing.walkGap, waypoints, editWaypoints: commitWaypoints })
  const canSave = canEdit && !isSaving && hasUnsavedChanges && name.trim().length > 0 && status === 'ready'
    && routeCurrent && hasCompleteElevation(enrichedGeometry) && !walkFerries.blocksSave
    && description.length <= 2000 && !websiteInvalid && !plannedDurationInvalid && !breakAdditionalInvalid && !plannedTotalInvalid
    && !paddleIncomplete && !(isPaddle && paddleSpeedInvalid) && !runPaceMissing && !runPaceInvalid && !skiMissing

  /**
   * Saves the draft: over the tour it edits, naming the revision it was loaded
   * at (P2C-03), or with `asNew` as a tour of its own under `name`, the way out
   * of a refused save that keeps both versions.
   */
  const save = useCallback(async (options: { asNew?: boolean; name?: string } = {}) => {
    if (!mountedRef.current || saveInFlightRef.current || !editPermissionRef.current || !canSave || !hasCompleteElevation(enrichedGeometry)) return null
    if (editingPlaceId !== null && deletedTourPlaceIdsRef.current.has(editingPlaceId)) return null
    invalidateDetailRequest()
    saveInFlightRef.current = true
    const requestId = ++saveRequestIdRef.current
    const submittedRevision = draftRevisionRef.current
    const submittedContextGeneration = contextGenerationRef.current
    const submittedTripId = String(tripId)
    const submittedPlaceId = editingPlaceId
    const targetPlaceId = options.asNew ? null : submittedPlaceId
    const expectedRevision = targetPlaceId === null ? null : revisionBaseRef.current
    const payload = {
      name: (options.name ?? name).trim(),
      description: trimmedOrNull(description),
      website: parsedWebsiteOrNull(website),
      ...typeFields,
      route_geometry: enrichedGeometry.map(point => [point[0], point[1], point[2]]),
      waypoints: savedWaypointsOf(waypoints, tourType),
      duration_seconds: savedDurationSeconds,
      planned_duration_minutes: plannedDurationMinutes,
      break_additional_minutes: savedBreakAdditionalMinutes,
      ...derivedFromField(targetPlaceId, derivedFromPlaceId),
      ...(expectedRevision !== null ? { expected_revision: expectedRevision } : {}),
    } as const
    setStatus('saving')
    setIsSaving(true)
    setError(null)
    const stillCurrent = () => mountedRef.current
      && requestId === saveRequestIdRef.current
      && String(tripIdRef.current) === submittedTripId
      && editingPlaceIdRef.current === submittedPlaceId
      && contextGenerationRef.current === submittedContextGeneration
      && draftRevisionRef.current === submittedRevision
    try {
      const result = targetPlaceId === null
        ? await tourRepo.create(tripId, payload)
        : await tourRepo.update(tripId, targetPlaceId, payload)
      if (stillCurrent()) {
        // CW-03: the keys the server gave new points stay with them, so the next save keeps their visits.
        const keyed = withSavedKeys(waypointsRef.current, result.waypoints)
        if (keyed !== waypointsRef.current) {
          waypointsRef.current = keyed
          setWaypoints(keyed)
        }
        forgetDraft()
        adoptRevision(result.tour.revision)
        if (options.name) setNameState(options.name.trim())
        setHasUnsavedChanges(false)
        setRoutePending(false)
        setStatus('saved')
        clearHistory()
        setStageLoss(0)
        setEditingPlaceId(result.tour.place_id)
        editingPlaceIdRef.current = result.tour.place_id
        setDraftSource(null)
        setSaveOutcome(result.tour)
      }
      if (mountedRef.current && String(tripIdRef.current) === submittedTripId && !deletedTourPlaceIdsRef.current.has(result.tour.place_id)) {
        try { await onSaved?.(result) } catch { return result }
      }
      return result
    } catch (failure: unknown) {
      if (stillCurrent()) {
        setStatus('ready')
        // A save refused because someone else saved the tour meanwhile keeps the draft and asks what to do.
        setError(refuseRevision(failure) ? 'conflict' : 'save')
      }
      return null
    } finally {
      if (mountedRef.current && requestId === saveRequestIdRef.current) {
        saveInFlightRef.current = false
        setIsSaving(false)
      }
    }
  }, [adoptRevision, refuseRevision, revisionBaseRef, clearHistory, savedBreakAdditionalMinutes, canSave,
    derivedFromPlaceId,
    description, savedDurationSeconds, editingPlaceId, enrichedGeometry, invalidateDetailRequest, name, onSaved, plannedDurationMinutes, forgetDraft, tourType, tripId, typeFields, waypoints, website])

  return {
    tripId, canEdit, canAssign,
    name, setName, maxHikingDifficulty, setMaxHikingDifficulty, hikingPreferences, setHikingPreferences,
    bikeProfile, setBikeProfile, isBike: tourType === 'bike', isHorse: tourType === 'horse', isSki: tourType === 'ski', ski, skiMissing,
    runProfile, setRunProfile, isRun: tourType === 'run', runPace, runPaceMissing, runPaceInvalid,
    tourType, setTourType, isPaddle, paddle, paddleSpeedInvalid, paddleIncomplete,
    description, setDescription, website, setWebsite, websiteInvalid,
    plannedDurationMinutes, setPlannedDurationMinutes, plannedDurationInvalid,
    breakAdditionalMinutes, setBreakAdditionalMinutes, breakAdditionalInvalid,
    walkingDurationMinutes, plannedTotalMinutes, plannedTotalInvalid, stationStays,
    waypoints, selectedWaypointId, setSelectedWaypointId,
    addWaypoint, appendFixedLeg, setWaypointPosition, removeWaypoint, moveWaypoint, reorderWaypoint, editWaypoints: commitWaypoints,
    reverse, returnToStart, isLoop: isClosedLoop(waypoints), toggleWaypointFreeLeg, editPaddlePoints, amendWaypoints, paddleEstimate,
    ...shaping, legVariants, roundHikes, paddleRoute, skiRoute, routeCurrent, stages, walkFerries,
    undo, redo, canUndo: history.canUndo, canRedo: history.canRedo, historyMark: history.mark,
    status, error, retry, isSaving,
    route, routeParts, enrichedGeometry, routeAnalysis, distanceMeters, durationSeconds, unreachable,
    routeProfileFocus, setRouteProfileFocus,
    ...mapView,
    mode, readOnlyGpxTour, readOnlyGpxAnalysis, viewGpxTour, closeGpxTour,
    startNewTour,
    startDerivedTour,
    derivedFromPlaceId,
    draftSource,
    newTourConfirmationOpen, cancelNewTour, forgetDeletedTour,
    elevationProfileExpanded, toggleElevationProfile, newDraftGeneration, draftRestored, mapFocusKey,
    alpineAcknowledged, acknowledgeAlpine,
    editingPlaceId, openingTourId, openTour, routePending,
    saveOutcome, hasUnsavedChanges, canSave, save, discard, returnToNeutral, revision,
  }
}

export type TourPlannerController = ReturnType<typeof useTourPlanner>
