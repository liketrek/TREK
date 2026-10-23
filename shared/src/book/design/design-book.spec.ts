import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { DESIGN_TEXT_HEADROOM, textHeightNeeded } from '../book-findings';
import { bookLevelFindings } from '../book-findings-design';
import type { BookPhotoInfo } from '../book-ops-core';
import { blankBook } from '../book-pages';
import { isStale } from '../book-travel';
import {
  MAX_SPREADS,
  MAX_SPREAD_ELEMENTS,
  bookDocumentSchema,
  bookPhotoElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookListElement,
  type BookMapElement,
  type BookSpread,
  type BookTextElement,
} from '../book.schema';
import { pageFindings } from '../describe-spread';
import type { PhotoPickCandidate } from '../photo-pick';
import { designBook, type BookDesignInput, type BookDesignResult } from './design-book';
import { bookDesignDirectivesSchema, type BookDesignDirectivesInput } from './design-directives.schema';
import { newRhythm, planChapter, type DesignChapter } from './design-pacing';
import { burstOf, type BookDesignLeftOut } from './design-photos';
import { repairSpread } from './design-repair';
import { designLook } from './design-style';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The whole-book design engine on three journeys (rich, sparse, no figures)
 * and a set of directives: every style, both densities, a page budget, a
 * scope, chapters by day and by place, a palette from the photos, captions
 * and excerpts, chapter maps, a locked page kept. Each design is checked for
 * its structure (the framing in order, every chapter there, the rhythm, the
 * budget, the caps, a document the save route takes), for being clean (no
 * severe and no warn finding left on any page or on the book), for being
 * current (no travel element out of date with the journey once placed) and
 * for losing no story unsaid (every entry's words on its pages, or named in
 * the notes). The pacing of a chapter (its bursts, the photo beats) is also
 * read straight from the plan, and the repair of words that run long straight
 * from a page.
 */

type Name = 'rich' | 'sparse' | 'nostats';
/** A fixture journey, or the rich one with its stops on two trips. */
type Journey = Name | 'rich-trips';

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as Record<
  Name,
  { input: BookDesignInput }
>;

/** The journey with ids minted by a counter, so a design is the same every run. */
function input(name: Journey): BookDesignInput {
  let n = 0;
  const journey = name === 'rich-trips' ? withTrips(fixtures.rich.input) : fixtures[name].input;
  return { ...journey, newId: (p) => `${p}-${++n}` };
}

/** The journey with its stops on two trips: the first four stops on trip 7, the others on trip 8. */
function withTrips(journey: BookDesignInput): BookDesignInput {
  if (!journey.stats) return journey;
  const points = journey.stats.points.map((p) => ({ ...p, tripId: (p.entryId ?? 0) <= 4 ? 7 : 8 }));
  return { ...journey, stats: { ...journey.stats, points } };
}

const VARIANTS: [string, Journey, BookDesignDirectivesInput][] = [
  ['minimal', 'rich', { style: 'minimal' }],
  ['editorial', 'rich', { style: 'editorial' }],
  ['journal', 'rich', { style: 'journal' }],
  ['bold', 'rich', { style: 'bold' }],
  ['scrapbook', 'rich', { style: 'scrapbook' }],
  ['airy', 'rich', { style: 'minimal', density: 'airy' }],
  ['dense', 'rich', { style: 'editorial', density: 'rich' }],
  ['budget', 'rich', { style: 'journal', pages: { min: 6, max: 10 } }],
  ['grow', 'rich', { style: 'minimal', pages: { min: 30 } }],
  ['scope', 'rich', { style: 'editorial', scope: { entryIds: [3, 4, 5, 6] } }],
  ['days', 'rich', { style: 'minimal', chapters: 'day' }],
  ['places', 'rich', { style: 'bold', chapters: 'place' }],
  ['palette', 'rich', { style: 'classic', palette: 'from_photos', type: { scale: 0.8 } }],
  ['captions', 'rich', { style: 'journal', text: { captions: 'photo', story: 'excerpt', excerptChars: 300 } }],
  ['maps', 'rich-trips', { style: 'editorial', travel: { chapterMaps: true, dayBadges: false } }],
  ['sparse', 'sparse', { style: 'scrapbook' }],
  ['sparse-all', 'sparse', { style: 'minimal', photos: { pick: 'all' } }],
  ['nostats', 'nostats', { style: 'editorial' }],
  ['nostats-a5', 'nostats', { style: 'bold', preset: 'a5-landscape' }],
];

const inner = (doc: BookDocument) => doc.spreads.filter((s) => s.role === 'inner');
const notInfo = (list: { severity: string }[]) => list.filter((f) => f.severity !== 'info');

/** Everything a design must be, whatever was asked of it. */
function checkStructure(result: BookDesignResult): void {
  const roles = result.doc.spreads.map((s) => s.role);
  expect(roles.slice(0, 2)).toEqual(['cover', 'first']);
  expect(roles.slice(-2)).toEqual(['last', 'back']);
  expect(roles.slice(2, -2).every((r) => r === 'inner')).toBe(true);
  expect(bookDocumentSchema.safeParse(result.doc).success).toBe(true);
  expect(result.doc.spreads.every((s) => s.elements.length <= MAX_SPREAD_ELEMENTS)).toBe(true);
  expect(new Set(result.doc.spreads.map((s) => s.id)).size).toBe(result.doc.spreads.length);
}

/** No severe and no warn finding, on any page or on the book, measured afresh. */
function checkClean(result: BookDesignResult, photos: BookDesignInput['photos']): void {
  expect(notInfo(result.findings)).toEqual([]);
  expect(result.plan.every((r) => r.findings.severe === 0 && r.findings.warn === 0)).toBe(true);
  for (const spread of result.doc.spreads) {
    const left = notInfo(pageFindings(spread, result.doc.page, photos));
    expect({ spread: spread.id, left }).toEqual({ spread: spread.id, left: [] });
  }
  expect(notInfo(bookLevelFindings(result.doc))).toEqual([]);
}

/**
 * A loud spread (a hero, a panorama) is followed by a calm one, heroes are
 * four spreads apart, and no photo beat (two, three or a grid) comes three
 * spreads running.
 */
function checkRhythm(result: BookDesignResult): void {
  const beats = result.plan.filter((r) => r.action !== 'drop').map((r) => r.beat);
  const loud = (b: string) => b === 'hero' || b === 'pano';
  beats.forEach((b, i) => {
    if (i > 0 && loud(b)) expect(loud(beats[i - 1] as string)).toBe(false);
  });
  const heroes = beats.flatMap((b, i) => (b === 'hero' ? [i] : []));
  heroes.forEach((at, i) => {
    if (i > 0) expect(at - (heroes[i - 1] as number)).toBeGreaterThanOrEqual(4);
  });
  const photoBeat = (b: string) => b === 'duo' || b === 'trio' || b === 'grid';
  beats.forEach((b, i) => {
    if (i > 1 && photoBeat(b)) expect({ at: i, run: beats.slice(i - 2, i + 1) }).not.toEqual({ at: i, run: [b, b, b] });
  });
}

/** Every travel element carries the journey's figures as they are: none is out of date the moment it is placed. */
function checkCurrent(result: BookDesignResult, stats: BookDesignInput['stats']): void {
  for (const spread of result.doc.spreads) {
    const stale = spread.elements.filter((e) => isStale(e, stats)).map((e) => e.id);
    expect({ spread: spread.id, stale }).toEqual({ spread: spread.id, stale: [] });
  }
}

/** Every entry with something to show opens a spread of its own (or is listed among the stations). */
function checkCoverage(result: BookDesignResult, entryIds: readonly number[]): void {
  const told = new Set<number>();
  for (const spread of result.doc.spreads) {
    if (spread.entryId != null) told.add(spread.entryId);
    for (const el of spread.elements) if (el.kind === 'text' && el.binding?.entryId) told.add(el.binding.entryId);
  }
  expect(entryIds.filter((id) => !told.has(id))).toEqual([]);
}

/** Text with its spacing taken out: so the pieces of a story set on several pages compare with the story. */
const squashed = (words: string) => words.replace(/\s+/g, '');

/** What a design sets of an entry's story, its pieces in page order, the mark a cut adds taken off. */
function storySet(result: BookDesignResult, entryId: number): string {
  let words = '';
  for (const spread of result.doc.spreads) {
    for (const el of spread.elements) {
      if (el.kind !== 'text' || el.binding?.source !== 'entry.story' || el.binding.entryId !== entryId) continue;
      words += el.text.replace(/…$/, '');
    }
  }
  return squashed(words);
}

/** The entries whose stories, all of them or a part, the notes say are left out. */
function storiesNoted(result: BookDesignResult): number[] {
  const said = result.notes.filter((n) => /stor(y|ies) of /.test(n) && n.endsWith('left out'));
  return said.flatMap((n) => (n.match(/\d+/g) ?? []).map(Number));
}

/**
 * No story lost unsaid: every entry in scope has its story on its pages in
 * full (its excerpt, when excerpts are asked for), or a note names it.
 */
function checkStories(
  result: BookDesignResult,
  entries: readonly AutoEntry[],
  directives: BookDesignDirectivesInput,
): void {
  const asked = bookDesignDirectivesSchema.parse(directives);
  const story = asked.text?.story ?? 'full';
  const scope = asked.scope?.entryIds;
  const noted = new Set(storiesNoted(result));
  for (const entry of entries) {
    const words = squashed(entry.story ?? '');
    if (!words || story === 'none' || noted.has(entry.id) || (scope && !scope.includes(entry.id))) continue;
    const set = storySet(result, entry.id);
    const told = story === 'excerpt' ? set.length > 0 : set.includes(words);
    expect({ entry: entry.id, told }).toEqual({ entry: entry.id, told: true });
  }
}

/** The entries the texts of one source among these elements are bound to, in order. */
const boundTo = (elements: readonly BookElement[], source: string) =>
  elements.flatMap((e) => (e.kind === 'text' && e.binding?.source === source ? [e.binding.entryId] : []));

const substantive = (name: Name, ids?: readonly number[]) =>
  fixtures[name].input.entries
    .filter((e) => !ids || ids.includes(e.id))
    .filter((e) => e.photos.length > 0 || (e.story ?? '').trim())
    .map((e) => e.id);

describe('design_book', () => {
  for (const [label, name, directives] of VARIANTS) {
    it(`BOOKDSN-001: designs the ${label} variant with its framing in order, its pages valid, none left with a fault and no story lost unsaid`, () => {
      const fx = input(name);
      const result = designBook(null, fx, directives);
      checkStructure(result);
      checkRhythm(result);
      checkClean(result, fx.photos);
      checkCurrent(result, fx.stats);
      checkStories(result, fx.entries, directives);
    });
  }

  it('BOOKDSN-002: gives every entry with photos or words a spread, in the order of the journey', () => {
    for (const style of ['minimal', 'editorial', 'scrapbook'] as const) {
      checkCoverage(designBook(null, input('rich'), { style }), substantive('rich'));
    }
    checkCoverage(designBook(null, input('rich'), { style: 'minimal', chapters: 'day' }), substantive('rich'));
    checkCoverage(designBook(null, input('sparse'), { style: 'journal' }), substantive('sparse'));
    const scoped = designBook(null, input('rich'), { style: 'editorial', scope: { entryIds: [3, 4, 5, 6] } });
    checkCoverage(scoped, substantive('rich', [3, 4, 5, 6]));
    const others = scoped.doc.spreads.filter((s) => s.entryId != null && ![3, 4, 5, 6].includes(s.entryId));
    expect(others).toEqual([]);
  });

  it('BOOKDSN-003: keeps to the page budget, and grows when more pages are asked for', () => {
    const tight = designBook(null, input('rich'), { style: 'journal', pages: { min: 6, max: 10 } });
    expect(inner(tight.doc).length).toBeLessThanOrEqual(10);
    expect(tight.photos.left_out.some((p) => p.reason === 'page_budget')).toBe(true);
    const natural = inner(designBook(null, input('rich'), { style: 'minimal' }).doc).length;
    const grown = inner(designBook(null, input('rich'), { style: 'minimal', pages: { min: 30 } }).doc).length;
    expect(grown).toBeGreaterThan(natural);
  });

  it('BOOKDSN-004: sets every page in two typefaces at most, and colours from the photos when asked', () => {
    const result = designBook(null, input('rich'), { style: 'editorial' });
    expect(result.style).toMatchObject({ heading: 'playfair', body: 'garamond', paper: '#faf8f4' });
    const fonts = new Set(result.doc.spreads.flatMap((s) => s.elements.flatMap((e) => ('font' in e ? [e.font] : []))));
    expect([...fonts].sort()).toEqual(['garamond', 'playfair']);
    const tinted = designBook(null, input('rich'), { style: 'minimal', palette: 'from_photos' });
    expect(tinted.style.accent).not.toBe(result.style.accent);
    const given = (accent: string) =>
      designBook(null, input('sparse'), { style: 'minimal', palette: { paper: '#ffffff', ink: '#111111', accent } });
    expect(given('#C2410C').style.accent).toBe('#c2410c');
    expect(given('#fafafa').style.accent).toBe('#111111');
  });

  it('BOOKDSN-005: binds the words the journey owns, and the cover and title page to the journey', () => {
    const result = designBook(null, input('rich'), { style: 'editorial' });
    const texts = result.doc.spreads.flatMap((s) => s.elements.filter((e) => e.kind === 'text'));
    const sources = new Set(texts.flatMap((t) => (t.kind === 'text' && t.binding ? [t.binding.source] : [])));
    expect([...sources]).toEqual(expect.arrayContaining(['journey.title', 'entry.title', 'entry.date', 'entry.story']));
    const cover = result.doc.spreads[0] as BookSpread;
    expect(cover.elements.some((e) => e.kind === 'photo')).toBe(true);
    const own = designBook(null, input('rich'), { style: 'minimal', cover: { title: 'Our coast' } });
    const title = (own.doc.spreads[0] as BookSpread).elements.find((e) => e.kind === 'text');
    expect(title).toMatchObject({ text: 'Our coast', binding: null });
    expect(own.doc.title).toBe('Our coast');
  });

  it('BOOKDSN-006: leaves a near duplicate out and says why, and keeps every photo with pick all', () => {
    const best = designBook(null, input('rich'), { style: 'minimal' });
    expect(best.photos.left_out.some((p) => p.reason === 'near_duplicate_of')).toBe(true);
    const sparse = designBook(null, input('sparse'), { style: 'minimal', photos: { pick: 'all' } });
    expect(sparse.photos.used.sort()).toEqual([900, 901, 902]);
    const without = designBook(null, input('sparse'), { style: 'minimal', photos: { exclude: [902] } });
    expect(without.photos.used).not.toContain(902);
    expect(without.photos.left_out).toContainEqual({ photoId: 902, reason: 'excluded' });
  });

  it('BOOKDSN-007: keeps a locked page as it is, takes the place of the stored pages of its entries, drops the rest', () => {
    const stored = storedBook();
    const result = designBook(stored, input('rich'), { style: 'minimal' });
    const locked = result.doc.spreads.find((s) => s.id === 'sp-locked');
    expect(locked).toEqual(stored.spreads[2]);
    expect(result.plan.find((r) => r.spreadId === 'sp-locked')?.action).toBe('keep');
    expect(result.plan.find((r) => r.spreadId === 'sp-entry')?.action).toBe('replace');
    expect(result.plan.find((r) => r.spreadId === 'sp-hand')?.action).toBe('drop');
    expect(result.doc.spreads[0]?.id).toBe('sp-cover');
    checkClean(result, input('rich').photos);
    const edited = designBook(stored, input('rich'), { style: 'minimal', keep: 'edited' });
    expect(edited.plan.find((r) => r.spreadId === 'sp-hand')?.action).toBe('keep');
  });

  it('BOOKDSN-008: lays the classic style over a stored book as the Auto layout, keeping the locked page', () => {
    const stored = storedBook();
    const result = designBook(stored, input('rich'), { style: 'classic' });
    expect(result.doc.spreads.find((s) => s.id === 'sp-locked')).toEqual(stored.spreads[2]);
    expect(result.plan.find((r) => r.spreadId === 'sp-cover')?.action).toBe('replace');
    checkStructure(result);
  });

  it('BOOKDSN-009: designs the same book twice from the same journey and seed', () => {
    const a = designBook(null, input('rich'), { style: 'editorial', seed: 7 });
    const b = designBook(null, input('rich'), { style: 'editorial', seed: 7 });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    const c = designBook(null, input('rich'), { style: 'editorial', seed: 8 });
    expect(JSON.stringify(c.doc)).not.toBe(JSON.stringify(a.doc));
  });

  it('BOOKDSN-010: honours a new format only for a book with nothing on it yet', () => {
    const fresh = designBook(null, input('nostats'), { style: 'bold', preset: 'a5-landscape' });
    expect(fresh.doc.page).toMatchObject({ preset: 'a5-landscape', pageWidth: 210, pageHeight: 148 });
    const kept = designBook(storedBook(), input('rich'), { style: 'bold', preset: 'a5-landscape' });
    expect(kept.doc.page.preset).toBe('square-210');
  });

  it('BOOKDSN-011: runs classic as the Auto layout only when nothing more is asked, and measures its pages', () => {
    const photos = input('rich').photos;
    const auto = designBook(null, input('rich'), { style: 'classic' });
    expect(inner(auto.doc).length).toBeGreaterThan(4);
    for (const row of auto.plan) {
      const spread = auto.doc.spreads.find((s) => s.id === row.spreadId) as BookSpread;
      const left = pageFindings(spread, auto.doc.page, photos);
      expect(row.findings.severe).toBe(left.filter((f) => f.severity === 'severe').length);
      expect(row.findings.warn).toBe(left.filter((f) => f.severity === 'warn').length);
    }
    const budgeted = designBook(null, input('rich'), { style: 'classic', pages: { max: 4 } });
    expect(inner(budgeted.doc).length).toBeLessThanOrEqual(4);
    expect(budgeted.style).toMatchObject({ heading: 'sans', body: 'sans', paper: '#ffffff' });
    const titled = designBook(null, input('rich'), { style: 'classic', cover: { title: 'Our coast' } });
    const title = (titled.doc.spreads[0] as BookSpread).elements.find((e) => e.kind === 'text');
    expect(title).toMatchObject({ text: 'Our coast', binding: null });
  });

  it('BOOKDSN-012: holds a small page budget as a hard limit, the framing pages counted in it', () => {
    for (const style of ['editorial', 'bold'] as const) {
      const result = designBook(null, input('rich'), { style, pages: { max: 2 } });
      checkStructure(result);
      expect(inner(result.doc).length).toBeLessThanOrEqual(2);
      expect(result.notes.some((n) => n.includes('no room for'))).toBe(true);
    }
    const one = designBook(null, input('rich'), { style: 'minimal', pages: { min: 5, max: 1 } });
    expect(inner(one.doc).length).toBeLessThanOrEqual(1);
  });

  it('BOOKDSN-013: lays the cover out by the cover layout asked for, the same way every time', () => {
    const banded = designBook(null, input('rich'), { style: 'minimal', cover: { template: 'cover-band' } });
    const cover = banded.doc.spreads[0] as BookSpread;
    const photo = cover.elements.find((e) => e.kind === 'photo');
    expect(photo).toBeDefined();
    expect((photo?.frame.y ?? 0) + (photo?.frame.h ?? 0)).toBeLessThan(banded.doc.page.pageHeight);
    const bound = cover.elements.some((e) => e.kind === 'text' && e.binding?.source === 'journey.title');
    expect(bound).toBe(true);
    const again = designBook(null, input('rich'), { style: 'minimal', cover: { template: 'cover-band' } });
    expect(JSON.stringify(again.doc)).toBe(JSON.stringify(banded.doc));
  });

  it('BOOKDSN-014: stays within the spread cap beside many kept pages, the closing pages kept', () => {
    const stored = storedBook();
    const lockedPage = stored.spreads[2] as BookSpread;
    const many = Array.from({ length: MAX_SPREADS - 6 }, (_, i): BookSpread => ({
      ...lockedPage,
      id: `sp-l${i}`,
      elements: lockedPage.elements.map((e) => ({ ...e, id: `t-l${i}` })),
    }));
    const [cover, first] = stored.spreads;
    const full: BookDocument = {
      ...stored,
      spreads: [cover as BookSpread, first as BookSpread, ...many, ...stored.spreads.slice(-2)],
    };
    for (const style of ['minimal', 'classic'] as const) {
      const result = designBook(full, input('rich'), { style });
      checkStructure(result);
      expect(result.doc.spreads.length).toBeLessThanOrEqual(MAX_SPREADS);
      expect(inner(result.doc).length).toBeLessThanOrEqual(MAX_SPREADS - 4);
      expect(many.every((p) => result.doc.spreads.some((s) => s.id === p.id))).toBe(true);
      expect(result.notes.length).toBeGreaterThan(0);
    }
  });

  it('BOOKDSN-022: never sets one photo beat three spreads running, a rich chapter of sixteen photos included', () => {
    const entry = { ...(input('rich').entries[1] as AutoEntry), photos: tall(900, 16) };
    const leftOut: BookDesignLeftOut[] = [];
    const plans = planChapter(chapterOf(entry, []), 4, newRhythm(), planOf('rich'), leftOut);
    expect(plans.map((p) => p.beat)).toEqual(['opener', 'grid', 'grid', 'trio']);
    expect(plans.map((p) => p.photos.length)).toEqual([1, 5, 5, 3]);
    expect(leftOut).toEqual([
      { photoId: 914, reason: 'page_budget' },
      { photoId: 915, reason: 'page_budget' },
    ]);
  });

  it('BOOKDSN-023: sets a burst as one grid, at an airy density too, and five of it after a loud spread', () => {
    const quiet = input('rich').entries[0] as AutoEntry;
    const fivePhotos = { ...quiet, photos: wide(1, 5) };
    const opened = planChapter(chapterOf(fivePhotos, [2, 3, 4, 5]), 3, newRhythm(), planOf('airy'), []);
    expect(opened.map((p) => p.beat)).toEqual(['opener', 'grid']);
    expect(opened[1]?.photos.map((p) => p.photoId)).toEqual([2, 3, 4, 5]);

    const hero: AutoPhoto = { photoId: 10, width: 4000, height: 3000 };
    const eightPhotos = { ...quiet, photos: [hero, ...wide(11, 7)] };
    const leftOut: BookDesignLeftOut[] = [];
    const burst = [11, 12, 13, 14, 15, 16, 17];
    const loud = planChapter(chapterOf(eightPhotos, burst), 3, newRhythm(), planOf('airy'), leftOut);
    expect(loud.map((p) => p.beat)).toEqual(['hero', 'grid', 'duo']);
    expect(loud[1]?.photos.map((p) => p.photoId)).toEqual([11, 12, 13, 14, 15]);
    expect(leftOut).toEqual([]);

    const shot = (photoId: number, takenAt: string | null): PhotoPickCandidate => ({
      ...(input('rich').candidates[0] as PhotoPickCandidate),
      photoId,
      takenAt,
    });
    const pool = [
      shot(1, '2026-05-01T09:00:00'),
      shot(2, '2026-05-01T12:00:00'),
      shot(3, '2026-05-01T12:05:00'),
      shot(4, '2026-05-01T12:09:00'),
      shot(5, '2026-05-01T12:14:00'),
      shot(6, null),
    ];
    expect(burstOf(wide(1, 6), pool)).toEqual([2, 3, 4, 5]);
    expect(burstOf(wide(1, 4), pool)).toEqual([]);
  });

  it('BOOKDSN-024: puts a map of its trip on a chapter opener, current when placed, and says which stops on no trip get none', () => {
    // The structure, the rhythm and a clean page with chapter maps are the maps variant of BOOKDSN-001.
    const fx = input('rich-trips');
    const directives: BookDesignDirectivesInput = {
      style: 'editorial',
      travel: { chapterMaps: true, dayBadges: false },
    };
    const result = designBook(null, fx, directives);
    checkCurrent(result, fx.stats);
    const maps = result.doc.spreads
      .filter((s) => s.entryId != null)
      .flatMap((s) => s.elements.filter((e): e is BookMapElement => e.kind === 'map'));
    expect(maps.length).toBeGreaterThan(1);
    const points = fx.stats?.points ?? [];
    for (const map of maps) {
      expect([7, 8]).toContain(map.tripId);
      const stops = points.filter((p) => p.tripId === map.tripId).map((p) => p.label);
      expect(map.points.map((p) => p.label)).toEqual(stops);
    }
    expect(result.notes.filter((n) => n.includes('on no trip'))).toEqual([]);
    // The stop of entry 2 on no trip: the note names that entry alone.
    const loose = points.map((p) => (p.entryId === 2 ? { ...p, tripId: null } : p));
    const oneOff = designBook(null, { ...fx, stats: fx.stats && { ...fx.stats, points: loose } }, directives);
    expect(oneOff.notes).toContain('entry 2 is on no trip, so its chapter has no map');
    const untripped = designBook(null, input('rich'), directives);
    const anyMap = untripped.doc.spreads.some((s) => s.entryId != null && s.elements.some((e) => e.kind === 'map'));
    expect(anyMap).toBe(false);
    expect(untripped.notes).toContain(
      'entries 2, 3, 4, 5, 6, 7, 8, 9, 10 and 11 are on no trip, so their chapters have no map',
    );
  });

  it("BOOKDSN-025: sets an entry's pros and cons as a list under its words, and says when they find no room", () => {
    const spreadsOf = (result: BookDesignResult, entryId: number) =>
      result.doc.spreads.filter((s) => s.entryId === entryId);
    const listsOf = (result: BookDesignResult, entryId: number) =>
      spreadsOf(result, entryId).flatMap((s) => s.elements.filter((e): e is BookListElement => e.kind === 'list'));
    const asked: BookDesignDirectivesInput[] = [
      { style: 'editorial' },
      { style: 'minimal' },
      { style: 'journal', text: { story: 'excerpt' } },
      { style: 'editorial', scope: { entryIds: [3, 4, 5, 6] } },
    ];
    for (const directives of asked) {
      const result = designBook(null, input('rich'), directives);
      // The list takes no spread of its own: entry 3 keeps two, each with more on it than the list.
      const pages = spreadsOf(result, 3);
      expect(pages).toHaveLength(2);
      expect(pages.every((s) => s.elements.some((e) => e.kind !== 'list'))).toBe(true);
      const lists = listsOf(result, 3);
      expect(lists).toHaveLength(1);
      expect(lists[0]).toMatchObject({
        items: [
          { text: 'The light', tone: 'pro' },
          { text: 'The wind', tone: 'con' },
        ],
        proLabel: 'Pros',
        conLabel: 'Cons',
      });
    }
    // Entry 2 has one spread for its story, so it opens on the opener and its list goes under its words; entry 4
    // opens on a panorama or on a hero with its quiet page; entry 12 has no photo, so its long story runs on across
    // both pages and the list goes under it; entry 11 tells no story and opens on a hero with no page for its list.
    const more: Partial<Record<number, Partial<AutoEntry>>> = {
      2: { pros: ['Tram 28'] },
      4: { story: 'Over the bridge at dusk.', pros: ['The bridge'], cons: ['The climb'] },
      11: { pros: ['The surf'] },
      12: { story: 'We walked the old town. '.repeat(130), cons: ['The rain'] },
    };
    const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...more[e.id] }));
    for (const directives of [{ style: 'editorial', travel: { dayBadges: false } }, { style: 'editorial' }] as const) {
      const fx = { ...input('rich'), entries };
      const result = designBook(null, fx, directives);
      checkStructure(result);
      checkRhythm(result);
      checkClean(result, fx.photos);
      expect(listsOf(result, 2)).toHaveLength(1);
      expect(listsOf(result, 4)).toHaveLength(1);
      expect(listsOf(result, 12)).toHaveLength(1);
      expect(listsOf(result, 11)).toEqual([]);
      expect(result.notes).toContain('the pros and cons of entry 11 found no room on its pages and are left out');
    }
  });

  it('BOOKDSN-026: gives the quiet page of an entry with pros and cons a photo, and names the pros and cons left out', () => {
    const listed = input('rich').entries[2] as AutoEntry;
    const plain: AutoEntry = { ...listed, pros: [], cons: [] };
    const beats = (entry: AutoEntry, burst: number[]) =>
      planChapter(chapterOf(entry, burst), 3, newRhythm(), planOf('balanced'), []).map((p) => [
        p.beat,
        p.photos.map((f) => f.photoId),
      ]);
    expect(beats({ ...listed, photos: tall(920, 4) }, [])).toEqual([
      ['opener', [920]],
      ['quiet', [921]],
      ['duo', [922, 923]],
    ]);
    expect(beats({ ...plain, photos: tall(920, 4) }, [])).toEqual([
      ['opener', [920]],
      ['quiet', []],
      ['trio', [921, 922, 923]],
    ]);
    // The quiet page's photo comes from outside the burst, which stays whole for its grid.
    expect(beats({ ...listed, photos: tall(930, 6) }, [931, 932, 933, 934])).toEqual([
      ['opener', [930]],
      ['quiet', [935]],
      ['grid', [931, 932, 933, 934]],
    ]);

    // Entry 1 is a bare stop among the stations; entry 4 shares its day with entry 3, whose chapter it is.
    const more: Partial<Record<number, Partial<AutoEntry>>> = {
      1: { pros: ['The tram'] },
      4: { date: '2026-05-03', pros: ['The bridge'] },
    };
    const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...more[e.id] }));
    const days = designBook(null, { ...input('rich'), entries }, { style: 'minimal', chapters: 'day' });
    checkStructure(days);
    const onThree = days.doc.spreads.filter((s) => s.entryId === 3).flatMap((s) => s.elements);
    expect(onThree.filter((e) => e.kind === 'list')).toHaveLength(1);
    expect(days.notes).toContain('the pros and cons of entries 1 and 4 found no room on their pages and are left out');
  });

  it('BOOKDSN-027: sets the story of every entry of a day, each later one under its title, and names the ones the budget cuts', () => {
    // Entries 7 and 8 share entry 6's day: one chapter, opened by entry 6, the stories of 7 and 8 after its own.
    const moved: Partial<Record<number, Partial<AutoEntry>>> = {
      7: { date: '2026-05-06' },
      8: { date: '2026-05-06' },
    };
    const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...moved[e.id] }));
    const fx = { ...input('rich'), entries };
    const day: BookDesignDirectivesInput = { style: 'minimal', chapters: 'day' };
    const result = designBook(null, fx, day);
    checkStructure(result);
    checkRhythm(result);
    checkClean(result, fx.photos);
    checkCurrent(result, fx.stats);
    checkStories(result, entries, day);
    const story = (id: number) => squashed(entries.find((e) => e.id === id)?.story ?? '');
    for (const id of [6, 7, 8]) expect(storySet(result, id)).toContain(story(id));
    expect(storiesNoted(result).filter((id) => [6, 7, 8].includes(id))).toEqual([]);
    // The chapter is entry 6's: its title opens it, the titles of 7 and 8 head their stories, each bound to its entry.
    const onDay = result.doc.spreads.filter((s) => s.entryId === 6).flatMap((s) => s.elements);
    expect(boundTo(onDay, 'entry.title')).toEqual([6, 7, 8]);
    expect([...new Set(boundTo(onDay, 'entry.story'))]).toEqual([6, 7, 8]);

    // With one spread the day opens on the opener, as a hero would leave its words no page; with two, on a hero and
    // a quiet page beside a photo. Either holds the stories of 6 and 7 and the start of 8, and the note says the
    // rest of 8 is left out.
    const scoped: BookDesignDirectivesInput = { ...day, scope: { entryIds: [6, 7, 8] } };
    const tight = designBook(null, fx, { ...scoped, pages: { max: 3 } });
    const roomier = designBook(null, fx, { ...scoped, pages: { max: 4 } });
    const dayBeats = (cut: BookDesignResult) => cut.plan.filter((r) => r.entryId === 6).map((r) => r.beat);
    expect(dayBeats(tight)).toEqual(['opener']);
    expect(dayBeats(roomier)).toEqual(['hero', 'quiet']);
    for (const cut of [tight, roomier]) {
      checkStructure(cut);
      checkClean(cut, fx.photos);
      checkStories(cut, entries, scoped);
      for (const id of [6, 7]) expect(storySet(cut, id)).toContain(story(id));
      expect(storySet(cut, 8).length).toBeGreaterThan(0);
      expect(cut.notes).toContain('part of the story of entry 8 found no room on its pages and is left out');
    }
    // With no stories asked for, no page sets one and no note misses one.
    const silent = designBook(null, fx, { ...day, text: { story: 'none' } });
    checkStructure(silent);
    expect(silent.doc.spreads.flatMap((s) => boundTo(s.elements, 'entry.story'))).toEqual([]);
    expect(storiesNoted(silent)).toEqual([]);

    // The page for words is planned from the whole day's words: entry 7's own story is short, entry 8's is long.
    const byId = (id: number) => entries.find((e) => e.id === id) as AutoEntry;
    const seven: AutoEntry = { ...byId(7), photos: tall(940, 4) };
    const pair: DesignChapter = { ...chapterOf(seven, []), entries: [seven, byId(8)] };
    const plans = planChapter(pair, 3, newRhythm(), planOf('balanced'), []);
    expect(plans.map((p) => p.beat)).toEqual(['opener', 'quiet', 'trio']);
    expect(plans.map((p) => p.photos.length)).toEqual([1, 0, 3]);
  });

  it('BOOKDSN-028: opens on a hero or a panorama only when a page for the words follows, gives a long day the pages its words want, and lets pros and cons wait for the next of them', () => {
    // A hero sets no words and a panorama's half page is too small to count on: a chapter that tells a story opens
    // on either only with a spread after it, one that tells none on either at once.
    const bare = input('rich').entries[0] as AutoEntry;
    const told: AutoEntry = { ...bare, story: 'A short day by the sea.' };
    const hero: AutoPhoto = { photoId: 10, width: 4000, height: 3000 };
    const pano: AutoPhoto = { photoId: 20, width: 4000, height: 1500 };
    const opened = (entry: AutoEntry, photo: AutoPhoto, spreads: number) => {
      const chapter = chapterOf({ ...entry, photos: [photo] }, []);
      return planChapter(chapter, spreads, newRhythm(), planOf('balanced'), []).map((p) => p.beat);
    };
    expect(opened(told, hero, 1)).toEqual(['opener']);
    expect(opened(told, hero, 2)).toEqual(['hero', 'quiet']);
    expect(opened(bare, hero, 1)).toEqual(['hero']);
    expect(opened(told, pano, 1)).toEqual(['opener']);
    expect(opened(told, pano, 2)).toEqual(['pano', 'quiet']);
    expect(opened(bare, pano, 1)).toEqual(['pano']);
    // So entries 2 and 10, one photo and one spread each, open on the opener, and every story of the journey is set.
    for (const style of ['minimal', 'editorial', 'scrapbook'] as const) {
      const natural = designBook(null, input('rich'), { style });
      const beatsOf = (id: number) => natural.plan.filter((r) => r.entryId === id).map((r) => r.beat);
      expect(beatsOf(2)).toEqual(['opener']);
      expect(beatsOf(10)).toEqual(['opener']);
      expect(storiesNoted(natural)).toEqual([]);
    }

    // A long day: entry 6 with five pros and the start of a long story, 7 and 8 moved to its day, 7 with a story of
    // its own. Its words want two pages after the hero, and the natural budget gives them: every story is set whole.
    // The first holds the story of 6 with no room under it for the list, so the list waits for the second and heads
    // it, before the story of 7.
    const long = (input('rich').entries[2] as AutoEntry).story ?? '';
    const more: Partial<Record<number, Partial<AutoEntry>>> = {
      6: { story: long.slice(0, 1750), pros: ['P1', 'P2', 'P3', 'P4', 'P5'] },
      7: { date: '2026-05-06', story: long.slice(0, 700) },
      8: { date: '2026-05-06' },
    };
    const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...more[e.id] }));
    const fx = { ...input('rich'), entries };
    const day: BookDesignDirectivesInput = { style: 'minimal', chapters: 'day' };
    const result = designBook(null, fx, day);
    checkStructure(result);
    checkRhythm(result);
    checkClean(result, fx.photos);
    checkCurrent(result, fx.stats);
    const story = (id: number) => squashed(entries.find((e) => e.id === id)?.story ?? '');
    for (const id of [6, 7, 8]) expect(storySet(result, id)).toContain(story(id));
    expect(storiesNoted(result)).toEqual([]);
    const beats = result.plan.filter((r) => r.entryId === 6).map((r) => r.beat);
    expect(beats.slice(0, 3)).toEqual(['hero', 'quiet', 'quiet']);
    const onDay = result.doc.spreads.filter((s) => s.entryId === 6);
    expect(onDay.flatMap((s) => s.elements.filter((e) => e.kind === 'list'))).toHaveLength(1);
    const second = onDay[2]?.elements ?? [];
    expect(second[0]?.kind).toBe('list');
    expect(boundTo(second, 'entry.title')[0]).toBe(7);
    expect(result.notes.filter((n) => n.includes('pros and cons of entry 6'))).toEqual([]);
  });

  it('BOOKDSN-029: names the words no page holds ahead of the stories cut to fit, heads a later entry by its place or date, and tells an entry two chapters by place name once', () => {
    const long = 'We walked the old town. '.repeat(130);
    const budgeted = (ids: number[], max: number, more: Partial<Record<number, Partial<AutoEntry>>>) => {
      const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...more[e.id] }));
      const directives: BookDesignDirectivesInput = {
        style: 'minimal',
        scope: { entryIds: ids },
        pages: { max },
        travel: { summary: false, countries: false },
      };
      return designBook(null, { ...input('rich'), entries }, directives);
    };
    // One spread for entries 2 and 4: it holds the start of 2's long story and none of 4's.
    const one = budgeted([2, 4], 1, { 2: { story: long } });
    const part = one.notes.indexOf('part of the story of entry 2 found no room on its pages and is left out');
    const cut = one.notes.indexOf('the story of entry 2 is cut to fit its page and no longer follows the journal');
    expect(one.notes).toContain('the story of entry 4 found no room on its pages and is left out');
    expect(part).toBeGreaterThanOrEqual(0);
    expect(cut).toBeGreaterThan(part);
    // A spread each for entries 3 and 8, both with long stories: each holds the start of its own.
    const two = budgeted([3, 8], 2, { 3: { story: long }, 8: { story: long } });
    expect(two.notes).toContain('part of the stories of entries 3 and 8 found no room on their pages and is left out');
    // With no page after it, the words go on without a list that finds no room: 4's story follows 3's whole, and
    // the note names the list.
    const three = (input('rich').entries[2] as AutoEntry).story ?? '';
    const pros = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    const listed = budgeted([3, 4], 1, { 3: { story: three.slice(0, 1000), pros } });
    const four = input('rich').entries.find((e) => e.id === 4);
    expect(storySet(listed, 4)).toBe(squashed(four?.story ?? ''));
    expect(listed.notes).toContain('the pros and cons of entry 3 found no room on its pages and are left out');
    // An entry with no title, place or date runs on under the story before it, with no heading.
    const nameless = budgeted([8, 12], 1, { 12: { title: null, location: null, date: null, story: 'Rain all day.' } });
    const page = nameless.doc.spreads.filter((s) => s.entryId === 8).flatMap((s) => s.elements);
    expect(storySet(nameless, 12)).toBe(squashed('Rain all day.'));
    expect(boundTo(page, 'entry.title')).toEqual([8]);
    expect(boundTo(page, 'entry.date')).toEqual([8]);

    // A later entry of a day with no title is headed by its place, one with neither by its date, each bound to it.
    const unnamed: Partial<Record<number, Partial<AutoEntry>>> = {
      7: { date: '2026-05-06', title: null },
      8: { date: '2026-05-06', title: null, location: null },
    };
    const entries = input('rich').entries.map((e): AutoEntry => ({ ...e, ...unnamed[e.id] }));
    const headed = designBook(null, { ...input('rich'), entries }, { style: 'minimal', chapters: 'day' });
    checkStructure(headed);
    checkClean(headed, input('rich').photos);
    const onDay = headed.doc.spreads.filter((s) => s.entryId === 6).flatMap((s) => s.elements);
    const heading = (id: number, source: string) =>
      onDay.find((e) => e.kind === 'text' && e.binding?.source === source && e.binding.entryId === id);
    expect(boundTo(onDay, 'entry.title')).toEqual([6, 7]);
    expect(boundTo(onDay, 'entry.date')).toEqual([6, 8]);
    expect(heading(7, 'entry.title')).toMatchObject({ text: 'Oviedo' });
    const dated = { source: 'entry.date', entryId: 8, value: '2026-05-06' };
    expect(heading(8, 'entry.date')).toMatchObject({ binding: dated });
    expect([...new Set(boundTo(onDay, 'entry.story'))]).toEqual([6, 7, 8]);

    // Entry 8's last photos, taken a couple of kilometres on, make a second place of its day: two chapters by place
    // open with entry 8, and its story is set in the first of them only.
    const apart = (p: PhotoPickCandidate): PhotoPickCandidate => {
      if (!p.entryIds.includes(8) || p.photoId <= 120 || p.lat === null) return p;
      return { ...p, lat: p.lat + 0.02 };
    };
    const places = { ...input('rich'), candidates: input('rich').candidates.map(apart) };
    const twice = designBook(null, places, { style: 'bold', chapters: 'place' });
    checkStructure(twice);
    const opens = twice.plan.filter((r) => r.entryId === 8 && (r.beat === 'opener' || r.beat === 'hero'));
    expect(opens).toHaveLength(2);
    const eight = input('rich').entries.find((e) => e.id === 8);
    expect(storySet(twice, 8)).toBe(squashed(eight?.story ?? ''));
  });

  it('BOOKDSN-030: cuts words the findings say run long at a sentence, to what the engine measures their frame to hold', () => {
    const page = input('rich').page;
    const look = designLook(bookDesignDirectivesSchema.parse({ style: 'classic' }), page, []);
    // At the floor of a story's size already, so the repair cuts the words rather than setting them smaller.
    const words = 'A long day on the ice. '.repeat(40).trim();
    const frame = { x: 230, y: 20, w: 160, h: 30 };
    const long = bookTextElementSchema.parse({
      id: 't-long',
      kind: 'text',
      frame,
      text: words,
      size: 9,
      leading: 1.5,
    }) as BookTextElement;
    const spread: BookSpread = {
      id: 'sp-in',
      role: 'inner',
      background: '#ffffff',
      elements: [long],
      parked: [],
      entryId: null,
    };
    expect(pageFindings(spread, page, []).map((f) => f.code)).toContain('text_overflow');
    let n = 0;
    const fixed = repairSpread(spread, { page, photos: [], look, newId: (p) => `${p}-${++n}` });
    expect(fixed.findings.map((f) => f.code)).not.toContain('text_overflow');
    // Six lines of 94 letters hold 24 of its sentences; at the best estimate's 99 letters a line, 25 would be set.
    const cut = fixed.spread.elements[0] as BookTextElement;
    expect(cut.text).toBe('A long day on the ice. '.repeat(24).trim());
    expect(textHeightNeeded(cut, DESIGN_TEXT_HEADROOM)).toBeLessThanOrEqual(frame.h);
    const more = { ...cut, text: `${cut.text} A long day on the ice.` };
    expect(textHeightNeeded(more, DESIGN_TEXT_HEADROOM)).toBeGreaterThan(frame.h);
  });

  it('BOOKDSN-031: pulls two photos apart that lie mostly on top of each other, framed as the journal style frames them', () => {
    const page = input('rich').page;
    const look = designLook(bookDesignDirectivesSchema.parse({ style: 'journal' }), page, []);
    const framed = (id: string, x: number, y: number) =>
      bookPhotoElementSchema.parse({
        id,
        kind: 'photo',
        frame: { x, y, w: 80, h: 60 },
        photoId: 1,
        frameStyle: 'white',
      });
    const spread: BookSpread = {
      id: 'sp-in',
      role: 'inner',
      background: '#ffffff',
      elements: [framed('p-a', 230, 20), framed('p-b', 238, 26)],
      parked: [],
      entryId: null,
    };
    const photos = [{ photoId: 1, width: 4000, height: 3000 }];
    expect(pageFindings(spread, page, photos).map((f) => `${f.severity}:${f.code}`)).toContain('severe:overlap');
    let n = 0;
    const fixed = repairSpread(spread, { page, photos, look, newId: (p) => `${p}-${++n}` });
    expect(fixed.findings.filter((f) => f.code === 'overlap')).toEqual([]);
    expect(fixed.spread.elements.find((e) => e.id === 'p-b')?.frame.y).toBe(82);
  });
});

/** Photos of one shape, ids counted from `from`. */
const photosOf = (from: number, n: number, width: number, height: number): AutoPhoto[] =>
  Array.from({ length: n }, (_, i) => ({ photoId: from + i, width, height }));
const tall = (from: number, n: number) => photosOf(from, n, 3000, 4000);
/** Wider than tall, too small to run across a spread. */
const wide = (from: number, n: number) => photosOf(from, n, 3000, 2000);

/** One entry's chapter, with the photos of its burst. */
const chapterOf = (entry: AutoEntry, burst: number[]): DesignChapter => ({
  key: `e${entry.id}`,
  label: null,
  entries: [entry],
  photos: entry.photos,
  stations: false,
  burst,
});

/** What a chapter is planned with: the density, the rich journey's page, no photo signals. */
const planOf = (density: 'airy' | 'balanced' | 'rich') => ({
  directives: bookDesignDirectivesSchema.parse({ density }),
  page: input('rich').page,
  infos: new Map<number, BookPhotoInfo>(),
});

/** A stored book: a page locked by hand, a page of entry 3, and a page made by hand. */
function storedBook(): BookDocument {
  const doc = blankBook({ title: 'Atlantic coast', newId: (p) => `${p}-s` });
  const ids = ['sp-cover', 'sp-first', 'sp-locked', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  const frame = { x: 230, y: 30, w: 150, h: 12 };
  const words = { kind: 'text', frame, text: 'Kept', font: 'inter', locked: true };
  const lockedText = bookTextElementSchema.parse({ id: 't-locked', ...words }) as BookElement;
  spreads[2] = { ...(spreads[2] as BookSpread), elements: [lockedText], entryId: 6 };
  const note = bookTextElementSchema.parse({ id: 't-hand', kind: 'text', frame, text: 'Ours', font: 'inter' });
  const entryPage = { ...(spreads[2] as BookSpread), id: 'sp-entry', elements: [], entryId: 3 };
  const handPage = { ...(spreads[2] as BookSpread), id: 'sp-hand', elements: [note as BookElement], entryId: null };
  spreads.splice(3, 0, entryPage, handPage);
  return { ...doc, spreads };
}
