import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGpxConversion } from '../conversion/useGpxConversion';
import type { TourPlannerController } from '../planner/useTourPlanner';

// FE-HORSE-IMPORT-001

function viewing(tourType: string) {
  const tour = { place_id: 5, tour_type: tourType, name: 'Recorded', max_hiking_difficulty: null };
  return {
    mode: { type: 'view-gpx', placeId: 5, tour },
    readOnlyGpxTour: { tour, routeGeometry: null },
    readOnlyGpxAnalysis: {
      routeCoordinates: [
        [48, 11],
        [48.01, 11],
      ],
    },
    canEdit: true,
    startDerivedTour: vi.fn(),
  } as unknown as TourPlannerController;
}

describe('a recorded ride (HOR-01)', () => {
  it('FE-HORSE-IMPORT-001: offers no editable version planned on foot, where a hike does', () => {
    expect(renderHook(() => useGpxConversion(viewing('horse'))).result.current.available).toBe(false);
    expect(renderHook(() => useGpxConversion(viewing('hike'))).result.current.available).toBe(true);
  });
});
