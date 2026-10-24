import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useAuthStore } from '../../store/authStore';
import { tourVisibilityScope, useTourMapVisibilityStore } from '../../store/tourMapVisibilityStore';
import { useTourMapVisibility } from './useTourMapVisibility';

const KEY = (userId: number, tripId: number) => `trek:hidden-tours:${tourVisibilityScope(userId, tripId)}`;

beforeEach(() => {
  resetAllStores();
  window.localStorage.clear();
  useTourMapVisibilityStore.setState({ scope: null, hidden: [] });
  seedStore(useAuthStore, { user: { id: 3 } as never });
});

describe('useTourMapVisibility (PR1-07)', () => {
  it('hides and shows a tour for this person in this trip, and keeps it over a reload', () => {
    const tours = new Set([10, 11]);
    const first = renderHook(() => useTourMapVisibility(7, tours));
    act(() => first.result.current.toggle(10));
    expect(first.result.current.isHidden(10)).toBe(true);
    expect(first.result.current.hiddenCount).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(KEY(3, 7)) ?? '[]')).toEqual([10]);

    // A reload reads it back.
    useTourMapVisibilityStore.setState({ scope: null, hidden: [] });
    const reloaded = renderHook(() => useTourMapVisibility(7, tours));
    expect(reloaded.result.current.isHidden(10)).toBe(true);

    act(() => reloaded.result.current.toggle(10));
    expect(reloaded.result.current.isHidden(10)).toBe(false);
    expect(window.localStorage.getItem(KEY(3, 7))).toBeNull();
  });

  it('belongs to one user and one trip only', () => {
    window.localStorage.setItem(KEY(3, 7), JSON.stringify([10]));
    expect(renderHook(() => useTourMapVisibility(8, new Set([10]))).result.current.hiddenCount).toBe(0);
    useTourMapVisibilityStore.setState({ scope: null, hidden: [] });
    seedStore(useAuthStore, { user: { id: 4 } as never });
    expect(renderHook(() => useTourMapVisibility(7, new Set([10]))).result.current.hiddenCount).toBe(0);
  });

  it('a tour that is gone hides nothing, and show all clears the choice', () => {
    window.localStorage.setItem(KEY(3, 7), JSON.stringify([10, 99, 'x', -1]));
    const { result } = renderHook(() => useTourMapVisibility(7, new Set([10, 11])));
    expect([...result.current.hiddenIds]).toEqual([10]);
    act(() => result.current.showAll());
    expect(result.current.hiddenCount).toBe(0);
    expect(window.localStorage.getItem(KEY(3, 7))).toBeNull();
  });

  it('a broken stored entry or no signed-in user shows every tour', () => {
    window.localStorage.setItem(KEY(3, 7), '{not json');
    expect(renderHook(() => useTourMapVisibility(7, new Set([10]))).result.current.hiddenCount).toBe(0);
    useTourMapVisibilityStore.setState({ scope: null, hidden: [] });
    seedStore(useAuthStore, { user: null });
    const { result } = renderHook(() => useTourMapVisibility(7, new Set([10])));
    act(() => result.current.toggle(10));
    expect(result.current.hiddenCount).toBe(0);
  });
});
