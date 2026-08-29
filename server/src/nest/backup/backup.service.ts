import { StorageService } from '../storage/storage.service';
import * as svc from './backup.impl';
import { Injectable } from '@nestjs/common';

import type { Response } from 'express';

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
  constructor(private readonly storage: StorageService) {}

  listBackups() {
    return svc.listBackups(this.storage);
  }
  createBackup(prefix?: 'backup' | 'auto-backup') {
    return svc.createBackup(this.storage, prefix);
  }
  restoreFromZip(zipPath: string) {
    return svc.restoreFromZip(this.storage, zipPath);
  }
  restoreBackup(filename: string) {
    return svc.restoreBackup(this.storage, filename);
  }
  deleteBackup(filename: string) {
    return svc.deleteBackup(this.storage, filename);
  }

  isValidBackupFilename(filename: string) {
    return svc.isValidBackupFilename(filename);
  }
  backupFileExists(filename: string) {
    return svc.backupFileExists(this.storage, filename);
  }
  sendBackupToResponse(filename: string, res: Response) {
    return svc.sendBackupToResponse(this.storage, filename, res);
  }
  checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
    return svc.checkRateLimit(key, maxAttempts, windowMs);
  }

  get rateWindow() {
    return svc.BACKUP_RATE_WINDOW;
  }
}
