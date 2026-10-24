// P2D-XD-01: from a tour's packing link to the trip's Lists tab, the tour's detail closed on the way.
// P2C-07: a tour saved as a new one, and why not when it cannot be.
import { act, renderHook } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { useListsSubTab } from '../../hooks/useListsSubTab';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import { useTourDetailActions } from './useTourDetailActions';
import type { useTripPlanner } from './useTripPlanner';

const repo = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock('../../repo/tourRepo', () => ({ tourRepo: repo }));

describe('useTourDetailActions', () => {
  const planner = () => ({ tripId: 5, setSelectedPlaceId: vi.fn(), handleTabChange: vi.fn() });
  const actions = (p: ReturnType<typeof planner>) =>
    renderHook(() => useTourDetailActions(p as unknown as ReturnType<typeof useTripPlanner>)).result.current;

  it('FE-TOUR-DETAIL-ACTIONS-001: opening the packing list closes the tour and switches to the Lists tab', () => {
    const p = planner();
    actions(p).onOpenPacking();
    expect(p.setSelectedPlaceId).toHaveBeenCalledWith(null);
    expect(p.handleTabChange).toHaveBeenCalledWith('listen');
  });

  it('FE-TOUR-DETAIL-ACTIONS-002: the Lists tab opens on packing even when the to-dos were last open', () => {
    sessionStorage.setItem('trip-lists-subtab-5', 'todo');
    actions(planner()).onOpenPacking();
    expect(renderHook(() => useListsSubTab(5)).result.current[0]).toBe('packing');
  });

  it('FE-TOUR-DETAIL-ACTIONS-003: a Lists tab already on screen on the to-dos switches to packing', () => {
    sessionStorage.setItem('trip-lists-subtab-5', 'todo');
    const lists = renderHook(() => useListsSubTab(5));
    expect(lists.result.current[0]).toBe('todo');
    const a = actions(planner());
    act(() => a.onOpenPacking());
    expect(lists.result.current[0]).toBe('packing');
  });

  it('FE-TOUR-DETAIL-ACTIONS-004: a copy that cannot go out says it needs a connection, any other failure that it failed', async () => {
    const toast = { success: vi.fn(), error: vi.fn() };
    const p = { ...planner(), t: (key: string) => key, toast };
    const ridge = { place_id: 40, name: 'Ridge walk' } as TourListItem;
    const a = actions(p);
    repo.copy.mockRejectedValueOnce(new OnlineOnlyError());
    await act(() => a.onSaveAsNew(ridge));
    expect(repo.copy).toHaveBeenCalledWith(5, 40, 'tours.copy.name');
    expect(toast.error).toHaveBeenLastCalledWith('tours.copy.offline');
    repo.copy.mockRejectedValueOnce(new Error('Server error'));
    await act(() => a.onSaveAsNew(ridge));
    expect(toast.error).toHaveBeenLastCalledWith('tours.copy.failed');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
