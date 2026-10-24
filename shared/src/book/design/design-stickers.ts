import { bookStickerElement } from '../book-sticker';
import {
  MAX_SPREAD_ELEMENTS,
  type BookElement,
  type BookFrame,
  type BookSpread,
  type BookStickerElement,
} from '../book.schema';
import { CALM_ART, STICKERS_PER_SPREAD, type BookDesignSticker } from './design-art';
import { frameOf, pageX, type ComposeCtx, type Side } from './design-compose';
import { designRng, type DesignRng } from './design-random';

/**
 * Stickers laid on a designed page the way a person would stick them: on the
 * corner of a print, half over it, or in a free patch of paper, never over
 * words, never over the detail of a photo, never in the fold or the safe
 * margin, never on another sticker. Which drawing goes where, its size and its
 * turn come from the design's seed, so a page is decorated the same way every
 * time and differently with another seed.
 *
 * The drawings come from the theme's motifs (design-art.ts). A page with no
 * free spot for a sticker takes fewer than asked, never one in a bad place.
 */

/** The kinds a sticker keeps clear of: words, figures and maps, and the other stickers. */
const CLEAR = new Set<BookElement['kind']>(['text', 'badge', 'stats', 'list', 'countries', 'icon', 'map', 'sticker']);

/** Millimetres kept between a sticker and what it keeps clear of, and off the fold. */
const PAD = 2;
const FOLD_GAP = 5;
/** A sticker covers at most this share of any one photo. */
const MAX_PHOTO_COVER = 0.3;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** The box an element covers, turned with it. */
export function turnedBox(frame: BookFrame, rotation: number): BookFrame {
  if (!rotation) return frame;
  const rad = (rotation * Math.PI) / 180;
  const w = frame.w * Math.abs(Math.cos(rad)) + frame.h * Math.abs(Math.sin(rad));
  const h = frame.w * Math.abs(Math.sin(rad)) + frame.h * Math.abs(Math.cos(rad));
  return { x: frame.x + frame.w / 2 - w / 2, y: frame.y + frame.h / 2 - h / 2, w, h };
}

/** The area two boxes share. */
export function sharedArea(a: BookFrame, b: BookFrame): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

const grown = (b: BookFrame, by: number): BookFrame => ({ x: b.x - by, y: b.y - by, w: b.w + by * 2, h: b.h + by * 2 });
const holds = (b: BookFrame, px: number, py: number) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

/** Where a sticker may lie on one page: inside the safe margin, off the fold. */
function roomOn(c: ComposeCtx, side: Side): BookFrame {
  const { pageWidth: PW, pageHeight: H, safe } = c.grid;
  const x0 = pageX(c, side) + safe + 1;
  const x1 = pageX(c, side) + PW - safe - 1;
  const left = side === 'right' ? Math.max(x0, PW + FOLD_GAP) : x0;
  const right = side === 'left' ? Math.min(x1, PW - FOLD_GAP) : x1;
  return { x: left, y: safe + 1, w: right - left, h: H - safe * 2 - 2 };
}

const inside = (room: BookFrame, b: BookFrame) =>
  b.x >= room.x && b.y >= room.y && b.x + b.w <= room.x + room.w && b.y + b.h <= room.y + room.h;

/** The points a sticker may be centred on, best first: the corners of the photos, then a lattice of free paper. */
function spots(c: ComposeCtx, elements: readonly BookElement[], room: BookFrame, rng: DesignRng): [number, number][] {
  const corners: [number, number][] = [];
  for (const el of elements) {
    if (el.kind !== 'photo' || el.photoId == null) continue;
    const { x, y, w, h } = el.frame;
    corners.push([x, y], [x + w, y], [x, y + h], [x + w, y + h]);
  }
  const lattice: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) lattice.push([room.x + (room.w * (i + 0.5)) / 4, room.y + (room.h * (j + 0.5)) / 4]);
  }
  const onPage = corners.filter(([x, y]) => holds(room, x, y));
  return [...rng.shuffle(onPage), ...rng.shuffle(lattice)];
}

interface Obstacles {
  clear: BookFrame[];
  photos: { box: BookFrame; focal: [number, number] }[];
}

function obstaclesOf(elements: readonly BookElement[], avoid: readonly BookFrame[]): Obstacles {
  const clear = [...avoid];
  const photos: Obstacles['photos'] = [];
  for (const el of elements) {
    if (el.hidden) continue;
    const box = turnedBox(el.frame, el.rotation);
    if (CLEAR.has(el.kind)) clear.push(grown(box, PAD));
    if (el.kind === 'photo' && el.photoId != null) {
      photos.push({ box, focal: [el.frame.x + el.focalX * el.frame.w, el.frame.y + el.focalY * el.frame.h] });
    }
  }
  return { clear, photos };
}

/** Whether a sticker box sits well: in its room, clear of words and other stickers, off every photo's detail. */
function fits(box: BookFrame, room: BookFrame, ob: Obstacles): boolean {
  if (!inside(room, box)) return false;
  if (ob.clear.some((b) => sharedArea(b, box) > 0)) return false;
  return ob.photos.every((p) => {
    if (holds(grown(box, 3), p.focal[0], p.focal[1])) return false;
    return sharedArea(p.box, box) <= p.box.w * p.box.h * MAX_PHOTO_COVER;
  });
}

interface StickerRequest {
  /** How many to place at most. */
  count: number;
  /** The longest side as a share of the page's shorter side, least and most. */
  size: readonly [number, number];
  /** The pages to place them on. */
  sides: readonly Side[];
  /** The decision's key, for the seed (design-random.ts). */
  key: string;
  /** Boxes kept clear besides the words: a title zone, a badge. */
  avoid?: readonly BookFrame[];
  /** Ids the book used already: taken last, so a book repeats a drawing only when it runs out. */
  used?: Set<string>;
  /** The drawings to choose from; the design's motif stickers when left out. */
  from?: readonly BookDesignSticker[];
}

/** The order the drawings are tried in: shuffled, the ones the book has not used yet first. */
function drawingsFor(pool: readonly BookDesignSticker[], used: Set<string> | undefined, rng: DesignRng) {
  const shuffled = rng.shuffle(pool);
  return used ? [...shuffled.filter((s) => !used.has(s.id)), ...shuffled.filter((s) => used.has(s.id))] : shuffled;
}

/** The size and turn of a sticker drawn at `share` of the page, its frame centred on a point. */
function frameAt(box: readonly [number, number], longest: number, at: [number, number]): BookFrame {
  const k = longest / Math.max(box[0], box[1], 1);
  const w = box[0] * k;
  const h = box[1] * k;
  return frameOf(at[0] - w / 2, at[1] - h / 2, w, h);
}

/**
 * Up to `count` stickers for a page holding `elements`, to be painted on top
 * of them, each on a spot that fits. Fewer when the page has no room, the
 * library none for the book's motifs, or the page is at its element cap.
 */
export function placeStickers(
  c: ComposeCtx,
  elements: readonly BookElement[],
  request: StickerRequest,
): BookStickerElement[] {
  const art = c.art ?? CALM_ART;
  const pool = request.from ?? art.stickers;
  const room = MAX_SPREAD_ELEMENTS - elements.length;
  const count = Math.min(request.count, room, pool.length);
  if (count <= 0 || art.bare) return [];
  const rng = designRng(art.seed, request.key);
  // Turned as the book turns its prints: a calm book's stickers lie nearly straight.
  const [tiltLo, tiltHi] = art.tilt;
  const short = Math.min(c.grid.pageWidth, c.grid.pageHeight);
  const out: BookStickerElement[] = [];
  const drawings = drawingsFor(pool, request.used, rng);
  for (let i = 0; i < count; i++) {
    const side = request.sides[i % request.sides.length] as Side;
    const pageRoom = roomOn(c, side);
    const ob = obstaclesOf([...elements, ...out], request.avoid ?? []);
    const drawing = drawings[i % drawings.length] as BookDesignSticker;
    const turn = r2(rng.sign() * rng.range(tiltLo, tiltHi));
    const longest = rng.range(request.size[0], request.size[1]) * short;
    const at = spots(c, elements, pageRoom, rng).find((p) =>
      fits(turnedBox(frameAt(drawing.box, longest, p), turn), pageRoom, ob),
    );
    if (!at) continue;
    const sticker = bookStickerElement(drawing, frameAt(drawing.box, longest, at), c.newId('k'));
    out.push({ ...sticker, rotation: turn, flipX: rng.chance(0.3) });
    request.used?.add(drawing.id);
  }
  return out;
}

/** How many stickers a spread takes at the design's decoration level, from its seed. */
export function stickersFor(c: ComposeCtx, key: string): number {
  const art = c.art ?? CALM_ART;
  const [lo, hi] = STICKERS_PER_SPREAD[art.decoration];
  return hi === 0 ? 0 : designRng(art.seed, key).int(lo, hi);
}

/**
 * An inner spread decorated at the design's level: its stickers on both
 * pages, painted over what is there. The spread as it was when the design is
 * not decorated or finds no room.
 */
export function decorateSpread(c: ComposeCtx, spread: BookSpread, key: string): BookSpread {
  const count = stickersFor(c, key);
  if (!count) return spread;
  const sides: Side[] = spread.role === 'inner' ? ['left', 'right'] : ['single'];
  const made = placeStickers(c, spread.elements, { count, size: [0.14, 0.22], sides, key, used: c.art?.used });
  return made.length ? { ...spread, elements: [...spread.elements, ...made] } : spread;
}
