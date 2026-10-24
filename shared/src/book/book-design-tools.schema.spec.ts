import {
  BOOK_DESIGN_LIMITS,
  applyBookDesignRequestSchema,
  bookDesignAnswerSchema,
  bookDesignApplyResultSchema,
  bookDesignDraftResponseSchema,
  bookDesignSelectionRequestSchema,
  designBookRequestSchema,
  restoreBookLayoutRequestSchema,
  restoreBookRevisionRequestSchema,
  reviseBookDesignRequestSchema,
} from './book-design-tools.schema';
import { removeBookLayoutRequestSchema, setBookSetupRequestSchema } from './book-ops.schema';
import { blankBook } from './book-pages';

import { describe, expect, it } from 'vitest';

// BKDTOOL-001 to BKDTOOL-006

const row = {
  spreadId: 'sp-1',
  index: 0,
  action: 'replace',
  beat: 'cover',
  chapter: null,
  entryId: null,
  photoIds: [3],
  findings: { severe: 0, warn: 1 },
};

const answer = {
  design_id: 'd-1',
  journey_id: 4,
  base_version: 7,
  expires_at: '2026-10-22T18:00:00.000Z',
  plan: [row],
  more_rows: 0,
  selected: ['sp-1'],
  style: { style: 'minimal', paper: '#ffffff', ink: '#1a1a1a', accent: '#336699', heading: 'inter', body: 'inter' },
  photos: { used: 3, left_out: [{ photoId: 9, reason: 'near_duplicate' }], left_out_more: 0 },
  findings: [],
  notes: ['the book holds 150 spreads'],
};

describe('the design tools', () => {
  it('BKDTOOL-001: design_book takes no directives or bounded ones, and nothing it does not know', () => {
    expect(designBookRequestSchema.parse({}).directives).toBeUndefined();
    const parsed = designBookRequestSchema.parse({ directives: { style: 'editorial', pages: { max: 12 } } });
    expect(parsed.directives).toMatchObject({ style: 'editorial', density: 'balanced', keep: 'locked' });
    expect(designBookRequestSchema.safeParse({ directives: { mood: 'calm' } }).success).toBe(false);
    expect(designBookRequestSchema.safeParse({ journeyId: 3 }).success).toBe(false);
  });

  it('BKDTOOL-002: a revision names its draft and page and takes the ops edit_book_page takes', () => {
    const ops = [{ op: 'background', color: '#f4efe6' }];
    expect(reviseBookDesignRequestSchema.safeParse({ designId: 'd-1', spreadId: 'sp-1', ops }).success).toBe(true);
    expect(reviseBookDesignRequestSchema.safeParse({ designId: 'd-1', spreadId: 'sp-1', ops: [] }).success).toBe(false);
    expect(reviseBookDesignRequestSchema.safeParse({ designId: '../d', spreadId: 'sp-1', ops }).success).toBe(false);
    expect(applyBookDesignRequestSchema.safeParse({ designId: 'd-1' }).success).toBe(true);
    expect(applyBookDesignRequestSchema.safeParse({ designId: 'd-1', expectedVersion: -1 }).success).toBe(false);
  });

  it('BKDTOOL-003: the undo targets name what they put back and the version they need', () => {
    expect(restoreBookRevisionRequestSchema.safeParse({ revisionId: 3, expectedVersion: 8 }).success).toBe(true);
    expect(restoreBookRevisionRequestSchema.safeParse({ revisionId: 3 }).success).toBe(false);
    const layout = { layout: '{"id":"ly-1"}', expectedVersion: 2 };
    expect(restoreBookLayoutRequestSchema.safeParse(layout).success).toBe(true);
    expect(restoreBookLayoutRequestSchema.safeParse({ layout: '', expectedVersion: 2 }).success).toBe(false);
    expect(setBookSetupRequestSchema.safeParse({ safe: 6, expectedVersion: 4 }).success).toBe(true);
    expect(removeBookLayoutRequestSchema.safeParse({ layoutId: 'ly-1', expectedVersion: 4 }).success).toBe(true);
  });

  it('BKDTOOL-004: the selection is a closed list of page ids, as long as a book and its drops', () => {
    const ids = Array.from({ length: BOOK_DESIGN_LIMITS.selection }, (_, i) => `sp-${i}`);
    expect(bookDesignSelectionRequestSchema.safeParse({ spreadIds: ids }).success).toBe(true);
    expect(bookDesignSelectionRequestSchema.safeParse({ spreadIds: [...ids, 'sp-x'] }).success).toBe(false);
    expect(bookDesignSelectionRequestSchema.safeParse({ spreadIds: ['sp 1'] }).success).toBe(false);
    expect(bookDesignSelectionRequestSchema.safeParse({ spreadIds: [], all: true }).success).toBe(false);
  });

  it('BKDTOOL-005: a design answer reads as itself, its plan rows bounded', () => {
    expect(bookDesignAnswerSchema.parse(answer)).toEqual(answer);
    const long = { ...answer, plan: [{ ...row, chapter: 'x'.repeat(81) }] };
    expect(bookDesignAnswerSchema.safeParse(long).success).toBe(false);
    const draft = { designId: 'd-1', baseVersion: null, expiresAt: answer.expires_at, plan: [row], selection: [] };
    const response = { ...draft, document: blankBook({ title: 'Lisbon' }) };
    expect(bookDesignDraftResponseSchema.safeParse(response).success).toBe(true);
  });

  it('BKDTOOL-006: an apply answers a book write with its revision (none for a new book) and the pages applied and left', () => {
    const write = { version: 8, spread_ids: ['sp-1'], pages: [], findings: [], dropped: [] };
    const applied = { ...write, design_id: 'd-1', revision_id: 12, applied: ['sp-1'], skipped: [] };
    expect(bookDesignApplyResultSchema.safeParse(applied).success).toBe(true);
    expect(bookDesignApplyResultSchema.safeParse({ ...applied, revision_id: null }).success).toBe(true);
    const skipped = [{ spreadId: 'sp-2', reason: 'changed_since' }];
    expect(bookDesignApplyResultSchema.safeParse({ ...applied, skipped }).success).toBe(true);
    const unknown = [{ spreadId: 'sp-2', reason: 'tired' }];
    expect(bookDesignApplyResultSchema.safeParse({ ...applied, skipped: unknown }).success).toBe(false);
  });
});
