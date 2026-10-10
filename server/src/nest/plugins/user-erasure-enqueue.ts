import type { PluginUserErasureQueueRepository } from '../../db/repositories/PluginUserErasureQueue.repository';
import type { PluginIdPermissionRow } from '../../db/repositories/Plugins.repository';

/**
 * Enqueue a durable GDPR erasure (`INSERT OR IGNORE`, idempotent) for every
 * plugin in `rows` that holds `hook:user-data`. Shared primitive (Plan 4
 * Task 8a, a 3j carry): before this, `UserCleanupService.erasePluginUserData`
 * (the account-deletion transaction's own enqueue, UC2/UC3) and
 * `PluginRuntimeService.enqueueUserErasure` (the `emitUserDeleted` sink's
 * post-commit enqueue) walked the IDENTICAL `SELECT id, permissions FROM
 * plugins` + `JSON.parse` + `hook:user-data` filter independently — and both
 * genuinely run for every account deletion: `deleteUserCompletely` calls the
 * first inside its own transaction, and `emitUserDeleted` fires the second
 * immediately after, from all three account-deletion call sites
 * (`auth.service.ts`, `admin.service.ts`, `trip-members.service.ts`'s guest
 * removal). The duplication was live, not theoretical — CLAUDE.md's "single
 * source of truth over manual synchronization".
 *
 * `rows` is caller-supplied, not fetched here:
 * `UserCleanupService.erasePluginUserData`'s own orphan-directory scan (its
 * second half, enqueuing for a plugin that was uninstalled with its data
 * retained) needs the SAME `plugins` read to compute which plugin ids are
 * still installed, so the caller fetches once (`PluginsRepository
 * .listIdsAndPermissions()`) and this function never re-queries.
 *
 * Never throws itself — a malformed `permissions` JSON value is treated as
 * `[]` and skipped, matching both legacy implementations exactly.
 */
export async function enqueueHookUserDataErasures(
  queue: PluginUserErasureQueueRepository,
  rows: readonly Pick<PluginIdPermissionRow, 'id' | 'permissions'>[],
  userId: number,
): Promise<void> {
  for (const r of rows) {
    let perms: unknown;
    try {
      perms = JSON.parse(r.permissions ?? '[]');
    } catch {
      perms = [];
    }
    if (Array.isArray(perms) && perms.includes('hook:user-data')) await queue.insertIgnore(r.id, userId);
  }
}
