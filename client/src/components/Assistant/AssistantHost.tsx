import { useCallback, useMemo } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router';

import { rememberListsSubTab } from '../../hooks/useListsSubTab';
import { useTripStore } from '../../store/tripStore';
import AssistantWindow from './AssistantWindow';
import { plannerSearchOf } from './assistantShowOnMap';
import type { EntityTarget } from './cards/cardTypes';

/** The trip a route under /trips/:id shows, or null anywhere else. */
function useRouteTripId(): number | null {
  const match = useMatch('/trips/:id/*');
  const id = Number(match?.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * The desktop assistant, mounted once above the routes so a conversation
 * keeps going from page to page. Inside a trip it is about that trip; what a
 * card or an applied change opens goes through the planner's links: "Show on
 * map" opens the planner on the change (`?place=`, `?day=`), the same way a
 * notification opens a place, a tab of the trip opens as `?tab=` (a list's
 * own tab remembered first), and another page is simply navigated to. A day
 * picked in the chat (its weather) selects that day the same way, and "On
 * map" on a card brings the planner's map back first.
 */
export default function AssistantHost() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tripId = useRouteTripId();
  // The title is there once the planner has loaded the trip; the window waits for nothing else.
  const title = useTripStore((s) => (s.trip && s.trip.id === tripId ? s.trip.title : ''));
  const trip = useMemo(() => (tripId === null ? null : { id: tripId, title }), [tripId, title]);

  const openPlanner = useCallback(
    (search: string) => {
      if (tripId === null) return;
      const planner = `/trips/${tripId}`;
      void navigate({ pathname: planner, search }, { replace: pathname === planner });
    },
    [navigate, pathname, tripId]
  );
  const open = useCallback(
    (target: EntityTarget) => {
      if (target.kind === 'page') {
        void navigate(target.path);
        return;
      }
      if (target.kind === 'tab' && target.tab === 'listen' && tripId !== null) {
        if (target.sub === 'packing' || target.sub === 'todo') rememberListsSubTab(tripId, target.sub);
      }
      openPlanner(plannerSearchOf(target));
    },
    [navigate, openPlanner, tripId]
  );
  const focusDay = useCallback((dayId: number) => openPlanner(`?day=${dayId}`), [openPlanner]);
  // "On map" from another tab of the planner (Tours, Costs, ...) first brings the map back.
  const revealMap = useCallback(() => openPlanner('?tab=plan'), [openPlanner]);

  return <AssistantWindow trip={trip} onOpen={open} onFocusDay={focusDay} onRevealMap={revealMap} />;
}
