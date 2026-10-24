import { BookImage, BookPlus, FilePen, FilePlus, FileX, MoveVertical } from 'lucide-react';

import { writtenRows } from '../bookDesign/bookDesignModel';
import type { EntityTarget, PackLook } from '../cardTypes';

/**
 * What the photo book brings to the chat's pure look: the verbs of its
 * changes, the reading steps of the Studio's tools and of the page preview
 * the server reads, what an applied change opens and the look of its page
 * card. A look stays pure, icons and literals only: the chat's main chunk
 * reads every look, so whatever a look imports ships with it.
 *
 * An applied change opens the Studio on its page, an applied whole-book
 * design on the first page it wrote; the Studio is opened on top of the
 * journey, so the journey stays where it was underneath.
 */

/** The Studio of a journey, on one of its pages. */
export function studioTarget(journeyId: number, spreadId: string | null): EntityTarget {
  const page = spreadId ? `?page=${encodeURIComponent(spreadId)}` : '';
  return { kind: 'page', path: `/journey/${journeyId}/studio${page}` };
}

export const BOOK_LOOK = {
  verbs: {
    createBook: { Icon: BookPlus, tone: 'success', labelKey: 'assistant.change.verb.createBook' },
    addBookPages: { Icon: FilePlus, tone: 'success', labelKey: 'assistant.change.verb.addBookPages' },
    editBookPage: { Icon: FilePen, tone: 'info', labelKey: 'assistant.change.verb.editBookPage' },
    moveBookPage: { Icon: MoveVertical, tone: 'warning', labelKey: 'assistant.change.verb.moveBookPage' },
    removeBookPages: { Icon: FileX, tone: 'danger', labelKey: 'assistant.change.verb.removeBookPages' },
    setBookCover: { Icon: BookImage, tone: 'info', labelKey: 'assistant.change.verb.setBookCover' },
  },
  tools: {},
  steps: {
    get_book: { stepKey: 'assistant.step.readingBook' },
    describe_book_page: { stepKey: 'assistant.step.lookingAtPage' },
    // The server's own read: it waits for the Studio to draw the page, and says it looks at it.
    preview_book_page: { stepKey: 'assistant.step.lookingAtPage' },
    list_book_layouts: { stepKey: 'assistant.step.bookLayouts' },
    list_book_assets: { stepKey: 'assistant.step.bookAssets' },
    suggest_book_photos: { stepKey: 'assistant.step.choosingPhotos' },
  },
  entities: {
    book_page: {
      Icon: BookImage,
      openLabelKey: 'assistant.card.book.open',
      // A deleted page is gone: its receipt opens the book as it is. A design opens on the first page it wrote.
      open: (_applied, card) => {
        if (card?.kind === 'bookDesign') return studioTarget(card.journeyId, writtenRows(card)[0]?.spreadId ?? null);
        if (card?.kind !== 'bookPage') return null;
        return studioTarget(card.journeyId, card.change === 'willDelete' ? null : (card.pages[0]?.spreadId ?? null));
      },
    },
  },
  cards: {
    bookPage: {
      entity: () => 'book_page',
    },
  },
} satisfies PackLook<'bookPage'>;
