/**
 * splitAfterSemicolons: where a plugin's exec() script is cut into statements, so
 * the time budget can be read between them (plugin-data.service.ts).
 */
import { splitAfterSemicolons } from '../../../src/nest/plugins/host/sql-script';

import { describe, expect, it } from 'vitest';

describe('splitAfterSemicolons', () => {
  it('SQLSCRIPT-001 cuts after each statement and keeps every character', () => {
    const sql = 'CREATE TABLE a (x); INSERT INTO a VALUES (1);\nSELECT 1';
    const pieces = splitAfterSemicolons(sql);
    expect(pieces).toEqual(['CREATE TABLE a (x);', ' INSERT INTO a VALUES (1);', '\nSELECT 1']);
    expect(pieces.join('')).toBe(sql);
  });

  it('SQLSCRIPT-002 leaves the semicolons in strings, quoted identifiers and comments alone', () => {
    expect(splitAfterSemicolons("INSERT INTO t VALUES ('a;b', 'it''s;');")).toEqual([
      "INSERT INTO t VALUES ('a;b', 'it''s;');",
    ]);
    expect(splitAfterSemicolons('SELECT "x;y", `p;q`, [r;s] FROM t;')).toEqual(['SELECT "x;y", `p;q`, [r;s] FROM t;']);
    expect(splitAfterSemicolons('SELECT 1; -- one; two\nSELECT 2;')).toEqual(['SELECT 1;', ' -- one; two\nSELECT 2;']);
    expect(splitAfterSemicolons('SELECT 1 /* a; b */;')).toEqual(['SELECT 1 /* a; b */;']);
  });

  it('SQLSCRIPT-003 cuts inside a trigger body, which the caller joins back up', () => {
    expect(splitAfterSemicolons('CREATE TRIGGER t AFTER INSERT ON a BEGIN SELECT 1; END;')).toEqual([
      'CREATE TRIGGER t AFTER INSERT ON a BEGIN SELECT 1;',
      ' END;',
    ]);
  });

  it('SQLSCRIPT-004 runs an unterminated string, identifier or comment to the end', () => {
    expect(splitAfterSemicolons("SELECT 'open; still")).toEqual(["SELECT 'open; still"]);
    expect(splitAfterSemicolons('SELECT [open; still')).toEqual(['SELECT [open; still']);
    expect(splitAfterSemicolons('SELECT 1 -- trailing; comment')).toEqual(['SELECT 1 -- trailing; comment']);
    expect(splitAfterSemicolons('SELECT 1 /* open; comment')).toEqual(['SELECT 1 /* open; comment']);
  });

  it('SQLSCRIPT-005 gives nothing for an empty script and a piece per stray semicolon', () => {
    expect(splitAfterSemicolons('')).toEqual([]);
    expect(splitAfterSemicolons(';;')).toEqual([';', ';']);
  });
});
