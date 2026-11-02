import { resolveEngine } from '../../db/engine';
import { DomainError } from '../common/domain-error';
import type { DatabaseBackupStrategy } from '../database/database-backup.interface';
import { Injectable } from '@nestjs/common';

/** Why a backup or a restore of a Postgres database is refused in this release. */
export const POSTGRES_BACKUP_UNAVAILABLE =
  'Backups of a Postgres database are not available in this release: back it up with pg_dump.';

/**
 * The backup port on a Postgres database, before TREK can dump and load one.
 * Fails closed: a backup reports that it wrote nothing (rather than writing an
 * archive with the uploads and no database), a restore is refused before
 * anything is replaced, and the demo reset never gets a baseline to swap in.
 */
@Injectable()
export class PostgresDatabaseBackup implements DatabaseBackupStrategy {
  readonly archiveEntry = 'database.dump';

  location(): string {
    return resolveEngine().describe();
  }

  canSnapshot(): boolean {
    return true;
  }

  async checkpoint(): Promise<void> {
    // Postgres keeps nothing beside its store that a copy would need flushed.
  }

  snapshot(): Promise<void> {
    return Promise.reject(new Error(POSTGRES_BACKUP_UNAVAILABLE));
  }

  /** Refuses before anything is replaced; the restore removes what it unpacked and answers 400. */
  verify(): never {
    throw new DomainError(400, POSTGRES_BACKUP_UNAVAILABLE);
  }

  async keepCopyBeforeRestore(): Promise<string | null> {
    return null;
  }

  replace(): Promise<{ reopenError: unknown }> {
    return Promise.reject(new Error(POSTGRES_BACKUP_UNAVAILABLE));
  }
}
