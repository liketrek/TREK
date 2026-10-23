/**
 * FE-AI-STORE-CARDS-001 to FE-AI-STORE-CARDS-005
 *
 * What the store keeps for the cards: the spot of a route the card and the
 * map share, a line a card asks the map to draw, the route the phone peeks
 * at, the way picked per block, all gone when the chat closes or changes;
 * and "Plan this", which joins the held change to the answer it belongs to.
 */
import type { AssistantMessage } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assistantRepo } from '../repo/assistantRepo';
import { chatOf, useAssistantStore } from './assistantStore';

const TRIP = 4;
const INITIAL = useAssistantStore.getState();
const store = () => useAssistantStore.getState();
const focus = { distanceMeters: 1200, elevationMeters: 840, lat: 45.1, lng: 7.2, sampleIndex: 12 };

const answer = (parts: AssistantMessage['parts']): AssistantMessage => ({
  id: 'msg-1',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-22T08:00:00.000Z',
  parts,
});

function seedThread(messages: AssistantMessage[] = []) {
  useAssistantStore.setState({ byTrip: { [TRIP]: { ...chatOf(store(), TRIP), threadId: 7, messages } } });
}

beforeEach(() => useAssistantStore.setState(INITIAL, true));
afterEach(() => vi.restoreAllMocks());

describe('assistantStore: cards', () => {
  it('FE-AI-STORE-CARDS-001: a route spot changes only when it moves, and a line only when it is another one', () => {
    const seen = vi.fn();
    const stop = useAssistantStore.subscribe(seen);
    store().setRouteFocus({ tripId: TRIP, ref: 'r1', focus, source: 'card' });
    store().setRouteFocus({ tripId: TRIP, ref: 'r1', focus: { ...focus }, source: 'card' });
    expect(seen).toHaveBeenCalledTimes(1);
    store().setRouteFocus({ tripId: TRIP, ref: 'r1', focus: { ...focus, sampleIndex: 13 }, source: 'map' });
    expect(store().routeFocus?.source).toBe('map');

    const line = { tripId: TRIP, ref: 'day-2', lines: [[[45, 7] as [number, number]]], color: 'var(--accent)' };
    store().setRoutePreview(line);
    store().setRoutePreview({ ...line });
    store().setRoutePreview(null);
    store().setRoutePreview(null);
    expect(seen).toHaveBeenCalledTimes(4);
    expect(store().routePreview).toBeNull();
    stop();
  });

  it('FE-AI-STORE-CARDS-002: the way picked is kept per block of the chat', () => {
    seedThread();
    store().pick(TRIP, 'block-1', 'r2');
    store().pick(TRIP, 'block-2', 'r5');
    store().pick(TRIP, 'block-1', 'r3');
    expect(chatOf(store(), TRIP).picks).toEqual({ 'block-1': 'r3', 'block-2': 'r5' });
  });

  it('FE-AI-STORE-CARDS-003: closing, a new chat and another thread leave the map without the cards', async () => {
    const fill = () => {
      store().setRouteFocus({ tripId: TRIP, ref: 'r1', focus, source: 'card' });
      store().setRoutePreview({ tripId: TRIP, ref: 'day-2', lines: [], color: 'var(--accent)' });
      store().setRoutePeek({ tripId: TRIP, toolCallId: 'r1' });
    };
    const empty = () => ({ focus: store().routeFocus, line: store().routePreview, peek: store().routePeek });
    const none = { focus: null, line: null, peek: null };
    fill();
    expect(store().routePeek).toEqual({ tripId: TRIP, toolCallId: 'r1' });
    store().close();
    expect(empty()).toEqual(none);

    fill();
    store().newThread(TRIP);
    expect(empty()).toEqual(none);

    fill();
    vi.spyOn(assistantRepo, 'thread').mockResolvedValueOnce({ messages: [] } as never);
    const opening = store().openThread(TRIP, 9);
    expect(empty()).toEqual(none);
    await opening;
  });

  it('FE-AI-STORE-CARDS-004: "Plan this" joins the held change to its answer, and says why when it cannot', async () => {
    seedThread([answer([{ type: 'text', text: 'Three ways up.' }])]);
    const held = answer([
      { type: 'text', text: 'Three ways up.' },
      { type: 'tool-call', toolCallId: 'w1', toolName: 'create_hike', args: {}, approval: { id: 'w1' } },
    ]);
    const take = vi.spyOn(assistantRepo, 'takeProposal').mockResolvedValueOnce({ message: held });
    await expect(store().takeProposal(TRIP, 'r1')).resolves.toBe('held');
    expect(take).toHaveBeenCalledWith(TRIP, 7, expect.objectContaining({ toolCallId: 'r1' }));
    expect(chatOf(store(), TRIP).messages).toEqual([held]);

    vi.spyOn(assistantRepo, 'takeProposal').mockRejectedValueOnce({ response: { status: 429 } });
    await expect(store().takeProposal(TRIP, 'r1')).resolves.toBe('refused');
    expect(chatOf(store(), TRIP).error).toBe('too_many_requests');
  });

  it('FE-AI-STORE-CARDS-005: "Plan this" says it held nothing while a turn runs or after the thread changed under it', async () => {
    seedThread([answer([{ type: 'text', text: 'Three ways up.' }])]);
    const held = answer([{ type: 'text', text: 'Three ways up.' }]);
    const take = vi.spyOn(assistantRepo, 'takeProposal').mockImplementationOnce(async () => {
      useAssistantStore.setState({ byTrip: { [TRIP]: { ...chatOf(store(), TRIP), threadId: 8 } } });
      return { message: held };
    });
    await expect(store().takeProposal(TRIP, 'r1')).resolves.toBe('skipped');
    expect(take).toHaveBeenCalledTimes(1);

    useAssistantStore.setState({ byTrip: { [TRIP]: { ...chatOf(store(), TRIP), isRunning: true } } });
    await expect(store().takeProposal(TRIP, 'r1')).resolves.toBe('skipped');
    expect(take).toHaveBeenCalledTimes(1);
  });
});
