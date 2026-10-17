// FE-REPO-TODO-OFF-001 to FE-REPO-TODO-OFF-007
// Offline write paths (#2601), todoRepo.test.ts covers the reads.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTodoItem } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { todoRepo } from './todoRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

async function queue(): Promise<QueuedMutation[]> {
  return (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt);
}

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('todoRepo — offline', () => {
  it('FE-REPO-TODO-OFF-001: a new task gets a temp row at the end of the list and a queued POST', async () => {
    await offlineDb.todoItems.bulkPut([
      buildTodoItem({ id: 10, trip_id: 4, sort_order: 0 }),
      buildTodoItem({ id: 11, trip_id: 4, sort_order: 3 }),
      buildTodoItem({ id: 12, trip_id: 5, sort_order: 9 }),
    ]);

    const { item } = await todoRepo.create(4, { name: 'Passport', category: 'Docs', priority: 2, due_date: null });

    expect(item.id).toBeLessThan(0);
    expect(item).toMatchObject({
      trip_id: 4,
      name: 'Passport',
      category: 'Docs',
      checked: 0,
      sort_order: 4,
      priority: 2,
      due_date: null,
      description: null,
      assigned_user_id: null,
    });
    expect(await offlineDb.todoItems.get(item.id)).toMatchObject({ name: 'Passport' });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'POST',
      url: '/trips/4/todo',
      resource: 'todoItems',
      tempId: item.id,
      body: { name: 'Passport', category: 'Docs', priority: 2, due_date: null },
    });
  });

  it('FE-REPO-TODO-OFF-002: a tick, an edit and a delete of an unsynced task wait for its id', async () => {
    const { item } = await todoRepo.create(4, { name: 'Visa' });
    const { item: ticked } = await todoRepo.update(4, item.id, { checked: true });
    expect(ticked).toMatchObject({ id: item.id, checked: 1 });
    const { item: edited } = await todoRepo.update(4, item.id, { name: 'Visa form', description: null });
    expect(edited).toMatchObject({ name: 'Visa form', checked: 1 });
    await todoRepo.delete(4, item.id);

    expect(await offlineDb.todoItems.get(item.id)).toBeUndefined();
    const [, tick, edit, del] = await queue();
    expect(tick).toMatchObject({
      method: 'PUT',
      url: '/trips/4/todo/{id}',
      tempEntityId: item.id,
      entityId: item.id,
      body: { checked: true },
    });
    expect(edit).toMatchObject({ method: 'PUT', url: '/trips/4/todo/{id}', tempEntityId: item.id });
    expect(del).toMatchObject({ method: 'DELETE', url: '/trips/4/todo/{id}', tempEntityId: item.id });
  });

  it('FE-REPO-TODO-OFF-003: an edit of a synced task keeps the fields it does not name', async () => {
    await offlineDb.todoItems.put(
      buildTodoItem({ id: 20, trip_id: 4, name: 'Insurance', priority: 1, category: 'Docs' })
    );
    const { item } = await todoRepo.update(4, 20, { name: 'Travel insurance', category: null });
    expect(item).toMatchObject({ id: 20, name: 'Travel insurance', priority: 1, category: null });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/4/todo/20', entityId: 20, resource: 'todoItems' });
  });

  it('FE-REPO-TODO-OFF-004: a reorder is written here and queued without the tasks that have no server id yet', async () => {
    await offlineDb.todoItems.bulkPut([
      buildTodoItem({ id: 30, trip_id: 4, sort_order: 0 }),
      buildTodoItem({ id: 31, trip_id: 4, sort_order: 1 }),
    ]);
    await todoRepo.reorder(4, [31, -7, 30]);
    expect((await offlineDb.todoItems.get(31))?.sort_order).toBe(0);
    expect((await offlineDb.todoItems.get(30))?.sort_order).toBe(2);
    const [mutation] = await queue();
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/4/todo/reorder', body: { orderedIds: [31, 30] } });
    expect(mutation.resource).toBeUndefined();
  });

  it('FE-REPO-TODO-OFF-005: online, an edit of a task with a queued write joins the queue behind it', async () => {
    await offlineDb.todoItems.put(buildTodoItem({ id: 40, trip_id: 4, name: 'Old' }));
    await todoRepo.update(4, 40, { name: 'Offline' });
    setOnline(true);
    let sent = 0;
    server.use(
      http.put('/api/trips/4/todo/40', () => {
        sent += 1;
        return HttpResponse.error();
      })
    );
    const sendSoon = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => {});

    await todoRepo.update(4, 40, { name: 'Online' });

    expect(sent).toBe(0);
    expect(sendSoon).toHaveBeenCalled();
    expect((await queue()).map((m) => (m.body as { name: string }).name)).toEqual(['Offline', 'Online']);
  });

  it('FE-REPO-TODO-OFF-006: online, a write goes straight out and lands in the cache', async () => {
    setOnline(true);
    server.use(
      http.post('/api/trips/4/todo', () =>
        HttpResponse.json({ item: buildTodoItem({ id: 50, trip_id: 4, name: 'Tickets' }) })
      )
    );
    const { item } = await todoRepo.create(4, { name: 'Tickets' });
    expect(item.id).toBe(50);
    expect(await offlineDb.todoItems.get(50)).toMatchObject({ name: 'Tickets' });
    expect(await queue()).toEqual([]);
  });

  it('FE-REPO-TODO-OFF-007: the replay moves a new task to its real id and the queued tick follows it', async () => {
    const { item } = await todoRepo.create(4, { name: 'Adapter' });
    await todoRepo.update(4, item.id, { checked: true });
    const puts: string[] = [];
    server.use(
      http.post('/api/trips/4/todo', () =>
        HttpResponse.json({ item: buildTodoItem({ id: 60, trip_id: 4, name: 'Adapter' }) })
      ),
      http.put('/api/trips/4/todo/:id', ({ params }) => {
        puts.push(String(params.id));
        return HttpResponse.json({ item: buildTodoItem({ id: 60, trip_id: 4, name: 'Adapter', checked: 1 }) });
      })
    );
    setAuthed(true);
    setOnline(true);

    await mutationQueue.flush();

    expect(puts).toEqual(['60']);
    expect(await offlineDb.todoItems.get(item.id)).toBeUndefined();
    expect(await offlineDb.todoItems.get(60)).toMatchObject({ checked: 1 });
    expect(await queue()).toEqual([]);
  });
});
