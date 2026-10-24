import { contrastRatio, requiredContrast } from './book-colour';
import type { BookPhotoInfo } from './book-ops-core';
import type { BookFinding } from './book-ops.schema';
import { bookTextCurvePath } from './book-text-curve';
import { bookTextIsDrawn } from './book-text-effects.schema';
import { bookDrawnLines, bookTextRunMm } from './book-text-fit';
import type { BookSpread, BookTextElement } from './book.schema';

/**
 * What can go wrong with a text effect, as a proof would show it: words that
 * run past the end of their curve, word art wider than its frame, an outline
 * so heavy it closes the letters, a band the words do not stand out on, and a
 * photo fill that is missing, not shown or too small for its letters.
 *
 * Joined into the page's print findings (`spreadFindings`), so the Studio's
 * assistant reads them beside every write and in `describe_book_page`.
 */

const n = (v: number) => `${Math.round(v * 10) / 10}`;
const ptToMm = (pt: number) => (pt * 25.4) / 72;

/** Below this many pixels per printed millimetre a photo fill looks soft: the 200 dpi of a photo. */
const MIN_FILL_PX_PER_MM = 200 / 25.4;

/**
 * Whether a text brings its own ground, so the page under it does not decide
 * whether it reads: a band behind it, a real outline, or letters filled with a
 * picture or left hollow. The contrast and busy checks leave such a text to
 * the checks here.
 */
export function bookTextHasOwnGround(el: BookTextElement): boolean {
  if (el.highlight) return true;
  // A photo, a gradient or a pattern in the letters is no one colour the page could be judged against.
  if (el.fillPaint && (el.fillPaint.type !== 'solid' || el.fillPaint.alpha < 0.5)) return true;
  return !!el.outline && el.outline.width >= ptToMm(el.size) * 0.04;
}

function curveRoom(el: BookTextElement, out: BookFinding[]): void {
  if (!el.curve) return;
  const line = bookDrawnLines(el)[0] ?? '';
  const need = bookTextRunMm(el, line);
  const path = bookTextCurvePath(el.curve, el.frame.w, el.frame.h, ptToMm(el.size));
  if (need <= path.length) return;
  out.push({
    code: 'curve_overflow',
    severity: 'warn',
    elementIds: [el.id],
    message: `the curved text ${el.id} needs about ${n(need)} mm and its ${el.curve.type} is ${n(path.length)} mm long; the end of the words is cut off. Set it smaller, shorten it or enlarge the frame`,
  });
}

function drawnRoom(el: BookTextElement, out: BookFinding[]): void {
  if (el.curve || !bookTextIsDrawn(el)) return;
  const lines = bookDrawnLines(el);
  const widest = Math.max(0, ...lines.map((l) => bookTextRunMm(el, l)));
  const tall = lines.length * ptToMm(el.size) * el.leading;
  if (widest <= el.frame.w * 1.05 && tall <= el.frame.h * 1.1) return;
  out.push({
    code: 'text_overflow',
    severity: 'severe',
    elementIds: [el.id],
    message: `the photo-filled text ${el.id} is set as written, without wrapping, and needs about ${n(widest)} x ${n(tall)} mm in a ${n(el.frame.w)} x ${n(el.frame.h)} mm frame; break the line, set it smaller or use fit shrink`,
  });
}

function heavyOutline(el: BookTextElement, out: BookFinding[]): void {
  if (!el.outline) return;
  const share = el.outline.width / ptToMm(el.size);
  if (share <= 0.12) return;
  out.push({
    code: 'effect_heavy',
    severity: 'warn',
    elementIds: [el.id],
    message: `the outline of text ${el.id} is ${n(el.outline.width)} mm on ${n(el.size)} pt letters, heavy enough to close their counters; keep it under about a tenth of the letter height`,
  });
}

function bandContrast(el: BookTextElement, out: BookFinding[]): void {
  if (!el.highlight || el.highlight.alpha < 0.6 || el.fillPaint) return;
  const ratio = contrastRatio(el.color, el.highlight.color);
  const need = requiredContrast(el.size);
  if (ratio >= need) return;
  out.push({
    code: 'contrast_low',
    severity: ratio < 2 ? 'severe' : 'warn',
    elementIds: [el.id],
    message: `text ${el.id} in ${el.color} on its band of ${el.highlight.color} has a contrast of ${ratio.toFixed(1)}:1, under the ${need}:1 type of that size needs`,
  });
}

function photoFill(el: BookTextElement, photos: readonly BookPhotoInfo[] | undefined, out: BookFinding[]): void {
  if (el.fillPaint?.type !== 'photo') return;
  const { photoId, zoom } = el.fillPaint;
  const info = photos?.find((p) => p.photoId === photoId);
  if (photos && !info) {
    out.push({
      code: 'not_in_gallery',
      severity: 'warn',
      elementIds: [el.id],
      message: `photo ${photoId} filling text ${el.id} is not in this journey's gallery`,
    });
  }
  if (info?.hidden) {
    out.push({
      code: 'hidden_photo',
      severity: 'info',
      elementIds: [el.id],
      message: `photo ${photoId} filling text ${el.id} is by another contributor and is not shown in the page image`,
    });
  }
  if (!info?.width || !info.height) return;
  const pxPerMm = Math.min(info.width / (el.frame.w * zoom), info.height / (el.frame.h * zoom));
  if (pxPerMm >= MIN_FILL_PX_PER_MM) return;
  out.push({
    code: 'low_dpi',
    severity: 'warn',
    elementIds: [el.id],
    message: `photo ${photoId} filling text ${el.id} prints at about ${Math.round(pxPerMm * 25.4)} dpi; zoom it out or make the frame smaller`,
  });
}

/** The findings of every text effect on a page. */
export function textEffectFindings(spread: BookSpread, photos?: readonly BookPhotoInfo[]): BookFinding[] {
  const out: BookFinding[] = [];
  for (const el of spread.elements) {
    if (el.kind !== 'text' || !el.text.trim()) continue;
    curveRoom(el, out);
    drawnRoom(el, out);
    heavyOutline(el, out);
    bandContrast(el, out);
    photoFill(el, photos, out);
  }
  return out.map((f) => ({ ...f, message: f.message.slice(0, 300) }));
}
