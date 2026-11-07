/**
 * FE-UTIL-FLOW-001 to FE-UTIL-FLOW-003
 *
 * "A → B" as one string that reads in the direction of the UI.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { flowText, isRtlDocument } from './flowText';

const FSI = '⁨';
const PDI = '⁩';

describe('flowText', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('FE-UTIL-FLOW-001: a left-to-right UI gets the plain arrow between the names', () => {
    expect(flowText(['Sam Carter', 'Ada'], false)).toBe('Sam Carter → Ada');
    expect(flowText(['Kyoto', 'Osaka', 'Nara'], false)).toBe('Kyoto → Osaka → Nara');
  });

  it('FE-UTIL-FLOW-002: in Arabic each name is isolated and the arrow points left, from the first to the second', () => {
    expect(flowText(['Sam Carter', 'أنت'], true)).toBe(`${FSI}Sam Carter${PDI} ← ${FSI}أنت${PDI}`);
  });

  it('FE-UTIL-FLOW-003: without an explicit direction it follows the document', () => {
    expect(isRtlDocument()).toBe(false);
    expect(flowText(['A', 'B'])).toBe('A → B');
    document.documentElement.dir = 'rtl';
    expect(isRtlDocument()).toBe(true);
    expect(flowText(['A', 'B'])).toBe(`${FSI}A${PDI} ← ${FSI}B${PDI}`);
  });
});
