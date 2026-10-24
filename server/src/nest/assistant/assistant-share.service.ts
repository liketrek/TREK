import { ADDON_IDS } from '../../addons';
import { AssistantMessages } from '../../db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import type { AssistantMessagesRepository } from '../../db/repositories/AssistantMessages.repository';
import type { AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { CollabService } from '../collab/collab.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { COLLAB_MESSAGE_ORIGIN_ASSISTANT } from '@trek/shared';

/** The row a message id on the wire (`msg-<row>`) names, or null for anything else. */
export function messageRowOf(messageId: string): number | null {
  const match = /^msg-([1-9]\d{0,15})$/.exec(messageId);
  return match ? Number(match[1]) : null;
}

/**
 * Sharing an answer of the trip assistant in the trip's chat. The message is
 * posted as the user's own, with the text they saw in the preview, and marked
 * as shared from the assistant (`origin`), which only this path sets: the
 * mark says the user shared an answer the assistant gave them in this trip,
 * so the server checks that answer, not the words. It reaches the chat like a
 * typed message, broadcast and notified the same way, with one difference: the
 * asking tab is not left out. It never put the message into its own chat, so it
 * hears it like every other tab (the chat drops a message it already holds).
 */
@Injectable()
export class AssistantShareService {
  constructor(
    @InjectRepository(AssistantThreads) private readonly threads: AssistantThreadsRepository,
    @InjectRepository(AssistantMessages) private readonly messages: AssistantMessagesRepository,
    private readonly addons: AddonsService,
    private readonly collab: CollabService,
  ) {}

  /**
   * Posts `text` to the chat of the trip as shared from the answer `messageId`
   * of the user's thread. 403 while the chat is off, 404 for a thread or an
   * answer that is not the user's in this trip.
   */
  async share(
    user: User,
    tripId: number,
    threadId: number,
    messageId: string,
    text: string,
    // The asking tab, which the route hands on; deliberately not skipped (see the class comment).
    _askingSocketId: string | undefined,
  ) {
    const collabOn = await this.addons.isAddonEnabled(ADDON_IDS.COLLAB);
    if (!collabOn || !(await this.addons.getCollabFeatures()).chat) throw aiRefusal('forbidden', 'Collab chat is off');
    if (!(await this.threads.findOwned(threadId, user.id, tripId))) {
      throw aiRefusal('not_found', 'Conversation not found');
    }
    const rowId = messageRowOf(messageId);
    const row = rowId === null ? null : await this.messages.findInThread(rowId, threadId);
    if (row?.role !== 'assistant') throw aiRefusal('not_found', 'Message not found');

    const created = await this.collab.postMessage(
      tripId,
      { text, origin: COLLAB_MESSAGE_ORIGIN_ASSISTANT },
      this.collab.restWriter(String(tripId), user, undefined),
    );
    const message = created.message;
    if (!message) throw aiRefusal('generic', 'The message could not be posted');
    return { message };
  }
}
