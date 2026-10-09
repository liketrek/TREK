import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TourListItem } from '@trek/shared'
import type { LocationPoint } from '../../components/Planner/LocationSelect';
import { usePoiExplore, type Bbox } from '../../components/Map/usePoiExplore'
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

  const [locationSearchValue, setLocationSearchValue] = useState<LocationPoint | null>(null);
  const [searchCameraIntent, setSearchCameraIntent] = useState<{
    plannerFocusKey: number;
    sequence: number;
    point: [number, number];
  } | null>(null);
  const searchCameraSequenceRef = useRef(0);
  const onLocationSearchChange = useCallback(
    (location: LocationPoint | null) => {
      setLocationSearchValue(location);
      if (!location) return;
      searchCameraSequenceRef.current += 1;
      setSearchCameraIntent({
        plannerFocusKey: tourPlanner.mapFocusKey,
        sequence: searchCameraSequenceRef.current,
        point: [location.lat, location.lng],
      });
    },
    [tourPlanner.mapFocusKey]
  );

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

  const searchFocusIsCurrent = searchCameraIntent?.plannerFocusKey === tourPlanner.mapFocusKey;
  const mapFocusPoints = searchFocusIsCurrent ? [searchCameraIntent.point] : focusPoints;
  const mapFocusKey = searchFocusIsCurrent
    ? `tour:${tourPlanner.mapFocusKey}:search:${searchCameraIntent.sequence}`
    : `tour:${tourPlanner.mapFocusKey}`;

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
    permissions: { canPlaceEdit, canDayEdit },
    tourPlanner,
    tourDetails: { openerRef: tourDetailOpenerRef, onSelectTour },
    tourMap: { route, focusPoints: mapFocusPoints, focusKey: mapFocusKey, captureViewport },
    locationSearch: { value: locationSearchValue, onChange: onLocationSearchChange },
  }
}