import { looseOutput } from './loose-output';
import * as outputs from './mcp-tool-output.schema';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const outputSchemas = Object.entries(outputs as Record<string, unknown>).flatMap(([name, value]) =>
  name.endsWith('OutputSchema') && value instanceof z.ZodType ? [[name, value] as [string, z.ZodType]] : [],
);

describe('MCP tool output schemas', () => {
  it('declares at least the read tools of the first slice', () => {
    expect(outputSchemas.length).toBeGreaterThanOrEqual(9);
  });

  it.each(outputSchemas)('%s renders without a closed object', (_name, schema) => {
    const json = JSON.stringify(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' }));
    expect(json).not.toContain('"additionalProperties":false');
  });
});

describe('looseOutput', () => {
  const schema = looseOutput(
    z.object({
      rows: z.array(z.object({ id: z.number(), tag: z.string().nullable().optional() })),
      byKey: z.record(z.string(), z.object({ n: z.number() })),
      either: z.union([z.object({ a: z.string() }), z.object({ b: z.number() })]),
    }),
  );

  it('lets an extra key through at every depth', () => {
    const parsed = schema.safeParse({
      rows: [{ id: 1, extra: true }],
      byKey: { x: { n: 1, more: 'yes' } },
      either: { a: 'x', other: 1 },
      top: 'level',
    });
    expect(parsed.success).toBe(true);
  });

  it('still refuses a declared key of another type', () => {
    expect(schema.safeParse({ rows: [{ id: 'one' }], byKey: {}, either: { a: 'x' } }).success).toBe(false);
    expect(schema.safeParse({ rows: [], byKey: { x: { n: 'no' } }, either: { a: 'x' } }).success).toBe(false);
  });

  it('keeps optionals, nullables and descriptions', () => {
    const described = looseOutput(z.object({ a: z.string() }).describe('A thing.'));
    expect(described.description).toBe('A thing.');
    expect(schema.safeParse({ rows: [{ id: 1, tag: null }], byKey: {}, either: { b: 2 } }).success).toBe(true);
  });
});
