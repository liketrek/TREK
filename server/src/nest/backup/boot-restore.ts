import fs from 'fs';
import path from 'path';
import { stageExtractedPluginTrees } from '../plugins/plugin-backup';
import { checkBackupDatabase, extractBackupArchive } from './backup-archive';

/**
 * Restoring a backup on the very first start (#1089).
 *
 * Moving an instance used to mean setting up a new one first: fetch the admin
 * password from the logs, sign in, click through the welcome, then restore in
 * the admin panel and throw the fresh admin away again. With
 * RESTORE_FROM_BACKUP pointing at an archive, the first start restores it
 * instead, and the instance comes up as the one the backup was taken from.
 *
 * ── When it runs ─────────────────────────────────────────────────────────
 *
 * Only while there is no database yet. The variable is typically left in the
 * compose file after the move, and a restart must not roll the instance back to
 * the day it moved; with a database present it is ignored with a warning.
 *
 * It runs before the database is opened, not after: the archive's database is
 * migrated on the normal open, the admin seed finds its users and adds none, and
 * the at-rest key the archive carries is in place before anything reads it. A
 * restore after startup would need a restart for that key, which is the setup
 * step this exists to remove.
 *
 * ── Why not an upload on the setup screen ────────────────────────────────
 *
 * A restore that anyone may run on an empty instance is a takeover: whoever
 * reaches it first installs their own admins. The environment belongs to
 * whoever runs the container, so that is where the switch lives.
 *
 * ── When it fails ────────────────────────────────────────────────────────
 *
 * Loudly, and without starting. An empty instance coming up instead would be
 * worse than no instance: its new database would then stop the restore from
 * ever running on the next start.
 */

export interface BootRestorePlan {
  /** The archive to restore, or null when the variable is not set. */
  archive: string | null;
  /** Where the database lives: TREK_DB_FILE, or data/travel.db. */
  dbFile: string;
  /** The data directory, for the scratch space and the at-rest key. */
  dataDir: string;
}

export type BootRestoreOutcome =
  | { restored: false; reason: 'unset' | 'database-exists' }
  /** `uploads` is the unpacked uploads tree, to hand to storage once it is up. Null when the archive had none. */
  | { restored: true; uploads: string | null; staging: string };

export class BootRestoreError extends Error {}

export async function restoreOnFirstBoot(plan: BootRestorePlan): Promise<BootRestoreOutcome> {
  if (!plan.archive) return { restored: false, reason: 'unset' };
  if (fs.existsSync(plan.dbFile)) {
    console.warn(`[restore] RESTORE_FROM_BACKUP is set, but ${plan.dbFile} already exists. The backup is only restored on a first start; remove the variable to silence this.`);
    return { restored: false, reason: 'database-exists' };
  }
  if (!fs.existsSync(plan.archive) || !fs.statSync(plan.archive).isFile()) {
    throw new BootRestoreError(`RESTORE_FROM_BACKUP: no backup archive at ${plan.archive}`);
  }

  console.log(`[restore] Restoring ${plan.archive} before the first start`);
  const staging = path.join(plan.dataDir, `restore-boot-${Date.now()}`);
  const refused = await extractBackupArchive(plan.archive, staging);
  if (refused) throw new BootRestoreError(`RESTORE_FROM_BACKUP: ${refused.error}`);

  const unreadable = checkBackupDatabase(staging);
  if (unreadable) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw new BootRestoreError(`RESTORE_FROM_BACKUP: ${unreadable.error}`);
  }

  fs.mkdirSync(path.dirname(plan.dbFile), { recursive: true });
  // Copied in beside the target and renamed, so a crash leaves either nothing or a whole file.
  const tmp = `${plan.dbFile}.restore-tmp`;
  fs.copyFileSync(path.join(staging, 'travel.db'), tmp);
  fs.renameSync(tmp, plan.dbFile);

  // The key the archive's secrets were encrypted with. An ENCRYPTION_KEY in the
  // environment still wins over the file, exactly as on any other start.
  const key = path.join(staging, '.encryption_key');
  if (fs.existsSync(key)) fs.copyFileSync(key, path.join(plan.dataDir, '.encryption_key'));

  // Plugin trees are swapped in by the runtime's own boot reconcile.
  stageExtractedPluginTrees(staging);

  const uploads = path.join(staging, 'uploads');
  return { restored: true, uploads: fs.existsSync(uploads) ? uploads : null, staging };
}
