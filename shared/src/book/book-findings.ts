import { bookVisiblePart, sortBookFindings } from './book-findings-design';
import type { BookPhotoInfo } from './book-ops-core';
import type { BookFinding } from './book-ops.schema';
import type { BookElement, BookPageSetup, BookPhotoElement, BookSpread, BookTextElement } from './book.schema';

/**
 * What is likely wrong with a page, worked out from the document alone.
 *
 * The checks a person makes looking at a proof, as far as the numbers allow:
 * pictures on top of each other, words in the fold or past the trim, frames
 * left empty, a picture printed larger than its pixels carry, the interesting
 * part of a picture cut off, words that will not fit their box. A model that
 * cannot see the page checks its work against these; one that can gets them
 * beside the image.
 *
 * Severity says what to do: `severe` is fixed before a change is proposed,
 * `warn` is worth saying, `info` is context. All of it is estimation, a text
 * is measured with an average letter width, not set, so a finding reads as
 * "likely", never as a verdict.
 */

/** Below this a print looks soft at arm's length. */
export const MIN_PRINT_DPI = 200;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The box an element occupies on the page, turned with it when it is rotated. */
function elementBox(el: BookElement): Box {
  const { x, y, w, h } = el.frame;
  if (!el.rotation) return { x, y, w, h };
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bw = w * cos + h * sin;
  const bh = w * sin + h * cos;
  return { x: x + w / 2 - bw / 2, y: y + h / 2 - bh / 2, w: bw, h: bh };
}

const area = (b: Box) => Math.max(0, b.w) * Math.max(0, b.h);

function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

const contains = (b: Box, px: number, py: number) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

const mm = (v: number) => `${Math.round(v * 10) / 10}`;

/** Words, shapes aside: what reads as content rather than decoration. */
const WORDS = new Set<BookElement['kind']>(['text', 'badge', 'stats', 'list', 'countries', 'icon']);

/** The effective resolution of a photo at its printed size, or null when the original's size is unknown. */
export function photoDpi(el: BookPhotoElement, info: BookPhotoInfo | undefined): number | null {
  if (!info?.width || !info.height || el.frame.w <= 0 || el.frame.h <= 0) return null;
  const mmPerPx =
    el.fit === 'contain'
      ? Math.min(el.frame.w / info.width, el.frame.h / info.height)
      : Math.max(el.frame.w / info.width, el.frame.h / info.height);
  return Math.round(25.4 / mmPerPx);
}

/** Average letter width per em at weight 400, per family: measured on story text as the Studio sets each family. */
const LETTER_EM: Record<BookTextElement['font'], number> = {
  sans: 0.507,
  inter: 0.478,
  serif: 0.469,
  garamond: 0.383,
  playfair: 0.454,
  display: 0.492,
  bebas: 0.339,
};

/**
 * The headroom on letter width the design engine sizes a text frame with. A
 * frame the engine sizes must hold its words, and a few percent of width
 * covers the letters wider than the average: measured against the Studio on
 * 1512 texts, the lines counted with it fall short in under 1% of them, where
 * counting characters fell short in 27%. The findings keep the best estimate,
 * so a frame a person sized is not flagged for a few percent of width.
 */
export const DESIGN_TEXT_HEADROOM = 1.05;

/** A number the text carries, or the schema's default when it carries none (a layout's meta line sets no leading). */
const orDefault = (v: number | undefined, fallback: number) => (Number.isFinite(v) ? (v as number) : fallback);

/**
 * How many lines a paragraph takes at `perLine` letters a line, broken at
 * spaces as the Studio breaks it: a word that does not fit the rest of a line
 * starts the next one, a word longer than a line breaks inside it, and an
 * empty paragraph is one line.
 */
function wrappedLines(para: string, perLine: number): number {
  let lines = 1;
  let used = 0;
  for (const word of para.split(' ')) {
    if (used > 0 && used + 1 + word.length <= perLine) {
      used += 1 + word.length;
      continue;
    }
    if (used > 0) lines += 1;
    lines += Math.max(0, Math.ceil(word.length / perLine) - 1);
    used = word.length % perLine || Math.min(word.length, perLine);
  }
  return lines;
}

/**
 * How many millimetres a text needs to be set at its frame's width, roughly:
 * its words wrapped at the family's average letter width times `headroom`,
 * plus its tracking, which is the same for every letter and so takes no
 * headroom. The default, 1, is the best estimate; the design engine sizes its
 * frames with `DESIGN_TEXT_HEADROOM`.
 */
export function textHeightNeeded(el: BookTextElement, headroom = 1): number {
  const sizeMm = (orDefault(el.size, 11) * 25.4) / 72;
  const tracking = orDefault(el.tracking, 0);
  const letter = sizeMm * ((LETTER_EM[el.font] ?? 0.5) * (el.weight >= 600 ? 1.06 : 1) * headroom + tracking);
  const perLine = Math.max(1, Math.floor(el.frame.w / Math.max(letter, 0.1)));
  const lines = el.text.split('\n').reduce((sum, para) => sum + wrappedLines(para.trimEnd(), perLine), 0);
  return lines * sizeMm * orDefault(el.leading, 1.45);
}

interface Ctx {
  spread: BookSpread;
  page: BookPageSetup;
  W: number;
  H: number;
  photos: readonly BookPhotoInfo[] | undefined;
  out: BookFinding[];
}

function add(ctx: Ctx, f: BookFinding): void {
  ctx.out.push({ ...f, message: f.message.slice(0, 300) });
}

const placedPhotos = (spread: BookSpread) => spread.elements.filter((e): e is BookPhotoElement => e.kind === 'photo');

/**
 * A photo under a quarter of the size of the one it lies on is an inset: the
 * auto layout sets a small picture over the hero on purpose. Context, not a
 * fault; two pictures of a size on top of each other are. The same holds for
 * a small line of type set over display type, never over running text.
 */
const INSET_RATIO = 0.25;

/**
 * Under this many degrees off straight an element reads as unturned; past it,
 * as laid down at an angle on purpose. Above the scrapbook style's own tilt of
 * 2 degrees, so a page of that style is not layered by its look alone.
 */
const TURNED_DEG = 3;

/** Past this share of the smaller one covered, two photos or texts are an accident however they are turned or framed. */
const LAYERED_MAX_SHARE = 0.5;

/** Display type, which a small line may be set over: a few words at the heading floor of the styles or larger. */
const DISPLAY_MAX_CHARS = 40;
const DISPLAY_MIN_PT = 14;

/** The most overlap findings one page reports, the severe ones first. */
const MAX_OVERLAPS = 6;

/** How far an element is turned from straight, 0 to 180 degrees, whichever way and however many turns. */
function turnOf(el: BookElement): number {
  const rest = el.rotation % 360;
  const turned = rest < 0 ? rest + 360 : rest;
  return Math.min(turned, 360 - turned);
}

/**
 * Whether two elements on top of each other read as layered on purpose: either
 * of them turned, or the upper one a photo in a frame (a polaroid, a border, a
 * shadow), which is how a print laid on a page looks. `upper` is the one
 * painted later.
 */
function layered(lower: BookElement, upper: BookElement): boolean {
  if (turnOf(lower) >= TURNED_DEG || turnOf(upper) >= TURNED_DEG) return true;
  return upper.kind === 'photo' && upper.frameStyle !== 'none';
}

/** Whether a text is display type: a few words, set at heading size or larger. */
function isDisplay(el: BookElement): boolean {
  return el.kind === 'text' && el.text.trim().length <= DISPLAY_MAX_CHARS && el.size >= DISPLAY_MIN_PT;
}

/** Whether the smaller of two is an inset on the larger: any small photo, a small text only over display type. */
function isInset(small: BookElement, large: BookElement, smaller: number, larger: number): boolean {
  if (smaller >= larger * INSET_RATIO) return false;
  return small.kind === 'photo' || isDisplay(large);
}

/**
 * Two photos or two texts on top of each other, `a` painted under `b`.
 *
 * Severe when it looks like an accident: both straight, of a size, the upper
 * one unframed, or more than half of the smaller one covered whatever the
 * look. A small one set over a large one, a turned or framed picture laid
 * partly over another, is how a lively page is made, and is said as context.
 * A title over a photo or a photo over a shape is never compared at all:
 * different kinds layered are a design.
 */
function overlapFinding(a: BookElement, b: BookElement, ba: Box, bb: Box, shared: number): BookFinding {
  const [small, large] = area(ba) <= area(bb) ? [a, b] : [b, a];
  const smaller = Math.min(area(ba), area(bb));
  const share = shared / Math.max(smaller, 1);
  const pct = Math.round(share * 100);
  const what = a.kind === 'photo' ? 'photo' : 'text';
  if (isInset(small, large, smaller, Math.max(area(ba), area(bb)))) {
    return {
      code: 'overlap',
      severity: 'info',
      elementIds: [small.id, large.id],
      message: `${what} ${small.id} is set as an inset over ${large.id} (${pct}% of it on the larger one)`,
    };
  }
  if (share <= LAYERED_MAX_SHARE && layered(a, b)) {
    return {
      code: 'overlap',
      severity: 'info',
      elementIds: [a.id, b.id],
      message: `${what}s ${a.id} and ${b.id} are layered on purpose, turned or framed (${pct}% of the smaller one covered); check nothing that matters is hidden`,
    };
  }
  return {
    code: 'overlap',
    severity: 'severe',
    elementIds: [a.id, b.id],
    message: `${what}s ${a.id} and ${b.id} overlap (${pct}% of the smaller one)`,
  };
}

/**
 * Every pair of photos or texts on top of each other, reported severe first up
 * to the cap, so pairs layered on purpose never crowd out an accident.
 */
function overlaps(ctx: Ctx): void {
  const content = ctx.spread.elements.filter((e) => e.kind === 'photo' || e.kind === 'text');
  const found: BookFinding[] = [];
  for (let i = 0; i < content.length; i++) {
    for (let j = i + 1; j < content.length; j++) {
      const a = content[i] as BookElement;
      const b = content[j] as BookElement;
      if (a.kind !== b.kind) continue;
      const ba = elementBox(a);
      const bb = elementBox(b);
      const shared = overlapArea(ba, bb);
      if (shared < 4 || shared < Math.min(area(ba), area(bb)) * 0.05) continue;
      found.push(overlapFinding(a, b, ba, bb, shared));
    }
  }
  const severe = found.filter((f) => f.severity === 'severe');
  const context = found.filter((f) => f.severity !== 'severe');
  for (const f of [...severe, ...context].slice(0, MAX_OVERLAPS)) add(ctx, f);
}

/**
 * Words across the fold are lost in the binding, unless their frame is centred
 * on it: then the type is set across the spread on purpose (the band-quote
 * layout does that), and the finding asks for a look rather than a fix.
 */
function wordsInFold(ctx: Ctx, el: BookElement, b: Box, x: number): void {
  const centred = Math.abs(b.x + b.w / 2 - x) < 2;
  add(ctx, {
    code: 'fold',
    severity: centred ? 'warn' : 'severe',
    elementIds: [el.id],
    message: centred
      ? `${el.kind} ${el.id} is set across the spread, centred on the fold; check its words clear the binding`
      : `${el.kind} ${el.id} runs across the fold at x ${mm(x)}; the binding swallows what sits there`,
  });
}

/**
 * A photo across the fold is a choice the built-in grids and the auto layout
 * make themselves (a middle column, the picture crossing from the panel), so
 * it is worth saying, never a fault; a focal point in the fold is said with it.
 */
function photoInFold(ctx: Ctx, el: BookPhotoElement, x: number): void {
  const focalInFold = el.photoId != null && Math.abs(el.frame.x + el.focalX * el.frame.w - x) < 12;
  if (el.frame.w >= ctx.page.pageWidth && !focalInFold) return;
  let message = `the focal point of photo ${el.id} sits in the fold; move it with focalX`;
  if (el.frame.w < ctx.page.pageWidth) {
    message = focalInFold
      ? `photo ${el.id} is split by the fold with its focal point in it; move it with focalX or keep it on one page`
      : `photo ${el.id} is split by the fold; fine for a picture meant to cross, else keep it on one page`;
  }
  add(ctx, { code: 'fold', severity: 'warn', elementIds: [el.id], message });
}

function fold(ctx: Ctx): void {
  if (ctx.spread.role !== 'inner') return;
  const x = ctx.page.pageWidth;
  for (const el of ctx.spread.elements) {
    const b = elementBox(el);
    if (!(b.x < x - 2 && b.x + b.w > x + 2)) continue;
    if (WORDS.has(el.kind)) wordsInFold(ctx, el, b, x);
    else if (el.kind === 'photo') photoInFold(ctx, el, x);
  }
}

function trimEdges(ctx: Ctx, el: BookElement, b: Box): void {
  const { bleed, safe } = ctx.page;
  const past = b.x < -0.5 || b.y < -0.5 || b.x + b.w > ctx.W + 0.5 || b.y + b.h > ctx.H + 0.5;
  if (WORDS.has(el.kind)) {
    if (past) {
      add(ctx, {
        code: 'trim',
        severity: 'severe',
        elementIds: [el.id],
        message: `${el.kind} ${el.id} reaches past the trim and will be cut`,
      });
    } else if (b.x < safe || b.y < safe || b.x + b.w > ctx.W - safe || b.y + b.h > ctx.H - safe) {
      add(ctx, {
        code: 'trim',
        severity: 'warn',
        elementIds: [el.id],
        message: `${el.kind} ${el.id} is inside the ${mm(safe)} mm safe margin`,
      });
    }
    return;
  }
  if (el.kind !== 'photo' && el.kind !== 'shape') return;
  // An edge past the trim should reach the bleed; one just short of the trim leaves a sliver of paper.
  const gaps = [b.x, b.y, ctx.W - (b.x + b.w), ctx.H - (b.y + b.h)];
  const between = gaps.some((g) => g < -0.5 && g > -bleed + 0.5);
  const sliver = gaps.some((g) => g > 0.05 && g < 1.5);
  if (between || sliver) {
    add(ctx, {
      code: 'trim',
      severity: 'warn',
      elementIds: [el.id],
      message: between
        ? `${el.kind} ${el.id} goes past the trim but stops short of the ${mm(bleed)} mm bleed`
        : `${el.kind} ${el.id} stops just short of the page edge; take it to the bleed or in by the margin`,
    });
  }
}

function trim(ctx: Ctx): void {
  for (const el of ctx.spread.elements) {
    const b = elementBox(el);
    if (b.x + b.w < 0 || b.y + b.h < 0 || b.x > ctx.W || b.y > ctx.H) {
      add(ctx, {
        code: 'trim',
        severity: 'warn',
        elementIds: [el.id],
        message: `${el.kind} ${el.id} lies off the page`,
      });
      continue;
    }
    trimEdges(ctx, el, b);
  }
}

function emptyFrames(ctx: Ctx): void {
  const empty = placedPhotos(ctx.spread).filter((e) => e.photoId == null);
  if (!empty.length) return;
  add(ctx, {
    code: 'empty_frame',
    severity: 'severe',
    elementIds: empty.slice(0, 8).map((e) => e.id),
    message: `${empty.length} empty photo frame${empty.length === 1 ? '' : 's'} (${empty
      .slice(0, 8)
      .map((e) => e.id)
      .join(', ')}); an empty frame prints as nothing`,
  });
}

/** The first element painted above `index` that hides the point, or undefined. */
function coveredBy(spread: BookSpread, index: number, px: number, py: number): BookElement | undefined {
  return spread.elements.slice(index + 1).find((e) => {
    const opaque =
      (e.kind === 'photo' && e.photoId != null) ||
      e.kind === 'map' ||
      (e.kind === 'shape' && e.fill != null && e.opacity >= 0.9 && e.shape !== 'line');
    return opaque && e.opacity >= 0.9 && contains(elementBox(e), px, py);
  });
}

function photoChecks(ctx: Ctx): void {
  ctx.spread.elements.forEach((el, index) => {
    if (el.kind !== 'photo' || el.photoId == null) return;
    const info = ctx.photos?.find((p) => p.photoId === el.photoId);
    if (ctx.photos && !info) {
      add(ctx, {
        code: 'not_in_gallery',
        severity: 'warn',
        elementIds: [el.id],
        message: `photo ${el.photoId} in ${el.id} is not in this journey's gallery`,
      });
    }
    if (info?.hidden) {
      add(ctx, {
        code: 'hidden_photo',
        severity: 'info',
        elementIds: [el.id],
        message: `photo ${el.photoId} in ${el.id} is by another contributor and is not shown in the page image`,
      });
    }
    const dpi = photoDpi(el, info);
    if (dpi !== null && dpi < MIN_PRINT_DPI) {
      add(ctx, {
        code: 'low_dpi',
        severity: 'warn',
        elementIds: [el.id],
        message: `photo ${el.photoId} in ${el.id} prints at about ${dpi} dpi; under ${MIN_PRINT_DPI} it looks soft, make the frame smaller`,
      });
    }
    focal(ctx, el, index);
  });
}

function focal(ctx: Ctx, el: BookPhotoElement, index: number): void {
  const px = el.frame.x + el.focalX * el.frame.w;
  const py = el.frame.y + el.focalY * el.frame.h;
  const say = (why: string) =>
    add(ctx, {
      code: 'focal_cut',
      severity: 'warn',
      elementIds: [el.id],
      message: `the focal point of photo ${el.id} ${why}`,
    });
  if (px < 0 || py < 0 || px > ctx.W || py > ctx.H) return say('lies past the trim; move it with focalX/focalY');
  if (el.mask === 'ellipse') {
    const dx = (el.focalX - 0.5) * 2;
    const dy = (el.focalY - 0.5) * 2;
    if (dx * dx + dy * dy > 1) return say('falls outside the ellipse mask');
  }
  const over = coveredBy(ctx.spread, index, px, py);
  if (over) return say(`is hidden under ${over.kind} ${over.id}`);
  salientCut(ctx, el);
}

/**
 * The picture's salient point (where its detail gathers, from the pixel
 * signals) cropped out of the frame. An estimate, not a face detector.
 */
function salientCut(ctx: Ctx, el: BookPhotoElement): void {
  const info = ctx.photos?.find((p) => p.photoId === el.photoId);
  const s = info?.salient;
  const seen = bookVisiblePart(el, info);
  if (!s || !seen) return;
  const inX = s.x >= seen.x - 0.02 && s.x <= seen.x + seen.w + 0.02;
  const inY = s.y >= seen.y - 0.02 && s.y <= seen.y + seen.h + 0.02;
  if (inX && inY) return;
  add(ctx, {
    code: 'focal_cut',
    severity: 'warn',
    elementIds: [el.id],
    message: `the detail of photo ${el.id} gathers at ${s.x.toFixed(2)}/${s.y.toFixed(2)} of the picture, outside what its frame shows; move focalX/focalY toward it`,
  });
}

function overflow(ctx: Ctx): void {
  for (const el of ctx.spread.elements) {
    if (el.kind !== 'text' || !el.text.trim()) continue;
    const need = textHeightNeeded(el);
    if (need <= el.frame.h * 1.1 + 0.5) continue;
    add(ctx, {
      code: 'text_overflow',
      severity: 'severe',
      elementIds: [el.id],
      message: `text ${el.id} likely overflows: it needs about ${mm(need)} mm and its frame is ${mm(el.frame.h)} mm tall; enlarge the frame, shorten the text or set it smaller`,
    });
  }
}

function parked(ctx: Ctx): void {
  const list = ctx.spread.parked;
  if (!list.length) return;
  const kinds = new Map<string, number>();
  for (const el of list) kinds.set(el.kind, (kinds.get(el.kind) ?? 0) + 1);
  const what = [...kinds].map(([k, n]) => `${n} ${k}`).join(', ');
  add(ctx, {
    code: 'parked',
    severity: 'info',
    elementIds: list.slice(0, 8).map((e) => e.id),
    message: `${list.length} parked off the page (${what}); a layout with room brings them back`,
  });
}

/** Every finding on one page, severe first, at most `BOOK_OP_LIMITS.findings`. */
export function spreadFindings(
  spread: BookSpread,
  page: BookPageSetup,
  photos?: readonly BookPhotoInfo[],
): BookFinding[] {
  const ctx: Ctx = {
    spread,
    page,
    W: page.pageWidth * (spread.role === 'inner' ? 2 : 1),
    H: page.pageHeight,
    photos,
    out: [],
  };
  overlaps(ctx);
  fold(ctx);
  trim(ctx);
  emptyFrames(ctx);
  overflow(ctx);
  photoChecks(ctx);
  parked(ctx);
  return sortBookFindings(ctx.out);
}
