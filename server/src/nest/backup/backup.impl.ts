import archiver from 'archiver';
import unzipper from 'unzipper';
import path from 'path';
import { pipeline } from 'node:stream/promises';
import { readEnv } from '../../app-config';
import fs from 'fs';
import Database from 'better-sqlite3';
import { db, closeDb, reinitialize } from '../../db/database';
import { VALID_INTERVALS } from './auto-backup.settings';
import { invalidatePermissionsCache } from '../permissions/permissions-cache';
import { pluginsCodeRoot, pluginsDataRoot } from '../plugins/paths';
import { stageExtractedPluginTrees, applyStagedRestoreNow } from '../plugins/plugin-backup';
import { snapshotAllPluginDataDbs } from '../plugins/host/plugin-data.service';
import type { Response } from 'express';
import type { StorageService } from '../storage/storage.service';
import { StorageInvalidKeyError } from '../storage/storage.types';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const dataDir = path.join(__dirname, '../../../data');

// Compressed upload cap for restore archives. Defaults to 500 MB, raisable via
// BACKUP_UPLOAD_LIMIT_MB for instances whose backups (uploads/ included) grow
// past that. Malformed values abort boot (app-config fail-fast validation);
// frozen at import on purpose (legacy timing).
const backupEnv = readEnv().backup;
export const MAX_BACKUP_UPLOAD_SIZE = backupEnv.uploadLimitMb * 1024 * 1024; // compressed
// Upper bound on the TOTAL decompressed size of a restore archive (the upload
// limit only caps the compressed bytes). Default 5 GB, raisable via
// BACKUP_MAX_DECOMPRESSED_MB for an instance whose own backups (now including the
// plugin trees) legitimately grow past it — otherwise its own backups become
// unrestorable.
export const MAX_BACKUP_DECOMPRESSED_SIZE = backupEnv.maxDecompressedMb * 1024 * 1024;

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
  const interval =
    typeof rawInterval === 'string' && VALID_INTERVALS.includes(rawInterval)
      ? rawInterval
      : 'daily';
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
export async function createBackup(storage: StorageService, prefix: 'backup' | 'auto-backup' = 'backup'): Promise<BackupInfo> {
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
    try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {}

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

      const dbPath = path.join(dataDir, 'travel.db');
      if (fs.existsSync(dbPath)) {
        // Archive a point-in-time snapshot, not the live file. The archiver reads entries
        // lazily during finalize(), so a WAL auto-checkpoint writing pages back into
        // travel.db mid-stream would tear the archived copy — and the -wal that would make
        // it recoverable isn't in the zip. VACUUM INTO takes a consistent snapshot even
        // under concurrent writes — the same guarantee the plugin DBs get below.
        let dbToArchive = dbPath;
        try {
          if (fs.existsSync(dbSnap)) fs.rmSync(dbSnap, { force: true });
          db.exec(`VACUUM INTO '${dbSnap.replaceAll("'", "''")}'`);
          dbToArchive = dbSnap;
        } catch (e) {
          // Snapshot failed (disk/lock) — fall back to the checkpointed live file rather
          // than drop the core DB from the backup entirely.
        }
        archive.file(dbToArchive, { name: 'travel.db' });
      }

      // Bundle the at-rest encryption key so the backup is self-contained: the
      // DB stores secrets (API keys, MFA, SMTP/OIDC) encrypted with this key, so
      // a restore onto a different install would otherwise be unable to decrypt
      // them. NOTE: this makes the backup file as sensitive as the key itself —
      // store/transfer it securely. Skipped when ENCRYPTION_KEY is provided via
      // env, since in that case the file is not the source of truth.
      const encKeyPath = path.join(dataDir, '.encryption_key');
      if (!readEnv().backup.encryptionKeyFromEnv && fs.existsSync(encKeyPath)) {
        archive.file(encKeyPath, { name: '.encryption_key' });
      }

      for (const entry of uploadEntries) archive.file(entry.absPath, { name: entry.name });

      // Plugin data — each plugin's own SQLite file and any blobs. This is the ONLY
      // copy of the user data a plugin holds, so it belongs in the backup. Checkpoint
      // every open handle first (the host keeps them open in WAL mode) so the archived
      // .db files are complete snapshots and not missing recent commits stranded in a
      // -wal sidecar — the same treatment travel.db gets above.
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
          try { real = fs.realpathSync(dir); } catch { continue; }
          if (!real.startsWith(realRoot + path.sep)) continue; // dev-link points outside → skip
          try { if (!fs.statSync(dir).isDirectory()) continue; } catch { continue; }
          archive.directory(dir, `plugins-code/${entry}`);
        }
      }

      archive.finalize();
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
export function restoreBackup(storage: StorageService, filename: string): Promise<RestoreResult> {
  return storage.withLocalFile('backups', filename, (zipPath) => restoreFromZip(storage, zipPath));
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
async function rehydrateUploads(storage: StorageService, extractedUploads: string): Promise<void> {
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

export async function restoreFromZip(storage: StorageService, zipPath: string): Promise<RestoreResult> {
  const extractDir = path.join(dataDir, `restore-${Date.now()}`);
  let reinitFailed: unknown = null;
  try {
    // Fast reject on the central-directory's declared size, then extract entry-by-entry
    // enforcing the ACTUAL decompressed bytes. The declared uncompressedSize is
    // attacker-declarable — a zip bomb can under-report it and expand past the cap during
    // extraction — so the real guard counts bytes as they are written and aborts once the
    // running total crosses the cap. Each entry's resolved path is also confined to
    // extractDir (a `../` entry that escaped the root — zip-slip — is refused).
    const directory = await unzipper.Open.file(zipPath);
    const claimedSize = directory.files.reduce((sum, f) => sum + (f.uncompressedSize || 0), 0);
    if (claimedSize > MAX_BACKUP_DECOMPRESSED_SIZE) {
      return { success: false, error: 'Backup exceeds the maximum decompressed size.', status: 400 };
    }

    fs.mkdirSync(extractDir, { recursive: true });
    let decompressedBytes = 0;
    for (const entry of directory.files) {
      if (entry.type === 'Directory') continue;
      const dest = path.join(extractDir, entry.path);
      const rel = path.relative(extractDir, dest);
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
        return { success: false, error: 'Invalid backup: an entry path escapes the archive root.', status: 400 };
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        await new Promise<void>((resolve, reject) => {
          const source = entry.stream();
          const out = fs.createWriteStream(dest);
          source.on('data', (chunk: Buffer) => {
            decompressedBytes += chunk.length;
            if (decompressedBytes > MAX_BACKUP_DECOMPRESSED_SIZE) {
              source.destroy();
              out.destroy();
              reject(new Error('DECOMPRESSED_CAP_EXCEEDED'));
            }
          });
          source.on('error', reject);
          out.on('error', reject);
          out.on('finish', resolve);
          source.pipe(out);
        });
      } catch (err) {
        fs.rmSync(extractDir, { recursive: true, force: true });
        if (err instanceof Error && err.message === 'DECOMPRESSED_CAP_EXCEEDED') {
          return { success: false, error: 'Backup exceeds the maximum decompressed size.', status: 400 };
        }
        throw err;
      }
    }

    const extractedDb = path.join(extractDir, 'travel.db');
    if (!fs.existsSync(extractedDb)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      return { success: false, error: 'Invalid backup: travel.db not found', status: 400 };
    }

    let uploadedDb: InstanceType<typeof Database> | null = null;
    try {
      uploadedDb = new Database(extractedDb, { readonly: true });

      const integrityResult = uploadedDb.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
      if (integrityResult.integrity_check !== 'ok') {
        fs.rmSync(extractDir, { recursive: true, force: true });
        return { success: false, error: `Uploaded database failed integrity check: ${integrityResult.integrity_check}`, status: 400 };
      }

      const requiredTables = ['users', 'trips', 'trip_members', 'places', 'days'];
      const existingTables = uploadedDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];
      const tableNames = new Set(existingTables.map(t => t.name));
      for (const table of requiredTables) {
        if (!tableNames.has(table)) {
          fs.rmSync(extractDir, { recursive: true, force: true });
          return { success: false, error: `Uploaded database is missing required table: ${table}. This does not appear to be a TREK backup.`, status: 400 };
        }
      }
    } catch (err) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      return { success: false, error: 'Uploaded file is not a valid SQLite database', status: 400 };
    } finally {
      uploadedDb?.close();
    }

    closeDb();

    try {
      const dbDest = path.join(dataDir, 'travel.db');
      // Swap the core DB atomically: copy the restored DB to a temp file on the SAME
      // filesystem, drop the old -wal/-shm sidecars (they belong to the DB being replaced
      // and would corrupt the new one if left), then rename into place. A rename is atomic,
      // so a crash mid-swap leaves either the old or the new travel.db intact — never the
      // deleted-and-not-yet-copied gap that a plain unlink-then-copy could leave.
      const dbTmp = dbDest + '.restore-tmp';
      fs.copyFileSync(extractedDb, dbTmp);
      for (const ext of ['-wal', '-shm']) {
        try { fs.unlinkSync(dbDest + ext); } catch (e) {}
      }
      fs.renameSync(dbTmp, dbDest);

      // Restore the bundled at-rest encryption key (if the archive carries one)
      // so the restored DB's encrypted secrets can be decrypted. Only the file
      // is swapped here; the in-memory key was read at startup, so a restart is
      // required for it to take effect (and an explicit ENCRYPTION_KEY env var
      // still overrides the file).
      const extractedEncKey = path.join(extractDir, '.encryption_key');
      if (fs.existsSync(extractedEncKey)) {
        fs.copyFileSync(extractedEncKey, path.join(dataDir, '.encryption_key'));
      }
    } finally {
      // Reopening the DB must always run (even if the copy above threw) so the
      // process is never left without a connection. Capture a reopen failure
      // instead of letting it propagate as a generic error — a backup whose
      // files already landed on disk but whose connection failed to reopen
      // needs to be reported as "restart required", not swallowed.
      try {
        reinitialize();
      } catch (reinitErr) {
        reinitFailed = reinitErr;
      }
      // The restored DB has different permission-override rows from
      // the pre-restore DB, but our process-local permissions cache
      // still holds the pre-restore state. Any request using a cached
      // permission would decide against the wrong grants until the
      // next restart. Dropping the cache forces a fresh read.
      invalidatePermissionsCache();
    }

    if (!reinitFailed) {
      // The registry reads storage.* app_settings through the DB handle that
      // was just closed and reopened above — reload it now, AFTER reinitialize()
      // and BEFORE any byte moves, so rehydrated uploads land where the RESTORED
      // config says rather than the stale pre-restore one (audit #4). Skipped
      // entirely when reopen failed: with no live DB handle the registry has
      // nothing to read, and the restore is already reported as "restart
      // required" below — rehydrating into a stale/guessed config would be worse.
      storage.reloadConfig();

      const extractedUploads = path.join(extractDir, 'uploads');
      if (fs.existsSync(extractedUploads)) {
        // Parity with the legacy wipe: it unlinked one level deep only (nested
        // files — journey/thumbs, photos/google — survived until overwritten by
        // the copy) and swallowed per-file errors.
        for (const category of BACKUP_UPLOAD_CATEGORIES) {
          for await (const obj of storage.list(category)) {
            if (obj.key.includes('/')) continue;
            await storage.delete(category, obj.key).catch(() => { /* best-effort, as the old unlink loop was */ });
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
      // Quiesce regardless of whether trees were staged: the restored travel.db carries
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
      return { success: false, error: 'Backup files were restored but the database connection could not be reopened. Restart the server to finish the restore.', status: 500 };
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
    try { invalidatePermissionsCache(); } catch { /* best-effort */ }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Delete backup
// ---------------------------------------------------------------------------

export function deleteBackup(storage: StorageService, filename: string): Promise<void> {
  return storage.delete('backups', filename);
}

