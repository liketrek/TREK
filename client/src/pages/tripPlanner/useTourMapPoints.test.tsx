// FE-TOUR-MAP-POINTS-001: the planner map names where a stage of a multi-day tour ends (MDT-01).
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useTourMapPoints } from './useTourMapPoints';

vi.mock('../../components/Tours/planner/useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({}) }));

const wrapper = ({ children }: { children: ReactNode }) => <TranslationProvider>{children}</TranslationProvider>;
/** No card is open over the map: every press goes through as it is. */
const guard = ((handler: unknown) => handler) as unknown as Parameters<typeof useTourMapPoints>[0]['guard'];

describe('useTourMapPoints', () => {
  it('FE-TOUR-MAP-POINTS-001: a stop that ends a stage carries the mark and says which stage it ends', () => {
    const tourPlanner = {
      mode: { type: 'new-draft' },
      isSaving: false,
      waypoints: [
        { id: 'a', lat: 47, lng: 11, role: 'start' },
        { id: 's', lat: 47.05, lng: 11, role: 'via', shaping: true },
        { id: 'b', lat: 47.1, lng: 11, role: 'via', stageEnd: true },
        { id: 'c', lat: 47.2, lng: 11, role: 'via', stageEnd: true },
        { id: 'd', lat: 47.3, lng: 11, role: 'end' },
      ],
      selectedWaypointId: null,
      setSelectedWaypointId: vi.fn(),
      setWaypointPosition: vi.fn(),
      addWaypoint: vi.fn(),
      undo: vi.fn(),
      maxHikingDifficulty: 2,
      isPaddle: false,
    } as unknown as TourPlannerController;
    const { result } = renderHook(
      () => useTourMapPoints({ tourPlanner, canPlaceEdit: true, mode: '2d', cardOpen: false, guard }),
      { wrapper }
    );
    const points = result.current.waypoints.points as Array<{
      id: string;
      label?: string;
      stageEnd?: boolean;
      detail?: string;
    }>;
    expect(points.map((point) => [point.id, point.label, point.stageEnd ?? false])).toEqual([
      ['a', '1', false],
      ['s', undefined, false],
      ['b', '2', true],
      ['c', '3', true],
      ['d', '4', false],
    ]);
    expect(points[2].detail).toBe('Via, End of stage 1');
    expect(points[3].detail).toBe('Via, End of stage 2');
    expect(points[4].detail).toBe('End');
  });
});
