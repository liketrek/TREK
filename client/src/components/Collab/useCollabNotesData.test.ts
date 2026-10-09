// FE-COLLAB-NOTESDATA-001 to FE-COLLAB-NOTESDATA-009: the note list behind the desktop
// Collab panel (empties on a failed load, waits for a trip id) and the phone's notes tab
// (keeps the list, always loads), with
// the live note events and the attachment upload both run after saving a note.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { CollabNoteData } from './collabModel';
import { useCollabNotesData, type CollabNotesDataOptions } from './useCollabNotesData';

const t = (key: string) => key;

function note(id: number, over: Partial<CollabNoteData> = {}): CollabNoteData {
  return {
    id,
    trip_id: 1,
    user_id: 2,
    title: `Note ${id}`,
    content: null,
    category: null,
    color: null,
    website: null,
    pinned: false,
    username: 'alice',
    avatar: null,
    avatar_url: null,
    created_at: '2026-05-01T10:00:00Z',
    attachments: [],
    ...over,
  };
}

function setup(over: Partial<CollabNotesDataOptions> = {}) {
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
  const hook = renderHook(
    (props: Partial<CollabNotesDataOptions>) => useCollabNotesData({ tripId: 1, t, toast, ...over, ...props }),
    { initialProps: {} }
  );
  return { ...hook, toast };
}

async function loaded(over: Partial<CollabNotesDataOptions> = {}) {
  const view = setup(over);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

function wsHandler(): (event: Record<string, unknown>) => void {
  const calls = vi.mocked(addListener).mock.calls;
  return calls[calls.length - 1][0] as (event: Record<string, unknown>) => void;
}

beforeEach(() => {
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
  vi.spyOn(collabApi, 'getNotes').mockResolvedValue({ notes: [note(1), note(2)] });
  vi.spyOn(collabApi, 'uploadNoteFile').mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCollabNotesData', () => {
  it('FE-COLLAB-NOTESDATA-001: loads the notes, from an object or a bare array', async () => {
    const { result } = setup();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(collabApi.getNotes).toHaveBeenCalledWith(1);
    expect(result.current.notes.map((n) => n.id)).toEqual([1, 2]);

    vi.mocked(collabApi.getNotes).mockResolvedValue([note(3)]);
    const bare = await loaded();
    expect(bare.result.current.notes.map((n) => n.id)).toEqual([3]);

    vi.mocked(collabApi.getNotes).mockResolvedValue({});
    const empty = await loaded();
    expect(empty.result.current.notes).toEqual([]);
  });

  it('FE-COLLAB-NOTESDATA-002: without a trip the desktop list waits, the phone list still loads', async () => {
    const desktop = setup({ tripId: 0, waitForTripId: true });
    expect(collabApi.getNotes).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
    expect(desktop.result.current.loading).toBe(true);

    const phone = await loaded({ tripId: 0 });
    expect(collabApi.getNotes).toHaveBeenCalledWith(0);
    expect(addListener).toHaveBeenCalledTimes(1);
    expect(phone.result.current.notes.map((n) => n.id)).toEqual([1, 2]);
  });

  it('FE-COLLAB-NOTESDATA-003: a failed reload empties the desktop list and keeps the phone list', async () => {
    const desktop = await loaded({ resetOnLoadError: true });
    const phone = await loaded();
    vi.mocked(collabApi.getNotes).mockRejectedValue(new Error('boom'));

    desktop.rerender({ tripId: 2 });
    phone.rerender({ tripId: 2 });
    await waitFor(() => expect(desktop.result.current.loading).toBe(false));
    await waitFor(() => expect(phone.result.current.loading).toBe(false));
    expect(desktop.result.current.notes).toEqual([]);
    expect(phone.result.current.notes.map((n) => n.id)).toEqual([1, 2]);
  });

  it('FE-COLLAB-NOTESDATA-004: live events create, update and delete, only for this trip', async () => {
    const { result } = await loaded();
    const handler = wsHandler();
    act(() => {
      handler({ type: 'collab:note:created', tripId: 2, note: note(7) });
      handler({ type: 'collab:note:created', tripId: '1', note: note(7) });
      handler({ type: 'collab:note:created', tripId: 1, note: note(7) });
      handler({ type: 'collab:note:updated', tripId: 1, note: { id: 1, title: 'renamed' } });
      handler({ type: 'collab:note:updated', tripId: 1 });
    });
    expect(result.current.notes.map((n) => n.id)).toEqual([7, 1, 2]);
    // An update folds into the note it names.
    expect(result.current.notes[1]).toMatchObject({ title: 'renamed', username: 'alice' });

    act(() => {
      handler({ type: 'collab:note:deleted', tripId: 1, noteId: 7 });
      handler({ type: 'collab:note:deleted', tripId: 1, id: 1 });
      handler({ type: 'collab:note:deleted', tripId: 1 });
    });
    expect(result.current.notes.map((n) => n.id)).toEqual([2]);
  });

  it('FE-COLLAB-NOTESDATA-005: unmounting removes the live listener', async () => {
    const { unmount } = await loaded();
    const handler = wsHandler();
    unmount();
    expect(removeListener).toHaveBeenCalledWith(handler);
  });

  it('FE-COLLAB-NOTESDATA-006: attachments upload one by one as a file field', async () => {
    const { result, toast } = await loaded();
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.png');
    await act(async () => {
      await result.current.uploadNoteFiles(5, [a, b]);
    });
    const calls = vi.mocked(collabApi.uploadNoteFile).mock.calls;
    expect(calls.map((c) => [c[0], c[1]])).toEqual([
      [1, 5],
      [1, 5],
    ]);
    expect(((calls[0][2] as FormData).get('file') as File).name).toBe(a.name);
    expect(((calls[1][2] as FormData).get('file') as File).name).toBe(b.name);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('FE-COLLAB-NOTESDATA-007: a refused file is reported and toasted, the rest still go', async () => {
    const err = new Error('too big');
    vi.mocked(collabApi.uploadNoteFile).mockRejectedValueOnce(err);
    const onFileError = vi.fn();
    const { result, toast } = await loaded();
    await act(async () => {
      await result.current.uploadNoteFiles(5, [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')], onFileError);
    });
    expect(collabApi.uploadNoteFile).toHaveBeenCalledTimes(2);
    expect(onFileError).toHaveBeenCalledWith(err);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COLLAB-NOTESDATA-008: setNotes lets a shell write the list it reloaded', async () => {
    const { result } = await loaded();
    act(() => result.current.setNotes([note(9)]));
    expect(result.current.notes.map((n) => n.id)).toEqual([9]);
  });

  it('FE-COLLAB-NOTESDATA-009: an upload batch tells the Files tab to reload once, an empty one does not', async () => {
    const onFilesChanged = vi.fn();
    window.addEventListener('collab-files-changed', onFilesChanged);
    try {
      vi.mocked(collabApi.uploadNoteFile).mockRejectedValueOnce(new Error('too big'));
      const { result } = await loaded();
      await act(async () => {
        await result.current.uploadNoteFiles(5, []);
      });
      expect(onFilesChanged).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.uploadNoteFiles(5, [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]);
      });
      expect(onFilesChanged).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('collab-files-changed', onFilesChanged);
    }
  });
});
