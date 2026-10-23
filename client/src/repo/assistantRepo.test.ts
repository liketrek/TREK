/**
 * FE-AI-REPO-001 to FE-AI-REPO-007
 *
 * The assistant is online-only on purpose (there is no model on the device
 * and no cached chats), so the repo makes two promises: nothing is sent while
 * offline, the manual offline switch included, and answers are parsed against
 * the shared contract instead of cast. A journey's chat goes through the same
 * calls with its scope.
 */
import { type AssistantThreadResponse, blankBook } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { type MultipartBody, readMultipart } from '../../tests/helpers/multipart';
import { assistantApi } from '../api/assistant';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { assistantRepo } from './assistantRepo';
import { OnlineOnlyError } from './onlineOnly';

const BASE = '/api/trips/4/assistant';

/** A design draft's book, as GET .../book-designs/:designId answers it. */
let draftIds = 0;
const DRAFT = blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++draftIds}` });

const THREAD: AssistantThreadResponse = {
  thread: { id: 7, title: 'Kyoto', lastMessageAt: '2026-10-21T08:00:00.000Z' },
  messages: [
    {
      id: '12',
      role: 'user',
      parts: [{ type: 'text', text: 'Plan Friday' }],
      status: 'complete',
      createdAt: '2026-10-21T08:00:00.000Z',
    },
  ],
};

beforeEach(() => _resetNetworkMode());
afterEach(() => {
  _resetNetworkMode();
  vi.restoreAllMocks();
});

describe('assistantRepo', () => {
  it('FE-AI-REPO-001: reads the thread list and a thread', async () => {
    server.use(
      http.get(`${BASE}/threads`, () => HttpResponse.json({ threads: [THREAD.thread] })),
      http.get(`${BASE}/threads/7`, () => HttpResponse.json(THREAD))
    );
    await expect(assistantRepo.threads(4)).resolves.toEqual([THREAD.thread]);
    await expect(assistantRepo.thread(4, 7)).resolves.toEqual(THREAD);
  });

  it('FE-AI-REPO-002: an answer outside the contract fails here', async () => {
    server.use(http.get(`${BASE}/threads`, () => HttpResponse.json({ threads: [{ id: 'seven' }] })));
    await expect(assistantRepo.threads(4)).rejects.toThrow();
  });

  it('FE-AI-REPO-003: deletes, undoes and stops through the API', async () => {
    const hits: string[] = [];
    server.use(
      http.delete(`${BASE}/threads/7`, () => {
        hits.push('delete');
        return HttpResponse.json({ success: true });
      }),
      http.post(`${BASE}/tool-calls/c1/undo`, () => {
        hits.push('undo');
        return HttpResponse.json({ undone: true });
      }),
      http.post(`${BASE}/stop`, () => {
        hits.push('stop');
        return HttpResponse.json({ success: true });
      })
    );
    await assistantRepo.deleteThread(4, 7);
    await assistantRepo.undo(4, 'c1');
    await assistantRepo.stop(4);
    expect(hits).toEqual(['delete', 'undo', 'stop']);
  });

  it('FE-AI-REPO-004: send and decide hand back the stream the API opened', async () => {
    const stream = (async function* () {})();
    const chat = vi.spyOn(assistantApi, 'chat').mockResolvedValue(stream);
    const decide = vi.spyOn(assistantApi, 'decide').mockResolvedValue(stream);
    const signal = new AbortController().signal;
    const ctx = { locale: 'en', timeZone: 'UTC' };

    await expect(assistantRepo.send(4, { ...ctx, threadId: null, text: 'Hi' }, signal)).resolves.toBe(stream);
    await expect(
      assistantRepo.decide(4, 7, { ...ctx, decisions: [{ toolCallId: 'c1', approved: false }] }, signal)
    ).resolves.toBe(stream);
    expect(chat).toHaveBeenCalledWith(4, { ...ctx, threadId: null, text: 'Hi' }, signal);
    expect(decide).toHaveBeenCalledWith(4, 7, { ...ctx, decisions: [{ toolCallId: 'c1', approved: false }] }, signal);
  });

  it('FE-AI-REPO-005: while offline (the manual switch too) every call refuses before a request', async () => {
    setForcedOffline(true);
    const chat = vi.spyOn(assistantApi, 'chat');
    const threads = vi.spyOn(assistantApi, 'threads');
    const signal = new AbortController().signal;

    await expect(assistantRepo.threads(4)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.thread(4, 7)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.deleteThread(4, 7)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(
      assistantRepo.send(4, { locale: 'en', timeZone: 'UTC', threadId: null, text: 'Hi' }, signal)
    ).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.undo(4, 'c1')).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.stop(4)).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(chat).not.toHaveBeenCalled();
    expect(threads).not.toHaveBeenCalled();
  });

  it('FE-AI-REPO-006: a journey scope reads the journey threads and hands the scope to the stream', async () => {
    const journey = { kind: 'journey', journeyId: 12 } as const;
    server.use(
      http.get('/api/journeys/12/assistant/threads', () => HttpResponse.json({ threads: [THREAD.thread] })),
      http.get('/api/journeys/12/assistant/threads/7', () => HttpResponse.json(THREAD))
    );
    await expect(assistantRepo.threads(journey)).resolves.toEqual([THREAD.thread]);
    await expect(assistantRepo.thread(journey, 7)).resolves.toEqual(THREAD);

    const stream = (async function* () {})();
    const chat = vi.spyOn(assistantApi, 'chat').mockResolvedValue(stream);
    const body = { locale: 'en', timeZone: 'UTC', threadId: null, text: 'Hi' };
    await expect(assistantRepo.send(journey, body, new AbortController().signal)).resolves.toBe(stream);
    expect(chat).toHaveBeenCalledWith(journey, body, expect.any(AbortSignal));
  });

  it('FE-AI-REPO-007: a Studio page goes up as multipart to the turn that asked, its book is read fresh', async () => {
    let sent: MultipartBody | null = null;
    let requestId = '';
    server.use(
      http.post('/api/journeys/12/assistant/threads/9/renders/:requestId', async ({ request, params }) => {
        requestId = String(params.requestId);
        sent = await readMultipart(request);
        return HttpResponse.json({ accepted: true });
      }),
      http.get('/api/journeys/12/book', () => HttpResponse.json({ book: null })),
      http.get('/api/journeys/12/book-designs/d-1', () =>
        HttpResponse.json({ designId: 'd-1', baseVersion: null, document: DRAFT, plan: [], selection: [] })
      )
    );
    const image = new Blob(['jpeg'], { type: 'image/jpeg' });
    const page = { image, bookVersion: 4, spreadId: 'sp-3', drawnPhotoIds: [7, 8] };
    const signal = new AbortController().signal;
    const append = vi.spyOn(FormData.prototype, 'append');

    await assistantRepo.uploadRender(12, 9, 'req-1', page, signal);
    await expect(assistantRepo.pageBook(12)).resolves.toBeNull();
    // A design draft's page is drawn at the version the draft was made against; a draft of no book is version 0.
    await expect(assistantRepo.pageDraft(12, 'd-1')).resolves.toEqual({ version: 0, document: DRAFT });

    expect(requestId).toBe('req-1');
    // One file part; jsdom names every file part 'blob' on the wire, so its name is checked where the form gets it.
    expect(append).toHaveBeenCalledWith('image', image, 'page.jpg');
    expect(sent).toEqual({
      fields: { bookVersion: '4', spreadId: 'sp-3', drawnPhotoIds: '7,8' },
      filenames: [expect.any(String)],
    });

    // Online only, like every other call here.
    setForcedOffline(true);
    await expect(assistantRepo.uploadRender(12, 9, 'req-1', page, signal)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.pageBook(12)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(assistantRepo.pageDraft(12, 'd-1')).rejects.toBeInstanceOf(OnlineOnlyError);
  });
});
