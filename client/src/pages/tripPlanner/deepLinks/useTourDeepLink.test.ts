/**
 * FE-AI-TOURLINK-001 to FE-AI-TOURLINK-005
 *
 * The chat's link to a saved tour (`?tour=`) on the desktop planner: the
 * Tours tab opens and then the tour, a tour the loaded list does not hold
 * yet is asked for once more and given up after three seconds, a tour being edited
 * is never discarded for it, and with Tours off or on the phone the tour
 * shows as its place. The link always leaves the URL.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeepLinkProps } from './deepLinkTypes';
import { useTourDeepLink } from './useTourDeepLink';

interface Setup {
  query?: string;
  activeTab?: string;
  tours?: { place_id: number }[];
  toursOn?: boolean;
  isMobile?: boolean;
  unsaved?: boolean;
  ready?: boolean;
}

function setup(over: Setup = {}) {
  const params = new URLSearchParams(over.query ?? '?tour=41');
  const setSearchParams = vi.fn((update: (current: URLSearchParams) => URLSearchParams) => {
    update(params);
  });
  const planner = {
    activeTab: over.activeTab ?? 'tour-planner',
    enabledAddons: { tours: over.toursOn ?? true },
    handleTabChange: vi.fn(),
    invalidateTourPlaceIds: vi.fn(),
    isMobile: over.isMobile ?? false,
    setSelectedPlaceId: vi.fn(),
    t: (key: string) => key,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    tours: over.tours ?? [{ place_id: 41 }],
    tourDataReady: over.ready ?? true,
  };
  const workspace = { openTourInPlanner: vi.fn(), tourPlanner: { hasUnsavedChanges: over.unsaved ?? false } };
  const props = (): DeepLinkProps => ({
    planner: planner as unknown as DeepLinkProps['planner'],
    workspace: workspace as unknown as DeepLinkProps['workspace'],
    searchParams: params,
    setSearchParams: setSearchParams as unknown as DeepLinkProps['setSearchParams'],
  });
  const hook = renderHook(() => useTourDeepLink(props()));
  return { params, planner, workspace, hook };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useTourDeepLink', () => {
  it('FE-AI-TOURLINK-001: on the Tours tab the tour opens and the link leaves the URL', () => {
    const { params, workspace } = setup();
    expect(workspace.openTourInPlanner).toHaveBeenCalledWith(41);
    expect(params.get('tour')).toBeNull();
  });

  it("FE-AI-TOURLINK-002: on another tab the Tours tab opens first, unless the chat's tab link is switching already", () => {
    const away = setup({ activeTab: 'plan' });
    expect(away.planner.handleTabChange).toHaveBeenCalledWith('tour-planner');
    expect(away.workspace.openTourInPlanner).not.toHaveBeenCalled();
    expect(away.params.get('tour')).toBe('41');

    away.planner.activeTab = 'tour-planner';
    away.hook.rerender();
    expect(away.workspace.openTourInPlanner).toHaveBeenCalledWith(41);

    const switching = setup({ activeTab: 'plan', query: '?tab=tour-planner&tour=41' });
    expect(switching.planner.handleTabChange).not.toHaveBeenCalled();
  });

  it('FE-AI-TOURLINK-003: a tour not in the list yet is asked for once, opens when it arrives, and is given up after three seconds', () => {
    const late = setup({ tours: [] });
    expect(late.planner.invalidateTourPlaceIds).toHaveBeenCalledTimes(1);
    late.planner.tours = [{ place_id: 41 }];
    late.hook.rerender();
    expect(late.workspace.openTourInPlanner).toHaveBeenCalledWith(41);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(late.planner.toast.error).not.toHaveBeenCalled();

    const loading = setup({ tours: [], ready: false });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(loading.planner.invalidateTourPlaceIds).not.toHaveBeenCalled();
    expect(loading.planner.toast.error).not.toHaveBeenCalled();
    expect(loading.params.get('tour')).toBe('41');

    const missing = setup({ tours: [] });
    missing.hook.rerender();
    expect(missing.planner.invalidateTourPlaceIds).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(missing.planner.toast.error).toHaveBeenCalledWith('tours.planner.openFailed');
    expect(missing.params.get('tour')).toBeNull();
    expect(missing.workspace.openTourInPlanner).not.toHaveBeenCalled();
  });

  it('FE-AI-TOURLINK-004: a tour being edited is kept, and the planner says to save or discard it first', () => {
    const { planner, workspace, params } = setup({ unsaved: true });
    expect(planner.toast.warning).toHaveBeenCalledWith('assistant.card.tour.unsaved');
    expect(workspace.openTourInPlanner).not.toHaveBeenCalled();
    expect(params.get('tour')).toBeNull();
  });

  it('FE-AI-TOURLINK-005: with Tours off or on the phone the tour shows as its place; a broken link is only dropped', () => {
    const off = setup({ toursOn: false });
    expect(off.planner.setSelectedPlaceId).toHaveBeenCalledWith(41);
    expect(off.planner.handleTabChange).not.toHaveBeenCalled();
    expect(off.params.get('tour')).toBeNull();

    const phone = setup({ isMobile: true, activeTab: 'plan' });
    expect(phone.planner.setSelectedPlaceId).toHaveBeenCalledWith(41);

    const broken = setup({ query: '?tour=abc' });
    expect(broken.params.get('tour')).toBeNull();
    expect(broken.workspace.openTourInPlanner).not.toHaveBeenCalled();
    expect(broken.planner.setSelectedPlaceId).not.toHaveBeenCalled();
  });
});
