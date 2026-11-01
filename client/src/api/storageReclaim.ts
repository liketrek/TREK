import type { StorageReclaimConfirmRequest, StorageReclaimState } from '@trek/shared';
import { apiClient } from './client';

/** Admin > Storage, unreferenced files: the nightly deletion switch, a check on demand, and the large-share confirmation. */
export const storageReclaimApi = {
  setDelete: (deleteEnabled: boolean): Promise<StorageReclaimState> =>
    apiClient.put('/admin/storage/reclaim', { deleteEnabled }).then((r) => r.data),
  /** Starts a report-only check in the background (202); its report arrives through the admin state. */
  check: (): Promise<{ started: true }> => apiClient.post('/admin/storage/reclaim/run').then((r) => r.data),
  /** `unreferenced` is the count the admin was shown: the server refuses when its own count has moved on. */
  confirm: (request: StorageReclaimConfirmRequest): Promise<StorageReclaimState> =>
    apiClient
      .post('/admin/storage/reclaim/confirm', request satisfies StorageReclaimConfirmRequest)
      .then((r) => r.data),
};
