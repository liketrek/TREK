/**
 * zodToOpenApi (#1412): Zod → OpenAPI 3.0 conversion + the degrade path.
 * The end-to-end enricher behaviour is covered by tests/integration/api-docs.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToOpenApi } from '../../../src/nest/common/api-zod';

describe('zodToOpenApi', () => {
  it('converts an object schema with required/optional split', () => {
    const out = zodToOpenApi(z.object({ name: z.string(), count: z.number().optional() })) as {
      type: string; properties: Record<string, unknown>; required: string[];
    };
    expect(out.type).toBe('object');
    expect(out.properties.name).toEqual({ type: 'string' });
    expect(out.properties.count).toEqual({ type: 'number' });
    expect(out.required).toEqual(['name']);
  });

  it('survives transform-heavy schemas via unrepresentable: any', () => {
    const out = zodToOpenApi(z.object({ when: z.string().transform((s) => new Date(s)) }));
    expect((out as { type: string }).type).toBe('object');
  });

  it('degrades to a bare object instead of throwing on a broken schema', () => {
    expect(zodToOpenApi({} as never)).toEqual({ type: 'object' });
  });
});
