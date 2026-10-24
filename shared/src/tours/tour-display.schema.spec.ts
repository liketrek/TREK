import { includeGeometryFlagSchema, TOUR_DISPLAY_LINE_POINTS } from './tour-display.schema';

import { describe, expect, it } from 'vitest';

describe('the line a planning tool adds for drawing', () => {
  it('TOUR-DISPLAY-001: is asked for with a yes or a no, or left out, and says so to a model', () => {
    expect(includeGeometryFlagSchema.parse(true)).toBe(true);
    expect(includeGeometryFlagSchema.parse(false)).toBe(false);
    expect(includeGeometryFlagSchema.parse(undefined)).toBeUndefined();
    expect(includeGeometryFlagSchema.safeParse('true').success).toBe(false);
    expect(includeGeometryFlagSchema.description).toContain('line_geometry');
    expect(TOUR_DISPLAY_LINE_POINTS).toBe(300);
  });
});
