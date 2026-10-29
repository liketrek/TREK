import apiClient from './client';

/** /api/admin/service-identity: how this installation stands with the TREK services. Admin only. */
export const serviceIdentityApi = {
  status: (signal?: AbortSignal): Promise<unknown> =>
    apiClient.get('/admin/service-identity', { signal }).then((r) => r.data),
  regenerate: (): Promise<unknown> => apiClient.post('/admin/service-identity/regenerate').then((r) => r.data),
};
