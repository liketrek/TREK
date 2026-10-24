/**
 * The Postgres probe's ratchet (scripts/pg-probe/baseline.ts). The probe
 * itself only runs in CI against a Postgres service, so the rules that decide
 * whether that job passes are pinned here: a method may not fail more
 * statements than its entry, a stale entry fails until it is lowered, a
 * method the probe did not measure must be listed as uncovered and the list
 * only shrinks, only SQL errors count, an unmeasured baseline has nothing to
 * compare (the run fails on it, see report.test.ts), and --update never
 * raises or adds.
 */
import {
  compareWithBaseline,
  countsTowardRatchet,
  formatBaseline,
  lowerBaseline,
  parseBaseline,
} from '../../../../scripts/pg-probe/baseline';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const now = (entries: Record<string, number>): Map<string, number> => new Map(Object.entries(entries));
const none = new Set<string>();

describe('pg-probe baseline', () => {
  it('PGPROBE-001: parses a measured and an unmeasured baseline; a missing uncovered list reads as unmeasured', () => {
    expect(parseBaseline('{"failing": null, "uncovered": null}', 'b.json')).toEqual({ failing: null, uncovered: null });
    expect(parseBaseline('{"failing": null}', 'b.json')).toEqual({ failing: null, uncovered: null });
    expect(parseBaseline('{"failing": {"TagsRepository.listByUser": 2}, "uncovered": ["A.b"]}', 'b.json')).toEqual({
      failing: { 'TagsRepository.listByUser': 2 },
      uncovered: ['A.b'],
    });
    expect(parseBaseline('{"failing": {}}', 'b.json')).toEqual({ failing: {}, uncovered: null });
  });

  it('PGPROBE-002: refuses a malformed baseline instead of reading it as empty', () => {
    expect(() => parseBaseline('nope', 'b.json')).toThrow(/b.json is not valid JSON/);
    expect(() => parseBaseline('{}', 'b.json')).toThrow(/"failing" key/);
    expect(() => parseBaseline('[]', 'b.json')).toThrow(/"failing" key/);
    expect(() => parseBaseline('{"failing": []}', 'b.json')).toThrow(/null or an object/);
    expect(() => parseBaseline('{"failing": {"listByUser": 1}}', 'b.json')).toThrow(/not a Class.method key/);
    expect(() => parseBaseline('{"failing": {"A.b": 0}}', 'b.json')).toThrow(/expected a positive integer/);
    expect(() => parseBaseline('{"failing": {"A.b": 1.5}}', 'b.json')).toThrow(/expected a positive integer/);
    expect(() => parseBaseline('{"failing": {}, "uncovered": {}}', 'b.json')).toThrow(
      /"uncovered" must be null or an array/,
    );
    expect(() => parseBaseline('{"failing": {}, "uncovered": ["nodot"]}', 'b.json')).toThrow(
      /expected a Class.method name/,
    );
    expect(() => parseBaseline('{"failing": {}, "uncovered": [1]}', 'b.json')).toThrow(/expected a Class.method name/);
    expect(() => parseBaseline('{"failing": {}, "uncovered": ["A.b", "A.b"]}', 'b.json')).toThrow(/lists A.b twice/);
  });

  it('PGPROBE-003: an unmeasured baseline (either part null) is flagged instead of compared', () => {
    const flagged = { unseeded: true, grown: [], stale: [], newlyUncovered: [], nowCovered: [] };
    expect(compareWithBaseline({ failing: null, uncovered: null }, now({ 'A.b': 3 }), new Set(['C.d']))).toEqual(
      flagged,
    );
    expect(compareWithBaseline({ failing: { 'A.b': 1 }, uncovered: null }, now({ 'A.b': 3 }), none)).toEqual(flagged);
    expect(compareWithBaseline({ failing: null, uncovered: [] }, now({ 'A.b': 3 }), none)).toEqual(flagged);
  });

  it('PGPROBE-004: a method failing more statements than its entry (or any without one) fails', () => {
    const verdict = compareWithBaseline(
      { failing: { 'A.b': 1 }, uncovered: [] },
      now({ 'A.b': 2, 'C.d': 1, 'E.f': 0 }),
      none,
    );
    expect(verdict.grown).toEqual([
      { method: 'A.b', allowed: 1, now: 2 },
      { method: 'C.d', allowed: 0, now: 1 },
    ]);
    expect(verdict.stale).toEqual([]);
  });

  it('PGPROBE-005: an entry above what its method fails now is stale, also when the method is gone', () => {
    const verdict = compareWithBaseline(
      { failing: { 'A.b': 2, 'Gone.away': 1 }, uncovered: [] },
      now({ 'A.b': 1 }),
      none,
    );
    expect(verdict.grown).toEqual([]);
    expect(verdict.stale).toEqual([
      { method: 'A.b', allowed: 2, now: 1 },
      { method: 'Gone.away', allowed: 1, now: 0 },
    ]);
  });

  it('PGPROBE-009: a method the probe did not measure must be listed, and a listed method measured now or gone is stale', () => {
    const verdict = compareWithBaseline(
      { failing: {}, uncovered: ['Kept.out', 'Now.measured', 'Gone.away'] },
      now({ 'Now.measured': 0 }),
      new Set(['Kept.out', 'New.callback', 'Old.throws']),
    );
    expect(verdict).toEqual({
      unseeded: false,
      grown: [],
      stale: [],
      newlyUncovered: ['New.callback', 'Old.throws'],
      nowCovered: ['Gone.away', 'Now.measured'],
    });
    expect(compareWithBaseline({ failing: {}, uncovered: ['A.b'] }, now({}), new Set(['A.b']))).toMatchObject({
      newlyUncovered: [],
      nowCovered: [],
    });
  });

  it('PGPROBE-006: --update lowers and drops entries but never raises or adds one, in either part', () => {
    const lowered = lowerBaseline(
      { failing: { 'A.b': 2, 'C.d': 1, 'Gone.away': 1 }, uncovered: ['Kept.out', 'Now.measured'] },
      now({ 'A.b': 1, 'C.d': 5, 'New.one': 3 }),
      new Set(['Kept.out', 'New.callback']),
    );
    expect(lowered).toEqual({ failing: { 'A.b': 1, 'C.d': 1 }, uncovered: ['Kept.out'] });
  });

  it('PGPROBE-007: the first --update seeds an unmeasured baseline with what fails and what went unmeasured, sorted', () => {
    expect(
      lowerBaseline({ failing: null, uncovered: null }, now({ 'Z.z': 1, 'A.a': 2, 'M.m': 0 }), new Set(['Y.y', 'B.b'])),
    ).toEqual({
      failing: { 'A.a': 2, 'Z.z': 1 },
      uncovered: ['B.b', 'Y.y'],
    });
    expect(
      lowerBaseline({ failing: { 'A.a': 3 }, uncovered: null }, now({ 'A.a': 2, 'N.n': 1 }), new Set(['B.b'])),
    ).toEqual({
      failing: { 'A.a': 2 },
      uncovered: ['B.b'],
    });
  });

  it('PGPROBE-010: only syntax and feature errors count toward the ratchet, not data errors from the sample values', () => {
    for (const code of ['42601', '42883', '42804', '42P01', '42703', '0A000'])
      expect(countsTowardRatchet(code)).toBe(true);
    for (const code of ['22P02', '22007', '22008', '23505', '57014', 'NOSQLSTATE'])
      expect(countsTowardRatchet(code)).toBe(false);
  });

  it('PGPROBE-008: the checked-in baseline parses and formats back to itself', () => {
    const file = path.join(__dirname, '../../../../scripts/pg-probe-baseline.json');
    const text = readFileSync(file, 'utf8');
    expect(formatBaseline(parseBaseline(text, file))).toBe(text.replace(/\r\n/g, '\n'));
  });
});
