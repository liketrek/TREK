import fs from 'node:fs';
import path from 'node:path';
import { Injectable } from '@nestjs/common';
import type { BackupTargetRequest, MergedBackup } from '@trek/shared';
import * as svc from '../../services/backupService';
import { isManagedByEnv, readTargetForClient, saveTarget } from './backup-target.config';
import { deleteRemoteBackup, fetchRemoteBackup, listRemoteBackups, mirrorExistingBackups, remoteBackupExists, testConfiguredTarget } from './backup-target';

/**
 * Thin Nest wrapper around the existing backup service. The zip packing/restore,
 * the auto-backup scheduler settings, the filename validation, the rate-limit
 * bookkeeping and the tmp-dir all reuse the legacy code unchanged.
 */
@Injectable()
export class BackupService {
  listBackups() { return svc.listBackups(); }
  createBackup() { return svc.createBackup(); }
  restoreFromZip(zipPath: string) { return svc.restoreFromZip(zipPath); }
  getAutoSettings() { return svc.getAutoSettings(); }
  updateAutoSettings(body: Record<string, unknown>) { return svc.updateAutoSettings(body); }
  /**
   * Delete a backup everywhere it lives. The local file goes first because that
   * is the copy the admin can see; a target that refuses the delete is reported
   * rather than silently leaving a mirrored copy behind.
   */
  async deleteBackup(filename: string): Promise<{ found: boolean; remoteError?: string }> {
    const localExists = svc.backupFileExists(filename);
    const remoteExists = await remoteBackupExists(filename);
    // Neither copy exists — report it rather than answering a cheerful 200 for
    // a backup that was never there.
    if (!localExists && !remoteExists) return { found: false };

    if (localExists) svc.deleteBackup(filename);
    let remoteError: string | undefined;
    if (remoteExists) ({ error: remoteError } = await deleteRemoteBackup(filename));
    return { found: true, remoteError };
  }

  isValidBackupFilename(filename: string) { return svc.isValidBackupFilename(filename); }
  backupFilePath(filename: string) { return svc.backupFilePath(filename); }
  backupFileExists(filename: string) { return svc.backupFileExists(filename); }
  checkRateLimit(key: string, maxAttempts: number, windowMs: number) { return svc.checkRateLimit(key, maxAttempts, windowMs); }

  get rateWindow() { return svc.BACKUP_RATE_WINDOW; }

  // --- External S3 backup target -------------------------------------------

  readTarget() { return readTargetForClient(); }
  targetManagedByEnv() { return isManagedByEnv(); }
  saveTarget(patch: BackupTargetRequest) { return saveTarget(patch); }

  /**
   * Probe the stored target. Takes no request body: testing the *saved* config
   * is what the admin needs to know, and it keeps the plaintext secret from
   * having to travel back over the wire to be tested.
   */
  testTarget() { return testConfiguredTarget(); }

  /**
   * Mirror every archive already in data/backups to the target. Resolving the
   * paths here keeps `backup-target` free of any import back into the legacy
   * backup service, which imports the post-write hook from it.
   */
  mirrorExistingBackups() {
    const paths = svc.listBackups().map(b => svc.backupFilePath(b.filename));
    return mirrorExistingBackups(paths);
  }

  /**
   * The backup list, merged across disk and the external target.
   *
   * Each entry reports where it lives: `local` (on this server), `remote` (at
   * the target) or both. An archive that exists only at the target is listed
   * too — it is exactly what you need after losing the machine, which is the
   * whole point of having pushed it off-box.
   */
  async listBackupsMerged(): Promise<{ backups: MergedBackup[]; remoteError?: string }> {
    const local = svc.listBackups();
    const byName = new Map<string, MergedBackup>();
    for (const b of local) byName.set(b.filename, { ...b, local: true, remote: false });

    const { backups: remote, error: remoteError } = await listRemoteBackups(svc.isValidBackupFilename);
    for (const r of remote) {
      const existing = byName.get(r.filename);
      if (existing) {
        existing.remote = true;
      } else {
        byName.set(r.filename, {
          filename: r.filename,
          size: r.size,
          sizeText: svc.formatSize(r.size),
          created_at: r.created_at,
          local: false,
          remote: true,
        });
      }
    }

    const backups = [...byName.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return { backups, remoteError };
  }

  /**
   * Restore an archive that lives only at the target: fetch it to the same tmp
   * dir an uploaded restore uses, run the normal restore path (which keeps all
   * its zip-slip / zip-bomb / integrity guards), then drop the temp copy.
   */
  async restoreFromRemote(filename: string): Promise<svc.RestoreResult> {
    const tmpPath = path.join(svc.getUploadTmpDir(), `remote-${Date.now()}-${filename}`);
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    try {
      await fetchRemoteBackup(filename, tmpPath);
      return await svc.restoreFromZip(tmpPath);
    } finally {
      try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    }
  }
}
