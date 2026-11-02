/**
 * PostgresDatabaseBackup: the backup port on a Postgres database before TREK
 * can dump one. Every path fails closed, before anything is written or swapped.
 */
import { resolveEngine } from '../../../src/db/engine';
import { POSTGRES_BACKUP_UNAVAILABLE, PostgresDatabaseBackup } from '../../../src/nest/backup/postgres-database-backup';
import { DomainError } from '../../../src/nest/common/domain-error';

import { describe, expect, it } from 'vitest';

describe('PostgresDatabaseBackup', () => {
  const backup = new PostgresDatabaseBackup();

  it('PGBACKUP-001: a backup attempt reports that it wrote nothing, rather than an archive without the database', async () => {
    expect(backup.canSnapshot()).toBe(true);
    await expect(backup.checkpoint()).resolves.toBeUndefined();
    await expect(backup.snapshot()).rejects.toThrow(POSTGRES_BACKUP_UNAVAILABLE);
  });

  it('PGBACKUP-002: a restore is refused at the verify step with a 400, and nothing is swapped', async () => {
    const refusal = (() => {
      try {
        return backup.verify();
      } catch (error) {
        return error;
      }
    })();
    expect(refusal).toBeInstanceOf(DomainError);
    expect((refusal as DomainError).getStatus()).toBe(400);
    expect((refusal as DomainError).publicMessage).toBe(POSTGRES_BACKUP_UNAVAILABLE);
    await expect(backup.keepCopyBeforeRestore()).resolves.toBeNull();
    await expect(backup.replace()).rejects.toThrow(POSTGRES_BACKUP_UNAVAILABLE);
  });

  it('PGBACKUP-003: names the database the way the engine describes it (no password) and points at pg_dump', () => {
    expect(backup.location()).toBe(resolveEngine().describe());
    expect(backup.archiveEntry).toBe('database.dump');
    expect(POSTGRES_BACKUP_UNAVAILABLE).toContain('pg_dump');
  });
});
