// FE-TSLICE-NOTES-001 to FE-TSLICE-NOTES-009 (error paths and empty-map paths of the day-notes slice)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildDay, buildDayNote } from '../../../tests/helpers/factories';
import { useTripStore } from '../tripStore';

beforeEach(() => {
  resetAllStores();
  server.resetHandlers();
});

describe('dayNotesSlice', () => {
  it('FE-TSLICE-NOTES-001: updateDayNotes throws the server message and leaves the day untouched', async () => {
    seedStore(useTripStore, { days: [buildDay({ id: 1, trip_id: 1, notes: 'original' })] });
    server.use(
      http.put('/api/trips/1/days/1', () =>
        HttpResponse.json({ error: 'Notes too long' }, { status: 422 }),
      ),
    );

    await expect(useTripStore.getState().updateDayNotes(1, 1, 'x'.repeat(10))).rejects.toThrow('Notes too long');
    expect(useTripStore.getState().days[0].notes).toBe('original');
  });

  it('FE-TSLICE-NOTES-002: updateDayTitle throws the server message and leaves the title untouched', async () => {
    seedStore(useTripStore, { days: [buildDay({ id: 1, trip_id: 1, title: 'Day one' })] });
    server.use(
      http.put('/api/trips/1/days/1', () =>
        HttpResponse.json({ error: 'Title rejected' }, { status: 422 }),
      ),
    );

    await expect(useTripStore.getState().updateDayTitle(1, 1, 'New title')).rejects.toThrow('Title rejected');
    expect(useTripStore.getState().days[0].title).toBe('Day one');
  });

  it('FE-TSLICE-NOTES-003: updateDayNotes matches the day by numeric id even for a string dayId', async () => {
    seedStore(useTripStore, {
      days: [buildDay({ id: 1, trip_id: 1 }), buildDay({ id: 2, trip_id: 1 })],
    });

    await useTripStore.getState().updateDayNotes(1, '2', 'Beach day');

    expect(useTripStore.getState().days[0].notes).toBeNull();
    expect(useTripStore.getState().days[1].notes).toBe('Beach day');
  });

  it('FE-TSLICE-NOTES-004: updateDayNote throws the server message and keeps the stored note', async () => {
    const note = buildDayNote({ id: 10, day_id: 1, text: 'Original' });
    seedStore(useTripStore, { dayNotes: { '1': [note] } });
    server.use(
      http.put('/api/trips/1/days/1/notes/10', () =>
        HttpResponse.json({ error: 'Note is locked' }, { status: 403 }),
      ),
    );

    await expect(
      useTripStore.getState().updateDayNote(1, 1, 10, { text: 'Changed' }),
    ).rejects.toThrow('Note is locked');
    expect(useTripStore.getState().dayNotes['1'][0].text).toBe('Original');
  });

  it('FE-TSLICE-NOTES-011: moving a note to another day keeps everything it carries (#1629)', async () => {
    const note = buildDayNote({ id: 10, day_id: 1, text: 'Ferry tickets', time: 'book **early**', icon: 'Ticket' });
    // buildDayNote predates note colours, so the field is set on the fixture.
    (note as unknown as { color: string }).color = '#dc2626';
    seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

    let posted: Record<string, unknown> | null = null;
    server.use(
      http.delete('/api/trips/1/days/1/notes/:noteId', () => HttpResponse.json({ success: true })),
      http.post('/api/trips/1/days/2/notes', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ note: { ...note, id: 11, day_id: 2, ...posted } });
      }),
    );

    await useTripStore.getState().moveDayNote(1, 1, 2, 10);

    // A move is a delete plus a create, so every field has to be re-sent — the
    // colour was the one that went missing.
    expect(posted).toMatchObject({
      text: 'Ferry tickets',
      time: 'book **early**',
      icon: 'Ticket',
      color: '#dc2626',
    });
    expect(useTripStore.getState().dayNotes['1']).toHaveLength(0);
    expect(useTripStore.getState().dayNotes['2'][0].color).toBe('#dc2626');
  });

  it('FE-TSLICE-NOTES-012: a note without a colour moves without inventing one', async () => {
    const note = buildDayNote({ id: 10, day_id: 1, text: 'Lunch' });
    seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

    let posted: Record<string, unknown> | null = null;
    server.use(
      http.delete('/api/trips/1/days/1/notes/:noteId', () => HttpResponse.json({ success: true })),
      http.post('/api/trips/1/days/2/notes', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ note: { ...note, id: 11, day_id: 2 } });
      }),
    );

    await useTripStore.getState().moveDayNote(1, 1, 2, 10);

    expect(posted!.color).toBeNull();
  });

  it('FE-TSLICE-NOTES-005: moveDayNote is a no-op when the note is not on the source day', async () => {
    const note = buildDayNote({ id: 10, day_id: 1 });
    seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });
    let called = false;
    server.use(
      http.delete('/api/trips/1/days/1/notes/:noteId', () => {
        called = true;
        return HttpResponse.json({ success: true });
      }),
    );

    await useTripStore.getState().moveDayNote(1, 1, 2, 999);

    expect(called).toBe(false);
    expect(useTripStore.getState().dayNotes['1']).toHaveLength(1);
    expect(useTripStore.getState().dayNotes['2']).toHaveLength(0);
  });

  it('FE-TSLICE-NOTES-007: addDayNote seeds a fresh list for a day with no notes yet', async () => {
    seedStore(useTripStore, { dayNotes: {} });
    server.use(
      http.post('/api/trips/1/days/4/notes', () =>
        HttpResponse.json({ note: buildDayNote({ id: 12, day_id: 4, text: 'Check-in 15:00' }) }),
      ),
    );

    const created = await useTripStore.getState().addDayNote(1, 4, { text: 'Check-in 15:00' });

    expect(created.id).toBe(12);
    expect(useTripStore.getState().dayNotes['4'].map(n => n.id)).toEqual([12]);
  });

  it('FE-TSLICE-NOTES-008: addDayNote rolls the temp note back out of a fresh list on failure', async () => {
    seedStore(useTripStore, { dayNotes: {} });
    server.use(
      http.post('/api/trips/1/days/4/notes', () =>
        HttpResponse.json({ error: 'Note rejected' }, { status: 422 }),
      ),
    );

    await expect(useTripStore.getState().addDayNote(1, 4, { text: 'nope' })).rejects.toThrow('Note rejected');
    expect(useTripStore.getState().dayNotes['4']).toEqual([]);
  });

  it('FE-TSLICE-NOTES-009: moveDayNote creates the target day list when it does not exist yet', async () => {
    const note = buildDayNote({ id: 10, day_id: 1, text: 'Ferry' });
    seedStore(useTripStore, { dayNotes: { '1': [note] } });
    server.use(
      http.post('/api/trips/1/days/5/notes', () =>
        HttpResponse.json({ note: buildDayNote({ id: 13, day_id: 5, text: 'Ferry' }) }),
      ),
    );

    await useTripStore.getState().moveDayNote(1, 1, 5, 10);

    expect(useTripStore.getState().dayNotes['1']).toEqual([]);
    expect(useTripStore.getState().dayNotes['5'].map(n => n.id)).toEqual([13]);
  });

  it('FE-TSLICE-NOTES-006: moveDayNote carries text, time and icon over to the target day', async () => {
    const note = buildDayNote({ id: 10, day_id: 1, text: 'Ferry', time: '08:15', icon: '⛴️' });
    seedStore(useTripStore, { dayNotes: { '1': [note], '2': [] } });

    let created: Record<string, unknown> = {};
    server.use(
      http.post('/api/trips/1/days/2/notes', async ({ request }) => {
        created = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ note: buildDayNote({ id: 11, day_id: 2, text: 'Ferry', time: '08:15', icon: '⛴️' }) });
      }),
    );

    await useTripStore.getState().moveDayNote(1, 1, 2, 10, 3);

    expect(created).toMatchObject({ text: 'Ferry', time: '08:15', icon: '⛴️', sort_order: 3 });
    expect(useTripStore.getState().dayNotes['1']).toHaveLength(0);
    expect(useTripStore.getState().dayNotes['2'][0].id).toBe(11);
  });
});
