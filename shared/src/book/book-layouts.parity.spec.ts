import { BOOK_GRIDS, bookGridElements, defaultBookGridBox } from './book-grids';
import { BOOK_COVER_TEMPLATES, BOOK_TEMPLATES, applyBookTemplate, type BookTemplate } from './book-layouts';
import { normalizeBookDocument } from './book-normalize';
import {
  applySavedBookLayout,
  bookLayoutFromSpread,
  bookLayoutPreview,
  bookLayoutRole,
  nextBookLayoutName,
} from './book-saved-layouts';
import type { BookDocument } from './book.schema';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The layout code moved here from the Studio (templates, grids, saved layouts)
 * still lays pages out exactly as the Studio's own copy did.
 *
 * `book-layouts.parity.json` holds a digest of every result the old client
 * functions gave on the three books in `book-layouts.parity-books.json` (every
 * layout on every page, a layout over a layout so the parked pictures come
 * back, every grid in both boxes, every saved layout, the layout a page saves
 * as and its preview), taken from the client code before it was deleted. Ids
 * the call mints are random and read as `#new`; everything else must match to
 * the hundredth of a millimetre. A deliberate change to a layout changes its
 * digests: say so in the change and write the new ones.
 */

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

const books = (
  JSON.parse(readFileSync(here('./book-layouts.parity-books.json'), 'utf8')) as { books: Record<string, unknown> }
).books;
const expected = JSON.parse(readFileSync(here('./book-layouts.parity.json'), 'utf8')) as Record<string, string>;

function canonical(value: unknown, known: Set<string>): string {
  const walk = (v: unknown, key?: string): unknown => {
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(o)
          .sort()
          .map((k) => [k, walk(o[k], k)]),
      );
    }
    if (key === 'id' && typeof v === 'string' && !known.has(v)) return '#new';
    return v;
  };
  return JSON.stringify(walk(value));
}

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

const template = (id: string): BookTemplate =>
  [...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES].find((t) => t.id === id) as BookTemplate;

function knownIds(doc: BookDocument): Set<string> {
  const known = new Set<string>();
  for (const s of doc.spreads) {
    known.add(s.id);
    for (const e of [...s.elements, ...s.parked]) known.add(e.id);
  }
  for (const l of doc.layouts ?? []) {
    known.add(l.id);
    for (const e of l.elements) known.add(e.id);
  }
  return known;
}

function cases(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, input] of Object.entries(books)) {
    const doc = normalizeBookDocument(input);
    const known = knownIds(doc);
    const put = (key: string, v: unknown) => out.set(`${name}/${key}`, canonical(v, known));
    const apply = (s: (typeof doc.spreads)[number], id: string) => applyBookTemplate(s, template(id), doc.page);
    for (const s of doc.spreads) {
      const set = s.role === 'inner' ? BOOK_TEMPLATES : BOOK_COVER_TEMPLATES;
      for (const t of set) put(`${s.id}/template/${t.id}`, apply(s, t.id));
      const [empty, full] = s.role === 'inner' ? ['quiet-text', 'grid-9'] : ['cover-quiet', 'cover-full'];
      put(`${s.id}/chain/${empty}+${full}`, apply(apply(s, empty as string), full as string));
      put(`${s.id}/layoutFromSpread`, bookLayoutFromSpread(s, doc.page, 'L'));
      put(`${s.id}/layoutRole`, bookLayoutRole(s));
      for (const l of doc.layouts ?? []) {
        if (l.role === bookLayoutRole(s)) put(`${s.id}/saved/${l.id}`, applySavedBookLayout(s, l, doc.page));
      }
    }
    for (const g of BOOK_GRIDS) {
      put(`grid/${g.id}/spread`, bookGridElements(g, defaultBookGridBox(doc.page, false), 3, 0));
      put(`grid/${g.id}/single`, bookGridElements(g, defaultBookGridBox(doc.page, true), 6, 2));
    }
    for (const l of doc.layouts ?? []) put(`preview/${l.id}`, bookLayoutPreview(l, doc.page));
    put('nextLayoutName', nextBookLayoutName(doc.layouts ?? [], 'Layout'));
  }
  return out;
}

describe('the layout code moved from the Studio', () => {
  const actual = cases();

  it('BOOKPAR-001: covers the same cases the client code was measured on', () => {
    expect([...actual.keys()].sort()).toEqual(Object.keys(expected).sort());
    expect(actual.size).toBeGreaterThan(400);
  });

  it('BOOKPAR-002: lays out every fixture page exactly as the client code did', () => {
    const differ = [...actual].filter(([key, value]) => expected[key] !== digest(value)).map(([key]) => key);
    expect(differ).toEqual([]);
  });
});
