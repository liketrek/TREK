/**
 * Unit tests for the backfill migration that normalises leading/trailing
 * whitespace in stored usernames and emails.
 * Tests TRIM-MIG-001 through TRIM-MIG-010.
 *
 * Ported off the legacy runner (Task 0/Task 5c triage: its production
 * equivalent is a frozen numbered migration) onto the real
 * `Migration20200101020800_trim_leading_trailing_whitespace_from_stored_usernames`
 * (the legacy `trimUserWhitespace` export in `db/migrations.ts` was never
 * called by any numbered migration — this one reimplements the same logic
 * inline, deliberately, since the legacy file is not importable from there):
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one migration, assert.
 */
import { describe, it, expect, vi } from 'vitest';
import type { MikroORM } from '@mikro-orm/sqlite';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';

const TARGET = 'Migration20200101020800_trim_leading_trailing_whitespace_from_stored_usernames';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

async function insert(orm: MikroORM, username: string, email: string): Promise<number> {
  await rawExec(orm, "INSERT INTO users (username, email, password_hash) VALUES (?, ?, 'x')", [username, email]);
  const rows = await rawQuery<{ id: number }>(orm, 'SELECT last_insert_rowid() as id');
  return rows[0].id;
}

async function row(orm: MikroORM, id: number): Promise<{ username: string; email: string }> {
  const rows = await rawQuery<{ username: string; email: string }>(orm, 'SELECT username, email FROM users WHERE id = ?', [id]);
  return rows[0];
}

describe('trimUserWhitespace — clean data (no-op)', () => {
  it('TRIM-MIG-001 — leaves already-clean rows untouched', async () => {
    const orm = await ormBeforeTarget();
    try {
      const id = await insert(orm, 'alice', 'alice@example.com');
      await migrateTo(orm, TARGET);
      expect(await row(orm, id)).toEqual({ username: 'alice', email: 'alice@example.com' });
    } finally {
      await orm.close(true);
    }
  }, 30000);
});

describe('trimUserWhitespace — non-colliding dirty rows', () => {
  it('TRIM-MIG-002 — trims trailing whitespace from username', async () => {
    const orm = await ormBeforeTarget();
    try {
      const id = await insert(orm, 'alice   ', 'alice@example.com');
      await migrateTo(orm, TARGET);
      expect((await row(orm, id)).username).toBe('alice');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-003 — trims leading whitespace from username', async () => {
    const orm = await ormBeforeTarget();
    try {
      const id = await insert(orm, '   alice', 'alice@example.com');
      await migrateTo(orm, TARGET);
      expect((await row(orm, id)).username).toBe('alice');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-004 — trims surrounding whitespace from email', async () => {
    const orm = await ormBeforeTarget();
    try {
      const id = await insert(orm, 'alice', '  alice@example.com  ');
      await migrateTo(orm, TARGET);
      expect((await row(orm, id)).email).toBe('alice@example.com');
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-005 — emits a console.warn for each trimmed row', async () => {
    const orm = await ormBeforeTarget();
    try {
      await insert(orm, 'bob   ', 'bob@example.com');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await migrateTo(orm, TARGET);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[migration] Trimmed username'));
      warn.mockRestore();
    } finally {
      await orm.close(true);
    }
  }, 30000);
});

describe('trimUserWhitespace — username collision handling', () => {
  it('TRIM-MIG-006 — renames the dirty row to <trimmed>__migrated_<id> on collision', async () => {
    const orm = await ormBeforeTarget();
    try {
      await insert(orm, 'carol', 'carol@example.com');
      const dirtyId = await insert(orm, 'carol   ', 'carol2@example.com');
      await migrateTo(orm, TARGET);
      expect((await row(orm, dirtyId)).username).toBe(`carol__migrated_${dirtyId}`);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-007 — emits a WHITESPACE COLLISION warning for username collision', async () => {
    const orm = await ormBeforeTarget();
    try {
      await insert(orm, 'dan', 'dan@example.com');
      await insert(orm, 'dan   ', 'dan2@example.com');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await migrateTo(orm, TARGET);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('WHITESPACE COLLISION username'));
      warn.mockRestore();
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-008 — the renamed value does not conflict with the existing clean row', async () => {
    const orm = await ormBeforeTarget();
    try {
      const cleanId = await insert(orm, 'eve', 'eve@example.com');
      const dirtyId = await insert(orm, 'eve   ', 'eve2@example.com');
      await migrateTo(orm, TARGET);
      expect((await row(orm, cleanId)).username).toBe('eve');
      expect((await row(orm, dirtyId)).username).toBe(`eve__migrated_${dirtyId}`);
    } finally {
      await orm.close(true);
    }
  }, 30000);
});

describe('trimUserWhitespace — email collision handling', () => {
  it('TRIM-MIG-009 — renames dirty email as <local>__migrated_<id>@<domain> on collision', async () => {
    const orm = await ormBeforeTarget();
    try {
      await insert(orm, 'frank', 'frank@example.com');
      const dirtyId = await insert(orm, 'frank2', '  frank@example.com  ');
      await migrateTo(orm, TARGET);
      expect((await row(orm, dirtyId)).email).toBe(`frank__migrated_${dirtyId}@example.com`);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('TRIM-MIG-010 — emits a WHITESPACE COLLISION warning for email collision', async () => {
    const orm = await ormBeforeTarget();
    try {
      await insert(orm, 'grace', 'grace@example.com');
      await insert(orm, 'grace2', 'grace@example.com   ');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await migrateTo(orm, TARGET);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('WHITESPACE COLLISION email'));
      warn.mockRestore();
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
