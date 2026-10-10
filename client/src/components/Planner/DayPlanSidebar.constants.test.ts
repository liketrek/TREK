// FE-PLANNER-NOTELIMIT-001: the detail limit both day note editors count against.
import { describe, expect, it } from 'vitest';

import { DAY_NOTE_DETAIL_MAX, dayNoteNearLimit } from './DayPlanSidebar.constants';

describe('day note detail limit', () => {
  it('FE-PLANNER-NOTELIMIT-001: the counter warns from a hundred characters before the limit', () => {
    expect(DAY_NOTE_DETAIL_MAX).toBe(2000);
    expect(dayNoteNearLimit(1899)).toBe(false);
    expect(dayNoteNearLimit(1900)).toBe(true);
    expect(dayNoteNearLimit(2000)).toBe(true);
  });
});
