import { looseOutput } from './loose-output';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Pins what looseOutput reads from Zod's definition object, so a Zod upgrade
// that moves it fails here rather than quietly closing or loosening a schema.
describe('looseOutput', () => {
  it('opens objects all the way down, through arrays, optionals, nullables, defaults, records and unions', () => {
    const row = z.object({ id: z.number() });
    const schema = looseOutput(
      z.object({
        list: z.array(row),
        maybe: row.optional(),
        none: row.nullable(),
        fallback: row.default({ id: 0 }),
        byKey: z.record(z.string(), row),
        either: z.union([row, z.string()]),
      }),
    );
    const extra = { id: 1, extra: true };
    const value = { list: [extra], maybe: extra, none: extra, fallback: extra, byKey: { a: extra }, either: extra };
    expect(schema.parse({ ...value, more: 1 })).toMatchObject({ list: [{ extra: true }], more: 1 });
    expect(schema.parse({ ...value, fallback: undefined }).fallback).toEqual({ id: 0 });
    expect(schema.safeParse({ ...value, list: [{ id: 'one' }] }).success).toBe(false);
  });

  it('keeps the checks and the description of what it rebuilds', () => {
    const schema = looseOutput(
      z
        .array(z.object({ id: z.number() }))
        .min(1)
        .max(2)
        .describe('Rows'),
    );
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([{ id: 1 }, { id: 2 }, { id: 3 }]).success).toBe(false);
    expect(schema.safeParse([{ id: 1, more: true }]).success).toBe(true);
    expect(schema.description).toBe('Rows');
  });

  it('returns a kind it does not rebuild as it is', () => {
    const scalar = z.string().min(2);
    expect(looseOutput(scalar)).toBe(scalar);
  });
});
