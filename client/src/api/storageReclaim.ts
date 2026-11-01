import type { StorageReclaimConfirmRequest, StorageReclaimState } from '@trek/shared';
import { apiClient } from './client';

/** Admin > Storage, unreferenced files: the nightly deletion switch, a check on demand, and the large-share confirmation. */
export const storageReclaimApi = {
  setDelete: (deleteEnabled: boolean): Promise<StorageReclaimState> =>
    apiClient.put('/admin/storage/reclaim', { deleteEnabled }).then((r) => r.data),
  /** Starts a report-only check in the background (202); its report arrives through the admin state. */
  check: (): Promise<{ started: true }> => apiClient.post('/admin/storage/reclaim/run').then((r) => r.data),
  confirm: (category: StorageReclaimConfirmRequest['category']): Promise<StorageReclaimState> =>
    apiClient
      .post('/admin/storage/reclaim/confirm', { category } satisfies StorageReclaimConfirmRequest)
      .then((r) => r.data),
};
