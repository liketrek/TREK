import { BOOK_FONT_CATEGORIES, type BookFontCategory, type BookWeight } from '@trek/shared';
import { BOOK_FONTS, fontsIn, hasItalic, nearestWeight, type BookFontId } from './bookFonts';

/**
 * The type controls' decisions, apart from their markup: which families a
 * search finds, the weight a newly picked family is set at, and what the row
 * and the italic button say. StudioFontPicker.tsx and StudioTypeControls.tsx
 * draw them.
 */

export type FontT = (key: string, params?: Record<string, string | number>) => string;

export interface FontPick {
  font: BookFontId;
  weight: BookWeight;
}

/** The family, its weight moved onto one the new family has. */
export function pickFont(id: BookFontId, weight: number): FontPick {
  // A family that does not ship this weight would render a synthesised bold,
  // a smeared regular in print, so the weight moves to the nearest one it has.
  return { font: id, weight: nearestWeight(id, weight) as BookWeight };
}

/** The families that match a search, by name, id or group, in picker order. */
export function matchFonts(query: string, groupName: (c: BookFontCategory) => string): BookFontId[] {
  const q = query.trim().toLowerCase();
  return BOOK_FONT_CATEGORIES.flatMap((category) => {
    const group = groupName(category).toLowerCase();
    return fontsIn(category).filter(
      (id) => !q || BOOK_FONTS[id].name.toLowerCase().includes(q) || id.includes(q) || group.includes(q)
    );
  });
}

/** The weights a family has, as its row says them: one number, or the first and the last. */
export function weightSpan(id: BookFontId, t: FontT): string {
  const ws = BOOK_FONTS[id].weights;
  const first = ws[0] ?? 400;
  const last = ws[ws.length - 1] ?? first;
  return first === last ? String(first) : t('journey.studio.fonts.range', { from: first, to: last });
}

/** The italic button's words: plain where the family has a real italic, the reason where the browser slants it. */
export function italicTitle(font: string, weight: number, t: FontT): string {
  return hasItalic(font, nearestWeight(font, weight)) ? t('journey.studio.italic') : t('journey.studio.italicSlanted');
}
