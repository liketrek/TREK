// FE-COMP-VIADWELL-001 to FE-COMP-VIADWELL-002: the dwell label both map renderers put on a route via.
import { describe, expect, it } from 'vitest';

import { formatViaDwell } from './routeViaDwell';

describe('formatViaDwell', () => {
  it('FE-COMP-VIADWELL-001: under an hour reads as minutes, rounded', () => {
    expect(formatViaDwell(0)).toBe('0 min');
    expect(formatViaDwell(25 * 60 + 29)).toBe('25 min');
    expect(formatViaDwell(25 * 60 + 31)).toBe('26 min');
  });

  it('FE-COMP-VIADWELL-002: an hour or more splits the hours off', () => {
    expect(formatViaDwell(3600)).toBe('1 h 0 min');
    expect(formatViaDwell(2 * 3600 + 15 * 60)).toBe('2 h 15 min');
  });
});
