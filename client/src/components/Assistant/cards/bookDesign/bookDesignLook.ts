import { BookmarkMinus, BookmarkPlus, Copy, Ruler, Sparkles } from 'lucide-react';

import type { PackLook } from '../cardTypes';

/**
 * What the assistant's whole-book design brings to the chat's pure look: the
 * verbs of the book-level changes (a design applied, the page format and the
 * page numbers, a page copied, a layout kept or taken away), the reading
 * steps of the design tools and the look of the design card. A look stays
 * pure, icons and literals only: the chat's main chunk reads every look, so
 * whatever a look imports ships with it.
 *
 * The changes touch pages of the book, so they name the photo book's own
 * entity (`book_page`, bookLook.ts) and add none; the card opens its pages
 * itself, each one in the Studio, and the entity's look opens an applied
 * design's receipt on the first page it wrote.
 */
export const BOOK_DESIGN_LOOK = {
  verbs: {
    designBook: { Icon: Sparkles, tone: 'info', labelKey: 'assistant.change.verb.designBook' },
    setBookSetup: { Icon: Ruler, tone: 'info', labelKey: 'assistant.change.verb.setBookSetup' },
    duplicateBookPage: { Icon: Copy, tone: 'success', labelKey: 'assistant.change.verb.duplicateBookPage' },
    saveBookLayout: { Icon: BookmarkPlus, tone: 'success', labelKey: 'assistant.change.verb.saveBookLayout' },
    removeBookLayout: { Icon: BookmarkMinus, tone: 'danger', labelKey: 'assistant.change.verb.removeBookLayout' },
  },
  tools: {},
  steps: {
    design_book: { stepKey: 'assistant.step.designingBook' },
    get_book_design: { stepKey: 'assistant.step.readingDesign' },
    revise_book_design: { stepKey: 'assistant.step.revisingDesign' },
  },
  entities: {},
  cards: {
    bookDesign: {
      entity: () => 'book_page',
      // The draft's card gives way to the proposal of the same draft, which shows the same pages.
      yieldsToChange: (answer, change) => change.kind === 'bookDesign' && change.designId === answer.designId,
    },
  },
} satisfies PackLook<'bookDesign'>;
