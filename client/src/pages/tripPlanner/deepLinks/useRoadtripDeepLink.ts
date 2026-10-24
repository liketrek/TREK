import { useEffect } from 'react';

import type { DeepLinkProps } from './deepLinkTypes';

/**
 * Where the chat opens the road trip (`?tab=roadtrip`, with `?day=` for the
 * day a change touched). The phone has a road trip tab and the tab link takes
 * it there; the desktop has none, the road trip being a view of the plan, so
 * the link switches that view on, once and never off, and the plan's tab
 * shows it. A planner without the road trip addon stays as it is.
 */
export function useRoadtripDeepLink({ planner, searchParams }: DeepLinkProps): void {
  const asked = searchParams.get('tab') === 'roadtrip';
  const hasTab = planner.TRIP_TABS.some((tab) => tab.id === 'roadtrip');
  const addonOn = !!planner.enabledAddons.roadtrip;
  const { roadtripMode, toggleRoadtripMode } = planner;

  useEffect(() => {
    if (!asked || hasTab || !addonOn || roadtripMode) return;
    toggleRoadtripMode();
  }, [asked, hasTab, addonOn, roadtripMode, toggleRoadtripMode]);
}
