import type { PlannerSearchParams } from '../plannerTypes';
import type { useTourWorkspace } from '../useTourWorkspace';
import type { useTripPlanner } from '../useTripPlanner';

/**
 * What a part of TREK's deep link into the planner gets: the planner, the
 * tour workspace and the URL's query, so a link the chat opened (`?tour=`,
 * `?booking=`, `?stop=`) can be taken once and dropped.
 */
export interface DeepLinkProps {
  planner: ReturnType<typeof useTripPlanner>;
  workspace: ReturnType<typeof useTourWorkspace>;
  searchParams: PlannerSearchParams[0];
  setSearchParams: PlannerSearchParams[1];
}
