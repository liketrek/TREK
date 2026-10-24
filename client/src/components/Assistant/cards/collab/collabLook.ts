import type { TrekCard } from '@trek/shared';
import { BarChart3, MessageCircle, StickyNote } from 'lucide-react';

import type { EntityTarget, PackLook } from '../cardTypes';

/**
 * What the trip chat, polls and notes bring to the chat's pure look: the tool
 * names of their changes (the verbs stay add, change and remove), the steps
 * of their reads, what an applied change of theirs opens (the Collab tab, on
 * its chat, polls or notes) and the look of each of their kinds. A look stays
 * pure, icons and literals only: the chat's main chunk reads every look, so
 * whatever a look imports ships with it.
 */

export const CHAT_TARGET: EntityTarget = { kind: 'tab', tab: 'collab', sub: 'chat' };
export const POLLS_TARGET: EntityTarget = { kind: 'tab', tab: 'collab', sub: 'polls' };
export const NOTES_TARGET: EntityTarget = { kind: 'tab', tab: 'collab', sub: 'notes' };

/** The one poll or note a card holds, by its id; none for a list or a thing not saved yet. */
function soleId(card: TrekCard): number | null {
  if (card.kind === 'collabPolls') return card.polls.length === 1 ? (card.polls[0]?.pollId ?? null) : null;
  if (card.kind === 'collabNotes') return card.notes.length === 1 ? (card.notes[0]?.noteId ?? null) : null;
  return null;
}

/**
 * A read that only looked up the one poll or note a change of the same
 * answer then touches (the poll it votes in, the note it edits) gives way to
 * the change card, which shows it already. A list stays, and so does the
 * chat: the messages around a reaction are what the user asked to see.
 */
export function readServedChange(answer: TrekCard, change: TrekCard): boolean {
  const id = soleId(answer);
  return id !== null && answer.kind === change.kind && soleId(change) === id;
}

export const COLLAB_LOOK = {
  verbs: {},
  tools: {
    delete_collab_message: { labelKey: 'assistant.tool.delete_collab_message' },
    react_collab_message: { labelKey: 'assistant.tool.react_collab_message' },
    create_collab_poll: { labelKey: 'assistant.tool.create_collab_poll' },
    vote_collab_poll: { labelKey: 'assistant.tool.vote_collab_poll' },
    close_collab_poll: { labelKey: 'assistant.tool.close_collab_poll' },
    delete_collab_poll: { labelKey: 'assistant.tool.delete_collab_poll' },
    create_collab_note: { labelKey: 'assistant.tool.create_collab_note' },
    update_collab_note: { labelKey: 'assistant.tool.update_collab_note' },
    delete_collab_note: { labelKey: 'assistant.tool.delete_collab_note' },
  },
  steps: {
    list_collab_messages: { stepKey: 'assistant.step.collabChat' },
    list_collab_polls: { stepKey: 'assistant.step.collabPolls' },
    list_collab_notes: { stepKey: 'assistant.step.collabNotes' },
  },
  entities: {
    collab_message: { Icon: MessageCircle, openLabelKey: 'assistant.card.collab.openChat', open: () => CHAT_TARGET },
    collab_poll: { Icon: BarChart3, openLabelKey: 'assistant.card.collab.openPolls', open: () => POLLS_TARGET },
    collab_note: { Icon: StickyNote, openLabelKey: 'assistant.card.collab.openNotes', open: () => NOTES_TARGET },
  },
  cards: {
    collabChat: { entity: () => 'collab_message' },
    collabPolls: { entity: () => 'collab_poll', yieldsToChange: readServedChange },
    collabNotes: { entity: () => 'collab_note', yieldsToChange: readServedChange },
  },
} satisfies PackLook<'collabChat' | 'collabPolls' | 'collabNotes'>;
