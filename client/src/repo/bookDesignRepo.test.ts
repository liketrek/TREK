/**
 * FE-BOOKDSN-020 to FE-BOOKDSN-021
 *
 * The whole-book design card's repository: the draft parsed against the
 * shared contract, the book read for a chat outside the Studio, the chosen
 * pages sent whole and answered as the server kept them; offline, nothing is
 * sent.
 */
import { blankBook } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { server } from '../../tests/helpers/msw/server';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { bookDesignRepo } from './bookDesignRepo';
import { OnlineOnlyError } from './onlineOnly';

const BASE = '/api/journeys/3/book-designs/d-1';

let seq = 0;
const DOC = blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });

const DRAFT = {
  designId: 'd-1',
  baseVersion: 4,
  expiresAt: '2026-10-22T18:00:00.000Z',
  document: DOC,
  plan: [
    {
      spreadId: 'sp-3',
      index: 2,
      action: 'replace',
      beat: 'hero',
      chapter: 'Alfama',
      entryId: 11,
      photoIds: [5],
      findings: { severe: 0, warn: 1 },
    },
  ],
  selection: ['sp-3'],
};

beforeEach(() => _resetNetworkMode());
afterEach(() => _resetNetworkMode());

describe('bookDesignRepo', () => {
  it('FE-BOOKDSN-020: reads the draft and the book, and sends the chosen pages whole', async () => {
    let sent: unknown = null;
    server.use(
      http.get(BASE, () => HttpResponse.json(DRAFT)),
      http.get('/api/journeys/3/book', () => HttpResponse.json({ book: { document: DOC } })),
      http.get('/api/journeys/4/book', () => HttpResponse.json({ book: null })),
      http.put(`${BASE}/selection`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ selection: ['sp-3'] });
      })
    );
    const draft = await bookDesignRepo.draft(3, 'd-1');
    expect(draft.plan[0]).toMatchObject({ spreadId: 'sp-3', action: 'replace' });
    expect(draft.document.spreads).toHaveLength(5);
    expect(await bookDesignRepo.book(3)).toMatchObject({ title: 'Lisbon' });
    expect(await bookDesignRepo.book(4)).toBeNull();
    expect(await bookDesignRepo.select(3, 'd-1', ['sp-3', 'sp-3'])).toEqual(['sp-3']);
    expect(sent).toEqual({ spreadIds: ['sp-3', 'sp-3'] });
  });

  it('FE-BOOKDSN-021: refuses before a request while offline, and refuses an answer outside the contract', async () => {
    let requests = 0;
    server.use(
      http.get(BASE, () => {
        requests += 1;
        return HttpResponse.json({ designId: 'd-1' });
      }),
      http.put(`${BASE}/selection`, () => {
        requests += 1;
        return HttpResponse.json({ selection: 'all' });
      })
    );
    await expect(bookDesignRepo.draft(3, 'd-1')).rejects.toThrow();
    await expect(bookDesignRepo.select(3, 'd-1', [])).rejects.toThrow();
    expect(requests).toBe(2);

    setForcedOffline(true);
    await expect(bookDesignRepo.draft(3, 'd-1')).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(bookDesignRepo.book(3)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(bookDesignRepo.select(3, 'd-1', ['sp-3'])).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(requests).toBe(2);
  });
});
