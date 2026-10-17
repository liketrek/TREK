// FE-HOOK-FERRATAADOPT-001 to FE-HOOK-FERRATAADOPT-004: a via ferrata goes onto the tour as a fixed leg of its own line.
import { describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import { renderHook } from '../../../tests/helpers/render';
import { groupFerratas } from '../../components/Ferratas/ferrataGroups';
import { useFerrataAdopt } from './useFerrataAdopt';

const ferrata = (id: number, geometry: [number, number][]): Ferrata => ({
  id: `way/${id}`,
  name: 'Via Test',
  routeName: null,
  grade: { raw: '2', level: 2, plus: null },
  geometry,
  osmUrl: `https://www.openstreetmap.org/way/${id}`,
});

// Two pieces that join head to head: the second runs backwards.
const [group] = groupFerratas([
  ferrata(1, [
    [47.43, 11.05],
    [47.432, 11.05],
  ]),
  ferrata(2, [
    [47.434, 11.05],
    [47.432, 11.05],
  ]),
]);

function planner(overrides: Record<string, unknown> = {}) {
  return {
    mode: { type: 'new-draft' },
    isSaving: false,
    waypoints: [] as Array<{ id: string; lat: number; lng: number; role: string }>,
    addWaypoint: vi.fn(),
    appendFixedLeg: vi.fn(),
    startNewTour: vi.fn(),
    ...overrides,
  };
}

describe('useFerrataAdopt', () => {
  it('FE-HOOK-FERRATAADOPT-001: hands the ferrata over as one fixed line, its pieces joined in walking order', () => {
    const p = planner();
    const done = vi.fn();
    const { result } = renderHook(() => useFerrataAdopt(p as never, true, done));
    result.current?.(group);
    expect(p.appendFixedLeg).toHaveBeenCalledWith({
      kind: 'ferrata',
      ref: group.id.replace(/^group\//, ''),
      name: 'Via Test',
      geometry: [
        [47.43, 11.05],
        [47.432, 11.05],
        [47.434, 11.05],
      ],
    });
    expect(p.addWaypoint).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledOnce();
  });

  it('FE-HOOK-FERRATAADOPT-002: starts at the end nearer to the last waypoint', () => {
    const p = planner({ waypoints: [{ id: 'a', lat: 47.44, lng: 11.05, role: 'start' }] });
    const { result } = renderHook(() => useFerrataAdopt(p as never, true, vi.fn()));
    result.current?.(group);
    const leg = p.appendFixedLeg.mock.calls[0]?.[0] as { geometry: [number, number][] };
    expect(leg.geometry[0]).toEqual([47.434, 11.05]);
    expect(leg.geometry[leg.geometry.length - 1]).toEqual([47.43, 11.05]);
  });

  it('FE-HOOK-FERRATAADOPT-003: from a GPX view it starts a new tour first; pieces that do not join go on as two plain ends', () => {
    const p = planner({ mode: { type: 'view-gpx', placeId: 9 } });
    const [apart] = groupFerratas([
      ferrata(3, [
        [47.43, 11.05],
        [47.431, 11.05],
      ]),
      ferrata(4, [
        [47.433, 11.05],
        [47.434, 11.05],
      ]),
    ]);
    const { result } = renderHook(() => useFerrataAdopt(p as never, true, vi.fn()));
    result.current?.(apart);
    expect(p.startNewTour).toHaveBeenCalledOnce();
    expect(p.appendFixedLeg).not.toHaveBeenCalled();
    expect(p.addWaypoint).toHaveBeenCalledTimes(2);
  });

  it('FE-HOOK-FERRATAADOPT-004: offers nothing while the tour cannot be edited', () => {
    const { result } = renderHook(() => useFerrataAdopt(planner() as never, false, vi.fn()));
    expect(result.current).toBeUndefined();
  });
});
