import type { BookElement, BookFrame, BookPageSetup, BookStickerElement } from './book.schema';
import type { BookStickerDef, BookStickerLayer, BookStickerSlot } from './stickers/sticker-types';

import { z } from 'zod';

/**
 * What the book needs to know about a sticker without carrying the catalogue.
 *
 * The drawings are some half a megabyte of path data. They live behind their
 * own entry point (`@trek/shared/stickers`), so the root of the contracts, which
 * every screen of the client and every file of the server imports, does not
 * drag them along. Everything here works from the few facts of one sticker
 * that the caller hands in: its box, its slots and its layers.
 */

/** The facts of one sticker the engine places it with. */
export type BookStickerMeta = Pick<BookStickerDef, 'id' | 'box' | 'slots'>;

/**
 * How the engine finds a sticker by id. Handed in through the operations'
 * context by whoever holds the catalogue (the server, the Studio), so the edit
 * engine never imports it.
 */
export type BookStickerLookup = (id: string) => BookStickerMeta | undefined;

/** A sticker id as the document stores it: lowerCamelCase, as the catalogue names them. */
export const BOOK_STICKER_ID_PATTERN = /^[a-z][A-Za-z0-9]*$/;
export const MAX_STICKER_ID = 48;

/** The near-black of a drawn outline and the white that stays white, whatever a book recolours. */
export const STICKER_INK = '#2b2522';
export const STICKER_PAPER = '#ffffff';

/** How see-through the flat shadow and highlight layers are when a layer does not say. */
const SHADE_ALPHA = 0.18;
const LIGHT_ALPHA = 0.35;

/** The colour a slot is drawn in: the element's own choice for it, else the sticker's default. */
export function bookStickerSlotColor(
  slots: readonly BookStickerSlot[],
  colors: readonly string[],
  slot: number,
): string {
  return colors[slot] ?? slots[slot]?.color ?? STICKER_INK;
}

/** What one layer is painted with, resolved against the element's colours: a `#rrggbb` and an opacity. */
export function bookStickerLayerPaint(
  layer: BookStickerLayer,
  slots: readonly BookStickerSlot[],
  colors: readonly string[],
): { color: string; opacity: number } {
  const p = layer.p;
  if (typeof p === 'number') return { color: bookStickerSlotColor(slots, colors, p), opacity: layer.o ?? 1 };
  if (p === 'shade') return { color: '#000000', opacity: layer.o ?? SHADE_ALPHA };
  if (p === 'light') return { color: '#ffffff', opacity: layer.o ?? LIGHT_ALPHA };
  if (p === 'ink') return { color: STICKER_INK, opacity: layer.o ?? 1 };
  if (p === 'paper') return { color: STICKER_PAPER, opacity: layer.o ?? 1 };
  return { color: p, opacity: layer.o ?? 1 };
}

/**
 * The size a sticker arrives at: its longer side three tenths of the page's
 * shorter one, the other side from its own proportions. Big enough to read as
 * an illustration, small enough to sit beside a photo rather than on it.
 */
export function bookStickerSize(box: readonly [number, number], page: Pick<BookPageSetup, 'pageWidth' | 'pageHeight'>) {
  const longest = Math.min(page.pageWidth, page.pageHeight) * 0.3;
  const [w, h] = box;
  const k = longest / Math.max(w, h, 1);
  return { w: Math.round(w * k * 100) / 100, h: Math.round(h * k * 100) / 100 };
}

/** A new sticker element in `frame`, drawn in its own colours, unturned and unflipped. */
export function bookStickerElement(
  sticker: Pick<BookStickerMeta, 'id'>,
  frame: BookFrame,
  id: string,
): BookStickerElement {
  return {
    id,
    kind: 'sticker',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    stickerId: sticker.id,
    colors: [],
    flipX: false,
  };
}

/** The colours an element asks for, cut to the slots the sticker has. */
export function bookStickerColors(
  meta: Pick<BookStickerMeta, 'slots'>,
  colors: readonly string[] | undefined,
): string[] {
  return (colors ?? []).slice(0, meta.slots.length);
}

/** A sticker in words, for describe_book_page. */
export function bookStickerWords(el: BookStickerElement): string {
  const parts = [`sticker ${el.stickerId}`];
  if (el.colors.length) parts.push(`colours ${el.colors.join(' ')}`);
  if (el.flipX) parts.push('flipped');
  return parts.join(', ');
}

export const isBookSticker = (el: BookElement): el is BookStickerElement => el.kind === 'sticker';

/** A sticker id in an operation: its shape here, its existence where the catalogue is (the engine's lookup). */
export const bookStickerIdSchema = z
  .string()
  .regex(BOOK_STICKER_ID_PATTERN, 'expected a sticker id')
  .max(MAX_STICKER_ID)
  .describe('A sticker of the Studio library by id, as list_book_assets names it: hibiscus, eiffelTower, washiDots.');
