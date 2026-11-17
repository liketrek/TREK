/**
 * The engine-neutral reading of database errors (src/db/dialect/driver-errors.ts):
 * a unique violation and a missing table, as better-sqlite3 and `pg` report
 * them, raw and wrapped in MikroORM's exception classes (which copy every
 * property of the driver's error). The Postgres errors are built with the
 * fields `pg` sets; the Postgres lane meets the real ones.
 */
import { isMissingTableError, uniqueViolationKey } from '../../../../src/db/dialect/driver-errors';
import { TableNotFoundException, UniqueConstraintViolationException } from '@mikro-orm/core';

import { describe, expect, it } from 'vitest';

/** An error with the fields `pg` puts on a failed statement. */
function pgError(message: string, fields: { code: string; constraint?: string }): Error {
  return Object.assign(new Error(message), fields);
}

describe('driver errors', () => {
  it('DRVERR-001: a SQLite unique violation names its columns or its index', () => {
    expect(uniqueViolationKey(new Error('UNIQUE constraint failed: users.email'))).toBe('users.email');
    expect(uniqueViolationKey(new Error("UNIQUE constraint failed: index 'idx_users_email_lower'"))).toBe(
      "index 'idx_users_email_lower'",
    );
    const wrapped = new UniqueConstraintViolationException(new Error('UNIQUE constraint failed: users.username'));
    expect(uniqueViolationKey(wrapped)).toBe('users.username');
  });

  it('DRVERR-002: a Postgres unique violation is read by its SQLSTATE and named by its constraint', () => {
    const raw = pgError('duplicate key value violates unique constraint "users_username_unique"', {
      code: '23505',
      constraint: 'users_username_unique',
    });
    expect(uniqueViolationKey(raw)).toBe('users_username_unique');
    expect(uniqueViolationKey(new UniqueConstraintViolationException(raw))).toBe('users_username_unique');
    expect(uniqueViolationKey(pgError('duplicate key', { code: '23505' }))).toBe('');
  });

  it('DRVERR-003: anything else is not a unique violation', () => {
    expect(uniqueViolationKey(new Error('FOREIGN KEY constraint failed'))).toBeNull();
    expect(uniqueViolationKey(pgError('null value in column', { code: '23502', constraint: 'x' }))).toBeNull();
    expect(uniqueViolationKey('UNIQUE constraint failed: users.email')).toBeNull();
    expect(uniqueViolationKey(null)).toBeNull();
  });

  it('DRVERR-004: a missing table is recognised on both engines, converted or not', () => {
    expect(isMissingTableError(new TableNotFoundException(new Error('no such table: x')))).toBe(true);
    expect(isMissingTableError(new Error('no such table: plugin_user_config'))).toBe(true);
    expect(isMissingTableError(pgError('relation "x" does not exist', { code: '42P01' }))).toBe(true);
    expect(isMissingTableError(pgError('syntax error', { code: '42601' }))).toBe(false);
    expect(isMissingTableError(new Error('database is locked'))).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
  });
});
