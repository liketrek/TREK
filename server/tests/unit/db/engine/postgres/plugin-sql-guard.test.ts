/**
 * The guard that keeps a plugin's own SQL inside its schema on Postgres
 * (src/db/engine/postgres/plugin-sql-guard.ts), without a database: what it
 * lets through, what it refuses and why, how it reads quoting and comments
 * the way Postgres does, and what it tells the store about a statement. The
 * same rules against a real database are PGPLUG-003/004 in the Postgres lane.
 */
import {
  checkPlaceholders,
  checkQualifiers,
  parsePluginSql,
  PluginSqlRefused,
  tokenize,
} from '../../../../../src/db/engine/postgres/plugin-sql-guard';

import { describe, expect, it } from 'vitest';

const OWN = 'trek_plugin_notes';
const SCHEMAS = new Set(['public', 'auth', 'pg_catalog', 'information_schema', OWN, 'trek_plugin_other']);

/** Parses `sql` and checks its qualified names as the store does. */
function check(sql: string): void {
  for (const statement of parsePluginSql(sql)) checkQualifiers(statement, OWN, SCHEMAS);
}

describe('plugin SQL guard', () => {
  it.each([
    'SELECT * FROM notes WHERE id = $1',
    'select n.body, t.name from notes n join tags t on t.note_id = n.id',
    'INSERT INTO notes (body) VALUES ($1) RETURNING id',
    "UPDATE notes SET body = 'it''s' WHERE id = 1",
    'DELETE FROM notes WHERE id IN (SELECT note_id FROM trash)',
    'WITH recent AS (SELECT * FROM notes ORDER BY id DESC LIMIT 5) SELECT count(*) FROM recent',
    'VALUES (1), (2)',
    'TABLE notes',
    '(SELECT 1) UNION (SELECT 2)',
    'CREATE TABLE notes (id bigserial PRIMARY KEY, body text, temp real, schema text)',
    'CREATE UNIQUE INDEX notes_body ON notes (body)',
    'CREATE UNLOGGED TABLE cache (k text)',
    'CREATE OR REPLACE VIEW v AS SELECT body FROM notes',
    'CREATE MATERIALIZED VIEW mv AS SELECT 1',
    'CREATE SEQUENCE s',
    "CREATE TYPE mood AS ENUM ('ok', 'sad')",
    'ALTER TABLE notes ADD COLUMN tag text',
    'DROP TABLE IF EXISTS notes CASCADE',
    'TRUNCATE notes',
    'REFRESH MATERIALIZED VIEW mv',
    'SELECT body FROM trek_plugin_notes.notes',
    'SELECT "notes"."body" FROM "notes"',
    "SELECT 'public.users -- not code' AS text",
    'SELECT 1 -- public.users\n',
    'SELECT /* public.users */ 1',
    'SELECT 1.5e3, .5, 0x1F',
    'INSERT INTO kv VALUES ($1, $2) ON CONFLICT (k) DO NOTHING',
  ])('lets through %s', (sql) => {
    expect(() => check(sql)).not.toThrow();
  });

  it.each([
    ['SELECT * FROM public.users', /another schema/],
    ['SELECT * FROM "public"."users"', /another schema/],
    ['SELECT * FROM PUBLIC . users', /another schema/],
    ['SELECT * FROM public/**/.users', /another schema/],
    ['SELECT * FROM auth.secret', /another schema/],
    ['SELECT * FROM trek_plugin_other.notes', /another schema/],
    ['SELECT * FROM trek_plugin_not_yet.notes', /another schema/],
    ['SELECT * FROM trek.public.users', /another schema/],
    ['SELECT * FROM pg_stats', /"pg_stats" may not be named/],
    ['SELECT * FROM "pg_catalog".pg_authid', /"pg_catalog" may not be named/],
    ['SELECT * FROM information_schema.tables', /"information_schema" may not be named/],
    ["SELECT query_to_xml('select 1', true, true, '')", /"query_to_xml" may not be named/],
    ["SELECT database_to_xml(true, true, '')", /"database_to_xml" may not be named/],
    ["SELECT ts_stat('select 1')", /"ts_stat" may not be named/],
    ["SELECT \"set_config\"('search_path', 'public', true)", /"set_config" may not be named/],
    ["SELECT current_setting('search_path')", /"current_setting" may not be named/],
    ["SELECT nextval('users_id_seq')", /"nextval" may not be named/],
    ["SELECT 'users'::regclass", /"regclass" may not be named/],
    ["SELECT to_regclass('users')", /"to_regclass" may not be named/],
    ['SELECT lo_get(1)', /"lo_get" may not be named/],
    ["SELECT dblink('x', 'y')", /"dblink" may not be named/],
    ['WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM r) SELECT * FROM r', /RECURSIVE/],
    ['SELECT 1 AS x INTO copy_of', /SELECT \.\.\. INTO/],
    ['CREATE TEMP TABLE t (x int)', /CREATE TEMP is not allowed/],
    ['CREATE TEMPORARY TABLE t (x int)', /CREATE TEMPORARY is not allowed/],
    ["CREATE FUNCTION f() RETURNS int LANGUAGE sql AS 'select 1'", /CREATE FUNCTION is not allowed/],
    ['CREATE OR REPLACE FUNCTION f() RETURNS int', /CREATE FUNCTION is not allowed/],
    ['CREATE SCHEMA mine', /CREATE SCHEMA is not allowed/],
    ['CREATE EXTENSION dblink', /CREATE EXTENSION is not allowed/],
    ['DROP SCHEMA trek_plugin_notes', /DROP SCHEMA is not allowed/],
    ['DROP OWNED BY current_user', /DROP OWNED is not allowed/],
    ['ALTER TABLE notes SET SCHEMA x', /may not change the schema/],
    ['ALTER TABLE notes OWNER TO someone', /may not change the owner/],
    ['ALTER ROLE trek SUPERUSER', /ALTER ROLE is not allowed/],
    ['CREATE TABLE t (x int) TABLESPACE pg_default', /tablespace/],
    ['SET search_path TO public', /may not start with SET/],
    ['RESET ROLE', /may not start with RESET/],
    ['COPY notes TO STDOUT', /may not start with COPY/],
    ['GRANT SELECT ON notes TO PUBLIC', /may not start with GRANT/],
    ['DO $$ BEGIN END $$', /dollar-quoted/],
    ['LISTEN x', /may not start with LISTEN/],
    ['PREPARE p AS SELECT 1', /may not start with PREPARE/],
    ['EXPLAIN ANALYZE SELECT 1', /may not start with EXPLAIN/],
    ['BEGIN', /transaction-control/],
    ['COMMIT', /transaction-control/],
    ['SAVEPOINT a', /transaction-control/],
    ["SELECT E'\\x'", /escape strings/],
    ["SELECT U&'\\0041'", /Unicode escapes/],
    ['SELECT * FROM U&"\\0070ublic".users', /Unicode escapes/],
    ['SELECT $tag$x$tag$', /dollar-quoted/],
    ['SELECT 1.public', /a number may not run straight into a name/],
    ["SELECT 'open", /a string is not closed/],
    ['SELECT "open', /a quoted name is not closed/],
    ['SELECT /* open', /a comment is not closed/],
    ['SELECT ""', /a quoted name may not be empty/],
    ['SELECT `x`', /unexpected character/],
    ['SELECT 1; SELECT * FROM public.users', /another schema/],
  ])('refuses %s', (sql, reason) => {
    expect(() => check(sql)).toThrow(PluginSqlRefused);
    expect(() => check(sql)).toThrow(reason);
  });

  it('reads nested block comments as Postgres does, so code after the inner close is still a comment', () => {
    expect(() => check('SELECT 1 /* outer /* inner */ public.users */')).not.toThrow();
    expect(() => check('SELECT 1 /* one */ FROM public.users')).toThrow(/another schema/);
  });

  it('compares a long name the way Postgres keeps it: cut to 63 bytes', () => {
    const own = `trek_plugin_${'a'.repeat(51)}`;
    expect(own).toHaveLength(63);
    const statement = parsePluginSql(`SELECT * FROM ${own}zzzz.notes`)[0];
    expect(() => checkQualifiers(statement, own, new Set([own]))).not.toThrow();
    const other = `public${'x'.repeat(70)}`;
    const cut = other.slice(0, 63);
    expect(() => checkQualifiers(parsePluginSql(`SELECT * FROM ${other}.t`)[0], own, new Set([cut]))).toThrow(
      /another schema/,
    );
  });

  it('splits a script at its semicolons, keeps each statement text and drops empty ones', () => {
    const statements = parsePluginSql("CREATE TABLE a (x text);;\n-- note\nINSERT INTO a VALUES ('a;b');");
    expect(statements.map((s) => s.text)).toEqual(['CREATE TABLE a (x text)', "INSERT INTO a VALUES ('a;b')"]);
    expect(parsePluginSql('-- nothing\n;')).toEqual([]);
  });

  it('says whether a statement returns rows, may write, qualifies a name and how many placeholders it has', () => {
    const [select] = parsePluginSql('SELECT * FROM notes WHERE id = $1 AND tag = $2');
    expect(select).toMatchObject({ returnsRows: true, mayWrite: false, qualifies: false, params: 2 });
    const [returning] = parsePluginSql('UPDATE notes SET body = $1 RETURNING id');
    expect(returning).toMatchObject({ returnsRows: true, mayWrite: true });
    const [insert] = parsePluginSql('INSERT INTO notes (body) VALUES ($1)');
    expect(insert).toMatchObject({ returnsRows: false, mayWrite: true });
    const [cte] = parsePluginSql('WITH gone AS (DELETE FROM notes RETURNING id) SELECT count(*) FROM gone');
    expect(cte).toMatchObject({ returnsRows: true, mayWrite: true });
    const [ddl] = parsePluginSql('CREATE TABLE t (x int)');
    expect(ddl).toMatchObject({ returnsRows: false, mayWrite: true });
    const [qualified] = parsePluginSql('SELECT n.body FROM notes n');
    expect(qualified.qualifies).toBe(true);
  });

  it('turns a SQLite ? placeholder into a message about $1 when args are bound', () => {
    const [sqliteStyle] = parsePluginSql('SELECT * FROM notes WHERE id = ?');
    expect(() => checkPlaceholders(sqliteStyle, [1])).toThrow(/\$1, \$2/);
    expect(() => checkPlaceholders(sqliteStyle, [])).not.toThrow();
    const [pgStyle] = parsePluginSql('SELECT * FROM notes WHERE id = $1');
    expect(() => checkPlaceholders(pgStyle, [1])).not.toThrow();
  });

  it('folds unquoted names to lower case and keeps quoted ones as written', () => {
    expect(tokenize('Select "MiXed", Plain')).toEqual([
      { kind: 'word', value: 'select', quoted: false, at: 0 },
      { kind: 'word', value: 'MiXed', quoted: true, at: 7 },
      { kind: 'punct', value: ',', at: 14 },
      { kind: 'word', value: 'plain', quoted: false, at: 16 },
    ]);
  });
});
