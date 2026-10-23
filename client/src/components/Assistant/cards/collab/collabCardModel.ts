import type { CollabBubbleCard, CollabNoteCard, CollabPollCard } from '@trek/shared';

import { isPollExpired, parseUtcDate } from '../../../Collab/collabModel';
import type { ChangeState } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';

/**
 * The pure side of the trip chat's cards: how the bubbles of several reads
 * of one answer merge, how a run of bubbles groups the way the chat groups
 * them, and what a poll shows of its results. No component here, so the
 * tests read it without a render.
 */

/**
 * The bubbles of an answer's chat cards in one thread: each message once,
 * in the order they were written, a message still waiting to be sent last;
 * the older messages the reads left out are counted once.
 */
export function mergedChat(cards: readonly CardEntry[]): { messages: CollabBubbleCard[]; earlier: number } {
  const byId = new Map<number, CollabBubbleCard>();
  const waiting: CollabBubbleCard[] = [];
  let earlier = 0;
  for (const { card } of cards) {
    if (card.kind !== 'collabChat') continue;
    earlier = Math.max(earlier, card.earlier);
    for (const bubble of card.messages) {
      if (bubble.id === null) waiting.push(bubble);
      else byId.set(bubble.id, bubble);
    }
  }
  const sent = [...byId.values()].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '') || (a.id ?? 0) - (b.id ?? 0));
  return { messages: [...sent, ...waiting], earlier };
}

/** Where a bubble stands in its run, as the chat lays it out. */
export interface BubbleSpot {
  /** The first of the sender's run: their name goes over it. */
  newGroup: boolean;
  /** The last of the sender's run: it gets the tail, the face and the time. */
  lastInGroup: boolean;
  /** The day changes before it. */
  newDay: boolean;
}

function dayOf(at: string | null): string | null {
  return at === null ? null : parseUtcDate(at).toDateString();
}

export function spotOf(messages: readonly CollabBubbleCard[], index: number): BubbleSpot {
  const bubble = messages[index];
  const before = messages[index - 1];
  const after = messages[index + 1];
  const day = dayOf(bubble?.at ?? null);
  return {
    newGroup: !before || before.author.id !== bubble?.author.id,
    lastInGroup: !after || after.author.id !== bubble?.author.id,
    newDay: day !== null && (!before || dayOf(before.at) !== day),
  };
}

/** What stands in a bubble's time slot while its change is open or once it was decided. */
type BubbleStatus = 'time' | 'waiting' | 'sent' | 'failed' | 'none';

/** The time slot of a bubble: a held send says it is not sent yet, then sent or failed, a dropped one nothing. */
export function bubbleStatus(bubble: CollabBubbleCard, state: ChangeState | null): BubbleStatus {
  if (bubble.change !== 'send' || state === null) return bubble.at ? 'time' : 'none';
  if (state === 'pending' || state === 'applying') return 'waiting';
  if (state === 'applied') return 'sent';
  if (state === 'failed') return 'failed';
  return 'none';
}

/** What a poll shows of its outcome, by PollCard's rules. */
interface PollOutcome {
  total: number;
  /** Closed by hand or past its deadline. */
  ended: boolean;
  /** Shares and voters show once the user voted or the poll ended. */
  showResults: boolean;
  /** The most votes one option has. */
  top: number;
}

export function pollOutcome(poll: CollabPollCard): PollOutcome {
  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const ended = poll.closed || isPollExpired(poll.deadline);
  const top = poll.options.reduce((max, option) => Math.max(max, option.votes), 0);
  return { total, ended, showResults: ended || poll.options.some((option) => option.mine), top };
}

/** An option's share of the votes, in whole percent. */
export function shareOf(votes: number, total: number): number {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

/** Whether a change row's card is still waiting, or settled without being applied. */
export function isOpen(state: ChangeState | null): boolean {
  return state === 'pending' || state === 'applying';
}

export function isDropped(state: ChangeState | null): boolean {
  return state === 'discarded' || state === 'expired' || state === 'failed';
}

/** Whether a note's part is one the held change sets to something new. */
export function isChanged(note: CollabNoteCard, field: CollabNoteCard['changed'][number]): boolean {
  return note.change === 'update' && note.changed.includes(field);
}
