import { act, renderHook } from '@testing-library/react';
import { TOUR_REVISION_CONFLICT, type TourListItem } from '@trek/shared';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tourRepo } from '../../../repo/tourRepo';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useSkiClassification } from './useSkiClassification';

// FE-TOUR-SKI-HOOK-001 to FE-TOUR-SKI-HOOK-005

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../repo/tourRepo', () => ({ tourRepo: { classifySki: vi.fn() } }));

const ski: TourListItem = {
  place_id: 21,
  name: 'Up to the hut',
  tour_type: 'ski',
  distance: 12,
  elevation_gain: 980,
  elevation_loss: 980,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  planned: true,
  caution: false,
  has_waypoints: false,
  revision: 3,
  ski_discipline: 'cross_country',
  ski_technique: 'unknown',
};

const viewing = (tour: TourListItem) =>
  ({ mode: { type: 'view-gpx', placeId: tour.place_id, tour } }) as Pick<TourPlannerController, 'mode'>;

function setup(overrides: { tour?: TourListItem; tours?: TourListItem[]; canEdit?: boolean } = {}) {
  const onSaved = vi.fn();
  const tour = overrides.tour ?? ski;
  const hook = renderHook(() =>
    useSkiClassification({
      tripId: 5,
      planner: viewing(tour),
      tours: overrides.tours ?? [tour],
      canEdit: overrides.canEdit ?? true,
      onSaved,
    })
  );
  return { ...hook, onSaved };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSkiClassification (SKI-02)', () => {
  it('FE-TOUR-SKI-HOOK-001: knows the ski track in view, as the trip list has it now, and nothing for another tour', () => {
    const newer = { ...ski, ski_technique: 'skating' as const, revision: 4 };
    expect(setup({ tours: [newer] }).result.current.tour).toBe(newer);
    expect(setup({ tour: { ...ski, tour_type: 'hike' } }).result.current.tour).toBeNull();
    const planned = renderHook(() =>
      useSkiClassification({
        tripId: 5,
        planner: { mode: { type: 'edit-saved', placeId: 21 } } as Pick<TourPlannerController, 'mode'>,
        tours: [ski],
        canEdit: true,
        onSaved: vi.fn(),
      })
    );
    expect(planned.result.current.tour).toBeNull();
  });

  it('FE-TOUR-SKI-HOOK-002: the dialog opens with the saved choice, saves only a complete change, and closes without one', () => {
    const { result } = setup();
    act(() => result.current.open());
    expect(result.current.draft).toEqual({ discipline: 'cross_country', technique: 'unknown' });
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setDraft({ discipline: 'cross_country', technique: null }));
    expect(result.current.canSave).toBe(false);
    act(() => result.current.setDraft({ discipline: 'touring', technique: null }));
    expect(result.current.canSave).toBe(true);
    act(() => result.current.close());
    expect(result.current.draft).toBeNull();
    expect(tourRepo.classifySki).not.toHaveBeenCalled();
  });

  it('FE-TOUR-SKI-HOOK-003: saves the classification with the revision it was made at, hands the tour on and closes', async () => {
    const saved = { ...ski, ski_technique: 'classic' as const, revision: 4 };
    vi.mocked(tourRepo.classifySki).mockResolvedValue({ tour: saved, waypoints: [] });
    const { result, onSaved } = setup();
    act(() => result.current.open());
    act(() => result.current.setDraft({ discipline: 'cross_country', technique: 'classic' }));
    await act(async () => {
      await result.current.save();
    });
    expect(tourRepo.classifySki).toHaveBeenCalledWith(5, 21, {
      ski_discipline: 'cross_country',
      ski_technique: 'classic',
      expected_revision: 3,
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(result.current.draft).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('tours.ski.saved');
  });

  it('FE-TOUR-SKI-HOOK-004: a refused save keeps the dialog and says why, a tour saved elsewhere as such', async () => {
    const conflict = new AxiosError('conflict', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { error: 'changed', code: TOUR_REVISION_CONFLICT, revision: 5 },
    });
    vi.mocked(tourRepo.classifySki).mockRejectedValueOnce(conflict).mockRejectedValueOnce(new Error('offline'));
    const { result, onSaved } = setup();
    act(() => result.current.open());
    act(() => result.current.setDraft({ discipline: 'alpine', technique: null }));
    await act(async () => {
      await result.current.save();
    });
    expect(toast.error).toHaveBeenLastCalledWith('tours.revision.conflictTitle');
    await act(async () => {
      await result.current.save();
    });
    expect(toast.error).toHaveBeenLastCalledWith('tours.ski.saveFailed');
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.draft).toEqual({ discipline: 'alpine', technique: null });
    expect(result.current.saving).toBe(false);
  });

  it('FE-TOUR-SKI-HOOK-005: someone who may not edit opens nothing and saves nothing', async () => {
    const { result } = setup({ canEdit: false });
    act(() => result.current.open());
    expect(result.current.draft).toBeNull();
    await act(async () => {
      await result.current.save();
    });
    expect(tourRepo.classifySki).not.toHaveBeenCalled();
  });
});
