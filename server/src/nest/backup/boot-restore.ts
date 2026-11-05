import { pgRestore, pgTableNames } from '../../db/engine/postgres/pg-tools';
import { stageExtractedPluginTrees } from '../plugins/plugin-backup';
import { checkBackupDatabase, extractBackupArchive, markReclaimResetPending } from './backup-archive';
import { checkPostgresDump, PG_ARCHIVE_ENTRY } from './postgres-database-backup';

import fs from 'fs';
import path from 'path';

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
  /** `data/.trek-reclaim-reset` (data-paths.ts), left before the database is put in place. */
  reclaimResetFile: string;
  /**
   * Set when TREK runs on Postgres (TREK_DB_URL): the archive's dump is loaded
   * into the database, which must hold no table yet, instead of `dbFile`.
   */
  postgres?: { url: string; binDir: string | undefined };
}

export type BootRestoreOutcome =
  | { restored: false; reason: 'unset' | 'database-exists' }
  /** `uploads` is the unpacked uploads tree, to hand to storage once it is up. Null when the archive had none. */
  | { restored: true; uploads: string | null; staging: string };

export class BootRestoreError extends Error {}

/** A database is there already: on a file, the file; on Postgres, any table in its schema. */
async function existingDatabase(plan: BootRestorePlan): Promise<string | null> {
  if (!plan.postgres) return fs.existsSync(plan.dbFile) ? plan.dbFile : null;
  const tables = await pgTableNames(plan.postgres.url, plan.postgres.binDir);
  return tables.length > 0 ? `the Postgres database (${tables.length} table(s))` : null;
}

/** Why the unpacked archive's database cannot be restored here, or null. */
async function checkArchiveDatabase(plan: BootRestorePlan, staging: string): Promise<string | null> {
  if (plan.postgres) return checkPostgresDump(staging, plan.postgres.binDir);
  return checkBackupDatabase(staging)?.error ?? null;
}

/** Puts the archive's database in place: renamed in beside the file, or loaded into Postgres in one transaction. */
async function putDatabaseInPlace(plan: BootRestorePlan, staging: string): Promise<void> {
  if (plan.postgres) {
    await pgRestore(plan.postgres.url, path.join(staging, PG_ARCHIVE_ENTRY), plan.postgres.binDir);
    return;
  }
  fs.mkdirSync(path.dirname(plan.dbFile), { recursive: true });
  // Copied in beside the target and renamed, so a crash leaves either nothing or a whole file.
  const tmp = `${plan.dbFile}.restore-tmp`;
  fs.copyFileSync(path.join(staging, 'travel.db'), tmp);
  fs.renameSync(tmp, plan.dbFile);
}

export async function restoreOnFirstBoot(plan: BootRestorePlan): Promise<BootRestoreOutcome> {
  if (!plan.archive) return { restored: false, reason: 'unset' };
  const existing = await existingDatabase(plan);
  if (existing) {
    console.warn(
      `[restore] RESTORE_FROM_BACKUP is set, but ${existing} already exists. The backup is only restored on a first start; remove the variable to silence this.`,
    );
    return { restored: false, reason: 'database-exists' };
  }
  if (!fs.existsSync(plan.archive) || !fs.statSync(plan.archive).isFile()) {
    throw new BootRestoreError(`RESTORE_FROM_BACKUP: no backup archive at ${plan.archive}`);
  }

  console.log(`[restore] Restoring ${plan.archive} before the first start`);
  const staging = path.join(plan.dataDir, `restore-boot-${Date.now()}`);
  const refused = await extractBackupArchive(plan.archive, staging);
  if (refused) throw new BootRestoreError(`RESTORE_FROM_BACKUP: ${refused.error}`);

  const unreadable = await checkArchiveDatabase(plan, staging);
  if (unreadable) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw new BootRestoreError(`RESTORE_FROM_BACKUP: ${unreadable}`);
  }

  // Storage reclaim drops what the restored database knew about its storage on
  // the start that follows, even when the backup is this installation's own.
  markReclaimResetPending(plan.reclaimResetFile);
  await putDatabaseInPlace(plan, staging);

  // The key the archive's secrets were encrypted with. An ENCRYPTION_KEY in the
  // environment still wins over the file, exactly as on any other start.
  const key = path.join(staging, '.encryption_key');
  if (fs.existsSync(key)) fs.copyFileSync(key, path.join(plan.dataDir, '.encryption_key'));

  // Plugin trees are swapped in by the runtime's own boot reconcile.
  stageExtractedPluginTrees(staging);

  const uploads = path.join(staging, 'uploads');
  return { restored: true, uploads: fs.existsSync(uploads) ? uploads : null, staging };
}
