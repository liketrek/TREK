import type { BookFinding } from './book-ops.schema';
import type { BookElement, BookSpread } from './book.schema';

/**
 * The one way a sticker goes wrong on a page: lying over words.
 *
 * Stickers are decoration and are layered on purpose, over a photo, across a
 * corner, behind a title, so the overlap check of photos and texts never
 * compares them (book-findings.ts): a lemon on a picture is a design, and a
 * sticker is not words, so it is not held to the fold and the trim the way a
 * text is. What a sticker must not do is hide what a reader has to read. One
 * painted above a text or a mark and covering a fair part of it is said, as a
 * warning, with what to do about it; one painted below the words is a
 * background and is left alone.
 */

/** The kinds that carry words a sticker could hide. */
const READ = new Set<BookElement['kind']>(['text', 'badge', 'stats', 'list', 'countries']);

/** Past this share of the words' box covered, a sticker hides them rather than touching them. */
const COVERS_SHARE = 0.25;

/** The most findings of this kind one page reports. */
const MAX_COVERING = 3;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The box an element occupies, turned with it, as the overlap check measures it. */
function boxOf(el: BookElement): Box {
  const { x, y, w, h } = el.frame;
  if (!el.rotation) return { x, y, w, h };
  const rad = (el.rotation * Math.PI) / 180;
  const bw = w * Math.abs(Math.cos(rad)) + h * Math.abs(Math.sin(rad));
  const bh = w * Math.abs(Math.sin(rad)) + h * Math.abs(Math.cos(rad));
  return { x: x + w / 2 - bw / 2, y: y + h / 2 - bh / 2, w: bw, h: bh };
}

function shared(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Stickers painted over a fair part of a text or a mark, a warning each, at most a few per page. */
export function stickerFindings(spread: BookSpread): BookFinding[] {
  const out: BookFinding[] = [];
  spread.elements.forEach((words, i) => {
    if (!READ.has(words.kind) || out.length >= MAX_COVERING) return;
    const under = boxOf(words);
    const area = Math.max(under.w * under.h, 1);
    for (const above of spread.elements.slice(i + 1)) {
      if (above.kind !== 'sticker' || above.opacity < 0.3) continue;
      const share = shared(boxOf(above), under) / area;
      if (share <= COVERS_SHARE) continue;
      out.push({
        code: 'overlap',
        severity: 'warn',
        elementIds: [above.id, words.id],
        message: `sticker ${above.id} covers ${Math.round(share * 100)}% of ${words.kind} ${words.id}; move it off the words or send it behind them`,
      });
      return;
    }
  });
  return out;
}
