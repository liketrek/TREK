import type { BookNewElement } from './book-element-ops.schema';
import { failOp, type BookOpsContext } from './book-ops-core';
import { bookStickerColors, bookStickerElement, bookStickerSize } from './book-sticker';
import type { BookFrame, BookPageSetup, BookStickerElement } from './book.schema';

/**
 * `add` of a sticker: the Studio panel's placement, through the library the
 * context hands in. The sticker arrives at the panel's size (book-sticker.ts)
 * centred on the page unless the operation gives a frame, in its own colours
 * unless it names some, cut to the slots the drawing has.
 */
export function newStickerElement(
  spec: Extract<BookNewElement, { kind: 'sticker' }>,
  at: (size: { w: number; h: number }) => BookFrame,
  env: { page: BookPageSetup; ctx: BookOpsContext; newId: (prefix: string) => string; opIndex: number },
): BookStickerElement {
  const meta = env.ctx.stickers?.(spec.stickerId);
  if (!meta) {
    const why = env.ctx.stickers
      ? 'list_book_assets names the stickers there are'
      : 'the sticker library is not available here';
    throw failOp('sticker_unknown', `no sticker ${spec.stickerId}; ${why}`, env.opIndex);
  }
  const el = bookStickerElement(meta, at(bookStickerSize(meta.box, env.page)), env.newId('k'));
  return { ...el, colors: bookStickerColors(meta, spec.colors), flipX: spec.flipX ?? false };
}
