import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useTripStore } from '../../../src/store/tripStore';
import { resetAllStores, seedStore } from '../../helpers/store';
import { buildDay, buildDayNote } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';

vi.mock('../../../src/api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  joinTrip: vi.fn(),
  leaveTrip: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
}));

beforeEach(() => {
  resetAllStores();
});

describe('dayNotesSlice', () => {
  describe('addDayNote', () => {
    it('FE-DAYNOTES-001: addDayNote inserts temp note immediately, replaces on success', async () => {
      seedStore(useTripStore, { dayNotes: { '1': [] } });

      let tempAdded = false;
      const realNote = buildDayNote({ id: 500, day_id: 1, text: 'New note' });

      server.use(
        http.post('/api/trips/1/days/1/notes', async () => {
          const state = useTripStore.getState();
          const notes = state.dayNotes['1'];
          if (notes.some(n => n.id < 0)) {
            tempAdded = true;
          }
          return HttpResponse.json({ note: realNote });
        }),
      );

      const result = await useTripStore.getState().addDayNote(1, 1, { text: 'New note', sort_order: 0 });

      expect(tempAdded).toBe(true);
      expect(result.id).toBe(500);
      const notes = useTripStore.getState().dayNotes['1'];
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(500);
    });

    it('FE-DAYNOTES-002: addDayNote on failure rolls back — temp note removed', async () => {
      seedStore(useTripStore, { dayNotes: { '1': [] } });

      server.use(
        http.post('/api/trips/1/days/1/notes', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(
        useTripStore.getState().addDayNote(1, 1, { text: 'Fail note', sort_order: 0 })
      ).rejects.toThrow();

      expect(useTripStore.getState().dayNotes['1']).toHaveLength(0);
    });
  });

  describe('updateDayNote', () => {
    it('FE-DAYNOTES-003: updateDayNote replaces note in map by id', async () => {
      const note = buildDayNote({ id: 10, day_id: 1, text: 'Old text' });
      seedStore(useTripStore, { dayNotes: { '1': [note] } });

      const updated = { ...note, text: 'Updated text' };
      server.use(
        http.put('/api/trips/1/days/1/notes/10', () =>
          HttpResponse.json({ note: updated })
        ),
      );

      const result = await useTripStore.getState().updateDayNote(1, 1, 10, { text: 'Updated text' });

      expect(result.text).toBe('Updated text');
      expect(useTripStore.getState().dayNotes['1'][0].text).toBe('Updated text');
    });
  });

  describe('deleteDayNote', () => {
    it('FE-DAYNOTES-004: deleteDayNote optimistically removes note, restores on failure', async () => {
      const note = buildDayNote({ id: 10, day_id: 1 });
      seedStore(useTripStore, { dayNotes: { '1': [note] } });

      server.use(
        http.delete('/api/trips/1/days/1/notes/10', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
      );

      await expect(useTripStore.getState().deleteDayNote(1, 1, 10)).rejects.toThrow();

      // Rolled back
      expect(useTripStore.getState().dayNotes['1']).toHaveLength(1);
      expect(useTripStore.getState().dayNotes['1'][0].id).toBe(10);
    });

    it('FE-DAYNOTES-004b: deleteDayNote success removes note from correct day', async () => {
      const note1 = buildDayNote({ id: 10, day_id: 1 });
      const note2 = buildDayNote({ id: 20, day_id: 1 });
      seedStore(useTripStore, { dayNotes: { '1': [note1, note2] } });

      await useTripStore.getState().deleteDayNote(1, 1, 10);

      const notes = useTripStore.getState().dayNotes['1'];
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(20);
    });
  });

  describe('moveDayNote', () => {
    it('FE-DAYNOTES-005: moveDayNote removes from source, adds to target (delete+create)', async () => {
      const note = buildDayNote({ id: 10, day_id: 1, text: 'Move me' });
      const newNote = buildDayNote({ id: 99, day_id: 2, text: 'Move me' });
      seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

      server.use(
        http.delete('/api/trips/1/days/1/notes/10', () => HttpResponse.json({ success: true })),
        http.post('/api/trips/1/days/2/notes', () => HttpResponse.json({ note: newNote })),
      );

      await useTripStore.getState().moveDayNote(1, 1, 2, 10);

      expect(useTripStore.getState().dayNotes['1']).toHaveLength(0);
      expect(useTripStore.getState().dayNotes['2']).toHaveLength(1);
      expect(useTripStore.getState().dayNotes['2'][0].id).toBe(99);
    });

    it('FE-DAYNOTES-006: moveDayNote rolls back to source day on failure', async () => {
      const note = buildDayNote({ id: 10, day_id: 1, text: 'Move me' });
      seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

      let deleted = false;
      server.use(
        http.post('/api/trips/1/days/2/notes', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
        http.delete('/api/trips/1/days/1/notes/10', () => {
          deleted = true;
          return HttpResponse.json({ success: true });
        }),
      );

      await expect(useTripStore.getState().moveDayNote(1, 1, 2, 10)).rejects.toThrow();

      // The create is the first half of the move, so a failure there must leave
      // the note where it was instead of deleting it out from under the user.
      expect(deleted).toBe(false);
      expect(useTripStore.getState().dayNotes['1']).toHaveLength(1);
      expect(useTripStore.getState().dayNotes['1'][0].id).toBe(10);
    });

    it('FE-DAYNOTES-006b: moveDayNote removes the copy again when the source delete fails', async () => {
      const note = buildDayNote({ id: 10, day_id: 1, text: 'Move me' });
      const newNote = buildDayNote({ id: 99, day_id: 2, text: 'Move me' });
      seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

      const deletedFromTarget: number[] = [];
      server.use(
        http.post('/api/trips/1/days/2/notes', () => HttpResponse.json({ note: newNote })),
        http.delete('/api/trips/1/days/1/notes/10', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        ),
        http.delete('/api/trips/1/days/2/notes/:noteId', ({ params }) => {
          deletedFromTarget.push(Number(params.noteId));
          return HttpResponse.json({ success: true });
        }),
      );

      await expect(useTripStore.getState().moveDayNote(1, 1, 2, 10)).rejects.toThrow();

      expect(deletedFromTarget).toEqual([99]);
      expect(useTripStore.getState().dayNotes['1']).toHaveLength(1);
      expect(useTripStore.getState().dayNotes['2']).toHaveLength(0);
    });
  });

  describe('updateDayNotes', () => {
    it('FE-DAYNOTES-007: updateDayNotes persists notes text and updates days array', async () => {
      const day = buildDay({ id: 1, trip_id: 1, notes: null });
      seedStore(useTripStore, { days: [day] });

      await useTripStore.getState().updateDayNotes(1, 1, 'My travel notes');

      const updatedDay = useTripStore.getState().days.find(d => d.id === 1);
      expect(updatedDay?.notes).toBe('My travel notes');
    });
  });

  describe('updateDayTitle', () => {
    it('FE-DAYNOTES-008: updateDayTitle persists title and updates days array', async () => {
      const day = buildDay({ id: 1, trip_id: 1, title: null });
      seedStore(useTripStore, { days: [day] });

      await useTripStore.getState().updateDayTitle(1, 1, 'Day at the Beach');

      const updatedDay = useTripStore.getState().days.find(d => d.id === 1);
      expect(updatedDay?.title).toBe('Day at the Beach');
    });
  });

  // #2601: offline the plan writes wait in the queue instead of failing.
  describe('offline', () => {
    const setOnline = (v: boolean) => Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
    afterEach(() => setOnline(true));

    it('FE-DAYNOTES-OFF-001: a note added offline stays on the day and waits in the queue', async () => {
      await clearAll();
      seedStore(useTripStore, { dayNotes: { '1': [] } });
      setOnline(false);

      const note = await useTripStore.getState().addDayNote(1, 1, { text: 'Lunch' });

      expect(note.id).toBeLessThan(0);
      expect(useTripStore.getState().dayNotes['1'].map(n => n.text)).toEqual(['Lunch']);
      expect((await offlineDb.mutationQueue.toArray()).map(m => m.url)).toEqual(['/trips/1/days/1/notes']);
    });

    it('FE-DAYNOTES-OFF-002: a day renamed offline keeps the new name and waits in the queue', async () => {
      await clearAll();
      seedStore(useTripStore, { days: [buildDay({ id: 1, trip_id: 1, title: null })] });
      setOnline(false);

      await useTripStore.getState().updateDayTitle(1, 1, 'Arrival');

      expect(useTripStore.getState().days[0].title).toBe('Arrival');
      expect((await offlineDb.mutationQueue.toArray()).map(m => m.body)).toEqual([{ title: 'Arrival' }]);
    });

    it('FE-DAYNOTES-OFF-003: a note moved offline is created on the other day and deleted on its own, in that order', async () => {
      await clearAll();
      seedStore(useTripStore, { dayNotes: { '1': [buildDayNote({ id: 900, day_id: 1, text: 'Museum' })], '2': [] } });
      setOnline(false);

      await useTripStore.getState().moveDayNote(1, 1, 2, 900);

      expect(useTripStore.getState().dayNotes['2'].map(n => n.text)).toEqual(['Museum']);
      expect(useTripStore.getState().dayNotes['1']).toEqual([]);
      const queued = (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt);
      expect(queued.map(m => [m.method, m.url])).toEqual([
        ['POST', '/trips/1/days/2/notes'],
        ['DELETE', '/trips/1/days/1/notes/900'],
      ]);
    });
  });
});
