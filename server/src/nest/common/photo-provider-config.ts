/**
 * Where the client finds a provider's settings/status/test endpoints. Pure
 * string building in the shared kernel: the admin and addons surfaces both
 * read it, and neither should have to import the memories domain to do so.
 */
export interface PhotoProviderConfig {
  settings_get: string;
  settings_put: string;
  status_get: string;
  test_post: string;
}

export function getPhotoProviderConfig(providerId: string): PhotoProviderConfig {
  const prefix = `/integrations/memories/${providerId}`;
  return {
    settings_get: `${prefix}/settings`,
    settings_put: `${prefix}/settings`,
    status_get: `${prefix}/status`,
    test_post: `${prefix}/test`,
  };
}
