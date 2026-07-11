import archiver from 'archiver';
import unzipper from 'unzipper';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { db, closeDb, reinitialize } from '../db/database';
import * as scheduler from '../scheduler';
import { invalidatePermissionsCache } from './permissions';
import { pluginsCodeRoot, pluginsDataRoot } from '../nest/plugins/paths';
import { stageExtractedPluginTrees, applyStagedRestoreNow } from '../nest/plugins/plugin-backup';
import { snapshotAllPluginDataDbs } from '../nest/plugins/host/plugin-data.service';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const dataDir = path.join(__dirname, '../../data');
const backupsDir = path.join(dataDir, 'backups');
const uploadsDir = path.join(__dirname, '../../uploads');

// Compressed upload cap for restore archives. Defaults to 500 MB, raisable via
// BACKUP_UPLOAD_LIMIT_MB for instances whose backups (uploads/ included) grow
// past that. Invalid values warn and fall back to the default.
const DEFAULT_BACKUP_UPLOAD_LIMIT_MB = 500;
const rawBackupUploadLimit = process.env.BACKUP_UPLOAD_LIMIT_MB?.trim();
let backupUploadLimitMb = DEFAULT_BACKUP_UPLOAD_LIMIT_MB;
if (rawBackupUploadLimit) {
  const parsed = Number(rawBackupUploadLimit);
  if (Number.isFinite(parsed) && parsed > 0) {
    backupUploadLimitMb = parsed;
  } else {
    console.warn(`BACKUP_UPLOAD_LIMIT_MB="${rawBackupUploadLimit}" is not a positive number. Falling back to ${DEFAULT_BACKUP_UPLOAD_LIMIT_MB} MB.`);
  }
}
export const MAX_BACKUP_UPLOAD_SIZE = backupUploadLimitMb * 1024 * 1024; // compressed
// Upper bound on the TOTAL decompressed size of a restore archive (the upload
// limit only caps the compressed bytes). Default 5 GB, raisable via
// BACKUP_MAX_DECOMPRESSED_MB for an instance whose own backups (now including the
// plugin trees) legitimately grow past it — otherwise its own backups become
// unrestorable. Invalid values warn and fall back to the default.
const DEFAULT_BACKUP_DECOMPRESSED_MB = 5 * 1024;
const rawDecompressedLimit = process.env.BACKUP_MAX_DECOMPRESSED_MB?.trim();
let backupDecompressedMb = DEFAULT_BACKUP_DECOMPRESSED_MB;
if (rawDecompressedLimit) {
  const parsed = Number(rawDecompressedLimit);
  if (Number.isFinite(parsed) && parsed > 0) {
    backupDecompressedMb = parsed;
  } else {
    console.warn(`BACKUP_MAX_DECOMPRESSED_MB="${rawDecompressedLimit}" is not a positive number. Falling back to ${DEFAULT_BACKUP_DECOMPRESSED_MB} MB.`);
  }
}
export const MAX_BACKUP_DECOMPRESSED_SIZE = backupDecompressedMb * 1024 * 1024;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function ensureBackupsDir(): void {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function parseIntField(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.floor(raw);
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = parseInt(raw, 10);
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
    typeof rawInterval === 'string' && scheduler.VALID_INTERVALS.includes(rawInterval)
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

export function backupFilePath(filename: string): string {
  return path.join(backupsDir, filename);
}

export function backupFileExists(filename: string): boolean {
  return fs.existsSync(path.join(backupsDir, filename));
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

export function listBackups(): BackupInfo[] {
  ensureBackupsDir();
  return fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.zip'))
    .map(filename => {
      const filePath = path.join(backupsDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        size: stat.size,
        sizeText: formatSize(stat.size),
        created_at: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ---------------------------------------------------------------------------
// Create backup
// ---------------------------------------------------------------------------

export async function createBackup(): Promise<BackupInfo> {
  ensureBackupsDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${timestamp}.zip`;
  const outputPath = path.join(backupsDir, filename);
  const pdataSnap = path.join(backupsDir, `.plugins-snap-${timestamp}`);

  try {
    try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {}

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      const dbPath = path.join(dataDir, 'travel.db');
      if (fs.existsSync(dbPath)) {
        archive.file(dbPath, { name: 'travel.db' });
      }

      // Bundle the at-rest encryption key so the backup is self-contained: the
      // DB stores secrets (API keys, MFA, SMTP/OIDC) encrypted with this key, so
      // a restore onto a different install would otherwise be unable to decrypt
      // them. NOTE: this makes the backup file as sensitive as the key itself —
      // store/transfer it securely. Skipped when ENCRYPTION_KEY is provided via
      // env, since in that case the file is not the source of truth.
      const encKeyPath = path.join(dataDir, '.encryption_key');
      if (!process.env.ENCRYPTION_KEY && fs.existsSync(encKeyPath)) {
        archive.file(encKeyPath, { name: '.encryption_key' });
      }

      if (fs.existsSync(uploadsDir)) {
        // Exclude the place-photo and trek-memory caches: both are re-derivable
        // (re-fetched on demand, keyed on stable ids) and would otherwise dominate
        // backup size. Restores self-heal — the cache dirs are recreated at startup.
        //
        // Also exclude backups/ and restore-*/: these live under data/, not uploads/,
        // but when an install maps data and uploads to the SAME directory (a
        // misconfiguration, but a catastrophic one) the glob would otherwise sweep
        // every prior backup zip into the new archive — each run embedding all
        // previous runs, so size compounds without bound (see issue #1358). Ignoring
        // them keeps the backup bounded regardless of how the volumes are mounted.
        archive.glob(
          '**/*',
          {
            cwd: uploadsDir,
            ignore: ['photos/google/**', 'photos/trek/**', 'backups/**', 'restore-*/**'],
            nodir: true,
            dot: true,
          },
          { prefix: 'uploads' },
        );
      }

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

    const stat = fs.statSync(outputPath);
    return {
      filename,
      size: stat.size,
      sizeText: formatSize(stat.size),
      created_at: stat.birthtime.toISOString(),
    };
  } catch (err: unknown) {
    console.error('Backup error:', err);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw err;
  } finally {
    // The snapshot was a staging copy for the archiver only; drop it once streaming is done
    // (the await above resolves on the output stream's 'close', so the archive is complete).
    fs.rmSync(pdataSnap, { recursive: true, force: true });
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

export async function restoreFromZip(zipPath: string): Promise<RestoreResult> {
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
      for (const ext of ['', '-wal', '-shm']) {
        try { fs.unlinkSync(dbDest + ext); } catch (e) {}
      }
      fs.copyFileSync(extractedDb, dbDest);

      // Restore the bundled at-rest encryption key (if the archive carries one)
      // so the restored DB's encrypted secrets can be decrypted. Only the file
      // is swapped here; the in-memory key was read at startup, so a restart is
      // required for it to take effect (and an explicit ENCRYPTION_KEY env var
      // still overrides the file).
      const extractedEncKey = path.join(extractDir, '.encryption_key');
      if (fs.existsSync(extractedEncKey)) {
        fs.copyFileSync(extractedEncKey, path.join(dataDir, '.encryption_key'));
      }

      const extractedUploads = path.join(extractDir, 'uploads');
      if (fs.existsSync(extractedUploads)) {
        for (const sub of fs.readdirSync(uploadsDir)) {
          const subPath = path.join(uploadsDir, sub);
          if (fs.statSync(subPath).isDirectory()) {
            for (const file of fs.readdirSync(subPath)) {
              try { fs.unlinkSync(path.join(subPath, file)); } catch (e) {}
            }
          }
        }
        // Copy into the real directory behind uploadsDir. In Docker, uploadsDir
        // (/app/server/uploads) is a symlink to the mounted /app/uploads volume;
        // cpSync(dereference:false) would otherwise try to overwrite the symlink
        // node with a directory and throw ERR_FS_CP_DIR_TO_NON_DIR. realpathSync
        // is a no-op when uploadsDir is a plain directory (dev/non-Docker).
        fs.cpSync(extractedUploads, fs.realpathSync(uploadsDir), { recursive: true, force: true });
      }

      // Plugin trees can't be swapped while the runtime holds their DBs open, so stage
      // them beside the live trees, then ask the runtime to quiesce its plugins and apply
      // the swap NOW. If the runtime isn't up (plugins disabled / restore during boot),
      // the staging waits for the boot reconcile — with nothing running, no data diverges.
      // Best-effort: a staging error must not fail an otherwise-good core restore.
      try {
        stageExtractedPluginTrees(extractDir);
        // Quiesce regardless of whether trees were staged: the restored travel.db carries
        // a different `plugins` table, so any plugin still running with its pre-restore
        // identity/grants is now a ghost — invisible in the restored UI, unstoppable short
        // of a process restart. applyStagedRestoreNow closes those handles; the tree swap
        // it also performs is a no-op when nothing was staged (e.g. an older archive).
        await applyStagedRestoreNow();
      } catch (e) {
        console.error('Restore: staging plugin trees failed:', e);
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
// Auto-backup settings
// ---------------------------------------------------------------------------

export function getAutoSettings(): { settings: ReturnType<typeof scheduler.loadSettings>; timezone: string } {
  const tz = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return { settings: scheduler.loadSettings(), timezone: tz };
}

export function updateAutoSettings(body: Record<string, unknown>): ReturnType<typeof parseAutoBackupBody> {
  const settings = parseAutoBackupBody(body);
  scheduler.saveSettings(settings);
  scheduler.start();
  return settings;
}

// ---------------------------------------------------------------------------
// Delete backup
// ---------------------------------------------------------------------------

export function deleteBackup(filename: string): void {
  const filePath = path.join(backupsDir, filename);
  fs.unlinkSync(filePath);
}

// ---------------------------------------------------------------------------
// Upload config (multer dest)
// ---------------------------------------------------------------------------

export function getUploadTmpDir(): string {
  return path.join(dataDir, 'tmp/');
}
