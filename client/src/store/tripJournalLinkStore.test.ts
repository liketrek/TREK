/**
 * FE-TJL-STORE-001 to FE-TJL-STORE-005
 *
 * The store keeps the server's answer per trip so the Journal tab and the
 * Settings dialog read the same one: a write replaces it with what the server
 * answered, a 404/403 means there is no journal for this person, and any other
 * failure leaves the last answer standing rather than flashing the tab away.
 */
import type { TripJournalLinkResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { useTripJournalLinkStore } from './tripJournalLinkStore';

const LINKED: TripJournalLinkResponse = {
  link: {
    journey_id: 9,
    title: 'Japan',
    subtitle: null,
    cover_image: null,
    owner_id: 1,
    linked_by: 1,
    created_at: 1,
    my_role: 'owner',
    members: [],
  },
  can_link: true,
  can_unlink: true,
  can_edit_members: true,
};
const EMPTY: TripJournalLinkResponse = { link: null, can_link: true, can_unlink: false, can_edit_members: false };

beforeEach(() => useTripJournalLinkStore.setState({ byTrip: {} }));

describe('tripJournalLinkStore', () => {
  it('FE-TJL-STORE-001: refresh keeps the answer under the trip', async () => {
    server.use(http.get('/api/trips/4/journal', () => HttpResponse.json(LINKED)));
    await useTripJournalLinkStore.getState().refresh(4);
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual(LINKED);
  });

  it('FE-TJL-STORE-002: a 404 (addon off, trip out of reach) is no journal at all', async () => {
    server.use(http.get('/api/trips/4/journal', () => HttpResponse.json({ error: 'gone' }, { status: 404 })));
    await useTripJournalLinkStore.getState().refresh(4);
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual({
      link: null,
      can_link: false,
      can_unlink: false,
      can_edit_members: false,
    });
  });

  it('FE-TJL-STORE-003: any other failure leaves the last answer standing', async () => {
    useTripJournalLinkStore.setState({ byTrip: { 4: LINKED } });
    server.use(http.get('/api/trips/4/journal', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    await useTripJournalLinkStore.getState().refresh(4);
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual(LINKED);
  });

  it('FE-TJL-STORE-004: link, setMembers and unlink each keep what the server answered', async () => {
    server.use(
      http.put('/api/trips/4/journal', () => HttpResponse.json(LINKED)),
      http.patch('/api/trips/4/journal/members', () => HttpResponse.json({ ...LINKED, can_unlink: false })),
      http.delete('/api/trips/4/journal', () => HttpResponse.json(EMPTY))
    );
    const s = useTripJournalLinkStore.getState();
    await s.link(4, 9, []);
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual(LINKED);
    await s.setMembers(4, []);
    expect(useTripJournalLinkStore.getState().byTrip['4']?.can_unlink).toBe(false);
    await s.unlink(4);
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual(EMPTY);
  });

  it('FE-TJL-STORE-005: a failed write rejects for its caller and keeps the last answer', async () => {
    useTripJournalLinkStore.setState({ byTrip: { 4: EMPTY } });
    server.use(http.put('/api/trips/4/journal', () => HttpResponse.json({ error: 'no' }, { status: 403 })));
    await expect(useTripJournalLinkStore.getState().link(4, 9, [])).rejects.toBeTruthy();
    expect(useTripJournalLinkStore.getState().byTrip['4']).toEqual(EMPTY);
  });
});
