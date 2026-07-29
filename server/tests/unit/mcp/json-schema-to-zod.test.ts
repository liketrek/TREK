/**
 * A plugin ships its tool schema as plain JSON (it lives in another process), but
 * McpServer.registerTool takes Zod. This converter bridges the two, and its bias is
 * PERMISSIVE: the result is what the SDK validates arguments against before the plugin
 * sees them, so a strict reading of a schema it only half-understands would reject
 * calls the plugin would have handled fine.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { jsonSchemaToZodShape } from '../../../src/mcp/json-schema-to-zod';

/** Parse through the object the SDK would build from the shape. */
const parse = (schema: unknown, input: unknown) => {
  const shape = jsonSchemaToZodShape(schema);
  if (!shape) throw new Error('expected a shape');
  return z.object(shape as z.ZodRawShape).safeParse(input);
};

describe('jsonSchemaToZodShape', () => {
  it('converts the primitive types', () => {
    const schema = {
      type: 'object',
      properties: { s: { type: 'string' }, n: { type: 'number' }, i: { type: 'integer' }, b: { type: 'boolean' } },
      required: ['s', 'n', 'i', 'b'],
    };
    expect(parse(schema, { s: 'x', n: 1.5, i: 2, b: true }).success).toBe(true);
    expect(parse(schema, { s: 1, n: 1.5, i: 2, b: true }).success).toBe(false);
    expect(parse(schema, { s: 'x', n: 1.5, i: 2.5, b: true }).success).toBe(false); // integer
  });

  it('makes anything outside `required` optional', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['a'] };
    expect(parse(schema, { a: 'x' }).success).toBe(true);
    expect(parse(schema, { b: 'x' }).success).toBe(false); // a is required
  });

  it('treats a missing `required` as everything-optional', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' } } };
    expect(parse(schema, {}).success).toBe(true);
  });

  it('handles arrays, including arrays of objects', () => {
    const schema = {
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
      required: ['tags'],
    };
    expect(parse(schema, { tags: ['a', 'b'] }).success).toBe(true);
    expect(parse(schema, { tags: [1] }).success).toBe(false);
    // An array with no `items` accepts anything.
    expect(parse({ type: 'object', properties: { x: { type: 'array' } }, required: ['x'] }, { x: [1, 'a'] }).success).toBe(true);
  });

  it('handles string enums and ignores non-string ones', () => {
    const en = { type: 'object', properties: { mode: { enum: ['fast', 'slow'] } }, required: ['mode'] };
    expect(parse(en, { mode: 'fast' }).success).toBe(true);
    expect(parse(en, { mode: 'other' }).success).toBe(false);
    // A mixed enum is unconstrained rather than rejected.
    const mixed = { type: 'object', properties: { m: { enum: [1, 'a'] } }, required: ['m'] };
    expect(parse(mixed, { m: 1 }).success).toBe(true);
  });

  it('recurses into nested objects and keeps their required-ness', () => {
    const schema = {
      type: 'object',
      properties: {
        who: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      },
      required: ['who'],
    };
    expect(parse(schema, { who: { name: 'ada' } }).success).toBe(true);
    expect(parse(schema, { who: {} }).success).toBe(false);
  });

  it('keeps a property-less object open instead of stripping it to nothing', () => {
    // z.object({}) would silently drop every key on the way to the handler.
    const schema = { type: 'object', properties: { bag: { type: 'object' } }, required: ['bag'] };
    const out = parse(schema, { bag: { anything: 1, nested: { deep: true } } });
    expect(out.success).toBe(true);
    expect(out.success && out.data.bag).toEqual({ anything: 1, nested: { deep: true } });
  });

  it('advertises unrecognized constructs as unconstrained rather than rejecting them', () => {
    const schema = {
      type: 'object',
      properties: {
        ref: { $ref: '#/definitions/Thing' },
        union: { type: ['string', 'null'] },
        any: {},
      },
      required: ['ref', 'union', 'any'],
    };
    expect(parse(schema, { ref: { a: 1 }, union: null, any: 'whatever' }).success).toBe(true);
  });

  it('carries property descriptions through — the model reads them', () => {
    const shape = jsonSchemaToZodShape({
      type: 'object',
      properties: { q: { type: 'string', description: 'What to search for' } },
      required: ['q'],
    });
    expect(z.toJSONSchema(z.object(shape as z.ZodRawShape))).toMatchObject({
      properties: { q: { description: 'What to search for' } },
    });
  });

  it('returns undefined for anything that is not a usable object schema', () => {
    for (const raw of [undefined, null, 'nope', 42, [], {}, { type: 'string' }, { type: 'object' }, { type: 'object', properties: {} }]) {
      expect(jsonSchemaToZodShape(raw)).toBeUndefined();
    }
  });

  it('bounds hostile input — deep nesting degrades to unconstrained instead of recursing forever', () => {
    let node: Record<string, unknown> = { type: 'string' };
    for (let i = 0; i < 40; i++) node = { type: 'object', properties: { next: node }, required: ['next'] };
    const shape = jsonSchemaToZodShape(node);
    expect(shape).toBeDefined();
    const object = z.object(shape as z.ZodRawShape);

    // Everything below the depth ceiling is z.unknown(), so a value nested far deeper
    // than the converter ever walked is accepted wholesale rather than blowing the stack.
    let deep: unknown = 'leaf';
    for (let i = 0; i < 40; i++) deep = { next: deep };
    expect(object.safeParse(deep).success).toBe(true);

    // …while the levels it DID walk are still real schemas.
    expect(object.safeParse({ next: 'too shallow' }).success).toBe(false);
  });

  it('caps the number of properties it will convert', () => {
    const properties: Record<string, unknown> = {};
    for (let i = 0; i < 200; i++) properties[`p${i}`] = { type: 'string' };
    const shape = jsonSchemaToZodShape({ type: 'object', properties });
    expect(Object.keys(shape!).length).toBe(64);
  });
});
