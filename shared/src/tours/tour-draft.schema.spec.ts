import { TOUR_DRAFT_MAX_CHARS, tourDraftPutRequestSchema, tourDraftResponseSchema } from './tour-draft.schema';

import { describe, expect, it } from 'vitest';

describe('tour draft contract', () => {
  it('TDRAFT-SCHEMA-001: takes a draft that is a JSON object and refuses text, arrays, null and broken JSON', () => {
    const payload = JSON.stringify({ version: 11, name: 'Ridge', waypoints: [] });
    expect(tourDraftPutRequestSchema.parse({ payload })).toEqual({ payload });
    for (const bad of ['"ridge"', '[1,2]', 'null', '{not json', '', '{']) {
      expect(tourDraftPutRequestSchema.safeParse({ payload: bad }).success, bad).toBe(false);
    }
    expect(tourDraftPutRequestSchema.safeParse({}).success).toBe(false);
    expect(tourDraftPutRequestSchema.safeParse({ payload: { version: 11 } }).success).toBe(false);
  });

  it('TDRAFT-SCHEMA-002: a draft up to the cap passes, one character more does not', () => {
    const wrap = (filler: number) => `{"name":"${'x'.repeat(filler)}"}`;
    const atCap = wrap(TOUR_DRAFT_MAX_CHARS - wrap(0).length);
    expect(atCap.length).toBe(TOUR_DRAFT_MAX_CHARS);
    expect(tourDraftPutRequestSchema.safeParse({ payload: atCap }).success).toBe(true);
    const past = wrap(TOUR_DRAFT_MAX_CHARS - wrap(0).length + 1);
    expect(tourDraftPutRequestSchema.safeParse({ payload: past }).success).toBe(false);
  });

  it('TDRAFT-SCHEMA-003: answers the draft with its time or null', () => {
    const draft = { payload: '{"version":11}', updated_at: '2026-10-22 09:00:00' };
    expect(tourDraftResponseSchema.parse({ draft })).toEqual({ draft });
    expect(tourDraftResponseSchema.parse({ draft: null })).toEqual({ draft: null });
    expect(tourDraftResponseSchema.safeParse({}).success).toBe(false);
    expect(tourDraftResponseSchema.safeParse({ draft: { payload: '{}' } }).success).toBe(false);
  });
});
