/**
 * PostgresDatabaseBackup: the backup port on a Postgres database, over
 * stand-in pg_dump, pg_restore and psql tools (TREK_DB_PG_BIN_DIR, built by
 * tests/helpers/fake-pg-tools.ts) and a stand-in DatabaseLifecycle. The tools'
 * own arguments are pinned in tests/unit/db/engine/postgres/pg-tools.test.ts.
 */
import { knownMigrationNames } from '../../../src/db/known-migrations';
import type { DataPathsService } from '../../../src/nest/app-config/data-paths.service';
import { PostgresDatabaseBackup } from '../../../src/nest/backup/postgres-database-backup';
import { DomainError } from '../../../src/nest/common/domain-error';
import { DatabaseConnectionLostError } from '../../../src/nest/database/database-backup.interface';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';
import {
  answersSchema,
  failsWith,
  installFakeTool,
  listsMigrations,
  writesFile,
  writesRestrictedScript,
} from '../../helpers/fake-pg-tools';

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KNOWN = [...knownMigrationNames()].sort();
let root: string;
let bin: string;
let extract: string;
let reopen: ReturnType<typeof vi.fn>;
let backup: PostgresDatabaseBackup;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'trek-pg-backup-'));
  bin = path.join(root, 'bin');
  extract = path.join(root, 'extract');
  mkdirSync(bin);
  mkdirSync(extract);
  installFakeTool(bin, 'psql', { snippets: [answersSchema()] });
  vi.stubEnv('TREK_DB_URL', 'postgresql://trek:pw@db/trek');
  vi.stubEnv('TREK_DB_PG_BIN_DIR', bin);
  reopen = vi.fn(async () => undefined);
  backup = new PostgresDatabaseBackup(
    { reopen } as unknown as DatabaseLifecycle,
    { dataDir: root } as unknown as DataPathsService,
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

async function refusal(promise: Promise<unknown>): Promise<{ status: number; message: string }> {
  const error = await promise.then(
    () => null,
    (err: unknown) => err,
  );
  expect(error).toBeInstanceOf(DomainError);
  return { status: (error as DomainError).getStatus(), message: (error as DomainError).publicMessage };
}

describe('PostgresDatabaseBackup', () => {
  it('PGBACKUP-001: a snapshot is a pg_dump; a failed one leaves nothing that could pass for a copy', async () => {
    expect(backup.archiveEntry).toBe('travel.pgdump');
    expect(backup.canSnapshot()).toBe(true);
    await expect(backup.checkpoint()).resolves.toBeUndefined();
    installFakeTool(bin, 'pg_dump', { snippets: [writesFile('dump')] });
    await backup.snapshot(path.join(root, 'a.pgdump'));
    expect(existsSync(path.join(root, 'a.pgdump'))).toBe(true);
    installFakeTool(bin, 'pg_dump', { snippets: [writesFile('partial'), failsWith('connection refused')] });
    await expect(backup.snapshot(path.join(root, 'b.pgdump'))).rejects.toThrow('pg_dump failed: connection refused');
    expect(existsSync(path.join(root, 'b.pgdump'))).toBe(false);
    expect(existsSync(path.join(root, 'b.pgdump.partial'))).toBe(false);
  });

  it('PGBACKUP-002: verify accepts a TREK dump this build knows', async () => {
    writeFileSync(path.join(extract, 'travel.pgdump'), 'dump');
    installFakeTool(bin, 'pg_restore', { snippets: [listsMigrations(KNOWN.slice(0, 3))] });
    await expect(backup.verify(extract)).resolves.toBeNull();
  });

  it('PGBACKUP-002a: verify refuses an archive without a TREK dump in it', async () => {
    expect(await refusal(backup.verify(extract))).toEqual({
      status: 400,
      message: 'Invalid backup: travel.pgdump not found',
    });
  });

  it.each([
    {
      id: 'PGBACKUP-002b',
      setup: () => writeFileSync(path.join(extract, 'travel.db'), 'sqlite'),
      message: /holds a SQLite database/,
    },
    {
      id: 'PGBACKUP-002c',
      setup: () => {
        writeFileSync(path.join(extract, 'travel.pgdump'), 'dump');
        installFakeTool(bin, 'pg_restore', {
          snippets: [listsMigrations([...KNOWN, 'Migration29990101000000_from_the_future'])],
        });
      },
      message: /made by a newer TREK version/,
    },
    {
      id: 'PGBACKUP-002d',
      setup: () => {
        writeFileSync(path.join(extract, 'travel.pgdump'), 'dump');
        installFakeTool(bin, 'pg_restore', { snippets: [listsMigrations([])] });
      },
      message: /holds no TREK migration history/,
    },
    {
      id: 'PGBACKUP-002e',
      setup: () => {
        writeFileSync(path.join(extract, 'travel.pgdump'), 'dump');
        installFakeTool(bin, 'pg_restore', { snippets: [failsWith('pg_restore: error: not a valid archive')] });
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      },
      message: 'Uploaded file is not a valid Postgres dump',
    },
  ])('$id: verify refuses a dump TREK cannot restore', async ({ setup, message }) => {
    setup();
    const refused = await refusal(backup.verify(extract));
    if (typeof message === 'string') expect(refused.message).toBe(message);
    else expect(refused.message).toMatch(message);
  });

  it('PGBACKUP-003: keeps a dump of the database a restore replaces, or says it could not', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    installFakeTool(bin, 'pg_dump', { snippets: [writesFile('dump')] });
    const kept = await backup.keepCopyBeforeRestore();
    expect(kept).toMatch(/pre-restore-\d+\.pgdump$/);
    expect(existsSync(kept as string)).toBe(true);
    installFakeTool(bin, 'pg_dump', { snippets: [failsWith('connection refused')] });
    await expect(backup.keepCopyBeforeRestore()).resolves.toBeNull();
  });

  it('PGBACKUP-004: replace restores, then reopens; a reopen failure is reported, not thrown', async () => {
    installFakeTool(bin, 'pg_restore', { snippets: [writesRestrictedScript()] });
    await expect(backup.replace(path.join(extract, 'travel.pgdump'))).resolves.toEqual({ reopenError: null });
    expect(reopen).toHaveBeenCalledTimes(1);
    const lost = new Error('reconnect failed');
    reopen.mockRejectedValueOnce(lost);
    await expect(backup.replace(path.join(extract, 'travel.pgdump'))).resolves.toEqual({ reopenError: lost });
  });

  it('PGBACKUP-005: a failed restore still reopens, and both failures surface when the reopen fails too', async () => {
    installFakeTool(bin, 'pg_restore', { snippets: [failsWith('connection refused')] });
    const source = path.join(extract, 'travel.pgdump');
    await expect(backup.replace(source)).rejects.toThrow('pg_restore failed: connection refused');
    expect(reopen).toHaveBeenCalledTimes(1);
    reopen.mockRejectedValueOnce(new Error('reconnect failed'));
    await expect(backup.replace(source)).rejects.toBeInstanceOf(DatabaseConnectionLostError);
  });

  it('PGBACKUP-006: names the database without its password, and refuses to run without TREK_DB_URL', async () => {
    expect(backup.location()).toBe('Postgres postgresql://trek:***@db/trek');
    vi.stubEnv('TREK_DB_URL', '');
    await expect(backup.snapshot(path.join(root, 'c.pgdump'))).rejects.toThrow(/without TREK_DB_URL/);
  });
});
