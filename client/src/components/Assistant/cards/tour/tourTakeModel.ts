import type { AssistantChangePreview, AssistantMessage, TourRouteCard } from '@trek/shared';

/**
 * Whether a proposal was already taken ("Plan this"), read from the thread
 * rather than from the card, so a card drawn again (the chat reopened, the
 * thread loaded anew, a long answer scrolled away and back) does not offer
 * the same tour twice. The change the server holds names the proposal it was
 * taken from (`takenFrom`); one held before it did is matched by its way.
 */

/** The tool a change held by "Plan this" runs under, as the server names it. */
const TAKE_TOOL = 'take_proposal';

/** Whether two routes are one way: one activity, as many points, the same ends. */
function sameWay(a: TourRouteCard, b: TourRouteCard): boolean {
  if (a.activity !== b.activity || a.line.length !== b.line.length || a.stops.length !== b.stops.length) return false;
  const ends = (card: TourRouteCard) =>
    [card.line[0], card.line[card.line.length - 1]].map((point) => point?.slice(0, 2).join(','));
  const [aStart, aEnd] = ends(a);
  const [bStart, bEnd] = ends(b);
  return aStart === bStart && aEnd === bEnd;
}

/** Whether a held take came from the proposal: by the proposal it names, or, held before it named one, by its way. */
function takenFromProposal(change: AssistantChangePreview, toolCallId: string, card: TourRouteCard): boolean {
  if (change.takenFrom !== undefined) return change.takenFrom === toolCallId;
  return change.card?.kind === 'tourRoute' && sameWay(change.card, card);
}

/** The index of the answer that drew the proposal's card; -1 when the thread no longer holds it. */
function proposalIndex(messages: readonly AssistantMessage[], toolCallId: string): number {
  return messages.findIndex((message) =>
    message.parts.some((part) => part.type === 'data-trek-card' && part.data.toolCallId === toolCallId)
  );
}

/** Where a take of the proposal stands in the thread: waiting for a decision, applied, or none. */
type ThreadTake = 'waiting' | 'applied' | null;

/** The take a later answer holds for the proposal, with the id of its change; null when none waits or was applied. */
export function takeOfProposal(
  messages: readonly AssistantMessage[],
  toolCallId: string,
  card: TourRouteCard
): { id: string; state: 'waiting' | 'applied'; placeId: number | null } | null {
  const from = proposalIndex(messages, toolCallId);
  if (from < 0) return null;
  for (const message of messages.slice(from + 1)) {
    const open = new Map<string, 'waiting' | 'applied'>();
    for (const part of message.parts) {
      if (part.type !== 'tool-call' || part.toolName !== TAKE_TOOL || part.approval?.resolution) continue;
      if (part.approval?.approved !== false) open.set(part.toolCallId, part.approval?.approved ? 'applied' : 'waiting');
    }
    for (const part of message.parts) {
      if (part.type !== 'data-trek-change') continue;
      const state = open.get(part.data.toolCallId);
      if (!state || !takenFromProposal(part.data, toolCallId, card)) continue;
      const id = part.data.toolCallId;
      const receipt = message.parts.find((p) => p.type === 'data-trek-applied' && p.data.toolCallId === id);
      const placeId = receipt?.type === 'data-trek-applied' ? (receipt.data.ids[0] ?? null) : null;
      return { id, state, placeId };
    }
  }
  return null;
}

/**
 * The take a later answer holds for the proposal, still waiting or applied.
 * One discarded, cancelled or expired leaves the proposal free to be taken
 * again.
 */
export function takeInThread(
  messages: readonly AssistantMessage[],
  toolCallId: string,
  card: TourRouteCard
): ThreadTake {
  return takeOfProposal(messages, toolCallId, card)?.state ?? null;
}
