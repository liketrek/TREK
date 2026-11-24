import type { APIRequestContext } from '@playwright/test';

/**
 * Small API helpers the admin guides use to put the seed back after a guide
 * changed something (a user it created, a default it set). Kept out of
 * `fixtures.ts`, which every screen shares.
 */

/** Deletes the account with this username, if there is one. */
export async function deleteUser(api: APIRequestContext, username: string): Promise<void> {
  const res = await api.get('/api/admin/users');
  if (!res.ok()) throw new Error(`could not list the users: ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as { users?: { id: number; username: string }[] };
  const user = (body.users ?? []).find((u) => u.username === username);
  if (!user) return;
  const del = await api.delete(`/api/admin/users/${user.id}`);
  if (!del.ok()) throw new Error(`could not delete user "${username}": ${del.status()} ${await del.text()}`);
}

/**
 * Returns these default user settings to TREK's built-in value, the way the
 * reset link beside a field does (one field per request, as the page sends it).
 */
export async function resetDefaults(api: APIRequestContext, keys: string[]): Promise<void> {
  for (const key of keys) {
    const res = await api.put('/api/admin/default-user-settings', { data: { [key]: null } });
    if (!res.ok()) throw new Error(`could not reset the default "${key}": ${res.status()} ${await res.text()}`);
  }
}

/** Writes instance settings the way the admin page does (PUT /api/auth/app-settings). */
export async function putAppSettings(api: APIRequestContext, patch: Record<string, string | boolean>): Promise<void> {
  const res = await api.put('/api/auth/app-settings', { data: patch });
  if (!res.ok()) throw new Error(`could not save the app settings: ${res.status()} ${await res.text()}`);
}

const OIDC_EMPTY = { issuer: '', client_id: '', client_secret: '', display_name: '', discovery_url: '' };

/**
 * An issuer and a client id, which is all TREK needs to call OIDC configured and
 * draw the SSO rows. Nothing is fetched from the issuer on save.
 */
export async function configureOidc(api: APIRequestContext): Promise<void> {
  const res = await api.put('/api/admin/oidc', {
    data: {
      ...OIDC_EMPTY,
      issuer: 'https://auth.example.org/application/o/trek/',
      client_id: 'trek',
      client_secret: 'a-long-client-secret',
      display_name: 'Authentik',
    },
  });
  if (!res.ok()) throw new Error(`could not configure OIDC: ${res.status()} ${await res.text()}`);
}

/** Back to the seed, where no identity provider is set. Password login is on there, so the server allows it. */
export async function clearOidc(api: APIRequestContext): Promise<void> {
  const res = await api.put('/api/admin/oidc', { data: OIDC_EMPTY });
  if (!res.ok()) throw new Error(`could not clear OIDC: ${res.status()} ${await res.text()}`);
}
