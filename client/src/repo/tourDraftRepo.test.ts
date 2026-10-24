// The Tours planner's unsaved draft on the account: read through to the server
// and kept here, written once the edits settle, queued without a connection,
// and moved over from this browser's local storage once.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, offlineDb, type QueuedMutation } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { isEffectivelyOffline } from '../sync/networkMode';
import { TOUR_DRAFT_KEEP_DELAY_MS, tourDraftRepo } from './tourDraftRepo';

const { client } = vi.hoisted(() => ({
  client: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), request: vi.fn() },
}));

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));
vi.mock('../sync/authGate', () => ({ isAuthed: () => true }));
vi.mock('../api/client', () => ({ default: client, apiClient: client }));

const draft = (name: string) => JSON.stringify({ version: 11, name, waypoints: [] });
const answer = (payload: string | null) => ({
  data: { draft: payload === null ? null : { payload, updated_at: '2026-10-22 09:00:00' } },
});
/** An axios failure that never reached the server. */
const networkError = () => Object.assign(new Error('Network Error'), { isAxiosError: true });

let rows = 0;
function queued(overrides: Partial<QueuedMutation>): QueuedMutation {
  rows += 1;
  return {
    id: `draft-${rows}`,
    tripId: 4,
    method: 'PUT',
    url: '/trips/4/tour-draft',
    body: { payload: draft('Queued') },
    createdAt: rows,
    status: 'pending',
    attempts: 0,
    lastError: null,
    resource: 'tourDrafts',
    entityId: 4,
    ...overrides,
  };
}

beforeEach(async () => {
  await clearAll();
  vi.clearAllMocks();
  mutationQueue._resetFlushing();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('tourDraftRepo online', () => {
  it('FE-REPO-DRAFT-001: reads the account draft and keeps it on this device', async () => {
    client.get.mockResolvedValue(answer(draft('Ridge')));

    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Ridge'));

    expect(client.get).toHaveBeenCalledWith('/trips/4/tour-draft');
    await vi.waitFor(async () => expect((await offlineDb.tourDrafts.get(4))?.draft.payload).toBe(draft('Ridge')));
  });

  it('FE-REPO-DRAFT-002: writes once the edits settle, the newest draft of that time only', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    client.put.mockResolvedValue(answer(draft('Second')));
    tourDraftRepo.keep(4, draft('First'));
    tourDraftRepo.keep(4, draft('Second'));
    vi.advanceTimersByTime(TOUR_DRAFT_KEEP_DELAY_MS - 1);
    expect(client.put).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    vi.useRealTimers();

    await vi.waitFor(() => expect(client.put).toHaveBeenCalledOnce());
    expect(client.put).toHaveBeenCalledWith('/trips/4/tour-draft', { payload: draft('Second') });
    await vi.waitFor(async () => expect((await offlineDb.tourDrafts.get(4))?.draft.payload).toBe(draft('Second')));
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('FE-REPO-DRAFT-003: a draft still waiting goes out at once when the planner closes, and before a read', async () => {
    client.put.mockResolvedValue(answer(draft('Closing')));
    client.get.mockResolvedValue(answer(draft('Closing')));
    tourDraftRepo.keep(4, draft('Closing'));
    tourDraftRepo.flush(4);
    await vi.waitFor(() => expect(client.put).toHaveBeenCalledOnce());

    tourDraftRepo.keep(4, draft('Reopened'));
    client.put.mockResolvedValue(answer(draft('Reopened')));
    client.get.mockResolvedValue(answer(draft('Reopened')));
    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Reopened'));
    expect(client.put).toHaveBeenCalledTimes(2);
    expect(client.put.mock.invocationCallOrder[1]).toBeLessThan(client.get.mock.invocationCallOrder[0]);
  });

  it('FE-REPO-DRAFT-004: forgetting drops a waiting draft, discards the account one and the copy here', async () => {
    await offlineDb.tourDrafts.put({ tripId: 4, draft: { payload: draft('Old'), updated_at: '2026-10-22 08:00:00' } });
    client.delete.mockResolvedValue({ data: { success: true } });
    tourDraftRepo.keep(4, draft('Never sent'));

    await tourDraftRepo.forget(4);

    expect(client.delete).toHaveBeenCalledWith('/trips/4/tour-draft');
    expect(client.put).not.toHaveBeenCalled();
    await vi.waitFor(async () => expect(await offlineDb.tourDrafts.get(4)).toBeUndefined());
  });

  it('FE-REPO-DRAFT-005: a write that never reached the server joins the queue instead', async () => {
    const sendSoon = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
    client.put.mockRejectedValue(networkError());
    tourDraftRepo.keep(4, draft('Lost'));
    tourDraftRepo.flush(4);

    await vi.waitFor(async () => expect(await offlineDb.mutationQueue.count()).toBe(1));
    expect((await offlineDb.mutationQueue.toArray())[0]).toMatchObject({
      tripId: 4,
      method: 'PUT',
      url: '/trips/4/tour-draft',
      body: { payload: draft('Lost') },
      resource: 'tourDrafts',
      entityId: 4,
    });
    expect(sendSoon).toHaveBeenCalled();
  });
});

describe('tourDraftRepo offline', () => {
  beforeEach(() => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
  });

  it('FE-REPO-DRAFT-OFF-001: reads the copy on this device, with the newest queued write laid over it', async () => {
    await offlineDb.tourDrafts.put({
      tripId: 4,
      draft: { payload: draft('Cached'), updated_at: '2026-10-22 08:00:00' },
    });
    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Cached'));

    await offlineDb.mutationQueue.put(queued({ body: { payload: draft('Queued') } }));
    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Queued'));

    await offlineDb.mutationQueue.put(queued({ method: 'DELETE', body: undefined }));
    await expect(tourDraftRepo.read(4)).resolves.toBeNull();

    // A write the server refused is not laid over the copy.
    await offlineDb.mutationQueue.clear();
    await offlineDb.mutationQueue.put(queued({ status: 'failed', body: { payload: draft('Refused') } }));
    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Cached'));
    expect(client.get).not.toHaveBeenCalled();
  });

  it('FE-REPO-DRAFT-OFF-002: the latest draft replaces an older one still waiting in the queue', async () => {
    tourDraftRepo.keep(4, draft('First'));
    tourDraftRepo.flush(4);
    await vi.waitFor(async () => expect(await offlineDb.mutationQueue.count()).toBe(1));
    tourDraftRepo.keep(4, draft('Second'));
    tourDraftRepo.flush(4);
    await vi.waitFor(async () =>
      expect((await offlineDb.mutationQueue.toArray()).map((m) => m.body)).toEqual([{ payload: draft('Second') }])
    );

    await tourDraftRepo.forget(4);
    expect((await offlineDb.mutationQueue.toArray()).map((m) => [m.method, m.url])).toEqual([
      ['DELETE', '/trips/4/tour-draft'],
    ]);
    await expect(tourDraftRepo.read(4)).resolves.toBeNull();
    expect(client.put).not.toHaveBeenCalled();
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('FE-REPO-DRAFT-OFF-003: a queued draft replays to the account and its answer is kept here', async () => {
    tourDraftRepo.keep(4, draft('Offline'));
    tourDraftRepo.flush(4);
    await vi.waitFor(async () => expect(await offlineDb.mutationQueue.count()).toBe(1));

    vi.mocked(isEffectivelyOffline).mockReturnValue(false);
    client.request.mockResolvedValue(answer(draft('Offline')));
    await mutationQueue.flush();

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PUT', url: '/trips/4/tour-draft', data: { payload: draft('Offline') } })
    );
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.tourDrafts.get(4))?.draft.payload).toBe(draft('Offline'));
  });
});

describe('tourDraftRepo and the draft the old planner left in local storage', () => {
  it('FE-REPO-DRAFT-OLD-001: uploads it where the account holds none, gives it back and removes it', async () => {
    localStorage.setItem('tour-draft-4', draft('From this browser'));
    client.get.mockResolvedValue(answer(null));
    client.put.mockResolvedValue(answer(draft('From this browser')));

    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('From this browser'));

    expect(client.put).toHaveBeenCalledWith('/trips/4/tour-draft', { payload: draft('From this browser') });
    expect(localStorage.getItem('tour-draft-4')).toBeNull();
  });

  it('FE-REPO-DRAFT-OLD-002: the account draft wins, and one that is no draft at all is dropped', async () => {
    localStorage.setItem('tour-draft-4', draft('Older'));
    client.get.mockResolvedValue(answer(draft('Account')));
    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Account'));
    expect(localStorage.getItem('tour-draft-4')).toBeNull();

    localStorage.setItem('tour-draft-5', '{not json');
    client.get.mockResolvedValue(answer(null));
    await expect(tourDraftRepo.read(5)).resolves.toBeNull();
    expect(localStorage.getItem('tour-draft-5')).toBeNull();
    expect(client.put).not.toHaveBeenCalled();
  });

  it('FE-REPO-DRAFT-OLD-003: one the account refuses stays where it was and is still given back', async () => {
    localStorage.setItem('tour-draft-4', draft('Kept here'));
    client.get.mockResolvedValue(answer(null));
    client.put.mockRejectedValue(
      Object.assign(new Error('Forbidden'), { isAxiosError: true, response: { status: 403 } })
    );
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(tourDraftRepo.read(4)).resolves.toBe(draft('Kept here'));
    expect(localStorage.getItem('tour-draft-4')).toBe(draft('Kept here'));
  });
});
