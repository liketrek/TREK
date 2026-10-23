import { assistantScopeKey, assistantScopeSchema } from './assistant-scope.schema';
import { assistantFocusSchema } from './assistant.schema';

import { describe, expect, it } from 'vitest';

describe('assistantScopeSchema', () => {
  it('ASTSCOPE-001: is a trip or a journey, each by its own positive id', () => {
    expect(assistantScopeSchema.parse({ kind: 'trip', tripId: 5 })).toEqual({ kind: 'trip', tripId: 5 });
    expect(assistantScopeSchema.parse({ kind: 'journey', journeyId: 12 })).toEqual({ kind: 'journey', journeyId: 12 });
    expect(assistantScopeSchema.safeParse({ kind: 'trip', tripId: 0 }).success).toBe(false);
    expect(assistantScopeSchema.safeParse({ kind: 'journey', tripId: 5 }).success).toBe(false);
  });

  it('ASTSCOPE-002: is never both and never anything else', () => {
    expect(assistantScopeSchema.safeParse({ kind: 'trip', tripId: 5, journeyId: 12 }).success).toBe(false);
    expect(assistantScopeSchema.safeParse({ kind: 'collection', collectionId: 3 }).success).toBe(false);
    expect(assistantScopeSchema.safeParse({}).success).toBe(false);
  });

  it('ASTSCOPE-003: keys a trip and a journey with the same id apart', () => {
    expect(assistantScopeKey({ kind: 'trip', tripId: 7 })).toBe('trip:7');
    expect(assistantScopeKey({ kind: 'journey', journeyId: 7 })).toBe('journey:7');
  });
});

describe('assistantFocusSchema in the Studio', () => {
  it('ASTSCOPE-004: carries the page on screen and up to 30 selected elements, by their document ids', () => {
    const focus = { spreadId: 'sp-ab12', elementIds: ['p-1', 'p-2'] };
    expect(assistantFocusSchema.parse(focus)).toEqual(focus);
    expect(assistantFocusSchema.safeParse({ spreadId: 'sp ab' }).success).toBe(false);
    expect(assistantFocusSchema.safeParse({ spreadId: 'x'.repeat(41) }).success).toBe(false);
    const many = Array.from({ length: 31 }, (_, i) => `p-${i}`);
    expect(assistantFocusSchema.safeParse({ elementIds: many }).success).toBe(false);
  });

  it('ASTSCOPE-005: leaves the planner focus as it was', () => {
    expect(assistantFocusSchema.parse({ dayId: 4, placeIds: [1] })).toEqual({ dayId: 4, placeIds: [1] });
    expect(assistantFocusSchema.safeParse({ dayId: 4, page: 2 }).success).toBe(false);
  });
});
