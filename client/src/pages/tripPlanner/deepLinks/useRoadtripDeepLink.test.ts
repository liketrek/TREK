/**
 * FE-AI-RT-040
 *
 * The chat's link into the road trip: on the desktop, where the road trip
 * is a view of the plan, `?tab=roadtrip` switches that view on, once and
 * never off; the phone's road trip tab, a view already on and a planner
 * without the addon are left as they are.
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DeepLinkProps } from './deepLinkTypes';
import { useRoadtripDeepLink } from './useRoadtripDeepLink';

function links(query: string, planner: Record<string, unknown>): DeepLinkProps {
  return {
    planner: planner as unknown as DeepLinkProps['planner'],
    workspace: {} as DeepLinkProps['workspace'],
    searchParams: new URLSearchParams(query),
    setSearchParams: vi.fn(),
  };
}

function plannerOf(over: Record<string, unknown> = {}) {
  return {
    TRIP_TABS: [{ id: 'plan' }],
    enabledAddons: { roadtrip: true },
    roadtripMode: false,
    toggleRoadtripMode: vi.fn(),
    ...over,
  };
}

describe('useRoadtripDeepLink', () => {
  it('FE-AI-RT-040: switches the road trip view on for ?tab=roadtrip on the desktop, and only there', () => {
    const desktop = plannerOf();
    renderHook(() => useRoadtripDeepLink(links('?tab=roadtrip&day=31', desktop)));
    expect(desktop.toggleRoadtripMode).toHaveBeenCalledTimes(1);

    const on = plannerOf({ roadtripMode: true });
    renderHook(() => useRoadtripDeepLink(links('?tab=roadtrip', on)));
    expect(on.toggleRoadtripMode).not.toHaveBeenCalled();

    const phone = plannerOf({ TRIP_TABS: [{ id: 'plan' }, { id: 'roadtrip' }] });
    renderHook(() => useRoadtripDeepLink(links('?tab=roadtrip', phone)));
    expect(phone.toggleRoadtripMode).not.toHaveBeenCalled();

    const off = plannerOf({ enabledAddons: { roadtrip: false } });
    renderHook(() => useRoadtripDeepLink(links('?tab=roadtrip', off)));
    expect(off.toggleRoadtripMode).not.toHaveBeenCalled();

    const other = plannerOf();
    renderHook(() => useRoadtripDeepLink(links('?tab=buchungen', other)));
    expect(other.toggleRoadtripMode).not.toHaveBeenCalled();
  });
});
