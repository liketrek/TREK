import type { CardView } from '../cardTypes';
import { BookPageBody, BookPageFacts, BookPageSubject } from './BookPageSlots';

/**
 * How the photo book's kind draws in the chat: a change row of a page with
 * the pages it works on as its subject, its facts on the faint line and the
 * page before and after under it. A page card is only ever a change, so it
 * has no block of its own. This file only maps the kind to its view: the
 * components live in a sibling file, since a file that exports anything
 * besides components breaks fast refresh.
 */
export const BOOK_VIEWS = {
  bookPage: {
    ownsSubject: true,
    Aside: BookPageSubject,
    Facts: BookPageFacts,
    Body: BookPageBody,
  },
} satisfies { [K in 'bookPage']: CardView<K> };
