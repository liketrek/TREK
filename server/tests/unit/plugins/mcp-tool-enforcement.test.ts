/**
 * The advertised schema is the enforced schema — MCPENF-001 to MCPENF-010.
 *
 * `.meta()` shows the model the plugin's declaration verbatim. The SDK contract,
 * and every client, read that as "arguments are validated before the handler
 * runs". An earlier version advertised types, enums, ranges and
 * `additionalProperties: false` while accepting literally anything, which is
 * the worst of both: the model formats its call to a contract nothing checks.
 */
import {
  McpToolSchemaError,
  buildToolInputSchema,
  normaliseToolSchema,
} from '../../../src/nest/plugins/mcp-tool-schema';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const build = (declared: unknown) =>
  buildToolInputSchema(normaliseToolSchema(declared)) as unknown as z.ZodType;

const advertised = (declared: unknown) =>
  z.toJSONSchema(buildToolInputSchema(normaliseToolSchema(declared)) as unknown as z.ZodType, {
    io: 'input',
  }) as Record<string, unknown>;

const strictSchema = {
  type: 'object',
  properties: {
    days: { type: 'integer', minimum: 1, maximum: 14 },
    mode: { type: 'string', enum: ['fast', 'slow'] },
    email: { type: 'string', format: 'email' },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
  required: ['days'],
  additionalProperties: false,
};

describe('enforcement matches the advertisement', () => {
  it('MCPENF-001: rejects a value of the wrong type', () => {
    expect(build(strictSchema).safeParse({ days: 'seven' }).success).toBe(false);
  });

  it('MCPENF-002: rejects a value outside the declared range', () => {
    expect(build(strictSchema).safeParse({ days: 999 }).success).toBe(false);
    expect(build(strictSchema).safeParse({ days: 7 }).success).toBe(true);
  });

  it('MCPENF-003: rejects a value outside the declared enum', () => {
    expect(build(strictSchema).safeParse({ days: 3, mode: 'teleport' }).success).toBe(false);
    expect(build(strictSchema).safeParse({ days: 3, mode: 'fast' }).success).toBe(true);
  });

  it('MCPENF-004: honours additionalProperties: false', () => {
    expect(build(strictSchema).safeParse({ days: 3, surprise: true }).success).toBe(false);
  });

  it('MCPENF-005: still enforces required', () => {
    expect(build(strictSchema).safeParse({ mode: 'fast' }).success).toBe(false);
  });

  it('MCPENF-006: enforces string formats and array bounds', () => {
    expect(build(strictSchema).safeParse({ days: 1, email: 'nope' }).success).toBe(false);
    expect(build(strictSchema).safeParse({ days: 1, email: 'a@b.co' }).success).toBe(true);
    expect(build(strictSchema).safeParse({ days: 1, tags: ['a', 'b', 'c', 'd'] }).success).toBe(false);
  });

  it('MCPENF-007: an open object still accepts extra keys', () => {
    // additionalProperties is absent, so the plugin may accept more than it
    // advertises. That is a choice the declaration makes, not an accident.
    const open = { type: 'object', properties: { a: { type: 'string' } } };
    expect(build(open).safeParse({ a: 'x', extra: 1 }).success).toBe(true);
  });

  it('MCPENF-008: the advertisement is still the plugin declaration verbatim', () => {
    // Enforcement must not have cost us the reason we advertise .meta() at all.
    const out = advertised(strictSchema);
    expect(out.properties).toEqual(strictSchema.properties);
    expect(out.required).toEqual(['days']);
    expect(out.additionalProperties).toBe(false);
  });
});

describe('unenforceable declarations are refused, not advertised', () => {
  it('MCPENF-009: rejects keywords the validator cannot express', () => {
    // oneOf/anyOf/allOf/not would otherwise reach the model and bind nothing.
    for (const keyword of ['oneOf', 'anyOf', 'allOf', 'not', 'patternProperties']) {
      const schema = { type: 'object', properties: { a: { [keyword]: [{ type: 'string' }] } } };
      expect(() => build(schema), keyword).toThrow(McpToolSchemaError);
    }
  });

  it('MCPENF-010: rejects an unsupported type, format, or broken pattern', () => {
    expect(() => build({ type: 'object', properties: { a: { type: 'bigint' } } })).toThrow(/unsupported type/);
    expect(() => build({ type: 'object', properties: { a: { type: 'string', format: 'ipv6' } } })).toThrow(/unsupported format/);
    expect(() => build({ type: 'object', properties: { a: { type: 'string', pattern: '([' } } })).toThrow(/regular expression/);
  });
});
