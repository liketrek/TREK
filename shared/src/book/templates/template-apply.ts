import { gatherGroups, regroupCopies, tidyGroups } from '../book-groups';
import { bookElementId } from '../book-ids';
import { isBookOrnamentText } from '../book-layouts';
import { bookDateMarkValue } from '../book-text';
import { fitSpreadTexts } from '../book-text-fit';
import { bookTravelMap, type BookTravelContext } from '../book-travel';
import {
  MAX_SPREAD_ELEMENTS,
  type BookBadgeElement,
  type BookElement,
  type BookMapElement,
  type BookPageSetup,
  type BookPhotoElement,
  type BookSpread,
  type BookTextElement,
} from '../book.schema';
import { themedSpread } from '../theme/book-theme-apply';
import type { BookTheme } from '../theme/book-theme.schema';
import { templatePhotoIndex, type BookDecoratedTemplate, type BookTemplateTextRole } from './template-format';
import {
  layTemplateElement,
  readableOn,
  templateBackgroundPaint,
  templatePage,
  type LaidElement,
} from './template-lay';
import { assignTemplateTexts, textRolesOf, type BookTemplateWord, type BookTemplateWords } from './template-words';

/**
 * Laying a page out on a decorated template.
 *
 * The same bargain as every layout in the Studio: the page's pictures go into
 * the template's photo frames in order (`photo:1` first), its words into the
 * template's text roles (template-words.ts says which into which), its date
 * into a date mark, its map into the template's map, and what the template
 * has no room for is parked with the page rather than lost. Everything else on
 * the page was the old design and goes, as with the built-in layouts; locked
 * elements stay where they are, in their place in the paint order.
 *
 * What the template brings is its design: panels, shapes, stickers, lines,
 * every look and every type setting. Its colours and faces follow the book's
 * theme where they are linked (template-format.ts), and its fitted titles
 * are fitted to the words they were given.
 */

export interface ApplyDecoratedTemplateOptions {
  /** The book's theme; without one the template keeps the colours and faces it was drawn in. */
  theme?: BookTheme | null;
  /** Words for the roles the page has no words for (bookTemplateWords). */
  words?: BookTemplateWords;
  /** The journey's figures and way, for a map role on a page that has no map. */
  travel?: BookTravelContext | null;
  /** The book's language, for the month a date mark spells out. */
  locale?: string;
  newId?: (prefix: string) => string;
}

type TextEl = BookTextElement;

/** The map's journey in the template's look: its data from the page's own map or from the journey. */
function pouredMap(
  slot: BookMapElement,
  own: BookMapElement | undefined,
  travel: BookTravelContext | null | undefined,
): BookMapElement | null {
  const from =
    own ??
    (travel?.stats ? bookTravelMap(travel, travel.stats, { id: slot.id, frame: slot.frame, scope: 'journey' }) : null);
  if (!from) return null;
  const { countries, points, path, roads, tripId, source, tileUrl, attribution, zoom } = from;
  return { ...slot, countries, points, path, roads, tripId, source, tileUrl, attribution, zoom };
}

/** A role's text in the template's look, set in the page's words and keeping their link to the journal. */
function pouredText(slot: TextEl, src: TextEl | undefined, word: BookTemplateWord | undefined): TextEl | null {
  if (src) return { ...slot, text: src.text, binding: src.binding, overridden: src.overridden };
  if (!word?.text.trim()) return null;
  return { ...slot, text: word.text, binding: word.binding ?? null, overridden: false };
}

/** A map with nothing to draw laid as a photo frame in its place, with the next of the page's pictures. */
function mapAsPhoto(slot: BookMapElement, src: BookPhotoElement | undefined): BookPhotoElement {
  return {
    id: slot.id,
    kind: 'photo',
    frame: slot.frame,
    rotation: slot.rotation,
    opacity: slot.opacity,
    locked: false,
    photoId: src?.photoId ?? null,
    fit: 'cover',
    focalX: src?.focalX ?? 0.5,
    focalY: src?.focalY ?? 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: 'none',
  };
}

/** Closer than this to the fold, in millimetres, a picture's focal point is lost in the binding. */
const FOLD_REACH = 12;

/**
 * A photo frame of the template with the page's picture in it; the frame
 * keeps the template's look. A frame drawn across the fold of a spread keeps
 * the picture's focal point unless that would put it in the fold: then it
 * takes the one the template was drawn with, which keeps it on one page.
 */
function pouredPhoto(slot: BookPhotoElement, src: BookPhotoElement | undefined, fold: number | null): BookPhotoElement {
  if (!src) return { ...slot, photoId: null };
  const inFold = fold !== null && Math.abs(slot.frame.x + src.focalX * slot.frame.w - fold) < FOLD_REACH;
  return { ...slot, photoId: src.photoId, focalX: inFold ? slot.focalX : src.focalX, focalY: src.focalY };
}

/**
 * A date mark of the template with the page's date: the values of the page's
 * own mark, else the date the page's date line is bound to, else the date of
 * the words given for the role. `fromText` says the mark was made of the date
 * line, which then goes into it; any other date line stays with the page.
 */
function pouredMark(
  slot: BookBadgeElement,
  own: BookBadgeElement | undefined,
  src: TextEl | undefined,
  word: BookTemplateWord | undefined,
  locale: string,
): { mark: BookBadgeElement | null; fromText: boolean } {
  if (own) return { mark: { ...slot, text: own.text, sub: own.sub, code: own.code }, fromText: false };
  if (slot.variant !== 'date') return { mark: null, fromText: false };
  const ofText = bookDateMarkValue(src?.binding?.value, locale);
  if (ofText) return { mark: { ...slot, ...ofText }, fromText: true };
  const ofWord = bookDateMarkValue(word?.binding?.value, locale);
  return { mark: ofWord ? { ...slot, ...ofWord } : null, fromText: false };
}

interface Pool {
  photos: BookPhotoElement[];
  texts: TextEl[];
  map: BookMapElement | undefined;
  marks: BookBadgeElement[];
}

/** What a page brings to a template: its pictures, its words (a mark set as text is design, not words), its map and its marks. */
function poolOf(spread: BookSpread): Pool {
  const all = [...spread.elements.filter((e) => !e.locked), ...spread.parked];
  return {
    photos: all.filter((e): e is BookPhotoElement => e.kind === 'photo' && e.photoId != null),
    texts: all.filter((e): e is TextEl => e.kind === 'text' && !!e.text.trim() && !isBookOrnamentText(e)),
    map: all.find((e): e is BookMapElement => e.kind === 'map'),
    marks: all.filter((e): e is BookBadgeElement => e.kind === 'badge'),
  };
}

/** The letters of a text filled with the picture a photo role took, or left in their colour without one. */
function withFill(el: TextEl, photo: BookPhotoElement | undefined): TextEl {
  if (photo?.photoId == null) return { ...el, fillPaint: null };
  return {
    ...el,
    fillPaint: { type: 'photo', photoId: photo.photoId, focalX: photo.focalX, focalY: photo.focalY, zoom: 1 },
  };
}

const isTextRole = (role: string | undefined, roles: ReadonlySet<BookTemplateTextRole>): role is BookTemplateTextRole =>
  role !== undefined && roles.has(role as BookTemplateTextRole);

/** The template's elements laid on the page, the page's content poured into their roles; `fold` is a spread's. */
function pour(laid: readonly LaidElement[], pool: Pool, fold: number | null, opts: ApplyDecoratedTemplateOptions) {
  const photoOrder = laid
    .map((l) => templatePhotoIndex(l.role))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);
  const photoOf = new Map(photoOrder.map((n, i) => [n, pool.photos[i]]));
  // A map role with nothing to draw takes the next picture instead, so its place is never an empty hole.
  const mapless = !pool.map && !opts.travel?.stats && laid.some((l) => l.role === 'map');
  const spare = mapless ? pool.photos[photoOrder.length] : undefined;
  const roles = textRolesOf(laid.flatMap((l) => (l.role ? [l.role] : [])));
  const textOf = assignTemplateTexts(pool.texts, roles);
  const usedTexts = new Set(textOf.values());
  const locale = opts.locale ?? 'en';

  const out: BookElement[] = [];
  for (const { el, role, fillPhoto } of laid) {
    const photo = templatePhotoIndex(role);
    if (el.kind === 'photo' && photo !== null) out.push(pouredPhoto(el, photoOf.get(photo), fold));
    else if (el.kind === 'text' && isTextRole(role, roles)) {
      const text = pouredText(el, textOf.get(role), opts.words?.[role]);
      const fill = templatePhotoIndex(fillPhoto);
      if (text) out.push(fill === null ? text : withFill(text, photoOf.get(fill)));
    } else if (el.kind === 'badge' && isTextRole(role, roles)) {
      const src = textOf.get(role);
      const own = pool.marks.find((m) => m.variant === el.variant);
      const { mark, fromText } = pouredMark(el, own, src, opts.words?.[role], locale);
      if (mark) out.push(mark);
      // A date line the mark was not made of stays with the page rather than going with the mark.
      if (src && !fromText) usedTexts.delete(src);
    } else if (el.kind === 'map' && role === 'map') {
      out.push(pouredMap(el, pool.map, opts.travel) ?? mapAsPhoto(el, spare));
    } else if (!role) out.push(el);
  }
  const placed = photoOrder.length + (mapless ? 1 : 0);
  const parked = [...pool.photos.slice(placed), ...pool.texts.filter((t) => !usedTexts.has(t))].slice(
    0,
    MAX_SPREAD_ELEMENTS,
  );
  return { elements: out, parked };
}

/** Locked elements back where they were in the paint order, over the laid page. */
function withLocked(spread: BookSpread, elements: BookElement[]): BookElement[] {
  const next = elements.slice(0, MAX_SPREAD_ELEMENTS);
  spread.elements.forEach((el, i) => {
    if (el.locked) next.splice(Math.min(i, next.length), 0, el);
  });
  return next.slice(0, MAX_SPREAD_ELEMENTS);
}

/** Every element of a template laid on a page of this book, nothing poured into it yet. */
export function layDecoratedTemplate(
  tpl: BookDecoratedTemplate,
  page: BookPageSetup,
  theme: BookTheme | null,
  newId: (prefix: string) => string,
): LaidElement[] {
  const at = templatePage(page, tpl.kind === 'inner' ? 2 : 1);
  return tpl.elements.flatMap((src) => layTemplateElement(src, at, theme, newId(src.kind.charAt(0))) ?? []);
}

/**
 * The spread laid out on a decorated template. The caller checks that the
 * template fits the page (a single page takes a `single` template, a double
 * spread an `inner` one); laid on the other kind it still makes a valid page,
 * only not a good one.
 */
export function applyDecoratedTemplate(
  spread: BookSpread,
  tpl: BookDecoratedTemplate,
  page: BookPageSetup,
  opts: ApplyDecoratedTemplateOptions = {},
): BookSpread {
  const newId = opts.newId ?? bookElementId;
  const theme = opts.theme ?? null;
  const laid = layDecoratedTemplate(tpl, page, theme, newId);
  const fold = tpl.kind === 'inner' ? page.pageWidth : null;
  const { elements, parked } = pour(laid, poolOf(spread), fold, opts);
  // The template's groups get ids of this page; a group left with one member is no group (tidyGroups).
  const regrouped = regroupCopies(elements, undefined, newId);

  const { backgroundPaint: _old, backgroundToken: _link, groups: _groups, ...rest } = spread;
  const paint = templateBackgroundPaint(tpl, theme);
  const lockedGroups = (spread.groups ?? []).filter((g) => spread.elements.some((e) => e.locked && e.group === g.id));
  let next: BookSpread = {
    ...rest,
    background: tpl.background,
    ...(tpl.backgroundToken ? { backgroundToken: tpl.backgroundToken } : {}),
    ...(paint ? { backgroundPaint: paint } : {}),
    ...(lockedGroups.length ? { groups: lockedGroups } : {}),
    elements: withLocked(spread, regrouped.elements),
    parked,
  };
  if (theme) next = themedSpread(next, theme);
  // Fitted to the words they were given, below the size the template drew them at, which stays their ceiling.
  next = fitSpreadTexts(tidyGroups(gatherGroups(next)));
  return theme ? readableSpread(next, laid, theme) : next;
}

/** Every laid text set on a colour made to read there, now that its words are in and its size is fitted. */
function readableSpread(spread: BookSpread, laid: readonly LaidElement[], theme: BookTheme): BookSpread {
  const onOf = new Map(laid.flatMap((l) => (l.on ? [[l.el.id, l.on] as const] : [])));
  if (!onOf.size) return spread;
  const elements = spread.elements.map((e) => {
    const on = e.kind === 'text' ? onOf.get(e.id) : undefined;
    return on && e.kind === 'text' ? readableOn(e, on, theme) : e;
  });
  return elements.every((e, i) => e === spread.elements[i]) ? spread : { ...spread, elements };
}
