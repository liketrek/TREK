// FE-REPO-DAYNOTE-OFF-001 to FE-REPO-DAYNOTE-OFF-005, FE-REPO-DAY-OFF-001 to FE-REPO-DAY-OFF-004
// Offline writes of a day and its notes (#2601).
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDay, buildDayNote } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { dayNoteRepo } from './dayNoteRepo';
import { dayRepo } from './dayRepo';

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
  await offlineDb.days.put(
    buildDay({ id: 70, trip_id: 4, title: 'Old', notes_items: [buildDayNote({ id: 900, day_id: 70, text: 'Museum' })] })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('dayNoteRepo, offline', () => {
  it('FE-REPO-DAYNOTE-OFF-001: a new note lands on the cached day under a temp id and a POST waits in the queue', async () => {
    const { note } = await dayNoteRepo.create(4, 70, { text: 'Lunch', time: '12:00', color: null });

    expect(note.id).toBeLessThan(0);
    expect(note).toMatchObject({ day_id: 70, text: 'Lunch', time: '12:00' });
    expect((await offlineDb.days.get(70))?.notes_items?.map((n) => n.text)).toEqual(['Museum', 'Lunch']);
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'POST',
      url: '/trips/4/days/70/notes',
      resource: 'dayNotes',
      tempId: note.id,
      body: { text: 'Lunch', time: '12:00', color: null },
    });
  });

  it('FE-REPO-DAYNOTE-OFF-002: an edit and a delete of an unsynced note wait for its real id', async () => {
    const { note } = await dayNoteRepo.create(4, 70, { text: 'Lunch' });
    const { note: edited } = await dayNoteRepo.update(4, 70, note, { text: 'Brunch' });
    expect(edited).toMatchObject({ id: note.id, text: 'Brunch' });
    await dayNoteRepo.delete(4, 70, note.id);

    expect((await offlineDb.days.get(70))?.notes_items?.map((n) => n.id)).toEqual([900]);
    const [, edit, del] = await queue();
    expect(edit).toMatchObject({
      method: 'PUT',
      url: '/trips/4/days/70/notes/{id}',
      tempEntityId: note.id,
      resource: 'dayNotes',
    });
    expect(del).toMatchObject({ method: 'DELETE', url: '/trips/4/days/70/notes/{id}', tempEntityId: note.id });
  });

  it('FE-REPO-DAYNOTE-OFF-003: an edit of a synced note shows the whole note and names it in the url', async () => {
    const before = buildDayNote({ id: 900, day_id: 70, text: 'Museum', time: '10:00' });
    const { note } = await dayNoteRepo.update(4, 70, before, { time: '11:00' });

    expect(note).toMatchObject({ id: 900, text: 'Museum', time: '11:00' });
    expect((await offlineDb.days.get(70))?.notes_items?.[0]).toMatchObject({ time: '11:00' });
    expect((await queue())[0]).toMatchObject({ url: '/trips/4/days/70/notes/900', entityId: 900 });
  });

  it('FE-REPO-DAYNOTE-OFF-004: online, an edit joins the queue while an older write to the note waits', async () => {
    await dayNoteRepo.delete(4, 70, 900);
    setOnline(true);
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => {});
    const put = vi.fn();
    server.use(
      http.put('/api/trips/4/days/70/notes/900', () => {
        put();
        return HttpResponse.json({});
      })
    );

    await dayNoteRepo.update(4, 70, buildDayNote({ id: 900, day_id: 70 }), { text: 'x' });

    expect(put).not.toHaveBeenCalled();
    expect((await queue()).map((m) => m.method)).toEqual(['DELETE', 'PUT']);
  });

  it('FE-REPO-DAYNOTE-OFF-005: online, a new note goes to the server and onto the cached day', async () => {
    setOnline(true);
    server.use(
      http.post('/api/trips/4/days/70/notes', () =>
        HttpResponse.json({ note: buildDayNote({ id: 901, day_id: 70, text: 'Dinner' }) })
      )
    );

    const { note } = await dayNoteRepo.create(4, 70, { text: 'Dinner' });
    await new Promise((r) => setTimeout(r, 0));

    expect(note.id).toBe(901);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.days.get(70))?.notes_items?.map((n) => n.id)).toEqual([900, 901]);
  });
});

describe('dayRepo, offline', () => {
  it('FE-REPO-DAY-OFF-001: a new day title is cached at once and the PUT waits in the queue', async () => {
    await dayRepo.update(4, 70, { title: 'Arrival' });

    expect(await offlineDb.days.get(70)).toMatchObject({
      title: 'Arrival',
      notes_items: [expect.objectContaining({ id: 900 })],
    });
    expect((await queue())[0]).toMatchObject({
      method: 'PUT',
      url: '/trips/4/days/70',
      body: { title: 'Arrival' },
      resource: 'days',
      entityId: 70,
    });
  });

  it('FE-REPO-DAY-OFF-002: the travel mode of a day waits in the queue on its own route', async () => {
    await dayRepo.setTransport(4, 70, 'cycling');

    expect((await offlineDb.days.get(70))?.default_transport_mode).toBe('cycling');
    expect((await queue())[0]).toMatchObject({
      url: '/trips/4/days/70/transport',
      body: { transport_mode: 'cycling' },
      resource: 'days',
    });
  });

  it('FE-REPO-DAY-OFF-003: a new order of the days and a new empty day need a connection', async () => {
    await expect(dayRepo.reorder(4, [70])).rejects.toThrow('needs a connection');
    await expect(dayRepo.insert(4, 1)).rejects.toThrow('needs a connection');
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('FE-REPO-DAY-OFF-004: online with nothing queued, a title goes straight to the server', async () => {
    setOnline(true);
    const put = vi.fn();
    server.use(
      http.put('/api/trips/4/days/70', async ({ request }) => {
        put(await request.json());
        return HttpResponse.json({ day: buildDay({ id: 70, trip_id: 4, title: 'Arrival' }) });
      })
    );

    await dayRepo.update(4, 70, { title: 'Arrival' });
    await new Promise((r) => setTimeout(r, 0));

    expect(put).toHaveBeenCalledWith({ title: 'Arrival' });
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.days.get(70))?.title).toBe('Arrival');
  });
});
