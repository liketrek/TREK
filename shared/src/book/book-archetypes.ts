/**
 * The seven cover archetypes a decorated book starts from: the Studio's cover
 * templates are drawn in them, and the assistant's art direction names one.
 *
 * - spine-band: a bleed photo with a coloured band on the binding side.
 * - poster-pop: a two-tone colour block, a heavy two-line title, a tilted inset photo.
 * - cutout: a saturated page, organic cut-out shapes around a bordered portrait photo.
 * - postcard: a pastel page, a landmark drawing, a display serif title and a script line.
 * - grid-badge: a two by two photo grid with a round title badge at its centre.
 * - minimal-serif: a white page, a large photo with a hairline, a very large thin serif title.
 * - stamp-collage: photos in arches and stamps over a checker band, with a round postmark.
 */
export const BOOK_COVER_ARCHETYPES = [
  'spine-band',
  'poster-pop',
  'cutout',
  'postcard',
  'grid-badge',
  'minimal-serif',
  'stamp-collage',
] as const;
export type BookCoverArchetype = (typeof BOOK_COVER_ARCHETYPES)[number];
