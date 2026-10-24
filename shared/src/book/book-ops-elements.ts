import { relayoutSpread } from './auto/auto-book';
import type { AutoEntry, AutoInput } from './auto/auto-types';
import { alignElements, arrangeElements, distributableCount, distributeElements } from './book-arrange';
import { bookElementPropsSchema, type BOOK_ELEMENT_OP_SCHEMAS, type BookNewElement } from './book-element-ops.schema';
import { withRealWeight } from './book-fonts';
import { bookGridElements, defaultBookGridBox, findBookGrid } from './book-grids';
import { regroupCopies, tidyGroups, withCopies, withoutGroup } from './book-groups';
import {
  bookBoundWords,
  failOp,
  galleryPhoto,
  journeyEntry,
  pageElement,
  roomFor,
  round2,
  unlockedElement,
  type BookOpsContext,
} from './book-ops-core';
import { bookLineStyled, bookNewLine } from './book-ops-line';
import { checkTextFillPhoto, opAddLockup } from './book-ops-lockup';
import { newStickerElement } from './book-ops-sticker';
import { withShapePaint } from './book-paint';
import type { BookPaint } from './book-paint.schema';
import { BOOK_PHOTO_LOOK_KEYS } from './book-photo-look.schema';
import { bookShapeSize } from './book-shapes-more';
import {
  bookBadgeValue,
  bookCountryMark,
  bookCountryName,
  bookEntryListItems,
  bookTravelBadge,
  bookTravelCountries,
  bookTravelList,
  bookTravelMap,
  bookTravelSize,
  bookTravelStats,
  refreshPatch,
  type BookTravelContext,
} from './book-travel';
import type {
  BookDocument,
  BookElement,
  BookFrame,
  BookPageSetup,
  BookPhotoElement,
  BookShapeElement,
  BookSpread,
  BookTextElement,
} from './book.schema';
import { withThemeLinks } from './theme/book-theme-links';
import type { BookTheme } from './theme/book-theme.schema';

import type { z } from 'zod';

/**
 * The element operations of the book engine: what `add`, `style`, `arrange`,
 * `align`, `distribute`, `lock`, `duplicate`, `fill`, `copy_from`,
 * `refresh_travel`, `add_grid` and `add_lockup` do to a page, and the `auto` layout. Called
 * from `applyBookOps` (book-ops.ts), which parses, runs a call all or nothing
 * and checks the page it hands back against the document's schema.
 *
 * Each does what the Studio's own control does: the sizes an element arrives
 * at are the panels', `fill` is the inspector's, `duplicate` offsets by 4 mm
 * like the Studio's. Where the assistant may do more than the Studio
 * (aligning and distributing a group), it is said in the operation's schema.
 */

interface ElementOpEnv {
  doc: BookDocument;
  page: BookPageSetup;
  ctx: BookOpsContext;
  newId: (prefix: string) => string;
  opIndex: number;
}

type ElementOp = z.infer<(typeof BOOK_ELEMENT_OP_SCHEMAS)[number]>;
type Op<K extends ElementOp['op']> = Extract<ElementOp, { op: K }>;

export function applyElementOp(spread: BookSpread, op: ElementOp, env: ElementOpEnv): BookSpread {
  switch (op.op) {
    case 'add':
      return opAdd(spread, op, env);
    case 'style':
      return opStyle(spread, op, env);
    case 'arrange':
      return opArrange(spread, op, env);
    case 'align':
      return opAlign(spread, op, env);
    case 'distribute':
      return opDistribute(spread, op, env);
    case 'lock':
      return opLock(spread, op, env);
    case 'duplicate':
      return opDuplicate(spread, op, env);
    case 'fill':
      return opFill(spread, op, env);
    case 'copy_from':
      return opCopyFrom(spread, op, env);
    case 'refresh_travel':
      return opRefreshTravel(spread, op, env);
    case 'add_grid':
      return opAddGrid(spread, op, env);
    case 'add_lockup':
      return opAddLockup(spread, op, env);
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

const isInner = (spread: BookSpread) => spread.role === 'inner';

/** A size centred on the page: the right-hand page of a spread, so a new element never lands in the fold. */
function centred(spread: BookSpread, page: BookPageSetup, size: { w: number; h: number }): BookFrame {
  const origin = isInner(spread) ? page.pageWidth : 0;
  return {
    x: round2(origin + (page.pageWidth - size.w) / 2),
    y: round2((page.pageHeight - size.h) / 2),
    w: round2(size.w),
    h: round2(size.h),
  };
}

const roundFrame = (f: BookFrame): BookFrame => ({ x: round2(f.x), y: round2(f.y), w: round2(f.w), h: round2(f.h) });

/** The unlocked elements an operation names, each on the page, in the order named, each once. */
function namedElements(spread: BookSpread, ids: readonly string[], env: ElementOpEnv): BookElement[] {
  return [...new Set(ids)].map((id) => unlockedElement(pageElement(spread, id, env.opIndex), env.opIndex));
}

function replaceAll(spread: BookSpread, next: readonly BookElement[]): BookSpread {
  const byId = new Map(next.map((e) => [e.id, e]));
  return { ...spread, elements: spread.elements.map((e) => byId.get(e.id) ?? e) };
}

function travelOf(env: ElementOpEnv): BookTravelContext {
  const travel = env.ctx.travel;
  if (!travel) throw failOp('travel_unavailable', "the journey's figures are not available here", env.opIndex);
  return travel;
}

function statsOf(env: ElementOpEnv) {
  const stats = travelOf(env).stats;
  if (!stats) {
    throw failOp('travel_unavailable', 'this journey has no figures yet (no stops with places)', env.opIndex);
  }
  return stats;
}

/** The look fields a kind takes, from the props schema, so `add` and `style` set exactly what `style` may set. */
const PHOTO_LOOK_KEYS = new Set<string>(BOOK_PHOTO_LOOK_KEYS);
const PROP_KEYS = new Map(bookElementPropsSchema.options.map((o) => [o.shape.kind.value, lookKeys(o.shape)]));

function lookKeys(shape: object): string[] {
  return Object.keys(shape).filter((k) => k !== 'kind');
}

const MM_KEYS: ReadonlySet<string> = new Set(['radius', 'strokeWidth', 'edgeSize']);

/**
 * The element with the given look fields set; millimetre fields rounded as the
 * document stores them, the weight moved onto one its family has, as the
 * Studio's weight control does, and its theme links kept in step (book-theme-links.ts).
 */
function withProps(el: BookElement, props: Record<string, unknown>, theme?: BookTheme): BookElement {
  if (el.kind === 'line') return bookLineStyled(el, props);
  const keys = PROP_KEYS.get(el.kind) ?? [];
  const next: Record<string, unknown> = { ...el };
  for (const key of keys) {
    const value = props[key];
    if (value === undefined || key === 'paint') continue;
    // A photo look part set to null is turned off, which leaves it out of the document.
    if (value === null && PHOTO_LOOK_KEYS.has(key)) {
      delete next[key];
      continue;
    }
    next[key] = MM_KEYS.has(key) && typeof value === 'number' ? round2(value) : value;
  }
  const made = withRealWeight(next as unknown as BookElement);
  return withThemeLinks(made.kind === 'shape' ? withPaintProps(made, props) : made, props, theme);
}

/**
 * An element restyled exactly as the `style` operation restyles it, for the
 * Studio's paste style: one restyle, so a pasted look and the assistant's
 * keep a page's theme links, a shape's paint and a line's course alike.
 */
export const bookElementStyled = withProps;

/**
 * A shape's paint, kept in step with its fill: a paint given is written
 * through withShapePaint, and a plain fill or fade given without one replaces
 * the paint the shape had, since the newer instruction is the one meant.
 */
function withPaintProps(el: BookShapeElement, props: Record<string, unknown>): BookShapeElement {
  const paint = props.paint as BookPaint | null | undefined;
  if (paint !== undefined) return withShapePaint(el, paint);
  if (props.fill === undefined && props.gradient === undefined) return el;
  const { paint: _replaced, ...rest } = el;
  return rest;
}

// ── add ────────────────────────────────────────────────────────────────────

function opAdd(spread: BookSpread, op: Op<'add'>, env: ElementOpEnv): BookSpread {
  roomFor(spread, 1, env.opIndex);
  // An id of the caller's own lets the operations after this one style or group the element it makes.
  if (op.id !== undefined && [...spread.elements, ...spread.parked].some((e) => e.id === op.id)) {
    throw failOp('id_in_use', `${op.id} is already on this page; choose another id`, env.opIndex, op.id);
  }
  const blank = created(spread, op.element, op.frame ? roundFrame(op.frame) : null, env);
  const made = withProps(blank, lookOf(op.element), env.doc.theme);
  checkTextFillPhoto(made, env);
  const turned = op.rotation !== undefined ? { ...made, rotation: op.rotation } : made;
  const el = op.id !== undefined ? { ...turned, id: op.id } : turned;
  const parked =
    el.kind === 'photo' && el.photoId != null
      ? spread.parked.filter((p) => !(p.kind === 'photo' && p.photoId === el.photoId))
      : spread.parked;
  return { ...spread, elements: [...spread.elements, el], parked };
}

/** The look fields of a new element. A shape's name is `created`'s: a rule arrives as a hairline rect, never `line`. A sticker's colours too. */
function lookOf(spec: BookNewElement): Record<string, unknown> {
  const look: Record<string, unknown> = { ...spec };
  if (spec.kind === 'shape') delete look.shape;
  // A sticker's colours are cut to its slots when it is made (book-ops-sticker.ts).
  if (spec.kind === 'sticker') delete look.colors;
  return look;
}

const BASE = { rotation: 0, opacity: 1, locked: false };

function created(spread: BookSpread, spec: BookNewElement, frame: BookFrame | null, env: ElementOpEnv): BookElement {
  const at = (size: { w: number; h: number }) => frame ?? centred(spread, env.page, size);
  switch (spec.kind) {
    case 'photo':
      return newPhotoFrame(spec, at, env);
    case 'text':
      return newText(spec, at, env);
    case 'shape':
      return newShape(spec, frame, spread, env);
    case 'line':
      return bookNewLine(spec, { id: env.newId('l'), frame, inner: isInner(spread), page: env.page });
    case 'icon': {
      const side = Math.min(env.page.pageWidth, env.page.pageHeight) * 0.18;
      return {
        ...BASE,
        id: env.newId('i'),
        kind: 'icon',
        frame: at({ w: side, h: side }),
        name: spec.name,
        color: '#111827',
        lineWidth: 2,
      };
    }
    case 'sticker':
      return newStickerElement(spec, at, env);
    default:
      return newTravel(spec, at, env);
  }
}

type At = (size: { w: number; h: number }) => BookFrame;

function newPhotoFrame(spec: Extract<BookNewElement, { kind: 'photo' }>, at: At, env: ElementOpEnv): BookPhotoElement {
  if (spec.photoId !== undefined) galleryPhoto(spec.photoId, env.ctx, env.opIndex);
  const side = Math.min(env.page.pageWidth, env.page.pageHeight) * 0.45;
  // A Polaroid is taller than it is wide, because of the chin.
  const frame = at({ w: side, h: spec.frameStyle === 'polaroid' ? side * 1.16 : side });
  return {
    ...BASE,
    id: env.newId('p'),
    kind: 'photo',
    frame,
    photoId: spec.photoId ?? null,
    fit: 'cover',
    focalX: 0.5,
    focalY: 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: 'none',
  };
}

/** The Studio's text presets: size, weight and the colour a caption and a quotation mark take. */
const TEXT_PRESETS = {
  heading: { size: 30, weight: 700 },
  subheading: { size: 16, weight: 600 },
  body: { size: 10, weight: 400 },
  caption: { size: 7.5, weight: 600, tracking: 0.14, color: '#8a8578' },
  quote: { size: 46, weight: 700, color: '#c9c2b4', leading: 0.9 },
} as const satisfies Record<string, Partial<BookTextElement>>;

function newText(spec: Extract<BookNewElement, { kind: 'text' }>, at: At, env: ElementOpEnv): BookTextElement {
  const binding = spec.binding ?? null;
  if (binding?.photoId !== undefined) galleryPhoto(binding.photoId, env.ctx, env.opIndex);
  if (binding?.entryId !== undefined) journeyEntry(binding.entryId, env.ctx, env.opIndex);
  const read = binding ? bookBoundWords(binding, env.ctx) : undefined;
  const words = spec.text ?? read;
  if (words === undefined || !words.trim()) {
    throw failOp('text_required', 'give the words for the new text; its binding cannot be read here', env.opIndex);
  }
  const preset: Partial<BookTextElement> = TEXT_PRESETS[spec.preset ?? 'body'];
  const size = preset.size ?? 10;
  return {
    ...BASE,
    id: env.newId('t'),
    kind: 'text',
    frame: at({ w: env.page.pageWidth * 0.7, h: size * 0.5 + 8 }),
    text: words,
    font: 'sans',
    size,
    weight: preset.weight ?? 400,
    italic: false,
    align: 'left',
    leading: preset.leading ?? (size > 16 ? 1.1 : 1.5),
    tracking: preset.tracking ?? (size > 16 ? -0.02 : 0),
    color: preset.color ?? '#1a1a1a',
    binding,
    overridden: binding !== null && spec.text !== undefined && read !== spec.text,
  };
}

const WIDE_SHAPES: readonly string[] = ['ticket', 'wave', 'arrow-right', 'arrow-left', 'arrow-both', 'capsule'];
const TALL_SHAPES: readonly string[] = ['pin', 'drop', 'arrow-up', 'arrow-down'];

/** Placed at a size that suits the shape: a banner wide, a pin tall, a rule a hairline across half a page. */
function newShape(
  spec: Extract<BookNewElement, { kind: 'shape' }>,
  frame: BookFrame | null,
  spread: BookSpread,
  env: ElementOpEnv,
): BookElement {
  const s = spec.shape;
  const side = Math.min(env.page.pageWidth, env.page.pageHeight) * 0.3;
  const wide = s.startsWith('banner') || WIDE_SHAPES.includes(s);
  const tall = TALL_SHAPES.includes(s);
  const rule = s === 'line';
  const size = rule
    ? { w: env.page.pageWidth * 0.5, h: 0.5 }
    : (bookShapeSize(s, side) ?? { w: wide ? side * 1.7 : side, h: tall ? side * 1.35 : wide ? side * 0.55 : side });
  return {
    ...BASE,
    id: env.newId('s'),
    kind: 'shape',
    frame: frame ?? centred(spread, env.page, size),
    // A rule is a hairline box rather than its own element type, as in the Studio.
    shape: rule ? 'rect' : s,
    fill: '#141414',
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 0,
  };
}

type TravelSpec = Extract<BookNewElement, { kind: 'map' | 'stats' | 'countries' | 'badge' | 'list' }>;

function newTravel(spec: TravelSpec, at: At, env: ElementOpEnv): BookElement {
  const id = env.newId(spec.kind === 'stats' ? 'st' : spec.kind.slice(0, 2));
  const page = env.page;
  switch (spec.kind) {
    case 'map': {
      const frame = at(bookTravelSize('map', page));
      const el = bookTravelMap(travelOf(env), statsOf(env), { id, frame, scope: spec.scope, source: spec.source });
      if (el.points.length === 0) {
        throw failOp('travel_unavailable', 'no stops of the journey fall in that scope', env.opIndex);
      }
      return el;
    }
    case 'stats':
      return bookTravelStats(statsOf(env), { id, frame: at(bookTravelSize('stats', page)), metrics: spec.metrics });
    case 'countries': {
      const travel = travelOf(env);
      const el = bookTravelCountries(travel, { id, frame: at(bookTravelSize('countries', page)), codes: spec.codes });
      if (el.codes.length === 0) {
        throw failOp('travel_unavailable', 'the journey has no countries to show', env.opIndex);
      }
      return el;
    }
    case 'badge':
      return newBadge(spec, id, at, env);
    case 'list':
      return newList(spec, id, at, env);
  }
}

/** The journey's figures when an entry is named (an entry needs them to be found), else whatever is known. */
const travelFor = (entryId: number | undefined, env: ElementOpEnv) =>
  entryId !== undefined ? travelOf(env) : env.ctx.travel;

function newBadge(spec: Extract<TravelSpec, { kind: 'badge' }>, id: string, at: At, env: ElementOpEnv): BookElement {
  const travel = travelFor(spec.entryId, env);
  const entry = spec.entryId !== undefined ? (travel?.entries.find((e) => e.id === spec.entryId) ?? null) : null;
  if (spec.entryId !== undefined && !entry) {
    throw failOp('entry_not_found', `entry ${spec.entryId} is not in this journey`, env.opIndex);
  }
  const resolved = travel ? badgeValue(spec, travel, entry) : null;
  const ownCode = spec.variant === 'mood' ? entry?.mood : spec.variant === 'weather' ? entry?.weather : undefined;
  const text = spec.text ?? resolved?.text;
  if (text === undefined || (!text && !resolved)) {
    const why = travel ? 'nothing in the journey says what it would show' : "the journey's figures are not available";
    throw failOp('text_required', `give the words for the ${spec.variant} mark; ${why}`, env.opIndex);
  }
  const value = {
    text,
    sub: spec.sub ?? resolved?.sub ?? '',
    code: spec.code ?? ownCode ?? resolved?.code ?? null,
  };
  const frame = at(bookTravelSize('badge', env.page, { variant: spec.variant }));
  return bookTravelBadge({ id, frame, variant: spec.variant, value });
}

/**
 * The words the journey gives a mark. A flag or country mark asked for by its
 * own code is labelled with that country, its name where the mark's rule puts
 * it (`bookCountryMark`); without a code it shows the entry's country or the
 * journey's first.
 */
function badgeValue(spec: Extract<TravelSpec, { kind: 'badge' }>, travel: BookTravelContext, entry: AutoEntry | null) {
  const { variant, code } = spec;
  if (code && (variant === 'flag' || variant === 'country')) {
    return bookCountryMark(variant, code, bookCountryName(code, travel.locale, travel.stats));
  }
  return bookBadgeValue(travel, variant, entry);
}

function newList(spec: Extract<TravelSpec, { kind: 'list' }>, id: string, at: At, env: ElementOpEnv): BookElement {
  const travel = travelFor(spec.entryId, env);
  let items = spec.items ?? [];
  if (spec.entryId !== undefined) {
    const entry = travel?.entries.find((e) => e.id === spec.entryId);
    if (!entry) throw failOp('entry_not_found', `entry ${spec.entryId} is not in this journey`, env.opIndex);
    items = bookEntryListItems(entry);
    if (!items.length) {
      throw failOp('text_required', `entry ${spec.entryId} has no pros or cons; give the items`, env.opIndex);
    }
  }
  const labels = { pros: travel?.labels.pros ?? '', cons: travel?.labels.cons ?? '' };
  const rows = Math.max(items.filter((i) => i.tone === 'pro').length, items.filter((i) => i.tone !== 'pro').length);
  const frame = at(bookTravelSize('list', env.page, { rows }));
  return bookTravelList(labels, { id, frame, items });
}

// ── style, lock ────────────────────────────────────────────────────────────

function opStyle(spread: BookSpread, op: Op<'style'>, env: ElementOpEnv): BookSpread {
  const el = unlockedElement(pageElement(spread, op.elementId, env.opIndex), env.opIndex);
  if (op.set.kind !== el.kind) {
    throw failOp('wrong_kind', `${el.id} is a ${el.kind}; set.kind says ${op.set.kind}`, env.opIndex, el.id);
  }
  const styled = withProps(el, op.set, env.doc.theme);
  // Only a fill this style sets is checked: a text whose fill photo left the gallery can still be restyled.
  if (op.set.kind === 'text' && op.set.fillPaint !== undefined) checkTextFillPhoto(styled, env);
  return replaceAll(spread, [styled]);
}

function opLock(spread: BookSpread, op: Op<'lock'>, env: ElementOpEnv): BookSpread {
  const els = [...new Set(op.elementIds)].map((id) => pageElement(spread, id, env.opIndex));
  return replaceAll(
    spread,
    els.map((e) => ({ ...e, locked: op.locked })),
  );
}

// ── arrange, align, distribute (book-arrange.ts) ───────────────────────────

/** A frame in millimetres, as the book types it, so a zod-inferred `el.frame` passes in every compile mode. */
type Box = BookFrame;

function opArrange(spread: BookSpread, op: Op<'arrange'>, env: ElementOpEnv): BookSpread {
  const chosen = namedElements(spread, op.elementIds, env).map((e) => e.id);
  return arrangeElements(spread, chosen, op.to);
}

function opAlign(spread: BookSpread, op: Op<'align'>, env: ElementOpEnv): BookSpread {
  return alignElements(spread, env.page, namedElements(spread, op.elementIds, env), op.edge, op.to);
}

function opDistribute(spread: BookSpread, op: Op<'distribute'>, env: ElementOpEnv): BookSpread {
  const els = namedElements(spread, op.elementIds, env);
  if (distributableCount(spread, els) < 3) {
    throw failOp('not_enough_elements', 'distribute needs three different elements or groups', env.opIndex);
  }
  return distributeElements(spread, els, op.axis, op.gap);
}

// ── duplicate, fill, copy_from ─────────────────────────────────────────────

const prefixOf = (el: BookElement) => el.kind.charAt(0);

function opDuplicate(spread: BookSpread, op: Op<'duplicate'>, env: ElementOpEnv): BookSpread {
  const els = [...new Set(op.elementIds)].map((id) => pageElement(spread, id, env.opIndex));
  roomFor(spread, els.length, env.opIndex);
  const dx = op.dx ?? 4;
  const dy = op.dy ?? 4;
  const copies = els.map((e) => {
    const frame = { ...e.frame, x: round2(e.frame.x + dx), y: round2(e.frame.y + dy) };
    return { ...e, id: env.newId(prefixOf(e)), frame } as BookElement;
  });
  return withCopies(spread, regroupCopies(copies, spread, env.newId));
}

/** The inspector's fill: the photo to the bleed of the page its centre is on, or of the spread, at the back. */
function opFill(spread: BookSpread, op: Op<'fill'>, env: ElementOpEnv): BookSpread {
  const el = unlockedElement(pageElement(spread, op.elementId, env.opIndex), env.opIndex);
  if (el.kind !== 'photo') {
    throw failOp('wrong_kind', `${el.id} is a ${el.kind}; fill takes a photo`, env.opIndex, el.id);
  }
  const { bleed, pageWidth, pageHeight } = env.page;
  const onRight = isInner(spread) && op.scope === 'page' && el.frame.x + el.frame.w / 2 >= pageWidth;
  const spanning = op.scope === 'spread' && isInner(spread);
  const frame = {
    x: onRight ? pageWidth - bleed : -bleed,
    y: -bleed,
    w: (spanning ? 2 : 1) * pageWidth + 2 * bleed,
    h: pageHeight + 2 * bleed,
  };
  // A picture that is the page is nobody's lockup: it leaves its group.
  const filled: BookElement = { ...withoutGroup(el), frame, rotation: 0, fit: 'cover' };
  return tidyGroups({ ...spread, elements: [filled, ...spread.elements.filter((e) => e.id !== el.id)] });
}

/** Which page of its spread an element is on: the left (or only) page is 0, the right one starts at the fold. */
const pageOrigin = (spread: BookSpread, page: BookPageSetup, f: Box) =>
  isInner(spread) && f.x + f.w / 2 >= page.pageWidth ? page.pageWidth : 0;

function opCopyFrom(spread: BookSpread, op: Op<'copy_from'>, env: ElementOpEnv): BookSpread {
  const source = env.doc.spreads.find((s) => s.id === op.spreadId);
  if (!source) throw failOp('spread_not_found', `no page ${op.spreadId}`, env.opIndex);
  const els = [...new Set(op.elementIds)].map((id) => pageElement(source, id, env.opIndex));
  roomFor(spread, els.length, env.opIndex);
  const sameKind = isInner(source) === isInner(spread);
  const target = isInner(spread) ? env.page.pageWidth : 0;
  const copies = els.map((e) => {
    if (e.kind === 'photo' && e.photoId != null) galleryPhoto(e.photoId, env.ctx, env.opIndex);
    const x = sameKind ? e.frame.x : e.frame.x - pageOrigin(source, env.page, e.frame) + target;
    return { ...e, id: env.newId(prefixOf(e)), frame: { ...e.frame, x: round2(x) } } as BookElement;
  });
  return withCopies(spread, regroupCopies(copies, source, env.newId));
}

// ── refresh_travel, add_grid ───────────────────────────────────────────────

const carriesFigures = (el: BookElement) => el.kind === 'stats' || el.kind === 'countries' || el.kind === 'map';

function refreshTargets(spread: BookSpread, ids: readonly string[] | undefined, env: ElementOpEnv): BookElement[] {
  if (!ids) return spread.elements.filter((el) => carriesFigures(el) && !el.locked);
  const named = namedElements(spread, ids, env);
  const other = named.find((el) => !carriesFigures(el));
  if (other) {
    throw failOp('wrong_kind', `${other.id} is a ${other.kind}; it carries no journey figures`, env.opIndex, other.id);
  }
  return named;
}

function refreshed(el: BookElement, patch: Partial<BookElement> | null): BookElement {
  return { ...el, ...patch } as BookElement;
}

function opRefreshTravel(spread: BookSpread, op: Op<'refresh_travel'>, env: ElementOpEnv): BookSpread {
  const stats = statsOf(env);
  const next = refreshTargets(spread, op.elementIds, env).map((el) => refreshed(el, refreshPatch(el, stats)));
  return replaceAll(spread, next);
}

function opAddGrid(spread: BookSpread, op: Op<'add_grid'>, env: ElementOpEnv): BookSpread {
  const grid = findBookGrid(op.grid);
  if (!grid) throw failOp('layout_not_found', `no grid ${op.grid}`, env.opIndex);
  const box = op.box ?? defaultBookGridBox(env.page, !isInner(spread));
  const cells = bookGridElements(grid, box).map((c) => ({ ...c, id: env.newId('p'), frame: roundFrame(c.frame) }));
  roomFor(spread, cells.length, env.opIndex);
  return { ...spread, elements: [...spread.elements, ...cells] };
}

// ── layout auto ────────────────────────────────────────────────────────────

/**
 * The Studio's "lay this page out again": rebuilt from the entry the page was
 * made from, with the journey's figures. The page keeps its id and what it had
 * parked; the caller keeps locked elements where they were.
 */
export function autoRelayout(spread: BookSpread, env: ElementOpEnv): BookSpread {
  const travel = travelOf(env);
  if (spread.entryId == null || !isInner(spread)) {
    throw failOp('layout_not_found', 'this page was not made from an entry; auto layout needs one', env.opIndex);
  }
  if (!travel.entries.some((e) => e.id === spread.entryId)) {
    throw failOp('entry_not_found', `entry ${spread.entryId} is not in this journey`, env.opIndex);
  }
  const journey = env.ctx.journey;
  const input: AutoInput = {
    locale: travel.locale,
    title: journey?.title ?? env.doc.title,
    subtitle: journey?.subtitle ?? null,
    coverPhotoId: journey?.coverPhotoId ?? null,
    entries: [...travel.entries],
    page: env.page,
    stats: travel.stats,
    stationsLabel: travel.labels.stations,
    dayLabel: travel.labels.day,
    path: travel.path,
    summaryLabel: travel.labels.summary,
    countriesLabel: travel.labels.countries,
    newId: env.newId,
  };
  const next = relayoutSpread(spread, input);
  if (!next) throw failOp('layout_not_found', 'this page cannot be laid out again from its entry', env.opIndex);
  return { ...next, parked: spread.parked };
}
