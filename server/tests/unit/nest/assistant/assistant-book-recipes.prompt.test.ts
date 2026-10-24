/**
 * The art director's index and recipes (ASTRCP-*): placed before the
 * designer's rules for those who may change the book, built from the
 * catalogues so it names only what the book has, its recipes JSON a model
 * can send as the page edit's operations, and kept to a budget the prompt
 * cache carries every turn.
 */
import { BOOK_DESIGN_PROMPT } from '../../../../src/nest/assistant/assistant-book-design.prompt';
import { BOOK_RECIPES_PROMPT } from '../../../../src/nest/assistant/assistant-book-recipes.prompt';
import { studioPrompt } from '../../../../src/nest/assistant/assistant.prompt';
import {
  BOOK_COVER_ARCHETYPES,
  BOOK_FONTS_IDS,
  BOOK_LOCKUPS,
  BOOK_PATTERNS,
  BOOK_SHAPES,
  BOOK_THEME_IDS,
  bookPageOpSchema,
} from '@trek/shared';
import { BOOK_STICKERS } from '@trek/shared/stickers';

import { describe, expect, it } from 'vitest';

type Item = Record<string, unknown>;

/** The recipe lines, by name, with the JSON array each gives. */
function recipes(): Map<string, Item[]> {
  const out = new Map<string, Item[]>();
  for (const line of BOOK_RECIPES_PROMPT.split('\n')) {
    const found = /^- ([a-z -]+): (\[.*\])(?:[ ,;]|$)/.exec(line);
    if (!found?.[1] || !found[2]) continue;
    // The array ends at the bracket that closes it, before any words after it.
    let depth = 0;
    let end = 0;
    for (let i = 0; i < found[2].length; i++) {
      const ch = found[2][i];
      if (ch === '[') depth += 1;
      if (ch === ']') depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
    out.set(found[1], JSON.parse(found[2].slice(0, end)) as Item[]);
  }
  return out;
}

/** The theme's colours the recipes name, as a theme would give them. */
const COLOURS: Record<string, string> = {
  accent: '#c2410c',
  accent2: '#e9b86f',
  accent3: '#4a6b5c',
  paper: '#ffffff',
  ink: '#1a1a1a',
};

/** An item with its named colours as hex, as the model sends them where no token is taken. */
function hexed(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hexed);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      ['color', 'fg', 'bg'].includes(k) ? (COLOURS[String(v)] ?? v) : hexed(v),
    ]),
  );
}

const frameOf = (f: unknown) => {
  const [x, y, w, h] = f as number[];
  return { x, y, w, h };
};

/** The operations one recipe item stands for: add with its content then style with the rest, a lockup, a background. */
function opsOf(raw: Item): unknown[] {
  const item = hexed(raw) as Item;
  if ('lockup' in item)
    return [{ op: 'add_lockup', lockup: item.lockup, words: { title: 'T' }, box: frameOf(item.box) }];
  if ('background' in item) return [{ op: 'background', color: COLOURS[String(item.background)] }];
  const { kind, frame, rotation, photoId, text, binding, shape, stickerId, ...look } = item;
  const content: Item = { kind };
  if (photoId !== undefined) content.photoId = 7;
  if (text !== undefined) content.text = text;
  if (binding) content.binding = { ...(binding as Item), ...((binding as Item).entryId ? { entryId: 3 } : {}) };
  if (shape !== undefined) content.shape = shape;
  if (stickerId !== undefined) content.stickerId = BOOK_STICKERS[0]?.id;
  const add = { op: 'add', element: content, frame: frameOf(frame), ...(rotation !== undefined ? { rotation } : {}) };
  return Object.keys(look).length ? [add, { op: 'style', elementId: 'r-1', set: { kind, ...look } }] : [add];
}

describe('the art director in the Studio', () => {
  it('ASTRCP-001: comes before the designer rules for those who may change the book, never for a viewer', () => {
    const writer = studioPrompt('German', true);
    expect(writer).toContain(`\n\n${BOOK_RECIPES_PROMPT}\n\n${BOOK_DESIGN_PROMPT}`);
    expect(writer.endsWith(BOOK_DESIGN_PROMPT)).toBe(true);
    expect(studioPrompt('German', false)).not.toContain('Art direction:');
    expect(studioPrompt('German', true)).toBe(writer);
  });

  it('ASTRCP-002: asks for the brief first and indexes every theme, archetype and face', () => {
    expect(BOOK_RECIPES_PROMPT).toContain('Write the brief before design_book');
    expect(BOOK_RECIPES_PROMPT).toContain('directives.brief');
    for (const id of BOOK_THEME_IDS) expect(BOOK_RECIPES_PROMPT, id).toContain(`${id} (`);
    for (const archetype of BOOK_COVER_ARCHETYPES)
      expect(BOOK_RECIPES_PROMPT, archetype).toContain(`- ${archetype}: [`);
    const faces = BOOK_RECIPES_PROMPT.split('\n').find((line) => line.startsWith('- Faces by role')) ?? '';
    for (const id of BOOK_FONTS_IDS) expect(faces, id).toMatch(new RegExp(`[ :,]${id}[,;.]`));
    for (const recipe of ['- script overlay: [', '- collage: [', '- two-tone: ['])
      expect(BOOK_RECIPES_PROMPT).toContain(recipe);
  });

  it('ASTRCP-003: gives every recipe as operations the page edit takes, naming only what the book has', () => {
    const all = recipes();
    expect([...all.keys()]).toEqual([...BOOK_COVER_ARCHETYPES, 'script overlay', 'collage', 'two-tone']);
    const items = [...all.values()].flat();
    for (const item of items) {
      for (const op of opsOf(item)) {
        const parsed = bookPageOpSchema.safeParse(op);
        expect({ op, ok: parsed.success }).toEqual({ op, ok: true });
      }
    }
    const lockups = items.flatMap((i) => (typeof i.lockup === 'string' ? [i.lockup] : []));
    expect(lockups).toEqual(['title-script-year', 'circle-badge', 'postmark']);
    for (const id of lockups) expect(BOOK_LOCKUPS.map((l) => l.id)).toContain(id);
    const shapes = items.flatMap((i) => [i.shape, i.mask].filter((v): v is string => typeof v === 'string'));
    expect(shapes.length).toBeGreaterThanOrEqual(8);
    for (const id of shapes) expect(BOOK_SHAPES as readonly string[], id).toContain(id);
    const patterns = items.flatMap((i) => {
      const paint = i.paint as { pattern?: string } | undefined;
      return paint?.pattern ? [paint.pattern] : [];
    });
    expect(patterns).toEqual(['checker']);
    for (const id of patterns) expect(BOOK_PATTERNS as readonly string[]).toContain(id);
  });

  it('ASTRCP-005: sets the spine-band title along the band, the frame turned about its centre on the page', () => {
    const spine = recipes().get('spine-band') ?? [];
    const band = spine.find((i) => i.shape === 'rect');
    const title = spine.find((i) => (i.binding as Item | undefined)?.source === 'journey.title');
    expect(band?.frame).toEqual([-2, -2, 18, 104]);
    expect(title?.rotation).toBe(-90);
    const [x, y, w, h] = title?.frame as number[];
    // Turned a quarter, a box 74 by 10 stands 10 wide and 74 tall about the same centre: on the band, on the page.
    const turned = { x: x + w / 2 - h / 2, y: y + h / 2 - w / 2, w: h, h: w };
    expect(turned.x).toBeGreaterThanOrEqual(0);
    expect(turned.x + turned.w).toBeLessThanOrEqual(16);
    expect(turned.y).toBeGreaterThanOrEqual(5);
    expect(turned.y + turned.h).toBeLessThanOrEqual(95);
    // The grid's cells run past the trim, a cross of paper between them.
    const cells = (recipes().get('grid-badge') ?? []).filter((i) => i.kind === 'photo').map((i) => i.frame as number[]);
    expect(cells.map(([cx]) => cx)).toEqual([-2, 51.2, -2, 51.2]);
    expect(Math.round(((cells[1]?.[0] ?? 0) - ((cells[0]?.[0] ?? 0) + (cells[0]?.[2] ?? 0))) * 10) / 10).toBe(2.4);
  });

  it('ASTRCP-004: keeps to a budget the cache carries every turn, without dashes', () => {
    expect(BOOK_RECIPES_PROMPT.length).toBeLessThan(9500);
    expect(BOOK_RECIPES_PROMPT.split('\n').length).toBeLessThanOrEqual(24);
    expect(BOOK_RECIPES_PROMPT).not.toMatch(/[\u2013\u2014]/);
    expect(BOOK_RECIPES_PROMPT).not.toContain(' - ');
  });
});
