/**
 * Which of Postgres's own functions a plugin's SQL may call
 * (src/db/engine/postgres/plugin-sql-functions.ts), as the guard applies it
 * without a database: the catalog's functions outside the allowlist are
 * refused in every spelling of a call, the allowed ones and a plugin's own
 * names pass. PGPLUG-021 in the Postgres lane holds the catalog list to the
 * real `pg_proc` and runs the same payloads against a database.
 */
import {
  catalogFunctionNames,
  CATALOG_FUNCTIONS_FILE,
  PLUGIN_FUNCTIONS,
} from '../../../../../src/db/engine/postgres/plugin-sql-functions';
import { parsePluginSql } from '../../../../../src/db/engine/postgres/plugin-sql-guard';

import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('functions a plugin may call on Postgres', () => {
  it('lists the catalog functions one per line, sorted and without duplicates', () => {
    const lines = fs.readFileSync(CATALOG_FUNCTIONS_FILE, 'utf8').trimEnd().split(/\r?\n/);
    expect(lines.length).toBeGreaterThan(2000);
    expect(lines).toEqual([...new Set(lines)].sort());
    expect(lines.every((line) => /^[A-Za-z0-9_]+$/.test(line))).toBe(true);
  });

  it('allows only functions the catalog has, so a typo cannot stand in for one', () => {
    const missing = [...PLUGIN_FUNCTIONS].filter((name) => !catalogFunctionNames().has(name));
    expect(missing).toEqual([]);
  });

  it.each([
    // The catalog lookups by OID the review found, and their siblings.
    'select obj_description(16386)',
    "select obj_description(16386, 'pg_class')",
    'select col_description(16386, 2)',
    "select shobj_description(16384, 'pg_authid')",
    'select format_type(16388, null)',
    // Server and session information.
    'select version()',
    'select current_database()',
    'select inet_server_addr(), inet_server_port()',
    'select inet_client_addr()',
    'select current_query()',
    'select current_schemas(true)',
    'select txid_current()',
    'select getdatabaseencoding()',
    "select has_largeobject_privilege(1, 'select')",
    'select acldefault(1, 10)',
    'select setseed(0.5)',
    // Every spelling of the call.
    'SELECT OBJ_DESCRIPTION(16386)',
    'select "obj_description"(16386)',
    'select obj_description /* x */ (16386)',
    'select (16386::oid).obj_description',
    'select (16386::oid)."obj_description"',
    'select (array[16386::oid])[1].obj_description',
    'select n.x from notes n where n.body = (select version())',
    'create table t (v text default version())',
    'insert into notes (body) values (current_database())',
    // The keywords that call one without parentheses.
    'select current_user',
    'select session_user',
    'select current_role',
    'select user',
    'select system_user',
    'select current_catalog',
    'select current_schema',
    'select CURRENT_USER',
  ])('refuses %s', (sql) => {
    expect(() => parsePluginSql(sql)).toThrow(/a plugin may not (call|read)/);
  });

  it.each([
    "select lower(body), substring(body from 2 for 3), regexp_replace(body, 'a', 'b') from notes",
    "select now(), date_trunc('day', now()), extract(epoch from now()), to_char(now(), 'YYYY')",
    "select jsonb_build_object('a', 1), jsonb_set('{}'::jsonb, '{a}', '1'), json_agg(body) from notes",
    'select count(*), sum(n), string_agg(body, $1), row_number() over (order by id) from notes',
    'select gen_random_uuid(), md5(body), sha256(body::bytea) from notes',
    'select x from generate_series(1, 5) as g(x)',
    'select unnest(array[1, 2]), cardinality(array[1])',
    "select to_tsvector('english', body) @@ plainto_tsquery('english', $1) from notes",
    'select coalesce(a, b), nullif(a, 0), greatest(a, b), least(a, b) from notes',
    "select cast(n as numeric(10, 2)), body::varchar(20), 'now'::timestamp(3) from notes",
    'select current_date, current_timestamp, localtimestamp',
    "select a from notes where body like ('%' || $1)",
    'select * from notes tablesample system (10)',
    // A plugin's own names, even where they share a refused function's name.
    'CREATE TABLE version (id bigserial PRIMARY KEY, format_type text)',
    'CREATE TABLE IF NOT EXISTS version (id bigint)',
    'INSERT INTO version (id) VALUES (1)',
    'INSERT INTO trek_plugin_notes.version (id) VALUES (1)',
    'CREATE TABLE notes (id bigint, v bigint REFERENCES version (id))',
    'CREATE VIEW version (a) AS SELECT 1',
    'select n.version, n.user_id, "user", "current_user" from notes n',
    'select version from notes',
    'select mine(1, 2)',
    "select '[1,2)'::span",
  ])('allows %s', (sql) => {
    expect(() => parsePluginSql(sql)).not.toThrow();
  });
});
