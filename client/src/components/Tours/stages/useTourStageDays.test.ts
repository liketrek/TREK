// FE-TOUR-STAGE-DAYS-001 to FE-TOUR-STAGE-DAYS-007: each stage of a multi-day tour on a day of its own (MDT-02).
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { TranslationProvider } from '../../../i18n/TranslationContext';
import { useTripStore } from '../../../store/tripStore';
import type { AssignmentsMap } from '../../../types';
import { dayHoldsTour, stageDaysOf, useTourStageDays } from './useTourStageDays';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

/** Tour 42: its first stage on day 3, the whole of tour 7 on day 4, day 5 free. */
const assignments = {
  '3': [{ id: 31, place_id: 42, tour_stage_key: 'stop-start' }],
  '4': [
    { id: 41, place_id: 7, tour_stage_key: null },
    { id: 42, place_id: 42, tour_stage_key: null },
  ],
  '5': [],
} as unknown as AssignmentsMap;

const assignPlaceToDay = vi.fn(async () => undefined);
const moveAssignment = vi.fn(async () => undefined);
const removeAssignment = vi.fn(async () => undefined);

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useTripStore, { assignments, assignPlaceToDay, moveAssignment, removeAssignment });
});

const render = (canAssign = true) =>
  renderHook(() => useTourStageDays({ tripId: 9, placeId: 42, canAssign }), { wrapper: TranslationProvider });

describe('stage days', () => {
  it('FE-TOUR-STAGE-DAYS-001: reads which day holds which stage, by its starting stop', () => {
    expect([...stageDaysOf(42, assignments)]).toEqual([['stop-start', { assignmentId: 31, dayId: 3 }]]);
    expect(stageDaysOf(7, assignments).size).toBe(0);
  });

  it('FE-TOUR-STAGE-DAYS-002: a day holding the tour, whole or a stage, takes no other stage of it', () => {
    expect(dayHoldsTour(assignments, 42, 4)).toBe(true);
    expect(dayHoldsTour(assignments, 42, 3)).toBe(true);
    expect(dayHoldsTour(assignments, 42, 3, { assignmentId: 31, dayId: 3 })).toBe(false);
    expect(dayHoldsTour(assignments, 42, 5)).toBe(false);
  });

  it('FE-TOUR-STAGE-DAYS-003: puts a stage without a day on one, through the plan with its key', async () => {
    const { result } = render();
    expect(result.current.dayOf('stop-hut')).toBeNull();
    expect(result.current.canTake('stop-hut', 5)).toBe(true);
    expect(result.current.canTake('stop-hut', 4)).toBe(false);
    await act(async () => {
      expect(await result.current.setDay('stop-hut', 5)).toBe(true);
    });
    expect(assignPlaceToDay).toHaveBeenCalledWith(9, 5, 42, null, 'stop-hut');
  });

  it('FE-TOUR-STAGE-DAYS-004: moves a stage to another day and takes it off with no day', async () => {
    const { result } = render();
    expect(result.current.dayOf('stop-start')).toBe(3);
    await act(async () => {
      await result.current.setDay('stop-start', 5);
    });
    expect(moveAssignment).toHaveBeenCalledWith(9, 31, 3, 5);
    await act(async () => {
      await result.current.setDay('stop-start', null);
    });
    expect(removeAssignment).toHaveBeenCalledWith(9, 3, 31);
  });

  it('FE-TOUR-STAGE-DAYS-005: does nothing for the day it is on, a day that holds the tour, or without the right', async () => {
    const { result } = render();
    await act(async () => {
      expect(await result.current.setDay('stop-start', 3)).toBe(false);
      expect(await result.current.setDay('stop-hut', 4)).toBe(false);
      expect(await result.current.setDay('stop-hut', null)).toBe(false);
    });
    const denied = render(false);
    expect(denied.result.current.canTake('stop-hut', 5)).toBe(false);
    await act(async () => {
      expect(await denied.result.current.setDay('stop-hut', 5)).toBe(false);
    });
    expect(assignPlaceToDay).not.toHaveBeenCalled();
    expect(moveAssignment).not.toHaveBeenCalled();
    expect(removeAssignment).not.toHaveBeenCalled();
  });

  it('FE-TOUR-STAGE-DAYS-006: sends a stage once while it is on its way', async () => {
    let finish: () => void = () => undefined;
    assignPlaceToDay.mockImplementationOnce(
      () => new Promise<undefined>((resolve) => (finish = () => resolve(undefined)))
    );
    const { result } = render();
    let first: Promise<boolean> = Promise.resolve(false);
    let second: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = result.current.setDay('stop-hut', 5);
      second = result.current.setDay('stop-hut', 5);
    });
    expect(await second).toBe(false);
    expect(result.current.isPending('stop-hut')).toBe(true);
    expect(result.current.canTake('stop-hut', 5)).toBe(false);
    await act(async () => {
      finish();
      expect(await first).toBe(true);
    });
    expect(assignPlaceToDay).toHaveBeenCalledTimes(1);
    expect(result.current.isPending('stop-hut')).toBe(false);
  });

  it('FE-TOUR-STAGE-DAYS-007: a refused write says so and changes nothing more', async () => {
    assignPlaceToDay.mockRejectedValueOnce(new Error('Stage is already on a day'));
    const { result } = render();
    await act(async () => {
      expect(await result.current.setDay('stop-hut', 5)).toBe(false);
    });
    expect(toast.error).toHaveBeenCalledWith('The stage could not be put on that day.');
    expect(result.current.isPending('stop-hut')).toBe(false);
  });
});
