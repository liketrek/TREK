/**
 * InMemoryAssistantRenderRegistry (ASTRND-*): a turn waits for the page image
 * it asked the Studio for; the upload is handed over only to the turn of the
 * same user, journey and thread, for the page and version asked for, and only
 * while the turn still waits.
 */
import {
  InMemoryAssistantRenderRegistry,
  type PageImage,
  type RenderWait,
} from '../../../../src/nest/assistant/assistant-render.registry';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const REQUEST: RenderWait = {
  userId: 7,
  journeyId: 12,
  threadId: 4,
  requestId: '0b6f7c1e-3a52-4d8e-9a7b-2f1e0c9d8a76',
  spreadId: 'sp-2',
  bookVersion: 3,
};
const PAGE = { spreadId: 'sp-2', bookVersion: 3 };
const IMAGE: PageImage = { mimeType: 'image/jpeg', data: Buffer.from('jpeg'), width: 1280, height: 640 };

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('InMemoryAssistantRenderRegistry', () => {
  it('ASTRND-001: the upload of the page asked for reaches the waiting turn once', async () => {
    const registry = new InMemoryAssistantRenderRegistry();
    const waiting = registry.wait(REQUEST, new AbortController().signal, 15_000);
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('taken');
    await expect(waiting).resolves.toBe(IMAGE);
    // Taken: a second upload for the same request finds nobody waiting.
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('unknown');
  });

  it('ASTRND-002: a turn stops waiting after the timeout, and an upload after it is too late', async () => {
    const registry = new InMemoryAssistantRenderRegistry();
    const waiting = registry.wait(REQUEST, new AbortController().signal, 15_000);
    await vi.advanceTimersByTimeAsync(15_000);
    await expect(waiting).resolves.toBeNull();
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('unknown');
  });

  it('ASTRND-003: a stopped turn stops waiting, also when it was stopped before it asked', async () => {
    const registry = new InMemoryAssistantRenderRegistry();
    const stop = new AbortController();
    const waiting = registry.wait(REQUEST, stop.signal, 15_000);
    stop.abort();
    await expect(waiting).resolves.toBeNull();
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('unknown');
    await expect(registry.wait(REQUEST, stop.signal, 15_000)).resolves.toBeNull();
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('unknown');
  });

  it('ASTRND-004: another user, journey or thread cannot answer the request; the turn goes on waiting', async () => {
    const registry = new InMemoryAssistantRenderRegistry();
    const waiting = registry.wait(REQUEST, new AbortController().signal, 15_000);
    expect(registry.deliver({ ...REQUEST, userId: 8 }, PAGE, IMAGE)).toBe('unknown');
    expect(registry.deliver({ ...REQUEST, journeyId: 13 }, PAGE, IMAGE)).toBe('unknown');
    expect(registry.deliver({ ...REQUEST, threadId: 5 }, PAGE, IMAGE)).toBe('unknown');
    expect(registry.deliver({ ...REQUEST, requestId: 'other' }, PAGE, IMAGE)).toBe('unknown');
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('taken');
    await expect(waiting).resolves.toBe(IMAGE);
  });

  it('ASTRND-005: an image of another page or version is refused, and the right one still comes through', async () => {
    const registry = new InMemoryAssistantRenderRegistry();
    const waiting = registry.wait(REQUEST, new AbortController().signal, 15_000);
    expect(registry.deliver(REQUEST, { ...PAGE, spreadId: 'sp-3' }, IMAGE)).toBe('mismatch');
    expect(registry.deliver(REQUEST, { ...PAGE, bookVersion: 2 }, IMAGE)).toBe('mismatch');
    expect(registry.deliver(REQUEST, PAGE, IMAGE)).toBe('taken');
    await expect(waiting).resolves.toBe(IMAGE);
  });
});
