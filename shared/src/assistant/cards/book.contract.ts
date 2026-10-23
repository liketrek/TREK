import { bookPageCardSchema } from './book-page.card';

export * from './book-page.card';

/**
 * What the Studio's photo book brings to the assistant chat: the kind of card
 * a held book write draws, the verbs of its change cards and what an applied
 * one touches. cards/index.ts and assistant.schema.ts spread these into the
 * card union and the shared enums, so a new kind, verb or entity is added
 * here and nowhere else.
 */
export const BOOK_CARD_SCHEMAS = [bookPageCardSchema] as const;
/** A book laid down, pages added, changed, moved or deleted, the cover set. */
export const BOOK_VERB_KEYS = [
  'createBook',
  'addBookPages',
  'editBookPage',
  'moveBookPage',
  'removeBookPages',
  'setBookCover',
] as const;
/** A page of a journey's book; the receipt opens the Studio on it. Pages have string ids, so the card names them. */
export const BOOK_APPLIED_ENTITIES = ['book_page'] as const;
