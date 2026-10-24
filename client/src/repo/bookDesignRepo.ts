import {
  bookDesignDraftResponseSchema,
  bookDesignSelectionResponseSchema,
  type BookDesignDraftResponse,
  type BookDocument,
} from '@trek/shared';

import { assistantApi } from '../api/assistant';
import { bookDesignApi } from '../api/bookDesignApi';
import { journeyApi } from '../api/client';
import { requireOnline } from './onlineOnly';

/**
 * A whole-book design the assistant drafted, as its card in the Studio's
 * chat reads it: the draft (the designed book, its plan, the pages chosen for
 * the apply), the book as the server holds it to draw beside it, and the
 * pages the person keeps in or takes out.
 *
 * **Deliberately online-only, and no Dexie table.** A draft lives in the
 * server's memory for a few hours and belongs to the chat that made it; a
 * cached copy would outlive it and show a design nobody can apply. Each call
 * refuses with `OnlineOnlyError` before a request is made, like the
 * assistant's own repository.
 */
export const bookDesignRepo = {
  /** The draft; a draft the server forgot answers 410. */
  async draft(journeyId: number, designId: string): Promise<BookDesignDraftResponse> {
    requireOnline();
    return bookDesignDraftResponseSchema.parse(await assistantApi.bookDesign(journeyId, designId));
  },

  /** The book as the server holds it, for a chat outside the Studio; null for a journey without one. */
  async book(journeyId: number): Promise<BookDocument | null> {
    requireOnline();
    return (await journeyApi.getBook(journeyId)).book?.document ?? null;
  },

  /** The pages the apply writes, as the server kept them. */
  async select(journeyId: number, designId: string, spreadIds: readonly string[]): Promise<string[]> {
    requireOnline();
    const answer = await bookDesignApi.selection(journeyId, designId, { spreadIds: [...spreadIds] });
    return bookDesignSelectionResponseSchema.parse(answer).selection;
  },
};
