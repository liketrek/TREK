import type { Platform } from '@mikro-orm/core';
import { BasePostgreSqlPlatform, SqlitePlatform } from '@mikro-orm/sql';

/**
 * Which engine a dialect helper is spelling for.
 *
 * Every helper in `sql-functions.ts` and `kysely-functions.ts` dispatches
 * on the live MikroORM platform (`em.getPlatform()`): SQLite is the engine
 * TREK runs on, Postgres is the second one the helpers are written for and
 * the CI Postgres probe (`scripts/pg-probe.ts`) runs them against. Anything
 * else fails closed through {@link unsupported} rather than guessing.
 *
 * `BasePostgreSqlPlatform` is the class every MikroORM Postgres platform
 * extends (the `@mikro-orm/postgresql` driver's own `PostgreSqlPlatform`
 * among them), so the check does not need the driver package at runtime.
 */
export function isSqlite(platform: Platform): boolean {
  return platform instanceof SqlitePlatform;
}

export function isPostgres(platform: Platform): boolean {
  return platform instanceof BasePostgreSqlPlatform;
}

/** True when one spelling serves every engine the dialect layer knows. */
export function isKnownPlatform(platform: Platform): boolean {
  return isSqlite(platform) || isPostgres(platform);
}

export function unsupported(platform: Platform): never {
  throw new Error(`sql-functions: no implementation for platform ${platform.constructor.name}`);
}

// Postgres spellings shared by both helper files. The storage model stays the
// one SQLite has (server/CLAUDE.md, "Storage model"): a timestamp is the TEXT
// `YYYY-MM-DD HH:MM:SS` in UTC and a date is `YYYY-MM-DD`, so every Postgres
// branch that reads the clock renders that same text instead of handing back
// a `timestamptz`, and a text column compares against it exactly as on SQLite.

/** The database clock as UTC wall time, what SQLite's `CURRENT_TIMESTAMP` reads. */
export const PG_UTC_NOW = "(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')";

/** `to_char` pattern for SQLite's timestamp text. */
export const PG_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS';

/** `to_char` pattern for SQLite's date text. */
export const PG_DATE_FORMAT = 'YYYY-MM-DD';

/** A timestamp expression rendered as SQLite's timestamp text. */
export function pgTimestampText(expression: string): string {
  return `to_char(${expression}, '${PG_TIMESTAMP_FORMAT}')`;
}

/** A timestamp expression rendered as SQLite's date text. */
export function pgDateText(expression: string): string {
  return `to_char(${expression}, '${PG_DATE_FORMAT}')`;
}

/**
 * The POSIX regular expression for "starts with an ISO calendar date", the
 * same digit classes SQLite's `GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'`
 * spells, anchored at the start because GLOB always matches the whole value.
 */
export const PG_ISO_DATE_PREFIX = '^[0-9]{4}-[0-9]{2}-[0-9]{2}';
