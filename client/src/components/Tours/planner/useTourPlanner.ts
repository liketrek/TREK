import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MAX_PLANNED_TOUR_DURATION_MINUTES, tourWebsiteSchema, type TourCreateResponse, type TourListItem, type TourWaypointRole, type TourMaxHikingDifficulty } from '@trek/shared'
import { tourRepo } from '../../../repo/tourRepo'
import { randomId } from '../../../utils/randomId'
import type { TourBaseLayer } from '../../Map/MapLayerSwitcher'
import { analyzeRouteGeometry, type RouteProfileFocus } from '../../../utils/routeGeometry'
import { enrichTourElevations, routeWalkingTour, type TourElevationPoint } from './tourRouting'
import { useTourPermissions, type TourPermissionProps } from '../useTourPermissions'

export interface TourPlannerWaypoint {
  id: string
  lat: number
  lng: number
  role: TourWaypointRole
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

interface DraftPayload {
  version: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  description?: string
  website?: string
  plannedDurationMinutes?: number | null
  breakAdditionalMinutes?: number | null
  waypoints: TourPlannerWaypoint[]
  maxHikingDifficulty?: TourMaxHikingDifficulty
  editingPlaceId?: number | null
}

interface HistoryState {
  past: Array<{ waypoints: TourPlannerWaypoint[]; difficulty: TourMaxHikingDifficulty }>
  future: Array<{ waypoints: TourPlannerWaypoint[]; difficulty: TourMaxHikingDifficulty }>
}

const ROUTE_DEBOUNCE_MS = 450
const HISTORY_LIMIT = 30

function hasCompleteElevation(points: TourElevationPoint[] | null): points is [number, number, number][] {
  return !!points && points.every(point => point.length === 3 && Number.isFinite(point[2]))
}

export function normalizePlannerWaypoints(points: TourPlannerWaypoint[]): TourPlannerWaypoint[] {
  return points.map((point, index) => ({
    ...point,
    role: index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'via',
  }))
}

export function tourWaypointKey(points: TourPlannerWaypoint[]): string {
  return points.map(point => `${point.id}:${point.lat.toFixed(7)}:${point.lng.toFixed(7)}`).join('|')
}

function sameWaypointSnapshot(a: TourPlannerWaypoint[], b: TourPlannerWaypoint[]): boolean {
  return tourWaypointKey(a) === tourWaypointKey(b)
}

function validDraft(value: unknown): value is DraftPayload {
  if (!value || typeof value !== 'object') return false
  const draft = value as Partial<DraftPayload>
  return (draft.version === 1 || draft.version === 2 || draft.version === 3 || draft.version === 4 || draft.version === 5 || draft.version === 6) && typeof draft.name === 'string'
    && (draft.description === undefined || typeof draft.description === 'string')
    && (draft.website === undefined || typeof draft.website === 'string')
    && (draft.plannedDurationMinutes === undefined || draft.plannedDurationMinutes === null
      || (Number.isInteger(draft.plannedDurationMinutes) && draft.plannedDurationMinutes >= 0 && draft.plannedDurationMinutes <= MAX_PLANNED_TOUR_DURATION_MINUTES))
    && (draft.breakAdditionalMinutes === undefined || draft.breakAdditionalMinutes === null
      || (Number.isInteger(draft.breakAdditionalMinutes) && draft.breakAdditionalMinutes >= 0 && draft.breakAdditionalMinutes <= MAX_PLANNED_TOUR_DURATION_MINUTES))
    && (draft.editingPlaceId == null || (Number.isInteger(draft.editingPlaceId) && draft.editingPlaceId > 0))
    && (draft.maxHikingDifficulty == null || (Number.isInteger(draft.maxHikingDifficulty) && draft.maxHikingDifficulty >= 1 && draft.maxHikingDifficulty <= 6))
    && Array.isArray(draft.waypoints)
    && draft.waypoints.every(point => point && typeof point.id === 'string'
      && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
      && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180)
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
      return validDraft(parsed) ? { ...parsed, waypoints: normalizePlannerWaypoints(parsed.waypoints) } : null
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
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(restored?.waypoints[0]?.id ?? null)
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] })
  const [status, setStatus] = useState<TourPlannerStatus>(restored?.waypoints.length ? 'dirty' : 'empty')
  const [route, setRoute] = useState<[number, number][] | null>(null)
  const [enrichedGeometry, setEnrichedGeometry] = useState<TourElevationPoint[] | null>(null)
  const [routeForKey, setRouteForKey] = useState<string | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(Boolean(restored))
  const [isSaving, setIsSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(Boolean(restored))
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(restored?.editingPlaceId ?? null)
  const [openingTourId, setOpeningTourId] = useState<number | null>(null)
  const [saveOutcome, setSaveOutcome] = useState<TourListItem | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [mapBaseLayer, setMapBaseLayer] = useState<TourBaseLayer>('default')
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
  waypointsRef.current = waypoints
  difficultyRef.current = maxHikingDifficulty

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
    const next = normalizePlannerWaypoints(typeof nextValue === 'function' ? nextValue(current) : nextValue)
    if (sameWaypointSnapshot(current, next)) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    setHistory(previous => ({ past: [...previous.past, { waypoints: current, difficulty: difficultyRef.current }].slice(-HISTORY_LIMIT), future: [] }))
    waypointsRef.current = next
    setWaypoints(next)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting])

  const setMaxHikingDifficulty = useCallback((value: TourMaxHikingDifficulty) => {
    if (!editPermissionRef.current) return
    if (value === difficultyRef.current) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    setHistory(current => ({
      past: [...current.past, { waypoints: waypointsRef.current, difficulty: difficultyRef.current }].slice(-HISTORY_LIMIT),
      future: [],
    }))
    difficultyRef.current = value
    setMaxHikingDifficultyState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    setStatus('dirty')
    setError(null)
  }, [invalidateDetailRequest, interruptRouting])

  const addWaypoint = useCallback((lat: number, lng: number) => {
    if (!editPermissionRef.current) return
    const id = randomId()
    commitWaypoints(current => [...current, { id, lat, lng, role: 'end' }])
    setSelectedWaypointId(id)
  }, [commitWaypoints])

  const setWaypointPosition = useCallback((id: string, lat: number, lng: number) => {
    if (!editPermissionRef.current || saveInFlightRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return false
    const current = waypointsRef.current.find(point => point.id === id)
    if (!current) return false
    if (current.lat === lat && current.lng === lng) return true
    commitWaypoints(points => points.map(point => point.id === id ? { ...point, lat, lng } : point))
    return true
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
    const present = { waypoints: waypointsRef.current, difficulty: difficultyRef.current }
    waypointsRef.current = previous.waypoints
    difficultyRef.current = previous.difficulty
    setWaypoints(previous.waypoints)
    setMaxHikingDifficultyState(previous.difficulty)
    setSelectedWaypointId(id => previous.waypoints.some(point => point.id === id) ? id : previous.waypoints[0]?.id ?? null)
    setHistory({ past: history.past.slice(0, -1), future: [present, ...history.future].slice(0, HISTORY_LIMIT) })
    setHasUnsavedChanges(true)
    setStatus('dirty')
    setError(null)
  }, [history, invalidateDetailRequest, interruptRouting])

  const redo = useCallback(() => {
    if (!editPermissionRef.current) return
    const next = history.future[0]
    if (!next) return
    invalidateDetailRequest()
    interruptRouting()
    draftRevisionRef.current += 1
    const present = { waypoints: waypointsRef.current, difficulty: difficultyRef.current }
    waypointsRef.current = next.waypoints
    difficultyRef.current = next.difficulty
    setWaypoints(next.waypoints)
    setMaxHikingDifficultyState(next.difficulty)
    setSelectedWaypointId(id => next.waypoints.some(point => point.id === id) ? id : next.waypoints[0]?.id ?? null)
    setHistory({ past: [...history.past, present].slice(-HISTORY_LIMIT), future: history.future.slice(1) })
    setHasUnsavedChanges(true)
    setStatus('dirty')
    setError(null)
  }, [history, invalidateDetailRequest, interruptRouting])

  const setName = useCallback((value: string) => {
    if (!editPermissionRef.current) return
    if (value === name) return
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setNameState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    if (status === 'saved' || status === 'saving') setStatus(waypointsRef.current.length < 2 ? 'dirty' : 'ready')
  }, [invalidateDetailRequest, name, status])

  const setDescription = useCallback((value: string) => {
    if (!editPermissionRef.current || value === description) return
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setDescriptionState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    if (status === 'saved' || status === 'saving') setStatus(waypointsRef.current.length < 2 ? 'dirty' : 'ready')
  }, [description, invalidateDetailRequest, status])

  const setWebsite = useCallback((value: string) => {
    if (!editPermissionRef.current || value === website) return
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setWebsiteState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    if (status === 'saved' || status === 'saving') setStatus(waypointsRef.current.length < 2 ? 'dirty' : 'ready')
  }, [invalidateDetailRequest, status, website])

  const setPlannedDurationMinutes = useCallback((value: number | null) => {
    if (!editPermissionRef.current || value === plannedDurationMinutes) return
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setPlannedDurationMinutesState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    if (status === 'saved' || status === 'saving') setStatus(waypointsRef.current.length < 2 ? 'dirty' : 'ready')
  }, [invalidateDetailRequest, plannedDurationMinutes, status])

  const setBreakAdditionalMinutes = useCallback((value: number | null) => {
    if (!editPermissionRef.current || value === breakAdditionalMinutes) return
    invalidateDetailRequest()
    draftRevisionRef.current += 1
    setBreakAdditionalMinutesState(value)
    setHasUnsavedChanges(true)
    setSaveOutcome(null)
    if (status === 'saved' || status === 'saving') setStatus(waypointsRef.current.length < 2 ? 'dirty' : 'ready')
  }, [breakAdditionalMinutes, invalidateDetailRequest, status])

  const websiteInvalid = website.trim().length > 0 && !tourWebsiteSchema.safeParse(website).success
  const plannedDurationInvalid = plannedDurationMinutes !== null
    && (!Number.isInteger(plannedDurationMinutes) || plannedDurationMinutes < 0 || plannedDurationMinutes > MAX_PLANNED_TOUR_DURATION_MINUTES)
  const walkingDurationMinutes = durationSeconds === null ? null : Math.round(durationSeconds / 60)
  const automaticPlannedTotalMinutes = walkingDurationMinutes === null
    ? null
    : walkingDurationMinutes + (breakAdditionalMinutes ?? 0)
  const breakAdditionalInvalid = breakAdditionalMinutes !== null
    && (!Number.isInteger(breakAdditionalMinutes) || breakAdditionalMinutes < 0 || breakAdditionalMinutes > MAX_PLANNED_TOUR_DURATION_MINUTES)
  const plannedTotalMinutes = plannedDurationMinutes ?? automaticPlannedTotalMinutes
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
    waypointsRef.current = []
    difficultyRef.current = 2
    setSelectedWaypointId(null)
    setHistory({ past: [], future: [] })
    setStatus('empty')
    setRoute(null)
    setEnrichedGeometry(null)
    setRouteForKey(null)
    setDistanceMeters(null)
    setDurationSeconds(null)
    setError(null)
    setHasUnsavedChanges(false)
    setDraftRestored(false)
    setEditingPlaceId(null)
    editingPlaceIdRef.current = null
    setOpeningTourId(null)
    setSaveOutcome(null)
    setReadOnlyGpxTour(null)
    setNewTourConfirmationOpen(false)
    setElevationProfileExpanded(true)
    setNewDraftGeneration(generation => generation + 1)
    setMapFocusKey(key => key + 1)
  }, [invalidateDetailRequest, interruptRouting, storageKey])

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
  }, [editingPlaceId, hasUnsavedChanges, name, returnToNeutral, waypoints.length])

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
      const nextWaypoints = normalizePlannerWaypoints(result.waypoints.map(point => ({
        id: randomId(),
        lat: point.lat,
        lng: point.lng,
        role: point.role,
      })))
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
      waypointsRef.current = nextWaypoints
      difficultyRef.current = result.tour.max_hiking_difficulty ?? 2
      setSelectedWaypointId(nextWaypoints[0]?.id ?? null)
      setHistory({ past: [], future: [] })
      setStatus('dirty')
      setRoute(null)
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
  }, [interruptRouting, storageKey, tripId])

  const retry = useCallback(() => {
    if (waypointsRef.current.length < 2) return
    interruptRouting()
    setError(null)
    setStatus('dirty')
    setRetryToken(value => value + 1)
  }, [interruptRouting])

  const waypointKey = useMemo(() => tourWaypointKey(waypoints), [waypoints])
  const routeAnalysis = useMemo(
    () => analyzeRouteGeometry(JSON.stringify(enrichedGeometry ?? route)),
    [enrichedGeometry, route],
  )
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
    const draft: DraftPayload = { version: 6, name, description, website, plannedDurationMinutes, breakAdditionalMinutes, waypoints, maxHikingDifficulty, editingPlaceId }
    localStorage.setItem(storageKey, JSON.stringify(draft))
  }, [breakAdditionalMinutes, description, editingPlaceId, hasUnsavedChanges, maxHikingDifficulty, name, plannedDurationMinutes, storageKey, waypoints, website])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  const canSave = canEdit && !isSaving && hasUnsavedChanges && name.trim().length > 0 && status === 'ready'
    && routeForKey === waypointKey && hasCompleteElevation(enrichedGeometry)
    && description.length <= 2000 && !websiteInvalid && !plannedDurationInvalid && !breakAdditionalInvalid && !plannedTotalInvalid

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
      description: description.trim() || null,
      website: website.trim() ? tourWebsiteSchema.parse(website) : null,
      tour_type: 'hike',
      route_geometry: enrichedGeometry.map(point => [point[0], point[1], point[2]]),
      waypoints: waypoints.map((point, sequence) => ({
        lat: point.lat,
        lng: point.lng,
        role: point.role,
        sequence,
      })),
      max_hiking_difficulty: maxHikingDifficulty,
      duration_seconds: durationSeconds,
      planned_duration_minutes: plannedDurationMinutes,
      break_additional_minutes: breakAdditionalMinutes,
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
  }, [breakAdditionalMinutes, canSave, description, durationSeconds, editingPlaceId, enrichedGeometry, invalidateDetailRequest, maxHikingDifficulty, name, onSaved, plannedDurationMinutes, storageKey, tripId, waypoints, website])

  return {
    canEdit, canAssign,
    name, setName, maxHikingDifficulty, setMaxHikingDifficulty,
    description, setDescription, website, setWebsite, websiteInvalid,
    plannedDurationMinutes, setPlannedDurationMinutes, plannedDurationInvalid,
    breakAdditionalMinutes, setBreakAdditionalMinutes, breakAdditionalInvalid,
    walkingDurationMinutes, plannedTotalMinutes, plannedTotalInvalid,
    waypoints, selectedWaypointId, setSelectedWaypointId,
    addWaypoint, setWaypointPosition, removeWaypoint, moveWaypoint, reorderWaypoint,
    undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    status, error, retry, isSaving,
    route, enrichedGeometry, routeAnalysis, distanceMeters, durationSeconds,
    routeProfileFocus, setRouteProfileFocus,
    mapBaseLayer, setMapBaseLayer,
    mode, readOnlyGpxTour, readOnlyGpxAnalysis, viewGpxTour, closeGpxTour,
    startNewTour, newTourConfirmationOpen, cancelNewTour, forgetDeletedTour,
    elevationProfileExpanded, toggleElevationProfile, newDraftGeneration, draftRestored, mapFocusKey,
    editingPlaceId, openingTourId, openTour,
    saveOutcome, hasUnsavedChanges, canSave, save, discard, returnToNeutral,
  }
}

export type TourPlannerController = ReturnType<typeof useTourPlanner>
