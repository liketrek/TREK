/**
 * FE-AI-MSG-CARDS-001 to 005
 *
 * The places and the weather a step found are stored parts of the answer,
 * like a change card: they land in the message being written, and a chunk
 * sent again for the same search step replaces its part instead of adding a
 * second strip. A tool's card lands the same way, except an applied write's,
 * which joins the change that proposed it.
 */
import type { AssistantMessage, AssistantPlaces, TrekCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { applyChunk } from './assistantMessages';

const NOW = () => '2026-10-21T08:00:00.000Z';

const PLACES: AssistantPlaces = {
  toolCallId: 'search-1',
  places: [
    {
      ref: 'search-1:0',
      name: 'Da Enzo',
      address: null,
      lat: 41.88,
      lng: 12.47,
      kind: 'food',
      rating: 4.6,
      openNow: null,
      googlePlaceId: null,
      osmId: null,
      photoKey: null,
      inTripPlaceId: null,
    },
  ],
  more: 3,
};

function started(): AssistantMessage[] {
  return applyChunk([], { type: 'start', messageId: 'msg-1' }, NOW);
}

describe('assistantMessages: cards in an answer', () => {
  it('FE-AI-MSG-CARDS-001: the places of one step are one part, replaced when the step sends them again', () => {
    let messages = applyChunk(started(), { type: 'data-trek-places', data: PLACES }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-places', data: { ...PLACES, more: 0 } }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-places', data: { ...PLACES, toolCallId: 'search-2' } }, NOW);
    const parts = messages[0]?.parts ?? [];
    expect(parts.map((p) => (p.type === 'data-trek-places' ? [p.data.toolCallId, p.data.more] : p.type))).toEqual([
      ['search-1', 0],
      ['search-2', 3],
    ]);
  });

  it('FE-AI-MSG-CARDS-002: the weather lands in the answer; the live activity never does', () => {
    let messages = applyChunk(
      started(),
      {
        type: 'data-trek-weather',
        data: {
          days: [
            { dayId: 3, date: '2026-10-22', main: 'Clear', tempMax: 21, tempMin: 12, rainPct: 10, kind: 'forecast' },
          ],
        },
      },
      NOW
    );
    messages = applyChunk(
      messages,
      { type: 'data-trek-activity', data: { toolCallId: 'w', label: 'Rome', area: null }, transient: true },
      NOW
    );
    expect(messages[0]?.parts.map((p) => p.type)).toEqual(['data-trek-weather']);
  });

  const ROUTE = { kind: 'tourRoute' } as TrekCard;
  const LIST = { kind: 'tourList' } as TrekCard;
  const cardsOf = (message: AssistantMessage | undefined) =>
    message?.parts.flatMap((p) => (p.type === 'data-trek-card' ? [p.data] : [])) ?? [];

  it('FE-AI-MSG-CARDS-003: a read card lands in the answer, replaced when sent again; a null card is skipped', () => {
    let messages = started();
    messages = applyChunk(messages, { type: 'data-trek-card', data: { toolCallId: 'r1', card: ROUTE } }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-card', data: { toolCallId: 'r1', card: LIST } }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-card', data: { toolCallId: 'r2', card: null } }, NOW);
    expect(cardsOf(messages[0])).toEqual([{ toolCallId: 'r1', card: LIST }]);
  });

  it('FE-AI-MSG-CARDS-004: in the decisions stream an applied card joins the message that proposed the change', () => {
    const proposing: AssistantMessage = {
      id: 'msg-1',
      role: 'assistant',
      status: 'awaiting_approval',
      createdAt: NOW(),
      parts: [{ type: 'tool-call', toolCallId: 'w1', toolName: 'create_hike', args: {}, approval: { id: 'w1' } }],
    };
    let messages = applyChunk([proposing], { type: 'start', messageId: 'msg-2' }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-card', data: { toolCallId: 'w1', card: ROUTE } }, NOW);
    expect(cardsOf(messages[0])).toEqual([{ toolCallId: 'w1', card: ROUTE }]);
    expect(cardsOf(messages[1])).toEqual([]);
  });

  it('FE-AI-MSG-CARDS-005: a card under a call that holds no change stays in the message being written', () => {
    const earlier: AssistantMessage = {
      id: 'msg-1',
      role: 'assistant',
      status: 'complete',
      createdAt: NOW(),
      parts: [{ type: 'tool-call', toolCallId: 'r1', toolName: 'list_tours', args: {} }],
    };
    let messages = applyChunk([earlier], { type: 'start', messageId: 'msg-2' }, NOW);
    messages = applyChunk(messages, { type: 'data-trek-card', data: { toolCallId: 'r1', card: LIST } }, NOW);
    expect(cardsOf(messages[0])).toEqual([]);
    expect(cardsOf(messages[1])).toEqual([{ toolCallId: 'r1', card: LIST }]);
  });
});
