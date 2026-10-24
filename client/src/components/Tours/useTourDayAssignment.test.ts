import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useTripStore } from '../../store/tripStore';
import type { AssignmentsMap } from '../../types';
import { isTourOnDay, useTourDayAssignment } from './useTourDayAssignment';

const assignments = { '3': [{ id: 31, place_id: 42 }], '4': [] } as unknown as AssignmentsMap;

beforeEach(() => {
  resetAllStores();
  seedStore(useTripStore, { assignments });
});

describe('isTourOnDay (PR1-18)', () => {
  it('reads the day lists: a tour is on a day once it has an assignment there', () => {
    expect(isTourOnDay(assignments, 42, 3)).toBe(true);
    expect(isTourOnDay(assignments, 42, 4)).toBe(false);
    expect(isTourOnDay(assignments, 42, 99)).toBe(false);
  });
});

describe('useTourDayAssignment (PR1-18)', () => {
  it('offers only a day that does not have the tour yet, and nothing without the right', () => {
    const allowed = renderHook(() => useTourDayAssignment({ canAssign: true, onAssignToDay: vi.fn() }));
    expect(allowed.result.current.isOnDay(42, 3)).toBe(true);
    expect(allowed.result.current.isAvailable(42, 3)).toBe(false);
    expect(allowed.result.current.isAvailable(42, 4)).toBe(true);

    const denied = renderHook(() => useTourDayAssignment({ canAssign: false, onAssignToDay: vi.fn() }));
    expect(denied.result.current.isAvailable(42, 4)).toBe(false);
  });

  it('sends one write per tour and day while it is on its way, and says whether it happened', async () => {
    let finish: (value: boolean) => void = () => undefined;
    const onAssignToDay = vi.fn(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useTourDayAssignment({ canAssign: true, onAssignToDay }));

    let first: Promise<boolean> = Promise.resolve(false);
    let second: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = result.current.assign(42, 4);
      second = result.current.assign(42, 4);
    });
    expect(onAssignToDay).toHaveBeenCalledTimes(1);
    expect(onAssignToDay).toHaveBeenCalledWith(42, 4);
    expect(await second).toBe(false);
    expect(result.current.isPending(42, 4)).toBe(true);
    expect(result.current.isAvailable(42, 4)).toBe(false);

    await act(async () => {
      finish(true);
      expect(await first).toBe(true);
    });
    expect(result.current.isPending(42, 4)).toBe(false);
  });

  it('reports a refused write as not done, and a day that has the tour is not even asked', async () => {
    const onAssignToDay = vi.fn(async () => false);
    const { result } = renderHook(() => useTourDayAssignment({ canAssign: true, onAssignToDay }));
    await act(async () => {
      expect(await result.current.assign(42, 4)).toBe(false);
      expect(await result.current.assign(42, 3)).toBe(false);
    });
    expect(onAssignToDay).toHaveBeenCalledTimes(1);
    expect(onAssignToDay).toHaveBeenCalledWith(42, 4);
  });

  it('lets the stages of a multi-day tour go from a day that holds it, and passes on how (MDT-02)', async () => {
    const onAssignToDay = vi.fn(async () => true);
    const { result } = renderHook(() => useTourDayAssignment({ canAssign: true, onAssignToDay }));
    expect(result.current.isAvailable(42, 3, 'whole')).toBe(false);
    expect(result.current.isAvailable(42, 3, 'stages')).toBe(true);
    await act(async () => {
      expect(await result.current.assign(42, 3, 'stages')).toBe(true);
      expect(await result.current.assign(42, 3, 'whole')).toBe(false);
    });
    expect(onAssignToDay).toHaveBeenCalledTimes(1);
    expect(onAssignToDay).toHaveBeenCalledWith(42, 3, undefined, 'stages');
  });

  it('FE-TOUR-STAGE-SPREAD-028: left for the plan to ask, a day that holds a multi-day tour still goes, with no way passed', async () => {
    const onAssignToDay = vi.fn(async () => true);
    const { result } = renderHook(() => useTourDayAssignment({ canAssign: true, onAssignToDay }));
    await act(async () => {
      expect(await result.current.assign(42, 3, 'ask')).toBe(true);
      expect(await result.current.assign(42, 3)).toBe(false);
    });
    expect(onAssignToDay).toHaveBeenCalledTimes(1);
    expect(onAssignToDay).toHaveBeenCalledWith(42, 3);
  });
});
