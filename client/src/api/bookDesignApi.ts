import type { BookDesignSelectionRequest, BookDesignSelectionResponse } from '@trek/shared';

import apiClient from './client';

/**
 * The assistant's whole-book design drafts as the Studio chat's proposal card
 * narrows them: the pages of a draft its apply writes. The draft itself is
 * read through `assistantApi.bookDesign`, which the Studio also draws a page
 * of a draft from. Online only, like the assistant: a draft lives on the
 * server for a few hours and nowhere else.
 */
export const bookDesignApi = {
  selection: (
    journeyId: number,
    designId: string,
    body: BookDesignSelectionRequest
  ): Promise<BookDesignSelectionResponse> =>
    apiClient
      .put(`/journeys/${journeyId}/book-designs/${encodeURIComponent(designId)}/selection`, body)
      .then((r) => r.data),
};
