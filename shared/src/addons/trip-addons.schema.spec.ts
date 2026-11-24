import { tripAddonIdSchema, tripAddonUpdateRequestSchema, tripAddonsResponseSchema } from './trip-addons.schema';

import { describe, expect, it } from 'vitest';

describe('trip addon contracts', () => {
  it('TRIPADDON-SCHEMA-001: the update body takes on, off or null and nothing else', () => {
    expect(tripAddonUpdateRequestSchema.parse({ enabled: true })).toEqual({ enabled: true });
    expect(tripAddonUpdateRequestSchema.parse({ enabled: false })).toEqual({ enabled: false });
    expect(tripAddonUpdateRequestSchema.parse({ enabled: null })).toEqual({ enabled: null });
    expect(tripAddonUpdateRequestSchema.safeParse({}).success).toBe(false);
    expect(tripAddonUpdateRequestSchema.safeParse({ enabled: 1 }).success).toBe(false);
    expect(tripAddonUpdateRequestSchema.safeParse({ enabled: 'true' }).success).toBe(false);
    expect(tripAddonUpdateRequestSchema.safeParse({ enabled: true, extra: 1 }).success).toBe(false);
  });

  it('TRIPADDON-SCHEMA-002: an addon id is a lower-case word', () => {
    expect(tripAddonIdSchema.safeParse('packing').success).toBe(true);
    expect(tripAddonIdSchema.safeParse('naver_list_import').success).toBe(true);
    expect(tripAddonIdSchema.safeParse('').success).toBe(false);
    expect(tripAddonIdSchema.safeParse('Packing').success).toBe(false);
    expect(tripAddonIdSchema.safeParse('../x').success).toBe(false);
    expect(tripAddonIdSchema.safeParse('a'.repeat(65)).success).toBe(false);
  });

  it('TRIPADDON-SCHEMA-003: the response lists each addon with its effective and instance state', () => {
    const body = {
      tripId: 4,
      addons: [
        { id: 'budget', name: 'Costs', icon: 'Wallet', enabled: false, instanceEnabled: true, overridden: true },
      ],
    };
    expect(tripAddonsResponseSchema.parse(body)).toEqual(body);
    expect(tripAddonsResponseSchema.safeParse({ tripId: 4, addons: [{ id: 'budget' }] }).success).toBe(false);
    expect(tripAddonsResponseSchema.safeParse({ tripId: 0, addons: [] }).success).toBe(false);
  });
});
