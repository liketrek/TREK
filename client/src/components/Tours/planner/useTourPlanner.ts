import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_PLANNED_TOUR_DURATION_MINUTES, paddleSpeedKmhSchema, tourWebsiteSchema, type PlannableTourType, type TourCreateResponse, type TourFixedLeg, type TourListItem, type TourWaypointRole, type TourMaxHikingDifficulty, type PaddleLock } from '@trek/shared'
import { tourRepo } from '../../../repo/tourRepo'
import { randomId } from '../../../utils/randomId'
import { analyzeRouteGeometry, type RouteProfileFocus } from '../../../utils/routeGeometry'
import { enrichTourElevations, routeWalkingTour, type TourElevationPoint, type TourRoutePart } from './tourRouting'
import { keepJoinedFixedLegs } from './tourFixedLegs'
import { alignFreeLegs, closeLoop, isClosedLoop, reverseRoute, toggleFreeLeg } from './tourRouteActions'
import { useTourMapView } from './useTourMapView'
import { validDraft, type DraftPayload } from './tourPlannerDraft'
import { paddleEstimateOf } from './paddlePlanOf'
import { NO_PADDLE_FIELDS, paddleFieldsOf, usePaddleFields, type PaddleFieldValues } from './usePaddleFields'
import { hikingTimeMinutes } from '../hikingTime'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'

export interface TourPlannerWaypoint {
  id: string
  lat: number
  lng: number
  role: TourWaypointRole
  /** The leg to the next waypoint as a fixed line (a via ferrata on the tour), not routed. */
  fixedLeg?: TourFixedLeg | null
  /** PAD-07: a lock at this point of a paddle tour, with the times expected there. */
  lock?: PaddleLock | null
}

/** What a tour planned from an import starts with. */
export interface DerivedTourDraft {
  name: string
  description?: string | null
  website?: string | null
  difficulty: TourMaxHikingDifficulty
  points: Array<{ lat: number; lng: number }>
  /** The import the points were taken from. */
  sourcePlaceId: number
  /**
   * Plan the import over in place, keeping its id, days and notes (the server
   * keeps the recorded track to go back to), rather than as a new tour beside it.
   */
  inPlace: boolean
  /** A paddle import stays a paddle tour, with its boat and water. */
  tourType?: PlannableTourType
  paddle?: PaddleFieldValues
}

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
interface HistoryEntry { waypoints: TourPlannerWaypoint[]; difficulty: TourMaxHikingDifficulty; tourType: PlannableTourType }

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

const ROUTE_DEBOUNCE_MS = 450
const HISTORY_LIMIT = 30

function hasCompleteElevation(points: TourElevationPoint[] | null): points is [number, number, number][] {
  return !!points && points.every(point => point.length === 3 && Number.isFinite(point[2]))
}

/** Roles from the order; free legs follow their points, and a paddle tour draws every leg by hand. */
export function normalizePlannerWaypoints(points: TourPlannerWaypoint[], allFree = false): TourPlannerWaypoint[] {
  return keepJoinedFixedLegs(alignFreeLegs(points, allFree)).map((point, index) => ({
    ...point,
    role: index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'via',
  }))
}

export function tourWaypointKey(points: TourPlannerWaypoint[]): string {
  return points.map(point => `${point.id}:${point.lat.toFixed(7)}:${point.lng.toFixed(7)}${fixedLegKey(point.fixedLeg)}`).join('|')
}

function fixedLegKey(leg: TourFixedLeg | null | undefined): string {
  if (!leg) return ''
  return leg.kind === 'ferrata' ? `:${leg.ref}` : `:${leg.kind}`
}

/** The line, and what a paddler planned along it that draws no line: a portage's time, a lock. */
function sameWaypointSnapshot(a: TourPlannerWaypoint[], b: TourPlannerWaypoint[]): boolean {
  const extras = (points: TourPlannerWaypoint[]) => JSON.stringify(points.map(point => [point.fixedLeg?.kind === 'portage' ? point.fixedLeg.extra_minutes ?? null : null, point.lock ?? null]))
  return tourWaypointKey(a) === tourWaypointKey(b) && extras(a) === extras(b)
}

/** Where a new tour was planned from; an edit leaves it as it was saved. */
function derivedFromField(placeId: number | null, derivedFrom: number | null): { derived_from_place_id?: number } {
  return placeId === null && derivedFrom !== null ? { derived_from_place_id: derivedFrom } : {}
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
  const storageKey = `tour-draft-${tripId}`
  const restored = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null') as unknown
      return validDraft(parsed) ? { ...parsed, waypoints: normalizePlannerWaypoints(parsed.waypoints, parsed.tourType === 'kayak') } : null
    } catch {
      return null
    }
  }, [storageKey])

  const [name, setNameState] = useState(restored?.name ?? '')
  const [description, setDescriptionState] = useState(restored?.description ?? '')
  const [website, setWebsiteState] = useState(restored?.website ?? '')
  const [plannedDurationMinutes, setPlannedDurationMinutesState] = useState<number | null>(restored?.plannedDurationMinutes ?? null)
  const [breakAdditionalMinutes, setBreakAdditionalMinutesState] = useState<number | null>(restored?.breakAdditionalMinutes ?? null)
  const [waypoints, setWaypoints] = useState<TourPlannerWaypoint[]>(restored?.waypoints ?? [])
  const [maxHikingDifficulty, setMaxHikingDifficultyState] = useState<TourMaxHikingDifficulty>(restored?.maxHikingDifficulty ?? 2)
  const [tourType, setTourTypeState] = useState<PlannableTourType>(restored?.tourType ?? 'hike')
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(restored?.waypoints[0]?.id ?? null)
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] })
  const [status, setStatus] = useState<TourPlannerStatus>(restored?.waypoints.length ? 'dirty' : 'empty')
  const [route, setRoute] = useState<[number, number][] | null>(null)
  const [routeParts, setRouteParts] = useState<TourRoutePart[] | null>(null)
  const [enrichedGeometry, setEnrichedGeometry] = useState<TourElevationPoint[] | null>(null)
  const [routeForKey, setRouteForKey] = useState<string | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(Boolean(restored))
  const [isSaving, setIsSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(Boolean(restored))
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(restored?.editingPlaceId ?? null)
  const [derivedFromPlaceId, setDerivedFromPlaceId] = useState<number | null>(restored?.derivedFromPlaceId ?? null)
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
  const abortRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
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
  const difficultyRef = useRef(maxHikingDifficulty)
  const tourTypeRef = useRef(tourType)
  waypointsRef.current = waypoints
  difficultyRef.current = maxHikingDifficulty
  const snapshot = useCallback((): HistoryEntry => ({ waypoints: waypointsRef.current, difficulty: difficultyRef.current, tourType: tourTypeRef.current }), [])

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

  const interruptRouting = useCallback(() => {
    generationRef.current += 1
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const commitWaypoints = useCallback((nextValue: TourPlannerWaypoint[] | ((current: TourPlannerWaypoint[]) => TourPlannerWaypoint[])) => {
    if (!editPermissionRef.current) return
    const current = waypointsRef.current
    const next = normalizePlannerWaypoints(typeof nextValue === 'function' ? nextValue(current) : nextValue, tourTypeRef.current === 'kayak')
    if (sameWaypointSnapshot(current, next)) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const entry = snapshot()
    setHistory(previous => ({ past: [...previous.past, entry].slice(-HISTORY_LIMIT), future: [] }))
    waypointsRef.current = next
    setWaypoints(next)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting, snapshot])

  const setMaxHikingDifficulty = useCallback((value: TourMaxHikingDifficulty) => {
    if (!editPermissionRef.current) return
    if (value === difficultyRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const entry = snapshot()
    setHistory(current => ({ past: [...current.past, entry].slice(-HISTORY_LIMIT), future: [] }))
    difficultyRef.current = value
    setMaxHikingDifficultyState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting, snapshot])

  const addWaypoint = useCallback((lat: number, lng: number) => {
    if (!editPermissionRef.current) return
    const id = randomId()
    // A loop keeps returning to its start: the new point goes in before the way back.
    commitWaypoints(current => isClosedLoop(current)
      ? [...current.slice(0, -1), { id, lat, lng, role: 'via' }, current[current.length - 1]]
      : [...current, { id, lat, lng, role: 'end' }])
    setSelectedWaypointId(id)
  }, [commitWaypoints])

  /**
   * A fixed leg onto the end of the tour, as one step of the history: a
   * waypoint at the line's start that carries it, and one at its end.
   */
  const appendFixedLeg = useCallback((leg: TourFixedLeg) => {
    if (!editPermissionRef.current) return
    const first = leg.geometry[0]
    const last = leg.geometry[leg.geometry.length - 1]
    if (!first || !last) return
    const startId = randomId()
    const endId = randomId()
    commitWaypoints(current => [
      ...current,
      { id: startId, lat: Number(first[0]), lng: Number(first[1]), role: 'via', fixedLeg: leg },
      { id: endId, lat: Number(last[0]), lng: Number(last[1]), role: 'end' },
    ])
    setSelectedWaypointId(endId)
  }, [commitWaypoints])

  const setWaypointPosition = useCallback((id: string, lat: number, lng: number) => {
    if (!editPermissionRef.current || saveInFlightRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return false
    const current = waypointsRef.current.find(point => point.id === id)
    if (!current) return false
    if (current.lat === lat && current.lng === lng) return true
    const points = waypointsRef.current
    // In a loop the start and the way back are one spot: moving either moves both.
    const loopEnds = isClosedLoop(points) && (id === points[0].id || id === points[points.length - 1].id)
      ? new Set([points[0].id, points[points.length - 1].id])
      : new Set([id])
    commitWaypoints(list => list.map(point => loopEnds.has(point.id) ? { ...point, lat, lng } : point))
    return true
  }, [commitWaypoints])

  /** PR1-01: the tour taken back from its last point to its start, as one step. */
  const returnToStart = useCallback(() => {
    if (!editPermissionRef.current || saveInFlightRef.current) return
    commitWaypoints(current => closeLoop(current, randomId()))
  }, [commitWaypoints])

  /** PR1-02: the tour the other way round, as one step. */
  const reverse = useCallback(() => {
    if (!editPermissionRef.current || saveInFlightRef.current) return
    commitWaypoints(current => reverseRoute(current))
  }, [commitWaypoints])

  /** PAD-03/PAD-07: a paddler's change to the control points (a portage, a lock), as one step. */
  const editPaddlePoints = useCallback((change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
    if (!editPermissionRef.current || saveInFlightRef.current || tourTypeRef.current !== 'kayak') return
    commitWaypoints(change)
  }, [commitWaypoints])

  /** P2A-04: the leg after this waypoint drawn by hand, or routed again. */
  const toggleWaypointFreeLeg = useCallback((id: string) => {
    if (!editPermissionRef.current || saveInFlightRef.current || tourTypeRef.current === 'kayak') return
    commitWaypoints(current => toggleFreeLeg(current, id))
  }, [commitWaypoints])

  const removeWaypoint = useCallback((id: string) => {
    if (!editPermissionRef.current) return
    commitWaypoints(current => current.filter(point => point.id !== id))
    setSelectedWaypointId(current => current === id ? null : current)
  }, [commitWaypoints])

  const moveWaypoint = useCallback((id: string, direction: -1 | 1) => {
    commitWaypoints(current => {
      const index = current.findIndex(point => point.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [commitWaypoints])

  const reorderWaypoint = useCallback(
    (id: string, targetId: string, placement: 'before' | 'after') => {
      if (!editPermissionRef.current || saveInFlightRef.current || id === targetId) return;
      commitWaypoints((current) => {
        const fromIndex = current.findIndex((point) => point.id === id);
        const targetIndex = current.findIndex((point) => point.id === targetId);
        if (fromIndex < 0 || targetIndex < 0) return current;
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        const targetAfterRemoval = next.findIndex((point) => point.id === targetId);
        const insertIndex = targetAfterRemoval + (placement === 'after' ? 1 : 0);
        next.splice(insertIndex, 0, moved);
        return next;
      });
    },
    [commitWaypoints]
  );

  const undo = useCallback(() => {
    if (!editPermissionRef.current) return
    const previous = history.past[history.past.length - 1]
    if (!previous) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const present = snapshot()
    waypointsRef.current = previous.waypoints
    difficultyRef.current = previous.difficulty
    tourTypeRef.current = previous.tourType
    setWaypoints(previous.waypoints)
    setMaxHikingDifficultyState(previous.difficulty)
    setTourTypeState(previous.tourType)
    setSelectedWaypointId(id => previous.waypoints.some(point => point.id === id) ? id : previous.waypoints[0]?.id ?? null)
    setHistory({ past: history.past.slice(0, -1), future: [present, ...history.future].slice(0, HISTORY_LIMIT) })
    setHasUnsavedChanges(true)
    setStatus('dirty')
    setError(null)
  }, [history, invalidateDetailRequest, interruptRouting, snapshot])

  const redo = useCallback(() => {
    if (!editPermissionRef.current) return
    const next = history.future[0]
    if (!next) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const present = snapshot()
    waypointsRef.current = next.waypoints
    difficultyRef.current = next.difficulty
    tourTypeRef.current = next.tourType
    setWaypoints(next.waypoints)
    setMaxHikingDifficultyState(next.difficulty)
    setTourTypeState(next.tourType)
    setSelectedWaypointId(id => next.waypoints.some(point => point.id === id) ? id : next.waypoints[0]?.id ?? null)
    setHistory({ past: [...history.past, present].slice(-HISTORY_LIMIT), future: history.future.slice(1) })
    setHasUnsavedChanges(true)
    setStatus('dirty')
    setError(null)
  }, [history, invalidateDetailRequest, interruptRouting, snapshot])

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

  const paddle = usePaddleFields(restored?.paddle ?? NO_PADDLE_FIELDS, markEdited)
  const loadPaddle = paddle.load

  /**
   * PAD-01: hike or paddle tour, as one step of the history with the route,
   * since a paddle tour draws every leg by hand. Nothing is routed or put on
   * a day by the choice itself.
   */
  const setTourType = useCallback((value: PlannableTourType) => {
    if (!editPermissionRef.current || saveInFlightRef.current || value === tourTypeRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const entry = snapshot()
    setHistory(current => ({ past: [...current.past, entry].slice(-HISTORY_LIMIT), future: [] }))
    tourTypeRef.current = value
    setTourTypeState(value)
    const next = normalizePlannerWaypoints(waypointsRef.current, value === 'kayak')
    waypointsRef.current = next
    setWaypoints(next)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting, snapshot])

  const websiteInvalid = website.trim().length > 0 && !tourWebsiteSchema.safeParse(website).success
  const plannedDurationInvalid = plannedDurationMinutes !== null
    && (!Number.isInteger(plannedDurationMinutes) || plannedDurationMinutes < 0 || plannedDurationMinutes > MAX_PLANNED_TOUR_DURATION_MINUTES)
  const routeAnalysis = useMemo(
    () => analyzeRouteGeometry(JSON.stringify(enrichedGeometry ?? route)),
    [enrichedGeometry, route],
  )
  // The router's time only stands in until the route has its heights; from then on the
  // walking time is the signposts' rule over distance, climb and descent.
  const isPaddle = tourType === 'kayak'
  const paddleSpeedInvalid = paddle.speedKmh !== null && !paddleSpeedKmhSchema.safeParse(paddle.speedKmh).success
  const paddleIncomplete = isPaddle && (paddle.boatType === null || paddle.waterContext === null)
  // A paddle tour is timed on the water at its speed; a hike by the signposts' rule once the heights are in.
  const { effectiveSpeedKmh, portageSpeedKmh } = paddle
  const paddleEstimate = useMemo(() => isPaddle ? paddleEstimateOf(waypoints, { effectiveSpeedKmh, portageSpeedKmh }, paddleSpeedInvalid) : null,
    [effectiveSpeedKmh, isPaddle, paddleSpeedInvalid, portageSpeedKmh, waypoints])
  const walkingDurationMinutes = paddleEstimate
    ? paddleEstimate.waterMinutes === null ? null : paddleEstimate.estimateMinutes
    : routeAnalysis?.gain != null && routeAnalysis.loss != null
      ? hikingTimeMinutes(routeAnalysis.distanceKm, routeAnalysis.gain, routeAnalysis.loss)
      : durationSeconds === null ? null : Math.round(durationSeconds / 60)
  const automaticPlannedTotalMinutes = walkingDurationMinutes === null
    ? null
    : walkingDurationMinutes + (breakAdditionalMinutes ?? 0)
  const breakAdditionalInvalid = breakAdditionalMinutes !== null
    && (!Number.isInteger(breakAdditionalMinutes) || breakAdditionalMinutes < 0 || breakAdditionalMinutes > MAX_PLANNED_TOUR_DURATION_MINUTES)
  const plannedTotalMinutes = plannedDurationMinutes ?? automaticPlannedTotalMinutes
  // What the type adds to a save: a hike its routing limit, a paddle tour its boat, water and speed.
  const { boatType, waterContext, speedKmh } = paddle
  const typeFields = useMemo(() => tourType === 'kayak'
    ? { tour_type: tourType, max_hiking_difficulty: null, boat_type: boatType, water_context: waterContext, paddle_speed_kmh: speedKmh, portage_speed_kmh: portageSpeedKmh }
    : { tour_type: tourType, max_hiking_difficulty: maxHikingDifficulty, boat_type: null, water_context: null, paddle_speed_kmh: null, portage_speed_kmh: null },
  [boatType, maxHikingDifficulty, portageSpeedKmh, speedKmh, tourType, waterContext])
  // The router's own time stands in for a hike without heights; a paddle tour has only its speed.
  const savedDurationSeconds = walkingDurationMinutes === null ? (isPaddle ? null : durationSeconds) : walkingDurationMinutes * 60
  const plannedTotalInvalid = plannedDurationMinutes === null
    && automaticPlannedTotalMinutes !== null
    && automaticPlannedTotalMinutes > MAX_PLANNED_TOUR_DURATION_MINUTES

  const returnToNeutral = useCallback(() => {
    if (saveInFlightRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    contextGenerationRef.current += 1
    draftRevisionRef.current += 1
    setRouteProfileFocus(null)
    localStorage.removeItem(storageKey)
    setNameState('')
    setDescriptionState('')
    setWebsiteState('')
    setPlannedDurationMinutesState(null)
    setBreakAdditionalMinutesState(null)
    setWaypoints([])
    setMaxHikingDifficultyState(2)
    setTourTypeState('hike')
    loadPaddle(NO_PADDLE_FIELDS)
    waypointsRef.current = []
    difficultyRef.current = 2
    tourTypeRef.current = 'hike'
    setSelectedWaypointId(null)
    setHistory({ past: [], future: [] })
    setStatus('empty')
    setRoute(null)
    setRouteParts(null)
    setEnrichedGeometry(null)
    setRouteForKey(null)
    setDistanceMeters(null)
    setDurationSeconds(null)
    setError(null)
    setHasUnsavedChanges(false)
    setDraftRestored(false)
    setEditingPlaceId(null)
    editingPlaceIdRef.current = null
    setDerivedFromPlaceId(null)
    setOpeningTourId(null)
    setSaveOutcome(null)
    setReadOnlyGpxTour(null)
    setNewTourConfirmationOpen(false)
    setElevationProfileExpanded(true)
    setNewDraftGeneration(generation => generation + 1)
    setMapFocusKey(key => key + 1)
  }, [invalidateDetailRequest, interruptRouting, loadPaddle, storageKey])

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
    returnToNeutral()
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
        draft.points.map(({ lat, lng }) => ({ id: randomId(), lat, lng, role: 'via' as const })),
        type === 'kayak',
      )
      tourTypeRef.current = type
      setTourTypeState(type)
      if (draft.paddle) loadPaddle(draft.paddle)
      setNameState(draft.name)
      setDescriptionState(draft.description ?? '')
      setWebsiteState(draft.website ?? '')
      setWaypoints(points)
      waypointsRef.current = points
      setMaxHikingDifficultyState(draft.difficulty)
      difficultyRef.current = draft.difficulty
      setSelectedWaypointId(points[0].id)
      if (draft.inPlace) {
        setEditingPlaceId(draft.sourcePlaceId)
        editingPlaceIdRef.current = draft.sourcePlaceId
      } else {
        setDerivedFromPlaceId(draft.sourcePlaceId)
      }
      setStatus('dirty')
      setHasUnsavedChanges(true)
      return true
    },
    [loadPaddle, returnToNeutral])

  const cancelNewTour = useCallback(() => setNewTourConfirmationOpen(false), [])
  const toggleElevationProfile = useCallback(() => {
    if (elevationProfileExpanded) setRouteProfileFocus(null)
    setElevationProfileExpanded(expanded => !expanded)
  }, [elevationProfileExpanded])
  const discard = useCallback(() => returnToNeutral(), [returnToNeutral])

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

  const openTour = useCallback(async (tour: TourListItem) => {
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
    setRouteProfileFocus(null)
    setOpeningTourId(tour.place_id)
    setError(null)
    try {
      const result = await tourRepo.detail(tripId, tour.place_id, controller.signal)
      if (!requestIsCurrent() || saveInFlightRef.current) return false
      if (result.waypoints.length < 2) {
        setError('open')
        return false
      }

      interruptRouting()
      const openedType: PlannableTourType = result.tour.tour_type === 'kayak' ? 'kayak' : 'hike'
      const nextWaypoints = normalizePlannerWaypoints(result.waypoints.map(point => ({
        id: randomId(),
        lat: point.lat,
        lng: point.lng,
        role: point.role,
        ...(point.fixed_leg ? { fixedLeg: point.fixed_leg } : {}),
        ...(point.lock ? { lock: point.lock } : {}),
      })), openedType === 'kayak')
      localStorage.removeItem(storageKey)
      contextGenerationRef.current += 1
      draftRevisionRef.current += 1
      setNameState(result.tour.name)
      setDescriptionState(result.tour.description ?? '')
      setWebsiteState(result.tour.website ?? '')
      setPlannedDurationMinutesState(result.tour.planned_duration_minutes ?? null)
      setBreakAdditionalMinutesState(result.tour.break_additional_minutes ?? null)
      setWaypoints(nextWaypoints)
      setMaxHikingDifficultyState(result.tour.max_hiking_difficulty ?? 2)
      setTourTypeState(openedType)
      loadPaddle(paddleFieldsOf(result.tour))
      waypointsRef.current = nextWaypoints
      difficultyRef.current = result.tour.max_hiking_difficulty ?? 2
      tourTypeRef.current = openedType
      setSelectedWaypointId(nextWaypoints[0]?.id ?? null)
      setHistory({ past: [], future: [] })
      setStatus('dirty')
      setRoute(null)
      setRouteParts(null)
      setEnrichedGeometry(null)
      setRouteForKey(null)
      setDistanceMeters(null)
      setDurationSeconds(null)
      setHasUnsavedChanges(false)
      setDraftRestored(false)
      setEditingPlaceId(result.tour.place_id)
      editingPlaceIdRef.current = result.tour.place_id
      setMapFocusKey(key => key + 1)
      setSaveOutcome(null)
      setReadOnlyGpxTour(null)
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
  }, [interruptRouting, loadPaddle, storageKey, tripId])

  const retry = useCallback(() => {
    if (waypointsRef.current.length < 2) return
    interruptRouting()
    setError(null)
    setStatus('dirty')
    setRetryToken(value => value + 1)
  }, [interruptRouting])

  const waypointKey = useMemo(() => tourWaypointKey(waypoints), [waypoints])
  const readOnlyGpxAnalysis = useMemo(
    () => analyzeRouteGeometry(readOnlyGpxTour?.routeGeometry),
    [readOnlyGpxTour?.routeGeometry],
  )
  const mode = useMemo(() => selectTourPlannerMode({ readOnlyGpxTour, editingPlaceId, hasUnsavedChanges }), [editingPlaceId, hasUnsavedChanges, readOnlyGpxTour])
  const focusOwner = mode.type === 'view-gpx' || mode.type === 'edit-saved' ? `${mode.type}:${mode.placeId}` : mode.type
  useEffect(() => { setRouteProfileFocus(null) }, [focusOwner, routeAnalysis, readOnlyGpxAnalysis, readOnlyGpxTour])

  useEffect(() => {
    if (waypoints.length < 2) {
      interruptRouting()
      setStatus(waypoints.length === 0 ? 'empty' : 'dirty')
      setRoute(null)
      setRouteParts(null)
      setRouteForKey(null)
      setEnrichedGeometry(null)
      setDistanceMeters(null)
      setDurationSeconds(null)
      setRouteProfileFocus(null)
      setError(null)
      return
    }

    const generation = ++generationRef.current
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller
    const timer = window.setTimeout(async () => {
      setStatus('routing')
      const routed = await routeWalkingTour(waypoints, controller.signal, maxHikingDifficulty)
      if (controller.signal.aborted || generation !== generationRef.current) return
      if (!routed) {
        setStatus('routing-failed')
        setError('routing')
        return
      }

      setRoute(routed.coordinates)
      setRouteParts(routed.parts)
      setDistanceMeters(routed.distanceMeters)
      setDurationSeconds(routed.durationSeconds)
      setRouteForKey(waypointKey)
      setEnrichedGeometry(null)
      setStatus('enriching-elevation')

      const enriched = await enrichTourElevations(routed.coordinates, controller.signal)
      if (controller.signal.aborted || generation !== generationRef.current) return
      if (!enriched) {
        setStatus('elevation-failed')
        setError('elevation')
        return
      }
      setEnrichedGeometry(enriched)
      if (!hasCompleteElevation(enriched)) {
        setStatus('elevation-failed')
        setError('elevation')
        return
      }
      setStatus('ready')
      setError(null)
    }, ROUTE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [interruptRouting, maxHikingDifficulty, retryToken, waypointKey, waypoints])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const draft: DraftPayload = { version: 8, name, description, website, plannedDurationMinutes, breakAdditionalMinutes, waypoints, maxHikingDifficulty, editingPlaceId,
      derivedFromPlaceId, tourType,
      paddle: { boatType: paddle.boatType, waterContext: paddle.waterContext, speedKmh: paddle.speedKmh, portageSpeedKmh: paddle.portageSpeedKmh },
    }
    localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [breakAdditionalMinutes,
    derivedFromPlaceId, description, editingPlaceId, hasUnsavedChanges, maxHikingDifficulty, name, plannedDurationMinutes, storageKey, waypoints, website,
    tourType, paddle.boatType, paddle.waterContext, paddle.speedKmh, paddle.portageSpeedKmh])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const canSave = canEdit && !isSaving && hasUnsavedChanges && name.trim().length > 0 && status === 'ready'
    && routeForKey === waypointKey && hasCompleteElevation(enrichedGeometry)
    && description.length <= 2000 && !websiteInvalid && !plannedDurationInvalid && !breakAdditionalInvalid && !plannedTotalInvalid
    && !paddleIncomplete && !(isPaddle && paddleSpeedInvalid)

  const save = useCallback(async () => {
    if (!mountedRef.current || saveInFlightRef.current || !editPermissionRef.current || !canSave || !hasCompleteElevation(enrichedGeometry)) return null
    if (editingPlaceId !== null && deletedTourPlaceIdsRef.current.has(editingPlaceId)) return null
    invalidateDetailRequest()
    saveInFlightRef.current = true
    const requestId = ++saveRequestIdRef.current
    const submittedRevision = draftRevisionRef.current
    const submittedContextGeneration = contextGenerationRef.current
    const submittedTripId = String(tripId)
    const submittedPlaceId = editingPlaceId
    const payload = {
      name: name.trim(),
      description: trimmedOrNull(description),
      website: parsedWebsiteOrNull(website),
      ...typeFields,
      route_geometry: enrichedGeometry.map(point => [point[0], point[1], point[2]]),
      waypoints: waypoints.map((point, sequence) => ({
        lat: point.lat,
        lng: point.lng,
        role: point.role,
        sequence,
        ...(point.fixedLeg ? { fixed_leg: point.fixedLeg } : {}),
        ...(point.lock ? { lock: point.lock } : {}),
      })),
      duration_seconds: savedDurationSeconds,
      planned_duration_minutes: plannedDurationMinutes,
      break_additional_minutes: breakAdditionalMinutes,
      ...derivedFromField(submittedPlaceId, derivedFromPlaceId),
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
      const result = submittedPlaceId === null
        ? await tourRepo.create(tripId, payload)
        : await tourRepo.update(tripId, submittedPlaceId, payload)
      if (stillCurrent()) {
        localStorage.removeItem(storageKey)
        setHasUnsavedChanges(false)
        setStatus('saved')
        setHistory({ past: [], future: [] })
        setEditingPlaceId(result.tour.place_id)
        editingPlaceIdRef.current = result.tour.place_id
        setSaveOutcome(result.tour)
      }
      if (mountedRef.current && String(tripIdRef.current) === submittedTripId && !deletedTourPlaceIdsRef.current.has(result.tour.place_id)) {
        try { await onSaved?.(result) } catch { return result }
      }
      return result
    } catch {
      if (stillCurrent()) {
        setStatus('ready')
        setError('save')
      }
      return null
    } finally {
      if (mountedRef.current && requestId === saveRequestIdRef.current) {
        saveInFlightRef.current = false
        setIsSaving(false)
      }
    }
  }, [breakAdditionalMinutes, canSave,
    derivedFromPlaceId,
    description, savedDurationSeconds, editingPlaceId, enrichedGeometry, invalidateDetailRequest, name, onSaved, plannedDurationMinutes, storageKey, tripId, typeFields, waypoints, website])

  return {
    canEdit, canAssign,
    name, setName, maxHikingDifficulty, setMaxHikingDifficulty,
    tourType, setTourType, isPaddle, paddle, paddleSpeedInvalid, paddleIncomplete,
    description, setDescription, website, setWebsite, websiteInvalid,
    plannedDurationMinutes, setPlannedDurationMinutes, plannedDurationInvalid,
    breakAdditionalMinutes, setBreakAdditionalMinutes, breakAdditionalInvalid,
    walkingDurationMinutes, plannedTotalMinutes, plannedTotalInvalid,
    waypoints, selectedWaypointId, setSelectedWaypointId,
    addWaypoint, appendFixedLeg, setWaypointPosition, removeWaypoint, moveWaypoint, reorderWaypoint,
    reverse, returnToStart, isLoop: isClosedLoop(waypoints), toggleWaypointFreeLeg, editPaddlePoints, paddleEstimate,
    undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    status, error, retry, isSaving,
    route, routeParts, enrichedGeometry, routeAnalysis, distanceMeters, durationSeconds,
    routeProfileFocus, setRouteProfileFocus,
    ...mapView,
    mode, readOnlyGpxTour, readOnlyGpxAnalysis, viewGpxTour, closeGpxTour,
    startNewTour,
    startDerivedTour,
    derivedFromPlaceId,
    newTourConfirmationOpen, cancelNewTour, forgetDeletedTour,
    elevationProfileExpanded, toggleElevationProfile, newDraftGeneration, draftRestored, mapFocusKey,
    editingPlaceId, openingTourId, openTour,
    saveOutcome, hasUnsavedChanges, canSave, save, discard, returnToNeutral,
  }
}

export type TourPlannerController = ReturnType<typeof useTourPlanner>
