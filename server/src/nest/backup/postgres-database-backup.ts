import type { DbSettings } from '../../app-config';
import { postgresTarget, type DatabaseEngine } from '../../db/engine';
import { pgDump, pgDumpMigrations, pgRestore } from '../../db/engine/postgres/pg-tools';
import { unknownMigrations } from '../../db/known-migrations';
import { DataPathsService } from '../app-config/data-paths.service';
import { logWarn } from '../audit/audit-log.logger';
import { describeError } from '../common/describe-error';
import { DomainError } from '../common/domain-error';
import type { DatabaseBackupStrategy } from '../database/database-backup.interface';
import { DATABASE_ENGINE, DATABASE_SETTINGS } from '../database/database-engine.module';
import { DatabaseLifecycle } from '../database/database-lifecycle.service';
import { keepRestoreCopy, replaceThenReopen } from './database-swap';
import { Inject, Injectable } from '@nestjs/common';

import fs from 'fs';
import path from 'path';

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
  /** The URL and the tools' directory; null on SQLite, where this provider is built but never called. */
  private readonly target: ReturnType<typeof postgresTarget>;

  constructor(
    private readonly lifecycle: DatabaseLifecycle,
    private readonly paths: DataPathsService,
    @Inject(DATABASE_ENGINE) private readonly engine: DatabaseEngine,
    @Inject(DATABASE_SETTINGS) settings: DbSettings,
  ) {
    this.target = postgresTarget(settings);
  }

  private get connection(): { url: string; binDir: string | undefined } {
    if (!this.target) throw new Error('The Postgres backup was used without TREK_DB_URL.');
    return this.target;
  }

  location(): string {
    return this.engine.describe();
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
    const { url, binDir } = this.connection;
    await pgDump(url, target, binDir);
  }

  /** Throws a DomainError (400) with the refusal when the archive cannot be restored here, before anything is replaced. */
  async verify(extractDir: string): Promise<void> {
    const refusal = await checkPostgresDump(extractDir, this.connection.binDir);
    if (refusal) throw new DomainError(400, refusal);
  }

  /** A dump of the database a restore is about to replace, in the data directory. */
  keepCopyBeforeRestore(): Promise<string | null> {
    const target = path.join(this.paths.dataDir, `pre-restore-${Date.now()}.pgdump`);
    return keepRestoreCopy(target, (copy) => this.snapshot(copy));
  }

  replace(source: string): Promise<{ reopenError: unknown }> {
    return replaceThenReopen(
      async () => {
        const { url, binDir } = this.connection;
        // A rejection with no reason still has to fail the swap, so it is never swallowed.
        await pgRestore(url, source, binDir).catch((err: unknown) => {
          throw err ?? new Error('pg_restore failed');
        });
      },
      () => this.lifecycle.reopen(),
    );
  }
}
