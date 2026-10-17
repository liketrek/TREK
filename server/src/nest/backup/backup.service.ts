import { DATABASE_BACKUP, type DatabaseBackupStrategy } from '../database/database-backup.interface';
import { StorageService } from '../storage/storage.service';
import * as svc from './backup.impl';
import { Inject, Injectable } from '@nestjs/common';

import type { Response } from 'express';

/**
 * The backup domain's injectable face.
 *
 * The implementation moved here from src/services/backupService.ts with the code
 * unchanged, and stays a module rather than becoming methods on this class. What
 * made that the cautious choice was that the zip packing and the restore path
 * closed and reinitialized the core DB handle themselves. They no longer do:
 * every database step goes through the injected backup port
 * (`DATABASE_BACKUP`, `SqliteDatabaseBackup` today), which owns the snapshot and
 * the swap, and through it `DatabaseLifecycle`, which owns the connection.
 */
@Injectable()
export class BackupService {
  private readonly deps: svc.BackupDeps;

  constructor(
    private readonly storage: StorageService,
    @Inject(DATABASE_BACKUP) database: DatabaseBackupStrategy,
  ) {
    this.deps = { storage, database };
  }

  listBackups() {
    return svc.listBackups(this.storage);
  }
  createBackup(prefix?: 'backup' | 'auto-backup') {
    return svc.createBackup(this.deps, prefix);
  }
  restoreFromZip(zipPath: string) {
    return svc.restoreFromZip(this.deps, zipPath);
  }
  restoreBackup(filename: string) {
    return svc.restoreBackup(this.deps, filename);
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
