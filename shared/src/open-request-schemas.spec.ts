/**
 * The open-shape ratchet over the request contracts (scripts/open-request-schemas.mjs).
 * The CLI checks the built dist/ in CI; this spec runs the same walk over src/
 * so `npm test` fails too, and proves the walker sees every kind of open shape
 * and fails on one a schema did not have before.
 */
import { compare, countOpenShapes, lowerBaseline, openShapes, readBaseline } from '../scripts/open-request-schemas.mjs';
import * as contracts from './index';

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('open request schemas', () => {
  it('OPEN-001: no request schema holds more open shapes than the baseline allows', () => {
    const counts = countOpenShapes(contracts);
    const { grown } = compare(readBaseline(), counts);
    expect(grown, 'type the fields instead of accepting any object, see shared/CLAUDE.md').toEqual([]);
  });

  it('OPEN-002: the baseline names only schemas that exist and are still open', () => {
    const counts = countOpenShapes(contracts);
    const { lowerable } = compare(readBaseline(), counts);
    expect(lowerable, 'run `npm run contracts:open -- --update` after narrowing a schema').toEqual([]);
  });

  it('OPEN-003: finds every kind of open shape, wherever it sits', () => {
    expect(openShapes(z.record(z.string(), z.unknown()))).toEqual(['record@$']);
    expect(openShapes(z.looseObject({ a: z.string() }))).toEqual(['loose@$']);
    expect(openShapes(z.object({ a: z.string() }).passthrough())).toEqual(['loose@$']);
    expect(openShapes(z.object({ a: z.unknown().optional(), b: z.any() }))).toEqual(['unknown@$.a', 'unknown@$.b']);
    expect(openShapes(z.unknown())).toEqual(['unknown@$']);
    const open = z.record(z.string(), z.unknown());
    expect(openShapes(open.and(z.object({ name: z.string() })))).toEqual(['record@$']);
    expect(openShapes(z.array(z.object({ meta: z.record(z.string(), z.any()) })))).toEqual(['record@$.meta']);
    expect(openShapes(z.union([z.string(), z.object({ x: z.unknown() })]))).toEqual(['unknown@$|1.x']);
    expect(openShapes(z.object({ x: z.unknown() }).nullable().default(null))).toEqual(['unknown@$.x']);
    expect(openShapes(z.object({ a: z.map(z.string(), z.unknown()), b: z.set(z.any()) }))).toEqual([
      'unknown@$.a{}',
      'unknown@$.b',
    ]);
    expect(openShapes(z.object({ a: z.custom<string>(), b: z.instanceof(Date) }))).toEqual([
      'custom@$.a',
      'custom@$.b',
    ]);
  });

  it('OPEN-003b: one open node reused across fields counts at every path it sits at', () => {
    const anything = z.unknown().optional();
    expect(openShapes(z.object({ a: anything, b: anything, c: anything, d: anything }))).toHaveLength(4);
    const meta = z.record(z.string(), z.unknown());
    expect(openShapes(z.object({ x: meta, y: z.array(meta) }))).toEqual(['record@$.x', 'record@$.y']);
    // Both sides of an intersection naming the same open field still count it once.
    const left = z.object({ x: z.unknown() });
    expect(openShapes(left.and(z.object({ x: z.unknown() })))).toEqual(['unknown@$.x']);
  });

  it('OPEN-003c: a recursive schema is walked once per level and terminates', () => {
    type Node = { meta?: unknown; children: Node[] };
    const node: z.ZodType<Node> = z.lazy(() => z.object({ meta: z.unknown().optional(), children: z.array(node) }));
    expect(openShapes(node)).toEqual(['unknown@$.meta']);
  });

  it('OPEN-004: a closed schema counts nothing', () => {
    expect(openShapes(z.object({ a: z.string(), b: z.array(z.number()) }))).toEqual([]);
    expect(openShapes(z.strictObject({ a: z.string() }))).toEqual([]);
    expect(openShapes(z.record(z.string(), z.number()))).toEqual([]);
  });

  it('OPEN-005: fails on a new open schema and on an existing one that opens further', () => {
    const namespace = {
      fooRequestSchema: z.object({ a: z.string() }),
      barRequestSchema: z.looseObject({ b: z.unknown() }),
      notARequest: z.unknown(),
    };
    const counts = countOpenShapes(namespace);
    expect(counts).toEqual({ barRequestSchema: 2, fooRequestSchema: 0 });

    const grownNew = compare({}, counts);
    expect(grownNew.grown).toEqual([['barRequestSchema', 2]]);
    const grownMore = compare({ barRequestSchema: 1 }, counts);
    expect(grownMore.grown).toEqual([['barRequestSchema', 2]]);
    expect(compare({ barRequestSchema: 2 }, counts).grown).toEqual([]);
  });

  it('OPEN-006: lowering never raises or adds an entry and drops the ones that closed', () => {
    expect(lowerBaseline({ a: 3, b: 2, c: 1 }, { a: 1, b: 5, c: 0, d: 4 })).toEqual({ a: 1, b: 2 });
  });

  it('OPEN-007: a missing or malformed baseline is an error, never an empty baseline', () => {
    expect(() => readBaseline('/definitely/not/here.json')).toThrow(/cannot be read/);
    // Valid JSON, but not a map of schema names to counts.
    expect(() => readBaseline(fileURLToPath(new URL('../package.json', import.meta.url)))).toThrow(
      /expected a whole number/,
    );
  });
});
