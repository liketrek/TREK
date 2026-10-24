import { TourSourceHintsReason, TourSourceHintsState } from '../../../src/db/entities/TourSourceHints.entity';
import { tourSourceHintReasonSchema, tourSourceHintStateSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

/**
 * WAN-02: a hint's state and reason are CHECK lists (migration 046120) the
 * entity carries as enums, and the contract holds its own. A value one side
 * knows and the other refuses would be a hint the watch can find and the
 * database cannot store, or one stored that the answer cannot describe.
 */
describe('wanderer source hint columns match the contract', () => {
  it('TOURHINTCOL-001: knows the same states as the hint contract', () => {
    expect(Object.values(TourSourceHintsState).sort()).toEqual([...tourSourceHintStateSchema.options].sort());
  });

  it('TOURHINTCOL-002: knows the same reasons as the hint contract', () => {
    expect(Object.values(TourSourceHintsReason).sort()).toEqual([...tourSourceHintReasonSchema.options].sort());
  });
});
