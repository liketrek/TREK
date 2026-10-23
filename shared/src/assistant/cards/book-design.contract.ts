import { bookDesignCardSchema } from './book-design.card';

export * from './book-design.card';

/**
 * What the assistant's whole-book design brings to the chat: the card of a
 * design and its proposal, and the verbs of the book-level changes (the
 * design applied, the page format and numbers, a page copied, a layout kept
 * or taken away). They touch pages of the book, so they name the photo
 * book's own entity (`book_page`, book.contract.ts) and add none.
 */
export const BOOK_DESIGN_CARD_SCHEMAS = [bookDesignCardSchema] as const;
export const BOOK_DESIGN_VERB_KEYS = [
  'designBook',
  'setBookSetup',
  'duplicateBookPage',
  'saveBookLayout',
  'removeBookLayout',
] as const;
