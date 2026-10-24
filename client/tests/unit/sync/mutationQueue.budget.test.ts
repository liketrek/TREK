/**
 * mutationQueue replay of offline Costs writes (#2601): a created expense moves
 * to its real id, the split and paid-tick answers only ever touch the expense
 * they name, and an expense saved from a place created offline reaches the
 * server linked to the place's real id.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { budgetRepo } from '../../../src/repo/budgetRepo';
import { placeRepo } from '../../../src/repo/placeRepo';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { buildBudgetItem } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setAuthed(true);
  setOnline(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('mutationQueue.flush — Costs', () => {
  it('FE-SYNC-BUDGET-001: a replayed expense moves to the real id and the queued edit follows it', async () => {
    const { item } = await budgetRepo.create(3, { name: 'Lunch', total_price: 10 });
    await budgetRepo.update(3, item.id, { name: 'Brunch' });
    const puts: string[] = [];
    server.use(
      http.post('/api/trips/3/budget', () =>
        HttpResponse.json({ item: buildBudgetItem({ id: 801, trip_id: 3, name: 'Lunch' }) })
      ),
      http.put('/api/trips/3/budget/:id', ({ params }) => {
        puts.push(String(params.id));
        return HttpResponse.json({ item: buildBudgetItem({ id: 801, trip_id: 3, name: 'Brunch' }) });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(puts).toEqual(['801']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.budgetItems.get(item.id)).toBeUndefined();
    expect(await offlineDb.budgetItems.get(801)).toMatchObject({ name: 'Brunch' });
  });

  it('FE-SYNC-BUDGET-002: the split answer keeps the payers here and the paid answer writes no foreign row', async () => {
    const payers = [{ user_id: 1, amount: 40, username: 'ana' }];
    await offlineDb.budgetItems.put(buildBudgetItem({ id: 90, trip_id: 3, total_price: 40, payers, members: [] }));
    await budgetRepo.setMembers(3, 90, [1, 2]);
    await budgetRepo.togglePaid(3, 90, 2, true);
    const members = [
      { user_id: 1, paid: 0, username: 'ana', budget_item_id: 90 },
      { user_id: 2, paid: 0, username: 'ben', budget_item_id: 90 },
    ];
    // The members route answers the bare row, with no payers or members on it.
    const bare = { id: 90, trip_id: 3, name: 'Hotel', category: 'other', total_price: 40, persons: 2 };
    server.use(
      http.put('/api/trips/3/budget/90/members', () => HttpResponse.json({ members, item: bare })),
      // A member row carrying an id must never land in the expense table.
      http.put('/api/trips/3/budget/90/members/2/paid', () =>
        HttpResponse.json({ member: { id: 2, user_id: 2, paid: 1, username: 'ben' } })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    const cached = await offlineDb.budgetItems.get(90);
    expect(cached?.payers).toEqual(payers);
    expect(cached?.members?.map((m) => m.user_id)).toEqual([1, 2]);
    expect(cached?.persons).toBe(2);
    expect(await offlineDb.budgetItems.get(2)).toBeUndefined();
    expect(await offlineDb.budgetItems.count()).toBe(1);
  });

  it('FE-SYNC-BUDGET-003: an expense saved from an offline place reaches the server linked to its real id', async () => {
    const place = await placeRepo.create(3, { name: 'Cafe', lat: 1, lng: 2 });
    const placeTempId = place.place.id;
    await budgetRepo.create(3, { name: 'Coffee', total_price: 4, place_id: placeTempId });
    const queued = await offlineDb.mutationQueue.toArray();
    expect(queued.find((m) => m.url === '/trips/3/budget')?.body).toMatchObject({ place_id: placeTempId });
    let linkedTo: unknown;
    server.use(
      http.post('/api/trips/3/places', () =>
        HttpResponse.json({ place: { id: 650, trip_id: 3, name: 'Cafe', lat: 1, lng: 2 } })
      ),
      http.post('/api/trips/3/budget', async ({ request }) => {
        linkedTo = ((await request.json()) as { place_id?: number }).place_id;
        return HttpResponse.json({ item: buildBudgetItem({ id: 802, trip_id: 3, place_id: 650 }) });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(linkedTo).toBe(650);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('FE-SYNC-BUDGET-004: a payment replays once and leaves no row in the expense table', async () => {
    await budgetRepo.createSettlement(3, { from_user_id: 1, to_user_id: 2, amount: 10 });
    const keys: (string | null)[] = [];
    server.use(
      http.post('/api/trips/3/budget/settlements', ({ request }) => {
        keys.push(request.headers.get('X-Idempotency-Key'));
        return HttpResponse.json({ settlement: { id: 55, trip_id: 3, from_user_id: 1, to_user_id: 2, amount: 10 } });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(keys).toHaveLength(1);
    expect(keys[0]).toBeTruthy();
    expect(await offlineDb.budgetItems.count()).toBe(0);
    expect(await budgetRepo.pendingWrites(3)).toBe(0);
  });
});
