/**
 * PostgresDatabaseBackup: the backup port on a Postgres database, over
 * stand-in pg_dump, pg_restore and psql scripts (TREK_DB_PG_BIN_DIR) and a
 * stand-in DatabaseLifecycle. The tools' own arguments are pinned in
 * tests/unit/db/engine/postgres/pg-tools.test.ts.
 */
import { knownMigrationNames } from '../../../src/db/known-migrations';
import type { DataPathsService } from '../../../src/nest/app-config/data-paths.service';
import { PostgresDatabaseBackup } from '../../../src/nest/backup/postgres-database-backup';
import { DomainError } from '../../../src/nest/common/domain-error';
import { DatabaseConnectionLostError } from '../../../src/nest/database/database-backup.interface';
import type { DatabaseLifecycle } from '../../../src/nest/database/database-lifecycle.service';

import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const KNOWN = [...knownMigrationNames()].sort();
let root: string;
let bin: string;
let extract: string;
let reopen: ReturnType<typeof vi.fn>;
let backup: PostgresDatabaseBackup;

/** A stand-in tool: `body` is the shell it runs. */
function tool(name: 'pg_dump' | 'pg_restore' | 'psql', body: string): void {
  const version = `[ "$1" = --version ] && { echo '${name} (PostgreSQL) 17.11'; exit 0; }`;
  writeFileSync(path.join(bin, name), `#!/bin/sh\n${version}\n${body}\n`);
  chmodSync(path.join(bin, name), 0o755);
}
const WRITES_ITS_FILE = 'for a in "$@"; do case "$a" in --file=*) printf dump > "${a#--file=}";; esac; done';
/** A psql that answers the current-schema query a dump and a restore start with, and otherwise succeeds. */
const ANSWERS_SCHEMA = 'case "$*" in *quote_ident*) printf \'public\\tpublic\\n\';; esac';
const FAILS = 'echo "connection refused" >&2; exit 1';
/** A pg_restore whose --data-only listing shows `names` as the dump's migrations. */
const LISTS = (names: string[]) =>
  [
    'case "$*" in *--data-only*)',
    "  printf 'COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;\\n'",
    ...names.map((name, i) => `  printf '${i + 1}\\t${name}\\tx\\n'`),
    "  printf '\\\\.\\n';;",
    'esac',
  ].join('\n');

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'trek-pg-backup-'));
  bin = path.join(root, 'bin');
  extract = path.join(root, 'extract');
  mkdirSync(bin);
  mkdirSync(extract);
  tool('psql', ANSWERS_SCHEMA);
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
    tool('pg_dump', WRITES_ITS_FILE);
    await backup.snapshot(path.join(root, 'a.pgdump'));
    expect(existsSync(path.join(root, 'a.pgdump'))).toBe(true);
    tool('pg_dump', `printf partial > "$(echo "$4" | sed 's/--file=//')"; ${FAILS}`);
    await expect(backup.snapshot(path.join(root, 'b.pgdump'))).rejects.toThrow('pg_dump failed: connection refused');
    expect(existsSync(path.join(root, 'b.pgdump'))).toBe(false);
    expect(existsSync(path.join(root, 'b.pgdump.partial'))).toBe(false);
  });

  it('PGBACKUP-002: verify takes a TREK dump this build knows, and refuses a missing, SQLite, foreign or newer one', async () => {
    expect(await refusal(backup.verify(extract))).toEqual({
      status: 400,
      message: 'Invalid backup: travel.pgdump not found',
    });
    writeFileSync(path.join(extract, 'travel.db'), 'sqlite');
    expect((await refusal(backup.verify(extract))).message).toMatch(/holds a SQLite database/);
    writeFileSync(path.join(extract, 'travel.pgdump'), 'dump');
    tool('pg_restore', LISTS(KNOWN.slice(0, 3)));
    await expect(backup.verify(extract)).resolves.toBeNull();
    tool('pg_restore', LISTS([...KNOWN, 'Migration29990101000000_from_the_future']));
    expect((await refusal(backup.verify(extract))).message).toMatch(/made by a newer TREK version/);
    tool('pg_restore', LISTS([]));
    expect((await refusal(backup.verify(extract))).message).toMatch(/holds no TREK migration history/);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    tool('pg_restore', FAILS);
    expect((await refusal(backup.verify(extract))).message).toBe('Uploaded file is not a valid Postgres dump');
  });

  it('PGBACKUP-003: keeps a dump of the database a restore replaces, or says it could not', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    tool('pg_dump', WRITES_ITS_FILE);
    const kept = await backup.keepCopyBeforeRestore();
    expect(kept).toMatch(/pre-restore-\d+\.pgdump$/);
    expect(existsSync(kept as string)).toBe(true);
    tool('pg_dump', FAILS);
    await expect(backup.keepCopyBeforeRestore()).resolves.toBeNull();
  });

  it('PGBACKUP-004: replace restores, then reopens; a reopen failure is reported, not thrown', async () => {
    tool(
      'pg_restore',
      "printf '%s\\n' '\\restrict k1' 'CREATE TABLE public.mikro_orm_migrations (' > \"${4#--file=}\"",
    );
    await expect(backup.replace(path.join(extract, 'travel.pgdump'))).resolves.toEqual({ reopenError: null });
    expect(reopen).toHaveBeenCalledTimes(1);
    const lost = new Error('reconnect failed');
    reopen.mockRejectedValueOnce(lost);
    await expect(backup.replace(path.join(extract, 'travel.pgdump'))).resolves.toEqual({ reopenError: lost });
  });

  it('PGBACKUP-005: a failed restore still reopens, and both failures surface when the reopen fails too', async () => {
    tool('pg_restore', FAILS);
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
