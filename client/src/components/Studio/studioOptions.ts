import type { BookLineElement, BookPhotoElement, BookShapeElement } from '@trek/shared';

/**
 * The fixed sets of looks Studio offers in more than one place, with the words
 * for each: the six ways a picture is framed, offered when an empty frame is
 * added and when a photo is restyled, and the three strokes a shape's outline
 * and a drawn line share.
 *
 * Written once here so the Elements panel and the inspector cannot drift into
 * two lists, and so every key is named in full where the checker of
 * translation keys can read it.
 */

export type FrameStyle = NonNullable<BookPhotoElement['frameStyle']>;

export const FRAME_STYLE_OPTIONS: readonly { value: FrameStyle; labelKey: string }[] = [
  { value: 'none', labelKey: 'journey.studio.plainFrame' },
  { value: 'polaroid', labelKey: 'journey.studio.polaroidFrame' },
  { value: 'white', labelKey: 'journey.studio.whiteFrame' },
  { value: 'shadow', labelKey: 'journey.studio.shadowFrame' },
  { value: 'film', labelKey: 'journey.studio.filmFrame' },
  { value: 'tape', labelKey: 'journey.studio.tapeFrame' },
];

/** A shape's outline and a drawn line take the same three strokes. */
type StrokeStyle = NonNullable<BookShapeElement['strokeStyle']> & NonNullable<BookLineElement['dash']>;

export const STROKE_STYLE_OPTIONS: readonly { value: StrokeStyle; labelKey: string }[] = [
  { value: 'solid', labelKey: 'journey.studio.strokeSolid' },
  { value: 'dashed', labelKey: 'journey.studio.strokeDashed' },
  { value: 'dotted', labelKey: 'journey.studio.strokeDotted' },
];
