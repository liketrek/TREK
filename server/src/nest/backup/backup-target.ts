/**
 * Post-write hook for finished backup archives, and the dispatcher that picks
 * the configured storage backend.
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
 * Everything below talks to a `BackupTarget`, never to S3 or the filesystem
 * directly. `targetFor()` is the single place that knows which backends exist;
 * adding one means adding a case there and a `BackupTargetType` value.
 *
 * The hook is best-effort by contract and never throws: the local archive is
 * already on disk and *is* the backup. A failing external target is logged and
 * audited, and reported back to the caller so the admin UI can surface it —
 * but it never turns a successful local backup into a failed one.
 */
import { logError, logInfo, writeAudit } from '../../services/auditLog';
import { resolveTarget } from './backup-target.config';
import { localTarget } from './backup-target.local';
import { s3Target, type BackupTarget, type RemoteBackup } from './backup-target.s3';

/** What happened to the archive after it was written. */
export interface BackupTargetOutcome {
  /** True when an external target is configured. */
  attempted: boolean;
  uploaded: boolean;
  /** Present when `attempted` and the upload failed. Safe to show an admin. */
  error?: string;
}

const NOT_ATTEMPTED: BackupTargetOutcome = { attempted: false, uploaded: false };

/**
 * The configured backend, or null when the target is off.
 *
 * `isBackupName` is threaded in rather than imported so this module stays free
 * of any dependency on the legacy backup service — which imports the hook from
 * here, and would otherwise form a cycle.
 */
export function targetFor(isBackupName: (n: string) => boolean): BackupTarget | null {
  const cfg = resolveTarget();
  switch (cfg.type) {
    case 's3':
      return s3Target(cfg, isBackupName);
    case 'local':
      return localTarget(cfg, isBackupName);
    default:
      return null;
  }
}

/**
 * Resolve the backend without throwing. Every read path below degrades rather
 * than failing: a broken target must never take down the backup list, and a
 * config read touches the DB.
 */
function safeTarget(isBackupName: (n: string) => boolean): BackupTarget | null {
  try {
    return targetFor(isBackupName);
  } catch (err: unknown) {
    logError(`Backup target: could not resolve the configured backend: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/** Used where the caller has no opinion on which filenames count as backups. */
const ANY_NAME = () => true;

/**
 * The archives that exist at the target, or an empty list when none is
 * configured. Never throws: the backup list must still render when the target
 * is unreachable — the local backups are the ones that matter most.
 */
export async function listRemoteBackups(
  isBackupName: (n: string) => boolean,
): Promise<{ backups: RemoteBackup[]; error?: string }> {
  const target = safeTarget(isBackupName);
  if (!target || !target.isConfigured()) return { backups: [] };
  try {
    return { backups: await target.list() };
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
  const target = safeTarget(ANY_NAME);
  if (!target || !target.isConfigured()) return { deleted: false };
  try {
    await target.remove(filename);
    writeAudit({ userId: null, action: 'backup.target_deleted', resource: filename, details: { target: target.id } });
    return { deleted: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    logError(`Backup target delete failed for ${filename}: ${error}`);
    writeAudit({ userId: null, action: 'backup.target_failed', resource: filename, details: { target: target.id, op: 'delete', error } });
    return { deleted: false, error };
  }
}

/**
 * Whether the target holds this archive. False whenever no target is
 * configured, so callers can treat "no target" and "not there" identically.
 */
export async function remoteBackupExists(filename: string): Promise<boolean> {
  const target = safeTarget(ANY_NAME);
  if (!target || !target.isConfigured()) return false;
  try {
    return await target.has(filename);
  } catch {
    return false;
  }
}

/** Fetch a remote archive to `destPath` so it can be restored like a local one. */
export async function fetchRemoteBackup(filename: string, destPath: string): Promise<void> {
  const target = targetFor(ANY_NAME);
  if (!target || !target.isConfigured()) {
    throw new Error('No external backup target is configured.');
  }
  await target.download(filename, destPath);
}

/** Probe the configured target for the admin "Test connection" button. */
export async function testConfiguredTarget(): Promise<{ success: boolean; error?: string }> {
  const target = safeTarget(ANY_NAME);
  if (!target) return { success: false, error: 'No external backup target is configured.' };
  return target.test();
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
 * Configuring a target is otherwise only forward-looking: everything backed up
 * before that moment stays on the box, which is the opposite of why someone
 * configures off-box backups. This closes that gap.
 *
 * Sequential on purpose. These are multi-gigabyte archives, and saturating the
 * uplink with parallel uploads would starve the running instance for no gain —
 * the bottleneck is bandwidth, not request concurrency.
 */
export async function mirrorExistingBackups(zipPaths: string[]): Promise<BackfillResult> {
  const result: BackfillResult = { total: zipPaths.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

  const target = safeTarget(ANY_NAME);
  if (!target || !target.isConfigured()) {
    result.failed = result.total;
    result.errors.push('No external backup target is configured.');
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
    const target = targetFor(ANY_NAME);
    if (!target) return NOT_ATTEMPTED;

    if (!target.isConfigured()) {
      // Configured-but-incomplete is a real misconfiguration, not a silent
      // "off" — an admin who picked a backend expects their backups off-box.
      const error = `The ${target.id} backup target is selected but incomplete. Check its settings.`;
      logError(`Backup target: ${error}`);
      writeAudit({ userId: null, action: 'backup.target_failed', resource: zipPath, details: { target: target.id, error } });
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
