import { MaintenanceRepository } from '../../db/repositories/MaintenanceRepository';
import { logInfo, logWarn } from '../audit/audit-log.logger';
import {
  DatabaseConnectionLostError,
  type DatabaseBackupRefusal,
  type DatabaseBackupStrategy,
} from '../database/database-backup.interface';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { checkBackupDatabase } from './backup-archive';
import { Injectable } from '@nestjs/common';

import fs from 'fs';
import path from 'path';

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * The backup port for the one engine TREK runs on: a SQLite file.
 *
 * Every step is what `backup.impl.ts` and `demo/demo-reset.ts` did inline
 * before the port existed. A snapshot is `VACUUM INTO`, which takes a
 * consistent copy even under concurrent writers. A restore closes the
 * connection, swaps the file by copy and rename (a crash mid-swap leaves the
 * old or the new file, never neither), drops the old `-wal`/`-shm` sidecars,
 * and reopens through `DatabaseLifecycle`, which migrates the restored file
 * forward.
 *
 * The file is always `DatabaseLifecycle.file`, the path the connection was
 * opened on, so `TREK_DB_FILE` moves the backup, the restore and the demo reset
 * along with the database.
 */
@Injectable()
export class SqliteDatabaseBackup implements DatabaseBackupStrategy {
  readonly archiveEntry = 'travel.db';

  constructor(
    private readonly lifecycle: DatabaseLifecycle,
    private readonly maintenance: MaintenanceRepository,
  ) {}

  location(): string {
    return this.lifecycle.file;
  }

  canSnapshot(): boolean {
    const file = this.lifecycle.file;
    return file !== ':memory:' && fs.existsSync(file);
  }

  async checkpoint(): Promise<void> {
    await this.maintenance.walCheckpoint();
  }

  async snapshot(target: string): Promise<void> {
    try {
      await this.maintenance.vacuumInto(target);
    } catch (err) {
      // A VACUUM INTO that failed part-way (a full disk) can leave a truncated
      // file behind. Nothing may mistake it for a copy.
      fs.rmSync(target, { force: true });
      throw err;
    }
  }

  verify(extractDir: string): DatabaseBackupRefusal | null {
    return checkBackupDatabase(extractDir);
  }

  /**
   * A copy of the database a restore is about to replace, next to it. The swap
   * deletes the current file, and a restore of the wrong archive used to leave
   * nothing to go back to.
   */
  async keepCopyBeforeRestore(): Promise<string | null> {
    const target = path.join(path.dirname(this.lifecycle.file), `pre-restore-${Date.now()}.db`);
    try {
      await this.snapshot(target);
      logInfo(`Restore: the replaced database was kept as ${target}`);
      return target;
    } catch (err) {
      logWarn(`Restore: could not keep a copy of the current database (${describeError(err)})`);
      return null;
    }
  }

  async replace(source: string): Promise<{ reopenError: unknown }> {
    const dest = this.lifecycle.file;
    this.lifecycle.close();
    let swapFailed = false;
    let swapError: unknown = null;
    try {
      // Copy to a temp file on the SAME filesystem, drop the old sidecars (they
      // belong to the database being replaced and would corrupt the new one),
      // then rename into place. The rename is atomic.
      const tmp = dest + '.restore-tmp';
      fs.copyFileSync(source, tmp);
      for (const ext of ['-wal', '-shm']) {
        try {
          fs.unlinkSync(dest + ext);
        } catch {
          /* no sidecar to drop */
        }
      }
      fs.renameSync(tmp, dest);
    } catch (err) {
      swapFailed = true;
      swapError = err;
    }

    // Reopening must always run, even when the swap threw, so the process is
    // never left without a connection. After a swap that landed, a reopen
    // failure is reported, not thrown: the files are in place and the caller
    // has to say "restart". After a swap that failed, both errors go up
    // together, because the swap's alone would hide that the connection is gone.
    let reopenError: unknown = null;
    try {
      await this.lifecycle.reopen();
    } catch (err) {
      reopenError = err;
    }
    if (swapFailed) {
      if (reopenError) throw new DatabaseConnectionLostError(swapError, reopenError);
      throw swapError;
    }
    return { reopenError };
  }
}
