// FE-ACT-ASSIGN-001 to FE-ACT-ASSIGN-005
// ACT-01, the link dialog's state: the day it starts on, the recordings of the
// trip to choose from, what a choice replaces, and a recording imported here
// chosen for the user but never linked by itself.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourActivity, TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TourExecution } from './tourActivityModel';
import type { AssignTarget } from './useTourActivities';
import { useTrackAssignment } from './useTrackAssignment';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
interface ImportOptions {
  onImported?: (tours: TourListItem[]) => void;
  onToursChanged?: (ids?: number[]) => unknown;
}
const gpx = vi.hoisted(() => ({ options: null as null | ImportOptions }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: repo }));
vi.mock('../useTourGpxImport', () => ({
  useTourGpxImport: (options: ImportOptions) => {
    gpx.options = options;
    return { importing: false, preview: null, pick: vi.fn(), confirm: vi.fn(), cancel: vi.fn(), importFiles: vi.fn() };
  },
}));

const tour = { place_id: 7, name: 'Ridge', tour_type: 'hike', origin: 'trek', has_waypoints: true } as TourListItem;
const recording = (placeId: number, name: string, extra: Partial<TourListItem> = {}) =>
  ({ place_id: placeId, name, tour_type: 'hike', origin: 'gpx', has_waypoints: false, ...extra }) as TourListItem;
const executions: TourExecution[] = [
  { assignmentId: 11, day: null, index: 0 },
  { assignmentId: 31, day: null, index: 2 },
];
const linked = (assignmentId: number | null, trackPlaceId: number, name: string) =>
  ({
    id: trackPlaceId,
    assignment_id: assignmentId,
    track: { place_id: trackPlaceId, name },
  }) as unknown as TourActivity;

beforeEach(() => {
  vi.clearAllMocks();
  repo.list.mockResolvedValue({ tours: [tour, recording(20, 'Watch'), recording(21, 'Phone', { activity_of: 99 })] });
});

function render(activities: TourActivity[], target: AssignTarget = {}, onToursChanged = vi.fn()) {
  return renderHook(() =>
    useTrackAssignment({ tripId: 1, tour, executions, activities, target, canEdit: true, onToursChanged })
  );
}

describe('useTrackAssignment', () => {
  it('FE-ACT-ASSIGN-001: starts on the first day without an actual track, or on the day asked for', async () => {
    expect(render([]).result.current.assignmentId).toBe(11);
    expect(render([linked(11, 20, 'Watch')]).result.current.assignmentId).toBe(31);
    expect(render([linked(11, 20, 'Watch'), linked(31, 21, 'Phone')]).result.current.assignmentId).toBe(11);
    const asked = render([linked(31, 21, 'Phone')], { assignmentId: 31 });
    expect(asked.result.current.assignmentId).toBe(31);
    // A change starts on the track the day has, which therefore replaces nothing.
    expect(asked.result.current.selected).toBe(21);
    expect(asked.result.current.replaces).toEqual([]);
    await waitFor(() => expect(asked.result.current.candidates).not.toBeNull());
  });

  it('FE-ACT-ASSIGN-002: lists the recordings of the trip, and only a free one can be linked', async () => {
    const { result } = render([]);
    expect(result.current.candidates).toBeNull();
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.candidates?.map((c) => c.tour.place_id)).toEqual([20, 21]));
    expect(repo.list).toHaveBeenCalledWith(1);

    act(() => result.current.choose(21));
    expect(result.current.choice?.takenBy).toBe('');
    expect(result.current.ready).toBe(false);
    act(() => result.current.choose(20));
    expect(result.current.ready).toBe(true);
    expect(result.current.importFields).toEqual({ tour_type: 'hike' });
  });

  it('FE-ACT-ASSIGN-003: names the track a choice replaces on its day, and none on a day without one', async () => {
    const { result } = render([linked(11, 21, 'Phone')], { assignmentId: 11 });
    await waitFor(() => expect(result.current.candidates).not.toBeNull());
    act(() => result.current.choose(20));
    expect(result.current.replaces).toEqual(['Phone']);
    act(() => result.current.chooseExecution(null));
    expect(result.current.execution.day).toBeNull();
    expect(result.current.replaces).toEqual([]);
  });

  it('FE-ACT-ASSIGN-005: "no day" left with several tracks once their days went: a change starts on the one asked for and names every one it replaces', async () => {
    const noDay = [linked(null, 20, 'Watch'), linked(null, 21, 'Phone'), linked(11, 22, 'Bike computer')];
    const { result } = render(noDay, { assignmentId: null, activityId: 21 });
    await waitFor(() => expect(result.current.candidates).not.toBeNull());
    expect(result.current.selected).toBe(21);
    expect(result.current.replaces).toEqual(['Watch']);
    act(() => result.current.choose(40));
    expect(result.current.replaces).toEqual(['Watch', 'Phone']);
  });

  it('FE-ACT-ASSIGN-004: a recording imported here is chosen and the list read again; the lists are told', async () => {
    const onToursChanged = vi.fn();
    const { result } = render([], {}, onToursChanged);
    await waitFor(() => expect(result.current.candidates).not.toBeNull());
    repo.list.mockResolvedValue({ tours: [tour, recording(20, 'Watch'), recording(40, 'Imported')] });

    await act(async () => gpx.options?.onToursChanged?.([40]));
    expect(onToursChanged).toHaveBeenCalledWith([40]);
    await act(async () => gpx.options?.onToursChanged?.());
    expect(onToursChanged).toHaveBeenLastCalledWith([]);
    act(() => gpx.options?.onImported?.([recording(40, 'Imported')]));
    expect(result.current.selected).toBe(40);
    await waitFor(() => expect(result.current.choice?.tour.name).toBe('Imported'));
    expect(repo.list).toHaveBeenCalledTimes(2);
    act(() => gpx.options?.onImported?.([]));
    expect(result.current.selected).toBe(40);
  });
});
