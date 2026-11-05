/**
 * The committed Postgres baseline (server/assets/postgres/) and what keeps it
 * honest: reading and writing it (src/db/engine/postgres/baseline.ts) and the
 * generator's --check (scripts/generate-pg-baseline.ts).
 */
import { checkBaseline, rowStatements, triggerPortProblems } from '../../../../../scripts/generate-pg-baseline';
import {
  baselineMatches,
  readPostgresBaseline,
  renderBaseline,
  writePostgresBaseline,
  type PostgresBaseline,
} from '../../../../../src/db/engine/postgres/baseline';
import { POSTGRES_TRIGGERS } from '../../../../../src/db/engine/postgres/postgres-triggers';
import { knownMigrationNames } from '../../../../../src/db/known-migrations';

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const A = 'Migration20200101000000_a';
const B = 'Migration20200101000100_b';
const C = 'Migration20200101000200_c';
const sample: PostgresBaseline = {
  through: B,
  migrations: [A, B],
  statements: ['create table "t" ("note" text default \'x;y\')', 'create index "i" on "t" ("note")'],
};

let dir: string | undefined;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});
const scratch = () => (dir = mkdtempSync(path.join(tmpdir(), 'trek-pg-baseline-')));

describe('Postgres baseline files', () => {
  it('PGBASE-001: what is written reads back the same, comment line and all', () => {
    const target = scratch();
    writePostgresBaseline(sample, target);
    expect(readPostgresBaseline(target)).toEqual(sample);
    expect(baselineMatches(sample, target)).toBe(true);
    expect(baselineMatches({ ...sample, statements: [sample.statements[0]] }, target)).toBe(false);
    expect(renderBaseline(sample).sql.startsWith('-- ')).toBe(true);
  });

  it('PGBASE-002: a manifest that does not list its own cut, or an empty SQL file, is refused', () => {
    const target = scratch();
    writePostgresBaseline(sample, target);
    writeFileSync(path.join(target, 'baseline.json'), JSON.stringify({ through: C, migrations: [A, B] }));
    expect(() => readPostgresBaseline(target)).toThrow(/must name "through"/);
    writePostgresBaseline(sample, target);
    writeFileSync(path.join(target, 'baseline.sql'), '-- nothing\n');
    expect(() => readPostgresBaseline(target)).toThrow(/holds no statements/);
    writeFileSync(path.join(target, 'baseline.sql'), 'create table "q" ("a" text default \'?\');\n');
    expect(() => readPostgresBaseline(target)).toThrow(/holds a "\?"/);
    expect(baselineMatches(sample, path.join(target, 'missing'))).toBe(false);
  });

  it('PGBASE-003: the committed baseline names every migration on disk up to its cut, and only those', () => {
    const committed = readPostgresBaseline();
    const known = [...knownMigrationNames()].sort();
    expect(committed.migrations).toEqual(known.filter((name) => name <= committed.through));
    expect(committed.statements.some((statement) => /^create table "users"/.test(statement))).toBe(true);
    expect(committed.statements.join('\n')).not.toMatch(/\binteger\b/);
  });
});

describe('checkBaseline', () => {
  const PORTED = Object.keys(POSTGRES_TRIGGERS);
  const generated = (through: string, migrations: string[]): PostgresBaseline => ({
    through,
    migrations,
    statements: [],
  });

  it('PGBASE-010: at the newest migration the baseline must be exactly what the entities generate', () => {
    expect(checkBaseline(sample, generated(B, [A, B]), true, PORTED)).toEqual([]);
    expect(checkBaseline(sample, generated(B, [A, B]), false, PORTED)).toEqual([
      'the entities generate a different schema; run npm run gen:pg-baseline',
    ]);
  });

  it('PGBASE-011: once a migration lands after the cut, the baseline is frozen and only its manifest is checked', () => {
    expect(checkBaseline(sample, generated(C, [A, B, C]), false, PORTED)).toEqual([]);
  });

  it('PGBASE-013: while not frozen, a SQLite trigger without a port is reported; once frozen the triggers are not checked', () => {
    const withNewTrigger = [...PORTED, 'trg_new_trigger'];
    expect(checkBaseline(sample, generated(B, [A, B]), true, withNewTrigger)).toEqual([
      'SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: trg_new_trigger',
    ]);
    expect(checkBaseline(sample, generated(C, [A, B, C]), false, withNewTrigger)).toEqual([]);
  });

  it('PGBASE-012: a manifest naming a migration that is gone, or missing one before its cut, is reported', () => {
    expect(checkBaseline(sample, generated(C, [B, C]), true, PORTED)).toEqual([
      `the baseline names migrations that do not exist: ${A}`,
    ]);
    const skipped = { ...sample, migrations: [B] };
    expect(checkBaseline(skipped, generated(B, [A, B]), true, PORTED)).toEqual([
      `migrations up to ${B} are missing from it: ${A}`,
    ]);
  });
});

describe('readPostgresBaseline manifest', () => {
  it('PGBASE-004: a manifest whose migrations are not all names, or are empty, is refused', () => {
    const target = scratch();
    for (const manifest of [
      { through: B, migrations: [A, 3] },
      { through: B, migrations: [] },
      { through: 7, migrations: [B] },
    ]) {
      writePostgresBaseline(sample, target);
      writeFileSync(path.join(target, 'baseline.json'), JSON.stringify(manifest));
      expect(() => readPostgresBaseline(target), JSON.stringify(manifest)).toThrow(/must name "through"/);
    }
  });
});

describe('triggerPortProblems', () => {
  it('PGBASE-020: every SQLite trigger needs a Postgres port, and a port without its trigger is stale', () => {
    expect(triggerPortProblems(['a', 'b'], ['b', 'a'])).toEqual([]);
    expect(triggerPortProblems(['a', 'b'], ['a', 'c'])).toEqual([
      'SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: b',
      'POSTGRES_TRIGGERS ports triggers the migrations no longer create: c',
    ]);
  });

  it('PGBASE-021: the committed baseline carries every trigger port after the tables', () => {
    const statements = readPostgresBaseline().statements;
    const firstTrigger = statements.findIndex((statement) => statement.startsWith('CREATE FUNCTION'));
    expect(firstTrigger).toBeGreaterThan(0);
    expect(statements.slice(firstTrigger).every((statement) => /^CREATE (FUNCTION|TRIGGER) /.test(statement))).toBe(
      true,
    );
  });
});

describe('rowStatements', () => {
  it("PGBASE-030: a migration's rows go in as quoted literals the column casts, and a numeric id moves its sequence past them", () => {
    expect(
      rowStatements('photo_provider_fields', [
        { id: 1, provider_id: 'immich', label: "Server's URL", required: 1, hint: null },
        { id: 2, provider_id: 'immich', label: 'API key', required: 0, hint: 'x' },
      ]),
    ).toEqual([
      'insert into "photo_provider_fields" ("id", "provider_id", "label", "required", "hint") values ' +
        "('1', 'immich', 'Server''s URL', '1', NULL), ('2', 'immich', 'API key', '0', 'x')",
      "select setval(seq, greatest(max_id, 1)) from (select pg_get_serial_sequence('\"photo_provider_fields\"', 'id') as seq, " +
        'max("id") as max_id from "photo_provider_fields") ids where seq is not null',
    ]);
  });

  it('PGBASE-031: a text key has no sequence to move, an empty table writes nothing, and binary data is refused', () => {
    expect(rowStatements('addons', [{ id: 'mcp', enabled: 0 }])).toEqual([
      'insert into "addons" ("id", "enabled") values (\'mcp\', \'0\')',
    ]);
    expect(rowStatements('addons', [])).toEqual([]);
    expect(() => rowStatements('blobs', [{ data: Buffer.from('x') }])).toThrow(/binary data/);
  });

  it('PGBASE-032: the committed baseline carries the reference rows the migrations insert', () => {
    const sql = readPostgresBaseline().statements.join('\n');
    expect(sql).toContain('insert into "tour_types"');
    expect(sql).toContain('insert into "app_settings"');
  });
});
