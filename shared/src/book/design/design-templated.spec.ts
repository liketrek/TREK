import type { AutoEntry, AutoInput, AutoPhoto } from '../auto/auto-types';
import { normalizeBookDocument } from '../book-normalize';
import { MAX_SPREAD_ELEMENTS, bookDocumentSchema, type BookDocument, type BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import { findDecoratedTemplate } from '../templates/template-catalogue';
import { templatePhotoSlots } from '../templates/template-format';
import { matchDecoratedTemplate } from '../templates/template-match';
import { bookThemeColor, bookThemeOf } from '../theme/book-theme';
import { applyBookTheme } from '../theme/book-theme-apply';
import { designBook, type BookDesignInput, type BookDesignResult } from './design-book';
import type { BookDesignDirectivesInput } from './design-directives.schema';
import { ARCHETYPE_KIN, THEME_ARCHETYPE } from './design-template-pick';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * A book laid on the designed templates (`layouts: 'templates'`): the
 * Studio's Auto layout and `design_book` with the templates.
 *
 * AUTODSN-020 pins a digest of every page on the auto layout's three parity
 * journeys and on a fourth (`design-templated.parity-inputs.json`: entries of
 * 0, 1, 2, 3, 5, 12 and 20 photos and a gallery), in three themes. A
 * deliberate change to a layout changes its digests: say so in the change
 * and write the new ones (the failure prints the whole map as it is now).
 */

interface Fixture {
  input: AutoInput & Partial<BookDesignInput>;
  gallery?: AutoPhoto[];
}

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const read = <T>(file: string) => JSON.parse(readFileSync(here(file), 'utf8')) as T;
const parity = {
  ...read<Record<string, Fixture>>('../auto/auto-layout.parity-inputs.json'),
  ...read<Record<string, Fixture>>('./design-templated.parity-inputs.json'),
};
const designFixtures = read<Record<string, { input: BookDesignInput }>>('./design-book.fixtures.json');
const expected = read<Record<string, string>>('./design-templated.parity.json');

/** Every journey the specs lay out, as designBook takes it, with ids from a counter. */
function inputs(): [string, BookDesignInput][] {
  const out: [string, BookDesignInput][] = [];
  for (const [name, fx] of Object.entries(parity)) {
    out.push([name, { ...fx.input, gallery: fx.gallery, candidates: [], photos: [] }]);
  }
  for (const [name, fx] of Object.entries(designFixtures)) out.push([name, fx.input]);
  return out;
}

const counter = () => {
  let n = 0;
  return (p: string) => `${p}-${++n}`;
};

const THEMES = ['fabric-classic', 'riso', 'midnight'] as const;

function laid(input: BookDesignInput, style: string, more: BookDesignDirectivesInput = {}): BookDesignResult {
  const directives = { style, layouts: 'templates', seed: 1, ...more } as BookDesignDirectivesInput;
  return designBook(null, { ...input, newId: counter() }, directives);
}

const photoIdsOn = (spreads: readonly BookSpread[], where: 'elements' | 'parked') =>
  spreads.flatMap((s) => s[where].flatMap((e) => (e.kind === 'photo' && e.photoId != null ? [e.photoId] : [])));

/** Every photo the journey has, on its entries and loose in its gallery. */
const journeyPhotos = (input: BookDesignInput) => [
  ...input.entries.flatMap((e) => e.photos.map((p) => p.photoId)),
  ...(input.gallery ?? []).map((p) => p.photoId),
];

const STORY =
  'The ferry left in the rain and we stood on deck anyway, watching the islands go by one after the other. ';

/** A journey of one entry with this many photos, a story or none. */
function single(photos: number, story: boolean): BookDesignInput {
  const base = parity.A as Fixture;
  const entry: AutoEntry = {
    id: 1,
    title: 'Islands',
    story: story ? STORY.repeat(3).trim() : null,
    location: 'Lofoten',
    date: '2026-06-02',
    photos: Array.from({ length: photos }, (_, i) => ({ photoId: 700 + i, width: 4000, height: 3000 })),
    lat: 68.2,
    lng: 13.6,
    country: 'NO',
    dayNumber: 1,
    dayCount: 1,
  };
  return { ...base.input, entries: [entry], candidates: [], photos: [] };
}

describe('the book on the designed templates', () => {
  it('AUTODSN-001: is a valid book, as normalised, within the element cap', () => {
    for (const [name, input] of inputs()) {
      for (const theme of THEMES) {
        const { doc } = laid(input, theme);
        expect(bookDocumentSchema.safeParse(doc).success, `${name} ${theme}`).toBe(true);
        expect(normalizeBookDocument(doc), `${name} ${theme}`).toEqual(doc);
        for (const s of doc.spreads) expect(s.elements.length).toBeLessThanOrEqual(MAX_SPREAD_ELEMENTS);
      }
    }
  });

  it("AUTODSN-002: the cover is a cover template of the theme's archetype", () => {
    for (const [name, input] of inputs()) {
      for (const theme of THEMES) {
        const result = laid(input, theme);
        const cover = result.doc.spreads[0] as BookSpread;
        const id = result.plan[0]?.template;
        if (!id) continue; // a journey without photos for any of its covers is composed
        expect(findDecoratedTemplate(id)?.archetype, `${name} ${theme}`).toBe(THEME_ARCHETYPE[theme]);
        expect(matchDecoratedTemplate(cover, result.doc.page)?.id, `${name} ${theme}`).toBe(id);
      }
    }
  });

  it('AUTODSN-003: every entry with something to show has a page, in the order of the journey', () => {
    for (const [name, input] of inputs()) {
      const { doc } = laid(input, 'fabric-classic');
      const told = [...new Set(doc.spreads.flatMap((s) => (s.entryId == null ? [] : [s.entryId])))];
      const substance = input.entries.filter((e) => e.photos.length || (e.story ?? '').trim()).map((e) => e.id);
      for (const id of substance) expect(told, `${name} ${id}`).toContain(id);
      const dated = [...input.entries].filter((e) => told.includes(e.id) && e.date);
      const order = told.filter((id) => dated.some((e) => e.id === id));
      const byDate = [...dated].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).map((e) => e.id);
      expect(order, name).toEqual(byDate);
    }
  });

  it('AUTODSN-004: no photo vanishes: it is on a page, parked with one, or said to be left out', () => {
    for (const [name, input] of inputs()) {
      for (const theme of THEMES) {
        const result = laid(input, theme);
        const on = new Set([
          ...photoIdsOn(result.doc.spreads, 'elements'),
          ...photoIdsOn(result.doc.spreads, 'parked'),
        ]);
        const left = new Set(result.photos.left_out.map((l) => l.photoId));
        const lost = journeyPhotos(input).filter((id) => !on.has(id) && !left.has(id));
        expect(lost, `${name} ${theme}`).toEqual([]);
      }
    }
  });

  it('AUTODSN-005: never a classic summary, countries or mark', () => {
    for (const [name, input] of inputs()) {
      for (const theme of THEMES) {
        for (const s of laid(input, theme).doc.spreads) {
          for (const e of s.elements) {
            if (e.kind === 'stats' || e.kind === 'countries') expect(e.look ?? 'classic', name).not.toBe('classic');
            if (e.kind === 'badge') expect(['plain', 'chip'], name).not.toContain(e.style);
          }
        }
      }
    }
  });

  it('AUTODSN-006: is kept in its theme, and another theme recolours the templated pages', () => {
    const input = inputs()[0]?.[1] as BookDesignInput;
    const { doc, plan } = laid(input, 'riso');
    expect(doc.theme?.id).toBe('riso');
    const night = bookThemeOf('midnight');
    const again = applyBookTheme(doc, night);
    const templated = plan.flatMap((r, i) => (r.template ? [i] : []));
    expect(templated.length).toBeGreaterThan(3);
    for (const i of templated) {
      const linked = (again.spreads[i] as BookSpread).elements.filter((e) => e.kind === 'text' && e.token === 'ink');
      for (const e of linked) if (e.kind === 'text') expect(e.color).toBe(bookThemeColor(night, 'ink'));
    }
    expect(again.spreads.some((s, i) => JSON.stringify(s) !== JSON.stringify(doc.spreads[i]))).toBe(true);
  });

  it("AUTODSN-007: titles follow the entry's title and stories its story, a cut story going on over the next page", () => {
    const input = parity.A as Fixture;
    const { doc, notes } = laid({ ...input.input, candidates: [], photos: [] }, 'fabric-classic');
    const pages = doc.spreads.filter((s) => s.entryId != null);
    for (const s of pages) {
      const bound = s.elements.some(
        (e) => e.kind === 'text' && (e.binding?.source === 'entry.title' || e.binding?.source === 'entry.location'),
      );
      expect(bound, s.id).toBe(true);
    }
    const stories = pages.flatMap((s) =>
      s.elements.filter((e) => e.kind === 'text' && e.binding?.source === 'entry.story'),
    );
    expect(stories.length).toBeGreaterThan(0);
    const cut = stories.filter((e) => e.kind === 'text' && e.overridden);
    if (cut.length) expect(notes.some((n) => n.includes('cut to fit'))).toBe(true);
    for (const e of stories) if (e.kind === 'text' && !e.overridden) expect(e.text.length).toBeGreaterThan(0);
  });

  it('AUTODSN-008: an entry of 0 to 20 photos, with a story or none, fills every frame it is laid on', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 20]) {
      for (const story of [false, true]) {
        if (!n && !story) continue;
        const input = single(n, story);
        const result = laid(input, 'fabric-classic');
        const pages = result.doc.spreads.filter((s) => s.entryId === 1);
        expect(pages.length, `${n} ${story}`).toBeGreaterThan(0);
        for (const s of pages) {
          for (const e of s.elements) if (e.kind === 'photo') expect(e.photoId, `${n} ${story}`).not.toBeNull();
        }
        const placed = photoIdsOn(pages, 'elements').length + photoIdsOn(pages, 'parked').length;
        const capped = result.photos.left_out.filter((l) => l.reason === 'chapter_max').length;
        expect(placed + capped, `${n} ${story}`).toBe(n);
        expect(capped).toBe(Math.max(0, n - 12));
        if (story) {
          const told = pages.some((s) =>
            s.elements.some((e) => e.kind === 'text' && e.binding?.source === 'entry.story'),
          );
          expect(told, `${n}`).toBe(true);
        }
      }
    }
  });

  it("AUTODSN-009: the gallery's photos go to the entry of their day first, the rest to closing pages", () => {
    const fx = parity.D as Fixture;
    const input: BookDesignInput = { ...fx.input, gallery: fx.gallery, candidates: [], photos: [] };
    const { doc } = laid(input, 'fabric-classic');
    const of = (entryId: number) =>
      photoIdsOn(
        doc.spreads.filter((s) => s.entryId === entryId),
        'elements',
      );
    // 900 was taken on 1 June, the day of entry 101, which had no photos of its own.
    expect(of(101)).toContain(900);
    // An entry already holding all it takes leaves the loose photos to the closing pages of more moments.
    const full = single(12, false);
    const loose = Array.from({ length: 10 }, (_, i) => ({
      photoId: 800 + i,
      width: 4000,
      height: 3000,
      takenAt: null,
    }));
    const more = laid({ ...full, gallery: loose }, 'fabric-classic');
    const closing = more.doc.spreads.filter((s) => s.role === 'inner' && s.entryId === null);
    const shown = photoIdsOn(closing, 'elements');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((id) => id >= 800)).toBe(true);
    const left = more.photos.left_out.map((l) => l.photoId);
    expect(loose.every((p) => shown.includes(p.photoId) || left.includes(p.photoId))).toBe(true);
  });

  it('AUTODSN-010: keeps a stored page that holds a locked element', () => {
    const input = inputs()[0]?.[1] as BookDesignInput;
    const first = laid(input, 'fabric-classic').doc;
    const page = first.spreads[5] as BookSpread;
    const locked: BookSpread = {
      ...page,
      elements: page.elements.map((e, i) => (i === 0 ? { ...e, locked: true } : e)),
    };
    const stored: BookDocument = { ...first, spreads: first.spreads.map((s) => (s.id === page.id ? locked : s)) };
    const again = designBook(
      stored,
      { ...input, newId: counter() },
      { style: 'fabric-classic', layouts: 'templates', seed: 2 },
    );
    expect(again.doc.spreads).toContainEqual(locked);
    expect(again.plan.find((r) => r.spreadId === page.id)?.action).toBe('keep');
  });

  it('AUTODSN-011: no page has a severe finding', () => {
    for (const [name, input] of inputs()) {
      for (const theme of THEMES) {
        const { doc } = laid(input, theme);
        doc.spreads.forEach((s, i) => {
          const severe = pageFindings(s, doc.page, input.photos).filter((f) => f.severity === 'severe');
          expect(
            severe.map((f) => f.code),
            `${name} ${theme} page ${i}`,
          ).toEqual([]);
        });
      }
    }
  });

  it('AUTODSN-012: the plan names the template every templated page came from', () => {
    const { plan, doc } = laid(inputs()[0]?.[1] as BookDesignInput, 'midnight');
    const named = plan.filter((r) => r.template);
    expect(named.length).toBeGreaterThan(3);
    for (const r of named) {
      expect(findDecoratedTemplate(r.template ?? '')).toBeDefined();
      const s = doc.spreads.find((x) => x.id === r.spreadId) as BookSpread;
      expect(matchDecoratedTemplate(s, doc.page)?.id, r.template).toBe(r.template);
    }
  });

  it('AUTODSN-013: the same seed lays the same book, another seed another', () => {
    const input = inputs()[0]?.[1] as BookDesignInput;
    const ids = (seed: number) =>
      laid(input, 'riso', { seed })
        .plan.map((r) => r.template ?? r.beat)
        .join();
    expect(ids(4)).toBe(ids(4));
    expect([5, 6, 7, 8].some((seed) => ids(seed) !== ids(4))).toBe(true);
  });

  it("AUTODSN-014: a theme of the book's own is kept whole", () => {
    const own = {
      ...bookThemeOf('postcard'),
      id: null,
      palette: { ...bookThemeOf('postcard').palette, accent: '#123456' },
    };
    const input = inputs()[0]?.[1] as BookDesignInput;
    const { doc } = designBook(
      null,
      { ...input, theme: own, newId: counter() },
      { style: 'postcard', layouts: 'templates' },
    );
    expect(doc.theme).toEqual(own);
  });

  it('AUTODSN-015: without layouts the design is composed as before, with no template named', () => {
    const input = inputs()[0]?.[1] as BookDesignInput;
    const composed = designBook(null, { ...input, newId: counter() }, { style: 'riso', seed: 1 });
    expect(composed.plan.every((r) => r.template === undefined)).toBe(true);
    expect(composed.doc).toEqual(
      designBook(null, { ...input, newId: counter() }, { style: 'riso', seed: 1, layouts: 'composed' }).doc,
    );
  });

  it("AUTODSN-016: bare stops are listed on a words-only template of the book's styles, every name in its story", () => {
    const base = parity.A as Fixture;
    const entries = base.input.entries.map((e) => ({ ...e, story: null, photos: [] }));
    const input = { ...base.input, entries, coverPhotoId: null, candidates: [], photos: [] };
    for (const theme of THEMES) {
      const { plan, doc } = laid(input, theme);
      const lists = plan.filter((r) => r.beat === 'stations');
      expect(lists.length, theme).toBeGreaterThan(0);
      const words: string[] = [];
      for (const r of lists) {
        const tpl = findDecoratedTemplate(r.template ?? '');
        expect(tpl && templatePhotoSlots(tpl), `${theme} ${r.template}`).toBe(0);
        expect([THEME_ARCHETYPE[theme], ...ARCHETYPE_KIN[THEME_ARCHETYPE[theme]]]).toContain(tpl?.archetype);
        const s = doc.spreads.find((x) => x.id === r.spreadId) as BookSpread;
        const texts = s.elements.flatMap((e) => (e.kind === 'text' ? [e.text] : []));
        expect(texts, theme).toContain(input.stationsLabel);
        words.push(...texts);
      }
      const listed = words.join(' ');
      for (const e of entries) {
        const name = e.title || e.location || '';
        if (name) expect(listed, `${theme} ${name}`).toContain(name);
      }
    }
  });

  it('AUTODSN-020: lays the parity journeys exactly as pinned', () => {
    const actual = digests();
    const differ = [...actual].filter(([k, v]) => expected[k] !== v).map(([k]) => k);
    const missing = Object.keys(expected).filter((k) => !actual.has(k));
    const message = `the templated auto layout changed; if that is deliberate, write design-templated.parity.json as:\n${JSON.stringify(Object.fromEntries([...actual].sort()), null, 1)}`;
    expect(differ.length + missing.length, message).toBe(0);
  });
});

// ── the digests ──────────────────────────────────────────────────────────

/** The canonical form auto-layout.parity.spec.ts digests: keys sorted, every id read as `#new`. */
function canonical(value: unknown): string {
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
    if (key === 'id' && typeof v === 'string') return '#new';
    return v;
  };
  return JSON.stringify(walk(value));
}

const digest = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex').slice(0, 16);

/** Every page of every parity journey in every theme, digested. */
function digests(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, fx] of Object.entries(parity)) {
    const input = { ...fx.input, gallery: fx.gallery, candidates: [], photos: [] };
    for (const theme of THEMES) {
      const result = laid(input, theme);
      const doc = result.doc;
      const put = (key: string, v: unknown) => out.set(`${name}/${theme}/${key}`, digest(v));
      put('head', {
        version: doc.version,
        title: doc.title,
        page: doc.page,
        theme: doc.theme,
        count: doc.spreads.length,
      });
      put(
        'plan',
        result.plan.map((r) => [r.beat, r.template ?? null, r.entryId, r.photoIds]),
      );
      doc.spreads.forEach((s, i) => put(`spread/${i}`, s));
    }
  }
  return out;
}
