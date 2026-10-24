import { act, renderHook } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import type { TourPlannerController } from './planner/useTourPlanner';
import { useRecordedTrack } from './useRecordedTrack';

const repo = vi.hoisted(() => ({ restoreRecorded: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../repo/tourRepo', () => ({ tourRepo: repo }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const replaced = { place_id: 7, name: 'Kramer', has_waypoints: true, has_recorded_track: true } as TourListItem;
const restored = { ...replaced, has_waypoints: false, has_recorded_track: false };

function planner(placeId: number | null): TourPlannerController {
  return {
    mode: placeId === null ? { type: 'neutral' } : { type: 'edit-saved', placeId },
    returnToNeutral: vi.fn(),
  } as unknown as TourPlannerController;
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.restoreRecorded.mockResolvedValue({ tour: restored, waypoints: [] });
});

describe('useRecordedTrack', () => {
  it('is offered for a tour in the editor that keeps its recorded track, to someone who may change it', () => {
    const offered = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: planner(7), tours: [replaced], canEdit: true, onRestored: vi.fn() })
    );
    expect(offered.result.current.available).toBe(true);

    const readOnly = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: planner(7), tours: [replaced], canEdit: false, onRestored: vi.fn() })
    );
    expect(readOnly.result.current.available).toBe(false);

    const planned = renderHook(() =>
      useRecordedTrack({
        tripId: 1,
        planner: planner(7),
        tours: [{ ...replaced, has_recorded_track: false }],
        canEdit: true,
        onRestored: vi.fn(),
      })
    );
    expect(planned.result.current.available).toBe(false);

    const nothingOpen = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: planner(null), tours: [replaced], canEdit: true, onRestored: vi.fn() })
    );
    expect(nothingOpen.result.current.available).toBe(false);
  });

  it('goes back on the server, leaves the editor and hands the restored tour on', async () => {
    const controller = planner(7);
    const onRestored = vi.fn();
    const { result } = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: controller, tours: [replaced], canEdit: true, onRestored })
    );

    await act(async () => {
      await result.current.restore();
    });

    expect(repo.restoreRecorded).toHaveBeenCalledWith(1, 7);
    expect(controller.returnToNeutral).toHaveBeenCalled();
    expect(onRestored).toHaveBeenCalledWith(restored);
    expect(toast.success).toHaveBeenCalledWith('tours.recorded.restored');
    expect(result.current.restoring).toBe(false);
  });

  it('says so when it could not go back, and leaves the editor as it is', async () => {
    repo.restoreRecorded.mockRejectedValueOnce(new Error('offline'));
    const controller = planner(7);
    const onRestored = vi.fn();
    const { result } = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: controller, tours: [replaced], canEdit: true, onRestored })
    );

    await act(async () => {
      await result.current.restore();
    });

    expect(toast.error).toHaveBeenCalledWith('tours.recorded.failed');
    expect(controller.returnToNeutral).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });

  it('says it needs a connection when it is offline or behind an edit of the tour still waiting', async () => {
    repo.restoreRecorded.mockRejectedValueOnce(new OnlineOnlyError());
    const controller = planner(7);
    const onRestored = vi.fn();
    const { result } = renderHook(() =>
      useRecordedTrack({ tripId: 1, planner: controller, tours: [replaced], canEdit: true, onRestored })
    );

    await act(async () => {
      await result.current.restore();
    });

    expect(toast.error).toHaveBeenCalledWith('tours.recorded.offline');
    expect(controller.returnToNeutral).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });
});
