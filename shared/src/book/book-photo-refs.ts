import { failOp, type BookOpsContext } from './book-ops-core';
import type { BookDocument, BookElement, BookSpread } from './book.schema';

/**
 * The photos a book refers to by id, read in one place: a photo frame's
 * picture, the pictures on a map's markers, and the photo the letters of a
 * text are filled with. Every check that a photo belongs to the journey
 * reads this list (a restore, a design applied), so a kind of reference is
 * never checked in one of them and missed in another.
 */

/** The photo ids these elements show, in their order. */
export function bookElementPhotoIds(elements: readonly BookElement[]): number[] {
  return elements.flatMap((e) => {
    if (e.kind === 'photo') return e.photoId == null ? [] : [e.photoId];
    if (e.kind === 'map') return e.points.flatMap((p) => (p.photoId == null ? [] : [p.photoId]));
    if (e.kind === 'text' && e.fillPaint?.type === 'photo') return [e.fillPaint.photoId];
    return [];
  });
}

/** The photo ids a page shows, placed or parked. */
export function bookSpreadPhotoIds(spread: BookSpread): number[] {
  return bookElementPhotoIds([...spread.elements, ...spread.parked]);
}

/**
 * With a gallery known, each of these photos is in it or on a page of the
 * book already: what a restore may bring back. The first that is neither is
 * refused, as an edit refuses a photo from outside the gallery.
 */
export function checkRestorablePhotos(photoIds: readonly number[], doc: BookDocument, ctx: BookOpsContext): void {
  if (!ctx.photos) return;
  const known = new Set([...ctx.photos.map((p) => p.photoId), ...doc.spreads.flatMap(bookSpreadPhotoIds)]);
  const stray = photoIds.find((id) => !known.has(id));
  if (stray !== undefined) {
    throw failOp('photo_not_in_gallery', `photo ${stray} is neither in this journey's gallery nor in the book`, null);
  }
}
