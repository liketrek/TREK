/**
 * FE-AI-REPO-FOUND-001 to 004
 *
 * "+ Day N" on a found place, and "Plan this" on a card: the repo posts the
 * handle (the place, or the call whose card it was), parses the message the
 * server answers with, and like every assistant call sends nothing while
 * offline.
 */
import type { AssistantAddFoundPlaceResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { assistantApi } from '../api/assistant';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { assistantRepo } from './assistantRepo';
import { OnlineOnlyError } from './onlineOnly';

const BODY = { locale: 'en', timeZone: 'UTC', ref: 'call-1:0', dayId: 31 };

const ANSWER: AssistantAddFoundPlaceResponse = {
  message: {
    id: 'msg-9',
    role: 'assistant',
    parts: [{ type: 'tool-call', toolCallId: 'c9', toolName: 'add_found_place', args: {}, approval: { id: 'c9' } }],
    status: 'awaiting_approval',
    createdAt: '2026-10-21T08:00:00.000Z',
  },
};

beforeEach(() => _resetNetworkMode());
afterEach(() => {
  _resetNetworkMode();
  vi.restoreAllMocks();
});

describe('assistantRepo.addFoundPlace', () => {
  it('FE-AI-REPO-FOUND-001: posts the handle and the day, and parses the message it gets back', async () => {
    let sent: unknown = null;
    server.use(
      http.post('/api/trips/4/assistant/threads/7/found-places', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(ANSWER);
      })
    );
    await expect(assistantRepo.addFoundPlace(4, 7, BODY)).resolves.toEqual(ANSWER);
    expect(sent).toEqual(BODY);
  });

  it('FE-AI-REPO-FOUND-002: refuses before a request while offline', async () => {
    setForcedOffline(true);
    const call = vi.spyOn(assistantApi, 'addFoundPlace');
    await expect(assistantRepo.addFoundPlace(4, 7, BODY)).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(call).not.toHaveBeenCalled();
  });
});

describe('assistantRepo.takeProposal', () => {
  const PROPOSAL = { locale: 'en', timeZone: 'UTC', toolCallId: 'read-3' };

  it('FE-AI-REPO-FOUND-003: posts the call whose card it was, and parses the message it gets back', async () => {
    let sent: unknown = null;
    server.use(
      http.post('/api/trips/4/assistant/threads/7/proposals', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(ANSWER);
      })
    );
    await expect(assistantRepo.takeProposal(4, 7, PROPOSAL)).resolves.toEqual(ANSWER);
    expect(sent).toEqual(PROPOSAL);
  });

  it('FE-AI-REPO-FOUND-004: refuses before a request while offline', async () => {
    setForcedOffline(true);
    const call = vi.spyOn(assistantApi, 'takeProposal');
    await expect(assistantRepo.takeProposal(4, 7, PROPOSAL)).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(call).not.toHaveBeenCalled();
  });
});
