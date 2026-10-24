import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePoiExplore, type Bbox } from '../../components/Map/usePoiExplore'
import { placeActions } from '../../components/Planner/usePlaceActions'
import { tourRouteStyle } from '../../components/Tours/planner/tourRouteStyle'
import { usePaddlePaint } from '../../components/Tours/paddle/paddlePaint'
import { useWalkRoutePaint } from '../../components/Tours/walk/walkRoutePaint'
import { useTrackPortageParts } from '../../components/Tours/paddle/useTrackPortageParts'
import { usePaddleObstacleSync } from '../../components/Tours/paddle/usePaddleObstacleSync'
import { tourPlannedTimes as projectTourPlannedTimes } from '../../components/Tours/tourPresentation'
import { usePlanMapViewport } from '../../hooks/usePlanMapViewport'
import { usePaddleObstacleStore } from '../../store/paddleObstacleStore'
import { useHighlightedRoute } from '../../components/Tours/bike/useHighlightedRoute'
import { useLegVariantLines } from '../../components/Tours/planner/legVariantPaint'
import { useAssistantEntityLinks } from './useAssistantEntityLinks'
import { useMapLocationSearch } from './useMapLocationSearch'
import { usePlannerFocusPoints } from './usePlannerFocusPoints'
import { useTripPlanner } from './useTripPlanner'
import { useTourWorkspace } from './useTourWorkspace'
import { mapFocusKeyOf, offeredWaysOf, paddleLineOf } from './tourMapFocus'
import { placeFormContext } from './placeFormContext'

export function useTripPlannerPage() {
  const planner = useTripPlanner()
  const {
    activeTab,
    can, places,
    setSelectedPlaceId,
    t,
    toast,
    tours,
    trip,
    tripActions,
    tripId } = planner

  const canPlaceEdit = can('place_edit', trip)
  const canDayEdit = can('day_edit', trip)
  const workspace = useTourWorkspace(planner, canPlaceEdit, canDayEdit)
  const { tourPlanner, viewImportedTour, tourGpxImport, wandererBrowser, tourConversion, recordedTrack, trackPaddlePlan, paddleChecklist, skiClassification, tourDetailActions } =
    workspace
  // What the chat opens in another tab of this trip, and in each part's own tab.
  useAssistantEntityLinks({ planner, workspace })

  const tourDetailOpenerRef = useRef<{ placeId: number; element: HTMLElement } | null>(null)
  const { focusPoints, lastPlanMapViewportRef } = usePlannerFocusPoints(activeTab, places, tourPlanner, wandererBrowser)

  // PAD-06: an obstacle or area the paddle checklist asks for moves the camera as a picked search result does.
  const paddleFocus = usePaddleObstacleStore(state => state.focus)
  const { mapFocusPoints, mapFocusKey, locationSearch } = useMapLocationSearch(tourPlanner.mapFocusKey, focusPoints, paddleFocus)

  const trackParts = useTrackPortageParts(tourPlanner)
  // PAD-05B: the obstacles around the paddle tour in view, for the map and the rails alike.
  usePaddleObstacleSync(paddleLineOf(tourPlanner), activeTab === 'tour-planner')
  const route = useMemo<[number, number][][] | null>(() => {
    if (wandererBrowser.open) return wandererBrowser.line ? [wandererBrowser.line] : null
    if (tourPlanner.mode.type === 'view-gpx') {
      const coordinates = tourPlanner.readOnlyGpxAnalysis?.routeCoordinates
      if (!coordinates?.length) return null
      // While an editable version is previewed, the import (dashed) and the suggestion side by side.
      if (tourConversion.line) return [coordinates, tourConversion.line]
      // A paddle track with portages marked on it: the carried stretches as their own lines.
      return trackParts ? trackParts.map(part => part.coordinates) : [coordinates]
    }
    if (tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved') {
      // Routed and hand-drawn stretches as their own lines, so the map can tell them apart.
      if (tourPlanner.routeParts?.length) return tourPlanner.routeParts.map(part => part.coordinates)
      return tourPlanner.route ? [tourPlanner.route] : null
    }
    return null
  }, [
    wandererBrowser.open,
    wandererBrowser.line,
    tourPlanner.mode.type, tourPlanner.readOnlyGpxAnalysis?.routeCoordinates, tourPlanner.route, tourPlanner.routeParts,
    tourConversion.line, trackParts,
  ])
  const editingRoute = tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved'
  // What no router planned is dotted; a paddle tour's portages brown, whitewater amber, gaps red, a walk's ferry blue.
  const paddlePaint = usePaddlePaint()
  const walkPaint = useWalkRoutePaint()
  // CW-12: a walk kept from before a leg no way joins no longer stands for its stations: greyed, not hidden.
  const staleRoute = editingRoute && !tourPlanner.routeCurrent && tourPlanner.error === 'walk-gap'
  const partStyle = tourRouteStyle(
    !wandererBrowser.open && editingRoute ? tourPlanner.routeParts : !tourConversion.line ? trackParts : null,
    tourPlanner.isPaddle || !!trackParts,
    { portage: paddlePaint.portage, rapids: paddlePaint.rapids, gap: paddlePaint.gap, casing: paddlePaint.disc, ...walkPaint },
    staleRoute,
  )
  const routeWalking = partStyle.walking ?? (route && route.length === 2 && tourConversion.line ? [true, false] : null)
  // BIK-01 to BIK-05 and MAP-03: the stretches a tour's card points at, over the tour's own line,
  // the one being edited or an import being viewed, never over a preview beside it.
  const ownLine = editingRoute || (tourPlanner.mode.type === 'view-gpx' && !tourConversion.line)
  const highlighted = useHighlightedRoute(ownLine && !wandererBrowser.open, route, routeWalking, partStyle.colors)
  // RTE-02, RTE-03: the ways of a section being compared, or the round hikes offered, over the route being edited.
  const offered = offeredWaysOf(tourPlanner, editingRoute && !wandererBrowser.open)
  const drawn = useLegVariantLines(highlighted.route, highlighted.walking, highlighted.colors, offered.ways, offered.focus)

  const { closeGpxTour } = tourPlanner
  useEffect(() => {
    if (activeTab !== 'tour-planner') closeGpxTour()
  }, [activeTab, closeGpxTour])

  const poi = usePoiExplore()
  const poiViewportChangeRef = useRef(poi.onViewportChange)
  poiViewportChangeRef.current = poi.onViewportChange
  // The place search looks where the plan map looks, and only while it is on screen.
  const reportViewport = usePlanMapViewport(tripId, activeTab === 'plan')
  const captureViewport = useCallback((bounds: Bbox) => {
    lastPlanMapViewportRef.current = bounds
    poiViewportChangeRef.current(bounds)
    reportViewport(bounds)
  }, [lastPlanMapViewportRef, reportViewport])

  // The place form closes with everything it was opened with cleared.
  const { setShowPlaceForm, setEditingPlace, setEditingAssignmentId, setPrefillCoords, setServiceStopForm } = planner
  const closePlaceForm = () => {
    setShowPlaceForm(false)
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPrefillCoords(null)
    setServiceStopForm(false)
  }

  // Each tour's planned times keyed by its place, for the day plan's tour rows.
  const plannedTourDurations = new Map(tours.map(tour => [tour.place_id, { ...projectTourPlannedTimes(tour), tour }] as const))

  const onSelectTour = (tour: (typeof tours)[number] | null, opener?: HTMLElement) => {
    tourDetailOpenerRef.current = tour && opener ? { placeId: tour.place_id, element: opener } : null
    setSelectedPlaceId(tour?.place_id ?? null)
  }

  return {
    planner,
    poi,
    // The place inspector's writes, the same ones the phone's place sheet makes.
    placeActions: placeActions({ tripId, tripActions, toast, t }),
    permissions: { canPlaceEdit, canDayEdit },
    tourPlanner,
    tourGpxImport,
    wandererBrowser,
    viewImportedTour,
    tourDetails: { openerRef: tourDetailOpenerRef, onSelectTour },
    tourConversion,
    recordedTrack,
    trackPaddlePlan,
    paddleChecklist,
    skiClassification,
    // The Tours rail's Trip places picker leaves the trip's tours out of the stops it offers.
    tourPlaceIds: planner.tourPlaceIds,
    tourDetailActions,
    tourMap: { route: drawn.route,
      routeWalking: drawn.walking,
      routeColors: drawn.colors,
      variantLines: drawn.overlays,
      previewPoints: tourConversion.status === 'idle' ? null : tourConversion.points,
      focusPoints: offered.frame?.points ?? mapFocusPoints,
      focusKey: mapFocusKeyOf(wandererBrowser, offered.frame, mapFocusKey),
      captureViewport,
    },
    locationSearch,
    // The day plan's tours: which places are tours, their planned times and where their stages run (MDT-02).
    dayPlanTours: { tourPlaceIds: planner.tourPlaceIds, plannedTourDurations, tourStageStops: planner.tourStageStops },
    placeForm: { close: closePlaceForm, ...placeFormContext(planner.editingPlace, planner.assignments, tours) },
  }
}