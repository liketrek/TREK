import { Injectable } from '@nestjs/common';
import * as svc from './backup.impl';

/**
 * The backup domain's injectable face.
 *
 * The implementation moved here from src/services/backupService.ts with the code
 * unchanged, and stays a module rather than becoming methods on this class: the zip
 * packing and the restore path close and reinitialize the core DB handle, which is the
 * single most dangerous sequence in the server. Rewriting its shape and moving it in
 * one step would make a regression there impossible to bisect. The DB-lifecycle
 * question is deliberately the LAST step of this fold, not part of the move.
 */
@Injectable()
export class BackupService {
  listBackups() { return svc.listBackups(); }
  createBackup(prefix?: 'backup' | 'auto-backup') { return svc.createBackup(prefix); }
  restoreFromZip(zipPath: string) { return svc.restoreFromZip(zipPath); }
  getAutoSettings() { return svc.getAutoSettings(); }
  updateAutoSettings(body: Record<string, unknown>) { return svc.updateAutoSettings(body); }
  deleteBackup(filename: string) { return svc.deleteBackup(filename); }

  isValidBackupFilename(filename: string) { return svc.isValidBackupFilename(filename); }
  backupFilePath(filename: string) { return svc.backupFilePath(filename); }
  backupFileExists(filename: string) { return svc.backupFileExists(filename); }
  checkRateLimit(key: string, maxAttempts: number, windowMs: number) { return svc.checkRateLimit(key, maxAttempts, windowMs); }

  get rateWindow() { return svc.BACKUP_RATE_WINDOW; }
}
