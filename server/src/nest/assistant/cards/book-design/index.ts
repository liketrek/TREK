import { DELETE_ADDED } from '../book/book-undo';
import type { Described, DomainCards, ToolArgs, ToolCards } from '../card-types';
import { Rows, text } from '../preview-format';
import {
  describeDesign,
  designAnswerCard,
  designAppliedCard,
  designChangeCard,
  loadDesign,
  type BookDesignLoaded,
} from './book-design-card';
import { LAYOUT_BACK, REMOVE_SAVED, RESTORE_REVISION, SETUP_BACK } from './book-design-undo';

/**
 * The assistant designs the whole photo book (journey-studio-wp13.md 6).
 * `design_book` answers with the draft's card (nothing proposed yet); the
 * held `apply_book_design` shows the same card as a proposal, read from the
 * draft, and its receipt names the revision the one undo restores and the
 * pages it left. The book-level changes (format and page numbers, a copied
 * page, a kept or removed layout) are plain change cards, each with its way
 * back. The tools load with the journey group and live in the Studio's chat
 * only (assistant-tool-offer.ts).
 */

/** The version an undo pins its call to: the server's to set, never the model's. */
const UNDO_PINNED = ['expectedVersion'] as const;

/** A change card in words alone: the rows a book-level change shows. */
function described(rows: Rows): Described {
  return { subject: '', rows, dayId: null, placeIds: [] };
}

/** A new format names its preset, new page numbers where they sit. */
function describeSetup(args: ToolArgs): Described {
  const numbers = args.pageNumbers && typeof args.pageNumbers === 'object' ? (args.pageNumbers as ToolArgs) : {};
  return described(new Rows().add('type', text(args.preset)).add('position', text(numbers.position)));
}

/** A theme names the theme it starts from and the accent it sets, when it sets one. */
function describeTheme(args: ToolArgs): Described {
  const palette = args.palette && typeof args.palette === 'object' ? (args.palette as ToolArgs) : {};
  return described(new Rows().add('type', text(args.theme)).add('color', text(palette.accent)));
}

/** A layout kept or taken away, by its name or its id. */
function describeLayout(args: ToolArgs, key: 'name' | 'layoutId'): Described {
  return described(new Rows().add('name', text(args[key])));
}

const applyDesign: ToolCards<BookDesignLoaded> = {
  write: { verbKey: 'designBook', entity: 'book_page' },
  argPolicy: { stripped: UNDO_PINNED },
  load: (args, read) => loadDesign(args, read),
  describe: (_ctx, _args, loaded) => describeDesign(loaded),
  change: (_ctx, _args, loaded) => designChangeCard(loaded),
  applied: ({ result, preview }) => designAppliedCard(result, preview),
  undo: RESTORE_REVISION,
};

export const BOOK_DESIGN_CARDS: DomainCards = {
  id: 'bookDesign',
  toolControllers: { journey: ['JourneyBookDesignMcp'] },
  tools: {
    design_book: { answer: designAnswerCard },
    get_book_design: { answer: designAnswerCard },
    apply_book_design: applyDesign,
    set_book_setup: {
      write: { verbKey: 'setBookSetup', entity: 'book_page' },
      argPolicy: { stripped: UNDO_PINNED },
      describe: (_ctx, args) => describeSetup(args),
      undo: SETUP_BACK,
    },
    set_book_theme: {
      write: { verbKey: 'setBookTheme', entity: 'book_page' },
      describe: (_ctx, args) => describeTheme(args),
      undo: RESTORE_REVISION,
    },
    duplicate_book_page: {
      write: { verbKey: 'duplicateBookPage', entity: 'book_page' },
      describe: () => described(new Rows()),
      undo: DELETE_ADDED,
    },
    save_book_layout: {
      write: { verbKey: 'saveBookLayout', entity: 'book_page' },
      describe: (_ctx, args) => describeLayout(args, 'name'),
      undo: REMOVE_SAVED,
    },
    remove_book_layout: {
      write: { verbKey: 'removeBookLayout', entity: 'book_page' },
      argPolicy: { stripped: UNDO_PINNED },
      describe: (_ctx, args) => describeLayout(args, 'layoutId'),
      undo: LAYOUT_BACK,
    },
  },
};
