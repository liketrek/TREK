import en from '../i18n/en';
import { BOOK_FRAME_SHAPES, BOOK_SHAPE_GROUPS } from './book-shape-catalogue';

import { describe, expect, it } from 'vitest';

/**
 * Every shape the Studio offers has a name in en, which the client's
 * `shapeName` reads for the tooltip and the screen reader of the shape's
 * button (client/scripts/i18n-keys.mjs allows the key built from the id).
 */
describe('the shape catalogue', () => {
  it('BKSHAPE-001: names every shape of the shelves and every frame shape in en', () => {
    const ids = new Set([...BOOK_SHAPE_GROUPS.flatMap((g) => g.shapes), ...BOOK_FRAME_SHAPES]);
    const strings = en as Record<string, string>;
    for (const id of ids) expect(strings[`journey.studio.shapeName.${id}`], id).toBeTruthy();
  });
});
