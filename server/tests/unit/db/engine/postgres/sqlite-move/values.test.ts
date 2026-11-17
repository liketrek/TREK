/**
 * MOVEVAL-001..010: how a SQLite value becomes the value a Postgres column of
 * the move's target takes, the text both sides are compared in, and the
 * order-free table checksum (src/db/engine/postgres/sqlite-move/values.ts).
 */
import {
  beyondSafeInteger,
  canonicalFromPostgres,
  canonicalFromSent,
  columnKind,
  convertValue,
  stableJson,
  TableChecksum,
  type ColumnKind,
} from '../../../../../../src/db/engine/postgres/sqlite-move/values';

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ok = (value: unknown) => ({ ok: true, value });

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

  it('MOVEVAL-005: text takes strings and numbers, and refuses a NUL Postgres cannot store or a BLOB', () => {
    expect(convertValue('Lisboa', 'text')).toEqual(ok('Lisboa'));
    expect(convertValue(7n, 'text')).toEqual(ok('7'));
    expect(convertValue(2.5, 'text')).toEqual(ok('2.5'));
    expect(convertValue('a\u0000b', 'text')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/NUL character/),
    });
    expect(convertValue(new Uint8Array([0]), 'text')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not text/),
    });
    const long = 'x'.repeat(60);
    expect(convertValue(long, 'integer')).toMatchObject({
      reason: `the text "${'x'.repeat(40)}..." is not a whole number`,
    });
  });

  it('MOVEVAL-006: JSON must parse and hold no NUL, escaped or not', () => {
    expect(convertValue('{"a":1}', 'json')).toEqual(ok('{"a":1}'));
    expect(convertValue(5n, 'json')).toEqual(ok('5'));
    expect(convertValue('{broken', 'json')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/is not valid JSON/),
    });
    expect(convertValue('"\\u0000"', 'json')).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/jsonb cannot store/),
    });
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
  const cases: Array<[ColumnKind, Parameters<typeof canonicalFromSent>[0], string]> = [
    ['integer', '-12', '-12'],
    ['float', 0.30000000000000004, '0.30000000000000004'],
    ['float', 1e21, '1e+21'],
    ['text', 'São Paulo', 'São Paulo'],
    ['json', '{"b":1,"a":[2,{"d":1,"c":0}]}', '{"a": [2, {"c": 0, "d": 1}], "b": 1}'],
    ['bytes', Buffer.from([0, 171]), '\\x00ab'],
  ];

  it.each(cases)('MOVEVAL-009: %s values compare equal as sent and as Postgres prints them', (kind, sent, printed) => {
    expect(canonicalFromSent(sent, kind)).toBe(canonicalFromPostgres(printed, kind));
    expect(canonicalFromSent(null, kind)).toBeNull();
    expect(canonicalFromPostgres(null, kind)).toBeNull();
  });

  it('MOVEVAL-009b: text sent for a BLOB compares as its bytes, and a float as Postgres spells it', () => {
    expect(canonicalFromSent('ab', 'bytes')).toBe('6162');
    expect(canonicalFromPostgres('1e+20', 'float')).toBe(canonicalFromSent(1e20, 'float'));
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
