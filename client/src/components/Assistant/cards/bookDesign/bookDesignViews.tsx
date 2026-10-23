import type { CardView } from '../cardTypes';
import { BookDesignBlock, BookDesignBody, BookDesignFacts, BookDesignSubject } from './BookDesignCard';

/**
 * How the whole-book design draws in the chat: `design_book`'s draft as an
 * answer card of its own, the held `apply_book_design` and its receipt as a
 * change row with the design as its subject, its facts on the faint line and
 * its pages under it. This file only maps the kind to its view: the
 * components live in a sibling file, since a file that exports anything
 * besides components breaks fast refresh.
 */
export const BOOK_DESIGN_VIEWS = {
  bookDesign: {
    Block: BookDesignBlock,
    ownsSubject: true,
    Aside: BookDesignSubject,
    Facts: BookDesignFacts,
    Body: BookDesignBody,
  },
} satisfies { [K in 'bookDesign']: CardView<K> };
