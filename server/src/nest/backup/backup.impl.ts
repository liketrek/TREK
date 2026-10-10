import { readEnv } from '../../app-config';
import { resolveDataPaths } from '../../app-config/data-paths';
import { UserSessions } from '../../db/entities/UserSessions.entity';
import type { CarriedUserSessionRow } from '../../db/repositories/UserSessions.repository';
import { dbNow } from '../../db/types';
import { logError, logWarn } from '../audit/audit-log.logger';
import type { DatabaseBackupStrategy } from '../database/database-backup.interface';
import { invalidatePermissionsCache } from '../permissions/permissions-cache';
import { snapshotAllPluginDataDbs } from '../plugins/host/plugin-data.service';
import { pluginsCodeRoot, pluginsDataRoot } from '../plugins/paths';
import { stageExtractedPluginTrees, applyStagedRestoreNow } from '../plugins/plugin-backup';
import type { StorageService } from '../storage/storage.service';
import { StorageInvalidKeyError } from '../storage/storage.types';
import { VALID_INTERVALS } from './auto-backup.settings';
import { extractBackupArchive } from './backup-archive';
import { RequestContext } from '@mikro-orm/core';

import archiver from 'archiver';
import type { Response } from 'express';
import fs from 'fs';
import { pipeline } from 'node:stream/promises';
import path from 'path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/**
 * What a backup and a restore work with: the storage facade for the archives
 * and the uploads, and the database port for the database itself. BackupService
 * injects both and hands them in.
 */
export interface BackupDeps {
  storage: StorageService;
  database: DatabaseBackupStrategy;
}

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

// The scratch and key directory. The database itself may live elsewhere
// (TREK_DB_FILE); the database port knows where.
const { dataDir, encryptionKeyFile } = resolveDataPaths();
const PRECOMPRESSED = /\.(jpe?g|png|webp|gif|heic|heif|avif|mp4|mov|m4v|webm|pdf|zip|gz)$/i;

// Compressed upload cap for restore archives. Defaults to 500 MB, raisable via
// BACKUP_UPLOAD_LIMIT_MB for instances whose backups (uploads/ included) grow
// past that. Upper bound on the TOTAL decompressed size: default 5 GB, raisable
// via BACKUP_MAX_DECOMPRESSED_MB. Both live beside the archive reader now.
export { MAX_BACKUP_UPLOAD_SIZE, MAX_BACKUP_DECOMPRESSED_SIZE } from './backup-archive';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function parseIntField(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.floor(raw);
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function parseAutoBackupBody(body: Record<string, unknown>): {
  enabled: boolean;
  interval: string;
  keep_days: number;
  hour: number;
  day_of_week: number;
  day_of_month: number;
} {
  const enabled = body.enabled === true || body.enabled === 'true' || body.enabled === 1;
  const rawInterval = body.interval;
  const interval = typeof rawInterval === 'string' && VALID_INTERVALS.includes(rawInterval) ? rawInterval : 'daily';
  const keep_days = Math.max(0, parseIntField(body.keep_days, 7));
  const hour = Math.min(23, Math.max(0, parseIntField(body.hour, 2)));
  const day_of_week = Math.min(6, Math.max(0, parseIntField(body.day_of_week, 0)));
  const day_of_month = Math.min(28, Math.max(1, parseIntField(body.day_of_month, 1)));
  return { enabled, interval, keep_days, hour, day_of_week, day_of_month };
}

export function isValidBackupFilename(filename: string): boolean {
  return /^(?:auto-)?backup-[\w-]+\.zip$/.test(filename);
}

export function backupFileExists(storage: StorageService, filename: string): Promise<boolean> {
  return storage.exists('backups', filename);
}

/**
 * The codebase's only res.download becomes the storage equivalent: root-relative
 * sendFile via sendToResponse, with res.download's attachment header rebuilt by
 * hand (filenames are regex-gated ASCII — no encoding cases).
 */
export function sendBackupToResponse(storage: StorageService, filename: string, res: Response): Promise<void> {
  return storage.sendToResponse('backups', filename, res, {
    disposition: `attachment; filename="${filename}"`,
  });
}

// ---------------------------------------------------------------------------
// Rate limiter state (shared across requests)
// ---------------------------------------------------------------------------

export const BACKUP_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

const backupAttempts = new Map<string, { count: number; first: number }>();

/** Returns true if the request is allowed, false if rate-limited. */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const record = backupAttempts.get(key);
  if (record && record.count >= maxAttempts && now - record.first < windowMs) {
    return false;
  }
  if (!record || now - record.first >= windowMs) {
    backupAttempts.set(key, { count: 1, first: now });
  } else {
    record.count++;
  }
  return true;
}

// ---------------------------------------------------------------------------
// List backups
// ---------------------------------------------------------------------------

export interface BackupInfo {
  filename: string;
  size: number;
  sizeText: string;
  created_at: string;
}

export async function listBackups(storage: StorageService): Promise<BackupInfo[]> {
  const backups: BackupInfo[] = [];
  for await (const obj of storage.list('backups')) {
    // storage.list() recurses; the legacy readdir was single-level. Nested keys
    // (a restore-* staging tree when data and uploads map to the same dir) and
    // non-zip files must not surface.
    if (obj.key.includes('/') || !obj.key.endsWith('.zip')) continue;
    backups.push({
      filename: obj.key,
      size: obj.size,
      sizeText: formatSize(obj.size),
      created_at: new Date(obj.mtimeMs).toISOString(),
    });
  }
  return backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ---------------------------------------------------------------------------
// Create backup
// ---------------------------------------------------------------------------

/** The categories a backup archives — everything else under uploads/ is a
 *  re-derivable cache (photos-google, photos-trek) or not uploads at all
 *  (backups). Restore's rehydration walks the same list. */
export const BACKUP_UPLOAD_CATEGORIES = ['files', 'journey', 'covers', 'avatars', 'places', 'photos'] as const;

/**
 * Writes a full backup zip and returns its BackupInfo.
 *
 * `prefix` picks the filename scheme. AutoBackupJob passes 'auto-backup' because
 * everything downstream tells the two apart by name: cleanupOldBackups() prunes
 * only auto-backup-*.zip, and the admin panel badges them as automatic. Manual
 * backups keep the default.
 */
export async function createBackup(
  { storage, database }: BackupDeps,
  prefix: 'backup' | 'auto-backup' = 'backup',
): Promise<BackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${prefix}-${timestamp}.zip`;
  // All staging lives in the backups backend's own spool: same volume as the
  // destination (the put commit stays an atomic rename) and crash leftovers are
  // reaped by LocalDriver's boot spool-cleanup. The scratch names carry the
  // prefix too: a scheduled run and a manual one that start in the same second
  // would otherwise share a snapshot path, and the first to finish would delete
  // the other's staging copy mid-archive.
  const spoolDir = storage.spoolDirFor('backups');
  const zipSpool = path.join(spoolDir, `zip-build-${prefix}-${timestamp}`);
  const pdataSnap = path.join(spoolDir, `plugins-snap-${prefix}-${timestamp}`);
  const dbSnap = path.join(spoolDir, `travel-snap-${prefix}-${timestamp}.db`);
  // Per-backup staging for uploads with no local path (a remote/S3 primary, or
  // a local path that vanished between listing and archiving — see
  // getLocalPathOrNull). Same spool as the rest of the build, same cleanup.
  const stagingDir = path.join(spoolDir, `staging-${prefix}-${timestamp}`);

  try {
    // Flush the WAL first, so the snapshot below has less to copy from it.
    // Best effort: the snapshot is consistent either way.
    try {
      await database.checkpoint();
    } catch (e) {
      logWarn(
        `Backup: the WAL checkpoint before the snapshot failed (${describeError(e)}), taking the snapshot anyway`,
      );
    }

    // Enumerate the archived categories up front (the archiver reads entries
    // lazily during finalize(), so the promise executor below must stay
    // synchronous). Everything NOT in BACKUP_UPLOAD_CATEGORIES is excluded by
    // construction: the re-derivable caches (photos-google in both
    // TREK_PLACE_PHOTO_DIR modes, photos-trek) and backups itself are never
    // enumerated, which is what makes the same-dir-misconfig guard (#1358)
    // structural instead of pattern-based.
    const uploadEntries: { absPath: string; name: string }[] = [];
    for (const category of BACKUP_UPLOAD_CATEGORIES) {
      for await (const obj of storage.list(category)) {
        // In mode A the google/trek caches nest under the photos/ prefix — the
        // category walk would sweep them back in without this skip.
        if (category === 'photos' && (obj.key.startsWith('google/') || obj.key.startsWith('trek/'))) continue;
        // Local path available (exists on disk right now — the fail-safe half
        // of getLocalPathOrNull's contract) → push it directly: zero-copy, the
        // default-install path. Otherwise (a remote/S3 primary, or a local
        // path that vanished between the list() and here) stream the object
        // into this backup's own staging dir so archiver has a real file to
        // read lazily during finalize() — the temp file withLocalFile would
        // have produced is gone by the time archiver gets to it.
        const localPath = await storage.getLocalPathOrNull(category, obj.key);
        if (localPath !== null) {
          uploadEntries.push({ absPath: localPath, name: `uploads/${category}/${obj.key}` });
          continue;
        }
        const stagedPath = path.join(stagingDir, category, obj.key);
        fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
        const { stream } = await storage.getStream(category, obj.key);
        await pipeline(stream, fs.createWriteStream(stagedPath));
        uploadEntries.push({ absPath: stagedPath, name: `uploads/${category}/${obj.key}` });
      }
    }

    // Archive a point-in-time snapshot, never the live file. The archiver reads
    // entries lazily during finalize(), so a WAL auto-checkpoint writing pages
    // back into the live file mid-stream would tear the archived copy, and the
    // -wal that would make it recoverable is not in the zip. Taken HERE, before
    // the promise executor below, because the executor must stay synchronous.
    //
    // A snapshot that fails fails the backup. It used to fall back to archiving
    // the live file, which is exactly the torn copy the snapshot exists to
    // prevent, and it did so without a word in the log. Now nothing is
    // archived, nothing is committed to the backups store (the finally below
    // removes the half-built spool), the existing backups stay as they were,
    // and the reason is logged.
    const hasDatabase = database.canSnapshot();
    if (hasDatabase) {
      fs.rmSync(dbSnap, { force: true });
      try {
        await database.snapshot(dbSnap);
      } catch (e) {
        logError(
          `Backup: could not take a snapshot of the database at ${database.location()} (${describeError(e)}). No backup was written.`,
        );
        throw new Error(`Database snapshot failed: ${describeError(e)}`, { cause: e });
      }
    } else {
      logWarn(`Backup: no database file at ${database.location()}, this backup holds no database`);
    }

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipSpool);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);
      // archiver emits 'warning' (not 'error') for entries it couldn't
      // stat/read — a stale staged path, a permission error — and by default
      // just skips them, silently dropping bytes from the backup. Fail the
      // backup instead: a dropped entry must never pass as a success.
      archive.on('warning', reject);

      archive.pipe(output);

      if (hasDatabase) {
        archive.file(dbSnap, { name: database.archiveEntry });
      }

      // Bundle the at-rest encryption key so the backup is self-contained: the
      // DB stores secrets (API keys, MFA, SMTP/OIDC) encrypted with this key, so
      // a restore onto a different install would otherwise be unable to decrypt
      // them. NOTE: this makes the backup file as sensitive as the key itself —
      // store/transfer it securely. Skipped when ENCRYPTION_KEY is provided via
      // env, since in that case the file is not the source of truth.
      const encKeyPath = encryptionKeyFile;
      if (!readEnv().backup.encryptionKeyFromEnv && fs.existsSync(encKeyPath)) {
        archive.file(encKeyPath, { name: '.encryption_key' });
      }

      // Photos, videos and PDFs are compressed already; deflating them at level
      // 9 costs most of a backup's CPU time for a few bytes. They are stored.
      for (const entry of uploadEntries) {
        const data: archiver.ZipEntryData = { name: entry.name, store: PRECOMPRESSED.test(entry.name) };
        archive.file(entry.absPath, data);
      }

      // Plugin data — each plugin's own SQLite file and any blobs. This is the ONLY
      // copy of the user data a plugin holds, so it belongs in the backup. Checkpoint
      // every open handle first (the host keeps them open in WAL mode) so the archived
      // .db files are complete snapshots and not missing recent commits stranded in a
      // -wal sidecar, the same treatment the core database gets above.
      const pdata = pluginsDataRoot();
      if (fs.existsSync(pdata)) {
        // Archive a consistent point-in-time snapshot, not the live files: the archiver
        // reads lazily while streaming, so a plugin writing during the backup (an auto-
        // checkpoint landing mid-read) would otherwise put a torn .db + out-of-sync -wal
        // into the zip — the plugin's ONLY data copy, silently corrupt. This VACUUM-INTOs
        // each open db and drops the sidecars; the snap dir is removed in the finally.
        snapshotAllPluginDataDbs(pdataSnap);
        archive.directory(pdataSnap, 'plugins-data');
      }
      // Plugin code — so a restore is self-contained (the `plugins` rows reference it).
      // Dev-links (a plugin dir symlinked/junctioned to an author's source) are skipped
      // by realpath: we never bundle a linked source tree from outside the code root.
      const pcode = pluginsCodeRoot();
      if (fs.existsSync(pcode)) {
        const realRoot = fs.realpathSync(pcode);
        for (const entry of fs.readdirSync(pcode)) {
          const dir = path.join(pcode, entry);
          let real: string;
          try {
            real = fs.realpathSync(dir);
          } catch {
            continue;
          }
          if (!real.startsWith(realRoot + path.sep)) continue; // dev-link points outside → skip
          try {
            if (!fs.statSync(dir).isDirectory()) continue;
          } catch {
            continue;
          }
          archive.directory(dir, `plugins-code/${entry}`);
        }
      }

      // finalize() is async: without this catch a failure that never reached the
      // 'error' listener above would hang this promise and reject unobserved.
      archive.finalize().catch(reject);
    });

    // The commit — and, under a mirror backend, the replica fan-out point.
    await storage.put('backups', filename, { tmpPath: zipSpool });
    const stat = await storage.stat('backups', filename);
    if (!stat) throw new Error(`Backup vanished after commit: ${filename}`);
    return {
      filename,
      size: stat.size,
      sizeText: formatSize(stat.size),
      created_at: new Date(stat.mtimeMs).toISOString(),
    };
  } catch (err: unknown) {
    console.error('Backup error:', err);
    throw err;
  } finally {
    // put commits by rename, so on success the zip spool file is already gone;
    // on failure these clean the half-built staging. The destination needs no
    // unlink anymore — nothing lands there until put succeeds. (The await on
    // the build promise resolves on the output stream's 'close', so the
    // snapshots are no longer being read.)
    fs.rmSync(zipSpool, { force: true });
    fs.rmSync(pdataSnap, { recursive: true, force: true });
    fs.rmSync(dbSnap, { force: true });
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Restore from ZIP
// ---------------------------------------------------------------------------

export interface RestoreResult {
  success: boolean;
  error?: string;
  status?: number;
}

/** Restore a zip that already sits in the backups store, reading it through
 *  the storage facade (primary-local in v1; a remote backend downloads to
 *  tempDir via withLocalFile — the seam is in place, resumability is not). */
export function restoreBackup(deps: BackupDeps, filename: string): Promise<RestoreResult> {
  return deps.storage.withLocalFile('backups', filename, (zipPath) => restoreFromZip(deps, zipPath));
}

const isBackupCategory = (dir: string): dir is (typeof BACKUP_UPLOAD_CATEGORIES)[number] =>
  (BACKUP_UPLOAD_CATEGORIES as readonly string[]).includes(dir);

/**
 * Per-entry storage.put replaces the old wipe-and-cpSync (and with it the
 * realpathSync symlinked-uploads workaround — the driver resolves its own
 * root at init). Entries that cannot map to a storage key — an unknown
 * top-level dir, or dot-segments from old `dot: true` archives — are skipped
 * with a warning (2026-08-17 decision): new archives never contain them, and
 * the category mapping stays structural in both directions.
 */
export async function rehydrateUploads(storage: StorageService, extractedUploads: string): Promise<void> {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : e.isFile() ? [p] : [];
    });
  for (const absPath of walk(extractedUploads)) {
    const rel = path.relative(extractedUploads, absPath).split(path.sep).join('/');
    const slash = rel.indexOf('/');
    const top = slash === -1 ? '' : rel.slice(0, slash);
    if (slash === -1 || !isBackupCategory(top)) {
      console.warn(`Restore: skipping upload entry outside a storage category: ${rel}`);
      continue;
    }
    try {
      await storage.put(top, rel.slice(slash + 1), { tmpPath: absPath });
    } catch (err) {
      if (err instanceof StorageInvalidKeyError) {
        console.warn(`Restore: skipping upload entry with an invalid key: ${rel}`);
        continue;
      }
      throw err;
    }
  }
}

/**
 * The sessions signed in right now, read before the swap. The restored file
 * brings the backup's own `user_sessions` rows (none at all for a backup from
 * before sessions were tracked), and a session token whose row is missing is
 * refused, so without carrying these across the admin who ran the restore and
 * everybody else would be signed out by it. Best effort, like the snapshot:
 * a missing request context or an unreadable table carries nothing.
 */
async function readSessionsToCarry(): Promise<CarriedUserSessionRow[]> {
  try {
    const em = RequestContext.getEntityManager();
    if (!em) return [];
    return await em.getRepository(UserSessions).listActiveToCarry(dbNow());
  } catch (err) {
    logWarn(`Restore: could not read the active sessions (${err instanceof Error ? err.message : String(err)})`);
    return [];
  }
}

/**
 * Put the carried sessions into the restored database, in a fresh fork so no
 * entity read from the replaced file is flushed into it. Only a session whose
 * user is still there under the same id and email comes back; the password
 * version check still refuses a token the restored account no longer matches.
 */
async function restoreCarriedSessions(rows: readonly CarriedUserSessionRow[]): Promise<void> {
  const em = RequestContext.getEntityManager();
  if (!em || rows.length === 0) return;
  try {
    await RequestContext.create(em, async () => {
      const fresh = RequestContext.getEntityManager() ?? em;
      await fresh.getRepository(UserSessions).restoreCarried(rows);
    });
  } catch (err) {
    logWarn(`Restore: could not keep the active sessions (${err instanceof Error ? err.message : String(err)})`);
  }
}

export async function restoreFromZip({ storage, database }: BackupDeps, zipPath: string): Promise<RestoreResult> {
  const extractDir = path.join(dataDir, `restore-${Date.now()}`);
  let reinitFailed: unknown;
  try {
    const refused = await extractBackupArchive(zipPath, extractDir);
    if (refused) return { success: false, ...refused };

    const unreadable = database.verify(extractDir);
    if (unreadable) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      return { success: false, ...unreadable };
    }

    await database.keepCopyBeforeRestore();
    const liveSessions = await readSessionsToCarry();

    try {
      // Closes the connection, swaps the database in and reopens it, migrating
      // the restored file forward. The reopen runs even when the swap throws; a
      // reopen failure comes back here instead of propagating, because the
      // files already landed and that has to be reported as "restart required".
      ({ reopenError: reinitFailed } = await database.replace(path.join(extractDir, database.archiveEntry)));

      // Restore the bundled at-rest encryption key (if the archive carries one)
      // so the restored DB's encrypted secrets can be decrypted. Only the file
      // is swapped here; the in-memory key was read at startup, so a restart is
      // required for it to take effect (and an explicit ENCRYPTION_KEY env var
      // still overrides the file).
      const extractedEncKey = path.join(extractDir, '.encryption_key');
      if (fs.existsSync(extractedEncKey)) {
        fs.copyFileSync(extractedEncKey, encryptionKeyFile);
      }
    } finally {
      // The restored DB has different permission-override rows from
      // the pre-restore DB, but our process-local permissions cache
      // still holds the pre-restore state. Any request using a cached
      // permission would decide against the wrong grants until the
      // next restart. Dropping the cache forces a fresh read.
      // D6: no repository read happens on this path today. The flush goes to
      // the store PermissionsModule installed (permissionsCacheSlot), and the
      // in-memory one makes no DB call, so no withRequestContext is owed here
      // yet. A store that reads the database, or the domain phase that gives
      // this restore path a repository read (Plan 3's admin/backup cluster),
      // must wrap it then; see task-2-review.md's non-HTTP caller table.
      await invalidatePermissionsCache();
    }

    if (!reinitFailed) {
      // The registry reads storage.* app_settings through the DB handle that
      // was just closed and reopened above. Reload it now, AFTER the reopen
      // and BEFORE any byte moves, so rehydrated uploads land where the RESTORED
      // config says rather than the stale pre-restore one (audit #4). Skipped
      // entirely when reopen failed: with no live DB handle the registry has
      // nothing to read, and the restore is already reported as "restart
      // required" below — rehydrating into a stale/guessed config would be worse.
      await storage.reloadConfig();
      await restoreCarriedSessions(liveSessions);

      const extractedUploads = path.join(extractDir, 'uploads');
      if (fs.existsSync(extractedUploads)) {
        // Parity with the legacy wipe: it unlinked one level deep only (nested
        // files — journey/thumbs, photos/google — survived until overwritten by
        // the copy) and swallowed per-file errors.
        for (const category of BACKUP_UPLOAD_CATEGORIES) {
          for await (const obj of storage.list(category)) {
            if (obj.key.includes('/')) continue;
            await storage.delete(category, obj.key).catch(() => {
              /* best-effort, as the old unlink loop was */
            });
          }
        }
        await rehydrateUploads(storage, extractedUploads);
      }
    }

    // Plugin trees can't be swapped while the runtime holds their DBs open, so stage
    // them beside the live trees, then ask the runtime to quiesce its plugins and apply
    // the swap NOW. If the runtime isn't up (plugins disabled / restore during boot),
    // the staging waits for the boot reconcile — with nothing running, no data diverges.
    // Best-effort: a staging error must not fail an otherwise-good core restore. Runs
    // UNCONDITIONALLY, even when reinitFailed — unlike reload/rehydration this is pure
    // filesystem staging with no DB dependency (plugin-backup.ts), so a failed reopen
    // must not cost the archive's plugin data: extractDir is unlinked right below, and
    // an un-staged tree there would be gone for good with no recovery path.
    try {
      stageExtractedPluginTrees(extractDir);
      // Quiesce regardless of whether trees were staged: the restored database carries
      // a different `plugins` table, so any plugin still running with its pre-restore
      // identity/grants is now a ghost — invisible in the restored UI, unstoppable short
      // of a process restart. applyStagedRestoreNow closes those handles; the tree swap
      // it also performs is a no-op when nothing was staged (e.g. an older archive). It
      // degrades gracefully when the DB isn't reopened, same as any other best-effort
      // failure here.
      await applyStagedRestoreNow();
    } catch (e) {
      console.error('Restore: staging plugin trees failed:', e);
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    if (reinitFailed) {
      console.error('Restore: database reopen failed after file swap:', reinitFailed);
      return {
        success: false,
        error:
          'Backup files were restored but the database connection could not be reopened. Restart the server to finish the restore.',
        status: 500,
      };
    }
    return { success: true };
  } catch (err: unknown) {
    console.error('Restore error:', err);
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    // Belt-and-braces: the inner `finally` already drops the permissions
    // cache after a successful swap, but if the extraction/copy step
    // itself threw before the DB swap even started, the cache wasn't
    // stale anyway. Invalidating here too costs nothing and guarantees
    // we never serve cached permissions that don't match the DB state
    // we leave the process in after a failed restore.
    // D6: same no-repository-read note as the other invalidatePermissionsCache()
    // call above — nothing to wrap yet.
    try {
      await invalidatePermissionsCache();
    } catch {
      /* best-effort */
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Delete backup
// ---------------------------------------------------------------------------

export function deleteBackup(storage: StorageService, filename: string): Promise<void> {
  return storage.delete('backups', filename);
}
