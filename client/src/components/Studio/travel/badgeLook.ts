import type { BookBadgeElement, BookBadgeStyle, BookBadgeVariant } from '@trek/shared';
import { brightness } from '../folioColour';

/**
 * How a mark is coloured and which of its styles are the newer looks.
 *
 * Moved out of TravelElements.tsx so the looks drawn in BadgeLooks.tsx answer
 * the same question the same way: a filled mark takes its words' colour from
 * its fill, a plain one from the page.
 */

/** The styles BadgeLooks.tsx draws; the first four are TravelElements.tsx's. */
const LOOKS: ReadonlySet<BookBadgeStyle> = new Set(['stamp', 'tag', 'pill', 'ribbon', 'sticker', 'patch', 'sketch']);

export const isBadgeLook = (style: BookBadgeStyle | undefined): boolean => !!style && LOOKS.has(style);

/** Ink for a mark that picks its own, and its opposite. */
const BADGE_DARK_INK = '#1c1b19'; // theme-lint-disable — ink on a printed page, not a UI token
const BADGE_LIGHT_INK = '#ffffff'; // theme-lint-disable — paper white on a filled chip

/** The ink that reads on a fill: dark on a pale one, paper on a deep one. */
export const inkOn = (fill: string): string => (brightness(fill) > 0.55 ? BADGE_DARK_INK : BADGE_LIGHT_INK);

/**
 * What colour a mark's words are.
 *
 * Automatic unless the element says otherwise, and what automatic means depends
 * on what the mark is: a chip carries its words on its own fill, so they answer
 * to the fill's brightness; a day or a date drawn plain takes the accent,
 * because that is the figure the page is built around. Anything else is
 * ordinary text in the text colour.
 *
 * The moment somebody picks a colour this steps aside completely. That is the
 * point of the flag: automatic is a good default and a bad cage.
 */
export function badgeInk(el: BookBadgeElement): string {
  if (!el.autoColor) return el.color;
  if (el.style === 'chip' || el.style === 'tag') return inkOn(el.accent);
  if (el.variant === 'day' || el.variant === 'date') return el.accent;
  return el.color;
}

/** How tall the picture sits beside the words, as a share of the mark's height. */
export function badgeIconShare(variant: BookBadgeVariant): number {
  if (variant === 'country') return 0.72;
  if (variant === 'flag') return 0.5;
  return 0.46;
}
