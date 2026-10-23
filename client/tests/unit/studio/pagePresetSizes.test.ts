/**
 * PRESETS-001
 *
 * The format sizes live in two places: the Studio's picker here, and shared,
 * where the assistant's create_book lays a new book down. This holds them to
 * the same millimetres, so a book made either way has the same trim.
 */
import { BOOK_PAGE_PRESET_SIZES } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { PAGE_PRESETS } from '../../../src/components/Studio/pagePresets';

describe('page format sizes', () => {
  it('PRESETS-001: match the shared table a new book is laid down with, format for format', () => {
    const fromStudio: Record<string, object> = {};
    for (const p of Object.values(PAGE_PRESETS)) {
      fromStudio[p.id] = { pageWidth: p.pageWidthMm, pageHeight: p.pageHeightMm, bleed: p.bleedMm, safe: p.safeMm };
    }
    expect(BOOK_PAGE_PRESET_SIZES).toEqual(fromStudio);
  });
});
