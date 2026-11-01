import { DATABASE_BACKUP, type DatabaseBackupStrategy } from '../database/database-backup.interface';
import { StorageJobsService } from '../storage/storage-jobs.service';
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
    private readonly jobs: StorageJobsService,
  ) {
    this.deps = { storage, database };
  }

  listBackups() {
    return svc.listBackups(this.storage);
  }
  /** Marked running while it reads the uploads, so the storage reclaim pass deletes nothing it still archives. */
  async createBackup(prefix?: 'backup' | 'auto-backup') {
    this.jobs.beginBackup();
    try {
      return await svc.createBackup(this.deps, prefix);
    } finally {
      this.jobs.endBackup();
    }
  }
  restoreFromZip(zipPath: string) {
    return this.whileRestoring(() => svc.restoreFromZip(this.deps, zipPath));
  }
  restoreBackup(filename: string) {
    return this.whileRestoring(() => svc.restoreBackup(this.deps, filename));
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

  /**
   * A restore wipes and rehydrates the uploads under a swapped database, so
   * the storage reclaim pass must not run beside it: the restore marks itself
   * running (a pass refuses to start and one in flight stops at its next
   * check) and waits for a pass in flight to let go before it touches anything.
   */
  private async whileRestoring<T>(restore: () => Promise<T>): Promise<T> {
    await this.jobs.beginRestore();
    try {
      return await restore();
    } finally {
      this.jobs.endRestore();
    }
  }
}
