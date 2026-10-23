import type { AssistantMessage } from '@trek/shared';

import { messageBlocks } from '../assistantParts';
import type { CardEntry } from '../cards/cardTypes';
import { routeEntries, type RouteEntry, wayGroups } from '../cards/tour/tourRouteModel';

/**
 * The route the phone's peek shows, found where the chat shows it: the card,
 * and when it is one of the ways of an answer, all of them with the key the
 * chat keeps the chosen way under (the ways card's own, `tour:<first call>`).
 */
export interface PeekRoute {
  entry: RouteEntry;
  /** The ways it is one of, in the answer's order; empty for a route on its own. */
  ways: RouteEntry[];
  blockKey: string;
}

/** The ways of an answer's cards that hold the call, as the chat groups them; null when none does. */
function peekInCards(entries: readonly CardEntry[], toolCallId: string): PeekRoute | null {
  for (const group of wayGroups(routeEntries(entries))) {
    const entry = group.find((way) => way.toolCallId === toolCallId);
    if (!entry) continue;
    const ways = group.length >= 2 ? group : [];
    return { entry, ways, blockKey: `tour:${group[0]?.toolCallId ?? ''}` };
  }
  return null;
}

/** The route card of a call, laid out as the chat lays it out; null when the chat holds no route under it. */
export function peekRoute(messages: readonly AssistantMessage[], toolCallId: string): PeekRoute | null {
  for (const message of messages) {
    for (const block of messageBlocks(message, false)) {
      if (block.kind === 'cards') {
        const found = peekInCards(block.entries, toolCallId);
        if (found) return found;
      } else if (block.kind === 'change') {
        const card = block.items.find((item) => item.toolCallId === toolCallId)?.card;
        if (card?.kind === 'tourRoute') return { entry: { toolCallId, card }, ways: [], blockKey: '' };
      }
    }
  }
  return null;
}
