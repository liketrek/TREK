import { useSearchParams } from 'react-router';

import { useBookingDeepLink } from './deepLinks/useBookingDeepLink';
import { useRoadtripDeepLink } from './deepLinks/useRoadtripDeepLink';
import { useTourDeepLink } from './deepLinks/useTourDeepLink';
import { useAssistantTabLink } from './useAssistantDeepLink';
import type { useTourWorkspace } from './useTourWorkspace';
import type { useTripPlanner } from './useTripPlanner';

interface AssistantEntityLinkOptions {
  planner: ReturnType<typeof useTripPlanner>;
  workspace: ReturnType<typeof useTourWorkspace>;
}

/**
 * The links the chat opens the planner with while it is already on screen:
 * another tab of the trip (`?tab=`), and what each part of TREK opens in its
 * own tab (a tour, a booking, a stop of the road trip). Each is taken once
 * and then leaves the URL.
 */
export function useAssistantEntityLinks({ planner, workspace }: AssistantEntityLinkOptions): void {
  const [searchParams, setSearchParams] = useSearchParams();
  useAssistantTabLink({
    searchParams,
    setSearchParams,
    activeTab: planner.activeTab,
    selectTab: planner.handleTabChange,
  });
  const links = { planner, workspace, searchParams, setSearchParams };
  useTourDeepLink(links);
  useBookingDeepLink(links);
  useRoadtripDeepLink(links);
}
