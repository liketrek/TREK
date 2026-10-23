/**
 * FE-AI-FOLLOW-001 to FE-AI-FOLLOW-007
 *
 * The follow-ups a card offers under an answer that ends on it: the ones that
 * ask for a change only for someone who may make it, the answer's own when
 * none is left for a reader, and the ones with a condition only when a card of
 * the answer meets it. The questions the model offered win over all of them; a
 * change asks what its own kind offers, the day plan's questions come only
 * after a change to the day plan, and an answer that asks the user something
 * offers no "tell me more".
 */
import type { AssistantChangePreview, AssistantMessage, TrekCard } from '@trek/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { followUpsFor } from './assistantFollowUpRules';
import { CARD_LOOKS } from './cards/cardLooks';

const answer: AssistantMessage = {
  id: 'a1',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-22T08:00:00.000Z',
  parts: [
    { type: 'text', text: 'Here is your year.' },
    { type: 'tool-call', toolCallId: 'r1', toolName: 'get_vacay_plan', args: {}, result: {} },
    { type: 'data-trek-card', data: { toolCallId: 'r1', card: { kind: 'vacay' } as TrekCard } },
  ],
};

afterEach(() => {
  delete CARD_LOOKS.vacay.followUps;
});

describe('card follow-ups', () => {
  it('FE-AI-FOLLOW-001: a follow-up that asks for a change is offered only to someone who may make it', () => {
    CARD_LOOKS.vacay.followUps = [
      { id: 'planDays', labelKey: 'assistant.followUp.next', edits: true },
      { id: 'holidays', labelKey: 'assistant.followUp.more' },
    ];
    expect(followUpsFor(answer, true).map((f) => f.id)).toEqual(['planDays', 'holidays']);
    expect(followUpsFor(answer, false).map((f) => f.id)).toEqual(['holidays']);
  });

  it('FE-AI-FOLLOW-002: with no card follow-up left for a reader, the answer offers its own', () => {
    CARD_LOOKS.vacay.followUps = [{ id: 'planDays', labelKey: 'assistant.followUp.next', edits: true }];
    expect(followUpsFor(answer, false).map((f) => f.id)).toEqual(['more', 'next']);
  });

  it('FE-AI-FOLLOW-003: a follow-up with a condition is offered only when a card of the answer meets it', () => {
    const asked: TrekCard[] = [];
    CARD_LOOKS.vacay.followUps = [
      { id: 'planDays', labelKey: 'assistant.followUp.next', when: () => false },
      {
        id: 'holidays',
        labelKey: 'assistant.followUp.more',
        when: (card) => {
          asked.push(card);
          return true;
        },
      },
    ];
    expect(followUpsFor(answer, true).map((f) => f.id)).toEqual(['holidays']);
    expect(asked).toEqual([{ kind: 'vacay' }]);
  });
});

/** An answer of the given parts. */
const of = (parts: AssistantMessage['parts']): AssistantMessage => ({ ...answer, parts });

/** A proposed change, with the card of what it does. */
const change = (card?: TrekCard): AssistantChangePreview => ({
  toolCallId: 'c1',
  verbKey: 'addPlace',
  subject: 'Something',
  rows: [],
  dayId: null,
  placeIds: [],
  undoable: true,
  ...(card ? { card } : {}),
});

describe('the questions an answer offers', () => {
  it('FE-AI-FOLLOW-004: the questions the model offered win, sent as written, the last offer only', () => {
    const offered = of([
      { type: 'text', text: 'Done.' },
      { type: 'data-trek-follow-ups', data: { questions: ['Old'] } },
      { type: 'data-trek-follow-ups', data: { questions: ['An easier variant', 'What to pack?'] } },
    ]);
    expect(followUpsFor(offered, true).map((f) => f.text)).toEqual(['An easier variant', 'What to pack?']);
  });

  it('FE-AI-FOLLOW-005: a proposed tour asks about the tour, never to plan the next day the same way', () => {
    const tour = { kind: 'tourRoute', source: 'proposal', activity: 'hike' } as TrekCard;
    const ids = followUpsFor(of([{ type: 'data-trek-change', data: change(tour) }]), true).map((f) => f.id);
    expect(ids).toContain('tourEasier');
    expect(ids).not.toContain('nextDay');
  });

  it('FE-AI-FOLLOW-006: an applied expense offers the general questions, an applied stop the day plan', () => {
    const applied = (entity: 'budget' | 'assignment') =>
      of([
        { type: 'text', text: 'Added.' },
        {
          type: 'data-trek-applied',
          data: { toolCallId: 'c1', entity, ids: [1], dayId: null, undoUntil: null },
        },
      ]);
    expect(followUpsFor(applied('budget'), true).map((f) => f.id)).toEqual(['more', 'next']);
    expect(followUpsFor(applied('assignment'), true).map((f) => f.id)).toContain('nextDay');
  });

  it('FE-AI-FOLLOW-007: an answer that asks the user something waits for their answer, not for "tell me more"', () => {
    expect(followUpsFor(of([{ type: 'text', text: 'Should I plan it anyway?' }]), true)).toEqual([]);
    expect(followUpsFor(of([{ type: 'text', text: 'Here it is.' }]), true).map((f) => f.id)).toEqual(['more', 'next']);
  });
});
