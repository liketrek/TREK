/**
 * FE-AI-STORE-STUDIO-001 to FE-AI-STORE-STUDIO-006
 *
 * A journey's chat hosted by TREK Studio (journey-studio.md 3.1, 4.5): before
 * a question or a decision goes out the Studio writes the book's local work,
 * and the turn says the Studio draws pages; the page a turn asks for goes to
 * the host with the turn's signal; an unhosted chat sends neither; a host
 * that ends leaves a newer one in place; agreeing to page images is stored
 * for the connection; a decision waits for what a card of its chat still
 * sends (a book design's pages). The repos are faked, nothing reaches Dexie.
 */
import type { AiStatusResponse, AssistantPageRender, UiStreamChunk } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aiConnectionsRepo } from '../repo/aiConnectionsRepo';
import { assistantRepo } from '../repo/assistantRepo';
import { assistantChatKey } from './assistantChatKey';
import { type AssistantStudioHost, chatOf, useAssistantStore } from './assistantStore';
import { useSettingsStore } from './settingsStore';

const JOURNEY = 12;
const KEY = assistantChatKey({ kind: 'journey', journeyId: JOURNEY });
const WRITE_ID = 'c0ffee00-0000-4000-8000-000000000002';

const REQUEST: AssistantPageRender = {
  requestId: '5f0c3a52-8d1e-4b7a-9c2f-0a1b2c3d4e5f',
  threadId: 9,
  spreadId: 'sp-3',
  bookVersion: 4,
  hiddenPhotoIds: [31],
};

const STATUS: AiStatusResponse = {
  available: true,
  policy: 'instance',
  canConnectOwn: false,
  effective: { source: 'instance', kind: 'openai', model: 'gpt', host: 'api.openai.com', paidBy: 'instance' },
  own: null,
  instance: { kind: 'openai', model: 'gpt', host: 'api.openai.com' },
  quota: null,
  privacyAcked: true,
  studioImagesAcked: false,
  retention: { mode: 'days', days: 90 },
  openrouterOAuth: false,
};

async function* streamOf(chunks: UiStreamChunk[]): AsyncGenerator<UiStreamChunk> {
  for (const chunk of chunks) yield chunk;
}

const store = () => useAssistantStore.getState();

/** A host whose calls are recorded in order, with the flush answering `landed`. */
function fakeHost(order: string[], landed = true) {
  const render = vi.fn<AssistantStudioHost['render']>();
  const flush = vi.fn(async () => {
    order.push('flush');
    return landed;
  });
  return { render, flush };
}

beforeEach(() => {
  useAssistantStore.setState({ status: null, byTrip: {}, studioHosts: {}, decisionHolds: {}, lastApplied: null });
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, language: 'en' } }));
});
afterEach(() => vi.restoreAllMocks());

describe('assistantStore: a chat hosted by the Studio', () => {
  it('FE-AI-STORE-STUDIO-001: writes the book before a question goes out and says the Studio draws pages', async () => {
    const order: string[] = [];
    const host = fakeHost(order);
    store().hostStudio(KEY, host);
    const send = vi.spyOn(assistantRepo, 'send').mockImplementationOnce(async () => {
      order.push('send');
      return streamOf([{ type: 'finish', finishReason: 'stop' }]);
    });

    await store().send(KEY, 'A quieter cover');

    expect(order).toEqual(['flush', 'send']);
    expect(send.mock.calls[0]?.[1]).toMatchObject({ text: 'A quieter cover', renders: true });
  });

  it('FE-AI-STORE-STUDIO-002: a flush that could not land still sends, and an unhosted chat sends no renders', async () => {
    const host = fakeHost([], false);
    const release = store().hostStudio(KEY, host);
    const send = vi.spyOn(assistantRepo, 'send').mockImplementation(async () => streamOf([{ type: 'finish' }]));

    await store().send(KEY, 'First');
    release();
    await store().send(KEY, 'Second');

    expect(host.flush).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toMatchObject({ renders: true });
    expect(send.mock.calls[1]?.[1]).not.toHaveProperty('renders');
  });

  it('FE-AI-STORE-STUDIO-003: hands the page a turn asks for to the host, with a signal that ends with the turn', async () => {
    const host = fakeHost([]);
    store().hostStudio(KEY, host);
    vi.spyOn(assistantRepo, 'send').mockResolvedValueOnce(
      streamOf([
        { type: 'start', messageId: 'msg-1' },
        { type: 'data-trek-render-request', data: REQUEST, transient: true },
        { type: 'finish', finishReason: 'stop' },
      ])
    );

    await store().send(KEY, 'Look at page 3');

    expect(host.render).toHaveBeenCalledTimes(1);
    const [request, signal] = host.render.mock.calls[0] ?? [];
    expect(request).toEqual(REQUEST);
    expect(signal).toBeInstanceOf(AbortSignal);
    // The request is streamed only; the message keeps nothing of it.
    expect(JSON.stringify(chatOf(store(), KEY).messages)).not.toContain(REQUEST.requestId);
  });

  it('FE-AI-STORE-STUDIO-004: writes the book before decisions go out, and a host that ended leaves a newer one', async () => {
    const order: string[] = [];
    const first = fakeHost([]);
    const releaseFirst = store().hostStudio(KEY, first);
    const second = fakeHost(order);
    store().hostStudio(KEY, second);
    releaseFirst();
    expect(store().studioHosts[KEY]).toBe(second);

    useAssistantStore.setState({ byTrip: { [KEY]: { ...chatOf(store(), KEY), threadId: 9 } } });
    const decide = vi.spyOn(assistantRepo, 'decide').mockImplementationOnce(async () => {
      order.push('decide');
      return streamOf([{ type: 'finish', finishReason: 'stop' }]);
    });

    await store().decide(KEY, [{ toolCallId: WRITE_ID, approved: true }]);

    expect(order).toEqual(['flush', 'decide']);
    expect(first.flush).not.toHaveBeenCalled();
    expect(decide.mock.calls[0]?.[2]).toMatchObject({ renders: true });
  });

  it('FE-AI-STORE-STUDIO-005: agreeing to page images is stored for the connection on screen', async () => {
    useAssistantStore.setState({ status: STATUS });
    const ack = vi.spyOn(aiConnectionsRepo, 'ackPrivacy').mockResolvedValueOnce(undefined);

    await store().ackStudioImages();

    expect(ack).toHaveBeenCalledWith({ kind: 'openai', host: 'api.openai.com', scope: 'studio_images' });
    expect(store().status?.studioImagesAcked).toBe(true);
    // The messages' own acknowledgement is a different one and stays as it was.
    expect(store().status?.privacyAcked).toBe(true);
  });

  it('FE-AI-STORE-STUDIO-006: a decision waits for what a card of its chat still sends; a hold ended or of another chat is not asked', async () => {
    const order: string[] = [];
    let land: () => void = () => undefined;
    const held = vi.fn(() => {
      order.push('hold');
      return new Promise<void>((resolve) => {
        land = () => {
          order.push('landed');
          resolve();
        };
      });
    });
    // A hold whose send fails still lets the decision go on.
    const refused = vi.fn(() => Promise.reject(new Error('offline')));
    const ended = vi.fn(async () => undefined);
    const elsewhere = vi.fn(async () => undefined);
    store().holdDecisions(KEY, held);
    store().holdDecisions(KEY, refused);
    store().holdDecisions(KEY, ended)();
    store().holdDecisions(4, elsewhere);
    store().hostStudio(KEY, fakeHost(order));
    useAssistantStore.setState({ byTrip: { [KEY]: { ...chatOf(store(), KEY), threadId: 9 } } });
    const decide = vi.spyOn(assistantRepo, 'decide').mockImplementationOnce(async () => {
      order.push('decide');
      return streamOf([{ type: 'finish', finishReason: 'stop' }]);
    });

    const deciding = store().decide(KEY, [{ toolCallId: WRITE_ID, approved: true }]);
    // The hold is asked at once, and nothing goes out while what it sends is on its way.
    expect(held).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(decide).not.toHaveBeenCalled();
    expect(chatOf(store(), KEY).isRunning).toBe(true);

    land();
    await deciding;

    expect(order).toEqual(['hold', 'landed', 'flush', 'decide']);
    expect(refused).toHaveBeenCalledTimes(1);
    expect(ended).not.toHaveBeenCalled();
    expect(elsewhere).not.toHaveBeenCalled();
    expect(chatOf(store(), KEY).error).toBeNull();
  });
});
