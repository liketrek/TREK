import type { APIRequestContext } from '@playwright/test';
import { ensureNextcloudFolder, NEXTCLOUD_CONNECTION, NEXTCLOUD_FOLDER, resetDocSync } from './external';
import { drawPdf } from './fixtures';

/**
 * What the binding-settings guide needs beyond the Files fixtures: the trip
 * already bound to the Nextcloud folder, so the guide opens on the card and
 * not on the connection form that `files-sync` walks through. It takes the same
 * three calls the dialog makes (save the connection, list the folders, bind
 * one), starting from no binding at all, so it can run any number of times.
 * The store's address and app password come from media.env (external.ts).
 */

interface Scope {
  scopeKey: string;
  label: string;
  remoteRootId: string | null;
  remoteRootPath: string | null;
}

async function ok<T>(
  res: { ok(): boolean; status(): number; text(): Promise<string>; json(): Promise<unknown> },
  what: string
): Promise<T> {
  if (!res.ok()) throw new Error(`${what}: HTTP ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Binds the trip to the fixture folder in Nextcloud with the dialog's defaults; returns the link's id. */
export async function ensureNextcloudBinding(api: APIRequestContext, tripId: number): Promise<number> {
  await resetDocSync(api, tripId);
  await ensureNextcloudFolder(drawPdf);
  const base = `/api/trips/${tripId}/docsync`;
  const connection = await ok<{ id: number }>(
    await api.put(`${base}/connections`, { data: NEXTCLOUD_CONNECTION() }),
    'save the Nextcloud connection'
  );
  const { scopes = [] } = await ok<{ scopes?: Scope[] }>(
    await api.get(`${base}/connections/${connection.id}/scopes`),
    'list the Nextcloud folders'
  );
  // The picker finds the folder by its text the same way (folderRow in the guide).
  const scope =
    scopes.find((s) => s.label === NEXTCLOUD_FOLDER) ?? scopes.find((s) => s.label.includes(NEXTCLOUD_FOLDER));
  if (!scope)
    throw new Error(`no folder "${NEXTCLOUD_FOLDER}" in the store (found: ${scopes.map((s) => s.label).join(', ')})`);
  const link = await ok<{ id: number }>(
    await api.post(`${base}/links`, {
      data: {
        connectionId: connection.id,
        scopeKey: scope.scopeKey,
        remoteRootId: scope.remoteRootId,
        remoteRootPath: scope.remoteRootPath,
        remoteLabel: scope.label,
        direction: 'both',
        deletePolicy: 'unlink',
        conflictPolicy: 'manual',
        syncEnabled: true,
      },
    }),
    'bind the trip to the folder'
  );
  return link.id;
}
