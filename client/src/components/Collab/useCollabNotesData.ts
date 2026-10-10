import { useCallback, useEffect, useState } from 'react';

import { collabApi } from '../../api/client';
import { addListener, removeListener } from '../../api/websocket';
import type { useTranslation } from '../../i18n';
import type { useToast } from '../shared/Toast';
import type { CollabNoteData } from './collabModel';

export interface CollabNotesDataOptions {
  tripId: number;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  /** The desktop panel outlives a trip change, so a failed load there empties the list. */
  resetOnLoadError?: boolean;
  /** The desktop panel loads and listens only once it has a trip id; the phone tab always does. */
  waitForTripId?: boolean;
}

/**
 * Tells the trip's Files tab that note attachments changed. The server leaves the writer's
 * own socket out of its broadcast, so the tab that made the change has to say it itself;
 * useTripWebSocket listens and reloads the files.
 */
export function announceNoteFilesChanged(): void {
  window.dispatchEvent(new Event('collab-files-changed'));
}

/**
 * The trip notes behind the desktop Collab panel and the phone's notes tab, each reading
 * the rows through its own note type: the list as the server has it, kept current by the
 * WebSocket note events, and the attachment upload both run after a note is saved. Writing
 * a note, its colours and its categories stays with each shell, which differ there. Collab
 * has no store slice, so the notes live here.
 */
export function useCollabNotesData<N extends { id: number } = CollabNoteData>({
  tripId,
  t,
  toast,
  resetOnLoadError = false,
  waitForTripId = false,
}: CollabNotesDataOptions) {
  const [notes, setNotes] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (waitForTripId && !tripId) return;
    let cancelled = false;
    setLoading(true);
    collabApi
      .getNotes(tripId)
      .then((data: N[] | { notes?: N[] } | null) => {
        if (!cancelled) setNotes(Array.isArray(data) ? data : data?.notes || []);
      })
      .catch(() => {
        if (!cancelled && resetOnLoadError) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, resetOnLoadError, waitForTripId]);

  useEffect(() => {
    if (waitForTripId && !tripId) return;
    const handler = (msg: Record<string, unknown>) => {
      // An event still in flight from a trip just left must not land in this list.
      if (String(msg?.tripId) !== String(tripId)) return;
      const note = msg.note as N | undefined;
      if (msg.type === 'collab:note:created' && note) {
        setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev : [note, ...prev]));
      }
      if (msg.type === 'collab:note:updated' && note) {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, ...note } : n)));
      }
      if (msg.type === 'collab:note:deleted') {
        const deletedId = (msg.noteId || msg.id) as number | undefined;
        if (deletedId) setNotes((prev) => prev.filter((n) => n.id !== deletedId));
      }
    };
    addListener(handler);
    return () => removeListener(handler);
  }, [tripId, waitForTripId]);

  /**
   * Uploads a saved note's attachments one by one; a file the server refuses is toasted
   * and the rest still go. `onFileError` sees each refusal before the toast. Once the
   * batch is through, the Files tab is told to reload.
   */
  const uploadNoteFiles = useCallback(
    async (noteId: number, files: File[], onFileError?: (err: unknown) => void) => {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          await collabApi.uploadNoteFile(tripId, noteId, fd);
        } catch (err) {
          onFileError?.(err);
          toast.error(t('common.error'));
        }
      }
      if (files.length > 0) announceNoteFilesChanged();
    },
    [tripId, toast, t]
  );

  return { notes, setNotes, loading, uploadNoteFiles };
}
