import { useCallback, useEffect, useState } from 'react';

import { filesApi } from '../../api/client';
import type { useTranslation } from '../../i18n';
import type { TripFile } from '../../types';
import type { useToast } from '../shared/Toast';

export interface FileTrashOptions {
  tripId: number;
  t: ReturnType<typeof useTranslation>['t'];
  toast: ReturnType<typeof useToast>;
  /** Reloads the trip's live files after a restore brought one back. */
  onRestored: () => void;
  /**
   * The phone's sheet: the trash loads every time this turns true, and a load still in
   * flight when it closes or the trip changes is dropped. Left out, nothing loads by
   * itself and the desktop view calls `load` when it opens the trash.
   */
  open?: boolean;
}

/**
 * The trashed files of a trip behind both shells: the desktop file manager's trash view
 * and the phone's trash sheet. Each shell keeps its own confirm step and busy markers and
 * calls the actions here once the user said yes.
 */
export function useFileTrash({ tripId, t, toast, onRestored, open }: FileTrashOptions) {
  const [files, setFiles] = useState<TripFile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await filesApi.list(tripId, true);
      setFiles(data.files || []);
    } catch {
      // An unreachable trash shows as empty.
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    filesApi
      .list(tripId, true)
      .then((data: { files?: TripFile[] }) => {
        if (!cancelled) setFiles(data.files || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tripId]);

  const restore = async (fileId: number) => {
    try {
      await filesApi.restore(tripId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onRestored();
      toast.success(t('files.toast.restored'));
    } catch {
      toast.error(t('files.toast.restoreError'));
    }
  };

  const permanentDelete = async (fileId: number) => {
    try {
      await filesApi.permanentDelete(tripId, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success(t('files.toast.deleted'));
    } catch {
      toast.error(t('files.toast.deleteError'));
    }
  };

  const emptyTrash = async () => {
    try {
      await filesApi.emptyTrash(tripId);
      setFiles([]);
      toast.success(t('files.toast.trashEmptied'));
    } catch {
      toast.error(t('files.toast.deleteError'));
    }
  };

  return { files, loading, load, restore, permanentDelete, emptyTrash };
}
