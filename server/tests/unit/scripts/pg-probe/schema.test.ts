/**
 * How the Postgres probe turns the entities into a Postgres schema
 * (scripts/pg-probe/schema.ts): SQLite-only defaults, TEXT timestamps, the
 * NOCASE collation, and splitting the generated DDL so one refused statement
 * does not take the rest with it.
 */
import {
  adjustColumns,
  NOCASE_COLLATION_SQL,
  PG_NOW_TEXT_DEFAULT,
  portableDefault,
  splitStatements,
  type ColumnMeta,
} from '../../../../scripts/pg-probe/schema';

import { describe, expect, it } from 'vitest';

class DbTimestampType {}
class TextType {}

describe('pg-probe schema', () => {
  it('PGPROBE-040: maps the SQLite clock defaults and leaves every other default alone', () => {
    expect(PG_NOW_TEXT_DEFAULT).toBe("to_char((CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'YYYY-MM-DD HH24:MI:SS')");
    expect(portableDefault('CURRENT_TIMESTAMP')).toBe(PG_NOW_TEXT_DEFAULT);
    expect(portableDefault("(datetime('now'))")).toBe(PG_NOW_TEXT_DEFAULT);
    expect(portableDefault("datetime( 'now' )")).toBe(PG_NOW_TEXT_DEFAULT);
    expect(portableDefault("(strftime('%s','now'))")).toBe('CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS bigint)');
    for (const kept of ['0', '1', 'NULL', "'none'", "'#10b981'", "'{}'"]) expect(portableDefault(kept)).toBe(kept);
  });

  it('PGPROBE-041: makes timestamp columns text, rewrites defaults and the NOCASE collation, and names what it changed', () => {
    const columns: ColumnMeta[] = [
      {
        name: 'created_at',
        customType: new DbTimestampType(),
        columnTypes: ['timestamptz'],
        defaultRaw: 'CURRENT_TIMESTAMP',
      },
      { name: 'title', customType: new TextType(), columnTypes: ['text'], defaultRaw: "'x'" },
      { name: 'stamp', columnTypes: ['int'], defaultRaw: "(strftime('%s','now'))" },
      { name: 'region', columnTypes: ['text'], collation: 'NOCASE' },
      { name: 'id', columnTypes: ['int'] },
    ];
    expect(adjustColumns(columns)).toEqual(['created_at', 'stamp', 'region']);
    expect(columns[0]).toMatchObject({ columnTypes: ['text'], defaultRaw: PG_NOW_TEXT_DEFAULT });
    expect(columns[1]).toMatchObject({ columnTypes: ['text'], defaultRaw: "'x'" });
    expect(columns[2]).toMatchObject({
      columnTypes: ['int'],
      defaultRaw: 'CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS bigint)',
    });
    expect(columns[3]).toMatchObject({ collation: 'nocase' });
    expect(NOCASE_COLLATION_SQL).toContain('CREATE COLLATION IF NOT EXISTS nocase');
  });

  it('PGPROBE-042: splits DDL on semicolons outside quotes and drops session settings', () => {
    const ddl = [
      "set names 'utf8';",
      'create table "a" ("id" serial primary key, "note" text default \'a;b\');',
      'create index "a_x" on "a" ("note") where "note" <> \';\';',
      '',
      'create table "b ;" ("id" int)',
    ].join('\n');
    expect(splitStatements(ddl)).toEqual([
      'create table "a" ("id" serial primary key, "note" text default \'a;b\')',
      'create index "a_x" on "a" ("note") where "note" <> \';\'',
      'create table "b ;" ("id" int)',
    ]);
    expect(splitStatements('  ;  ; ')).toEqual([]);
  });
});
