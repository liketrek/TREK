/**
 * The guard that keeps a plugin's own SQL inside its schema on Postgres
 * (src/db/engine/postgres/plugin-sql-guard.ts), without a database: what it
 * lets through, what it refuses and why, how it reads quoting and comments
 * the way Postgres does, and what it tells the store about a statement. The
 * same rules against a real database are PGPLUG-003/004 in the Postgres lane.
 */
import { PLUGIN_SQL_NUL_REFUSAL } from '../../../../../src/db/engine/plugin-data-contract';
import {
  checkPlaceholders,
  checkQualifiers,
  parsePluginSql,
  PluginSqlRefused,
  tokenize,
  type PluginTarget,
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
    'CREATE TABLE notes (id bigserial PRIMARY KEY, body text, "temp" real, schema text)',
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
    'SELECT 1.5e3, .5, 1e-3, 10',
    'INSERT INTO kv VALUES ($1, $2) ON CONFLICT (k) DO NOTHING',
    // A line comment ends at CR as well as LF, as in Postgres; what follows is read as SQL.
    'SELECT 1 -- public.users\r',
    'SELECT 1 -- public.users\r\nFROM notes',
    'SELECT\t1\f',
    // A value of the plugin's own may carry a system column's name where it is given.
    'SELECT min(lat) AS ymin, min(lng) AS xmin, max(lng) AS xmax FROM places',
    'SELECT min(lng) AS "xmin" FROM places',
    'WITH b(xmin, ymin) AS (SELECT 1, 2) SELECT * FROM b',
    'WITH a AS (SELECT 1), b(ctid) AS NOT MATERIALIZED (SELECT 1) SELECT * FROM b',
    'SELECT * FROM (SELECT 1, 2) AS b(xmin, xmax)',
    // A column of the plugin's own may be called xid, without its table.
    'CREATE TABLE payments (id bigserial PRIMARY KEY, xid text NOT NULL UNIQUE)',
    'ALTER TABLE payments ADD COLUMN xid text',
    'SELECT xid, count(*) FROM payments WHERE xid = $1 AND NOT xid IS NULL GROUP BY xid ORDER BY xid',
    'INSERT INTO payments (id, xid) VALUES (1, $1) ON CONFLICT (xid) DO NOTHING',
    'UPDATE payments SET xid = $1 WHERE id = $2 RETURNING xid',
    'SELECT id AS xid FROM payments',
    "SELECT CASE WHEN xid = 'a' THEN xid ELSE NULL END, coalesce(xid, '') FROM payments",
    // The collations and access methods every server has.
    'SELECT body FROM notes ORDER BY body COLLATE "C", body COLLATE "POSIX", body COLLATE "default"',
    'SELECT body COLLATE ucs_basic FROM notes',
    'CREATE INDEX i ON notes USING gin (tags)',
    'CREATE INDEX i ON notes USING brin (id)',
    'CREATE TABLE t (x int) USING heap',
    'ALTER TABLE notes ADD EXCLUDE USING gist (r WITH &&)',
    'ALTER TABLE notes ALTER id TYPE int USING id::int',
    'SELECT * FROM notes JOIN tags USING (id)',
    'DELETE FROM notes USING trash WHERE notes.id = trash.note_id',
    "SELECT collation FROM notes WHERE collation = 'x'",
    // Characters JavaScript reads differently are fine inside strings, quoted names and comments.
    "SELECT 'a b c\u000bd'",
    'SELECT 1 AS "a b"',
    'SELECT 1 /*  ﻿ */',
    'WITH gone AS (DELETE FROM notes RETURNING id) INSERT INTO trash SELECT id FROM gone',
    'MERGE INTO notes n USING incoming i ON n.id = i.id WHEN NOT MATCHED THEN INSERT (body) VALUES (i.body)',
    'SELECT body AS "into", "temporary" FROM notes',
    // TEMP is refused only where it makes a temporary object; a column of that name is fine.
    'CREATE TABLE readings (day text, temp real, temporary bool)',
    'SELECT day, temp FROM readings WHERE temp > 1 ORDER BY temp',
    'select 1 from notes as temporary',
    'INSERT INTO temp (x) VALUES (1)',
    // INSERT INTO in a WITH query's body or after a WITH clause is the statement's own verb.
    'WITH n AS (INSERT INTO notes (body) VALUES ($1) RETURNING id) SELECT id FROM n',
    'WITH n AS NOT MATERIALIZED (SELECT 1) INSERT INTO notes (body) SELECT * FROM n',
    'WITH n AS MATERIALIZED (INSERT INTO notes (body) VALUES (1) RETURNING id) SELECT 1',
    // Names that only start like a refused one.
    'SELECT region, regexp_replace(body, $1, $2), regr_slope(1, 2) FROM notes',
    'CREATE TYPE span AS RANGE (subtype = float8)',
    'CREATE TABLE index (x int)',
    'CREATE INDEX ON notes (body)',
    // PostgreSQL 19 added a uuid() conversion to the catalog; a uuid column and the cast still pass.
    'SELECT t.uuid FROM items t WHERE t.uuid = uuid($1)',
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
    ['SELECT 1 FROM notes INTO TEMP copy', /SELECT \.\.\. INTO/],
    ['SELECT 0x1F', /hexadecimal/],
    ['SELECT 0o17, 0b1', /hexadecimal/],
    ['SELECT 1_000', /digit separators/],
  ])('refuses %s', (sql, reason) => {
    expect(() => check(sql)).toThrow(PluginSqlRefused);
    expect(() => check(sql)).toThrow(reason);
  });

  // Bypasses an earlier guard let through and Postgres ran, with their variants.
  it.each([
    // A `--` comment ended by a bare CR hid the rest from the guard, which Postgres then ran.
    ['select 1 --\rfrom public.users', /another schema/],
    ['select 1 --x\rfrom public.users', /another schema/],
    ['select 1 --\r, email, password_hash from public.users', /another schema/],
    ["select 1 --\r; reset search_path; update users set role='admin'", /may not start with RESET/],
    ['select 1 --\r; create function f() returns int', /CREATE FUNCTION is not allowed/],
    ['insert into notes (body) values (1) --x\r; update public.users set role = 1', /another schema/],
    ['select 1 -- x\r\u000b; select 1', /U\+000B/],
    // A parenthesized SELECT ... INTO, at any depth, made a temporary table that shadowed TREK's own.
    ["(select 1 as id, 'admin' as role into temp users)", /TEMP|SELECT \.\.\. INTO/],
    ["(select 99 as id, 'forged'::text as name into temp users)", /TEMP|SELECT \.\.\. INTO/],
    ['(select 1 into temp t)', /TEMP|SELECT \.\.\. INTO/],
    ['((select 1 into t))', /SELECT \.\.\. INTO/],
    ['(select 1) into t', /SELECT \.\.\. INTO/],
    ['(select 1 into trek_r_tmp_x)', /SELECT \.\.\. INTO/],
    ['select * from (select 1 into t) s', /SELECT \.\.\. INTO/],
    ['WITH x AS (SELECT 1) SELECT * INTO t FROM x', /SELECT \.\.\. INTO/],
    ['WITH x AS (SELECT 1 INTO t) SELECT 1', /SELECT \.\.\. INTO/],
    ['VALUES (1) INTO t', /SELECT \.\.\. INTO/],
    ['TABLE notes INTO t', /SELECT \.\.\. INTO/],
    ['select 1 into temporary t', /TEMPORARY|SELECT \.\.\. INTO/],
    ['select 1 into unlogged t', /SELECT \.\.\. INTO/],
    ['CREATE TABLE t AS SELECT 1 INTO u', /SELECT \.\.\. INTO/],
    ['CREATE GLOBAL TEMP TABLE t (x int)', /CREATE GLOBAL is not allowed|TEMP/],
    ['CREATE LOCAL TEMPORARY TABLE t (x int)', /CREATE LOCAL is not allowed|TEMPORARY/],
    ['CREATE TEMP VIEW v AS SELECT 1', /CREATE TEMP is not allowed/],
    ['CREATE OR REPLACE TEMP VIEW v AS SELECT 1', /CREATE TEMP is not allowed/],
    ['CREATE TEMPORARY SEQUENCE s', /CREATE TEMPORARY is not allowed/],
    // A column alias named insert or merge in front of INTO made a table.
    ['select 1 insert into t1', /SELECT \.\.\. INTO/],
    ['select 1 merge into t9', /SELECT \.\.\. INTO/],
    ['select 1 insert into unlogged t10', /SELECT \.\.\. INTO/],
    ['select x as insert into t from notes', /SELECT \.\.\. INTO/],
    ['WITH x AS (SELECT 1) SELECT 1 insert INTO t', /SELECT \.\.\. INTO/],
    ['insert into notes select 1 insert into t', /SELECT \.\.\. INTO/],
    ['select 1 insert into temp t', /SELECT \.\.\. INTO TEMP/],
    // A read of a system column, quoted or not, wherever it stands.
    ['select xmin, xmax from notes', /"xmin" reads a Postgres system column/],
    ['select n.xmax from notes n', /"xmax" reads a Postgres system column/],
    ['select cmin, cmax from notes', /"cmin" reads a Postgres system column/],
    ['select ctid from notes order by 1', /"ctid" reads a Postgres system column/],
    ['select "tableoid" from notes', /"tableoid" reads a Postgres system column/],
    ['update notes set body = $1 where id = $2 and xmin = $3', /"xmin" reads a Postgres system column/],
    ['delete from notes returning ctid', /"ctid" reads a Postgres system column/],
    ['select min(id) xmin from notes', /"xmin" reads a Postgres system column/],
    ['WITH b(xmin) AS (SELECT 1) SELECT xmin FROM b', /"xmin" reads a Postgres system column/],
    ['select * from notes n, f(xmin) as (a int)', /"xmin" reads a Postgres system column/],
    ['select * from notes n, f(xmin, ctid) as (a int)', /"xmin" reads a Postgres system column/],
    // A transaction id type where the word stands for the type.
    ["select age('3'::xid)", /"xid" stands for a transaction id type/],
    ["select cast('3' as xid8)", /"xid8" stands for a transaction id type/],
    ["select treat('3' as xid)", /"xid" stands for a transaction id type/],
    ["select age(xid '3')", /"xid" stands for a transaction id type/],
    ["select age(xid('3'))", /"xid" stands for a transaction id type/],
    ['select age($1.xid)', /"xid" stands for a transaction id type/],
    ["select age(u.xid) from unnest(array['3']) u", /"xid" stands for a transaction id type/],
    ["select age(('3').xid)", /"xid" stands for a transaction id type/],
    ['CREATE TABLE t (x _xid)', /"_xid" stands for a transaction id type/],
    ['CREATE TABLE t ("x" xid)', /"xid" stands for a transaction id type/],
    ["select '{}'::xid8[]", /"xid8" stands for a transaction id type/],
    ['select * from notes n, json_to_record(n.j) as x(a xid)', /"xid" stands for a transaction id type/],
    ['ALTER TABLE t ALTER COLUMN c TYPE xid', /"xid" stands for a transaction id type/],
    ['ALTER TABLE t ADD COLUMN c xid', /"xid" stands for a transaction id type/],
    ["select json_value('3', '$' returning xid)", /"xid" stands for a transaction id type/],
    ['CREATE TYPE r AS RANGE (subtype = xid8)', /"xid8" stands for a transaction id type/],
    ['CREATE TYPE c AS (a xid)', /"xid" stands for a transaction id type/],
    [
      'insert into pay (id, xid) values (1, $1) on conflict (id) do update set xid = excluded.xid',
      /"xid" stands for a transaction id type.*excluded\.xid in an upsert/,
    ],
    // A collation or an access method whose presence depends on the server.
    [`select 'a' collate "de-x-icu"`, /a collation other than "C"/],
    [`select body from notes order by body collate "de_DE.utf8"`, /a collation other than "C"/],
    ['select body from notes order by body collate C', /a collation other than "C"/],
    [`select 'a' collate trek_plugin_notes."C"`, /a collation other than "C"/],
    [`CREATE TABLE t (a text COLLATE "und-x-icu")`, /a collation other than "C"/],
    [`CREATE TYPE r AS RANGE (subtype = text, collation = "de-x-icu")`, /a collation other than "C"/],
    ['CREATE INDEX i ON notes USING bloom (body)', /built-in access methods/],
    ['CREATE INDEX i ON notes USING "BTREE" (body)', /built-in access methods/],
    ['CREATE TABLE t (x int) USING columnar', /built-in access methods/],
    ['CREATE MATERIALIZED VIEW mv USING columnar AS SELECT 1', /built-in access methods/],
    ['ALTER TABLE notes SET ACCESS METHOD columnar', /built-in access methods/],
    ['ALTER TABLE notes ADD EXCLUDE USING bloom (body WITH =)', /built-in access methods/],
    // The reg* types and functions that look an object up by a name in a string, in every spelling.
    ["select 'public.users'::regtype::oid", /"regtype" may not be named/],
    ["select cast('int4' as regtype)", /"regtype" may not be named/],
    ["select regtype 'text'", /"regtype" may not be named/],
    [`select 'x'::"regtype"`, /"regtype" may not be named/],
    ["select 'english'::regconfig", /"regconfig" may not be named/],
    ["select 'simple'::regdictionary", /"regdictionary" may not be named/],
    ["select '{public.users}'::_regclass", /"_regclass" may not be named/],
    // PostgreSQL 19's regdatabase looks a database of the cluster up by its name.
    ["select 'postgres'::regdatabase::oid", /"regdatabase" may not be named/],
    ["select cast('other_app' as regdatabase)", /"regdatabase" may not be named/],
    ["select '{postgres}'::_regdatabase", /"_regdatabase" may not be named/],
    ["select to_regdatabase('other_app')", /"to_regdatabase" may not be named/],
    ["select 'x'::pg_catalog.regtype", /"pg_catalog" may not be named/],
    ["select has_table_privilege('public.users', 'select')", /"has_table_privilege" may not be named/],
    ["select currtid2('public.users', '(0,1)')", /"currtid2" may not be named/],
    ["select gin_clean_pending_list('public.users_idx')", /"gin_clean_pending_list" may not be named/],
    ["select to_regtype('int4')", /"to_regtype" may not be named/],
    // aclitem looks its roles up by name and names them in its output.
    ["select '=r'::aclitem", /"aclitem" may not be named/],
    ["select cast('x=r/x' as aclitem)", /"aclitem" may not be named/],
    [`select array['=r']::"aclitem"[]`, /"aclitem" may not be named/],
    ["select '{=r}'::_aclitem", /"_aclitem" may not be named/],
    ['CREATE TABLE grants (a aclitem)', /"aclitem" may not be named/],
    // A base type is built from C functions, which only a superuser may do.
    ['CREATE TYPE fake (INPUT = int4in, OUTPUT = int4out, INTERNALLENGTH = 1000)', /composite, enum or range/],
    ['CREATE INDEX i (x)', /must name its table with ON/],
    ['ALTER TABLE', /could not be read/],
  ])('refuses the bypass %j', (sql, reason) => {
    expect(() => check(sql)).toThrow(PluginSqlRefused);
    expect(() => check(sql)).toThrow(reason);
  });

  it.each([
    ['NO-BREAK SPACE', ' ', 'U+00A0'],
    ['BYTE ORDER MARK', '﻿', 'U+FEFF'],
    ['LINE SEPARATOR', ' ', 'U+2028'],
    ['PARAGRAPH SEPARATOR', ' ', 'U+2029'],
    ['IDEOGRAPHIC SPACE', '　', 'U+3000'],
    ['vertical tab', '\u000b', 'U+000B'],
    ['escape', '\u001b', 'U+001B'],
    ['DEL', '\u007f', 'U+007F'],
  ])('refuses a %s outside a string, which JavaScript and Postgres read differently', (_name, ch, code) => {
    for (const sql of [
      `SELECT 1${ch}FROM public.users`,
      `SELECT x${ch}FROM notes`,
      `${ch}SELECT 1`,
      `SELECT public${ch}.users`,
    ]) {
      expect(() => check(sql), JSON.stringify(sql)).toThrow(PluginSqlRefused);
      expect(() => check(sql), JSON.stringify(sql)).toThrow(code);
    }
  });

  it('refuses a NUL anywhere, in a string too, with the words the stores of both engines use', () => {
    // The protocol ends a statement's text at a NUL, so what Postgres would read is not what was checked.
    for (const sql of [
      "select 'a\u0000' -- then\nfrom public.users",
      'SELECT 1\u0000FROM public.users',
      '\u0000SELECT 1',
      'SELECT "a\u0000b" FROM notes',
    ]) {
      expect(() => tokenize(sql), JSON.stringify(sql)).toThrow(PLUGIN_SQL_NUL_REFUSAL);
      expect(() => check(sql), JSON.stringify(sql)).toThrow(PLUGIN_SQL_NUL_REFUSAL);
    }
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
    // What follows a CR is a statement of its own, as Postgres reads it, and is checked like any other.
    expect(parsePluginSql('select 1 --x\r; select 42').map((s) => s.text)).toEqual(['select 1 --x', 'select 42']);
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

  it('refuses TEMP where it makes a temporary object, and says so', () => {
    for (const sql of [
      'CREATE TEMP TABLE t (x int)',
      'CREATE TEMPORARY VIEW v AS SELECT 1',
      'CREATE OR REPLACE TEMP VIEW v AS SELECT 1',
      'CREATE LOCAL TEMP TABLE t (x int)',
      'CREATE GLOBAL TEMPORARY TABLE t (x int)',
    ]) {
      expect(() => check(sql), sql).toThrow(/is not allowed: a temporary object outlives the call/);
    }
    expect(() => check('select 1 into temp t')).toThrow(/SELECT \.\.\. INTO TEMP is not allowed: no temporary tables/);
    expect(() => check('CREATE LOCAL TABLE t (x int)')).toThrow(/CREATE LOCAL is not allowed$/);
  });

  it('names the existing objects a statement changes, for the store to resolve in its transaction', () => {
    const targets = (sql: string) => parsePluginSql(sql)[0].targets;
    const rel = (...name: string[]): PluginTarget => ({ kind: 'relation', name });
    expect(targets('ALTER TYPE int4 RENAME TO int4x')).toEqual([{ kind: 'type', name: ['int4'] }]);
    expect(targets('DROP TYPE IF EXISTS mood, "Text" CASCADE')).toEqual([
      { kind: 'type', name: ['mood'] },
      { kind: 'type', name: ['Text'] },
    ]);
    expect(targets('DROP TABLE IF EXISTS a, "B", trek_plugin_notes.c CASCADE')).toEqual([
      rel('a'),
      rel('B'),
      rel('trek_plugin_notes', 'c'),
    ]);
    expect(targets('DROP INDEX CONCURRENTLY IF EXISTS i')).toEqual([rel('i')]);
    expect(targets('DROP MATERIALIZED VIEW mv')).toEqual([rel('mv')]);
    expect(targets('REFRESH MATERIALIZED VIEW CONCURRENTLY mv WITH DATA')).toEqual([rel('mv')]);
    expect(targets('TRUNCATE TABLE ONLY a, b * RESTART IDENTITY')).toEqual([rel('a'), rel('b')]);
    expect(targets('TRUNCATE a')).toEqual([rel('a')]);
    expect(targets('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS i ON ONLY t USING btree (x)')).toEqual([rel('t')]);
    expect(targets('CREATE INDEX ON t (x)')).toEqual([rel('t')]);
    expect(targets('ALTER MATERIALIZED VIEW IF EXISTS mv RENAME TO mv2')).toEqual([rel('mv')]);
    expect(targets('ALTER TABLE IF EXISTS ONLY t ADD CONSTRAINT f FOREIGN KEY (x) REFERENCES p (id)')).toEqual([
      rel('t'),
      rel('p'),
    ]);
    expect(targets('CREATE TABLE c (x int REFERENCES p) INHERITS (q, r)')).toEqual([rel('p'), rel('q'), rel('r')]);
    expect(targets('CREATE TABLE c PARTITION OF p FOR VALUES IN (1)')).toEqual([rel('p')]);
    expect(targets('ALTER TABLE p ATTACH PARTITION c FOR VALUES IN (1)')).toEqual([rel('p'), rel('c')]);
    expect(targets('ALTER TABLE c NO INHERIT p')).toEqual([rel('c'), rel('p')]);
    expect(targets('CREATE TABLE t (x int)')).toEqual([]);
    expect(targets('SELECT 1')).toEqual([]);
    expect(() => parsePluginSql('DROP TABLE a.b.c.d')).toThrow(/at most three parts/);
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
