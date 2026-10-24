import { act, renderHook } from '@testing-library/react';
import type { TourPoi } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { usePoiInsertionPreview, withPreviewLine } from './usePoiInsertionPreview';

// FE-TOUR-POI-PREVIEW-001 to FE-TOUR-POI-PREVIEW-003

const POINTS: TourPlannerWaypoint[] = [
  { id: 'a', lat: 47.0, lng: 11.0, role: 'start' },
  { id: 'b', lat: 47.01, lng: 11.0, role: 'via' },
  { id: 'c', lat: 47.02, lng: 11.0, role: 'end' },
];
const SPRING: TourPoi = {
  id: 'node:1',
  name: 'Spring',
  lat: 47.015,
  lng: 11.001,
  category: 'drinking_water',
  kind: 'amenity=drinking_water',
  source: 'openstreetmap',
  address: null,
  website: null,
  phone: null,
  opening_hours: null,
  distance_m: 80,
  along_m: 1650,
};

beforeEach(() => useTourPoiStore.getState().clear());

describe('usePoiInsertionPreview (PLN-04)', () => {
  it('FE-TOUR-POI-PREVIEW-001: draws nothing until a place is open, then its slot, and follows a new pick', () => {
    const planner = { waypoints: POINTS, route: null, canEdit: true };
    const { result } = renderHook(() => usePoiInsertionPreview(planner));
    expect(result.current).toBeNull();
    act(() => {
      useTourPoiStore.getState().publish([SPRING]);
      useTourPoiStore.getState().select('node:1');
    });
    expect(result.current).toEqual([
      [47.01, 11.0],
      [47.015, 11.001],
      [47.02, 11.0],
    ]);
    act(() => useTourPoiStore.getState().chooseSlot({ poiId: 'node:1', afterId: 'c' }));
    expect(result.current).toEqual([
      [47.02, 11.0],
      [47.015, 11.001],
    ]);
    act(() => useTourPoiStore.getState().select(null));
    expect(result.current).toBeNull();
  });

  it('FE-TOUR-POI-PREVIEW-002: draws nothing for a viewer who cannot change the tour', () => {
    useTourPoiStore.getState().publish([SPRING]);
    useTourPoiStore.getState().select('node:1');
    const { result } = renderHook(() => usePoiInsertionPreview({ waypoints: POINTS, route: null, canEdit: false }));
    expect(result.current).toBeNull();
  });

  it('FE-TOUR-POI-PREVIEW-003: lays the preview over the lines as one more dotted stretch, and leaves them alone without one', () => {
    const route: [number, number][][] = [
      [
        [47.0, 11.0],
        [47.02, 11.0],
      ],
    ];
    const line: [number, number][] = [
      [47.02, 11.0],
      [47.03, 11.0],
    ];
    const drawn = { route, routeWalking: null, routeColors: null };
    expect(withPreviewLine(drawn, null)).toBe(drawn);
    expect(withPreviewLine(drawn, line)).toEqual({
      route: [...route, line],
      routeWalking: [false, true],
      routeColors: null,
    });
    const coloured = { route, routeWalking: [false], routeColors: [{ line: 'day-1', casing: 'day-1-casing' }] };
    expect(withPreviewLine(coloured, line)).toEqual({
      route: [...route, line],
      routeWalking: [false, true],
      routeColors: [{ line: 'day-1', casing: 'day-1-casing' }, undefined],
    });
  });
});
