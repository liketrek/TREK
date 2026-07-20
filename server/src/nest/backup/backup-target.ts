/**
 * Post-write hook for finished backup archives, and the dispatcher over the
 * configured storage backends.
 *
 * Backends are independent and any number can be active at once, so everything
 * here fans out: an archive is offered to every enabled backend, the backup
 * list is the union of what they hold, and a delete removes it from all of
 * them. `local` is opt-out and everything else opt-in, which means the default
 * install behaves exactly as it always has.
 *
 * Two builders write the archives and they have always diverged:
 * `backupService.createBackup()` packs the full manual archive (DB snapshot,
 * uploads with cache excludes, plugin trees), while `scheduler.runBackup()`
 * packs the simpler `auto-backup-*.zip` on the cron. Both call
 * `onBackupWritten()` once their output stream has closed, so distribution is
 * written once here instead of twice at the call sites.
 *
 * `enabledTargets()` is the single place that knows which backends exist.
 *
 * The hook is best-effort by contract and never throws. The archive is already
 * on disk when it runs, and a backend that fails is logged, audited and
 * reported to the caller — it never turns a successful backup into a failed
 * one.
 */
import fs from 'node:fs';
import { logError, logInfo, writeAudit } from '../../services/auditLog';
import { isS3Usable, resolveTarget } from './backup-target.config';
import { localTarget } from './backup-target.local';
import { s3Target, type BackupTarget, type RemoteBackup } from './backup-target.s3';

/** What happened to the archive after it was written. */
export interface BackupTargetOutcome {
  /** True when at least one backend beyond the local one was tried. */
  attempted: boolean;
  uploaded: boolean;
  /** Present when `attempted` and a backend failed. Safe to show an admin. */
  error?: string;
}

const NOT_ATTEMPTED: BackupTargetOutcome = { attempted: false, uploaded: false };

/** Used where the caller has no opinion on which filenames count as backups. */
const ANY_NAME = () => true;

/**
 * Every enabled backend.
 *
 * `isBackupName` is threaded in rather than imported so this module stays free
 * of any dependency on the legacy backup service — which imports the hook from
 * here, and would otherwise form a cycle.
 */
export function enabledTargets(isBackupName: (n: string) => boolean = ANY_NAME): BackupTarget[] {
  const cfg = resolveTarget();
  const targets: BackupTarget[] = [];
  if (cfg.localEnabled) targets.push(localTarget(cfg, isBackupName));
  if (cfg.s3Enabled) targets.push(s3Target(cfg, isBackupName));
  return targets;
}

/**
 * Backends other than the one the builder already wrote to.
 *
 * The archive lands in the local backend's directory to begin with, so
 * re-copying it onto itself would be pointless work on a multi-gigabyte file.
 */
function mirrorTargets(isBackupName: (n: string) => boolean = ANY_NAME): BackupTarget[] {
  return enabledTargets(isBackupName).filter(t => t.id !== 'local');
}

/** Resolve backends without throwing; a config read touches the DB. */
function safeTargets(isBackupName: (n: string) => boolean = ANY_NAME): BackupTarget[] {
  try {
    return enabledTargets(isBackupName);
  } catch (err: unknown) {
    logError(`Backup targets: could not resolve the configured backends: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

/**
 * The archives across every enabled backend, keyed by filename.
 *
 * Never throws: the backup list must still render when one backend is
 * unreachable, and losing sight of the copies you still have is the worst
 * possible response to a network fault.
 */
export async function listAllBackups(
  isBackupName: (n: string) => boolean,
): Promise<{ backups: Map<string, { backup: RemoteBackup; targets: Set<string> }>; error?: string }> {
  const merged = new Map<string, { backup: RemoteBackup; targets: Set<string> }>();
  let error: string | undefined;

  for (const target of safeTargets(isBackupName)) {
    if (!target.isConfigured()) continue;
    try {
      for (const backup of await target.list()) {
        const existing = merged.get(backup.filename);
        if (existing) existing.targets.add(target.id);
        else merged.set(backup.filename, { backup, targets: new Set([target.id]) });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`Backup target ${target.id} list failed: ${message}`);
      // First failure wins for the UI; the rest are in the log.
      error ??= message;
    }
  }

  return { backups: merged, error };
}

/**
 * Delete an archive from every backend that holds it.
 *
 * Leaving a copy behind would mean "delete" silently does not delete, and the
 * archive keeps costing storage and staying restorable long after someone chose
 * to remove it. Failures are collected rather than thrown: the copies that
 * could be removed are gone, and the admin needs to know which were not.
 */
export async function deleteEverywhere(filename: string): Promise<{ deleted: string[]; error?: string }> {
  const deleted: string[] = [];
  const failures: string[] = [];

  for (const target of safeTargets()) {
    if (!target.isConfigured()) continue;
    try {
      if (!(await target.has(filename))) continue;
      await target.remove(filename);
      deleted.push(target.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${target.id}: ${message}`);
      logError(`Backup target ${target.id} delete failed for ${filename}: ${message}`);
    }
  }

  if (deleted.length) {
    writeAudit({ userId: null, action: 'backup.target_deleted', resource: filename, details: { targets: deleted } });
  }
  if (failures.length) {
    writeAudit({ userId: null, action: 'backup.target_failed', resource: filename, details: { op: 'delete', failures } });
    return { deleted, error: failures.join('; ') };
  }
  return { deleted };
}

/** Whether any backend holds this archive. */
export async function existsAnywhere(filename: string): Promise<boolean> {
  for (const target of safeTargets()) {
    if (!target.isConfigured()) continue;
    try {
      if (await target.has(filename)) return true;
    } catch {
      // A backend that cannot answer is not evidence of absence, but it is not
      // evidence of presence either — keep asking the others.
    }
  }
  return false;
}

/**
 * Fetch an archive to `destPath` from whichever backend has it.
 *
 * Backends are tried in configured order, so the local one wins when it has a
 * copy — a file copy beats a download.
 */
export async function fetchBackup(filename: string, destPath: string): Promise<void> {
  const errors: string[] = [];
  for (const target of enabledTargets()) {
    if (!target.isConfigured()) continue;
    try {
      if (!(await target.has(filename))) continue;
      await target.download(filename, destPath);
      return;
    } catch (err: unknown) {
      errors.push(`${target.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw new Error(
    errors.length ? `No backend could provide the backup (${errors.join('; ')}).` : 'No backend holds that backup.',
  );
}

/** Probe every enabled backend. */
export async function testConfiguredTargets(): Promise<{ success: boolean; error?: string }> {
  const targets = safeTargets();
  if (!targets.length) return { success: false, error: 'No storage backend is enabled.' };

  const problems: string[] = [];
  let warning: string | undefined;
  for (const target of targets) {
    const res = await target.test();
    if (!res.success) problems.push(`${target.id}: ${res.error ?? 'failed'}`);
    else if (res.error) warning ??= `${target.id}: ${res.error}`;
  }

  if (problems.length) return { success: false, error: problems.join('; ') };
  return warning ? { success: true, error: warning } : { success: true };
}

/** Result of copying the existing archives to the backends missing them. */
export interface BackfillResult {
  total: number;
  uploaded: number;
  /** Already present everywhere it needs to be. */
  skipped: number;
  failed: number;
  /** At most a handful, so a failed run stays readable in a toast. */
  errors: string[];
}

/**
 * Push archives that already exist to the backends that do not have them.
 *
 * Enabling a backend is otherwise only forward-looking: everything backed up
 * before that moment stays where it was, which is the opposite of why someone
 * adds a second location. This closes that gap.
 *
 * Sequential on purpose. These are multi-gigabyte archives, and saturating the
 * uplink with parallel uploads would starve the running instance for no gain —
 * the bottleneck is bandwidth, not request concurrency.
 */
export async function mirrorExistingBackups(zipPaths: string[]): Promise<BackfillResult> {
  const result: BackfillResult = { total: zipPaths.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

  const targets = mirrorTargets().filter(t => t.isConfigured());
  if (!targets.length) {
    result.failed = result.total;
    result.errors.push('No storage backend beyond the local one is enabled.');
    return result;
  }

  for (const zipPath of zipPaths) {
    let uploadedAny = false;
    let failedAny = false;
    let skippedAll = true;

    for (const target of targets) {
      try {
        if (await target.has(zipPath)) continue;
        skippedAll = false;
        const outcome = await target.upload(zipPath);
        if (outcome.uploaded) uploadedAny = true;
        else {
          failedAny = true;
          if (result.errors.length < 3) result.errors.push(`${target.id}: ${outcome.error ?? 'upload failed'}`);
        }
      } catch (err: unknown) {
        failedAny = true;
        skippedAll = false;
        if (result.errors.length < 3) result.errors.push(`${target.id}: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (failedAny) result.failed++;
    else if (skippedAll) result.skipped++;
    else if (uploadedAny) result.uploaded++;
  }

  logInfo(`Backup backfill: ${result.uploaded} uploaded, ${result.skipped} already present, ${result.failed} failed`);
  writeAudit({
    userId: null,
    action: result.failed > 0 ? 'backup.target_failed' : 'backup.target_uploaded',
    details: { backfill: true, uploaded: result.uploaded, skipped: result.skipped, failed: result.failed },
  });
  return result;
}

export async function onBackupWritten(zipPath: string): Promise<BackupTargetOutcome> {
  try {
    const targets = mirrorTargets();
    if (!targets.length) return NOT_ATTEMPTED;

    const errors: string[] = [];
    let uploaded = 0;

    for (const target of targets) {
      if (!target.isConfigured()) {
        // Enabled but half-configured is a real misconfiguration, not a silent
        // "off" — an admin who switched it on expects their backups there.
        const error = `The ${target.id} backend is enabled but incomplete. Check its settings.`;
        logError(`Backup target: ${error}`);
        writeAudit({ userId: null, action: 'backup.target_failed', resource: zipPath, details: { target: target.id, error } });
        errors.push(error);
        continue;
      }

      const result = await target.upload(zipPath);
      if (result.uploaded) {
        uploaded++;
        logInfo(`Backup mirrored to ${target.id}: ${result.key}`);
        writeAudit({ userId: null, action: 'backup.target_uploaded', resource: result.key, details: { target: target.id } });
      } else {
        logError(`Backup target ${target.id} upload failed: ${result.error}`);
        writeAudit({
          userId: null,
          action: 'backup.target_failed',
          resource: result.key ?? zipPath,
          details: { target: target.id, error: result.error },
        });
        errors.push(`${target.id}: ${result.error ?? 'upload failed'}`);
      }
    }

    // The builder always writes into the local directory, because that is where
    // it has always written and it is the cheapest place to stage from. If the
    // local backend is switched off, the archive was only ever a staging copy
    // and has to go once the other backends have it — but only if at least one
    // of them actually took it, or turning local off would destroy the backup.
    if (!resolveTarget().localEnabled && uploaded > 0) {
      try {
        fs.rmSync(zipPath, { force: true });
      } catch (err: unknown) {
        logError(`Backup target: could not remove the staged local copy: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (errors.length) return { attempted: true, uploaded: uploaded > 0, error: errors.join('; ') };
    return { attempted: true, uploaded: true };
  } catch (err: unknown) {
    // Nothing above is expected to throw (upload returns its errors), so
    // reaching here means a config/DB read failed. Still must not propagate:
    // the backup itself succeeded.
    const error = err instanceof Error ? err.message : String(err);
    logError(`Backup post-write hook: ${error}`);
    return { attempted: true, uploaded: false, error };
  }
}
