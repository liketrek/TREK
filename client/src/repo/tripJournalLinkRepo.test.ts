/**
 * FE-TJL-REPO-001 to FE-TJL-REPO-006
 *
 * `tripJournalLinkRepo` is online-only on purpose (who a journal is open to is
 * the server's answer, never a cached guess), so what is pinned is that it
 * refuses before a request while offline, that every call reaches its route
 * with the body the contract names, and that the picker only offers journals
 * the person owns.
 */
import type { TripJournalLinkResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { _resetNetworkMode, setForcedOffline } from '../sync/networkMode';
import { tripJournalLinkRepo, TripJournalOfflineError } from './tripJournalLinkRepo';

const NONE: TripJournalLinkResponse = { link: null, can_link: true, can_unlink: false, can_edit_members: false };

afterEach(() => _resetNetworkMode());

describe('tripJournalLinkRepo', () => {
  it('FE-TJL-REPO-001: refuses every call while offline, before a request leaves', async () => {
    let calls = 0;
    server.use(
      http.get('/api/trips/:tripId/journal', () => {
        calls += 1;
        return HttpResponse.json(NONE);
      })
    );
    setForcedOffline(true);

    await expect(tripJournalLinkRepo.get(4)).rejects.toBeInstanceOf(TripJournalOfflineError);
    await expect(tripJournalLinkRepo.candidates(4, 1)).rejects.toBeInstanceOf(TripJournalOfflineError);
    await expect(tripJournalLinkRepo.link(4, 1, [])).rejects.toBeInstanceOf(TripJournalOfflineError);
    await expect(tripJournalLinkRepo.setMembers(4, [])).rejects.toBeInstanceOf(TripJournalOfflineError);
    await expect(tripJournalLinkRepo.unlink(4)).rejects.toBeInstanceOf(TripJournalOfflineError);
    await expect(tripJournalLinkRepo.ownJournals(1)).rejects.toBeInstanceOf(TripJournalOfflineError);
    expect(calls).toBe(0);
  });

  it('FE-TJL-REPO-002: reads the trip link', async () => {
    server.use(http.get('/api/trips/4/journal', () => HttpResponse.json(NONE)));
    expect(await tripJournalLinkRepo.get(4)).toEqual(NONE);
  });

  it('FE-TJL-REPO-003: asks for the candidates of one journal and hands back the list', async () => {
    let asked: string | null = null;
    server.use(
      http.get('/api/trips/4/journal/candidates', ({ request }) => {
        asked = new URL(request.url).searchParams.get('journey_id');
        return HttpResponse.json({
          candidates: [{ user_id: 2, username: 'lena', avatar_url: null, is_trip_owner: false, access: null }],
        });
      })
    );
    const list = await tripJournalLinkRepo.candidates(4, 9);
    expect(asked).toBe('9');
    expect(list.map((c) => c.username)).toEqual(['lena']);
  });

  it('FE-TJL-REPO-004: links, sets members and unlinks with the bodies the contract names', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.put('/api/trips/4/journal', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(NONE);
      }),
      http.patch('/api/trips/4/journal/members', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(NONE);
      }),
      http.delete('/api/trips/4/journal', () => HttpResponse.json(NONE))
    );
    await tripJournalLinkRepo.link(4, 9, [{ user_id: 2, role: 'viewer' }]);
    await tripJournalLinkRepo.setMembers(4, [{ user_id: 2, role: 'editor' }]);
    expect(await tripJournalLinkRepo.unlink(4)).toEqual(NONE);
    expect(bodies).toEqual([
      { journey_id: 9, members: [{ user_id: 2, role: 'viewer' }] },
      { members: [{ user_id: 2, role: 'editor' }] },
    ]);
  });

  it('FE-TJL-REPO-005: offers only the journals the person owns', async () => {
    server.use(
      http.get('/api/journeys', () =>
        HttpResponse.json({
          journeys: [
            { id: 1, user_id: 7, title: 'Mine', subtitle: 'Japan' },
            { id: 2, user_id: 8, title: 'Theirs' },
            { id: 3, user_id: 7, title: 'Also mine' },
          ],
        })
      )
    );
    expect(await tripJournalLinkRepo.ownJournals(7)).toEqual([
      { id: 1, title: 'Mine', subtitle: 'Japan' },
      { id: 3, title: 'Also mine', subtitle: null },
    ]);
  });

  it('FE-TJL-REPO-006: the offline error says what it needs', () => {
    const err = new TripJournalOfflineError();
    expect(err.name).toBe('TripJournalOfflineError');
    expect(err.message).toMatch(/connection/);
  });
});
