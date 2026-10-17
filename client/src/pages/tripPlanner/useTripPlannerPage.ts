import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePoiExplore, type Bbox } from '../../components/Map/usePoiExplore'
import { placeActions } from '../../components/Planner/usePlaceActions'
import { tourRouteStyle } from '../../components/Tours/planner/tourRouteStyle'
import { usePaddlePaint } from '../../components/Tours/paddle/paddlePaint'
import { useTrackPortageParts } from '../../components/Tours/paddle/useTrackPortageParts'
import { usePaddleObstacleSync } from '../../components/Tours/paddle/usePaddleObstacleSync'
import { tourPlannedTimes as projectTourPlannedTimes } from '../../components/Tours/tourPresentation'
import { usePlanMapViewport } from '../../hooks/usePlanMapViewport'
import { usePaddleObstacleStore } from '../../store/paddleObstacleStore'
import { useMapLocationSearch } from './useMapLocationSearch'
import { usePlannerFocusPoints } from './usePlannerFocusPoints'
import { useTripPlanner } from './useTripPlanner'
import { useTourWorkspace } from './useTourWorkspace'

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
  const { tourPlanner, viewImportedTour, tourGpxImport, wandererBrowser, tourConversion, recordedTrack, trackPaddlePlan, paddleChecklist, tourDetailActions } =
    useTourWorkspace(planner, canPlaceEdit, canDayEdit)

  const tourDetailOpenerRef = useRef<{ placeId: number; element: HTMLElement } | null>(null)
  const { focusPoints, lastPlanMapViewportRef } = usePlannerFocusPoints(activeTab, places, tourPlanner, wandererBrowser)

  // PAD-06: an obstacle or area the paddle checklist asks for moves the camera as a picked search result does.
  const paddleFocus = usePaddleObstacleStore(state => state.focus)
  const { mapFocusPoints, mapFocusKey, locationSearch } = useMapLocationSearch(tourPlanner.mapFocusKey, focusPoints, paddleFocus)

  const trackParts = useTrackPortageParts(tourPlanner)
  // PAD-05B: the obstacles around the paddle tour in view, for the map and the rails alike.
  const paddleLine = tourPlanner.mode.type === 'view-gpx'
    ? (tourPlanner.mode.tour.tour_type === 'kayak' ? tourPlanner.readOnlyGpxAnalysis?.routeCoordinates ?? null : null)
    : tourPlanner.isPaddle ? tourPlanner.route : null
  usePaddleObstacleSync(paddleLine, activeTab === 'tour-planner')
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
  // What no router planned is dotted; a paddle tour's portages brown, whitewater amber, gaps red.
  const paddlePaint = usePaddlePaint()
  const partStyle = tourRouteStyle(
    !wandererBrowser.open && editingRoute ? tourPlanner.routeParts : !tourConversion.line ? trackParts : null,
    tourPlanner.isPaddle || !!trackParts,
    { portage: paddlePaint.portage, rapids: paddlePaint.rapids, gap: paddlePaint.gap, casing: paddlePaint.disc },
  )
  const routeWalking = partStyle.walking ?? (route && route.length === 2 && tourConversion.line ? [true, false] : null)

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
    tourDetailActions,
    tourMap: { route,
      routeWalking,
      routeColors: partStyle.colors,
      previewPoints: tourConversion.status === 'idle' ? null : tourConversion.points,
      focusPoints: mapFocusPoints,
      // A picked wanderer trail frames itself; the rest follows the planner.
      focusKey:
        wandererBrowser.open && wandererBrowser.selected ? `wanderer:${wandererBrowser.selected.id}` : mapFocusKey, captureViewport,
    },
    locationSearch,
    plannedTourDurations,
  }
}