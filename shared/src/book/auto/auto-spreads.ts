import { formatBookDate } from '../book-text';
import { bookDayText } from '../book-travel';
import type { BookElement, BookSpread } from '../book.schema';
import {
  ACCENT,
  CREAM,
  PANEL_INK,
  PANEL_TYPE,
  bleedFrame,
  coordsMark,
  countryOf,
  countryWatermark,
  dateMark,
  dayChip,
  flagRow,
  isPortrait,
  photo,
  placeMap,
  progressRule,
  shape,
  sheet,
  text,
  type NewId,
} from './auto-elements';
import type { AutoEntry, AutoInput, AutoPhoto } from './auto-types';

/**
 * ── The entry spreads ────────────────────────────────────────────────────
 *
 * Seven layouts rather than one, chosen by what the entry actually has and
 * alternating as the book goes on. A book where every spread is built the same
 * way reads as a template even when each page is fine on its own.
 *
 * A printed travel book is built out of areas: a page laid solid in ink with
 * pale type on it, a band down the outer edge, a picture that overruns the
 * panel it sits against, a box ruled around a block of text. The document
 * paints in array order, so a panel pushed first is a panel everything else
 * lands on.
 */

/** Which page the picture is on. Alternating keeps the book moving. */
type Hand = 'left' | 'right';

export interface EntryContext {
  entry: AutoEntry;
  input: AutoInput;
  /** Position in the book, for alternating the layouts. */
  index: number;
  hand: Hand;
  newId: NewId;
}

/** An entry's photos, read where the caller has already made sure there is a first one. */
const withHero = (photos: AutoPhoto[]) => photos as [AutoPhoto, ...AutoPhoto[]];

const storyOf = (entry: AutoEntry) => (entry.story || '').trim();

/** The date and place line's printed separator (a middle dot), kept as the Studio has always set it. */
const META_JOIN = '  \u00b7  ';

/** A whole page laid in colour, bleeding off its three outer edges. */
function pagePanel(ctx: EntryContext, side: Hand, fill: string): BookElement {
  const { page } = ctx.input;
  const b = page.bleed;
  const frame = {
    x: side === 'left' ? -b : page.pageWidth,
    y: -b,
    w: page.pageWidth + b,
    h: page.pageHeight + b * 2,
  };
  return shape(ctx.newId, frame, fill);
}

/** A band down the outer edge: the cheapest mark that says "designed". */
function edgeBand(ctx: EntryContext, side: Hand, fill: string, width: number): BookElement {
  const { page } = ctx.input;
  const b = page.bleed;
  const frame = {
    x: side === 'left' ? -b : page.pageWidth * 2 - width,
    y: -b,
    w: width + b,
    h: page.pageHeight + b * 2,
  };
  return shape(ctx.newId, frame, fill);
}

interface HeadingStyle {
  size?: number;
  ink?: string;
  muted?: string;
}

/** The heading block: rule, date line, title. Returns where it ended. */
function headingBlock(
  ctx: EntryContext,
  els: BookElement[],
  at: { x: number; y: number; w: number },
  opts: HeadingStyle = {},
): number {
  const { entry, input, newId } = ctx;
  const { x, y, w } = at;
  const size = opts.size ?? 22;
  const ink = opts.ink ?? '#141414';
  const muted = opts.muted ?? '#8a8578';
  const heading = entry.title || entry.location || '';
  const meta = [formatBookDate(entry.date, input.locale), entry.location].filter(Boolean).join(META_JOIN);
  let cy = y;

  if (meta || heading) els.push(shape(newId, { x, y: cy - 6, w: Math.min(14, w * 0.18), h: 0.5 }, ACCENT));
  if (meta) {
    // Two facts run together and upper-cased: neither is bound, since the journal holds neither like this.
    const style = { size: 7.5, weight: 600 as const, tracking: 0.14, color: muted };
    els.push(text(newId, { x, y: cy, w, h: 5 }, meta.toUpperCase(), style));
    cy += 8;
  }
  if (heading) {
    const style = {
      size,
      weight: 700 as const,
      leading: 1.1,
      tracking: -0.02,
      color: ink,
      binding: { source: 'entry.title' as const, entryId: entry.id },
    };
    els.push(text(newId, { x, y: cy, w, h: size * 0.6 }, heading, style));
    cy += size * 0.75;
  }
  return cy;
}

/** The foot: the day chip above the dot of the rule that says how far in this is. */
function footMarks(ctx: EntryContext, els: BookElement[], at: { x: number; y: number; w: number }): void {
  const { entry, input, newId } = ctx;
  const { x, y, w } = at;
  els.push(...progressRule(newId, at, entry.dayNumber, entry.dayCount));
  const day = entry.dayNumber;
  const total = entry.dayCount;
  if (!day) return;
  const t = total && total > 1 ? Math.min(1, Math.max(0, (day - 1) / (total - 1))) : 0;
  const cw = 24;
  const cx = Math.min(x + w - cw, Math.max(x, x + w * t - cw / 2));
  els.push(dayChip(newId, { x: cx, y: y - 11, w: cw, h: 7 }, bookDayText(input.dayLabel, day)));
}

/** The story, bound to the entry, set in a column. */
function storyText(ctx: EntryContext, frame: BookElement['frame'], size: number, leading: number, color: string) {
  const binding = { source: 'entry.story' as const, entryId: ctx.entry.id };
  return text(ctx.newId, frame, storyOf(ctx.entry), { size, leading, color, binding });
}

/** The country's flag and name, where the entry knows its country. */
function flagOf(ctx: EntryContext, frame: BookElement['frame']): BookElement | null {
  return flagRow(ctx.newId, frame, ctx.entry.country ?? null, countryOf(ctx.entry, ctx.input));
}

/**
 * A stop, with nothing written about it yet: the country pale behind, the
 * name large, the coordinates beneath it, and the picture page waiting as a
 * frame.
 */
export function placeSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand, newId } = ctx;
  const { page } = input;
  const H = page.pageHeight;
  const m = 18;
  const els: BookElement[] = [];
  const photoPage = hand === 'left' ? 0 : page.pageWidth;
  const textPage = hand === 'left' ? page.pageWidth : 0;
  const tx = textPage + m;
  const colW = page.pageWidth - m * 2;

  const wm = countryWatermark(newId, { x: tx, y: H * 0.22, w: colW, h: H * 0.4 }, entry.country);
  if (wm) els.push(wm);
  const flag = flagOf(ctx, { x: tx, y: m + 4, w: colW * 0.7, h: 7 });
  if (flag) els.push(flag);
  const name = entry.title || entry.location || '';
  if (name) {
    const style = {
      size: 26,
      weight: 700 as const,
      tracking: -0.02,
      color: '#141414',
      binding: { source: 'entry.title' as const, entryId: entry.id },
    };
    els.push(text(newId, { x: tx, y: H * 0.42, w: colW, h: 20 }, name, style));
  }
  const coords = coordsMark(newId, { x: tx, y: H * 0.42 + 22, w: colW, h: 6 }, entry.lat, entry.lng);
  if (coords) els.push(coords);
  footMarks(ctx, els, { x: tx, y: H - m - 6, w: colW });
  // The picture page: one frame, edge to edge, waiting.
  els.push(photo(newId, { x: photoPage + m, y: m, w: page.pageWidth - m * 2, h: H - m * 2 }, null));
  return sheet(newId, els, entry, '#faf8f4');
}

/**
 * A day that was written about: words on one page, one picture on the other,
 * running off three edges and stopping dead on the gutter.
 */
export function storySpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand, newId } = ctx;
  const { page } = input;
  const H = page.pageHeight;
  const m = 18;
  const els: BookElement[] = [];
  const hero = entry.photos[0];
  const textPage = hand === 'left' ? page.pageWidth : 0;
  const tx = textPage + m;
  const colW = page.pageWidth - m * 2;
  const onLeft = hand === 'left';

  if (hero) {
    const frame = {
      x: onLeft ? -page.bleed : page.pageWidth,
      y: -page.bleed,
      w: page.pageWidth + page.bleed,
      h: H + page.bleed * 2,
    };
    els.push(photo(newId, frame, hero.photoId, { focalX: isPortrait(hero) ? 0.5 : 0.55 }));
    if (hero.caption) {
      const at = { x: (onLeft ? 0 : page.pageWidth) + m, y: H - m - 6, w: page.pageWidth * 0.6, h: 5 };
      const style = {
        size: 7.5,
        weight: 500 as const,
        color: '#ffffff',
        opacity: 0.9,
        binding: { source: 'photo.caption' as const, entryId: entry.id, photoId: hero.photoId },
      };
      els.push(text(newId, at, hero.caption, style));
    }
  } else {
    // No photograph yet, but the page it will sit on is already the page.
    const frame = { x: (onLeft ? 0 : page.pageWidth) + m, y: m, w: page.pageWidth - m * 2, h: H - m * 2 };
    els.push(photo(newId, frame, null));
  }

  // A small map of the stop, top of the text page: the mark that says where.
  const map = placeMap(newId, { x: tx, y: m, w: 26, h: 20 }, entry, input.stats);
  if (map) els.push(map);
  const flag = flagOf(ctx, { x: tx + (map ? 32 : 0), y: m + 6, w: colW - (map ? 32 : 0), h: 7 });
  if (flag) els.push(flag);

  const cy = headingBlock(ctx, els, { x: tx, y: m + 34, w: colW }, { size: 20 });
  const body = { x: tx, y: cy + 3, w: colW, h: H - cy - m - 34 };
  if (storyOf(entry)) els.push(storyText(ctx, body, 10, 1.62, '#2a2a2a'));
  const mark = dateMark(newId, entry.date, input.locale, { x: tx, y: H - m - 30, w: 26, h: 20 });
  if (mark) els.push(mark);
  footMarks(ctx, els, { x: tx, y: H - m - 4, w: colW });
  return sheet(newId, els, entry, '#ffffff');
}

/** A panorama across the fold, with the day underneath it: the gutter as an asset. */
export function panoSpread(ctx: EntryContext): BookSpread {
  const { entry, input, newId } = ctx;
  const { page } = input;
  const W = page.pageWidth * 2;
  const H = page.pageHeight;
  const m = 18;
  const gut = 6;
  const els: BookElement[] = [];
  const [hero, ...rest] = withHero(entry.photos);

  const band = { x: -page.bleed, y: -page.bleed, w: W + page.bleed * 2, h: H * 0.58 + page.bleed };
  els.push(photo(newId, band, hero.photoId));
  const cy = headingBlock(ctx, els, { x: m, y: H * 0.58 + 16, w: page.pageWidth - m * 2 }, { size: 18 });
  const body = { x: m, y: cy + 2, w: page.pageWidth - m * 2, h: H - cy - m - 12 };
  if (storyOf(entry)) els.push(storyText(ctx, body, 10, 1.6, '#2a2a2a'));
  const strip = rest.slice(0, 3);
  if (strip.length) {
    const cw = (page.pageWidth - m * 2 - gut * (strip.length - 1)) / strip.length;
    strip.forEach((p, i) => {
      const frame = { x: page.pageWidth + m + i * (cw + gut), y: H * 0.58 + 16, w: cw, h: H * 0.26 };
      els.push(photo(newId, frame, p.photoId));
    });
  }
  const flag = flagOf(ctx, { x: page.pageWidth + m, y: H - m - 16, w: page.pageWidth - m * 2, h: 7 });
  if (flag) els.push(flag);
  footMarks(ctx, els, { x: page.pageWidth + m, y: H - m - 4, w: page.pageWidth - m * 2 });
  return sheet(newId, els, entry, '#ffffff');
}

/** Several pictures: one large, the rest ruled beneath the words, the way a magazine sets a picture story. */
export function gallerySpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand, newId } = ctx;
  const { page } = input;
  const H = page.pageHeight;
  const m = 18;
  const gut = 5;
  const els: BookElement[] = [];
  const [hero, ...rest] = withHero(entry.photos);
  const heroOnLeft = hand === 'left';
  const heroX = heroOnLeft ? -page.bleed : page.pageWidth;
  const textX = (heroOnLeft ? page.pageWidth : 0) + m;
  const colW = page.pageWidth - m * 2;

  const heroFrame = { x: heroX, y: -page.bleed, w: page.pageWidth + page.bleed, h: H + page.bleed * 2 };
  els.push(photo(newId, heroFrame, hero.photoId, { focalX: isPortrait(hero) ? 0.5 : 0.55 }));
  const flag = flagOf(ctx, { x: textX, y: m + 2, w: colW, h: 7 });
  const cy = headingBlock(ctx, els, { x: textX, y: m + (flag ? 26 : 16), w: colW }, { size: 19 });
  if (flag) els.push(flag);

  const strip = rest.slice(0, 3);
  const stripH = strip.length ? (strip.length === 1 ? H * 0.28 : H * 0.22) : 0;
  // The foot carries the rule and the chip, so nothing else may end there.
  const footRoom = 22;
  if (storyOf(entry)) {
    const h = H - cy - m - (stripH ? stripH + 12 : 0) - footRoom;
    els.push(storyText(ctx, { x: textX, y: cy + 2, w: colW, h: Math.max(18, h) }, 10, 1.62, '#2a2a2a'));
  }
  if (strip.length) {
    const cw = (colW - gut * (strip.length - 1)) / strip.length;
    strip.forEach((p, i) => {
      const frame = { x: textX + i * (cw + gut), y: H - m - footRoom - stripH, w: cw, h: stripH };
      els.push(photo(newId, frame, p.photoId));
    });
  }
  footMarks(ctx, els, { x: textX, y: H - m - 4, w: colW });
  return sheet(newId, els, entry, '#ffffff');
}

/** One picture over the whole sheet, the words set on top of it: the loudest page, used sparingly. */
export function immersiveSpread(ctx: EntryContext): BookSpread {
  const { entry, input, newId } = ctx;
  const { page } = input;
  const W = page.pageWidth * 2;
  const H = page.pageHeight;
  const m = 20;
  const els: BookElement[] = [];
  const hero = entry.photos[0];

  els.push(photo(newId, bleedFrame(page, true), hero ? hero.photoId : null, { focalY: 0.45 }));
  // A panel behind the type: white on an unknown photograph is a coin toss.
  const scrim = { x: -page.bleed, y: H * 0.56, w: W + page.bleed * 2, h: H * 0.44 + page.bleed };
  els.push(shape(newId, scrim, '#0d0d0f', { gradient: 'up', opacity: 0.72 }));
  const light = { size: 24, ink: '#ffffff', muted: '#d8d3ca' };
  headingBlock(ctx, els, { x: m, y: H * 0.68, w: page.pageWidth - m * 2 }, light);
  const body = { x: page.pageWidth + m, y: H * 0.68, w: page.pageWidth - m * 2, h: H * 0.26 };
  if (storyOf(entry)) els.push(storyText(ctx, body, 9.5, 1.6, '#efece6'));
  const coords = coordsMark(newId, { x: m, y: H - m - 5, w: page.pageWidth - m * 2, h: 5 }, entry.lat, entry.lng);
  if (coords) els.push(coords);
  return sheet(newId, els, entry, '#0d0d0f');
}

/**
 * A page laid in ink, the picture overrunning it: one page solid, the other a
 * photograph, and a second picture crossing the join so the two halves read
 * as one sheet.
 */
export function panelSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand, newId } = ctx;
  const { page } = input;
  const H = page.pageHeight;
  const m = 20;
  const els: BookElement[] = [];
  const [hero, ...rest] = entry.photos;
  const panelSide: Hand = hand === 'left' ? 'right' : 'left';
  const panelX = panelSide === 'left' ? 0 : page.pageWidth;
  const tx = panelX + m;
  const colW = page.pageWidth - m * 2;

  // The panel first: everything after it lands on top.
  els.push(pagePanel(ctx, panelSide, PANEL_INK));
  if (hero) {
    const frame = {
      x: panelSide === 'left' ? page.pageWidth : -page.bleed,
      y: -page.bleed,
      w: page.pageWidth + page.bleed,
      h: H + page.bleed * 2,
    };
    els.push(photo(newId, frame, hero.photoId, { focalX: isPortrait(hero) ? 0.5 : 0.55 }));
  } else {
    const frame = { x: (panelSide === 'left' ? page.pageWidth : 0) + m, y: m, w: colW, h: H - m * 2 };
    els.push(photo(newId, frame, null));
  }
  const flag = flagOf(ctx, { x: tx, y: m, w: colW, h: 7 });
  if (flag) els.push(flag);
  const onPanel = { size: 21, ink: PANEL_TYPE, muted: '#a8a094' };
  const cy = headingBlock(ctx, els, { x: tx, y: m + 30, w: colW }, onPanel);
  const body = { x: tx, y: cy + 3, w: colW, h: H - cy - m - 46 };
  if (storyOf(entry)) els.push(storyText(ctx, body, 9.5, 1.66, '#d9d4cb'));

  // A second picture across the fold, half on the panel, pushed last so it sits over both.
  const crossing = rest[0];
  if (crossing) {
    const cw = 62;
    const ch = 46;
    const frame = { x: page.pageWidth - cw * 0.55, y: H - m - ch - 14, w: cw, h: ch };
    els.push(photo(newId, frame, crossing.photoId, { radius: 1 }));
  }
  footMarks(ctx, els, { x: tx, y: H - m - 4, w: colW });
  return sheet(newId, els, entry, CREAM);
}

/**
 * A band down the edge, a ruled box, and pictures at two sizes: the quiet
 * counterpart to the panel spread. The box makes the words an object on the
 * page rather than something poured onto it.
 */
export function bandSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand, newId } = ctx;
  const { page } = input;
  const H = page.pageHeight;
  const m = 20;
  const gut = 5;
  const els: BookElement[] = [];
  const photos = entry.photos;

  els.push(edgeBand(ctx, hand, ACCENT, 6));
  // The big picture takes most of one page, off the top and the outer edge.
  const heroX = hand === 'left' ? 6 : page.pageWidth;
  const heroW = page.pageWidth - 6 + (hand === 'left' ? 0 : page.bleed);
  const first = photos[0];
  if (first) els.push(photo(newId, { x: heroX, y: -page.bleed, w: heroW, h: H * 0.62 }, first.photoId));
  else els.push(photo(newId, { x: heroX + m, y: m, w: heroW - m * 2, h: H * 0.5 }, null));

  const tx = (hand === 'left' ? page.pageWidth : 0) + m;
  const colW = page.pageWidth - m * 2;
  const boxY = m + 6;
  const boxH = H * 0.52;
  // The words in a ruled box, set in from it on every side.
  const box = { x: tx, y: boxY, w: colW, h: boxH };
  els.push(shape(newId, box, null, { stroke: '#d8d2c6', strokeWidth: 0.3, radius: 1.5 }));
  const flag = flagOf(ctx, { x: tx + 8, y: boxY + 8, w: colW - 16, h: 6 });
  if (flag) els.push(flag);
  const cy = headingBlock(ctx, els, { x: tx + 8, y: boxY + 30, w: colW - 16 }, { size: 18 });
  const body = { x: tx + 8, y: cy + 2, w: colW - 16, h: boxY + boxH - cy - 12 };
  if (storyOf(entry)) els.push(storyText(ctx, body, 9.5, 1.6, '#2a2a2a'));

  // Two smaller pictures under the box, and one that overlaps the hero above.
  const rest = photos.slice(1, 3);
  if (rest.length) {
    const cw = (colW - gut * (rest.length - 1)) / rest.length;
    rest.forEach((ph, i) => {
      const frame = { x: tx + i * (cw + gut), y: boxY + boxH + 10, w: cw, h: H * 0.2 };
      els.push(photo(newId, frame, ph.photoId, { radius: 1 }));
    });
  }
  const overlap = photos[3];
  const inset = { x: heroX + 14, y: H * 0.62 - 26, w: 52, h: 40 };
  if (overlap) els.push(photo(newId, inset, overlap.photoId, { radius: 1 }));
  const mark = dateMark(newId, entry.date, input.locale, { x: heroX + 14, y: H - m - 34, w: 26, h: 22 });
  if (mark) els.push(mark);
  footMarks(ctx, els, { x: tx, y: H - m - 4, w: colW });
  return sheet(newId, els, entry, '#ffffff');
}
