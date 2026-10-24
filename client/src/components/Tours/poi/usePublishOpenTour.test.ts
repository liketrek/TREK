/**
 * FE-TOUR-OPEN-001 to FE-TOUR-OPEN-004
 *
 * P6: the saved tour the editor has open, as the chat's "+ Tour" reads it:
 * only a saved hike or city walk the user may edit, on screen, with nothing
 * unsaved, and nothing once the editor is gone.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { setOpenTour, useOpenTourStore } from '../../../store/openTourStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { usePublishOpenTour } from './usePublishOpenTour';

type Planner = Parameters<typeof usePublishOpenTour>[0];

const planner = (over: Partial<Planner> = {}): Planner => ({
  tripId: 4,
  mode: { type: 'edit-saved', placeId: 64 } as TourPlannerController['mode'],
  name: 'Herzogstand',
  tourType: 'hike',
  hasUnsavedChanges: false,
  canEdit: true,
  ...over,
});

afterEach(() => setOpenTour(null));

describe('usePublishOpenTour', () => {
  it('FE-TOUR-OPEN-001: a saved hike open on screen is the tour a found place can go into', () => {
    renderHook(() => usePublishOpenTour(planner(), true));
    expect(useOpenTourStore.getState().open).toEqual({ tripId: 4, placeId: 64, name: 'Herzogstand' });
  });

  it('FE-TOUR-OPEN-002: none while the editor is off screen, holds unsaved changes, or the user may not edit', () => {
    const { rerender } = renderHook(({ p, shown }) => usePublishOpenTour(p, shown), {
      initialProps: { p: planner(), shown: false },
    });
    expect(useOpenTourStore.getState().open).toBeNull();
    rerender({ p: planner({ hasUnsavedChanges: true }), shown: true });
    expect(useOpenTourStore.getState().open).toBeNull();
    rerender({ p: planner({ canEdit: false }), shown: true });
    expect(useOpenTourStore.getState().open).toBeNull();
    rerender({ p: planner({ tourType: 'walk' }), shown: true });
    expect(useOpenTourStore.getState().open).toMatchObject({ placeId: 64 });
  });

  it('FE-TOUR-OPEN-003: a new draft, or a tour type that takes no stop from the chat, is none', () => {
    const { rerender } = renderHook(({ p }) => usePublishOpenTour(p, true), {
      initialProps: { p: planner({ mode: { type: 'new-draft' } as TourPlannerController['mode'] }) },
    });
    expect(useOpenTourStore.getState().open).toBeNull();
    rerender({ p: planner({ tourType: 'bike' }) });
    expect(useOpenTourStore.getState().open).toBeNull();
  });

  it('FE-TOUR-OPEN-004: the editor gone, nothing is open any more', () => {
    const { unmount } = renderHook(() => usePublishOpenTour(planner(), true));
    expect(useOpenTourStore.getState().open).not.toBeNull();
    unmount();
    expect(useOpenTourStore.getState().open).toBeNull();
  });
});
