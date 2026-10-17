import type { DayNoteCreateRequest, DayNoteUpdateRequest } from '@trek/shared';
import { dayNotesApi } from '../api/client';
import { offlineDb } from '../db/offlineDb';
import { generateUUID, mutationQueue, nextTempId } from '../sync/mutationQueue';
import { isEffectivelyOffline } from '../sync/networkMode';
import type { DayNote } from '../types';
import { cacheAfterWrite } from './dayRepo';

/**
 * The notes of a day live on the cached day (`notes_items`), the way the day
 * list answers them. Writes the server already took land there too, without
 * waiting: once the server has the note, a failing IndexedDB must not report
 * the save as failed.
 */
function cacheNote(dayId: number, note: DayNote, replaceId: number = note.id): Promise<void> {
  return offlineDb.days
    .where('id')
    .equals(dayId)
    .modify((day) => {
      const notes = day.notes_items ?? [];
      day.notes_items = notes.some((n) => n.id === replaceId)
        ? notes.map((n) => (n.id === replaceId ? { ...n, ...note } : n))
        : [...notes, note];
    })
    .then(() => undefined);
}

function uncacheNote(dayId: number, noteId: number): Promise<void> {
  return offlineDb.days
    .where('id')
    .equals(dayId)
    .modify((day) => {
      day.notes_items = (day.notes_items ?? []).filter((n) => n.id !== noteId);
    })
    .then(() => undefined);
}

function noteUrl(tripId: number | string, dayId: number, id: number): string {
  return `/trips/${tripId}/days/${dayId}/notes/${id < 0 ? '{id}' : id}`;
}

/** Queue a write to one note, held behind any older write to it (a create offline included). */
async function enqueueNoteWrite(
  tripId: number | string,
  dayId: number,
  id: number,
  method: 'PUT' | 'DELETE',
  body: unknown
): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: noteUrl(tripId, dayId, id),
    body,
    resource: 'dayNotes',
    entityId: id,
    ...(id < 0 ? { tempEntityId: id } : {}),
  });
  mutationQueue.sendSoon();
}

/**
 * The notes of a day through the offline core. A note written offline lands on
 * the cached day and in the mutation queue and replays once the connection is
 * back. Notes carry no version token, so an online write to a note that still
 * has an older one queued joins the queue behind it (mustQueue).
 */
export const dayNoteRepo = {
  async create(tripId: number | string, dayId: number, data: DayNoteCreateRequest): Promise<{ note: DayNote }> {
    if (!isEffectivelyOffline()) {
      const result: { note: DayNote } = await dayNotesApi.create(tripId, dayId, data);
      cacheAfterWrite(cacheNote(dayId, result.note), 'adding a day note');
      return result;
    }
    const tempId = nextTempId();
    const note: DayNote = {
      id: tempId,
      day_id: dayId,
      trip_id: Number(tripId),
      text: data.text,
      time: data.time ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      ...(data.sort_order === undefined ? {} : { sort_order: data.sort_order }),
      created_at: new Date().toISOString(),
    };
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await cacheNote(dayId, note);
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: Number(tripId),
        method: 'POST',
        url: `/trips/${tripId}/days/${dayId}/notes`,
        body: data,
        resource: 'dayNotes',
        tempId,
      });
    });
    return { note };
  },

  /** `before` is the note as it stands, so an offline edit can show the whole note. */
  async update(
    tripId: number | string,
    dayId: number,
    before: DayNote,
    data: DayNoteUpdateRequest
  ): Promise<{ note: DayNote }> {
    if (!(await mutationQueue.mustQueue('dayNotes', before.id))) {
      const result: { note: DayNote } = await dayNotesApi.update(tripId, dayId, before.id, data);
      cacheAfterWrite(cacheNote(dayId, result.note), 'editing a day note');
      return result;
    }
    const note = { ...before, ...data } as DayNote;
    await cacheNote(dayId, note);
    await enqueueNoteWrite(tripId, dayId, before.id, 'PUT', data);
    return { note };
  },

  async delete(tripId: number | string, dayId: number, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('dayNotes', id))) {
      await dayNotesApi.delete(tripId, dayId, id);
      cacheAfterWrite(uncacheNote(dayId, id), 'deleting a day note');
      return;
    }
    await uncacheNote(dayId, id);
    await enqueueNoteWrite(tripId, dayId, id, 'DELETE', undefined);
  },
};
