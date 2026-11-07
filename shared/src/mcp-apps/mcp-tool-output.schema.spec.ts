import { budgetItemSchema } from '../budget/budget.schema';
import { daySchema } from '../day/day.schema';
import { placeSchema } from '../place/place.schema';
import { tripSchema } from '../trip/trip.schema';
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

describe('rows declared for a view', () => {
  // The views' rows list the fields they draw rather than reuse a route's row, which would
  // make every one of them optional. Each field still has to be one the route's row names,
  // so a column renamed on the route cannot be read here under its old name.
  const keysOf = (schema: z.ZodType) => Object.keys((schema as unknown as z.ZodObject).shape);
  // The last entry of each case is what the tool works out itself, so the route has no such field.
  const cases: Array<[string, z.ZodType, z.ZodObject, string[]]> = [
    ['get_trip_overview trip', outputs.tripOverviewOutputSchema.shape.trip, tripSchema, []],
    ['get_trip_overview day', outputs.tripOverviewOutputSchema.shape.days.element, daySchema, ['stops']],
    ['get_day_plan day', outputs.dayPlanOutputSchema.shape.day, daySchema, []],
    ['get_trip_map place', outputs.tripMapPlaceSchema, placeSchema, []],
    [
      'list_budget_items item',
      outputs.listBudgetItemsOutputSchema.shape.items.element,
      budgetItemSchema,
      ['trip_amount'],
    ],
  ];

  it.each(cases)('%s names only fields of the route row', (_name, row, source, computed) => {
    const extra = keysOf(row).filter((key) => !computed.includes(key) && !(key in source.shape));
    expect(extra).toEqual([]);
  });
});
