/**
 * Post-write hook for finished backup archives.
 *
 * Two builders write zips into data/backups and they have always diverged:
 * `backupService.createBackup()` packs the full manual archive (DB snapshot,
 * uploads with cache excludes, plugin trees), while `scheduler.runBackup()`
 * packs the simpler `auto-backup-*.zip` on the cron. Mirroring a finished
 * archive to an external target has to apply to both, or manual and automatic
 * backups end up with different off-box coverage.
 *
 * Both call `onBackupWritten()` once their output stream has closed, so that
 * behaviour is written once here instead of twice at the call sites.
 *
 * The hook is best-effort by contract and never throws: the local archive is
 * already on disk and *is* the backup. A failing external target is logged and
 * audited, and reported back to the caller so the admin UI can surface it —
 * but it never turns a successful local backup into a failed one.
 */
import { logError, logInfo, writeAudit } from '../../services/auditLog';
import { isTargetUsable, resolveS3Target } from './backup-target.config';
import { deleteRemote, downloadRemote, listRemote, objectExists, s3Target, type BackupTarget, type RemoteBackup } from './backup-target.s3';

/** What happened to the archive after it was written. */
export interface BackupTargetOutcome {
  /** True when an external target is configured and enabled. */
  attempted: boolean;
  uploaded: boolean;
  /** Present when `attempted` and the upload failed. Safe to show an admin. */
  error?: string;
}

const NOT_ATTEMPTED: BackupTargetOutcome = { attempted: false, uploaded: false };

/**
 * The enabled destinations for a finished archive. One entry today; a further
 * BackupTarget implementation is added here and needs no change at either
 * builder's call site.
 */
function enabledTargets(): BackupTarget[] {
  const cfg = resolveS3Target();
  return cfg.enabled ? [s3Target(cfg)] : [];
}

/**
 * The archives that exist at the target, or an empty list when no target is
 * enabled. Never throws: the backup list must still render when the bucket is
 * unreachable — the local backups are the ones that matter most.
 */
export async function listRemoteBackups(
  isBackupName: (n: string) => boolean,
): Promise<{ backups: RemoteBackup[]; error?: string }> {
  try {
    // Resolving the config reads app_settings, so it belongs inside the try:
    // a DB read that fails must not take the whole backup list down with it.
    const cfg = resolveS3Target();
    if (!cfg.enabled || !isTargetUsable(cfg)) return { backups: [] };
    return { backups: await listRemote(cfg, isBackupName) };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    logError(`Backup target list failed: ${error}`);
    return { backups: [], error };
  }
}

/**
 * Delete an archive from the target.
 *
 * Called when an admin deletes a backup in the UI: leaving the mirrored copy
 * behind would mean "delete" silently does not delete, and the archive keeps
 * costing storage and staying restorable long after someone chose to remove it.
 *
 * Returns an error string instead of throwing — a target that is unreachable
 * must not fail the local delete, which has already succeeded.
 */
export async function deleteRemoteBackup(filename: string): Promise<{ deleted: boolean; error?: string }> {
  try {
    const cfg = resolveS3Target();
    if (!cfg.enabled || !isTargetUsable(cfg)) return { deleted: false };
    await deleteRemote(filename, cfg);
    writeAudit({ userId: null, action: 'backup.target_deleted', resource: filename, details: { target: 's3' } });
    return { deleted: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    logError(`Backup target delete failed for ${filename}: ${error}`);
    writeAudit({ userId: null, action: 'backup.target_failed', resource: filename, details: { target: 's3', op: 'delete', error } });
    return { deleted: false, error };
  }
}

/**
 * Whether the target holds this archive. False whenever no target is enabled,
 * so callers can treat "no target" and "not there" identically.
 */
export async function remoteBackupExists(filename: string): Promise<boolean> {
  try {
    const cfg = resolveS3Target();
    if (!cfg.enabled || !isTargetUsable(cfg)) return false;
    return await objectExists(filename, cfg);
  } catch {
    return false;
  }
}

/** Fetch a remote archive to `destPath` so it can be restored like a local one. */
export async function fetchRemoteBackup(filename: string, destPath: string): Promise<void> {
  const cfg = resolveS3Target();
  if (!cfg.enabled || !isTargetUsable(cfg)) {
    throw new Error('S3 backup target is not configured and enabled.');
  }
  await downloadRemote(filename, destPath, cfg);
}

/** Result of mirroring the existing on-disk backups to the target. */
export interface BackfillResult {
  total: number;
  uploaded: number;
  /** Already present at the target — not re-transferred. */
  skipped: number;
  failed: number;
  /** At most a handful, so a failed run stays readable in a toast. */
  errors: string[];
}

/**
 * Push archives that already exist on disk to the target.
 *
 * Turning the feature on is otherwise only forward-looking: everything backed
 * up before that moment stays on the box, which is the opposite of why someone
 * configures off-box backups. This closes that gap.
 *
 * Sequential on purpose. These are multi-gigabyte archives, and saturating the
 * uplink with parallel multipart uploads would starve the running instance for
 * no gain — the bottleneck is bandwidth, not request concurrency.
 */
export async function mirrorExistingBackups(zipPaths: string[]): Promise<BackfillResult> {
  const result: BackfillResult = { total: zipPaths.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

  let target: BackupTarget | undefined;
  try {
    [target] = enabledTargets();
  } catch (err: unknown) {
    target = undefined;
    logError(`Backup backfill: could not resolve the target: ${err instanceof Error ? err.message : err}`);
  }
  if (!target || !target.isConfigured()) {
    result.failed = result.total;
    result.errors.push('S3 backup target is not configured and enabled.');
    return result;
  }

  for (const zipPath of zipPaths) {
    try {
      if (await target.has(zipPath)) {
        result.skipped++;
        continue;
      }
      const outcome = await target.upload(zipPath);
      if (outcome.uploaded) {
        result.uploaded++;
      } else {
        result.failed++;
        if (result.errors.length < 3) result.errors.push(outcome.error ?? 'Upload failed.');
      }
    } catch (err: unknown) {
      result.failed++;
      if (result.errors.length < 3) result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  logInfo(`Backup backfill to ${target.id}: ${result.uploaded} uploaded, ${result.skipped} already present, ${result.failed} failed`);
  writeAudit({
    userId: null,
    action: result.failed > 0 ? 'backup.target_failed' : 'backup.target_uploaded',
    details: { target: target.id, backfill: true, uploaded: result.uploaded, skipped: result.skipped, failed: result.failed },
  });
  return result;
}

export async function onBackupWritten(zipPath: string): Promise<BackupTargetOutcome> {
  try {
    const [target] = enabledTargets();
    if (!target) return NOT_ATTEMPTED;

    if (!target.isConfigured()) {
      // Enabled but half-configured is a real misconfiguration, not a silent
      // "off" — an admin who ticked the box expects their backups off-box.
      const error = 'S3 backup target is enabled but incomplete (bucket, access key and secret are required).';
      logError(`Backup target: ${error}`);
      writeAudit({ userId: null, action: 'backup.target_failed', resource: zipPath, details: { error } });
      return { attempted: true, uploaded: false, error };
    }

    const result = await target.upload(zipPath);

    if (result.uploaded) {
      logInfo(`Backup mirrored to ${target.id} target: ${result.key}`);
      writeAudit({
        userId: null,
        action: 'backup.target_uploaded',
        resource: result.key,
        details: { target: target.id },
      });
      return { attempted: true, uploaded: true };
    }

    logError(`Backup target upload failed: ${result.error}`);
    writeAudit({
      userId: null,
      action: 'backup.target_failed',
      resource: result.key ?? zipPath,
      details: { target: target.id, error: result.error },
    });
    return { attempted: true, uploaded: false, error: result.error };
  } catch (err: unknown) {
    // Nothing above is expected to throw (target.upload returns its errors), so
    // reaching here means a config/DB read failed. Still must not propagate:
    // the local backup succeeded.
    const error = err instanceof Error ? err.message : String(err);
    logError(`Backup post-write hook: ${error}`);
    return { attempted: true, uploaded: false, error };
  }
}
