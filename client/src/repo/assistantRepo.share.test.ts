/**
 * FE-AI-REPO-SHARE-001 to 002
 *
 * Sharing an answer in the trip chat: the repo posts the previewed text to
 * the answer's share route, parses the chat message it gets back, and sends
 * nothing while offline.
 */
import type { CollabMessageResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { assistantApi } from '../api/assistant';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { assistantRepo } from './assistantRepo';
import { OnlineOnlyError } from './onlineOnly';

const ANSWER: CollabMessageResponse = {
  message: {
    id: 51,
    trip_id: 4,
    user_id: 2,
    text: 'Take the early train.',
    reply_to: null,
    created_at: '2026-10-21T08:00:00.000Z',
    deleted: null,
    username: 'maria',
    avatar: null,
    reply_text: null,
    reply_username: null,
    user_avatar: null,
    avatar_url: null,
    reactions: [],
    attachments: [],
    origin: 'assistant',
  },
};

beforeEach(() => _resetNetworkMode());
afterEach(() => {
  _resetNetworkMode();
  vi.restoreAllMocks();
});

describe('assistantRepo.share', () => {
  it('FE-AI-REPO-SHARE-001: posts the text to the answer and parses the chat message it gets back', async () => {
    let sent: unknown = null;
    server.use(
      http.post('/api/trips/4/assistant/threads/7/messages/msg-12/share', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(ANSWER, { status: 201 });
      })
    );
    await expect(assistantRepo.share(4, 7, 'msg-12', { text: 'Take the early train.' })).resolves.toEqual(ANSWER);
    expect(sent).toEqual({ text: 'Take the early train.' });
  });

  it('FE-AI-REPO-SHARE-002: refuses before a request while offline', async () => {
    setForcedOffline(true);
    const call = vi.spyOn(assistantApi, 'share');
    await expect(assistantRepo.share(4, 7, 'msg-12', { text: 'Hi' })).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(call).not.toHaveBeenCalled();
  });
});
