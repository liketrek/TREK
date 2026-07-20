/**
 * Directory backup target.
 *
 * Copies the finished archive to a second directory. That is the whole feature:
 * TREK writes to a path, and *what that path is* is the operator's business.
 *
 * Both release types are covered by the same code. On a source install the path
 * is just a filesystem path. On the Docker image it is a path inside the
 * container, which the operator maps to wherever they actually want the copy —
 * another disk, a NAS mount, a network share — with a volume. That mapping is
 * outside TREK's control by design: the kernel and the container runtime handle
 * it far better than application code could, and TREK gains no protocol client
 * to maintain.
 *
 * The only rule TREK enforces is where the directory may *not* be: inside its
 * own data or uploads trees. See {@link validatePath}.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { BackupTarget, RemoteBackup, UploadOutcome } from './backup-target.s3';
import type { TargetConfig } from './backup-target.config';

/** Probe file written and removed by the connection test. */
const PROBE_FILE = '.trek-connection-test';

/**
 * Directories the target must never be, and why.
 *
 * `data/backups` is where the archive already is — targeting it would make
 * every backup its own copy, so the list would report one file as two and a
 * delete would race itself. `uploads/` is worse: it is *inside* the next
 * backup, so each run would archive every previous archive and the size would
 * compound without bound (the failure mode of #1358).
 */
function forbiddenRoots(): string[] {
  return [
    path.resolve(__dirname, '../../../data'),
    path.resolve(__dirname, '../../../uploads'),
  ];
}

export interface PathCheck {
  ok: boolean;
  error?: string;
}

/**
 * Validate the configured directory before anything is written to it.
 *
 * Rejects a relative path (which would resolve against the server's cwd and
 * silently move if that ever changed) and any of TREK's own data roots.
 */
export function validatePath(cfg: TargetConfig): PathCheck {
  const raw = cfg.localPath.trim();
  if (raw === '') return { ok: false, error: 'No target directory is configured.' };
  if (!path.isAbsolute(raw)) {
    return { ok: false, error: 'The target directory must be an absolute path.' };
  }

  const resolved = path.resolve(raw);
  for (const root of forbiddenRoots()) {
    if (resolved === root || resolved.startsWith(root + path.sep)) {
      return {
        ok: false,
        error: `The target directory must be outside TREK's own data and uploads directories (${root}).`,
      };
    }
  }
  return { ok: true };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/** Stream a file to another path, so multi-gigabyte archives never buffer. */
async function copyFile(from: string, to: string): Promise<void> {
  await pipeline(fs.createReadStream(from), fs.createWriteStream(to));
}

export function localTarget(cfg: TargetConfig, isBackupName: (n: string) => boolean): BackupTarget {
  const dir = cfg.localPath.trim();
  const dest = (filename: string) => path.join(dir, filename);

  return {
    id: 'local',

    isConfigured: () => validatePath(cfg).ok,

    async upload(zipPath: string): Promise<UploadOutcome> {
      const check = validatePath(cfg);
      if (!check.ok) return { uploaded: false, error: check.error };

      const filename = path.basename(zipPath);
      const target = dest(filename);
      // Write to a temp name and rename into place: a reader (or a later
      // restore) must never find a half-copied archive that looks complete.
      const tmp = `${target}.part`;
      try {
        ensureDir(dir);
        await copyFile(zipPath, tmp);
        fs.renameSync(tmp, target);
        return { uploaded: true, key: target };
      } catch (err: unknown) {
        try { fs.rmSync(tmp, { force: true }); } catch { /* best-effort */ }
        return { uploaded: false, key: target, error: describeFsError(err) };
      }
    },

    async has(zipPath: string): Promise<boolean> {
      try {
        return fs.existsSync(dest(path.basename(zipPath)));
      } catch {
        return false;
      }
    },

    async remove(filename: string): Promise<void> {
      fs.rmSync(dest(filename), { force: true });
    },

    async list(): Promise<RemoteBackup[]> {
      if (!validatePath(cfg).ok || !fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir)
        .filter(isBackupName)
        .map(filename => {
          const stat = fs.statSync(path.join(dir, filename));
          return { filename, size: stat.size, created_at: stat.mtime.toISOString() };
        });
    },

    async download(filename: string, destPath: string): Promise<void> {
      await copyFile(dest(filename), destPath);
    },

    /**
     * Same three-step probe the S3 backend runs: reachable, writable, and the
     * probe can be removed again. A directory mounted read-only is the
     * filesystem equivalent of a read-only access key — it passes "exists" and
     * then fails every backup.
     */
    async test(): Promise<{ success: boolean; error?: string }> {
      const check = validatePath(cfg);
      if (!check.ok) return { success: false, error: check.error };

      const probe = dest(PROBE_FILE);
      try {
        ensureDir(dir);
      } catch (err: unknown) {
        return { success: false, error: `The target directory could not be created: ${describeFsError(err)}` };
      }
      try {
        fs.writeFileSync(probe, 'trek');
      } catch (err: unknown) {
        return { success: false, error: `The directory exists but is not writable: ${describeFsError(err)}` };
      }
      try {
        fs.rmSync(probe, { force: true });
      } catch (err: unknown) {
        return {
          success: true,
          error: `Backups can be written, but the test file could not be removed (${describeFsError(err)}). Retention will not be able to prune old backups.`,
        };
      }
      return { success: true };
    },
  };
}

/** Turn a filesystem error into something an admin can act on. */
function describeFsError(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'EACCES':
    case 'EPERM':
      return 'permission denied — check the ownership and mode of the directory, and the user TREK runs as.';
    case 'ENOENT':
      return 'the path does not exist and could not be created. If it is a mounted volume, check that it is actually mounted.';
    case 'ENOSPC':
      return 'no space left on the target.';
    case 'EROFS':
      return 'the target is mounted read-only.';
    case 'ESTALE':
      return 'stale file handle — a mounted volume was remounted or went away.';
    case 'EIO':
      return 'I/O error writing to the target.';
    default:
      return err instanceof Error ? err.message : String(err);
  }
}
