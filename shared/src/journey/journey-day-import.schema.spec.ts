import { journeyDayImportProblem, journeyDayImportRequestSchema } from './journey-day-import.schema';

import { describe, expect, it } from 'vitest';

const single = (suggestionId: number, name?: string) => ({
  kind: 'single' as const,
  stays: [name ? { suggestionId, name } : { suggestionId }],
});

describe('journeyDayImportRequestSchema', () => {
  it('JRNDAY-SCHEMA-001: single stays, a merged pair and a report with a chosen or no position', () => {
    const parsed = journeyDayImportRequestSchema.safeParse({
      groups: [
        single(1, ' Markusplatz '),
        { kind: 'merged', stays: [{ suggestionId: 2 }, { suggestionId: 3 }], title: 'Rialto', anchorSuggestionId: 3 },
        {
          kind: 'report',
          stays: [{ suggestionId: 4 }, { suggestionId: 5 }],
          title: 'Giudecca',
          anchorSuggestionId: null,
        },
      ],
      skipSuggestionIds: [6],
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.groups[0]?.stays[0]?.name).toBe('Markusplatz');
  });

  it('JRNDAY-SCHEMA-002: refuses an empty take-over, a blank name and an unknown kind', () => {
    expect(journeyDayImportRequestSchema.safeParse({ groups: [] }).success).toBe(false);
    expect(journeyDayImportRequestSchema.safeParse({ groups: [single(1, '   ')] }).success).toBe(false);
    expect(
      journeyDayImportRequestSchema.safeParse({ groups: [{ kind: 'all', stays: [{ suggestionId: 1 }] }] }).success,
    ).toBe(false);
  });

  it('JRNDAY-SCHEMA-003: carries the structural refusal as its message', () => {
    const parsed = journeyDayImportRequestSchema.safeParse({ groups: [single(1), single(1)] });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('stay_twice');
  });
});

describe('journeyDayImportProblem', () => {
  it('JRNDAY-SCHEMA-004: a single holds one stay, a merged or report entry two and a title', () => {
    expect(
      journeyDayImportProblem({ groups: [{ kind: 'single', stays: [{ suggestionId: 1 }, { suggestionId: 2 }] }] }),
    ).toBe('single_takes_one_stay');
    expect(journeyDayImportProblem({ groups: [{ kind: 'merged', stays: [{ suggestionId: 1 }], title: 'A' }] })).toBe(
      'group_needs_two_stays',
    );
    expect(
      journeyDayImportProblem({ groups: [{ kind: 'report', stays: [{ suggestionId: 1 }, { suggestionId: 2 }] }] }),
    ).toBe('group_needs_title');
  });

  it('JRNDAY-SCHEMA-005: the position is a stay of the group, and only a report may go without one', () => {
    const stays = [{ suggestionId: 1 }, { suggestionId: 2 }];
    expect(journeyDayImportProblem({ groups: [{ kind: 'merged', stays, title: 'A', anchorSuggestionId: 9 }] })).toBe(
      'anchor_not_in_group',
    );
    expect(journeyDayImportProblem({ groups: [{ kind: 'merged', stays, title: 'A', anchorSuggestionId: null }] })).toBe(
      'position_required',
    );
    expect(
      journeyDayImportProblem({ groups: [{ kind: 'report', stays, title: 'A', anchorSuggestionId: null }] }),
    ).toBeNull();
  });

  it('JRNDAY-SCHEMA-006: a stay goes into one group or the skipped list, never two places', () => {
    expect(journeyDayImportProblem({ groups: [single(1)], skipSuggestionIds: [1] })).toBe('stay_twice');
    expect(journeyDayImportProblem({ groups: [single(1)], skipSuggestionIds: [2, 2] })).toBe('stay_twice');
    expect(journeyDayImportProblem({ groups: [single(1), single(2)], skipSuggestionIds: [3] })).toBeNull();
  });
});
