import type { BookDocument, BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import { BOOK_STICKERS } from '../stickers/sticker-catalogue';
import { designBook, type BookDesignInput, type BookDesignResult } from './design-book';
import type { BookDesignDirectivesInput } from './design-directives.schema';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * `pages.overrides` (design-overrides.ts): a page of the plan given another
 * beat is composed again from its own photos, in its place and under its id,
 * the rest of the design untouched; another layout is laid by the page edit's
 * own `layout` operation with ids from the design's counter; what cannot be
 * done is said in the notes and the page stays as designed.
 */

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as {
  rich: { input: BookDesignInput };
};

function input(): BookDesignInput {
  let n = 0;
  return { ...fixtures.rich.input, newId: (p) => `${p}-${++n}`, stickers: BOOK_STICKERS };
}

const design = (directives: BookDesignDirectivesInput, doc: BookDocument | null = null): BookDesignResult =>
  designBook(doc, input(), directives);

const STYLE = { style: 'riviera' } as const;
const photoIds = (s: BookSpread | undefined) =>
  (s?.elements ?? [])
    .flatMap((e) => (e.kind === 'photo' && e.photoId != null ? [e.photoId] : []))
    .sort((a, b) => a - b);

const base = design(STYLE);
/** The first page of photos only, a duo: no story, two photos. */
const duo = base.plan.find((r) => r.beat === 'duo');
/** The first page that sets a story. */
const story = base.plan.find((r) => r.beat === 'opener');

describe('page overrides', () => {
  it('DSNOVR-001: composes a page again as the beat asked, in its place, under its id, from its own photos', () => {
    expect(duo).toBeDefined();
    const at = duo?.index ?? 0;
    const r = design({ ...STYLE, pages: { overrides: [{ index: at, beat: 'stamp-row' }] } });
    const page = r.doc.spreads[at];
    expect(r.plan[at]?.beat).toBe('stamp-row');
    expect(page?.id).toBe(base.doc.spreads[at]?.id);
    expect(photoIds(page)).toEqual(photoIds(base.doc.spreads[at]));
    const photos = (page?.elements ?? []).filter((e) => e.kind === 'photo');
    expect(photos.every((e) => e.kind === 'photo' && e.edge === 'perforated')).toBe(true);
    // Themed and repaired like every designed page, and nothing else of the design moves.
    expect(
      pageFindings(page as BookSpread, r.doc.page, fixtures.rich.input.photos).filter((f) => f.severity !== 'info'),
    ).toEqual([]);
    expect(r.plan[at]?.findings).toEqual({ severe: 0, warn: 0 });
    r.doc.spreads.forEach((s, i) => {
      if (i !== at) expect(JSON.stringify(s)).toBe(JSON.stringify(base.doc.spreads[i]));
    });
    expect(r.notes).toEqual(base.notes);
  });

  it('DSNOVR-002: lays a page out on the layout asked through the layout operation, with ids of the design', () => {
    const at = duo?.index ?? 0;
    const r = design({ ...STYLE, pages: { overrides: [{ index: at, template: 'two-up' }] } });
    const page = r.doc.spreads[at] as BookSpread;
    expect(photoIds(page)).toEqual(photoIds(base.doc.spreads[at]));
    expect(page.elements.every((e) => /^[a-z]+-\d+$/.test(e.id))).toBe(true);
    expect(r.plan[at]?.beat).toBe('duo');
    expect(JSON.stringify(design({ ...STYLE, pages: { overrides: [{ index: at, template: 'two-up' }] } }).doc)).toBe(
      JSON.stringify(r.doc),
    );
  });

  it('DSNOVR-003: says why it leaves a page as designed: a story, a single page, too few photos, a kept page', () => {
    const last = base.doc.spreads.length - 2;
    const at = duo?.index ?? 0;
    const r = design({
      ...STYLE,
      pages: {
        overrides: [
          { index: story?.index ?? 0, beat: 'collage' },
          { index: last, beat: 'duo' },
          { index: at, beat: 'grid' },
        ],
      },
    });
    expect(r.notes).toEqual([
      `page ${story?.index} sets a story, which a collage page does not, so it stays as designed`,
      `page ${last} is not a double page of the design, so its override is left out`,
      `page ${at} holds 2 photos, too few for a grid page`,
    ]);
    expect(JSON.stringify(r.doc)).toBe(JSON.stringify(base.doc));

    const stored = structuredClone(base.doc);
    const locked = stored.spreads[at] as BookSpread;
    stored.spreads[at] = { ...locked, elements: locked.elements.map((e, i) => (i === 0 ? { ...e, locked: true } : e)) };
    const kept = design({ ...STYLE, pages: { overrides: [{ index: at, beat: 'collage' }] } }, stored);
    expect(kept.plan[at]?.action).toBe('keep');
    expect(kept.notes).toContain(`page ${at} is kept as it was, so its override is left out`);
  });
});
