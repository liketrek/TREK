import type { BookFinding } from './book-ops.schema';
import { photoLookOf } from './book-photo-look';
import type { BookPageSetup, BookSpread } from './book.schema';

/**
 * What the photo look (book-photo-look.schema.ts) is worth knowing about on a
 * proof.
 *
 * Adjustments and a duotone are drawn through filters, and a filtered picture
 * goes to the printer as a raster the browser made rather than as the
 * original's own pixels. On a small picture nobody sees the difference; on a
 * picture a quarter of a page or larger it can print softer than the same
 * picture without the filter, so the finding says so, as context.
 */

/** The share of one page a filtered picture covers before the finding speaks. */
const RASTER_EFFECT_SHARE = 0.25;

export function photoLookChecks(spread: BookSpread, page: BookPageSetup): BookFinding[] {
  const pageArea = page.pageWidth * page.pageHeight;
  if (pageArea <= 0) return [];
  const out: BookFinding[] = [];
  for (const el of spread.elements) {
    if (el.kind !== 'photo' || el.photoId == null) continue;
    const look = photoLookOf(el);
    const what = [look.adjust ? 'adjustments' : null, look.duotone ? 'a duotone' : null].filter(Boolean);
    if (!what.length) continue;
    const share = (el.frame.w * el.frame.h) / pageArea;
    if (share < RASTER_EFFECT_SHARE) continue;
    out.push({
      code: 'raster_effect',
      severity: 'info',
      elementIds: [el.id],
      message: `photo ${el.id} carries ${what.join(' and ')} over ${Math.round(share * 100)}% of a page; filters print as a raster and can look softer than the original, drop them where the picture should stay sharp`,
    });
  }
  return out;
}
