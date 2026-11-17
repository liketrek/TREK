import { authApi } from '../api/client';

/**
 * Public API keys, deliberately online-only: a key is minted by the server and
 * its secret is shown exactly once, so there is nothing a device could hold or
 * replay offline. The settings views reach them through here, never the API.
 */
export const apiKeysRepo = {
  list: authApi.apiKeys.list,
  create: authApi.apiKeys.create,
  delete: authApi.apiKeys.delete,
};
