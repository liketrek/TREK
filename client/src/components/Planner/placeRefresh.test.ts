// FE-PLANNER-REFRESH-001 to FE-PLANNER-REFRESH-007
import { describe, expect, it } from 'vitest';
import { DEFAULT_FORM, type PlaceFormData } from './PlaceFormModal.helpers';
import { refreshCandidates } from './placeRefresh';

const form = (over: Partial<PlaceFormData> = {}): PlaceFormData => ({ ...DEFAULT_FORM, ...over });

// Mo-Fr 10:30-20:00, as the details lookup hands periods out (day 0 is Sunday).
const PERIODS = [1, 2, 3, 4, 5].map((day) => ({
  open: { day, hour: 10, minute: 30 },
  close: { day, hour: 20, minute: 0 },
}));

describe('refreshCandidates', () => {
  it('FE-PLANNER-REFRESH-001: an empty field the lookup fills is offered and ticked', () => {
    const got = refreshCandidates(form(), { phone: '+49 381 87398063', website: 'www.thao-vinh.de' });
    expect(got).toEqual([
      expect.objectContaining({ field: 'website', current: '', preselected: true }),
      expect.objectContaining({ field: 'phone', current: '', next: '+49 381 87398063', preselected: true }),
    ]);
    expect(got[0]?.next).toMatch(/^https:\/\/www\.thao-vinh\.de\/?$/);
  });

  it('FE-PLANNER-REFRESH-002: a value the person has is offered only when it differs, and not ticked', () => {
    const got = refreshCandidates(form({ phone: '0381 1111' }), { phone: '+49 381 2222' });
    expect(got).toEqual([{ field: 'phone', current: '0381 1111', next: '+49 381 2222', preselected: false }]);
  });

  it('FE-PLANNER-REFRESH-003: the same value in another spelling is no difference', () => {
    expect(
      refreshCandidates(
        form({ phone: '+49 381 873 98 063', website: 'https://www.helgas-kitchen.de/', email: 'Info@Luna.de' }),
        {
          phone: '+4938187398063',
          website: 'https://www.helgas-kitchen.de',
          email: 'info@luna.de',
        }
      )
    ).toEqual([]);
  });

  it('FE-PLANNER-REFRESH-004: hours come as the stored week, and the same week is no difference', () => {
    const [hours] = refreshCandidates(form(), { opening_periods: PERIODS });
    expect(hours?.field).toBe('opening_hours');
    expect(JSON.parse(hours?.next ?? '[]')).toHaveLength(7);
    expect(refreshCandidates(form({ opening_hours: hours?.next }), { opening_periods: PERIODS })).toEqual([]);
  });

  it('FE-PLANNER-REFRESH-006: a description comes from the index object or the OSM summary', () => {
    const text = 'An Asian restaurant in Evershagen.';
    expect(refreshCandidates(form(), { description: { text, source: 'community' } })).toEqual([
      { field: 'description', current: '', next: text, preselected: true },
    ]);
    expect(refreshCandidates(form(), { summary: text, summary_source: 'community' })).toEqual([
      { field: 'description', current: '', next: text, preselected: true },
    ]);
  });

  it('FE-PLANNER-REFRESH-007: the same description under the editor markup is no difference', () => {
    const text = 'An Asian restaurant in Evershagen.';
    expect(refreshCandidates(form({ description: `<p>${text}</p>` }), { summary: text })).toEqual([]);
    expect(refreshCandidates(form({ description: 'Our favourite.' }), { summary: text })).toEqual([
      { field: 'description', current: 'Our favourite.', next: text, preselected: false },
    ]);
  });

  it('FE-PLANNER-REFRESH-005: what the lookup does not know is never offered, so nothing is emptied', () => {
    expect(refreshCandidates(form({ phone: '0381 1111', website: 'https://a.example' }), {})).toEqual([]);
    expect(refreshCandidates(form(), null)).toEqual([]);
  });
});
