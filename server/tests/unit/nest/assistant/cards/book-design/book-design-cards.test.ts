/**
 * ASTBD-001 to ASTBD-008
 *
 * The whole-book design in the Studio's chat: the draft's card beside
 * design_book's answer, the same card under the held apply read from the
 * draft (none once it is gone), the receipt with the revision and the pages
 * left, each held to the shared union and MAX_CARD_CHARS even for a long
 * plan; the verbs and words of the book-level changes; the way back from
 * each; the arguments the model never sets; the tools in the journey group;
 * and the designer's rules in the Studio's standing instructions.
 */
import { BOOK_DESIGN_PROMPT } from '../../../../../../src/nest/assistant/assistant-book-design.prompt';
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { ASSISTANT_TOOL_GROUPS } from '../../../../../../src/nest/assistant/assistant-tool-offer';
import { studioPrompt } from '../../../../../../src/nest/assistant/assistant.prompt';
import { BOOK_DESIGN_CARDS } from '../../../../../../src/nest/assistant/cards/book-design';
import { designCard, loadDesign } from '../../../../../../src/nest/assistant/cards/book-design/book-design-card';
import type { PreviewContext, UndoSnapshot } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_ARG_POLICY,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  changeCardOf,
  describedOf,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import {
  bookDesignCardSchema,
  MAX_CARD_CHARS,
  type AssistantChangePreview,
  type BookDesignAnswer,
  type BookDesignCard,
} from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const ctx: PreviewContext = {
  card: buildTripCard(0, 7, null, null, null),
  categories: new Map(),
  locale: 'en',
  today: '2026-10-22',
  airport: () => null,
};

/** A draft's answer with `pages` plan rows, the first a cover. */
function draft(pages = 4): BookDesignAnswer {
  return {
    design_id: 'd-1',
    journey_id: 3,
    base_version: 7,
    expires_at: '2026-10-22T18:00:00.000Z',
    plan: Array.from({ length: pages }, (_, i): BookDesignAnswer['plan'][number] => ({
      spreadId: `sp-${i}`,
      index: i,
      action: i === 0 ? 'replace' : 'insert',
      beat: i === 0 ? 'cover' : 'opener',
      chapter: i === 0 ? null : `A rather long chapter title for page ${i} of the journey, longer than a card shows`,
      entryId: i === 0 ? null : i,
      photoIds: [i + 1, i + 2],
      findings: { severe: 0, warn: i % 2 },
    })),
    more_rows: 0,
    selected: ['sp-0', 'sp-1'],
    style: {
      style: 'editorial',
      paper: '#faf8f4',
      ink: '#1a1a1a',
      accent: '#b45309',
      heading: 'playfair',
      body: 'garamond',
    },
    photos: { used: 9, left_out: [{ photoId: 40, reason: 'near_duplicate' }], left_out_more: 2 },
    findings: [],
    notes: [],
  };
}

const answerOf = (value: unknown) => ({ toolCallId: 'c1', args: {}, value, card: ctx.card, today: ctx.today });

describe('the design card', () => {
  it('ASTBD-001: design_book and get_book_design answer with the draft, nothing proposed yet', () => {
    const card = answerCardOf('design_book', answerOf(draft())) as BookDesignCard;
    expect(bookDesignCardSchema.parse(card)).toEqual(card);
    expect(card).toMatchObject({ change: 'none', journeyId: 3, designId: 'd-1', baseVersion: 7, style: 'editorial' });
    expect(card).toMatchObject({ heading: 'playfair', body: 'garamond', leftOut: 3, more: 0, revisionId: null });
    expect(card.spreads[1]).toMatchObject({ spreadId: 'sp-1', action: 'insert', photoCount: 2, warn: 1 });
    expect(card.spreads[1]?.chapter?.length).toBeLessThanOrEqual(40);
    expect(answerCardOf('get_book_design', answerOf(draft()))?.kind).toBe('bookDesign');
    expect(answerCardOf('design_book', answerOf({ design_id: 'nope' }))).toBeNull();
  });

  it('ASTBD-002: a long plan is cut to what a card holds, the rest counted', () => {
    const card = designCard({ ...draft(150), more_rows: 30 }, 'none');
    expect(JSON.stringify(card).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(card.spreads.length).toBeLessThanOrEqual(120);
    expect(card.spreads.length + card.more).toBe(180);
    expect(bookDesignCardSchema.safeParse(card).success).toBe(true);
  });

  it('ASTBD-003: the held apply shows the draft as a proposal, read through get_book_design; none once it is gone', async () => {
    const read = vi.fn(async () => draft());
    const loaded = await loadDesign({ designId: 'd-1' }, read);
    expect(read).toHaveBeenCalledWith('get_book_design', { designId: 'd-1' });
    const card = changeCardOf('apply_book_design', ctx, { designId: 'd-1' }, loaded);
    expect(card).toMatchObject({ kind: 'bookDesign', change: 'proposed', designId: 'd-1' });
    const words = describedOf('apply_book_design', ctx, {}, loaded)?.rows.rows;
    expect(words?.map((r) => [r.labelKey, r.after])).toEqual([
      ['type', 'editorial'],
      ['quantity', '2'],
    ]);

    const gone = await loadDesign({ designId: 'd-1' }, async () => null);
    expect(changeCardOf('apply_book_design', ctx, {}, gone)).toBeNull();
    expect(await loadDesign({}, read)).toEqual({ draft: null });
    expect(describedOf('apply_book_design', ctx, {}, gone)?.rows.rows).toEqual([]);
  });

  it('ASTBD-004: the receipt names the revision the undo restores and the pages the apply left', () => {
    const held = designCard(draft(), 'proposed');
    const preview = { card: held } as AssistantChangePreview;
    const result = {
      version: 8,
      revision_id: 12,
      skipped: [
        { spreadId: 'sp-1', reason: 'changed_since' },
        { spreadId: 'bad id!', reason: 'excluded' },
      ],
    };
    const receipt = appliedCardOf('apply_book_design', { args: {}, result, preview });
    expect(receipt).toMatchObject({ change: 'applied', baseVersion: 8, revisionId: 12 });
    expect((receipt as BookDesignCard).skipped).toEqual([{ spreadId: 'sp-1', reason: 'changed_since' }]);
    const noBook = appliedCardOf('apply_book_design', { args: {}, result: { revision_id: null }, preview });
    expect(noBook).toMatchObject({ revisionId: null, baseVersion: 7, skipped: [] });
    expect(appliedCardOf('apply_book_design', { args: {}, result, preview: null })).toBeNull();
  });
});

describe('the book-level changes', () => {
  it('ASTBD-005: each is a curated change of a book page with its verb, and the model never sets the version an undo pins', () => {
    expect(ASSISTANT_WRITE_TOOLS.apply_book_design).toEqual({ verbKey: 'designBook', entity: 'book_page' });
    expect(ASSISTANT_WRITE_TOOLS.set_book_setup?.verbKey).toBe('setBookSetup');
    expect(ASSISTANT_WRITE_TOOLS.duplicate_book_page?.verbKey).toBe('duplicateBookPage');
    expect(ASSISTANT_WRITE_TOOLS.save_book_layout?.verbKey).toBe('saveBookLayout');
    expect(ASSISTANT_WRITE_TOOLS.remove_book_layout?.verbKey).toBe('removeBookLayout');
    for (const tool of ['apply_book_design', 'set_book_setup', 'remove_book_layout']) {
      expect(ASSISTANT_ARG_POLICY[tool]?.stripped).toEqual(['expectedVersion']);
    }
    const format = { preset: 'a4-portrait', pageNumbers: { position: 'centre' } };
    expect(describedOf('set_book_setup', ctx, format, null)?.rows.rows.map((r) => [r.labelKey, r.after])).toEqual([
      ['type', 'a4-portrait'],
      ['position', 'centre'],
    ]);
    expect(describedOf('save_book_layout', ctx, { name: 'Two photos' }, null)?.rows.rows[0]?.after).toBe('Two photos');
    expect(describedOf('remove_book_layout', ctx, { layoutId: 'ly-1' }, null)?.rows.rows[0]?.after).toBe('ly-1');
    expect(describedOf('duplicate_book_page', ctx, {}, null)?.rows.rows).toEqual([]);
    expect(ASSISTANT_TOOL_GROUPS.journey?.controllers).toContain('JourneyBookDesignMcp');
    expect(BOOK_DESIGN_CARDS.tools.design_book?.write).toBeUndefined();
  });

  it('ASTBD-006: an applied design goes back to its revision at the version it left; none without a revision', () => {
    const undo = ASSISTANT_UNDO_MAP.apply_book_design;
    expect(undo?.tool).toBe('restore_book_revision');
    expect(undo?.args({}, { revision_id: 12, version: 8 }, null)).toEqual({ revisionId: 12, expectedVersion: 8 });
    expect(undo?.args({}, { revision_id: null, version: 8 }, null)).toBeNull();
    const check = BOOK_DESIGN_CARDS.tools.apply_book_design?.undo;
    const snapshot: UndoSnapshot = { summary: null, places: null, reads: new Map() };
    expect(check?.unchanged({ revision_id: 12, version: 8 }, snapshot)).toBe(true);
    expect(check?.unchanged({ version: 8 }, snapshot)).toBe(false);
  });

  it('ASTBD-007: the format, a kept layout, a removed layout and a copied page go back while the book is unmoved', () => {
    const previous = {
      preset: 'square-210',
      pageWidth: 210,
      pageHeight: 210,
      bleed: 3,
      safe: 5,
      pageNumbers: { show: false, startAt: 2, position: 'outer', margin: 12, size: 8, autoColor: true },
    };
    const setup = ASSISTANT_UNDO_MAP.set_book_setup;
    const back = setup?.args({}, { version: 4, previous_setup: previous }, null);
    expect(back).toEqual({ ...previous, expectedVersion: 4 });
    expect(setup?.args({}, { version: 4 }, null)).toBeNull();
    expect(undoReadsOf('set_book_setup', {}, {})).toEqual([{ tool: 'get_book', args: {} }]);
    const at = (version: number): UndoSnapshot => ({
      summary: null,
      places: null,
      reads: new Map([[readKey('get_book', {}), { version }]]),
    });
    const setupCheck = BOOK_DESIGN_CARDS.tools.set_book_setup?.undo;
    expect([setupCheck?.unchanged({ version: 4 }, at(4)), setupCheck?.unchanged({ version: 4 }, at(5))]).toEqual([
      true,
      false,
    ]);

    const saved = ASSISTANT_UNDO_MAP.save_book_layout;
    expect(saved?.args({}, { version: 4, layout_id: 'ly-9' }, null)).toEqual({ layoutId: 'ly-9', expectedVersion: 4 });
    expect(saved?.args({}, { version: 4 }, null)).toBeNull();

    const layout = { id: 'ly-9', name: 'Two', role: 'inner', pageWidth: 210, pageHeight: 210, elements: [] };
    const removed = ASSISTANT_UNDO_MAP.remove_book_layout;
    expect(removed?.tool).toBe('restore_book_layout');
    expect(removed?.args({}, { version: 4, previous_layout: layout }, null)).toEqual({
      layout: JSON.stringify(layout),
      expectedVersion: 4,
    });
    expect(removed?.args({}, { version: 4 }, null)).toBeNull();
    const layoutCheck = BOOK_DESIGN_CARDS.tools.remove_book_layout?.undo;
    expect(layoutCheck?.unchanged({ version: 4, previous_layout: layout }, at(4))).toBe(true);

    const copied = ASSISTANT_UNDO_MAP.duplicate_book_page;
    expect(copied?.tool).toBe('delete_book_pages');
    expect(copied?.args({}, { version: 4, spread_ids: ['sp-copy'] }, null)).toEqual({
      spreadIds: ['sp-copy'],
      expectedVersion: 4,
    });
  });
});

describe('the designer in the Studio', () => {
  it('ASTBD-008: the Studio instructions end with the design rules, cache-stable and without dashes', () => {
    const prompt = studioPrompt('German', true);
    expect(prompt.endsWith(BOOK_DESIGN_PROMPT)).toBe(true);
    // The print rules, the energy, the type scale and the critique, on a budget the cache carries every turn.
    expect(BOOK_DESIGN_PROMPT.split('\n').length).toBeLessThanOrEqual(30);
    expect(BOOK_DESIGN_PROMPT.length).toBeLessThan(6000);
    for (const tool of ['design_book', 'revise_book_design', 'apply_book_design', 'preview_book_page']) {
      expect(BOOK_DESIGN_PROMPT).toContain(tool);
    }
    expect(BOOK_DESIGN_PROMPT).not.toMatch(/[\u2013\u2014]/);
    expect(studioPrompt('German', true)).toBe(prompt);
  });

  it('ASTBD-009: restraint is one energy among three, beside print rules that hold for every book', () => {
    for (const rule of ['200 dpi', 'fold', 'trim', 'bleed', 'binding', 'safe area']) {
      expect(BOOK_DESIGN_PROMPT, rule).toContain(rule);
    }
    for (const energy of ['- Calm:', '- Lively:', '- Loud:']) expect(BOOK_DESIGN_PROMPT).toContain(energy);
    expect(BOOK_DESIGN_PROMPT).toContain('A deliberate overlap is a design');
  });

  it('ASTBD-010: gives the type scale in numbers against the page, and the critique to answer before a proposal', () => {
    for (const figure of ['72 to 180 pt', '12 to 30 % of the page height', 'at least 3:1', 'Body 9 to 11 pt']) {
      expect(BOOK_DESIGN_PROMPT, figure).toContain(figure);
    }
    expect(BOOK_DESIGN_PROMPT).toContain('captions 6.5 to 8 pt');
    // The cover tier carries a big title alone, and the faces named are faces the book has.
    expect(BOOK_DESIGN_PROMPT).toContain('type.display (up to 6.5');
    expect(BOOK_DESIGN_PROMPT).toContain('type.scale between 0.9 and 1.1');
    expect(BOOK_DESIGN_PROMPT).not.toMatch(/script/i);
    expect(BOOK_DESIGN_PROMPT).toContain('210 mm page and scaled with the page width');
    const rubric = BOOK_DESIGN_PROMPT.slice(BOOK_DESIGN_PROMPT.indexOf('answer silently'));
    expect(rubric.slice(0, rubric.indexOf('Fix what fails')).match(/\?/g)).toHaveLength(8);
    expect(BOOK_DESIGN_PROMPT).toContain('preview the cover at least twice');
  });

  it('ASTBD-011: the Studio instructions take a layered page for a design and only an accidental overlap for a fault', () => {
    const prompt = studioPrompt('German', true);
    expect(prompt).toContain('photos or texts overlapping by accident');
    expect(prompt).toContain('a layered page (a title over a photo, a turned photo over a shape) is a design');
  });
});
