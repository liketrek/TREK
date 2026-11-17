import { TableNotFoundException } from '@mikro-orm/core';

/**
 * What a database error says, read the same way on both engines. The engines
 * report the same failure differently: SQLite (better-sqlite3) in the message
 * text, Postgres (`pg`) in a SQLSTATE `code` and, for a constraint, the
 * constraint's name. MikroORM's exception classes carry both: they copy every
 * property of the driver's error. Code outside the dialect layer asks these
 * functions instead of matching either engine's text.
 */

/** Postgres's SQLSTATE for a unique violation. */
const PG_UNIQUE_VIOLATION = '23505';
/** Postgres's SQLSTATE for an unknown table. */
const PG_UNDEFINED_TABLE = '42P01';
/** SQLite's unique violation: `UNIQUE constraint failed: users.email` or `... index 'idx_users_email_lower'`. */
const SQLITE_UNIQUE = /UNIQUE constraint failed: ([^\n]+)/;

/** The error's own properties a driver sets, read without trusting their types. */
function driverFields(err: unknown): { message: string; code: unknown; constraint: unknown } | null {
  if (!(err instanceof Error)) return null;
  const fields = err as Error & { code?: unknown; constraint?: unknown };
  return { message: err.message, code: fields.code, constraint: fields.constraint };
}

/**
 * The key a unique violation names, or null when `err` is not one. On
 * Postgres it is the constraint or index name (`users_email_unique`,
 * `idx_users_email_lower`); on SQLite the columns (`users.email`) or the
 * index (`index 'idx_users_email_lower'`). A caller matches the names of
 * both engines, which the baselines fix.
 */
export function uniqueViolationKey(err: unknown): string | null {
  const fields = driverFields(err);
  if (!fields) return null;
  if (fields.code === PG_UNIQUE_VIOLATION) return typeof fields.constraint === 'string' ? fields.constraint : '';
  return SQLITE_UNIQUE.exec(fields.message)?.[1].trim() ?? null;
}

/**
 * Whether a statement failed because its table does not exist: MikroORM's
 * `TableNotFoundException` (both engines), or the driver's own error where it
 * reached the caller unconverted (SQLite's message, Postgres's 42P01).
 */
export function isMissingTableError(err: unknown): boolean {
  if (err instanceof TableNotFoundException) return true;
  const fields = driverFields(err);
  return fields !== null && (fields.code === PG_UNDEFINED_TABLE || fields.message.includes('no such table'));
}
