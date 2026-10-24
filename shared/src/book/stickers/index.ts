/**
 * `@trek/shared/stickers`: the Studio's sticker library and its lookups, kept
 * out of the root barrel because the drawings are large (sticker-catalogue.ts).
 */
export {
  BOOK_STICKERS,
  bookSticker,
  bookStickerLookup,
  bookStickersOf,
  listBookAssets,
  searchBookStickers,
  type BookAssetRow,
  type BookStickerSearch,
} from './sticker-catalogue';
export type { BookStickerDef, BookStickerLayer, BookStickerSlot, BookStickerTheme } from './sticker-types';
