import type { StorageReclaimReport, StorageReclaimState } from '@trek/shared';
import { apiClient } from './client';

/** Admin > Storage, unreferenced files: the nightly deletion switch and a check on demand. */
export const storageReclaimApi = {
  setDelete: (deleteEnabled: boolean): Promise<StorageReclaimState> =>
    apiClient.put('/admin/storage/reclaim', { deleteEnabled }).then((r) => r.data),
  // A check lists every reclaimable category and asks each domain about it; a
  // large bucket outlasts the 8s instance timeout. It only reports, whatever the switch says.
  check: (): Promise<StorageReclaimReport> =>
    apiClient.post('/admin/storage/reclaim/run', { reportOnly: true }, { timeout: 300_000 }).then((r) => r.data),
};
