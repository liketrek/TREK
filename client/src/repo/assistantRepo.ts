import {
  assistantAddFoundPlaceResponseSchema,
  assistantRenderUploadResponseSchema,
  assistantThreadListResponseSchema,
  assistantThreadResponseSchema,
  collabMessageResponseSchema,
  type AssistantAddFoundPlaceRequest,
  type AssistantChatRequest,
  type AssistantDecisionsRequest,
  type AssistantShareRequest,
  type AssistantTakeProposalRequest,
  type BookDocument,
  type BookRecord,
} from '@trek/shared';
import { assistantApi, type AssistantTarget } from '../api/assistant';
import { journeyApi } from '../api/client';
import { requireOnline } from './onlineOnly';

/**
 * The assistant's conversations: a trip's in the planner, a journey's in TREK
 * Studio. The calls both have take an `AssistantTarget` (a trip's id, or a
 * scope); files, found places, proposals and sharing take a trip's id.
 *
 * **Deliberately online-only, and no Dexie table.** Every answer comes from a
 * model on the other side of the server, so there is nothing to do offline,
 * and a cached copy of a chat would be one more place the trip data the model
 * read lives on the device. Each call refuses with `OnlineOnlyError` before a
 * request is made; the view says why instead of hanging on a timeout.
 *
 * The planner and the Studio learn about applied changes the normal way,
 * through the WebSocket broadcast the tools send, so nothing here touches
 * trip or book data.
 */
export const assistantRepo = {
  async threads(target: AssistantTarget) {
    requireOnline();
    return assistantThreadListResponseSchema.parse(await assistantApi.threads(target)).threads;
  },

  async thread(target: AssistantTarget, threadId: number) {
    requireOnline();
    return assistantThreadResponseSchema.parse(await assistantApi.thread(target, threadId));
  },

  async deleteThread(target: AssistantTarget, threadId: number): Promise<void> {
    requireOnline();
    await assistantApi.deleteThread(target, threadId);
  },

  /** A new message; resolves once the server accepted it, with the stream of the answer. */
  async send(target: AssistantTarget, body: AssistantChatRequest, signal: AbortSignal) {
    requireOnline();
    return assistantApi.chat(target, body, signal);
  },

  /** The decisions on the changes a step holds; the stream carries their results and the rest of the turn. */
  async decide(target: AssistantTarget, threadId: number, body: AssistantDecisionsRequest, signal: AbortSignal) {
    requireOnline();
    return assistantApi.decide(target, threadId, body, signal);
  },

  /** A booking file for the chat to read; the stream proposes each booking found in it. */
  async attach(
    tripId: number,
    file: File,
    fields: { threadId: number | null; locale: string; timeZone: string },
    signal: AbortSignal
  ) {
    requireOnline();
    const form = new FormData();
    form.append('file', file);
    if (fields.threadId !== null) form.append('threadId', String(fields.threadId));
    form.append('locale', fields.locale);
    form.append('timeZone', fields.timeZone);
    return assistantApi.attach(tripId, form, signal);
  },

  async undo(target: AssistantTarget, toolCallId: string): Promise<void> {
    requireOnline();
    await assistantApi.undo(target, toolCallId);
  },

  /** A place a search found, held as a change for a day; no model runs for it. */
  async addFoundPlace(tripId: number, threadId: number, body: AssistantAddFoundPlaceRequest) {
    requireOnline();
    return assistantAddFoundPlaceResponseSchema.parse(await assistantApi.addFoundPlace(tripId, threadId, body));
  },

  /** A proposal an answer showed as a card ("Plan this"), held as a change; no model runs for it. */
  async takeProposal(tripId: number, threadId: number, body: AssistantTakeProposalRequest) {
    requireOnline();
    return assistantAddFoundPlaceResponseSchema.parse(await assistantApi.takeProposal(tripId, threadId, body));
  },

  /**
   * An answer posted to the trip chat, as the preview showed it. Online only
   * like the rest: a chat message sent later would land out of order between
   * the live ones.
   */
  async share(tripId: number, threadId: number, messageId: string, body: AssistantShareRequest) {
    requireOnline();
    return collabMessageResponseSchema.parse(await assistantApi.share(tripId, threadId, messageId, body));
  },

  async stop(target: AssistantTarget): Promise<void> {
    requireOnline();
    await assistantApi.stop(target);
  },

  /**
   * The book as the server holds it, to draw a page a Studio turn asked for
   * at the version it names. Read fresh rather than from the Studio's copy,
   * which keeps no version beside it.
   */
  async pageBook(journeyId: number): Promise<BookRecord | null> {
    requireOnline();
    return (await journeyApi.getBook(journeyId)).book;
  },

  /**
   * A design draft the assistant made, for a page of it a Studio turn asked
   * for (`designId`): its book, at the version of the book it was made
   * against, as the server names that version in the request.
   */
  async pageDraft(journeyId: number, designId: string): Promise<{ version: number; document: BookDocument }> {
    requireOnline();
    const draft = await assistantApi.bookDesign(journeyId, designId);
    return { version: draft.baseVersion ?? 0, document: draft.document };
  },

  /** A page a Studio turn asked for, drawn: the image, its page and version, and the photos it shows. */
  async uploadRender(
    journeyId: number,
    threadId: number,
    requestId: string,
    page: { image: Blob; bookVersion: number; spreadId: string; drawnPhotoIds: readonly number[] },
    signal: AbortSignal
  ): Promise<void> {
    requireOnline();
    const form = new FormData();
    form.append('image', page.image, 'page.jpg');
    form.append('bookVersion', String(page.bookVersion));
    form.append('spreadId', page.spreadId);
    if (page.drawnPhotoIds.length > 0) form.append('drawnPhotoIds', page.drawnPhotoIds.join(','));
    assistantRenderUploadResponseSchema.parse(
      await assistantApi.uploadRender(journeyId, threadId, requestId, form, signal)
    );
  },
};
