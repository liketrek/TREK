import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import type { BookLockupWords } from '../book-lockups';
import { formatBookDate } from '../book-text';
import type { BookElement, BookFrame, BookPhotoElement, BookTextElement } from '../book.schema';
import { CALM_ART } from './design-art';
import {
  bleedPage,
  bleedSpread,
  frameOf,
  liveBox,
  other,
  pageX,
  photoEl,
  scaled,
  type ComposeCtx,
  type Side,
} from './design-compose';
import {
  badgeSpan,
  coverText,
  deepened,
  inkOn,
  lockupOn,
  mmToPt,
  pageKit,
  printEl,
  shapeEl,
  spacedLine,
  standOut,
} from './design-cover-kit';
import type { DesignRng } from './design-random';
import type { Composed } from './design-spreads';
import { turnedBox } from './design-stickers';

/**
 * The lively spreads (design-lively-pacing.ts decides where they go): a
 * collage of turned, framed prints; one photo across the spread under a giant
 * script word; a photo grid round a title badge; a row of photos as postage
 * stamps under a postmark; a colour page in two tones holding the title
 * beside a photo to the bleed. They set no story, so a chapter's words wait
 * for its next page that takes words, as after a hero.
 *
 * Words on a picture bring their own ground (an outline, a band), words on a
 * colour are set in an ink that reads on it, and no photo's detail is hidden
 * under anything opaque: each page is as clean as the calm ones.
 */

type Hand = 'left' | 'right';

const WHITE = '#ffffff';
const OUTLINE_SHARE = 0.07;
const ptMm = (pt: number) => (pt * 25.4) / 72;

/**
 * The turn of a lively print, least and most: the book's own range, so a
 * lively or loud page turns its prints at least the 3 degrees that read as
 * laid on purpose, and a collage in a calm book (asked for by the brief or a
 * page override) lies within the calm book's few degrees.
 */
function tilt(c: ComposeCtx): readonly [number, number] {
  const [lo, hi] = (c.art ?? CALM_ART).tilt;
  return [Math.max(lo, Math.min(1, hi)), hi];
}

/** The words of an entry a badge or a postmark sets, and the bindings that keep them in sync with the journal. */
function entryWords(
  c: ComposeCtx,
  entry: AutoEntry | null,
): { words: BookLockupWords; bind: (w: string) => BookTextElement['binding'] } {
  const place = entry?.location?.trim() ?? '';
  const title = entry?.title?.trim() ?? '';
  const date = entry?.date ? formatBookDate(entry.date, c.locale) : '';
  const words: BookLockupWords = {
    title: place || title,
    place: place || title,
    dates: date,
    kicker: date,
    year: entry?.date?.slice(0, 4) ?? '',
  };
  const bind = (w: string): BookTextElement['binding'] => {
    if (!entry || !w) return null;
    if (w === place) return { source: 'entry.location', entryId: entry.id };
    if (w === title) return { source: 'entry.title', entryId: entry.id };
    return date && w === date && entry.date ? { source: 'entry.date', entryId: entry.id, value: entry.date } : null;
  };
  return { words, bind };
}

/** The shape of a print for a photo: its own proportions, 4:3 when unknown. */
function aspectOf(photo: AutoPhoto): number {
  return photo.width && photo.height ? photo.width / photo.height : 4 / 3;
}

/** A lockup's parts made one group when they are several, as a cover's are, so the Studio moves the badge whole. */
function grouped(c: ComposeCtx, parts: BookElement[]): BookElement[] {
  if (parts.length < 2) return parts;
  const group = c.newId('g');
  return parts.map((e) => ({ ...e, group }));
}

/** A box moved inside another, as far as it fits. */
function within(box: BookFrame, room: BookFrame, rotation: number): BookFrame {
  const t = turnedBox(box, rotation);
  const dx = Math.max(room.x - t.x, Math.min(0, room.x + room.w - (t.x + t.w)));
  const dy = Math.max(room.y - t.y, Math.min(0, room.y + room.h - (t.y + t.h)));
  return frameOf(box.x + dx, box.y + dy, box.w, box.h);
}

/** Where the prints of a collage page lie, by how many: centre x, centre y and size, as shares of the live area. */
const SCATTER: Readonly<Record<number, readonly (readonly [number, number, number])[]>> = {
  1: [[0.5, 0.5, 0.78]],
  2: [
    [0.36, 0.34, 0.6],
    [0.64, 0.68, 0.6],
  ],
  3: [
    [0.3, 0.3, 0.52],
    [0.72, 0.36, 0.5],
    [0.48, 0.74, 0.54],
  ],
};

const FRAMES: readonly BookPhotoElement['frameStyle'][] = ['white', 'polaroid', 'tape'];

const focalOf = (p: BookPhotoElement): [number, number] => [
  p.frame.x + p.focalX * p.frame.w,
  p.frame.y + p.focalY * p.frame.h,
];

const covers = (box: BookFrame, [x, y]: [number, number]) =>
  x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;

/** One page of a collage: up to three prints, turned either way, framed, overlapping a little, none over another's detail. */
function scatter(c: ComposeCtx, list: readonly AutoPhoto[], side: Side, rng: DesignRng): BookPhotoElement[] {
  const room = liveBox(c, side);
  const slots = SCATTER[Math.min(3, list.length)] ?? [];
  const [lo, hi] = tilt(c);
  const short = Math.min(room.w, room.h);
  const out: BookPhotoElement[] = [];
  list.slice(0, 3).forEach((photo, i) => {
    const [fx, fy, share] = slots[i] ?? [0.5, 0.5, 0.6];
    const turn = (i % 2 === 0 ? -1 : 1) * rng.range(lo, hi);
    let size = share * short;
    let placed: BookPhotoElement | null = null;
    for (let tries = 0; tries < 4 && !placed; tries++) {
      const aspect = aspectOf(photo);
      const w = aspect >= 1 ? size : size * aspect;
      const h = aspect >= 1 ? size / aspect : size;
      const cx = room.x + room.w * fx + rng.range(-0.03, 0.03) * room.w;
      const cy = room.y + room.h * fy + rng.range(-0.03, 0.03) * room.h;
      const frame = within(frameOf(cx - w / 2, cy - h / 2, w, h), room, turn);
      const el = { ...photoEl(c, photo, frame, { turn }), frameStyle: rng.pick(FRAMES) ?? 'white' };
      const box = turnedBox(el.frame, el.rotation);
      if (out.every((under) => !covers(box, focalOf(under)))) placed = el;
      else size *= 0.88;
    }
    if (placed) out.push(placed);
  });
  return out;
}

/** A collage: the photos as turned, framed prints over both pages, the fuller page leading. */
export function composeCollage(c: ComposeCtx, photos: readonly AutoPhoto[], hand: Hand, rng: DesignRng): Composed {
  const lead = Math.min(3, Math.ceil(photos.length / 2));
  const elements = [
    ...scatter(c, photos.slice(0, lead), hand, rng),
    ...scatter(c, photos.slice(lead, lead + 3), other(hand), rng),
  ];
  return { elements };
}

/** A line of words on a band of paper over a photo: a label that reads wherever it lies. */
function label(c: ComposeCtx, words: string, frame: BookFrame, binding: BookTextElement['binding']): BookTextElement {
  const paper = c.look.paper;
  const text = spacedLine(pageKit(c), words, frame, inkOn(c, paper), 9);
  const pad = scaled(c, 1.6);
  return { ...text, binding, highlight: { color: paper, alpha: 1, padX: pad, padY: pad * 0.4, radius: 0 } };
}

/**
 * Script overlay (reference 3): the photo across the spread, the detail kept
 * off the fold, and on the other page a giant word of the place in the
 * script face, turned a little and outlined so it reads on any part of the
 * picture, with the title and the date on paper bands under it.
 */
export function composeScriptOverlay(
  c: ComposeCtx,
  entry: AutoEntry,
  photo: AutoPhoto,
  hand: Hand,
  rng: DesignRng,
): Composed {
  const sx = c.infos.get(photo.photoId)?.salient?.x;
  const focalX = sx !== undefined && (sx < 0.4 || sx > 0.6) ? sx : 0.62;
  const els: BookElement[] = [photoEl(c, photo, bleedSpread(c), { bleed: { side: 'left' }, focalX })];
  const box = liveBox(c, other(hand));
  const { words, bind } = entryWords(c, entry);
  const word = words.place ?? '';
  const frame = frameOf(box.x + box.w * 0.03, box.y + box.h * 0.24, box.w * 0.94, box.h * 0.32);
  let y = frame.y + frame.h + scaled(c, 8);
  if (word) {
    const turn = -rng.range(3, 8);
    const set = coverText(pageKit(c), word, frame, {
      slot: 'script',
      max: mmToPt(frame.h * 0.75),
      color: WHITE,
      rotation: turn,
    });
    const outline = { color: '#1a1a1a', width: Math.round(ptMm(set.size) * OUTLINE_SHARE * 100) / 100 };
    els.push({ ...set, outline, binding: bind(word) });
    const turned = turnedBox(set.frame, turn);
    y = turned.y + turned.h + scaled(c, 6);
  }
  const lines = [entry.title?.trim() ?? '', words.dates ?? ''].filter((w) => w && w !== word);
  for (const line of lines) {
    const at = frameOf(box.x + box.w * 0.15, y, box.w * 0.7, scaled(c, 8));
    els.push(label(c, line, at, bind(line)));
    y += scaled(c, 12);
  }
  return { elements: els };
}

/**
 * Two-tone: the photo to the bleed of one page, the other a block of the
 * accent over a band of a second colour, the chapter's title set large on
 * the block with the date over it and the place on the band.
 */
export function composeTwoTone(
  c: ComposeCtx,
  entry: AutoEntry,
  photo: AutoPhoto,
  hand: Hand,
  rng: DesignRng,
): Composed {
  const pk = pageKit(c);
  const { pageHeight: H } = c.grid;
  const side = other(hand);
  const page = bleedPage(c, side);
  const split = H * rng.range(0.6, 0.68);
  const top = deepened(c.look.accent);
  const low = deepened(standOut(c, top));
  const els: BookElement[] = [
    photoEl(c, photo, bleedPage(c, hand), { bleed: { side: hand } }),
    shapeEl(pk, 'rect', frameOf(page.x, page.y, page.w, split - page.y), top),
    shapeEl(pk, 'rect', frameOf(page.x, split, page.w, page.y + page.h - split), low),
  ];
  const box = liveBox(c, side);
  const { words, bind } = entryWords(c, entry);
  if (words.dates)
    els.push({
      ...spacedLine(pk, words.dates, frameOf(box.x, box.y, box.w, scaled(c, 8)), inkOn(c, top), 9),
      binding: bind(words.dates),
    });
  const heading = entry.title?.trim() || entry.location?.trim() || '';
  const headTop = box.y + scaled(c, 14);
  const headH = split - scaled(c, 10) - headTop;
  if (heading && headH > scaled(c, 20)) {
    const max = Math.min(c.look.sizes.heading * 2.4, mmToPt(headH * 0.6));
    const set = coverText(pk, heading, frameOf(box.x, headTop, box.w, headH), {
      slot: 'display',
      max,
      color: inkOn(c, top),
      align: 'left',
      leading: 1,
    });
    els.push({ ...set, binding: bind(heading) });
  }
  const place = entry.title?.trim() && entry.location?.trim() ? entry.location.trim() : '';
  if (place)
    els.push({
      ...spacedLine(pk, place, frameOf(box.x, split + scaled(c, 8), box.w, scaled(c, 8)), inkOn(c, low), 9),
      binding: bind(place),
    });
  return { elements: els };
}

/** The cells of a grid page: two by two to the bleed of a page, a gutter between them, stopping short of the fold. */
function quarterCells(c: ComposeCtx, side: Side, g: number): BookFrame[] {
  const { pageWidth: PW, pageHeight: H, bleed: b } = c.grid;
  const x0 = side === 'right' ? PW + g / 2 : -b;
  const x1 = side === 'right' ? PW * 2 + b : PW - g / 2;
  const mid = pageX(c, side) + PW / 2;
  const cols = [frameOf(x0, 0, mid - g / 2 - x0, 1), frameOf(mid + g / 2, 0, x1 - mid - g / 2, 1)];
  const rows = [frameOf(0, -b, 1, (H - g) / 2 + b), frameOf(0, (H + g) / 2, 1, (H - g) / 2 + b)];
  return rows.flatMap((r) => cols.map((col) => frameOf(col.x, r.y, col.w, r.h)));
}

/** Two cells to the bleed of a page, one over the other. */
function halfCells(c: ComposeCtx, side: Side, g: number): BookFrame[] {
  const { pageWidth: PW, pageHeight: H, bleed: b } = c.grid;
  const x0 = side === 'right' ? PW + g / 2 : -b;
  const w = PW + b - g / 2;
  return [frameOf(x0, -b, w, (H - g) / 2 + b), frameOf(x0, (H + g) / 2, w, (H - g) / 2 + b)];
}

const cell = (c: ComposeCtx, photo: AutoPhoto, frame: BookFrame): BookPhotoElement => ({
  ...photoEl(c, photo, frame),
  frameStyle: 'none',
  rotation: 0,
});

/**
 * Grid and badge: four photos to the bleed two by two on one page (two on
 * each page when there are only four) with a gutter of paper between them,
 * the rest framed on the other page, and a round badge at the leading page's
 * centre with the place, the date and the year, kept off every photo's detail.
 */
export function composeGridBadge(
  c: ComposeCtx,
  photos: readonly AutoPhoto[],
  entry: AutoEntry | null,
  hand: Hand,
  rng: DesignRng,
): Composed {
  const { pageWidth: PW, pageHeight: H } = c.grid;
  const g = scaled(c, rng.range(4, 6));
  const cells =
    photos.length <= 4 ? [...halfCells(c, hand, g), ...halfCells(c, other(hand), g)] : quarterCells(c, hand, g);
  const grid = photos.slice(0, 4).flatMap((p, i) => (cells[i] ? [cell(c, p, cells[i] as BookFrame)] : []));
  const rest = photos.slice(4, 6);
  const box = liveBox(c, other(hand));
  const framed = rest.map((p, i) => {
    const h = rest.length > 1 ? (box.h - c.grid.gutter) / 2 : box.h * 0.7;
    const y = rest.length > 1 ? box.y + i * (h + c.grid.gutter) : box.y + (box.h - h) / 2;
    return photoEl(c, p, frameOf(box.x, y, box.w, h));
  });
  const els: BookElement[] = [...grid, ...framed];
  const centre: [number, number] = [pageX(c, hand) + PW / 2, H / 2];
  const d = badgeSpan(grid, centre, PW * 0.4, PW * 0.24);
  const { words, bind } = entryWords(c, entry);
  const at = {
    id: 'circle-badge',
    box: frameOf(centre[0] - d / 2, centre[1] - d / 2, d, d),
    ground: c.look.paper,
    words,
  };
  els.push(...grouped(c, lockupOn(c, at, { display: words.title, bind })));
  return { elements: els };
}

/**
 * Stamp row: the photos as postage stamps, perforated in a white border, in
 * a row on each page over a band of colour across the spread, each a little
 * askew, and a round postmark with the place and the date turned on the
 * corner of the second page.
 */
export function composeStampRow(
  c: ComposeCtx,
  photos: readonly AutoPhoto[],
  entry: AutoEntry | null,
  hand: Hand,
  rng: DesignRng,
): Composed {
  const pk = pageKit(c);
  const { pageWidth: PW, pageHeight: H, bleed: b, margin: m, gutter: g } = c.grid;
  const d = PW * 0.26;
  const lead = Math.ceil(photos.length / 2);
  const rows: [Side, readonly AutoPhoto[]][] = [
    [hand, photos.slice(0, lead)],
    [other(hand), photos.slice(lead)],
  ];
  const most = Math.max(1, lead);
  // A stamp is a small print: at most two fifths of the page wide, however few there are.
  const w = Math.min(PW * 0.4, (PW - m * 2 - (most - 1) * g * 1.5) / most);
  const h = Math.min(w * 1.25, H - m * 2 - d - scaled(c, 6));
  const top = m + (H - m * 2 - d - scaled(c, 6) - h) / 2;
  const band = shapeEl(pk, 'rect', frameOf(-b, top + h * 0.2, PW * 2 + b * 2, h * 0.6), standOut(c, c.look.paper));
  const els: BookElement[] = [band];
  // Each stamp a little askew, as the book turns its prints: a row stays a row.
  const [lo, hi] = tilt(c);
  for (const [side, list] of rows) {
    const box = liveBox(c, side);
    const span = list.length * w + (list.length - 1) * g * 1.5;
    list.forEach((photo, i) => {
      const frame = frameOf(box.x + (box.w - span) / 2 + i * (w + g * 1.5), top, w, h);
      const look = {
        turn: rng.sign() * rng.range(lo, Math.min(hi, lo + 1.5)),
        edge: { edge: 'perforated' as const, size: scaled(c, 1.4) },
        border: { width: scaled(c, 2), color: WHITE },
      };
      els.push(printEl(pk, photo, frame, look));
    });
  }
  const { words, bind } = entryWords(c, entry);
  const corner = liveBox(c, other(hand));
  const at = {
    id: 'postmark',
    box: frameOf(corner.x + corner.w - d, corner.y + corner.h - d, d, d),
    ground: c.look.paper,
    words,
    turn: -rng.range(6, 14),
  };
  els.push(...grouped(c, lockupOn(c, at, { display: words.title, bind })));
  return { elements: els };
}
