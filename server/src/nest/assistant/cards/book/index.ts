import type { DomainCards, ToolCards } from '../card-types';
import { recordOf } from '../card-values';
import { bookAppliedCard, bookChangeCard, describeBook, loadBook, type BookLoaded } from './book-change';
import { DELETE_ADDED, MOVE_BACK, RESTORE_PREVIOUS } from './book-undo';
import type { AssistantChangeVerbKey } from '@trek/shared';

/**
 * The photo book in the Studio's chat. A held book write shows the pages it
 * works on, before and after, drawn in the Studio from the page the server's
 * trial made (or the operations the card carries, for a card without that
 * page or a book moved on since), with what it brings and what the server's
 * check of the result found; once applied, the pages as it left them. Edits,
 * the cover and deleted pages are taken back with `restore_book_page`, new
 * pages deleted again, a moved page moved back: an edit while its page is as
 * the change left it, the others while nothing was saved to the book since.
 *
 * The check itself is the turn's gate (assistant-book-gate.ts): it tries the
 * call on the stored book, refuses what the engine refuses and sends a change
 * with new faults back to the model once, and the card reads that same trial.
 */

/** A write's answer as the model and the chat see it: without the pages and their digests it kept for its undo. */
function withoutPrevious(value: unknown): unknown {
  const answer = recordOf(value);
  if (!('previous_spreads' in answer) && !('page_digests' in answer)) return value;
  const { previous_spreads: _kept, page_digests: _digests, ...rest } = answer;
  return rest;
}

/** A write whose answer keeps the pages as they were: forced on, never chosen by the model, never shown to it. */
const KEEPS_PREVIOUS: ToolCards<BookLoaded> = {
  argPolicy: { forced: { returnPrevious: true } },
  project: withoutPrevious,
};

/** The version an undo pins its call to (book-undo.ts): the server's to set, never the model's. */
const UNDO_PINNED = ['expectedVersion'] as const;

/** A book write's card entries: its verb, its trial, its words and its card while held and once applied. */
function bookWrite(
  tool: string,
  verbKey: AssistantChangeVerbKey,
  own: ToolCards<BookLoaded> = {},
): ToolCards<BookLoaded> {
  return {
    write: { verbKey, entity: 'book_page' },
    load: (args, read) => loadBook(tool, args, read),
    describe: (_ctx, args, loaded) => describeBook(tool, args, loaded),
    change: (_ctx, args, loaded) => bookChangeCard(tool, args, loaded),
    applied: ({ result, preview }) => bookAppliedCard(result, preview),
    ...own,
  };
}

export const BOOK_CARDS: DomainCards = {
  id: 'book',
  tools: {
    create_book: bookWrite('create_book', 'createBook'),
    add_book_pages: bookWrite('add_book_pages', 'addBookPages', { undo: DELETE_ADDED }),
    move_book_page: bookWrite('move_book_page', 'moveBookPage', {
      argPolicy: { stripped: UNDO_PINNED },
      undo: MOVE_BACK,
    }),
    delete_book_pages: bookWrite('delete_book_pages', 'removeBookPages', {
      ...KEEPS_PREVIOUS,
      argPolicy: { forced: { returnPrevious: true }, stripped: UNDO_PINNED },
      undo: RESTORE_PREVIOUS,
    }),
    edit_book_page: bookWrite('edit_book_page', 'editBookPage', { ...KEEPS_PREVIOUS, undo: RESTORE_PREVIOUS }),
    set_book_cover: bookWrite('set_book_cover', 'setBookCover', { ...KEEPS_PREVIOUS, undo: RESTORE_PREVIOUS }),
  },
};
