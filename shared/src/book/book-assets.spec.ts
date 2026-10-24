import {
  BOOK_ASSET_KINDS,
  listBookAssetsRequestSchema,
  listBookCatalogue,
  type BookShapeAssetRow,
} from './book-assets';
import { BOOK_FONTS_IDS } from './book-fonts.data';
import { BOOK_LOCKUPS } from './book-lockups.data';
import { BOOK_PATTERNS } from './book-paint.schema';
import { BOOK_FRAME_SHAPES, BOOK_SHAPE_GROUPS } from './book-shape-catalogue';
import { bookShapeTakesEdge } from './book-shapes-more';
import { BOOK_SHAPES } from './book.schema';
import { BOOK_THEME_IDS } from './theme/book-theme.schema';

import { describe, expect, it } from 'vitest';

/**
 * `list_book_assets` beyond stickers (book-assets.ts): the shapes, the faces,
 * the lockups, the themes and the patterns, each a row of id, line and tags
 * with what it takes, searched the way the stickers are, and the one list of
 * shape groups and frames the Studio's panels read too.
 */

const all = (kind: Exclude<(typeof BOOK_ASSET_KINDS)[number], 'sticker'>) => listBookCatalogue(kind, { limit: 40 });
const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id);

describe('the catalogues list_book_assets lists', () => {
  it('BKASSET-001: takes the six kinds, templates staying with list_book_layouts', () => {
    expect(BOOK_ASSET_KINDS).toEqual(['sticker', 'shape', 'font', 'lockup', 'theme', 'pattern']);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'lockup', query: 'badge' }).success).toBe(true);
    expect(listBookAssetsRequestSchema.safeParse({ kind: 'template' }).success).toBe(false);
  });

  it('BKASSET-002: lists every shape with a line, its group, whether it frames a photo and takes a cut edge', () => {
    const found = listBookCatalogue('shape', {});
    expect(found.total).toBe(BOOK_SHAPES.length);
    expect(found.rows).toHaveLength(40);
    const rows = listBookCatalogue('shape', { limit: 40, query: 'arch' }).rows as BookShapeAssetRow[];
    expect(rows[0]?.id).toBe('arch');
    const tall = rows.find((r) => r.id === 'arch-tall');
    expect(tall).toMatchObject({ frame: true, edges: true, tags: ['arches', 'frame', 'edge'] });
    expect(tall?.descr).toMatch(/arch/i);
    for (const row of listBookCatalogue('shape', { query: 'star' }).rows as BookShapeAssetRow[]) {
      expect(row.edges).toBe(bookShapeTakesEdge(row.id));
      expect(row.descr.length).toBeGreaterThan(5);
    }
    expect(ids(listBookCatalogue('shape', { tags: ['ornaments'] }).rows)).toEqual([
      'flourish-scroll',
      'laurel',
      'fleuron',
      'corner-flourish',
    ]);
  });

  it('BKASSET-003: keeps the shape groups and frames to shapes the book draws, each shape in one group at most', () => {
    const grouped = BOOK_SHAPE_GROUPS.flatMap((g) => g.shapes);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(grouped.every((s) => (BOOK_SHAPES as readonly string[]).includes(s))).toBe(true);
    expect(BOOK_FRAME_SHAPES.every((s) => (BOOK_SHAPES as readonly string[]).includes(s))).toBe(true);
  });

  it('BKASSET-004: lists every face by its role, with its weights and whether it has a real italic', () => {
    expect(ids(listBookCatalogue('font', { limit: 40 }).rows)).toEqual([...BOOK_FONTS_IDS]);
    const scripts = listBookCatalogue('font', { tags: ['script'] }).rows;
    expect(scripts.length).toBeGreaterThanOrEqual(10);
    const caveat = scripts.find((r) => r.id === 'caveat');
    expect(caveat).toMatchObject({ weights: [400, 500, 600, 700], italic: false, caps: false });
    expect(caveat?.descr).toBe('Caveat, a script for words laid over a title or a photo');
    expect(caveat?.tags).toEqual(['script']);
    expect(listBookCatalogue('font', { query: 'bebas' }).rows[0]).toMatchObject({ id: 'bebas', caps: true });
    expect(listBookCatalogue('font', { query: 'garamond' }).rows[0]).toMatchObject({ id: 'garamond', italic: true });
  });

  it('BKASSET-005: lists the lockups with the word roles each takes', () => {
    expect(ids(all('lockup').rows)).toEqual(BOOK_LOCKUPS.map((l) => l.id));
    const badge = listBookCatalogue('lockup', { query: 'circle badge' }).rows[0];
    expect(badge).toMatchObject({ id: 'circle-badge', words: ['kicker', 'title', 'year'] });
    expect(ids(listBookCatalogue('lockup', { tags: ['quote'] }).rows)).toEqual(['quote-classic', 'quote-band']);
  });

  it('BKASSET-006: lists the themes with their palette, faces, motifs and decoration', () => {
    expect(ids(all('theme').rows)).toEqual([...BOOK_THEME_IDS]);
    const tropical = listBookCatalogue('theme', { tags: ['tropical'] }).rows.map((r) => r.id);
    expect(tropical).toContain('tropical');
    expect(listBookCatalogue('theme', { query: 'riviera' }).rows[0]).toMatchObject({
      id: 'riviera',
      fonts: { display: 'fraunces 600', script: 'vibes 400' },
      palette: { paper: expect.stringMatching(/^#[0-9a-f]{6}$/) },
    });
  });

  it('BKASSET-007: lists the patterns, and answers how many it found beyond the limit', () => {
    expect(ids(all('pattern').rows)).toEqual([...BOOK_PATTERNS]);
    expect(listBookCatalogue('pattern', { query: 'check' }).rows[0]?.id).toBe('checker');
    const two = listBookCatalogue('pattern', { limit: 2 });
    expect([two.total, two.rows.length]).toEqual([BOOK_PATTERNS.length, 2]);
    expect(listBookCatalogue('pattern', { query: 'unicorn' })).toEqual({ total: 0, rows: [] });
  });
});
