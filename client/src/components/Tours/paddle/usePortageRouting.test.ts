// FE-PORTAGE-ROUTING-001 to 005: portages set in the planner follow the ways on land (PAD-03).
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { portageLegBetween } from '../planner/tourRouteActions';

const routePortageLine = vi.fn();
vi.mock('./portageRoute', () => ({ routePortageLine: (...args: unknown[]) => routePortageLine(...args) }));

const { usePortageRouting } = await import('./usePortageRouting');

const A: TourPlannerWaypoint = { id: 'a', lat: 53.2232, lng: 12.9668, role: 'start' };
const B: TourPlannerWaypoint = { id: 'b', lat: 53.2229, lng: 12.9701, role: 'end' };
const WAY: [number, number][] = [
  [A.lat, A.lng],
  [53.2226, 12.9686],
  [B.lat, B.lng],
];

function plannerWith(waypoints: TourPlannerWaypoint[], hasUnsavedChanges: boolean) {
  const planner = {
    waypoints,
    isPaddle: true,
    hasUnsavedChanges,
    amendWaypoints: vi.fn((change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
      planner.waypoints = change(planner.waypoints);
    }),
    editPaddlePoints: vi.fn((change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
      planner.waypoints = change(planner.waypoints);
    }),
  };
  return planner;
}

const carried = (): TourPlannerWaypoint[] => [{ ...A, fixedLeg: portageLegBetween(A, B) }, B];

describe('usePortageRouting', () => {
  beforeEach(() => routePortageLine.mockReset());

  it('FE-PORTAGE-ROUTING-001: lays a portage the paddler just set on the way the router found', async () => {
    routePortageLine.mockResolvedValue(WAY);
    const planner = plannerWith(carried(), true);
    renderHook(() => usePortageRouting(planner, true));
    await waitFor(() => expect(planner.amendWaypoints).toHaveBeenCalled());
    expect(planner.waypoints[0].fixedLeg?.geometry).toEqual(WAY);
  });

  it('FE-PORTAGE-ROUTING-002: leaves a tour as saved alone, and asks nobody while it cannot be edited', async () => {
    const saved = plannerWith(carried(), false);
    renderHook(() => usePortageRouting(saved, true));
    const locked = plannerWith(carried(), true);
    renderHook(() => usePortageRouting(locked, false));
    await Promise.resolve();
    expect(routePortageLine).not.toHaveBeenCalled();
  });

  it('FE-PORTAGE-ROUTING-003: keeps a carry straight when the router found no way, and says so', async () => {
    routePortageLine.mockResolvedValue(null);
    const planner = plannerWith(carried(), true);
    const { result } = renderHook(() => usePortageRouting(planner, true));
    await waitFor(() => expect(routePortageLine).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.noWay(['a'])).toBe(true));
    expect(planner.waypoints[0].fixedLeg?.geometry).toHaveLength(2);
  });

  it('FE-PORTAGE-ROUTING-004: lays a saved straight portage on the way when asked to', async () => {
    routePortageLine.mockResolvedValue(WAY);
    const planner = plannerWith(carried(), false);
    const { result } = renderHook(() => usePortageRouting(planner, true));
    let found = false;
    await act(async () => {
      found = await result.current.follow(['a']);
    });
    expect(found).toBe(true);
    expect(planner.waypoints[0].fixedLeg?.geometry).toEqual(WAY);
  });

  it('FE-PORTAGE-ROUTING-005: draws a portage straight on request and keeps it so', async () => {
    const planner = plannerWith([{ ...A, fixedLeg: { ...portageLegBetween(A, B), geometry: WAY } }, B], true);
    const { result, rerender } = renderHook(() => usePortageRouting(planner, true));
    act(() => result.current.straighten(['a']));
    expect(planner.waypoints[0].fixedLeg?.geometry).toEqual([
      [A.lat, A.lng],
      [B.lat, B.lng],
    ]);
    rerender();
    await Promise.resolve();
    expect(routePortageLine).not.toHaveBeenCalled();
  });
});
