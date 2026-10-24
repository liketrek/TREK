// FE-TJL-HOOK-001 to FE-TJL-HOOK-014

/**
 * The trip's linked journal as the planner and the Settings dialog read it.
 *
 * `useTripJournal` decides whether the trip has a Journal tab at all: only with
 * the Journey addon on, only once the server answered, and live on every
 * `trip:journal:changed`. `useTripJournalLink` is the Settings section: pick one
 * of your own journals, everybody of the trip ticked as a reader by default,
 * the people who would get in for the first time named before the save.
 */
import type { TripJournalCandidate, TripJournalLinkResponse } from '@trek/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { seedStore } from '../../../tests/helpers/store';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useTripJournalLinkStore } from '../../store/tripJournalLinkStore';
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode';
import { useTripJournal, useTripJournalLink, useTripJournalSectionVisible } from './useTripJournalLink';

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const listeners = new Set<(e: Record<string, unknown>) => void>();
vi.mock('../../api/websocket', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/websocket')>()),
  addListener: (fn: (e: Record<string, unknown>) => void) => {
    listeners.add(fn);
  },
  removeListener: (fn: (e: Record<string, unknown>) => void) => {
    listeners.delete(fn);
  },
}));

const TRIP = 4;
const ME = 1;

const EMPTY: TripJournalLinkResponse = { link: null, can_link: true, can_unlink: false, can_edit_members: false };
const LINKED: TripJournalLinkResponse = {
  link: {
    journey_id: 9,
    title: 'Japan',
    subtitle: null,
    cover_image: null,
    owner_id: ME,
    linked_by: ME,
    created_at: 1,
    my_role: 'owner',
    members: [{ user_id: 2, role: 'editor', username: 'lena', avatar_url: null }],
  },
  can_link: true,
  can_unlink: true,
  can_edit_members: true,
};
const CANDIDATES: TripJournalCandidate[] = [
  { user_id: 2, username: 'lena', avatar_url: null, is_trip_owner: false, access: 'editor' },
  { user_id: 3, username: 'tom', avatar_url: null, is_trip_owner: false, access: null },
];

let gets = 0;
let answer: TripJournalLinkResponse = EMPTY;
const writes: { method: string; body: unknown }[] = [];

function routes({ writeStatus = 200 } = {}) {
  server.use(
    http.get('/api/trips/:tripId/journal', () => {
      gets += 1;
      return HttpResponse.json(answer);
    }),
    http.get('/api/trips/:tripId/journal/candidates', () => HttpResponse.json({ candidates: CANDIDATES })),
    http.get('/api/journeys', () =>
      HttpResponse.json({
        journeys: [
          { id: 9, user_id: ME, title: 'Japan' },
          { id: 10, user_id: 99, title: 'Not mine' },
        ],
      })
    ),
    http.put('/api/trips/:tripId/journal', async ({ request }) => {
      writes.push({ method: 'PUT', body: await request.json() });
      return writeStatus === 200
        ? HttpResponse.json(LINKED)
        : HttpResponse.json({ error: 'no' }, { status: writeStatus });
    }),
    http.patch('/api/trips/:tripId/journal/members', async ({ request }) => {
      writes.push({ method: 'PATCH', body: await request.json() });
      return HttpResponse.json(LINKED);
    }),
    http.delete('/api/trips/:tripId/journal', () => {
      writes.push({ method: 'DELETE', body: null });
      return HttpResponse.json(EMPTY);
    })
  );
}

function journeyAddon(enabled: boolean): void {
  useAddonStore.setState({
    loaded: true,
    addons: enabled ? [{ id: 'journey', name: 'Journey', type: 'global', icon: 'BookOpen', enabled: true }] : [],
  });
}

beforeEach(() => {
  gets = 0;
  answer = EMPTY;
  writes.length = 0;
  listeners.clear();
  vi.clearAllMocks();
  useTripJournalLinkStore.setState({ byTrip: {} });
  seedStore(useAuthStore, { user: buildUser({ id: ME }) });
  journeyAddon(true);
  routes();
});

afterEach(() => _resetNetworkMode());

describe('useTripJournal', () => {
  it('FE-TJL-HOOK-001: with the Journey addon off it asks nothing and there is no journal', async () => {
    journeyAddon(false);
    const { result } = renderHook(() => useTripJournal(TRIP));
    expect(result.current.openJournalId).toBeNull();
    expect(result.current.settled).toBe(true);
    await new Promise((r) => setTimeout(r, 30));
    expect(gets).toBe(0);
  });

  it('FE-TJL-HOOK-002: a linked journal open to this person is the one the tab opens', async () => {
    answer = LINKED;
    const { result } = renderHook(() => useTripJournal(TRIP));
    expect(result.current.settled).toBe(false);
    await waitFor(() => expect(result.current.openJournalId).toBe(9));
    expect(result.current.settled).toBe(true);
  });

  it('FE-TJL-HOOK-003: a link that leaves this person out gives no tab', async () => {
    answer = { ...LINKED, link: LINKED.link && { ...LINKED.link, my_role: null } };
    const { result } = renderHook(() => useTripJournal(TRIP));
    await waitFor(() => expect(result.current.link).not.toBeNull());
    expect(result.current.openJournalId).toBeNull();
  });

  it('FE-TJL-HOOK-004: trip:journal:changed asks again', async () => {
    const { result } = renderHook(() => useTripJournal(TRIP));
    await waitFor(() => expect(gets).toBe(1));
    answer = LINKED;
    act(() => {
      for (const fn of [...listeners]) fn({ type: 'trip:journal:changed' });
    });
    await waitFor(() => expect(result.current.openJournalId).toBe(9));
  });

  it('FE-TJL-HOOK-005: offline it asks nothing and is settled', () => {
    setForcedOffline(true);
    const { result } = renderHook(() => useTripJournal(TRIP));
    expect(result.current.settled).toBe(true);
    expect(gets).toBe(0);
  });

  it('FE-TJL-HOOK-006: without a trip id it asks nothing', async () => {
    renderHook(() => useTripJournal(null));
    await new Promise((r) => setTimeout(r, 30));
    expect(gets).toBe(0);
  });

  it('FE-TJL-HOOK-007: the Settings section shows for someone who may link, and not for someone who may not', async () => {
    const { result, rerender } = renderHook(() => useTripJournalSectionVisible(TRIP));
    await waitFor(() => expect(result.current).toBe(true));
    act(() => useTripJournalLinkStore.setState({ byTrip: { [TRIP]: { ...EMPTY, can_link: false } } }));
    rerender();
    expect(result.current).toBe(false);
  });
});

describe('useTripJournalLink', () => {
  it('FE-TJL-HOOK-008: picking offers only my journals and ticks everybody as a reader', async () => {
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.visible).toBe(true));

    act(() => result.current.startPick());
    await waitFor(() => expect(result.current.journals).toEqual([{ id: 9, title: 'Japan', subtitle: null }]));
    act(() => result.current.pickJournal(9));
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));
    expect(result.current.choice).toEqual({ 2: 'viewer', 3: 'viewer' });
    // lena is in already; tom would be let in for the first time.
    expect(result.current.newlyGranted.map((c) => c.username)).toEqual(['tom']);
    expect(result.current.canSave).toBe(true);
  });

  it('FE-TJL-HOOK-009: saving a pick links with the chosen roles and goes back to the view', async () => {
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.startPick());
    act(() => result.current.pickJournal(9));
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));
    act(() => {
      result.current.setRole(2, 'editor');
      result.current.setRole(3, null);
    });
    expect(result.current.newlyGranted).toEqual([]);

    await act(async () => {
      await result.current.save();
    });
    expect(writes).toEqual([{ method: 'PUT', body: { journey_id: 9, members: [{ user_id: 2, role: 'editor' }] } }]);
    expect(toast.success).toHaveBeenCalledWith('trip.journal.linked');
    expect(result.current.mode).toBe('view');
    expect(result.current.link?.title).toBe('Japan');
  });

  it('FE-TJL-HOOK-010: editing members starts from who the link holds and saves them', async () => {
    answer = LINKED;
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.link).not.toBeNull());
    act(() => result.current.editMembers());
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));
    expect(result.current.choice).toEqual({ 2: 'editor', 3: null });

    act(() => result.current.setAll('viewer'));
    await act(async () => {
      await result.current.save();
    });
    expect(writes).toEqual([
      {
        method: 'PATCH',
        body: {
          members: [
            { user_id: 2, role: 'viewer' },
            { user_id: 3, role: 'viewer' },
          ],
        },
      },
    ]);
    expect(toast.success).toHaveBeenCalledWith('trip.journal.membersSaved');
  });

  it('FE-TJL-HOOK-011: unlinking takes the journal off the trip', async () => {
    answer = LINKED;
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.canUnlink).toBe(true));
    await act(async () => {
      await result.current.unlink();
    });
    expect(writes).toEqual([{ method: 'DELETE', body: null }]);
    expect(result.current.link).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('trip.journal.unlinked');
  });

  it('FE-TJL-HOOK-012: a refused save says it was not allowed and keeps the form open', async () => {
    routes({ writeStatus: 403 });
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.startPick());
    act(() => result.current.pickJournal(9));
    await waitFor(() => expect(result.current.candidates).toHaveLength(2));
    await act(async () => {
      await result.current.save();
    });
    expect(toast.error).toHaveBeenCalledWith('trip.journal.errorForbidden');
    expect(result.current.mode).toBe('pick');
    expect(result.current.busy).toBe(false);
  });

  it('FE-TJL-HOOK-013: offline, picking says a connection is needed', async () => {
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.visible).toBe(true));
    setForcedOffline(true);
    act(() => result.current.startPick());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('trip.journal.errorOffline'));
    expect(result.current.journals).toEqual([]);
  });

  it('FE-TJL-HOOK-014: a failing candidate list is reported and cancel goes back to the view', async () => {
    server.use(
      http.get('/api/trips/:tripId/journal/candidates', () => HttpResponse.json({ error: 'x' }, { status: 500 }))
    );
    const { result } = renderHook(() => useTripJournalLink(TRIP));
    await waitFor(() => expect(result.current.visible).toBe(true));
    act(() => result.current.startPick());
    act(() => result.current.pickJournal(9));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('trip.journal.errorGeneric'));
    expect(result.current.candidates).toEqual([]);
    act(() => result.current.cancel());
    expect(result.current.mode).toBe('view');
    expect(result.current.canSave).toBe(false);
  });
});
