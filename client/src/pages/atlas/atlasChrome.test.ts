import { describe, expect, it } from 'vitest';
import { chromeFitPadding, chromePan } from './atlasChrome';

// FE-ATLAS-CHROME-001 onwards: the atlas camera beside the touch shell's rail and header.

describe('atlas chrome insets', () => {
  it('FE-ATLAS-CHROME-001: nothing covering the map leaves the opening view alone', () => {
    expect(chromePan(undefined, -80, false)).toBeNull();
    expect(chromePan({ top: 0, start: 0 }, 40, false)).toBeNull();
    // A tall window: the far north is already below the header.
    expect(chromePan({ top: 62, start: 0 }, 83, false)).toBeNull();
  });

  it('FE-ATLAS-CHROME-002: the world moves away from the rail, in either reading direction', () => {
    expect(chromePan({ top: 62, start: 100 }, 83, false)).toEqual([-50, 0]);
    expect(chromePan({ top: 62, start: 100 }, 83, true)).toEqual([50, 0]);
  });

  it('FE-ATLAS-CHROME-004: on a short window the far north comes down from under the header, just as far as it needs', () => {
    expect(chromePan({ top: 62, start: 0 }, -77, false)).toEqual([0, -139]);
  });

  it("FE-ATLAS-CHROME-003: a country is framed clear of the rail's side and the header", () => {
    expect(chromeFitPadding({ top: 62, start: 100 }, false)).toEqual({
      paddingTopLeft: [124, 86],
      paddingBottomRight: [24, 24],
    });
    expect(chromeFitPadding({ top: 62, start: 100 }, true)).toEqual({
      paddingTopLeft: [24, 86],
      paddingBottomRight: [124, 24],
    });
    expect(chromeFitPadding(undefined, false)).toEqual({ paddingTopLeft: [24, 24], paddingBottomRight: [24, 24] });
  });
});
