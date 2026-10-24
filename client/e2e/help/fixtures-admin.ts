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
