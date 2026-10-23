import { BOOK_DESIGN_ICONS, BOOK_ICON_NAMES } from './book-icons';
import * as described from './book-op-enums';
import { bookPageOpSchema } from './book-ops.schema';
import { BOOK_FONTS_IDS, BOOK_SHAPES, bookPhotoElementSchema } from './book.schema';
import { bookDesignDirectivesSchema } from './design/design-directives.schema';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// BKENUM-001 to BKENUM-004

/**
 * The enums the book tools show a model: each says what its values mean, the
 * values stay the document's own, and an icon is any drawing of the Studio's
 * icon tab, refused by name exactly as an enum would refuse it.
 */

const schemas = Object.entries(described as Record<string, unknown>).filter(
  (entry): entry is [string, z.ZodType] => entry[1] instanceof z.ZodType,
);

describe('the described enums', () => {
  it('BKENUM-001: say what their values mean in one line each, without dashes', () => {
    expect(schemas.length).toBeGreaterThan(20);
    for (const [name, schema] of schemas) {
      const text = schema.description ?? '';
      expect(text.length, name).toBeGreaterThan(10);
      expect(text, name).not.toMatch(/[\u2013\u2014\n]/);
    }
    expect(described.BOOK_BINDING_HINT).not.toMatch(/[\u2013\u2014\n]/);
  });

  it('BKENUM-002: keep the values of the document they describe', () => {
    expect(described.bookFontIdSchema.options).toEqual([...BOOK_FONTS_IDS]);
    expect(described.bookShapeIdSchema.options).toEqual([...BOOK_SHAPES]);
    const frameStyles = bookPhotoElementSchema.shape.frameStyle.unwrap().options;
    expect(described.bookFrameStyleSchema.options).toEqual(frameStyles);
    for (const font of BOOK_FONTS_IDS) expect(String(described.bookFontIdSchema.description)).toContain(font);
  });

  it('BKENUM-003: carry their meaning into the page edit and the design directives a model reads', () => {
    const page = JSON.stringify(z.toJSONSchema(bookPageOpSchema, { io: 'input' }));
    for (const line of [described.bookFontIdSchema, described.bookShapeIdSchema, described.bookFrameStyleSchema]) {
      expect(page).toContain(String(line.description));
    }
    const design = JSON.stringify(z.toJSONSchema(bookDesignDirectivesSchema, { io: 'input' }));
    expect(design).toContain('Photos per spread: airy 1 to 2');
    expect(design).toContain(String(described.bookFontIdSchema.description));
  });
});

describe('the icon names', () => {
  it('BKENUM-004: take every drawing of the icon tab, the travel shelf and old names among them, and nothing else', () => {
    expect(BOOK_ICON_NAMES.size).toBeGreaterThan(1500);
    for (const name of [...BOOK_DESIGN_ICONS, 'Pizza', 'AlertTriangle', 'ZoomOut']) {
      expect(described.bookIconNameSchema.safeParse(name).success, name).toBe(true);
    }
    for (const name of ['NotAnIcon', 'PizzaIcon', 'LucidePizza', 'Icon', 'pizza', '']) {
      expect(described.bookIconNameSchema.safeParse(name).success, name).toBe(false);
    }
  });
});
