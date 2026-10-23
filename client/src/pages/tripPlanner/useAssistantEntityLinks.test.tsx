/**
 * FE-PLANNER-ENTITYLINK-001 to FE-PLANNER-ENTITYLINK-002
 *
 * The links the chat opens the planner with while it is on screen: another
 * tab of the trip switches there and leaves the URL, and the parts' own links
 * (tours, bookings, road trip) are each handed the planner, the workspace and
 * the query (each part's own test covers what it does with them).
 */
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { useAssistantEntityLinks } from './useAssistantEntityLinks';

const parts = vi.hoisted(() => ({ tour: vi.fn(), booking: vi.fn(), roadtrip: vi.fn() }));
vi.mock('./deepLinks/useTourDeepLink', () => ({ useTourDeepLink: parts.tour }));
vi.mock('./deepLinks/useBookingDeepLink', () => ({ useBookingDeepLink: parts.booking }));
vi.mock('./deepLinks/useRoadtripDeepLink', () => ({ useRoadtripDeepLink: parts.roadtrip }));

type Options = Parameters<typeof useAssistantEntityLinks>[0];

function setup(path: string) {
  const planner = { activeTab: 'plan', handleTabChange: vi.fn() } as unknown as Options['planner'];
  const workspace = {} as Options['workspace'];
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
  const hook = renderHook(
    () => {
      useAssistantEntityLinks({ planner, workspace });
      return useLocation();
    },
    { wrapper }
  );
  return { planner, hook };
}

describe('useAssistantEntityLinks', () => {
  it('FE-PLANNER-ENTITYLINK-001: another tab switches there and leaves the URL, what it reads stays', () => {
    const { planner, hook } = setup('/trips/5?tab=finanzplan&expense=7');
    expect(planner.handleTabChange).toHaveBeenCalledWith('finanzplan');
    expect(hook.result.current.search).toBe('?expense=7');
  });

  it("FE-PLANNER-ENTITYLINK-002: each part's own link gets the planner, the workspace and the query; nothing switches without a tab", () => {
    const { planner, hook } = setup('/trips/5?tour=12');
    expect(planner.handleTabChange).not.toHaveBeenCalled();
    expect(hook.result.current.search).toBe('?tour=12');
    for (const part of [parts.tour, parts.booking, parts.roadtrip]) {
      const links = part.mock.lastCall?.[0] as { planner: unknown; searchParams: URLSearchParams };
      expect(links.planner).toBe(planner);
      expect(links.searchParams.get('tour')).toBe('12');
    }
  });
});
