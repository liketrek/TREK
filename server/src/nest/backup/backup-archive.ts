import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import type Database from 'better-sqlite3';
import { readEnv } from '../../app-config';
import { openDatabase } from '../../db/connection';

/**
 * Reading a backup archive, without touching the live database.
 *
 * Split out of backup.impl.ts so the restore that runs before the database is
 * opened (boot-restore.ts, #1089) can use the same guards as the one in the
 * admin panel: importing backup.impl.ts opens the database as a side effect,
 * which is exactly what a first-boot restore has to happen before.
 */

// Frozen at import on purpose (legacy timing, see backup.impl.ts).
const backupEnv = readEnv().backup;
export const MAX_BACKUP_UPLOAD_SIZE = backupEnv.uploadLimitMb * 1024 * 1024; // compressed
export const MAX_BACKUP_DECOMPRESSED_SIZE = backupEnv.maxDecompressedMb * 1024 * 1024;

/** A refusal in the restore route's own words and status. */
export interface ArchiveRefusal {
  error: string;
  status: number;
}

/**
 * Unpack an archive into `extractDir`, or say why not.
 *
 * Fast reject on the central-directory's declared size, then extract entry-by-entry
 * enforcing the ACTUAL decompressed bytes. The declared uncompressedSize is
 * attacker-declarable — a zip bomb can under-report it and expand past the cap during
 * extraction — so the real guard counts bytes as they are written and aborts once the
 * running total crosses the cap. Each entry's resolved path is also confined to
 * extractDir (a `../` entry that escaped the root — zip-slip — is refused).
 *
 * A refusal leaves nothing behind. Any other failure is thrown, also with the
 * directory removed.
 */
export async function extractBackupArchive(zipPath: string, extractDir: string): Promise<ArchiveRefusal | null> {
  const directory = await unzipper.Open.file(zipPath);
  const claimedSize = directory.files.reduce((sum, f) => sum + (f.uncompressedSize || 0), 0);
  if (claimedSize > MAX_BACKUP_DECOMPRESSED_SIZE) {
    return { error: 'Backup exceeds the maximum decompressed size.', status: 400 };
  }

  fs.mkdirSync(extractDir, { recursive: true });
  let decompressedBytes = 0;
  for (const entry of directory.files) {
    if (entry.type === 'Directory') continue;
    const dest = path.join(extractDir, entry.path);
    const rel = path.relative(extractDir, dest);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      return { error: 'Invalid backup: an entry path escapes the archive root.', status: 400 };
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
        return { error: 'Backup exceeds the maximum decompressed size.', status: 400 };
      }
      throw err;
    }
  }
  return null;
}

/**
 * Whether an unpacked archive holds a TREK database that can be put in place:
 * present, intact, and carrying the tables every TREK has. Read-only; the file
 * is closed again before this returns.
 */
export function checkBackupDatabase(extractDir: string): ArchiveRefusal | null {
  const extractedDb = path.join(extractDir, 'travel.db');
  if (!fs.existsSync(extractedDb)) {
    return { error: 'Invalid backup: travel.db not found', status: 400 };
  }

  let uploadedDb: InstanceType<typeof Database> | null = null;
  try {
    uploadedDb = openDatabase(extractedDb, { readonly: true });

    const integrityResult = uploadedDb.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (integrityResult.integrity_check !== 'ok') {
      return { error: `Uploaded database failed integrity check: ${integrityResult.integrity_check}`, status: 400 };
    }

    const requiredTables = ['users', 'trips', 'trip_members', 'places', 'days'];
    const existingTables = uploadedDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = new Set(existingTables.map(t => t.name));
    for (const table of requiredTables) {
      if (!tableNames.has(table)) {
        return { error: `Uploaded database is missing required table: ${table}. This does not appear to be a TREK backup.`, status: 400 };
      }
    }
    return null;
  } catch {
    return { error: 'Uploaded file is not a valid SQLite database', status: 400 };
  } finally {
    uploadedDb?.close();
  }
}
