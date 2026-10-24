import { withRealWeight } from './book-fonts';
import { bookGridElements, defaultBookGridBox, findBookGrid, type BookGridDef } from './book-grids';
import { tidyGroups } from './book-groups';
import { bookElementId } from './book-ids';
import { layoutAroundLocks } from './book-layout-locks';
import { BOOK_TEXT_STYLES, applyBookTemplate, classifyBookTexts, findBookTemplate } from './book-layouts';
import {
  bookBoundWords,
  caught,
  checkedSpread,
  createdIds,
  droppedIds,
  failOp,
  galleryPhoto,
  invalidOp,
  journeyEntry,
  pageElement,
  roomFor,
  round2,
  unlockedElement,
  type BookEditResult,
  type BookOpsContext,
  type BookPhotoInfo,
} from './book-ops-core';
import { applyElementOp, autoRelayout } from './book-ops-elements';
import { applyGroupOp, isGroupOp } from './book-ops-groups';
import { BOOK_OP_LIMITS, bookPageOpSchema, type BookPageOp } from './book-ops.schema';
import { withSpreadPaintByHand } from './book-paint';
import { applySavedBookLayout, bookLayoutRole } from './book-saved-layouts';
import { fitSpreadTexts } from './book-text-fit';
import {
  MAX_SPREAD_ELEMENTS,
  type BookDocument,
  type BookElement,
  type BookPageSetup,
  type BookPhotoElement,
  type BookSpread,
  type BookTextElement,
} from './book.schema';
import { findDecoratedTemplate } from './templates/template-catalogue';
import { opDecoratedLayout } from './templates/template-op';

import { z } from 'zod';

/**
 * The one edit engine for a book page.
 *
 * Pure: a document and a list of operations in, a new document or a typed
 * refusal out. The server's book tools write with it, a chat card draws its
 * "after" with it, the Studio previews with it, so a change means the same
 * thing in all three. Nothing here throws to the caller; a refusal names the
 * operation that caused it, and nothing of a refused call is applied.
 *
 * Two rules hold for every operation:
 * - a locked element refuses any operation that would change it (a layout
 *   leaves it where it is, in its place in the paint order);
 * - the cover, first, last and back pages cannot be moved or deleted
 *   (`canEditSpread`); their contents can be edited like any page's.
 */

interface Env {
  doc: BookDocument;
  page: BookPageSetup;
  ctx: BookOpsContext;
  newId: (prefix: string) => string;
  opIndex: number;
}

const opsSchema = z.array(bookPageOpSchema).min(1).max(BOOK_OP_LIMITS.opsPerCall);

/**
 * Apply up to twenty operations to one page, in order, all or nothing.
 *
 * `edit` is the `edit_book_page` arguments: the page by id and its operations,
 * which are parsed here again so a caller holding unchecked data gets a
 * refusal rather than a broken book.
 */
export function applyBookOps(
  doc: BookDocument,
  edit: { spreadId: string; ops: readonly unknown[] },
  ctx: BookOpsContext = {},
): BookEditResult {
  const parsed = opsSchema.safeParse(edit.ops);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, 0) };
  const index = doc.spreads.findIndex((s) => s.id === edit.spreadId);
  const original = doc.spreads[index];
  if (!original) {
    return { ok: false, error: { code: 'spread_not_found', message: `no page ${edit.spreadId}`, opIndex: null } };
  }
  return caught(() => {
    const env: Env = { doc, page: doc.page, ctx, newId: ctx.newId ?? bookElementId, opIndex: 0 };
    let spread = original;
    parsed.data.forEach((op, i) => {
      env.opIndex = i;
      spread = applyOne(spread, op, env);
    });
    // A removal or a layout can leave a group with one member: it goes, with its name.
    spread = tidyGroups(spread);
    // A text set to fit its frame is solved once the page's operations are done (book-text-fit.ts).
    spread = fitSpreadTexts(spread, original);
    checkedSpread(spread, null);
    const spreads = doc.spreads.slice();
    spreads[index] = spread;
    return {
      ok: true,
      doc: { ...doc, spreads },
      spreadIds: [spread.id],
      created: createdIds([original], [spread]),
      dropped: droppedIds([original], [spread]),
    };
  });
}

function applyOne(spread: BookSpread, op: BookPageOp, env: Env): BookSpread {
  switch (op.op) {
    case 'layout':
      return opLayout(spread, op, env);
    case 'place_photo':
      return opPlacePhoto(spread, op, env);
    case 'photo_look':
      return opPhotoLook(spread, op, env);
    case 'swap_photos':
      return opSwapPhotos(spread, op, env);
    case 'text':
      return opText(spread, op, env);
    case 'caption':
      return opCaption(spread, op, env);
    case 'frame':
      return opFrame(spread, op, env);
    case 'remove':
      return opRemove(spread, op, env);
    case 'background':
      // A colour set by hand stops following the theme's paper, as in the Studio.
      return withSpreadPaintByHand(
        spread,
        op.paint !== undefined ? op.paint : op.color ? { type: 'solid', color: op.color } : null,
      );
    default:
      return isGroupOp(op) ? applyGroupOp(spread, op, env) : applyElementOp(spread, op, env);
  }
}

type Op<K extends BookPageOp['op']> = Extract<BookPageOp, { op: K }>;

// ── Lookups ────────────────────────────────────────────────────────────────

// The refusals' words live once, in book-ops-core, for the page ops and the element ops alike.
const element = (spread: BookSpread, id: string, env: Env): BookElement => pageElement(spread, id, env.opIndex);

const unlocked = <E extends BookElement>(el: E, env: Env): E => unlockedElement(el, env.opIndex);

function photoEl(spread: BookSpread, id: string, env: Env): BookPhotoElement {
  const el = element(spread, id, env);
  if (el.kind !== 'photo') throw failOp('wrong_kind', `${id} is a ${el.kind}, not a photo frame`, env.opIndex, id);
  return el;
}

function textEl(spread: BookSpread, id: string, env: Env): BookTextElement {
  const el = element(spread, id, env);
  if (el.kind !== 'text') throw failOp('wrong_kind', `${id} is a ${el.kind}, not a text`, env.opIndex, id);
  return el;
}

const replaceEl = (spread: BookSpread, next: BookElement): BookSpread => ({
  ...spread,
  elements: spread.elements.map((e) => (e.id === next.id ? next : e)),
});

const withRoom = (spread: BookSpread, add: number, env: Env): void => roomFor(spread, add, env.opIndex);

const spreadWidth = (spread: BookSpread, page: BookPageSetup) => page.pageWidth * (spread.role === 'inner' ? 2 : 1);

// ── layout ─────────────────────────────────────────────────────────────────

function opLayout(spread: BookSpread, op: Op<'layout'>, env: Env): BookSpread {
  // A locked element is left where it is, and keeps its place in the paint
  // order; the layout arranges everything else, as in the Studio.
  const laid = layoutAroundLocks(spread, (free) => layoutFree(free, op, env));
  if (!laid) {
    throw failOp('too_many_elements', `the layout and the locked elements exceed ${MAX_SPREAD_ELEMENTS}`, env.opIndex);
  }
  return laid;
}

function layoutFree(spread: BookSpread, op: Op<'layout'>, env: Env): BookSpread {
  const single = spread.role !== 'inner';
  if (op.template !== undefined) {
    const decorated = findDecoratedTemplate(op.template);
    if (decorated) return opDecoratedLayout(spread, decorated, env);
    const tpl = findBookTemplate(op.template);
    if (!tpl) throw failOp('layout_not_found', `no layout ${op.template}`, env.opIndex);
    if ((tpl.role === 'single') !== single) {
      throw failOp(
        'layout_role',
        `${tpl.id} is a ${tpl.role === 'single' ? 'single-page (cover) layout' : 'double-spread layout'}; this page is ${single ? 'a single page' : 'a double spread'}`,
        env.opIndex,
      );
    }
    return applyBookTemplate(spread, tpl, env.page);
  }
  if (op.grid !== undefined) {
    const grid = findBookGrid(op.grid);
    if (!grid) throw failOp('layout_not_found', `no grid ${op.grid}`, env.opIndex);
    return applyGridLayout(spread, grid, env.page);
  }
  if (op.auto) return autoRelayout(spread, env);
  const layout = (env.doc.layouts ?? []).find((l) => l.id === op.saved || l.name === op.saved);
  if (!layout) throw failOp('layout_not_found', `this book keeps no layout ${op.saved}`, env.opIndex);
  if (layout.role !== bookLayoutRole(spread)) {
    throw failOp(
      'layout_role',
      `layout ${layout.name} is for ${layout.role === 'inner' ? 'a double spread' : 'a single page'}`,
      env.opIndex,
    );
  }
  return applySavedBookLayout(spread, layout, env.page);
}

/**
 * Re-pour the page's photos into a grid over its safe area.
 *
 * Not the Studio's grid button, which only adds empty grid frames on top of
 * the page for a person to fill by hand: the assistant cannot drag, so a grid
 * here is a layout like any other. Every photo of the page, placed or parked,
 * goes into the grid's cells in order, keeping its look; the old frames go,
 * empty ones included, and photos the grid has no cell for are parked. Words,
 * shapes and travel elements stay where they are, the grid going behind them
 * where the first photo was in the paint order. `listBookLayouts` says the
 * same, so a model reads it before it picks one.
 */
function applyGridLayout(spread: BookSpread, grid: BookGridDef, page: BookPageSetup): BookSpread {
  const cells = bookGridElements(grid, defaultBookGridBox(page, spread.role !== 'inner'));
  const photos = [...spread.elements, ...spread.parked].filter(
    (e): e is BookPhotoElement => e.kind === 'photo' && e.photoId != null,
  );
  const filled = cells.map((cell, i) => {
    const src = photos[i];
    return src && cell.kind === 'photo'
      ? ({
          ...cell,
          photoId: src.photoId,
          fit: src.fit,
          focalX: src.focalX,
          focalY: src.focalY,
          radius: src.radius,
          filter: src.filter,
          mask: src.mask,
          frameStyle: src.frameStyle,
        } as BookElement)
      : cell;
  });
  const firstPhoto = spread.elements.findIndex((e) => e.kind === 'photo');
  const rest = spread.elements.filter((e) => e.kind !== 'photo');
  const at = firstPhoto < 0 ? 0 : spread.elements.slice(0, firstPhoto).filter((e) => e.kind !== 'photo').length;
  const parked = [...photos.slice(cells.length), ...spread.parked.filter((e) => e.kind !== 'photo')].slice(
    0,
    MAX_SPREAD_ELEMENTS,
  );
  return { ...spread, elements: [...rest.slice(0, at), ...filled, ...rest.slice(at)], parked };
}

// ── photos ─────────────────────────────────────────────────────────────────

function opPlacePhoto(spread: BookSpread, op: Op<'place_photo'>, env: Env): BookSpread {
  const info = galleryPhoto(op.photoId, env.ctx, env.opIndex);
  // The picture is on the page now, so a parked copy of it is not waiting any more.
  const parked = spread.parked.filter((e) => !(e.kind === 'photo' && e.photoId === op.photoId));
  if (op.target === 'new') {
    withRoom(spread, 1, env);
    const el = newPhoto(env.newId('p'), newPhotoFrame(spread, env.page, info), op);
    return { ...spread, elements: [...spread.elements, el], parked };
  }
  const target =
    'elementId' in op.target ? photoEl(spread, op.target.elementId, env) : photoInSlot(spread, op.target.slot, env);
  unlocked(target, env);
  // A new picture brings no focal point of its own: the old one was for the old picture.
  const same = target.photoId === op.photoId;
  return replaceEl(
    { ...spread, parked },
    {
      ...target,
      photoId: op.photoId,
      fit: op.fit ?? target.fit,
      focalX: op.focalX ?? (same ? target.focalX : 0.5),
      focalY: op.focalY ?? (same ? target.focalY : 0.5),
    },
  );
}

function photoInSlot(spread: BookSpread, slot: number, env: Env): BookPhotoElement {
  const frames = spread.elements.filter((e): e is BookPhotoElement => e.kind === 'photo');
  const el = frames[slot];
  if (!el) {
    throw failOp('slot_not_found', `the page has ${frames.length} photo frames; slot ${slot} is not one`, env.opIndex);
  }
  return el;
}

function newPhoto(id: string, frame: BookElement['frame'], op: Op<'place_photo'>): BookPhotoElement {
  return {
    id,
    kind: 'photo',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    photoId: op.photoId,
    fit: op.fit ?? 'cover',
    focalX: op.focalX ?? 0.5,
    focalY: op.focalY ?? 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: 'none',
  };
}

/**
 * Where a new frame goes: half the short side of a page, in the photo's own
 * proportions when they are known, centred on the page (the right-hand page of
 * a spread, so it never lands in the fold).
 */
function newPhotoFrame(spread: BookSpread, page: BookPageSetup, info: BookPhotoInfo | undefined): BookElement['frame'] {
  const side = Math.min(page.pageWidth, page.pageHeight) * 0.5;
  const ratio = info?.width && info.height ? info.width / info.height : 1 / 0.72;
  const w = ratio >= 1 ? side : side * ratio;
  const h = ratio >= 1 ? side / ratio : side;
  const origin = spread.role === 'inner' ? page.pageWidth : 0;
  return {
    x: round2(origin + (page.pageWidth - w) / 2),
    y: round2((page.pageHeight - h) / 2),
    w: round2(w),
    h: round2(h),
  };
}

function opPhotoLook(spread: BookSpread, op: Op<'photo_look'>, env: Env): BookSpread {
  const el = unlocked(photoEl(spread, op.elementId, env), env);
  return replaceEl(spread, {
    ...el,
    ...(op.fit !== undefined ? { fit: op.fit } : {}),
    ...(op.focalX !== undefined ? { focalX: op.focalX } : {}),
    ...(op.focalY !== undefined ? { focalY: op.focalY } : {}),
    ...(op.mask !== undefined ? { mask: op.mask } : {}),
    ...(op.frameStyle !== undefined ? { frameStyle: op.frameStyle } : {}),
    ...(op.filter !== undefined ? { filter: op.filter } : {}),
    ...(op.radius !== undefined ? { radius: round2(op.radius) } : {}),
  });
}

/** The caption texts of a picture on this page: text bound to its caption. */
const isCaptionOf = (el: BookElement, photoId: number | null): el is BookTextElement =>
  photoId != null && el.kind === 'text' && el.binding?.source === 'photo.caption' && el.binding.photoId === photoId;

/**
 * Exchange the pictures of two frames.
 *
 * The frames, their look and their place stay; the photo and its focal point
 * move. A caption bound to either picture moves with it, by the distance
 * between the two frames' lower left corners, so it stays under its picture.
 */
function opSwapPhotos(spread: BookSpread, op: Op<'swap_photos'>, env: Env): BookSpread {
  const a = unlocked(photoEl(spread, op.a, env), env);
  const b = unlocked(photoEl(spread, op.b, env), env);
  const shift = (from: BookPhotoElement, to: BookPhotoElement) => ({
    dx: to.frame.x - from.frame.x,
    dy: to.frame.y + to.frame.h - (from.frame.y + from.frame.h),
  });
  const moves = new Map<string, { dx: number; dy: number }>();
  if (a.photoId !== b.photoId) {
    for (const el of spread.elements) {
      const of = el.kind === 'text' && el.binding?.source === 'photo.caption' ? el.binding.photoId : undefined;
      if (of !== undefined && of === a.photoId) moves.set(unlocked(el, env).id, shift(a, b));
      else if (of !== undefined && of === b.photoId) moves.set(unlocked(el, env).id, shift(b, a));
    }
  }
  const elements = spread.elements.map((el) => {
    if (el.id === a.id) return { ...a, photoId: b.photoId, focalX: b.focalX, focalY: b.focalY };
    if (el.id === b.id) return { ...b, photoId: a.photoId, focalX: a.focalX, focalY: a.focalY };
    const move = moves.get(el.id);
    if (!move) return el;
    return { ...el, frame: { ...el.frame, x: round2(el.frame.x + move.dx), y: round2(el.frame.y + move.dy) } };
  });
  return { ...spread, elements };
}

// ── text ───────────────────────────────────────────────────────────────────

type Binding = NonNullable<BookTextElement['binding']>;

/**
 * Words given to a bound text keep it bound only when they are what the
 * binding reads anyway; otherwise the text is the author's from now on, as when
 * somebody types into it in the Studio.
 */
const overriddenBy = (words: string, binding: Binding | null, ctx: BookOpsContext) =>
  binding ? bookBoundWords(binding, ctx) !== words : false;

const styleOf = (op: Op<'text'>): Partial<BookTextElement> => ({
  ...(op.font !== undefined ? { font: op.font } : {}),
  ...(op.size !== undefined ? { size: op.size } : {}),
  ...(op.weight !== undefined ? { weight: op.weight } : {}),
  ...(op.italic !== undefined ? { italic: op.italic } : {}),
  ...(op.align !== undefined ? { align: op.align } : {}),
  ...(op.leading !== undefined ? { leading: op.leading } : {}),
  ...(op.tracking !== undefined ? { tracking: op.tracking } : {}),
  ...(op.color !== undefined ? { color: op.color } : {}),
});

/** Dates and coordinates: words set in a reader's notation, which the engine cannot write. */
const isFormatted = (binding: Binding) =>
  binding.source === 'entry.date' || (binding.source === 'entry.location' && binding.format !== undefined);

/** The ids a binding names must be the journey's own: a photo of its gallery, one of its entries. */
function checkBindingIds(binding: Binding, env: Env): void {
  if (binding.photoId !== undefined) galleryPhoto(binding.photoId, env.ctx, env.opIndex);
  if (binding.entryId !== undefined) journeyEntry(binding.entryId, env.ctx, env.opIndex);
}

/** A photo's caption is the photo's, not the page's: a role never lands on one. */
const roleTexts = (spread: BookSpread) =>
  spread.elements.filter((e) => e.kind === 'text' && e.binding?.source !== 'photo.caption');

function opText(spread: BookSpread, op: Op<'text'>, env: Env): BookSpread {
  if (op.binding) checkBindingIds(op.binding, env);
  const existing =
    op.elementId !== undefined
      ? textEl(spread, op.elementId, env)
      : classifyBookTexts(roleTexts(spread))[op.role ?? 'body'];
  // The weight lands on one the family has, whichever of the two a change names.
  if (existing && existing.kind === 'text')
    return replaceEl(spread, withRealWeight(retext(unlocked(existing, env), op, env)));
  withRoom(spread, 1, env);
  return { ...spread, elements: [...spread.elements, withRealWeight(newText(spread, op, env))] };
}

function retext(el: BookTextElement, op: Op<'text'>, env: Env): BookTextElement {
  const style = styleOf(op);
  if (op.binding === null)
    return { ...el, ...style, ...(op.text !== undefined ? { text: op.text } : {}), binding: null, overridden: false };
  if (op.binding !== undefined) {
    if (op.text === undefined && isFormatted(op.binding)) {
      throw failOp(
        'text_required',
        `give the words for ${el.id}; a date or coordinates are set in the reader's notation, so they need words`,
        env.opIndex,
        el.id,
      );
    }
    const words = op.text ?? bookBoundWords(op.binding, env.ctx) ?? (el.text.trim() ? el.text : undefined);
    if (words === undefined)
      throw failOp('text_required', `give the words for ${el.id}; the binding cannot be read here`, env.opIndex, el.id);
    // Bound without words of its own, the text follows its source: the Studio
    // re-reads the journey's title and subtitle, an entry's title, story and
    // place name and a photo's caption for any text that is not overridden.
    // A date or coordinates it rewrites only from a stored value this engine
    // does not write, which is why those need their words given (above).
    const overridden = op.text !== undefined && overriddenBy(op.text, op.binding, env.ctx);
    return { ...el, ...style, text: words, binding: op.binding, overridden };
  }
  if (op.text !== undefined) {
    return { ...el, ...style, text: op.text, overridden: el.overridden || overriddenBy(op.text, el.binding, env.ctx) };
  }
  return { ...el, ...style };
}

/** Where a text the page has no slot for goes: the quiet layouts' slot for its role. */
function newTextFrame(
  spread: BookSpread,
  role: 'heading' | 'body' | 'meta',
  page: BookPageSetup,
): BookElement['frame'] {
  const single = spread.role !== 'inner';
  const tpl = findBookTemplate(single ? 'cover-quiet' : 'quiet-text');
  const slot = tpl?.build(page).find((s) => s.kind === role);
  if (slot)
    return { x: round2(slot.frame.x), y: round2(slot.frame.y), w: round2(slot.frame.w), h: round2(slot.frame.h) };
  // A single page's quiet layout has no story slot: the story goes under its meta line.
  const top = page.pageHeight * 0.42 + 44;
  return { x: 16, y: round2(top), w: round2(page.pageWidth - 32), h: round2(Math.max(10, page.pageHeight - 16 - top)) };
}

/** A text's look before its role's style and the operation's own choices go over it. */
const TEXT_DEFAULTS: Pick<
  BookTextElement,
  'font' | 'size' | 'weight' | 'italic' | 'align' | 'leading' | 'tracking' | 'color'
> = {
  font: 'sans',
  size: 11,
  weight: 400,
  italic: false,
  align: 'left',
  leading: 1.45,
  tracking: 0,
  color: '#1a1a1a',
};

function newText(spread: BookSpread, op: Op<'text'>, env: Env): BookTextElement {
  const role = op.role ?? 'body';
  const binding = op.binding ?? null;
  const words = op.text ?? (binding ? bookBoundWords(binding, env.ctx) : undefined);
  if (!words) throw failOp('text_required', `the page has no ${role} text; give the words for a new one`, env.opIndex);
  return {
    id: env.newId('t'),
    kind: 'text',
    frame: newTextFrame(spread, role, env.page),
    rotation: 0,
    opacity: 1,
    locked: false,
    text: words,
    ...TEXT_DEFAULTS,
    ...BOOK_TEXT_STYLES[role],
    ...styleOf(op),
    binding,
    overridden: overriddenBy(words, binding, env.ctx),
  };
}

// ── caption ────────────────────────────────────────────────────────────────

/**
 * A caption, as the auto layout sets one: a small text bound to the photo's
 * caption in the journey (`journey_photos.caption`), so editing the caption in
 * the journal edits the book. Words given here are the book's own, and stop
 * that sync, the way typing into it in the Studio does.
 */
function opCaption(spread: BookSpread, op: Op<'caption'>, env: Env): BookSpread {
  const photo = photoEl(spread, op.photoElementId, env);
  if (photo.photoId == null) {
    throw failOp('empty_frame', `${photo.id} holds no photo to caption`, env.opIndex, photo.id);
  }
  const journal = env.ctx.photos?.find((p) => p.photoId === photo.photoId)?.caption?.trim() || undefined;
  const words = op.text?.trim() ? op.text : journal;
  if (!words) {
    throw failOp(
      'caption_missing',
      `photo ${photo.photoId} has no caption in the journey; give the words`,
      env.opIndex,
      photo.id,
    );
  }
  const overridden = op.text?.trim() ? op.text !== journal : false;
  const existing = spread.elements.find((e) => isCaptionOf(e, photo.photoId));
  if (existing && existing.kind === 'text') {
    return replaceEl(spread, { ...unlocked(existing, env), text: words, overridden });
  }
  withRoom(spread, 1, env);
  const place = captionPlace(photo, spread, env.page);
  const caption: BookTextElement = {
    id: env.newId('t'),
    kind: 'text',
    frame: place.frame,
    rotation: 0,
    opacity: place.inside ? 0.9 : 1,
    locked: false,
    text: words,
    font: 'sans',
    size: 7.5,
    weight: 500,
    italic: false,
    align: 'left',
    leading: 1.45,
    tracking: 0,
    color: place.inside ? '#ffffff' : '#4a4a4a',
    binding: {
      source: 'photo.caption',
      photoId: photo.photoId,
      ...(spread.entryId != null ? { entryId: spread.entryId } : {}),
    },
    overridden,
  };
  return { ...spread, elements: [...spread.elements, caption] };
}

/**
 * Under the picture when the page has room for a line there, else on the
 * picture's lower edge in white, as the auto layout sets a caption on a
 * full-bleed photo. Kept on the page the picture starts on, out of the fold.
 */
function captionPlace(
  photo: BookPhotoElement,
  spread: BookSpread,
  page: BookPageSetup,
): { frame: BookElement['frame']; inside: boolean } {
  const W = spreadWidth(spread, page);
  const fold = spread.role === 'inner' ? page.pageWidth : null;
  const left = Math.max(photo.frame.x, page.safe);
  let right = Math.min(photo.frame.x + photo.frame.w, W - page.safe);
  if (fold !== null && left < fold && right > fold) right = fold - page.safe;
  const below = photo.frame.y + photo.frame.h + 2;
  if (right - left >= 20 && below + 5 <= page.pageHeight - page.safe) {
    return { frame: { x: round2(left), y: round2(below), w: round2(right - left), h: 5 }, inside: false };
  }
  const inset = Math.max(6, page.safe + 1);
  const bottom = Math.min(photo.frame.y + photo.frame.h, page.pageHeight);
  const x = Math.max(photo.frame.x, 0) + inset;
  return {
    frame: { x: round2(x), y: round2(bottom - inset - 5), w: round2(Math.max(10, right - x - inset)), h: 5 },
    inside: true,
  };
}

// ── frame, remove ──────────────────────────────────────────────────────────

function opFrame(spread: BookSpread, op: Op<'frame'>, env: Env): BookSpread {
  const el = unlocked(element(spread, op.elementId, env), env);
  const frame = {
    x: round2(op.x ?? el.frame.x),
    y: round2(op.y ?? el.frame.y),
    w: round2(op.w ?? el.frame.w),
    h: round2(op.h ?? el.frame.h),
  };
  return replaceEl(spread, { ...el, frame, rotation: op.rotation ?? el.rotation } as BookElement);
}

/** Worth keeping when parked: a frame with a picture, a text with words, anything else that is drawn. */
const worthParking = (el: BookElement) =>
  el.kind === 'photo' ? el.photoId != null : el.kind === 'text' ? el.text.trim() !== '' : true;

function opRemove(spread: BookSpread, op: Op<'remove'>, env: Env): BookSpread {
  const ids = new Set(op.elementIds);
  const deleteParked = new Set<string>();
  for (const id of ids) {
    const onPage = spread.elements.find((e) => e.id === id);
    if (onPage) {
      unlocked(onPage, env);
    } else if (spread.parked.some((e) => e.id === id)) {
      if (!op.park) deleteParked.add(id);
    } else {
      throw failOp('element_not_found', `no element ${id} on this page`, env.opIndex, id);
    }
  }
  const taken = spread.elements.filter((e) => ids.has(e.id));
  const parked = [
    ...spread.parked.filter((e) => !deleteParked.has(e.id)),
    ...(op.park ? taken.filter(worthParking) : []),
  ];
  if (parked.length > MAX_SPREAD_ELEMENTS) {
    throw failOp(
      'parked_full',
      `a page parks at most ${MAX_SPREAD_ELEMENTS} elements; delete some with park false`,
      env.opIndex,
    );
  }
  return { ...spread, elements: spread.elements.filter((e) => !ids.has(e.id)), parked };
}
