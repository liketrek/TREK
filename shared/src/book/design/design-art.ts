import type { BookStickerDef } from '../stickers/sticker-types';
import type { BookTheme, BookThemeDecoration } from '../theme/book-theme.schema';
import type { BookDesignEnergy } from './design-brief.schema';
import type { BookDesignDirectives } from './design-directives.schema';
import type { BookDesignLook } from './design-style';

/**
 * The art direction a design is composed in, read once from the brief and the
 * book's theme: how lively it is, how many stickers a spread takes and from
 * which motifs, whether photos gather in collages, and the seed of every
 * choice made along the way (design-random.ts).
 *
 * A design without a brief is calm, undecorated and without collages, which
 * is the engine as it was before the brief existed: nothing here changes a
 * book nobody asked to change.
 */

/** What the engine needs of a sticker to place one: the catalogue's facts, never its drawing. */
export type BookDesignSticker = Pick<BookStickerDef, 'id' | 'theme' | 'tags' | 'box'>;

export interface DesignArt {
  /** Whether a brief was given at all; the findings that judge a book against its brief need one. */
  briefed: boolean;
  energy: BookDesignEnergy;
  /** Stickers per inner spread (`STICKERS_PER_SPREAD`). */
  decoration: BookThemeDecoration;
  /** No sticker anywhere, a cover archetype's own included: the brief said decoration none. */
  bare: boolean;
  collage: boolean;
  /** The stickers the book may use: those of its theme's motifs, in catalogue order. */
  stickers: readonly BookDesignSticker[];
  /** The whole library, for a drawing picked by what it shows (a cover's landmark). */
  library: readonly BookDesignSticker[];
  /** The drawings the design placed so far, so a book repeats one only when it runs out. */
  used?: Set<string>;
  /**
   * How far the book turns its prints and stickers, least and most, in
   * degrees off straight (`tiltRange`): every turn the engine gives is in it,
   * and the brief's findings judge a book by it.
   */
  tilt: readonly [number, number];
  seed: number;
}

/** Stickers a spread takes for each decoration level, fewest and most. */
export const STICKERS_PER_SPREAD: Readonly<Record<BookThemeDecoration, readonly [number, number]>> = {
  none: [0, 0],
  light: [1, 2],
  rich: [3, 6],
};

/**
 * How far a page turns its prints and stickers at each energy, in degrees
 * off straight, least and most. Calm turns nothing on purpose: a scrapbook's
 * own two degrees stay within it.
 */
const TILT_RANGE: Readonly<Record<BookDesignEnergy, readonly [number, number]>> = {
  calm: [0, 2],
  lively: [3, 7],
  loud: [4, 10],
};

/**
 * The turns a book takes at an energy: its range, the most widened to the
 * theme's own turn, since a theme that turns its prints four degrees is that
 * theme at every energy.
 */
export function tiltRange(energy: BookDesignEnergy, themeTilt = 0): readonly [number, number] {
  const [least, most] = TILT_RANGE[energy];
  return [least, Math.max(most, themeTilt)];
}

/** A turn an archetype or a page asks for, kept to the most the book's energy takes, its direction kept. */
export function withinTilt(art: Pick<DesignArt, 'tilt'>, turn: number): number {
  const most = art.tilt[1];
  return Math.max(-most, Math.min(most, turn));
}

/** The cover title's tier a book takes at each energy when the directives name none: oversize type for a lively one. */
const DISPLAY_TIER: Readonly<Record<BookDesignEnergy, number>> = { calm: 1, lively: 1.5, loud: 2 };

/** The largest size a text element takes (book.schema.ts). */
const MAX_PT = 200;

/**
 * The look a lively or loud book is set in: its prints turned at least the
 * least its energy takes, alternating as a scrapbook turns them, framed in
 * white where the style leaves them bare, and the cover title on a display
 * tier of its own unless `type.display` names one. A calm book's look as it is.
 */
export function livelyLook(look: BookDesignLook, art: DesignArt, directives: BookDesignDirectives): BookDesignLook {
  if (art.energy === 'calm') return look;
  const tier = DISPLAY_TIER[art.energy];
  const display =
    directives.type?.display === undefined
      ? Math.min(MAX_PT, Math.round(look.sizes.heading * tier * 10) / 10)
      : look.sizes.display;
  return {
    ...look,
    tilt: Math.max(look.tilt, art.tilt[0]),
    frameStyle: look.frameStyle === 'none' ? 'white' : look.frameStyle,
    sizes: { ...look.sizes, display },
  };
}

/** The motifs a theme without any is decorated from: the travel things every journey has. */
const FALLBACK_MOTIFS = ['ephemera', 'doodles'] as const;

/** The energy a brief asks for: its own, else lively when it asks for decoration or collages, else calm. */
function energyOf(brief: BookDesignDirectives['brief']): BookDesignEnergy {
  if (brief?.energy) return brief.energy;
  const decorated = brief?.decoration !== undefined && brief.decoration !== 'none';
  return decorated || brief?.collage ? 'lively' : 'calm';
}

/** The book's art direction, from its directives, its theme and the sticker library the caller holds. */
export function designArt(
  directives: BookDesignDirectives,
  theme: BookTheme,
  library: readonly BookDesignSticker[] = [],
): DesignArt {
  const brief = directives.brief;
  const energy = energyOf(brief);
  const decoration = brief?.decoration ?? (energy === 'calm' ? 'none' : theme.decoration);
  const motifs: readonly string[] = theme.motifs.length ? theme.motifs : FALLBACK_MOTIFS;
  return {
    briefed: brief !== undefined,
    energy,
    decoration,
    bare: brief?.decoration === 'none',
    collage: brief?.collage ?? false,
    stickers: library.filter((s) => motifs.includes(s.theme)),
    library,
    used: new Set<string>(),
    tilt: tiltRange(energy, theme.tilt),
    seed: directives.seed ?? 0,
  };
}

/** The art direction of a design composed without one: calm, bare, as before. */
export const CALM_ART: DesignArt = {
  briefed: false,
  energy: 'calm',
  decoration: 'none',
  bare: false,
  collage: false,
  stickers: [],
  library: [],
  tilt: TILT_RANGE.calm,
  seed: 0,
};
