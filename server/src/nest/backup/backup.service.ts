import { Injectable } from '@nestjs/common';
import * as svc from '../../services/backupService';

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
  deleteBackup(filename: string) { return svc.deleteBackup(filename); }

  isValidBackupFilename(filename: string) { return svc.isValidBackupFilename(filename); }
  backupFilePath(filename: string) { return svc.backupFilePath(filename); }
  backupFileExists(filename: string) { return svc.backupFileExists(filename); }
  checkRateLimit(key: string, maxAttempts: number, windowMs: number) { return svc.checkRateLimit(key, maxAttempts, windowMs); }

  get rateWindow() { return svc.BACKUP_RATE_WINDOW; }
}
