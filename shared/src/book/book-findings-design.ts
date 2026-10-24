import { compareCodeUnits } from '../common/compare';
import { contrastOfLuminance, deltaE, greyLuminance, luminance, parseHex, requiredContrast } from './book-colour';
import { artFindings } from './book-findings-art';
import { bookFontCountsInMix, bookFontsUsed } from './book-fonts';
import { visibleSpread } from './book-groups';
import type { BookPhotoInfo } from './book-ops-core';
import { BOOK_OP_LIMITS, type BookFinding } from './book-ops.schema';
import { photoZoomBox, photoZoomOf } from './book-photo-look';
import { bookTextHasOwnGround } from './book-text-findings';
import type { BookDocument, BookElement, BookFrame, BookPageSetup, BookPhotoElement, BookSpread } from './book.schema';

/**
 * The checks a designer makes on a proof, beyond the print faults of
 * book-findings.ts: words over a busy part of a picture, words that do not
 * stand out from what they are set on, type too small to read, a page packed
 * edge to edge, edges that almost line up, and across the book more than two
 * typefaces, colours that wander from the book's own, the same page three
 * times running.
 *
 * Honest limits: no faces and no taste. A picture's busy areas, its mean
 * brightness and its salient point come from cheap pixel signals measured on
 * the server (an edge-density grid, a mean, an edge-energy centroid); without
 * them the checks that need them say nothing rather than guess.
 */

/** A frame in millimetres, as the book types it, so a zod-inferred `el.frame` passes in every compile mode. */
type Box = BookFrame;

const mm = (v: number) => `${Math.round(v * 10) / 10}`;

function overlap(a: Box, b: Box): Box | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0 && h > 0 ? { x, y, w, h } : null;
}

const centreIn = (b: Box, px: number, py: number) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

/**
 * Where a photo's picture lies in its frame: the drawn picture's box in page
 * millimetres, as `object-fit` and `object-position` place it (the focal point
 * is the position). Null when the picture's shape is unknown.
 */
export function bookPhotoCrop(el: BookPhotoElement, info: BookPhotoInfo | undefined): Box | null {
  if (!info?.width || !info.height) return null;
  const f = photoZoomBox(el.frame, photoZoomOf(el), el.focalX, el.focalY);
  const pick = el.fit === 'contain' ? Math.min : Math.max;
  const scale = pick(f.w / info.width, f.h / info.height);
  const w = info.width * scale;
  const h = info.height * scale;
  return { x: f.x + (f.w - w) * el.focalX, y: f.y + (f.h - h) * el.focalY, w, h };
}

/** The part of a picture (0..1 of each edge) its frame shows. */
export function bookVisiblePart(el: BookPhotoElement, info: BookPhotoInfo | undefined): Box | null {
  const crop = bookPhotoCrop(el, info);
  if (!crop) return null;
  const seen = overlap(crop, el.frame);
  if (!seen) return null;
  return { x: (seen.x - crop.x) / crop.w, y: (seen.y - crop.y) / crop.h, w: seen.w / crop.w, h: seen.h / crop.h };
}

/** How busy the part of a picture under a box is, 0 (calm) to 15, weighted by area; null when unknown. */
export function bookBusyUnder(el: BookPhotoElement, info: BookPhotoInfo | undefined, box: Box): number | null {
  const crop = bookPhotoCrop(el, info);
  const grid = info?.busy;
  if (!crop || !grid || grid.length !== 64) return null;
  // A mirrored picture shows under the box what lies under its mirror image.
  const under = el.flipX ? { ...box, x: 2 * el.frame.x + el.frame.w - box.x - box.w } : box;
  const onPhoto = overlap(under, el.frame);
  const area = onPhoto && overlap(onPhoto, crop);
  if (!area) return null;
  const cw = crop.w / 8;
  const ch = crop.h / 8;
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < 64; i++) {
    const cell = { x: crop.x + (i % 8) * cw, y: crop.y + Math.floor(i / 8) * ch, w: cw, h: ch };
    const part = overlap(cell, area);
    const value = Number.parseInt(grid.charAt(i), 16);
    if (!part || !Number.isFinite(value)) continue;
    sum += value * part.w * part.h;
    weight += part.w * part.h;
  }
  return weight > 0 ? sum / weight : null;
}

/** The kinds that carry words a reader has to read. */
const READ = new Set<BookElement['kind']>(['text', 'badge', 'stats', 'list']);

/** A shape that hides what is under it well enough for type: filled and at least half opaque. */
function scrimFill(el: BookElement): string | null {
  if (el.kind !== 'shape' || el.shape === 'line' || el.opacity < 0.5) return null;
  return el.fill;
}

/** What a text at index `i` is set on: a scrim, a picture, or the page. */
type Ground =
  | { kind: 'colour'; hex: string; label: string }
  | { kind: 'photo'; el: BookPhotoElement; info: BookPhotoInfo | undefined };

function groundOf(spread: BookSpread, i: number, box: Box, photos: readonly BookPhotoInfo[] | undefined): Ground {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  for (let j = i - 1; j >= 0; j--) {
    const under = spread.elements[j];
    if (!under || !centreIn(under.frame, cx, cy)) continue;
    const fill = scrimFill(under);
    if (fill) return { kind: 'colour', hex: fill, label: `shape ${under.id}` };
    if (under.kind === 'photo' && under.photoId != null) {
      return { kind: 'photo', el: under, info: photos?.find((p) => p.photoId === under.photoId) };
    }
  }
  const label = spread.background ? 'the page' : 'the paper';
  return { kind: 'colour', hex: spread.background ?? '#ffffff', label };
}

/** How light what the words are set on is, or null when a picture's brightness is unknown. */
function groundLuminance(ground: Ground): number | null {
  if (ground.kind === 'photo') return ground.info?.luma === undefined ? null : greyLuminance(ground.info.luma);
  const rgb = parseHex(ground.hex);
  return rgb ? luminance(rgb) : null;
}

/** The colour a reader sees the words in, or null when the element picks its own (an automatic mark). */
function inkOf(el: BookElement): { hex: string; size: number } | null {
  if (el.kind === 'text') return { hex: el.color, size: el.size };
  if (el.kind === 'badge') return el.autoColor ? null : { hex: el.color, size: 10 * el.textScale };
  if (el.kind === 'stats' || el.kind === 'list') return { hex: el.color, size: 10 * el.textScale };
  return null;
}

interface Ctx {
  spread: BookSpread;
  page: BookPageSetup;
  photos: readonly BookPhotoInfo[] | undefined;
  out: BookFinding[];
}

const add = (ctx: Ctx, f: BookFinding) => ctx.out.push({ ...f, message: f.message.slice(0, 300) });

function contrastAndBusy(ctx: Ctx): void {
  ctx.spread.elements.forEach((el, i) => {
    if (!READ.has(el.kind)) return;
    // A band, an outline or a picture in the letters is the text's own ground (book-text-findings.ts).
    if (el.kind === 'text' && bookTextHasOwnGround(el)) return;
    const ink = inkOf(el);
    const ground = groundOf(ctx.spread, i, el.frame, ctx.photos);
    if (ground.kind === 'photo') {
      const busy = bookBusyUnder(ground.el, ground.info, el.frame);
      if (busy !== null && busy >= 9) {
        add(ctx, {
          code: 'text_on_busy',
          severity: 'warn',
          elementIds: [el.id, ground.el.id],
          message: `${el.kind} ${el.id} sits on a busy part of photo ${ground.el.photoId} (${Math.round(busy)} of 15); put a scrim under it or move it to a calm area`,
        });
      }
    }
    const textRgb = ink ? parseHex(ink.hex) : null;
    const groundLum = groundLuminance(ground);
    if (!ink || !textRgb || groundLum === null) return;
    const ratio = contrastOfLuminance(luminance(textRgb), groundLum);
    const need = requiredContrast(ink.size);
    if (ratio >= need) return;
    const on = ground.kind === 'colour' ? ground.label : `photo ${ground.el.photoId}`;
    add(ctx, {
      code: 'contrast_low',
      severity: ratio < 2 ? 'severe' : 'warn',
      elementIds: [el.id],
      message: `${el.kind} ${el.id} in ${ink.hex} on ${on} has a contrast of ${ratio.toFixed(1)}:1, under the ${need}:1 type of that size needs`,
    });
  });
}

function smallText(ctx: Ctx): void {
  for (const el of ctx.spread.elements) {
    if (el.kind !== 'text' || !el.text.trim()) continue;
    const body = el.text.length > 80;
    const floor = body ? 7 : 5.5;
    if (el.size >= floor) continue;
    add(ctx, {
      code: 'small_text',
      severity: 'warn',
      elementIds: [el.id],
      message: `text ${el.id} is set at ${el.size} pt; ${body ? 'running text' : 'a caption or meta line'} reads from ${floor} pt`,
    });
  }
}

/** The page boxes of a spread: one page, or the two of a double spread. */
function pagesOf(ctx: Ctx): Box[] {
  const { pageWidth: w, pageHeight: h } = ctx.page;
  const first = { x: 0, y: 0, w, h };
  if (ctx.spread.role !== 'inner') return [first];
  return [first, { x: w, y: 0, w, h }];
}

// A drawn line is a rule however long it runs, so it never counts as content.
const isContent = (el: BookElement) => el.kind !== 'line' && (el.kind !== 'shape' || el.frame.w > 2 || el.frame.h > 2);

/** How much of a page's live area (inside the safe margin) is covered, rastered in 4 mm cells. */
function coverage(page: Box, safe: number, els: readonly BookElement[]): number {
  const live = { x: page.x + safe, y: page.y + safe, w: page.w - safe * 2, h: page.h - safe * 2 };
  const step = 4;
  let cells = 0;
  let covered = 0;
  for (let x = live.x + step / 2; x < live.x + live.w; x += step) {
    for (let y = live.y + step / 2; y < live.y + live.h; y += step) {
      cells++;
      if (els.some((e) => centreIn(e.frame, x, y))) covered++;
    }
  }
  return cells ? covered / cells : 0;
}

function crowded(ctx: Ctx): void {
  const content = ctx.spread.elements.filter(isContent);
  for (const page of pagesOf(ctx)) {
    const on = content.filter((e) => overlap(e.frame, page));
    if (on.length < 9) continue;
    const share = coverage(page, ctx.page.safe, on);
    if (share <= 0.85) continue;
    add(ctx, {
      code: 'crowded',
      severity: 'info',
      elementIds: on.slice(0, 8).map((e) => e.id),
      message: `a page holds ${on.length} elements over ${Math.round(share * 100)}% of its live area; give it room`,
    });
  }
  const words = ctx.spread.elements.filter((e) => e.kind === 'photo' || READ.has(e.kind));
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i] as BookElement;
      const b = words[j] as BookElement;
      const gap = gapBetween(a.frame, b.frame);
      if (gap === null || gap <= 0.05 || gap >= 2) continue;
      add(ctx, {
        code: 'crowded',
        severity: 'info',
        elementIds: [a.id, b.id],
        message: `${a.kind} ${a.id} and ${b.kind} ${b.id} are ${mm(gap)} mm apart; closer than 2 mm reads as touching`,
      });
      return;
    }
  }
}

/** The gap between two boxes side by side or one above the other, or null when they overlap or do not face. */
function gapBetween(a: Box, b: Box): number | null {
  const facingX = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
  const facingY = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0;
  if (facingX && facingY) return null;
  if (facingX) return Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  if (facingY) return Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return null;
}

/**
 * Edges that almost line up: within 0.5 to 3 mm of the bleed, a margin, the
 * fold or another element's edge, a near miss. An element is measured against
 * the others only, so a small one is never off its own opposite edge.
 */
function offGrid(ctx: Ctx): void {
  const { pageWidth: PW, pageHeight: H, safe, bleed } = ctx.page;
  const inner = ctx.spread.role === 'inner';
  const W = inner ? PW * 2 : PW;
  const baseX = [-bleed, 0, safe, W - safe, W, W + bleed, ...(inner ? [PW, PW - safe, PW + safe] : [])];
  const baseY = [-bleed, 0, safe, H - safe, H, H + bleed];
  // Shapes and stickers are laid freely; only the content is held to the grid.
  const content = ctx.spread.elements.filter(
    (e) => e.kind !== 'shape' && e.kind !== 'sticker' && e.kind !== 'line' && !e.rotation,
  );
  const near = (v: number, lines: number[]) => lines.some((l) => Math.abs(v - l) > 0.5 && Math.abs(v - l) < 3);
  const onLine = (v: number, lines: number[]) => lines.some((l) => Math.abs(v - l) <= 0.5);
  const misses = (edges: number[], lines: number[]) => edges.some((v) => near(v, lines) && !onLine(v, lines));
  let found = 0;
  for (const el of content) {
    if (found >= 3) return;
    const others = content.filter((o) => o !== el);
    const xs = [...baseX, ...others.flatMap((o) => [o.frame.x, o.frame.x + o.frame.w])];
    const ys = [...baseY, ...others.flatMap((o) => [o.frame.y, o.frame.y + o.frame.h])];
    const f = el.frame;
    if (!misses([f.x, f.x + f.w], xs) && !misses([f.y, f.y + f.h], ys)) continue;
    found++;
    add(ctx, {
      code: 'off_grid',
      severity: 'info',
      elementIds: [el.id],
      message: `an edge of ${el.kind} ${el.id} is a few millimetres off a margin, the fold or a neighbour; line it up or set it clearly apart`,
    });
  }
}

const SEVERITY_ORDER = { severe: 0, warn: 1, info: 2 } as const;

/** Severe first, in the order found, at most `BOOK_OP_LIMITS.findings`. */
export function sortBookFindings(list: readonly BookFinding[]): BookFinding[] {
  return list
    .map((f, i) => ({ f, i }))
    .sort((a, b) => SEVERITY_ORDER[a.f.severity] - SEVERITY_ORDER[b.f.severity] || a.i - b.i)
    .map(({ f }) => f)
    .slice(0, BOOK_OP_LIMITS.findings);
}

/** The design findings of one page, severe first. */
export function designFindings(
  spread: BookSpread,
  page: BookPageSetup,
  photos?: readonly BookPhotoInfo[],
): BookFinding[] {
  const ctx: Ctx = { spread: visibleSpread(spread), page, photos, out: [] };
  contrastAndBusy(ctx);
  smallText(ctx);
  crowded(ctx);
  offGrid(ctx);
  // Whether the page reads as designed: a flat cover, a page without a lead (book-findings-art.ts).
  for (const f of artFindings(spread, page)) add(ctx, f);
  return sortBookFindings(ctx.out);
}

/**
 * The typefaces that make a book's voice: its texts, its travel elements and
 * its page numbers when shown, leaving out the scripts and mono faces, which
 * dress a page rather than set it.
 */
function familiesOf(doc: BookDocument): string[] {
  return bookFontsUsed(doc).filter(bookFontCountsInMix).sort(compareCodeUnits);
}

/** The colours a book paints with: its type and its filled shapes, with how often each is used. */
function coloursOf(doc: BookDocument): Map<string, number> {
  const counts = new Map<string, number>();
  const count = (hex: string | null | undefined) => {
    if (hex) counts.set(hex.toLowerCase(), (counts.get(hex.toLowerCase()) ?? 0) + 1);
  };
  for (const spread of doc.spreads) {
    for (const el of spread.elements) {
      if (el.kind === 'text') count(el.color);
      if (el.kind === 'shape') count(el.fill);
    }
  }
  return counts;
}

const cm = (v: number) => Math.round(v / 10);

/** A page's arrangement as a short signature: which kinds sit where, to the nearest centimetre. */
function signatureOf(spread: BookSpread): string {
  return spread.elements.map((e) => `${e.kind}:${cm(e.frame.x)},${cm(e.frame.y)},${cm(e.frame.w)}`).join('|');
}

/**
 * How many typefaces a book may be set in before it reads as a type sampler:
 * a display face, a body face and one more for figures or a subtitle. Two was
 * the rule while the book had seven faces and no scripts, and it told every
 * lively book that set its title apart to stop. Script and mono faces do not
 * count towards it (`bookFontCountsInMix`).
 */
const MAX_BOOK_FAMILIES = 3;

/** Findings about the book as a whole: typefaces, colours, and the same page three times running. */
export function bookLevelFindings(doc: BookDocument): BookFinding[] {
  const out: BookFinding[] = [];
  const families = familiesOf(doc);
  if (families.length > MAX_BOOK_FAMILIES) {
    out.push({
      code: 'font_mix',
      severity: 'warn',
      elementIds: [],
      message: `the book is set in ${families.length} typefaces (${families.join(', ')}); keep to three: a display face, a body face and one more; scripts and mono faces do not count`,
    });
  }
  const colours = [...coloursOf(doc)].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const main = colours.slice(0, 6).map(([hex]) => hex);
  const stray = colours.slice(6).filter(([hex]) => main.every((m) => deltaE(hex, m) > 12));
  if (stray.length) {
    const named = stray.slice(0, 8).map(([hex]) => hex);
    out.push({
      code: 'palette_drift',
      severity: 'info',
      elementIds: [],
      message: `colours outside the book's own: ${named.join(', ')}`,
    });
  }
  const inner = doc.spreads.filter((s) => s.role === 'inner' && s.elements.length > 0);
  for (let i = 2; i < inner.length; i++) {
    const [a, b, c] = [inner[i - 2], inner[i - 1], inner[i]];
    if (!a || !b || !c) continue;
    const sig = signatureOf(c);
    if (signatureOf(a) !== sig || signatureOf(b) !== sig) continue;
    out.push({
      code: 'repeat_layout',
      severity: 'info',
      // Pages, not elements: the ids are in the message.
      elementIds: [],
      message: `pages ${a.id}, ${b.id} and ${c.id} are laid out the same way; vary one`,
    });
    break;
  }
  return sortBookFindings(out);
}
