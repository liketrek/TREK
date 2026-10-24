import { BOOK_COVER_ARCHETYPES } from '../book-archetypes';
import { BOOK_COVER_TEMPLATES, BOOK_TEMPLATES } from '../book-layouts';
import { bookPageSetupForPreset } from '../book-pages';
import { MAX_SPREAD_ELEMENTS, type BookElement } from '../book.schema';
import { listBookLayouts } from '../describe-spread';
import { bookSticker } from '../stickers/sticker-catalogue';
import { BOOK_COLOR_TOKENS, BOOK_FONT_SLOTS } from '../theme/book-theme.schema';
import {
  BOOK_DECORATED_TEMPLATES,
  decoratedTemplateRow,
  decoratedTemplatesFor,
  findDecoratedTemplate,
  isBookTemplateId,
} from './template-catalogue';
import {
  BOOK_TEMPLATE_TEXT_ROLES,
  bookDecoratedTemplateSchema,
  templatePhotoIndex,
  templatePhotoSlots,
  templateRoles,
  type BookDecoratedTemplate,
} from './template-format';
import { layTemplateElement, templatePage } from './template-lay';

import { describe, expect, it } from 'vitest';

// TPLCAT-001 to TPLCAT-010

/**
 * The decorated templates as data: the set the plan asks for, every template
 * in the format's contract, every element a valid document element once laid
 * on a page, its roles and links well formed, and every frame either on the
 * page or bleeding on purpose.
 */

const square = bookPageSetupForPreset('square-210');
const covers = BOOK_DECORATED_TEMPLATES.filter((t) => t.kind === 'single');
const spreads = BOOK_DECORATED_TEMPLATES.filter((t) => t.kind === 'inner');

/** A template's elements on the 210 mm square, nothing poured in. */
function laid(tpl: BookDecoratedTemplate) {
  const at = templatePage(square, tpl.kind === 'inner' ? 2 : 1);
  return tpl.elements.map((src, i) => ({ src, laid: layTemplateElement(src, at, null, `e${i}`) }));
}

/** The box an element covers on the page, turned with it. */
function box(el: BookElement) {
  const { x, y, w, h } = el.frame;
  const rad = (el.rotation * Math.PI) / 180;
  const bw = w * Math.abs(Math.cos(rad)) + h * Math.abs(Math.sin(rad));
  const bh = w * Math.abs(Math.sin(rad)) + h * Math.abs(Math.cos(rad));
  return { x: x + w / 2 - bw / 2, y: y + h / 2 - bh / 2, w: bw, h: bh };
}

const camel = (id: string) => id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

describe('the decorated template set', () => {
  it('TPLCAT-001: holds 21 covers, three in each archetype, and 16 double spreads', () => {
    expect(covers).toHaveLength(21);
    expect(spreads).toHaveLength(16);
    for (const archetype of BOOK_COVER_ARCHETYPES) {
      expect(decoratedTemplatesFor('single', archetype), archetype).toHaveLength(3);
      expect(decoratedTemplatesFor('inner', archetype).length, archetype).toBeGreaterThanOrEqual(1);
    }
  });

  it('TPLCAT-002: gives every template a unique id, distinct from the built-in layouts, and a label key from it', () => {
    const ids = BOOK_DECORATED_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const builtIn = new Set([...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES].map((t) => t.id));
    for (const id of ids) expect(builtIn.has(id), id).toBe(false);
    for (const tpl of BOOK_DECORATED_TEMPLATES) expect(tpl.labelKey).toBe(`studio.templates.name.${camel(tpl.id)}`);
  });

  it('TPLCAT-003: holds every template to the format, with tags and a line a model can choose by', () => {
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      const parsed = bookDecoratedTemplateSchema.safeParse(tpl);
      expect(parsed.success, `${tpl.id}: ${parsed.success ? '' : parsed.error.message}`).toBe(true);
      expect(tpl.descr, tpl.id).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it('TPLCAT-004: lays every element on a page as a valid document element, stickers from the library', () => {
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      expect(tpl.elements.length, tpl.id).toBeLessThanOrEqual(MAX_SPREAD_ELEMENTS);
      for (const { src, laid: out } of laid(tpl)) {
        expect(out, `${tpl.id} ${src.id}`).not.toBeNull();
        if (src.kind === 'sticker') expect(bookSticker(src.stickerId), `${tpl.id} ${src.stickerId}`).toBeDefined();
      }
    }
  });

  it('TPLCAT-005: gives every role once, numbers the photo frames from 1 without a gap, and roles only what can take them', () => {
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      const roles = templateRoles(tpl);
      expect(new Set(roles).size, tpl.id).toBe(roles.length);
      const photos = roles.map(templatePhotoIndex).filter((n): n is number => n !== null);
      expect(
        [...photos].sort((a, b) => a - b),
        tpl.id,
      ).toEqual(photos.map((_, i) => i + 1).sort((a, b) => a - b));
      expect(templatePhotoSlots(tpl), tpl.id).toBe(photos.length);
      for (const el of tpl.elements) {
        const where = `${tpl.id} ${el.id}`;
        if (el.kind === 'photo') expect(templatePhotoIndex(el.role), where).not.toBeNull();
        if (el.kind === 'map') expect(el.role, where).toBe('map');
        if (el.kind === 'badge') expect(el.role, where).toBe('date');
        if (el.role && (BOOK_TEMPLATE_TEXT_ROLES as readonly string[]).includes(el.role)) {
          expect(['text', 'badge'], where).toContain(el.kind);
        }
        if (el.fillPhoto) expect(roles, where).toContain(el.fillPhoto);
      }
      expect(roles, tpl.id).toContain('title');
    }
  });

  it('TPLCAT-006: links colours to theme tokens and texts to typeface slots that exist', () => {
    const tokens: readonly string[] = BOOK_COLOR_TOKENS;
    const slots: readonly string[] = BOOK_FONT_SLOTS;
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      if (tpl.backgroundToken) expect(tokens, tpl.id).toContain(tpl.backgroundToken);
      for (const el of tpl.elements) {
        const links = el as { token?: string; strokeToken?: string; accentToken?: string; fontRole?: string };
        for (const t of [links.token, links.strokeToken, links.accentToken, el.on]) {
          if (t !== undefined) expect(tokens, `${tpl.id} ${el.id}`).toContain(t);
        }
        if (links.fontRole !== undefined) expect(slots, `${tpl.id} ${el.id}`).toContain(links.fontRole);
        if (el.kind === 'text' && el.role === 'title') expect(links.fontRole, `${tpl.id} title`).toBeDefined();
      }
    }
  });

  it('TPLCAT-007: keeps words inside the safe area, out of the fold, and every frame on the page or bleeding on purpose', () => {
    const { pageWidth: pw, pageHeight: ph, safe, bleed } = square;
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      const across = tpl.kind === 'inner' ? 2 : 1;
      for (const { src, laid: out } of laid(tpl)) {
        if (!out) continue;
        const b = box(out.el);
        const where = `${tpl.id} ${src.id}`;
        // Nothing lies off the page.
        expect(b.x < pw * across && b.x + b.w > 0 && b.y < ph && b.y + b.h > 0, where).toBe(true);
        if (out.el.kind === 'text' || out.el.kind === 'badge') {
          expect(b.x >= safe - 0.01 && b.y >= safe - 0.01, where).toBe(true);
          expect(b.x + b.w <= pw * across - safe + 0.01 && b.y + b.h <= ph - safe + 0.01, where).toBe(true);
        }
        const crosses = across === 2 && b.x < pw - 2 && b.x + b.w > pw + 2;
        if (!crosses) continue;
        // Across the fold only a photo or a shape, and only as a band or a picture that runs to the bleed.
        expect(['photo', 'shape', 'line'], where).toContain(out.el.kind);
        const bleedsAcross = b.x <= -bleed + 0.01 && b.x + b.w >= pw * 2 + bleed - 0.01;
        const bleedsDown = b.y <= -bleed + 0.01 && b.y + b.h >= ph + bleed - 0.01;
        expect(bleedsAcross || bleedsDown, where).toBe(true);
      }
    }
  });
});

describe('the lockups of a template', () => {
  it('TPLCAT-010: groups two or more elements next to each other in paint order, a badge with every word on it', () => {
    let lockups = 0;
    for (const tpl of BOOK_DECORATED_TEMPLATES) {
      const at = new Map<string, number[]>();
      tpl.elements.forEach((el, i) => {
        if (el.group) at.set(el.group, [...(at.get(el.group) ?? []), i]);
      });
      for (const [group, places] of at) {
        const where = `${tpl.id} ${group}`;
        expect(places.length, where).toBeGreaterThanOrEqual(2);
        expect((places.at(-1) ?? 0) - (places[0] ?? 0) + 1, where).toBe(places.length);
      }
      lockups += at.size;
    }
    expect(lockups).toBeGreaterThanOrEqual(BOOK_DECORATED_TEMPLATES.length);
    for (const id of ['grid-badge-circle', 'grid-badge-stamp', 'grid-badge-seal']) {
      const tpl = findDecoratedTemplate(id) as BookDecoratedTemplate;
      const words = tpl.elements.filter((e) => e.kind === 'text');
      expect(
        words.every((e) => e.group === 'badge' && e.keep === true && e.on !== undefined),
        id,
      ).toBe(true);
    }
  });
});

describe('finding the templates', () => {
  it('TPLCAT-008: finds a template by id and narrows the set by page kind and archetype', () => {
    expect(findDecoratedTemplate('postcard-houses')?.kind).toBe('single');
    expect(findDecoratedTemplate('polaroid-stack')?.kind).toBe('inner');
    expect(findDecoratedTemplate('no-such-template')).toBeUndefined();
    expect(decoratedTemplatesFor('single').every((t) => t.kind === 'single')).toBe(true);
    expect(decoratedTemplatesFor('inner', 'postcard').every((t) => t.archetype === 'postcard')).toBe(true);
    expect(decoratedTemplatesFor('single', null)).toHaveLength(21);
    expect(isBookTemplateId('grid-badge-circle')).toBe(true);
    expect(isBookTemplateId('two-up')).toBe(true);
    expect(isBookTemplateId('cover-full')).toBe(true);
    expect(isBookTemplateId('nothing-like-it')).toBe(false);
  });

  it('TPLCAT-009: lists every template for list_book_layouts with its archetype, tags, photo frames and word roles', () => {
    const row = decoratedTemplateRow(findDecoratedTemplate('hero-trio-wordart') as BookDecoratedTemplate);
    expect(row).toMatchObject({ id: 'hero-trio-wordart', archetype: 'poster-pop', photoSlots: 4 });
    expect(row.roles).toEqual(['title', 'date', 'body']);
    expect(row.tags).toContain('word-art');
    const all = listBookLayouts(null, square);
    expect(all.decorated.single).toHaveLength(21);
    expect(all.decorated.inner).toHaveLength(16);
    expect(all.notes.decorated).toMatch(/whole designed page/);
    const inner = listBookLayouts(null, square, 'inner');
    expect([inner.decorated.single, inner.decorated.inner.length]).toEqual([[], 16]);
  });
});
