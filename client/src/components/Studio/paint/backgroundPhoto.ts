import {
  MAX_SPREAD_ELEMENTS,
  bookPhotoElementSchema,
  spreadPaint,
  withSpreadPaintByHand,
  type BookDocument,
  type BookElement,
  type BookPageSetup,
  type BookPhotoElement,
  type BookSpread,
} from '@trek/shared';

/**
 * The page background's two moves beyond its paint: a photo laid under the
 * whole page, and one page's background given to every page.
 *
 * A background photo is an ordinary photo element, not a field of the page:
 * full bleed across the spread, at the back, and locked, so it does not come
 * away under a click meant for what is on top of it. Being an element, it
 * prints, crops, filters and undoes like every other picture, and the
 * assistant reaches it with the operations it already has (add, fill, lock).
 */

/** The frame of a photo that covers the whole sheet, bleed included. */
export function bleedFrame(spread: BookSpread, page: BookPageSetup) {
  const pages = spread.role === 'inner' ? 2 : 1;
  return {
    x: -page.bleed,
    y: -page.bleed,
    w: page.pageWidth * pages + page.bleed * 2,
    h: page.pageHeight + page.bleed * 2,
  };
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.6;

/** The page's background photo: the locked picture at the back that covers the whole sheet. Null when it has none. */
export function backgroundPhotoOf(spread: BookSpread | undefined, page: BookPageSetup): BookPhotoElement | null {
  const back = spread?.elements[0];
  if (!spread || !back || back.kind !== 'photo' || !back.locked || back.photoId == null) return null;
  const want = bleedFrame(spread, page);
  const f = back.frame;
  return near(f.x, want.x) && near(f.y, want.y) && near(f.w, want.w) && near(f.h, want.h) && !back.rotation
    ? back
    : null;
}

/**
 * The page with `photoId` as its background: the one it had is replaced, a
 * new one goes in at the back. Null when the page is already full.
 */
export function withBackgroundPhoto(
  spread: BookSpread,
  page: BookPageSetup,
  photoId: number,
  newId: () => string
): BookSpread | null {
  const old = backgroundPhotoOf(spread, page);
  const rest = old ? spread.elements.slice(1) : spread.elements;
  if (rest.length >= MAX_SPREAD_ELEMENTS) return null;
  const photo = bookPhotoElementSchema.parse({
    id: old?.id ?? newId(),
    kind: 'photo',
    frame: bleedFrame(spread, page),
    locked: true,
    photoId,
    fit: 'cover',
  });
  return { ...spread, elements: [photo as BookElement, ...rest] };
}

/** The page without its background photo. */
export function withoutBackgroundPhoto(spread: BookSpread, page: BookPageSetup): BookSpread {
  return backgroundPhotoOf(spread, page) ? { ...spread, elements: spread.elements.slice(1) } : spread;
}

const isCover = (spread: BookSpread) => spread.role === 'cover' || spread.role === 'back';

/**
 * Every page given the background of page `from`: its paint and colour, and
 * whether it follows the theme, nothing else. "Every page" is every page of
 * its kind: an inside page gives its background to the inside of the book, a
 * cover to the covers, since a cover is designed on its own and an inside
 * page's paper is rarely what the cover wants. A page that follows the
 * theme's paper gives that link along; one painted by hand takes the others'
 * away, so the next theme applied leaves them all as they were made.
 */
export function backgroundToAll(doc: BookDocument, from: number): BookDocument {
  const source = doc.spreads[from];
  if (!source) return doc;
  const paint = spreadPaint(source);
  const kind = isCover(source);
  const link = source.backgroundToken;
  const given = (sp: BookSpread): BookSpread => {
    const painted = withSpreadPaintByHand(sp, paint);
    return link ? { ...painted, backgroundToken: link } : painted;
  };
  return {
    ...doc,
    spreads: doc.spreads.map((sp, i) => (i === from || isCover(sp) !== kind ? sp : given(sp))),
  };
}

/** The pictures offered as a background: the page's own first, then its entry's, then the gallery's. */
export function backgroundCandidates(
  spreadPhotos: readonly number[],
  entryPhotos: readonly number[],
  gallery: readonly number[],
  limit = 8
): number[] {
  return [...new Set([...spreadPhotos, ...entryPhotos, ...gallery])].slice(0, limit);
}
