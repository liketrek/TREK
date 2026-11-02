import { readEnv } from '../../app-config';
import { resolveEngine } from '../../db/engine';
import { pgDump, pgDumpMigrations, pgRestore } from '../../db/engine/postgres/pg-tools';
import { unknownMigrations } from '../../db/known-migrations';
import { DataPathsService } from '../app-config/data-paths.service';
import { logInfo, logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import {
  DatabaseConnectionLostError,
  type DatabaseBackupRefusal,
  type DatabaseBackupStrategy,
} from '../database/database-backup.interface';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { Injectable } from '@nestjs/common';

import fs from 'fs';
import path from 'path';

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** The name a Postgres database takes inside a backup archive: a pg_dump custom-format file. */
export const PG_ARCHIVE_ENTRY = 'travel.pgdump';

/**
 * Why the database in an unpacked archive cannot be restored into a Postgres
 * database, or null when it can: it must be a dump, carry TREK's migration
 * history, and none this build does not know. Both restore paths ask it, the
 * admin panel's and RESTORE_FROM_BACKUP's.
 */
export async function checkPostgresDump(extractDir: string, binDir: string | undefined): Promise<string | null> {
  const dump = path.join(extractDir, PG_ARCHIVE_ENTRY);
  if (!fs.existsSync(dump)) {
    return fs.existsSync(path.join(extractDir, 'travel.db'))
      ? 'This backup holds a SQLite database, which cannot be restored into a Postgres database.'
      : `Invalid backup: ${PG_ARCHIVE_ENTRY} not found`;
  }
  let executed: string[];
  try {
    executed = await pgDumpMigrations(dump, binDir);
  } catch (err) {
    logWarn(`Restore: the archive's database could not be read (${describeError(err)})`);
    return 'Uploaded file is not a valid Postgres dump';
  }
  if (executed.length === 0) {
    return 'The uploaded dump holds no TREK migration history. This does not appear to be a TREK backup.';
  }
  if (unknownMigrations(executed).length > 0) {
    return 'This backup was made by a newer TREK version. Update TREK before restoring it.';
  }
  return null;
}

/**
 * The backup port on a Postgres database: `pg_dump` and `pg_restore`
 * (`db/engine/postgres/pg-tools.ts`), run by their absolute paths with the
 * password in their environment.
 *
 * A snapshot is a custom-format dump, consistent on its own (pg_dump reads one
 * snapshot of the database). A restore checks the dump first (it must be one,
 * carry TREK's migration history, and none this build does not know), keeps a
 * dump of the database it replaces, then clears the schema and loads the dump
 * in one transaction (`pgRestore`), so a restore that fails leaves the database
 * as it was and one that succeeds holds nothing a later migration added, and
 * reopens through `DatabaseLifecycle`, which migrates the restored database
 * forward. A backup of a SQLite install cannot be restored here.
 */
@Injectable()
export class PostgresDatabaseBackup implements DatabaseBackupStrategy {
  readonly archiveEntry = PG_ARCHIVE_ENTRY;

  constructor(
    private readonly lifecycle: DatabaseLifecycle,
    private readonly paths: DataPathsService,
  ) {}

  /** The URL and the tools' directory, read when used: on SQLite this provider is built but never called. */
  private get settings(): { url: string; binDir: string | undefined } {
    const { url, pgBinDir } = readEnv().db;
    if (!url) throw new Error('The Postgres backup was used without TREK_DB_URL.');
    return { url, binDir: pgBinDir };
  }

  location(): string {
    return resolveEngine().describe();
  }

  /** A Postgres database is always there to copy; a missing pg_dump fails the snapshot, loudly. */
  canSnapshot(): boolean {
    return true;
  }

  async checkpoint(): Promise<void> {
    // Postgres keeps nothing beside its store that a copy would need flushed.
  }

  /** pg_dump writes beside `target` and renames into place: a failed dump leaves nothing there. */
  async snapshot(target: string): Promise<void> {
    const { url, binDir } = this.settings;
    await pgDump(url, target, binDir);
  }

  /** Refuses (a DomainError, 400) an archive this database cannot take, before anything is replaced. */
  async verify(extractDir: string): Promise<DatabaseBackupRefusal | null> {
    const refusal = await checkPostgresDump(extractDir, this.settings.binDir);
    if (refusal) throw new DomainError(400, refusal);
    return null;
  }

  /** A dump of the database a restore is about to replace, in the data directory. */
  async keepCopyBeforeRestore(): Promise<string | null> {
    const target = path.join(this.paths.dataDir, `pre-restore-${Date.now()}.pgdump`);
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
    let swapError: unknown = null;
    try {
      const { url, binDir } = this.settings;
      await pgRestore(url, source, binDir);
    } catch (err) {
      swapError = err ?? new Error('pg_restore failed');
    }

    // As on SQLite: the reopen always runs, so the ORM never keeps a stale pool,
    // and both errors go up together when the restore failed as well.
    let reopenError: unknown = null;
    try {
      await this.lifecycle.reopen();
    } catch (err) {
      reopenError = err;
    }
    if (swapError) {
      if (reopenError) throw new DatabaseConnectionLostError(swapError, reopenError);
      throw swapError;
    }
    return { reopenError };
  }
}
