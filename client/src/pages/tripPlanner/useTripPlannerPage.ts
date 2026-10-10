import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TourListItem } from '@trek/shared'
import { usePoiExplore, type Bbox } from '../../components/Map/usePoiExplore'
import { placeActions } from '../../components/Planner/usePlaceActions'
import { useTourPlanner } from '../../components/Tours/planner/useTourPlanner'
import { useTripPlanner } from './useTripPlanner'

export function useTripPlannerPage() {
  const planner = useTripPlanner()
  const {
    activeTab,
    can,
    enabledAddons,
    isMobile,
    places,
    reloadTourPlaceIds,
    setSelectedPlaceId,
    t,
    toast,
    trip,
    tripActions,
    tripId,
    upsertTour,
  } = planner

  const canPlaceEdit = can('place_edit', trip)
  const canDayEdit = can('day_edit', trip)
  const tourPlanner = useTourPlanner({
    tripId,
    canEdit: canPlaceEdit,
    canAssign: canDayEdit,
    active: activeTab === 'tour-planner' && enabledAddons.tours && !isMobile,
    onSaved: async result => {
      upsertTour(result.tour)
      toast.success(t('tours.planner.saved'))
      await tripActions.loadTrip(tripId)
      void reloadTourPlaceIds()
    },
  })

  const tourDetailOpenerRef = useRef<{ placeId: number; element: HTMLElement } | null>(null)
  const lastPlanMapViewportRef = useRef<Bbox | null>(null)
  const [plannerViewportSnapshot, setPlannerViewportSnapshot] = useState<Bbox | null>(lastPlanMapViewportRef.current)
  useEffect(() => {
    if (activeTab === 'tour-planner') setPlannerViewportSnapshot(lastPlanMapViewportRef.current)
  }, [activeTab, tourPlanner.newDraftGeneration])

  const plannerFallbackFocusPoints = useMemo<[number, number][]>(() => {
    const bounds = plannerViewportSnapshot
    if (bounds) {
      const latitudeSpan = bounds.north - bounds.south
      const longitudeSpan = bounds.east - bounds.west
      if (latitudeSpan > 0 && latitudeSpan < 160 && longitudeSpan > 0 && longitudeSpan < 340) {
        return [[bounds.south, bounds.west], [bounds.north, bounds.east]]
      }
    }
    return places
      .filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lng))
      .map(place => [place.lat, place.lng] as [number, number])
  }, [places, plannerViewportSnapshot])

  const focusPoints = useMemo<[number, number][]>(() => {
    if (tourPlanner.mode.type === 'view-gpx') return tourPlanner.readOnlyGpxAnalysis?.routeCoordinates ?? []
    if (tourPlanner.mode.type === 'new-draft') {
      return tourPlanner.waypoints.map(point => [point.lat, point.lng])
    }
    if (tourPlanner.mode.type === 'edit-saved' && tourPlanner.waypoints.length) {
      return tourPlanner.waypoints.map(point => [point.lat, point.lng])
    }
    return plannerFallbackFocusPoints
  }, [tourPlanner.mode.type, tourPlanner.readOnlyGpxAnalysis?.routeCoordinates, tourPlanner.waypoints, plannerFallbackFocusPoints])

  const route = useMemo<[number, number][][] | null>(() => {
    if (tourPlanner.mode.type === 'view-gpx') {
      const coordinates = tourPlanner.readOnlyGpxAnalysis?.routeCoordinates
      return coordinates?.length ? [coordinates] : null
    }
    if (tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved') {
      return tourPlanner.route ? [tourPlanner.route] : null
    }
    return null
  }, [tourPlanner.mode.type, tourPlanner.readOnlyGpxAnalysis?.routeCoordinates, tourPlanner.route])

  const { closeGpxTour } = tourPlanner
  useEffect(() => {
    if (activeTab !== 'tour-planner') closeGpxTour()
  }, [activeTab, closeGpxTour])

  const poi = usePoiExplore()
  const poiViewportChangeRef = useRef(poi.onViewportChange)
  poiViewportChangeRef.current = poi.onViewportChange
  const captureViewport = useCallback((bounds: Bbox) => {
    lastPlanMapViewportRef.current = bounds
    poiViewportChangeRef.current(bounds)
  }, [])

  const onSelectTour = (tour: TourListItem | null, opener?: HTMLElement) => {
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
    tourDetails: { openerRef: tourDetailOpenerRef, onSelectTour },
    tourMap: { route, focusPoints, focusKey: tourPlanner.mapFocusKey, captureViewport },
  }
}