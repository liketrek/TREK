import type { CardEntry } from '../cardTypes';
import TourRouteCard from './TourRouteCard';
import { routeEntries, wayGroups } from './tourRouteModel';
import TourWays from './TourWays';

/**
 * The routes of one answer: two or three ways of one route proposed together
 * as one card to choose from, every other route (a saved tour, a paddle or a
 * ski plan, a single proposal) as a card of its own.
 */
export default function TourRouteBlock({ cards }: { cards: readonly CardEntry[] }) {
  const groups = wayGroups(routeEntries(cards));
  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const first = group[0];
        if (!first) return null;
        if (group.length >= 2) return <TourWays key={first.toolCallId} entries={group} />;
        return <TourRouteCard key={first.toolCallId} toolCallId={first.toolCallId} card={first.card} />;
      })}
    </div>
  );
}
