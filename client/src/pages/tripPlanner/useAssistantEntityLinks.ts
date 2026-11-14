import { useSearchParams } from 'react-router';

import { useBookingDeepLink } from './deepLinks/useBookingDeepLink';
import { useRoadtripDeepLink } from './deepLinks/useRoadtripDeepLink';
import { useTourDeepLink } from './deepLinks/useTourDeepLink';
import type { useTourWorkspace } from './useTourWorkspace';
import type { useTripPlanner } from './useTripPlanner';

interface AssistantEntityLinkOptions {
  planner: ReturnType<typeof useTripPlanner>;
  workspace: ReturnType<typeof useTourWorkspace>;
}

/**
 * The links the chat opens the planner with while it is already on screen:
 * what each part of TREK opens in its own tab (a tour, a booking, a stop of
 * the road trip). Each is taken once and then leaves the URL. The shared
 * planner handles `?tab=` for both desktop and mobile.
 */
export function useAssistantEntityLinks({ planner, workspace }: AssistantEntityLinkOptions): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const links = { planner, workspace, searchParams, setSearchParams };
  useTourDeepLink(links);
  useBookingDeepLink(links);
  useRoadtripDeepLink(links);
}
