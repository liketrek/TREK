// FE-ACT-HOOK-001 to FE-ACT-HOOK-007
// ACT-01: the actual tracks read with the tour's detail, linked from the
// dialog and unlinked after confirming, each write telling the lists and the
// user, and a refusal named in the user's words without changing anything.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { TourActivity, TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import type { TourExecution } from './tourActivityModel';
import { useTourActivities } from './useTourActivities';

const repo = vi.hoisted(() => ({ detail: vi.fn(), assignActivity: vi.fn(), unassignActivity: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: repo }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const tour = { place_id: 7, name: 'Ridge', activity_tracks: [] } as unknown as TourListItem;
const executions: TourExecution[] = [{ assignmentId: 11, day: null, index: 0 }];

function activity(id: number, assignmentId: number | null, trackPlaceId = 20): TourActivity {
  return {
    id,
    assignment_id: assignmentId,
    day_id: null,
    assigned_at: null,
    track: { place_id: trackPlaceId, name: 'Watch', origin: 'gpx', file_name: null, imported_at: null },
    metrics: {
      distance_km: 3,
      elevation_gain_m: null,
      elevation_loss_m: null,
      started_at: null,
      ended_at: null,
      elapsed_minutes: null,
      point_count: 2,
    },
    geometry: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.detail.mockResolvedValue({ tour, waypoints: [], activities: [activity(1, null), activity(2, 11, 21)] });
});

function render(canEdit = true, onToursChanged = vi.fn()) {
  return renderHook(
    ({ current }) => useTourActivities({ tripId: 1, tour: current, executions, canEdit, onToursChanged }),
    { initialProps: { current: tour } }
  );
}

describe('useTourActivities', () => {
  it('FE-ACT-HOOK-001: reads the actual tracks with the detail, in day order, and again when the list says they changed', async () => {
    const { result, rerender } = render();
    expect(result.current.activities).toBeNull();
    await waitFor(() => expect(result.current.activities?.map((item) => item.id)).toEqual([2, 1]));
    expect(repo.detail).toHaveBeenCalledWith(1, 7, expect.any(AbortSignal));

    rerender({ current: { ...tour, activity_tracks: [{ id: 3, track_place_id: 22, assignment_id: null }] } });
    await waitFor(() => expect(repo.detail).toHaveBeenCalledTimes(2));
  });

  it('FE-ACT-HOOK-002: a detail that cannot be had shows none while the list names none either', async () => {
    repo.detail.mockRejectedValueOnce(new Error('offline'));
    const { result } = render();
    await waitFor(() => expect(result.current.activities).toEqual([]));
    expect(result.current.unavailable).toBe(false);
  });

  it('FE-ACT-HOOK-006: a detail that cannot be had while the list names tracks says they are unavailable, not that there are none', async () => {
    repo.detail.mockRejectedValueOnce(new Error('offline'));
    const linked = { ...tour, activity_tracks: [{ id: 3, track_place_id: 22, assignment_id: null }] } as TourListItem;
    const { result } = renderHook(() =>
      useTourActivities({ tripId: 1, tour: linked, executions, canEdit: true, onToursChanged: vi.fn() })
    );
    await waitFor(() => expect(result.current.activities).toEqual([]));
    expect(result.current.unavailable).toBe(true);
    // Nothing can be replaced that could not be read.
    act(() => result.current.openAssign());
    expect(result.current.assigning).toBeNull();
  });

  it('FE-ACT-HOOK-003: links the confirmed track, takes the answer in, tells the lists and closes the dialog', async () => {
    const onToursChanged = vi.fn();
    repo.assignActivity.mockResolvedValue({ tour, waypoints: [], activities: [activity(5, 11, 30)] });
    const { result } = render(true, onToursChanged);
    await waitFor(() => expect(result.current.activities).not.toBeNull());

    act(() => result.current.openAssign({ assignmentId: 11 }));
    expect(result.current.assigning).toEqual({ assignmentId: 11 });
    await act(async () => result.current.assign(30, 11));

    expect(repo.assignActivity).toHaveBeenCalledWith(1, 7, { track_place_id: 30, assignment_id: 11 });
    expect(result.current.activities?.map((item) => item.id)).toEqual([5]);
    expect(onToursChanged).toHaveBeenCalledWith([7, 30]);
    expect(toast.success).toHaveBeenCalledWith('tours.activity.assigned');
    expect(result.current.assigning).toBeNull();
  });

  it('FE-ACT-HOOK-004: a refusal names its reason, keeps the dialog open and changes nothing', async () => {
    repo.assignActivity.mockRejectedValue({ response: { status: 409, data: { code: 'activity_track_in_use' } } });
    const { result } = render();
    await waitFor(() => expect(result.current.activities).not.toBeNull());
    act(() => result.current.openAssign());
    await act(async () => result.current.assign(30, null));
    expect(toast.error).toHaveBeenCalledWith('tours.activity.refused.activity_track_in_use');
    expect(result.current.assigning).toEqual({});
    expect(result.current.activities?.map((item) => item.id)).toEqual([2, 1]);

    repo.assignActivity.mockRejectedValue(new Error('offline'));
    await act(async () => result.current.assign(30, null));
    expect(toast.error).toHaveBeenLastCalledWith('tours.activity.failed');
    act(() => result.current.closeAssign());
    expect(result.current.assigning).toBeNull();
  });

  it('FE-ACT-HOOK-007: offline or behind a waiting write of the tour, it says so rather than that the change failed', async () => {
    repo.assignActivity.mockRejectedValue(new OnlineOnlyError());
    repo.unassignActivity.mockRejectedValue(new OnlineOnlyError());
    const { result } = render();
    await waitFor(() => expect(result.current.activities).not.toBeNull());
    act(() => result.current.openAssign());
    await act(async () => result.current.assign(30, null));
    expect(toast.error).toHaveBeenLastCalledWith('tours.activity.offline');
    expect(result.current.assigning).toEqual({});
    act(() => result.current.askRemove(activity(1, null)));
    await act(async () => result.current.remove());
    expect(toast.error).toHaveBeenLastCalledWith('tours.activity.offline');
    expect(toast.error).not.toHaveBeenCalledWith('tours.activity.failed');
  });

  it('FE-ACT-HOOK-005: unlinks only after the question, and nothing for someone who may not change the tour', async () => {
    const onToursChanged = vi.fn();
    repo.unassignActivity.mockResolvedValue({ tour, waypoints: [], activities: [] });
    const { result } = render(true, onToursChanged);
    await waitFor(() => expect(result.current.activities).not.toBeNull());
    const target = result.current.activities?.[0] as TourActivity;

    act(() => result.current.askRemove(target));
    expect(result.current.removing).toBe(target);
    act(() => result.current.cancelRemove());
    await act(async () => result.current.remove());
    expect(repo.unassignActivity).not.toHaveBeenCalled();

    act(() => result.current.askRemove(target));
    await act(async () => result.current.remove());
    expect(repo.unassignActivity).toHaveBeenCalledWith(1, 7, 2);
    expect(onToursChanged).toHaveBeenCalledWith([7, 21]);
    expect(toast.success).toHaveBeenCalledWith('tours.activity.removed');
    expect(result.current.activities).toEqual([]);

    const readOnly = render(false);
    await waitFor(() => expect(readOnly.result.current.activities).not.toBeNull());
    act(() => {
      readOnly.result.current.openAssign();
      readOnly.result.current.askRemove(target);
    });
    expect(readOnly.result.current.assigning).toBeNull();
    expect(readOnly.result.current.removing).toBeNull();
    await act(async () => readOnly.result.current.assign(30, null));
    expect(repo.assignActivity).not.toHaveBeenCalled();
  });
});
