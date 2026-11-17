/**
 * MOVEVAL-001..014: how a SQLite value becomes the value a Postgres column of
 * the move's target takes, under TREK's rules and under a plugin's, the text
 * both sides are compared in, and the order-free table checksum
 * (src/db/engine/postgres/sqlite-move/values.ts).
 */
import {
  beyondSafeInteger,
  canonicalFromPostgres,
  canonicalFromSource,
  columnKind,
  convertValue,
  PLUGIN_RULES,
  stableJson,
  TableChecksum,
  type ColumnKind,
} from '../../../../../../src/db/engine/postgres/sqlite-move/values';

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ok = (value: unknown) => ({ ok: true, value });
const DROP_NUL = { exact: false, dropNul: true };

describe('columnKind', () => {
  it('MOVEVAL-001: knows every column type the Postgres baseline uses', () => {
    const sql = fs.readFileSync(path.join(__dirname, '../../../../../../assets/postgres/baseline.sql'), 'utf8');
    const types = new Set(
      [
        ...sql.matchAll(
          /" (bigserial|bigint|integer|smallint|text|varchar\(\d+\)|double precision|real|jsonb|json|bytea|boolean|numeric|timestamptz|date|uuid)(?=[ ,)])/g,
        ),
      ].map((match) => match[1]),
    );
    const asCatalog: Record<string, string> = { bigserial: 'bigint' };
    for (const type of types) {
      const dataType = asCatalog[type] ?? (type.startsWith('varchar') ? 'character varying' : type);
      expect(columnKind(dataType), type).not.toBeNull();
    }
  });

  it('MOVEVAL-002: has no rule for a type it does not know, so the move refuses instead of guessing', () => {
    expect(columnKind('timestamp with time zone')).toBeNull();
    expect(columnKind('boolean')).toBeNull();
    expect(columnKind('smallint')).toBe('integer');
    expect(columnKind('real')).toBe('float');
    expect(columnKind('character')).toBe('text');
    expect(columnKind('json')).toBe('json');
  });
});

describe('convertValue', () => {
  it('MOVEVAL-003: integers keep all 64 bits and accept whole numbers in any spelling SQLite stored them in', () => {
    expect(convertValue(9007199254740993n, 'integer')).toEqual(ok('9007199254740993'));
    expect(convertValue(42, 'integer')).toEqual(ok('42'));
    expect(convertValue(' -7 ', 'integer')).toEqual(ok('-7'));
    expect(convertValue(null, 'integer')).toEqual(ok(null));
    expect(convertValue(1.5, 'integer')).toMatchObject({ ok: false, reason: 'the value 1.5 is not a whole number' });
    expect(convertValue('abc', 'integer')).toMatchObject({ ok: false, reason: 'the text "abc" is not a whole number' });
    expect(convertValue('99999999999999999999', 'integer')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/does not fit in 64 bits/),
    });
    expect(convertValue(new Uint8Array([1]), 'integer')).toMatchObject({
      ok: false,
      reason: 'a 1-byte BLOB is not a whole number',
    });
  });

  it('MOVEVAL-004: floats take numbers and numeric text, never a value a double cannot hold', () => {
    expect(convertValue(1.25, 'float')).toEqual(ok(1.25));
    expect(convertValue(12n, 'float')).toEqual(ok(12));
    expect(convertValue('3.5e2', 'float')).toEqual(ok(350));
    expect(convertValue(9007199254740993n, 'float')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/more digits than a double holds/),
    });
    expect(convertValue('north', 'float')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not a number/),
    });
    expect(convertValue('', 'float')).toMatchObject({ ok: false });
  });

  it('MOVEVAL-005: text takes strings and numbers, refuses a NUL unless told to drop it, and refuses a BLOB', () => {
    expect(convertValue('Lisboa', 'text')).toEqual(ok('Lisboa'));
    expect(convertValue(7n, 'text')).toEqual(ok('7'));
    expect(convertValue(2.5, 'text')).toEqual(ok('2.5'));
    expect(convertValue('a\u0000b\u0000', 'text')).toEqual({
      ok: false,
      reason: 'the text "a\\u0000b\\u0000" holds a NUL character (U+0000), which Postgres text cannot hold',
    });
    expect(convertValue('a\u0000b\u0000', 'text', DROP_NUL)).toEqual({ ok: true, value: 'ab', droppedNul: true });
    // The six characters of an escape are text like any other.
    expect(convertValue('a\\u0000b', 'text')).toEqual(ok('a\\u0000b'));
    expect(convertValue(new Uint8Array([0]), 'text')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not text/),
    });
    const long = 'x'.repeat(60);
    expect(convertValue(long, 'integer')).toMatchObject({
      reason: `the text "${'x'.repeat(40)}..." is not a whole number`,
    });
  });

  it('MOVEVAL-006: JSON must parse, and loses the NUL characters it escapes only when told to', () => {
    expect(convertValue('{"a":1}', 'json')).toEqual(ok('{"a":1}'));
    expect(convertValue(5n, 'json')).toEqual(ok('5'));
    expect(convertValue('{broken', 'json')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not valid JSON/),
    });
    expect(convertValue('"\\u0000"', 'json')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/holds a NUL character \(U\+0000\), .* \(escaped as \\u0000\)$/),
    });
    expect(convertValue('"\\u0000"', 'json', DROP_NUL)).toEqual({ ok: true, value: '""', droppedNul: true });
    expect(convertValue('{"a\\u0000":["x\\u0000y",1]}', 'json', DROP_NUL)).toEqual({
      ok: true,
      value: '{"a":["xy",1]}',
      droppedNul: true,
    });
    // An escaped backslash followed by u0000 holds no NUL, and stays exactly as it is.
    expect(convertValue('"\\\\u0000"', 'json', DROP_NUL)).toEqual(ok('"\\\\u0000"'));
    // A raw NUL is not valid JSON in the first place.
    expect(convertValue('"\u0000"', 'json')).toMatchObject({ ok: false, reason: expect.stringMatching(/valid JSON/) });
    expect(convertValue(new Uint8Array([1]), 'json')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not JSON text/),
    });
  });

  it('MOVEVAL-007: bytes take a BLOB, or the UTF-8 of text, and refuse a number', () => {
    expect(convertValue(new Uint8Array([0, 255]), 'bytes')).toEqual(ok(Buffer.from([0, 255])));
    expect(convertValue('hé', 'bytes')).toEqual(ok(Buffer.from('hé', 'utf8')));
    expect(convertValue(3n, 'bytes')).toMatchObject({ ok: false, reason: expect.stringMatching(/is not a BLOB/) });
  });

  it('MOVEVAL-008: flags an integer past 2^53, which the Postgres driver refuses to read', () => {
    expect(beyondSafeInteger('9007199254740993')).toBe(true);
    expect(beyondSafeInteger('-9007199254740993')).toBe(true);
    expect(beyondSafeInteger('9007199254740991')).toBe(false);
    expect(beyondSafeInteger(12)).toBe(false);
    expect(beyondSafeInteger('text')).toBe(false);
  });
});

describe('the compared text', () => {
  const cases: Array<[ColumnKind, Parameters<typeof canonicalFromSource>[0], string]> = [
    ['integer', ' -12 ', '-12'],
    ['integer', 9007199254740993n, '9007199254740993'],
    ['integer', 42, '42'],
    ['float', 0.30000000000000004, '0.30000000000000004'],
    ['float', 1e21, '1e+21'],
    ['float', 12n, '12'],
    ['float', '3.5e2', '350'],
    ['text', 'São Paulo', 'São Paulo'],
    ['text', 7n, '7'],
    ['json', '{"b":1,"a":[2,{"d":1,"c":0}]}', '{"a": [2, {"c": 0, "d": 1}], "b": 1}'],
    ['json', 5n, '5'],
    ['bytes', new Uint8Array([0, 171]), '\\x00ab'],
  ];

  it.each(cases)(
    'MOVEVAL-009: %s values compare equal as read from SQLite and as Postgres prints them',
    (kind, read, printed) => {
      expect(canonicalFromSource(read, kind)).toBe(canonicalFromPostgres(printed, kind));
      expect(canonicalFromSource(null, kind)).toBeNull();
      expect(canonicalFromPostgres(null, kind)).toBeNull();
    },
  );

  it('MOVEVAL-009b: text read for a BLOB compares as its bytes, and a float as Postgres spells it', () => {
    expect(canonicalFromSource('ab', 'bytes')).toBe('6162');
    expect(canonicalFromPostgres('1e+20', 'float')).toBe(canonicalFromSource(1e20, 'float'));
    expect(canonicalFromPostgres('plain', 'bytes')).toBe('plain');
    expect(stableJson('{"z":null,"y":true}')).toBe('{"y":true,"z":null}');
  });

  it('MOVEVAL-010: the checksum ignores row order and catches a changed, missing or doubled row', () => {
    const sum = (rows: Array<Array<string | null>>) => {
      const checksum = new TableChecksum();
      for (const row of rows) checksum.add(row);
      return checksum.hex();
    };
    const rows = [
      ['1', 'a'],
      ['2', null],
    ];
    expect(sum(rows)).toBe(sum([...rows].reverse()));
    expect(sum(rows)).toHaveLength(64);
    expect(sum(rows)).not.toBe(
      sum([
        ['1', 'a'],
        ['2', 'b'],
      ]),
    );
    expect(sum(rows)).not.toBe(sum([['1', 'a']]));
    expect(sum(rows)).not.toBe(sum([...rows, ['2', null]]));
    // A NULL and the text "null" are different values.
    expect(sum([['null']])).not.toBe(sum([[null]]));
  });
});

describe("a plugin's values (PLUGIN_RULES)", () => {
  const exact = (value: Parameters<typeof convertValue>[0], kind: ColumnKind) =>
    convertValue(value, kind, PLUGIN_RULES);
  const changed =
    /is stored as .*, but the column holds .* on Postgres, so the plugin would read it back as another type/;

  it('MOVEVAL-011: a value keeps its storage class and its bytes, as the Postgres plugin store hands it back', () => {
    expect(exact(42n, 'integer')).toEqual(ok('42'));
    expect(exact(1.5, 'float')).toEqual(ok(1.5));
    expect(exact(3n, 'float')).toEqual(ok(3));
    expect(exact('{"a":1}', 'text')).toEqual(ok('{"a":1}'));
    expect(exact(new Uint8Array([0, 1]), 'bytes')).toEqual(ok(Buffer.from([0, 1])));
    expect(exact(null, 'text')).toEqual(ok(null));
  });

  it('MOVEVAL-012: a value that would come back as another type is refused, not converted', () => {
    expect(exact(1.5, 'text')).toEqual({
      ok: false,
      reason:
        'the value 1.5 is stored as a REAL, but the column holds text on Postgres, ' +
        'so the plugin would read it back as another type',
    });
    expect(exact(5n, 'text')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact('{"a":1}', 'bytes')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact(' 7', 'integer')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact(2.5, 'integer')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact('2.5', 'float')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact(new Uint8Array([1]), 'text')).toMatchObject({ ok: false, reason: expect.stringMatching(changed) });
    expect(exact(9007199254740993n, 'integer')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/beyond 2\^53, which the Postgres plugin store refuses to read/),
    });
    expect(exact(-9007199254740993n, 'float')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/more digits than a double holds/),
    });
  });

  it('MOVEVAL-013: a NUL in a plugin value is refused, never dropped, whatever the operator asked for', () => {
    expect(exact('team\u0000a', 'text')).toEqual({
      ok: false,
      reason: 'the text "team\\u0000a" holds a NUL character (U+0000), which Postgres text cannot hold',
    });
    expect(convertValue('team\u0000a', 'text', { exact: true, dropNul: true })).toMatchObject({ ok: false });
  });

  it('MOVEVAL-014: the compared text comes from the SQLite value, so a value that changed on the way does not match', () => {
    // What Postgres would print had the NUL been dropped, or the type changed, on the way.
    expect(canonicalFromSource('team\u0000a', 'text', PLUGIN_RULES)).not.toBe(canonicalFromPostgres('teama', 'text'));
    expect(canonicalFromSource('team\u0000a', 'text', { exact: true, dropNul: true })).not.toBe('teama');
    expect(canonicalFromSource(new Uint8Array([0x61]), 'text', PLUGIN_RULES)).not.toBe(
      canonicalFromPostgres('a', 'text'),
    );
    expect(canonicalFromSource(5n, 'bytes')).not.toBe(canonicalFromPostgres('\\x35', 'bytes'));
    // The one change allowed is the one the operator asked for on TREK's own data.
    expect(canonicalFromSource('team\u0000a', 'text', DROP_NUL)).toBe(canonicalFromPostgres('teama', 'text'));
    expect(canonicalFromSource('{"k\\u0000":1}', 'json', DROP_NUL)).toBe(canonicalFromPostgres('{"k": 1}', 'json'));
  });
});
