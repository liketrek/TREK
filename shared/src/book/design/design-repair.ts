import { readableInk } from '../book-colour';
import { DESIGN_TEXT_HEADROOM, MIN_PRINT_DPI, photoDpi, textHeightNeeded } from '../book-findings';
import type { BookPhotoInfo } from '../book-ops-core';
import type { BookFinding } from '../book-ops.schema';
import {
  MAX_SPREAD_ELEMENTS,
  type BookElement,
  type BookFrame,
  type BookPageSetup,
  type BookShapeElement,
  type BookSpread,
  type BookTextElement,
} from '../book.schema';
import { pageFindings } from '../describe-spread';
import { cutWords } from './design-compose';
import { designGrid, type BookDesignLook } from './design-style';

/**
 * The engine checks its own pages before anyone sees them: every finding a
 * page has (book-findings.ts and book-findings-design.ts) is fixed where a
 * rule says how, at most three passes, the same way every time. What is left
 * is answered with the design, for the model to look at.
 *
 * The fixes, in order: words set smaller to their tier's floor and then cut at
 * a sentence; a photo that prints soft made smaller (never enlarged), moved
 * into the margins when it ran to the bleed; a focal point moved onto the
 * picture's detail or off the fold; a scrim put under words on a busy part of
 * a picture, or the words set in the ink that reads; empty frames taken out;
 * words pulled inside the margins and back onto their page.
 */

interface RepairCtx {
  page: BookPageSetup;
  photos: readonly BookPhotoInfo[];
  look: BookDesignLook;
  newId: (prefix: string) => string;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const MAX_PASSES = 3;
const fixable = (f: BookFinding) => f.severity !== 'info';

/** Run the repair passes on one page; the page as fixed and what is left. */
export function repairSpread(spread: BookSpread, ctx: RepairCtx): { spread: BookSpread; findings: BookFinding[] } {
  let current = spread;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const open = pageFindings(current, ctx.page, ctx.photos).filter(fixable);
    if (!open.length) break;
    const next = open.reduce((s, f) => fixOne(s, f, ctx), current);
    if (next === current) break;
    current = next;
  }
  return { spread: current, findings: pageFindings(current, ctx.page, ctx.photos) };
}

function fixOne(spread: BookSpread, f: BookFinding, ctx: RepairCtx): BookSpread {
  const el = spread.elements.find((e) => e.id === f.elementIds[0]);
  switch (f.code) {
    case 'empty_frame':
      return dropIds(spread, new Set(f.elementIds));
    case 'text_overflow':
      return el?.kind === 'text' ? replace(spread, fitText(el, ctx)) : spread;
    case 'low_dpi':
      return el?.kind === 'photo' ? replace(spread, sharper(el, ctx)) : spread;
    case 'focal_cut':
    case 'fold':
      return el ? replace(spread, onPage(el, ctx)) : spread;
    case 'text_on_busy':
    case 'contrast_low':
      return el ? readable(spread, el, ctx) : spread;
    case 'trim':
      return el && el.kind !== 'photo' && el.kind !== 'shape' ? replace(spread, inside(el, ctx)) : spread;
    case 'small_text':
      return el?.kind === 'text' ? replace(spread, { ...el, size: el.text.length > 80 ? 7.5 : 6 }) : spread;
    case 'overlap':
      return separate(spread, f, ctx);
    default:
      return spread;
  }
}

const replace = (spread: BookSpread, next: BookElement): BookSpread => ({
  ...spread,
  elements: spread.elements.map((e) => (e.id === next.id ? next : e)),
});

const dropIds = (spread: BookSpread, ids: ReadonlySet<string>): BookSpread => ({
  ...spread,
  elements: spread.elements.filter((e) => !ids.has(e.id)),
});

/**
 * A text that overflows: half a point smaller down to its floor, then its
 * words cut to what the frame holds as the engine measures a frame it sizes.
 */
function fitText(el: BookTextElement, ctx: RepairCtx): BookTextElement {
  const floor = el.text.length > 80 ? ctx.look.sizes.body * 0.9 : ctx.look.sizes.caption;
  if (el.size - 0.5 >= floor) return { ...el, size: r2(el.size - 0.5) };
  let lo = 0;
  let hi = el.text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const tried = { ...el, text: cutWords(el.text, mid) };
    if (textHeightNeeded(tried, DESIGN_TEXT_HEADROOM) <= el.frame.h) lo = mid;
    else hi = mid - 1;
  }
  const text = cutWords(el.text, lo);
  return { ...el, text: text || el.text.slice(0, 1), overridden: el.binding ? true : el.overridden };
}

/** The page an element's centre is on: its frame there, or the live area inside its margins. */
function liveOf(el: BookElement, spread: BookSpread | null, ctx: RepairCtx): BookFrame {
  const grid = designGrid(ctx.page);
  const onRight = (spread?.role ?? 'inner') === 'inner' && el.frame.x + el.frame.w / 2 >= ctx.page.pageWidth;
  const x = (onRight ? ctx.page.pageWidth : 0) + grid.margin;
  return { x, y: grid.margin, w: ctx.page.pageWidth - grid.margin * 2, h: ctx.page.pageHeight - grid.margin * 2 };
}

/** A photo that prints soft: made smaller to print at 200 dpi, inside the margins when it ran to the bleed. */
function sharper(el: Extract<BookElement, { kind: 'photo' }>, ctx: RepairCtx): BookElement {
  const info = ctx.photos.find((p) => p.photoId === el.photoId);
  const bleeding = el.frame.x < 0 || el.frame.y < 0;
  const base = bleeding ? liveOf(el, null, ctx) : el.frame;
  const dpi = photoDpi({ ...el, frame: base }, info);
  const k = dpi === null || dpi >= MIN_PRINT_DPI ? 1 : (dpi / MIN_PRINT_DPI) * 0.98;
  const w = base.w * k;
  const h = base.h * k;
  const frame = { x: r2(base.x + (base.w - w) / 2), y: r2(base.y + (base.h - h) / 2), w: r2(w), h: r2(h) };
  return { ...el, frame, rotation: 0 };
}

/** A focal point on the picture's detail when known, and never in the fold of a photo across it. */
function onPage(el: BookElement, ctx: RepairCtx): BookElement {
  if (el.kind !== 'photo') return el;
  const salient = ctx.photos.find((p) => p.photoId === el.photoId)?.salient;
  let focalX = salient?.x ?? 0.5;
  const focalY = salient?.y ?? 0.5;
  const px = el.frame.x + focalX * el.frame.w;
  if (Math.abs(px - ctx.page.pageWidth) < 14 && el.frame.w > ctx.page.pageWidth) focalX = focalX < 0.5 ? 0.36 : 0.64;
  return { ...el, focalX, focalY };
}

/** The colour behind an element's centre: a scrim or the page, or null when it is a photograph. */
function groundUnder(spread: BookSpread, el: BookElement): string | null {
  const index = spread.elements.indexOf(el);
  const cx = el.frame.x + el.frame.w / 2;
  const cy = el.frame.y + el.frame.h / 2;
  for (let j = index - 1; j >= 0; j--) {
    const under = spread.elements[j];
    if (!under) continue;
    const f = under.frame;
    if (cx < f.x || cx > f.x + f.w || cy < f.y || cy > f.y + f.h) continue;
    if (under.kind === 'shape' && under.fill && under.opacity >= 0.5 && under.shape !== 'line') return under.fill;
    if (under.kind === 'photo' && under.photoId != null) return null;
  }
  return spread.background ?? '#ffffff';
}

/** Words that do not read: a scrim under them on a photograph, else the ink that reads on what they are on. */
function readable(spread: BookSpread, el: BookElement, ctx: RepairCtx): BookSpread {
  if (el.kind !== 'text' && el.kind !== 'stats' && el.kind !== 'list' && el.kind !== 'badge') return spread;
  const ground = groundUnder(spread, el);
  if (ground) return replace(spread, { ...el, color: readableInk(ground, ctx.look.ink) } as BookElement);
  const recoloured = { ...el, color: ctx.look.onScrim } as BookElement;
  // A page already at the element cap takes no scrim: the light ink alone, and what is left is answered.
  if (spread.elements.length >= MAX_SPREAD_ELEMENTS) return replace(spread, recoloured);
  const pad = 3;
  const { x, y, w, h } = el.frame;
  const scrim: BookShapeElement = {
    id: ctx.newId('s'),
    kind: 'shape',
    frame: { x: r2(x - pad), y: r2(y - pad), w: r2(w + pad * 2), h: r2(h + pad * 2) },
    rotation: 0,
    opacity: ctx.look.scrimOpacity,
    locked: false,
    shape: 'rect',
    fill: ctx.look.scrim,
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 1.5,
  };
  const index = spread.elements.indexOf(el);
  const elements = [...spread.elements.slice(0, index), scrim, recoloured, ...spread.elements.slice(index + 1)];
  return { ...spread, elements };
}

/** Words pulled inside the margins of the page their centre is on. */
function inside(el: BookElement, ctx: RepairCtx): BookElement {
  const live = liveOf(el, null, ctx);
  const w = Math.min(el.frame.w, live.w);
  const h = Math.min(el.frame.h, live.h);
  const x = Math.min(Math.max(el.frame.x, live.x), live.x + live.w - w);
  const y = Math.min(Math.max(el.frame.y, live.y), live.y + live.h - h);
  return { ...el, frame: { x: r2(x), y: r2(y), w: r2(w), h: r2(h) } } as BookElement;
}

/** Two texts on top of each other: the later one moved under the earlier, or taken out when there is no room. */
function separate(spread: BookSpread, f: BookFinding, ctx: RepairCtx): BookSpread {
  const [a, b] = f.elementIds.map((id) => spread.elements.find((e) => e.id === id));
  if (!a || !b || f.severity !== 'severe') return spread;
  const y = a.frame.y + a.frame.h + 2;
  const live = liveOf(b, spread, ctx);
  if (y + b.frame.h > live.y + live.h) return dropIds(spread, new Set([b.id]));
  return replace(spread, { ...b, frame: { ...b.frame, y: r2(y) } } as BookElement);
}
