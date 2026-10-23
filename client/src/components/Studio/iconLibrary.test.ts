/**
 * FE-STUDIO-ICON-001 to FE-STUDIO-ICON-002
 *
 * The icons the book engine takes (BOOK_ICON_NAMES in @trek/shared) are the
 * drawings the Studio's icon tab offers, no more and no fewer: one the engine
 * took that this lucide does not have would print as the fallback glyph, and
 * one the tab offers that the engine refused would be a drawing a person can
 * place and the assistant cannot. When lucide-react moves, run
 * `node scripts/gen-book-icon-names.mjs` in shared/ and this passes again.
 */
import { BOOK_DESIGN_ICONS, BOOK_ICON_NAMES } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { FEATURED_ICONS, ICON_NAMES } from './iconLibrary';

describe('the icons the book engine takes', () => {
  it('FE-STUDIO-ICON-001: are every drawing the icon tab offers, and nothing it does not', () => {
    // `Icon` is the component every drawing is built on, not a drawing.
    const offered = ICON_NAMES.filter((name) => name !== 'Icon');
    const missing = offered.filter((name) => !BOOK_ICON_NAMES.has(name));
    const extra = [...BOOK_ICON_NAMES].filter((name) => !offered.includes(name));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('FE-STUDIO-ICON-002: hold the whole travel shelf the tab opens on', () => {
    expect(BOOK_DESIGN_ICONS.filter((name) => !BOOK_ICON_NAMES.has(name))).toEqual([]);
    expect(FEATURED_ICONS).toEqual([...BOOK_DESIGN_ICONS]);
  });
});
