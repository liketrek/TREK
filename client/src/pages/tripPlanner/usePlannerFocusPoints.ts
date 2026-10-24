import { useEffect, useMemo, useRef, useState } from 'react';
import type { Bbox } from '../../components/Map/usePoiExplore';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import type { WandererBrowser } from '../../components/Tours/wanderer/useWandererBrowser';
import type { Place } from '../../types';

/**
 * What the TOUR-PLANNER map frames: a browsed wanderer trail, the recorded
 * track or the control points of the open tour, and with nothing open the
 * area the plan map last showed (or the trip's places). The plan map reports
 * its viewport into the returned ref.
 */
export function usePlannerFocusPoints(
  activeTab: string,
  places: readonly Place[],
  tourPlanner: TourPlannerController,
  wandererBrowser: Pick<WandererBrowser, 'open' | 'line'>
) {
  const lastPlanMapViewportRef = useRef<Bbox | null>(null);
  // Nothing reported yet when the planner first opens; the effect takes the area the plan map last showed.
  const [plannerViewportSnapshot, setPlannerViewportSnapshot] = useState<Bbox | null>(null);
  useEffect(() => {
    if (activeTab === 'tour-planner') setPlannerViewportSnapshot(lastPlanMapViewportRef.current);
  }, [activeTab, tourPlanner.newDraftGeneration]);

  const plannerFallbackFocusPoints = useMemo<[number, number][]>(() => {
    const bounds = plannerViewportSnapshot;
    if (bounds) {
      const latitudeSpan = bounds.north - bounds.south;
      const longitudeSpan = bounds.east - bounds.west;
      if (latitudeSpan > 0 && latitudeSpan < 160 && longitudeSpan > 0 && longitudeSpan < 340) {
        return [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ];
      }
    }
    return places
      .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
      .map((place) => [place.lat, place.lng] as [number, number]);
  }, [places, plannerViewportSnapshot]);

  const focusPoints = useMemo<[number, number][]>(() => {
    if (wandererBrowser.open) return wandererBrowser.line ?? plannerFallbackFocusPoints;
    if (tourPlanner.mode.type === 'view-gpx') return tourPlanner.readOnlyGpxAnalysis?.routeCoordinates ?? [];
    if (tourPlanner.mode.type === 'new-draft') {
      return tourPlanner.waypoints.map((point) => [point.lat, point.lng]);
    }
    if (tourPlanner.mode.type === 'edit-saved' && tourPlanner.waypoints.length) {
      return tourPlanner.waypoints.map((point) => [point.lat, point.lng]);
    }
    return plannerFallbackFocusPoints;
  }, [
    wandererBrowser.open,
    wandererBrowser.line,
    tourPlanner.mode.type,
    tourPlanner.readOnlyGpxAnalysis?.routeCoordinates,
    tourPlanner.waypoints,
    plannerFallbackFocusPoints,
  ]);

  return { focusPoints, lastPlanMapViewportRef };
}
