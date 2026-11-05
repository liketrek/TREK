import { SqliteMaintenance } from '../../db/engine/sqlite/sqlite-maintenance';
import { DomainError } from '../common/domain-error';
import type { DatabaseBackupStrategy } from '../database/database-backup.interface';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { checkBackupDatabase } from './backup-archive';
import { keepRestoreCopy, replaceThenReopen } from './database-swap';
import { Injectable } from '@nestjs/common';

import fs from 'fs';
import path from 'path';

/**
 * The backup port on a SQLite file, the engine TREK runs on by default.
 *
 * A snapshot is `VACUUM INTO`, which takes a consistent copy even under
 * concurrent writers. A restore closes the connection, swaps the file by copy
 * and rename (a crash mid-swap leaves the old or the new file, never neither),
 * drops the old `-wal`/`-shm` sidecars, and reopens through `DatabaseLifecycle`,
 * which migrates the restored file forward.
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
    private readonly maintenance: SqliteMaintenance,
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

  /** Throws a DomainError carrying the refusal when the archive's database cannot be restored here. */
  async verify(extractDir: string): Promise<void> {
    const refusal = checkBackupDatabase(extractDir);
    if (refusal) throw new DomainError(refusal.status, refusal.error);
  }

  /** A copy of the database a restore is about to replace, next to it: the swap deletes the current file. */
  keepCopyBeforeRestore(): Promise<string | null> {
    const target = path.join(path.dirname(this.lifecycle.file), `pre-restore-${Date.now()}.db`);
    return keepRestoreCopy(target, (copy) => this.snapshot(copy));
  }

  async replace(source: string): Promise<{ reopenError: unknown }> {
    const dest = this.lifecycle.file;
    this.lifecycle.close();
    return replaceThenReopen(
      () => swapFile(source, dest),
      () => this.lifecycle.reopen(),
    );
  }
}

/**
 * Puts `source` at `dest` by copying it to a temp file on the same filesystem
 * and renaming it into place. The old sidecars go first: they belong to the
 * database being replaced and would corrupt the new one.
 */
function swapFile(source: string, dest: string): void {
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
}
