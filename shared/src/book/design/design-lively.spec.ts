import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { bookElementSchema, type BookElement, type BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import { BOOK_STICKERS } from '../stickers/sticker-catalogue';
import { designArt } from './design-art';
import { designBook, type BookDesignInput, type BookDesignResult } from './design-book';
import { BOOK_DESIGN_LIVELY_BEATS } from './design-brief.schema';
import type { ComposeCtx } from './design-compose';
import { bookDesignDirectivesSchema, type BookDesignDirectivesInput } from './design-directives.schema';
import {
  composeCollage,
  composeGridBadge,
  composeScriptOverlay,
  composeStampRow,
  composeTwoTone,
} from './design-lively';
import { composeLively, livelyPlans, rhythmBeat } from './design-lively-pacing';
import type { DesignChapter, PlannedSpread } from './design-pacing';
import { designRng } from './design-random';
import { innerSpread } from './design-spreads';
import { turnedBox } from './design-stickers';
import { designGrid, designLook } from './design-style';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The lively spreads (design-lively.ts, design-lively-pacing.ts): two in
 * five hero and grid spreads of a lively or loud book become collages,
 * script overlays, badge grids, stamp rows or two-tone splits, none of a calm
 * one; each is a valid double page with its signature, nothing across the
 * fold that should not be, its words on the page; and a lively book designed
 * whole keeps every page clean, decorated at its level.
 */

type Name = 'rich' | 'sparse' | 'nostats';
const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as Record<
  Name,
  { input: BookDesignInput }
>;
const rich = fixtures.rich.input;

function input(name: Name): BookDesignInput {
  let n = 0;
  return { ...fixtures[name].input, newId: (p) => `${p}-${++n}`, stickers: BOOK_STICKERS };
}

const design = (name: Name, directives: BookDesignDirectivesInput): BookDesignResult =>
  designBook(null, input(name), directives);

/** A composing context as design_book makes one, for the rich journey. */
function ctxOf(raw: BookDesignDirectivesInput): ComposeCtx {
  const directives = bookDesignDirectivesSchema.parse(raw);
  const page = rich.page;
  const look = designLook(directives, page, rich.photos);
  let n = 0;
  const labels = {
    day: 'DAY',
    stations: 'Stops',
    summary: 'At a glance',
    countries: 'Countries',
    distance: '',
    pros: '',
    cons: '',
  };
  return {
    look,
    page,
    grid: designGrid(page),
    newId: (p) => `${p}-${++n}`,
    locale: 'en-GB',
    infos: new Map(rich.photos.map((p) => [p.photoId, p])),
    travel: { locale: 'en-GB', labels, stats: null, path: [], entries: [] },
    directives,
    notes: [],
    art: designArt(directives, look.theme, BOOK_STICKERS),
  };
}

const entry = rich.entries.find((e) => e.id === 3) as AutoEntry;
const gallery: AutoPhoto[] = rich.entries.flatMap((e) => e.photos);
const chapter = (photos: AutoPhoto[]): DesignChapter => ({
  key: 'e3',
  label: null,
  entries: [entry],
  photos,
  stations: false,
  burst: [],
});
const plan = (beat: PlannedSpread['beat'], photos: AutoPhoto[], withEntry = beat === 'hero'): PlannedSpread => ({
  beat,
  chapter: chapter(photos),
  entry: withEntry ? entry : null,
  photos,
});

const PW = rich.page.pageWidth;
const H = rich.page.pageHeight;

/** The words and photos that cross the fold: none may, but a photo across the whole spread. */
function acrossFold(elements: readonly BookElement[]): string[] {
  return elements.flatMap((e) => {
    if (e.kind !== 'photo' && e.kind !== 'text') return [];
    const b = turnedBox(e.frame, e.rotation);
    const crosses = b.x < PW - 1 && b.x + b.w > PW + 1;
    const spread = e.kind === 'photo' && b.w >= PW * 2;
    return crosses && !spread ? [e.id] : [];
  });
}

/** Words that leave the spread. */
const wordsOff = (elements: readonly BookElement[]) =>
  elements.flatMap((e) => {
    if (e.kind !== 'text') return [];
    const b = turnedBox(e.frame, e.rotation);
    return b.x < 0 || b.y < 0 || b.x + b.w > PW * 2 || b.y + b.h > H ? [e.id] : [];
  });

describe('where a book is lively', () => {
  it('DSNLIV-001: turns two in five hero and grid spreads of a lively book, from the seed, none of a calm one', () => {
    const plans = [
      ...Array.from({ length: 5 }, () => plan('hero', gallery.slice(0, 1))),
      ...Array.from({ length: 5 }, () => plan('grid', gallery.slice(1, 6))),
      plan('duo', gallery.slice(0, 2)),
      plan('grid', gallery.slice(0, 3)),
      plan('hero', gallery.slice(0, 1), false),
    ];
    for (const seed of [0, 1, 2, 3, 4]) {
      const count = { seen: 0 };
      const made = livelyPlans(ctxOf({ style: 'poster-pop', brief: { energy: 'lively' }, seed }), plans, count);
      const lively = made.filter((p) => (BOOK_DESIGN_LIVELY_BEATS as readonly string[]).includes(p.beat));
      expect({ seed, turned: lively.length }).toEqual({ seed, turned: 4 });
      expect(count.seen).toBe(10);
      // A duo, a grid of three and a hero without its entry are left as they are.
      expect(made.slice(10).map((p) => p.beat)).toEqual(['duo', 'grid', 'hero']);
      made.forEach((p, i) => {
        if (plans[i]?.beat === 'hero' && p.beat !== 'hero') expect(['script-overlay', 'two-tone']).toContain(p.beat);
        if (plans[i]?.beat === 'grid' && p.beat !== 'grid')
          expect(['collage', 'grid-badge', 'stamp-row']).toContain(p.beat);
      });
    }
    const calm = livelyPlans(ctxOf({ style: 'poster-pop' }), plans, { seen: 0 });
    expect(calm.map((p) => p.beat)).toEqual(plans.map((p) => p.beat));
    const collages = livelyPlans(ctxOf({ style: 'poster-pop', brief: { energy: 'loud', collage: true } }), plans, {
      seen: 0,
    });
    expect(
      collages.filter((p, i) => plans[i]?.beat === 'grid' && p.beat !== 'grid').every((p) => p.beat === 'collage'),
    ).toBe(true);
  });

  it('DSNLIV-012: makes the first hero or grid of a lively book lively, whatever the seed', () => {
    for (const seed of [0, 1, 2, 3, 4, 5]) {
      const [one] = livelyPlans(
        ctxOf({ style: 'riviera', brief: { energy: 'lively' }, seed }),
        [plan('hero', gallery.slice(0, 1))],
        {
          seen: 0,
        },
      );
      expect({ seed, lively: ['script-overlay', 'two-tone'].includes(one?.beat ?? '') }).toEqual({
        seed,
        lively: true,
      });
    }
  });

  it('DSNLIV-013: turns two in five grids of a calm book asked for collages into collages, and nothing else', () => {
    const plans = [
      ...Array.from({ length: 5 }, () => plan('hero', gallery.slice(0, 1))),
      ...Array.from({ length: 5 }, () => plan('grid', gallery.slice(1, 6))),
    ];
    const made = livelyPlans(ctxOf({ style: 'riviera', brief: { energy: 'calm', collage: true } }), plans, { seen: 0 });
    expect(made.slice(0, 5).map((p) => p.beat)).toEqual(Array(5).fill('hero'));
    expect(made.slice(5).filter((p) => p.beat === 'collage')).toHaveLength(2);
    expect(made.slice(5).every((p) => p.beat === 'collage' || p.beat === 'grid')).toBe(true);
    // The book designed so has its collages, its prints turned within the calm book's few degrees.
    const r = design('rich', { style: 'riviera', brief: { energy: 'calm', collage: true } });
    const collages = r.plan.filter((row) => row.beat === 'collage');
    expect(collages.length).toBeGreaterThan(0);
    for (const row of collages) {
      const prints = (r.doc.spreads[row.index]?.elements ?? []).filter((e) => e.kind === 'photo');
      expect(prints.every((e) => Math.abs(e.rotation) >= 1 && Math.abs(e.rotation) <= 2)).toBe(true);
    }
    expect(r.findings.filter((f) => f.code === 'energy_mismatch')).toEqual([]);
  });

  it('DSNLIV-002: counts a lively spread as the beat it took the place of, in the book rhythm', () => {
    expect(rhythmBeat('script-overlay')).toBe('hero');
    expect(rhythmBeat('two-tone')).toBe('hero');
    for (const beat of ['collage', 'grid-badge', 'stamp-row'] as const) expect(rhythmBeat(beat)).toBe('grid');
    for (const beat of ['hero', 'grid', 'duo', 'quiet', 'opener'] as const) expect(rhythmBeat(beat)).toBe(beat);
  });
});

describe('the lively spreads', () => {
  const c = () => ctxOf({ style: 'riviera', brief: { energy: 'lively' } });
  const rng = () => designRng(0, 'spec');
  const valid = (elements: readonly BookElement[]) => elements.every((e) => bookElementSchema.safeParse(e).success);

  it('DSNLIV-003: a collage lays the photos as turned, framed prints on both pages, none across the fold or over a detail', () => {
    const made = composeCollage(c(), gallery.slice(0, 5), 'left', rng()).elements;
    const prints = made.flatMap((e) => (e.kind === 'photo' ? [e] : []));
    expect(prints).toHaveLength(5);
    expect(valid(made)).toBe(true);
    expect(prints.every((p) => Math.abs(p.rotation) >= 3 && p.frameStyle !== 'none')).toBe(true);
    expect(prints.filter((p) => p.frame.x < PW)).toHaveLength(3);
    expect(acrossFold(made)).toEqual([]);
    // A later print never lies over the detail of one under it.
    prints.forEach((under, i) => {
      const fx = under.frame.x + under.focalX * under.frame.w;
      const fy = under.frame.y + under.focalY * under.frame.h;
      for (const above of prints.slice(i + 1)) {
        const b = turnedBox(above.frame, above.rotation);
        expect(fx >= b.x && fx <= b.x + b.w && fy >= b.y && fy <= b.y + b.h).toBe(false);
      }
    });
  });

  it('DSNLIV-004: a script overlay sets the place in a giant outlined script over the photo across the spread', () => {
    const made = composeScriptOverlay(c(), entry, gallery[0] as AutoPhoto, 'left', rng()).elements;
    expect(valid(made)).toBe(true);
    const [photo] = made;
    expect(photo?.kind === 'photo' && photo.frame.w >= PW * 2).toBe(true);
    const word = made.find((e) => e.kind === 'text' && e.binding?.source === 'entry.location');
    expect(word?.kind === 'text' && word.text).toBe('Porto');
    expect(word?.kind === 'text' && word.size).toBeGreaterThanOrEqual(60);
    expect(word?.kind === 'text' && (word.outline?.width ?? 0) > 0).toBe(true);
    expect(word?.kind === 'text' && word.font).toBe(c().look.theme.fonts.script?.font);
    const labels = made.filter((e) => e.kind === 'text' && !!e.highlight);
    expect(labels.map((e) => (e.kind === 'text' ? e.binding?.source : null))).toEqual(['entry.title', 'entry.date']);
    // The words stand on the page away from the photo's lead.
    expect(made.filter((e) => e.kind === 'text').every((e) => e.frame.x > PW)).toBe(true);
    expect(wordsOff(made)).toEqual([]);
  });

  it('DSNLIV-005: a two-tone split sets the title on a colour page of two blocks beside a photo to its bleed', () => {
    const made = composeTwoTone(c(), entry, gallery[0] as AutoPhoto, 'right', rng()).elements;
    expect(valid(made)).toBe(true);
    const blocks = made.flatMap((e) => (e.kind === 'shape' ? [e] : []));
    expect(blocks).toHaveLength(2);
    expect(blocks.every((b) => b.frame.x + b.frame.w <= PW + 0.01)).toBe(true);
    expect(blocks[0]?.fill).not.toBe(blocks[1]?.fill);
    const photo = made.find((e) => e.kind === 'photo');
    expect(photo?.frame.x).toBe(PW);
    const title = made.find((e) => e.kind === 'text' && e.binding?.source === 'entry.title');
    expect(title?.kind === 'text' && title.size).toBeGreaterThan(c().look.sizes.heading);
    expect(acrossFold(made)).toEqual([]);
    expect(wordsOff(made)).toEqual([]);
  });

  it('DSNLIV-006: a badge grid lays the photos edge to edge with a round badge of the place, off their details', () => {
    for (const count of [4, 6]) {
      const made = composeGridBadge(c(), gallery.slice(0, count), entry, 'left', rng()).elements;
      expect(valid(made)).toBe(true);
      const cells = made.filter((e) => e.kind === 'photo' && e.rotation === 0);
      expect(cells).toHaveLength(count);
      const disc = made.find((e) => e.kind === 'shape' && e.shape === 'ellipse' && e.fill !== null);
      expect(disc).toBeDefined();
      const centre = (disc?.frame.x ?? 0) + (disc?.frame.w ?? 0) / 2;
      expect(Math.abs(centre - PW / 2)).toBeLessThan(1);
      expect(made.some((e) => e.kind === 'text' && e.text === 'Porto')).toBe(true);
      expect(acrossFold(made)).toEqual([]);
    }
  });

  it('DSNLIV-007: a stamp row sets the photos as perforated stamps on both pages, and a postmark of the place', () => {
    const made = composeStampRow(c(), gallery.slice(0, 5), entry, 'left', rng()).elements;
    expect(valid(made)).toBe(true);
    const stamps = made.flatMap((e) => (e.kind === 'photo' ? [e] : []));
    expect(stamps).toHaveLength(5);
    expect(stamps.every((s) => s.edge === 'perforated' && !!s.border && s.frame.w <= PW * 0.4 + 0.01)).toBe(true);
    expect(made.some((e) => e.kind === 'text' && e.curve?.type === 'circle' && e.text === 'Porto')).toBe(true);
    expect(acrossFold(made)).toEqual([]);
    expect(wordsOff(made)).toEqual([]);
  });

  it('DSNLIV-014: a badge and a postmark are one group each, and the stamps lean as the book turns its prints', () => {
    const grouped = (elements: readonly BookElement[]) => {
      const parts = elements.filter((e) => e.kind !== 'photo' && e.kind !== 'shape' && e.kind !== 'sticker');
      return parts.length > 0 && parts.every((e) => e.group !== undefined && e.group === parts[0]?.group);
    };
    expect(grouped(composeGridBadge(c(), gallery.slice(0, 4), entry, 'left', rng()).elements)).toBe(true);
    const row = composeStampRow(c(), gallery.slice(0, 5), entry, 'left', rng()).elements;
    expect(grouped(row)).toBe(true);
    const stamps = row.filter((e) => e.kind === 'photo');
    expect(stamps.every((e) => Math.abs(e.rotation) >= 3 && Math.abs(e.rotation) <= 4.5)).toBe(true);
    const calm = composeStampRow(ctxOf({ style: 'riviera' }), gallery.slice(0, 5), entry, 'left', rng()).elements;
    expect(calm.filter((e) => e.kind === 'photo').every((e) => Math.abs(e.rotation) <= 2)).toBe(true);
  });

  it('DSNLIV-008: a lively beat its page cannot hold is composed as before', () => {
    const ctx = c();
    expect(composeLively(ctx, plan('collage', []), 'left', 0)).toBeNull();
    expect(composeLively(ctx, plan('script-overlay', gallery.slice(0, 1), false), 'left', 0)).not.toBeNull();
    expect(composeLively(ctx, { ...plan('two-tone', []), entry }, 'left', 0)).toBeNull();
    expect(composeLively(ctx, plan('duo', gallery.slice(0, 2)), 'left', 0)).toBeNull();
    const spread = innerSpread(
      ctx,
      composeLively(ctx, plan('stamp-row', gallery.slice(0, 2)), 'right', 3)?.elements ?? [],
      3,
    );
    expect(spread.elements.length).toBeGreaterThan(0);
  });
});

describe('a lively book', () => {
  const inner = (r: BookDesignResult) => r.doc.spreads.filter((s) => s.role === 'inner');
  const stickers = (s: BookSpread) => s.elements.filter((e) => e.kind === 'sticker');

  it('DSNLIV-009: is designed with lively pages, every page clean, the same for one seed', () => {
    for (const name of ['rich', 'nostats'] as const) {
      const directives: BookDesignDirectivesInput = {
        style: 'tropical',
        brief: { energy: 'loud', decoration: 'rich' },
      };
      const r = design(name, directives);
      expect(r.plan.some((row) => (BOOK_DESIGN_LIVELY_BEATS as readonly string[]).includes(row.beat))).toBe(true);
      for (const spread of r.doc.spreads) {
        const left = pageFindings(spread, r.doc.page, fixtures[name].input.photos).filter((f) => f.severity !== 'info');
        expect({ name, spread: spread.id, left }).toEqual({ name, spread: spread.id, left: [] });
      }
      expect(JSON.stringify(design(name, directives).doc)).toBe(JSON.stringify(r.doc));
    }
  });

  it('DSNLIV-010: is decorated at its level from the theme motifs, never over words, and a calm book not at all', () => {
    const motif = new Set(BOOK_STICKERS.filter((s) => s.theme === 'tropical').map((s) => s.id));
    const rich3 = inner(design('rich', { style: 'tropical', brief: { energy: 'lively', decoration: 'rich' } }));
    const counts = rich3.map((s) => stickers(s).length);
    expect(Math.max(...counts)).toBeLessThanOrEqual(6);
    expect(counts.filter((n) => n >= 3).length).toBeGreaterThan(counts.length / 2);
    for (const s of rich3) {
      expect(stickers(s).every((k) => k.kind === 'sticker' && motif.has(k.stickerId))).toBe(true);
      const covering = pageFindings(s, rich.page, rich.photos).filter(
        (f) => f.code === 'overlap' && f.message.startsWith('sticker'),
      );
      expect(covering).toEqual([]);
    }
    const light = inner(design('rich', { style: 'tropical', brief: { energy: 'lively', decoration: 'light' } }));
    expect(Math.max(...light.map((s) => stickers(s).length))).toBeLessThanOrEqual(2);
    const calm = inner(design('rich', { style: 'tropical' }));
    expect(calm.flatMap(stickers)).toEqual([]);
    const bare = inner(design('rich', { style: 'tropical', brief: { energy: 'loud', decoration: 'none' } }));
    expect(bare.flatMap(stickers)).toEqual([]);
  });

  it('DSNLIV-015: is never judged against its brief for what the engine made of it, decorated or not', () => {
    const briefs = [
      { energy: 'calm', decoration: 'light' },
      { energy: 'lively', decoration: 'none' },
      { energy: 'loud', decoration: 'none' },
      { energy: 'lively' },
    ] as const;
    for (const name of ['rich', 'sparse', 'nostats'] as const) {
      for (const theme of ['nordic', 'poster-pop'] as const) {
        for (const brief of briefs) {
          const r = design(name, { brief: { ...brief, theme }, cover: { archetype: 'poster-pop' } });
          const said = r.findings.filter((f) => f.code === 'energy_mismatch').map((f) => f.message);
          expect({ name, theme, brief, said }).toEqual({ name, theme, brief, said: [] });
        }
      }
    }
    // A lively book turns and frames its prints on the calm pages too.
    const lively = inner(design('rich', { brief: { energy: 'lively', decoration: 'none', theme: 'nordic' } }));
    const prints = lively.flatMap((s) => s.elements.filter((e) => e.kind === 'photo' && Math.abs(e.rotation) >= 3));
    expect(prints.some((e) => e.kind === 'photo' && e.frameStyle === 'white')).toBe(true);
  });

  it('DSNLIV-011: takes the theme of its brief as its style, and says what of the brief it could not keep', () => {
    const r = design('rich', { style: 'classic', brief: { energy: 'lively', decoration: 'light', theme: 'nordic' } });
    expect(r.doc.theme?.id).toBe('nordic');
    expect(r.findings.filter((f) => f.code === 'energy_mismatch').every((f) => f.severity === 'info')).toBe(true);
    const unbriefed = design('rich', { style: 'nordic' });
    expect(unbriefed.findings.some((f) => f.code === 'energy_mismatch')).toBe(false);
  });
});
