/**
 * FE-AI-API-001 to FE-AI-API-008
 *
 * The two streaming calls bypass axios, so they carry by hand what the axios
 * instance would add (the cookie, the socket id) and turn a refusal before the
 * stream into a typed error the chat can name. The refusal's code comes from
 * the body when the server names one, and from the status otherwise. A
 * journey's chat reaches the same calls under the journey.
 */
import type { AssistantChatRequest } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { assistantApi, AssistantRequestError } from './assistant';
import { getSocketId } from './websocket';

const BODY: AssistantChatRequest = { locale: 'en', timeZone: 'Europe/Berlin', threadId: null, text: 'Hi' };

function streamResponse(text: string): Response {
  const bytes = new TextEncoder().encode(text);
  let sent = false;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (sent) return { done: true, value: undefined };
          sent = true;
          return { done: false, value: bytes };
        },
        cancel: async () => {},
      }),
    },
  } as unknown as Response;
}

function refusal(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    body: null,
    json: async () => {
      if (body === undefined) throw new SyntaxError('not json');
      return body;
    },
  } as unknown as Response;
}

async function refusedWith(res: Response) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(res);
  try {
    await assistantApi.chat(4, BODY, new AbortController().signal);
  } catch (err) {
    return err;
  }
  throw new Error('expected a refusal');
}

afterEach(() => vi.restoreAllMocks());

describe('assistantApi streams', () => {
  it('FE-AI-API-001: posts the message as JSON with the cookie and the socket id, and yields the chunks', async () => {
    vi.mocked(getSocketId).mockReturnValueOnce('sock-1');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(streamResponse('data: {"type":"start","messageId":"m1"}\n\ndata: [DONE]\n\n'));
    const signal = new AbortController().signal;

    const chunks: unknown[] = [];
    for await (const chunk of await assistantApi.chat(4, BODY, signal)) chunks.push(chunk);

    expect(chunks).toEqual([{ type: 'start', messageId: 'm1' }]);
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe('/api/trips/4/assistant/chat');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', signal, body: JSON.stringify(BODY) });
    expect(init?.headers).toMatchObject({
      'content-type': 'application/json',
      accept: 'text/event-stream',
      'X-Socket-Id': 'sock-1',
    });
  });

  it('FE-AI-API-002: sends decisions to the thread they belong to', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(streamResponse('data: [DONE]\n\n'));
    const body = { locale: 'de', timeZone: 'UTC', decisions: [{ toolCallId: 'c1', approved: true }] };
    await assistantApi.decide(4, 7, body, new AbortController().signal);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/trips/4/assistant/threads/7/decisions');
  });

  it('FE-AI-API-003: a refusal names the code the body gives', async () => {
    const err = await refusedWith(refusal(429, { error: 'Daily limit reached', code: 'daily_limit' }));
    expect(err).toBeInstanceOf(AssistantRequestError);
    expect(err).toMatchObject({ code: 'daily_limit', status: 429 });
  });

  it('FE-AI-API-004: without a known code the status decides', async () => {
    expect(await refusedWith(refusal(429, { error: 'slow down' }))).toMatchObject({ code: 'too_many_requests' });
    expect(await refusedWith(refusal(409, { error: 'x', code: 'conflict' }))).toMatchObject({ code: 'busy' });
    expect(await refusedWith(refusal(502, undefined))).toMatchObject({ code: 'provider_unavailable' });
    expect(await refusedWith(refusal(500, { error: 'boom' }))).toMatchObject({ code: 'generic' });
  });

  it('FE-AI-API-005: an accepted request without a body is a generic failure, not a silent empty answer', async () => {
    const err = await refusedWith({ ok: true, status: 200, body: null } as unknown as Response);
    expect(err).toMatchObject({ code: 'generic', status: 200 });
  });
});

describe('assistantApi JSON calls', () => {
  it('FE-AI-API-006: undo posts an empty JSON body to the escaped tool call id', async () => {
    let seen: { path: string; body: unknown } | null = null;
    server.use(
      http.post('/api/trips/4/assistant/tool-calls/:id/undo', async ({ request, params }) => {
        seen = { path: String(params.id), body: await request.json() };
        return HttpResponse.json({ undone: true });
      })
    );
    await expect(assistantApi.undo(4, 'a/b')).resolves.toEqual({ undone: true });
    expect(seen).toEqual({ path: 'a/b', body: {} });
  });

  it('FE-AI-API-007: stop posts an empty JSON body', async () => {
    let body: unknown = null;
    server.use(
      http.post('/api/trips/4/assistant/stop', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );
    await expect(assistantApi.stop(4)).resolves.toEqual({ success: true });
    expect(body).toEqual({});
  });

  it('FE-AI-API-008: a journey scope reaches the journey routes, a trip scope the trip routes', async () => {
    const journey = { kind: 'journey', journeyId: 12 } as const;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => streamResponse('data: [DONE]\n\n'));
    const signal = new AbortController().signal;
    await assistantApi.chat(journey, BODY, signal);
    await assistantApi.decide(journey, 7, { locale: 'en', timeZone: 'UTC', decisions: [] }, signal);
    await assistantApi.chat({ kind: 'trip', tripId: 4 }, BODY, signal);
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
      '/api/journeys/12/assistant/chat',
      '/api/journeys/12/assistant/threads/7/decisions',
      '/api/trips/4/assistant/chat',
    ]);

    const hits: string[] = [];
    server.use(
      http.get('/api/journeys/12/assistant/threads', () => {
        hits.push('threads');
        return HttpResponse.json({ threads: [] });
      }),
      http.post('/api/journeys/12/assistant/tool-calls/:id/undo', () => {
        hits.push('undo');
        return HttpResponse.json({ undone: true });
      }),
      http.post('/api/journeys/12/assistant/stop', () => {
        hits.push('stop');
        return HttpResponse.json({ success: true });
      })
    );
    await assistantApi.threads(journey);
    await assistantApi.undo(journey, 'c1');
    await assistantApi.stop(journey);
    expect(hits).toEqual(['threads', 'undo', 'stop']);
  });

  it('FE-AI-API-009: the home scope reaches the routes outside any trip', async () => {
    const home = { kind: 'home' } as const;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => streamResponse('data: [DONE]\n\n'));
    const signal = new AbortController().signal;
    await assistantApi.chat(home, BODY, signal);
    await assistantApi.decide(home, 7, { locale: 'en', timeZone: 'UTC', decisions: [] }, signal);
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
      '/api/assistant/chat',
      '/api/assistant/threads/7/decisions',
    ]);

    const hits: string[] = [];
    server.use(
      http.get('/api/assistant/threads', () => {
        hits.push('threads');
        return HttpResponse.json({ threads: [] });
      }),
      http.get('/api/assistant/threads/3', () => {
        hits.push('thread');
        return HttpResponse.json({ thread: { id: 3, title: 't', lastMessageAt: 'x' }, messages: [] });
      }),
      http.delete('/api/assistant/threads/3', () => {
        hits.push('delete');
        return HttpResponse.json({ success: true });
      }),
      http.post('/api/assistant/tool-calls/:id/undo', () => {
        hits.push('undo');
        return HttpResponse.json({ undone: true });
      }),
      http.post('/api/assistant/stop', () => {
        hits.push('stop');
        return HttpResponse.json({ success: true });
      })
    );
    await assistantApi.threads(home);
    await assistantApi.thread(home, 3);
    await assistantApi.deleteThread(home, 3);
    await assistantApi.undo(home, 'c1');
    await assistantApi.stop(home);
    expect(hits).toEqual(['threads', 'thread', 'delete', 'undo', 'stop']);
  });
});
