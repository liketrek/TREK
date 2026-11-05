import { isPostgres, isSqlite, unsupported } from './platform';
import type { Platform } from '@mikro-orm/core';

/**
 * The schema catalog, for the migrations' helpers (`db/migration-utils.ts`):
 * which tables and columns exist, each spelled the way its engine keeps them.
 * Both statements take the table name as their one bound parameter and answer
 * one row per hit with the name in `name`. Postgres reads the current schema
 * only, the one TREK's own tables live in.
 */

/** Lists the columns of the table bound as `?`, one `name` per row; none for a missing table. */
export function columnNamesSql(platform: Platform): string {
  if (isSqlite(platform)) return 'select name from pragma_table_info(?)';
  if (isPostgres(platform)) {
    return 'select column_name as name from information_schema.columns where table_schema = current_schema() and table_name = ?';
  }
  return unsupported(platform);
}

/** One row when the table bound as `?` exists, none otherwise. */
export function tableExistsSql(platform: Platform): string {
  if (isSqlite(platform)) return "select name from sqlite_master where type = 'table' and name = ?";
  if (isPostgres(platform)) {
    return 'select table_name as name from information_schema.tables where table_schema = current_schema() and table_name = ?';
  }
  return unsupported(platform);
}

/**
 * The tables in the current schema, one `table_name` per row in name order:
 * the schema TREK's own tables live in. Postgres only, and the one definition
 * of that question: the bootstrap reads it through the connection, the client
 * tools' table listing hands it to psql.
 */
export const CURRENT_SCHEMA_TABLES_SQL =
  'select table_name from information_schema.tables where table_schema = current_schema() order by table_name';
