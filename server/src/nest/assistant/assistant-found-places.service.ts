import { AssistantMessages } from '../../db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../db/entities/AssistantToolCalls.entity';
import {
  ASSISTANT_MESSAGE_PARTS_WRITE,
  ASSISTANT_TOOL_ARGS,
  ASSISTANT_TOOL_PREVIEW_WRITE,
} from '../../db/json-columns';
import type {
  AssistantMessageRow,
  AssistantMessagesRepository,
} from '../../db/repositories/AssistantMessages.repository';
import type { AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type {
  AssistantToolCallRow,
  AssistantToolCallsRepository,
} from '../../db/repositories/AssistantToolCalls.repository';
import { dbNow } from '../../db/types';
import { encodeJson } from '../../utils/json-column';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { RateLimitService } from '../common/rate-limit.service';
import { UnitOfWork } from '../database/unit-of-work';
import {
  buildTripCard,
  categoriesFrom,
  todayIn,
  type CardCategory,
  type CardPlace,
  type TripCard,
} from './assistant-context';
import { partsOf, toThreadMessages } from './assistant-history';
import { AssistantStreamRegistry } from './assistant-stream.registry';
import { ADD_FOUND_PLACE_TOOL, TURNS_PER_MINUTE } from './assistant-tools.constants';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantCardContext } from './cards/card-context';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  categoryIdForKind,
  type AssistantAddFoundPlaceRequest,
  type AssistantAddFoundPlaceResponse,
  type AssistantFoundPlace,
  type AssistantMessage,
  type AssistantMessagePart,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/** What a suggestion reads of the trip: its days and places, and the categories a new place is filed in. */
const TRIP_READS: ReadonlySet<string> = new Set(['get_trip_summary', 'list_places', 'list_categories']);

/** Message rows searched for the place a suggestion names; the history a turn sends the provider. */
const SEARCHED_ROWS = 40;
/** Message rows the answer holding the suggestion is read back from; a thread is shown with as many. */
const THREAD_ROWS = 50;

/** The place a ref names, from the newest search results of the thread that hold it. */
function foundPlace(rows: readonly AssistantMessageRow[], ref: string): AssistantFoundPlace | null {
  for (const row of [...rows].reverse()) {
    for (const part of partsOf(row)) {
      if (part.type !== 'data-trek-places') continue;
      const place = part.data.places.find((candidate) => candidate.ref === ref);
      if (place) return place;
    }
  }
  return null;
}

/** The trip's own place a found one is: by its id, or by the same Google or OpenStreetMap id. */
function tripPlaceOf(place: AssistantFoundPlace, card: TripCard): CardPlace | null {
  for (const candidate of card.places.values()) {
    if (candidate.id === place.inTripPlaceId) return candidate;
    if (place.googlePlaceId !== null && candidate.googlePlaceId === place.googlePlaceId) return candidate;
    if (place.osmId !== null && candidate.osmId === place.osmId) return candidate;
  }
  return null;
}

/**
 * The arguments a found place is suggested with: the trip's own place on the
 * day when the trip has it (by its id, or by the same Google or OpenStreetMap
 * id), otherwise a new place with what the search found and the category its
 * kind most likely belongs in.
 */
function suggestionArgs(
  place: AssistantFoundPlace,
  dayId: number,
  card: TripCard,
  categories: readonly CardCategory[],
): Record<string, unknown> {
  const inTrip = tripPlaceOf(place, card);
  if (inTrip) return { via: 'assign_place_to_day', dayId, placeId: inTrip.id, name: inTrip.name };
  const categoryId = categoryIdForKind(place.kind, categories);
  return {
    via: 'create_and_assign_place',
    dayId,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    ...(place.address ? { address: place.address } : {}),
    ...(categoryId !== null ? { category_id: categoryId } : {}),
    ...(place.googlePlaceId ? { google_place_id: place.googlePlaceId } : {}),
    ...(place.osmId ? { osm_id: place.osmId } : {}),
  };
}

/**
 * "+ Day 3" on a place a search found: the place is proposed for the day as a
 * change card, held and decided like one the model proposed, but without a
 * model turn and without counting against the daily limit. The place comes
 * from the search results stored in the thread, never from the request, and
 * the day must be one of this trip's. Nothing is written to the trip here;
 * applying the card runs the tool with the user's own rights.
 */
@Injectable()
export class AssistantFoundPlacesService {
  constructor(
    @InjectRepository(AssistantThreads) private readonly threads: AssistantThreadsRepository,
    @InjectRepository(AssistantMessages) private readonly messages: AssistantMessagesRepository,
    @InjectRepository(AssistantToolCalls) private readonly toolCalls: AssistantToolCallsRepository,
    private readonly tools: AssistantToolsService,
    private readonly rateLimit: RateLimitService,
    private readonly streams: AssistantStreamRegistry,
    private readonly uow: UnitOfWork,
    private readonly cardContext: AssistantCardContext,
  ) {}

  /**
   * Proposes the place for the day in the user's thread and answers with the
   * answer that now holds the card: it joins the answer the search was in, so
   * it comes back under that answer's id. Refused while a turn of the user
   * runs (`busy`) and while the thread holds changes nobody decided on
   * (`decide_first`).
   */
  async add(
    userId: number,
    tripId: number,
    threadId: number,
    req: AssistantAddFoundPlaceRequest,
  ): Promise<AssistantAddFoundPlaceResponse> {
    if (!(await this.threads.findOwned(threadId, userId, tripId))) {
      throw aiRefusal('not_found', 'Conversation not found');
    }
    if (!(await this.rateLimit.check('assistant', String(userId), TURNS_PER_MINUTE, 60_000, Date.now()))) {
      throw aiRefusal('too_many_requests', 'Too many requests, try again in a minute');
    }
    const controller = new AbortController();
    if (!(await this.streams.claim(userId, controller))) {
      throw aiRefusal('busy', 'The assistant is already answering in another window');
    }
    try {
      await this.propose(userId, tripId, threadId, req);
    } finally {
      await this.streams.release(userId, controller);
    }
    return { message: await this.answerOf(threadId) };
  }

  private async propose(
    userId: number,
    tripId: number,
    threadId: number,
    req: AssistantAddFoundPlaceRequest,
  ): Promise<void> {
    if ((await this.toolCalls.listOpen(threadId)).length > 0) {
      throw aiRefusal('decide_first', 'Decide on the changes that are waiting first');
    }
    const place = foundPlace(await this.messages.listLatest(threadId, SEARCHED_ROWS), req.ref);
    if (!place) throw aiRefusal('generic', 'This place is not among the search results of the conversation');
    const { card, categories } = await this.tripOf(userId, tripId);
    if (!card.days.some((day) => day.id === req.dayId)) throw aiRefusal('generic', 'Day not found in this trip');

    const id = randomUUID();
    const args = suggestionArgs(place, req.dayId, card, categories);
    const names = new Map(categories.map((category): [number, string] => [category.id, category.name]));
    const ctx = this.cardContext.contextOf(card, names, req.locale, todayIn(req.timeZone, new Date()));
    const [{ preview }] = await this.cardContext.describeProposed(userId, tripId, ctx, [
      { id, toolName: ADD_FOUND_PLACE_TOOL, args },
    ]);
    const parts: AssistantMessagePart[] = [
      { type: 'tool-call', toolCallId: id, toolName: ADD_FOUND_PLACE_TOOL, args, approval: { id } },
      { type: 'data-trek-change', data: preview },
    ];
    const now = dbNow();
    await this.uow.transactional(async () => {
      const messageId = await this.messages.append({
        threadId,
        role: 'assistant',
        parts: encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, parts),
        providerState: null,
        status: 'awaiting_approval',
        model: null,
        createdAt: now,
      });
      await this.toolCalls.insertProposals([
        {
          id,
          threadId,
          messageId,
          providerCallId: `found_${id}`,
          toolName: ADD_FOUND_PLACE_TOOL,
          args: encodeJson(ASSISTANT_TOOL_ARGS, args),
          preview: encodeJson(ASSISTANT_TOOL_PREVIEW_WRITE, preview),
          createdAt: now,
        },
      ]);
      await this.threads.touch(threadId, now);
    });
  }

  /** The trip card and the categories, read through the trip tools with the user's rights. */
  private async tripOf(userId: number, tripId: number): Promise<{ card: TripCard; categories: CardCategory[] }> {
    const session = await this.tools.open(userId, tripId, TRIP_READS);
    try {
      const summary = await session.read('get_trip_summary');
      const places = await session.read('list_places');
      const listed = await session.read('list_categories');
      return {
        card: buildTripCard(tripId, userId, summary.ok ? summary.value : null, places.ok ? places.value : null, null),
        categories: categoriesFrom(listed.ok ? listed.value : null),
      };
    } finally {
      await session.close();
    }
  }

  /** The newest answer of the thread as the client shows it, with what became of its changes. */
  private async answerOf(threadId: number): Promise<AssistantMessage> {
    const rows = await this.messages.listLatest(threadId, THREAD_ROWS);
    const calls = new Map<string, AssistantToolCallRow>();
    const held = rows.filter((row) => partsOf(row).some((part) => part.type === 'tool-call' && part.approval));
    const lists = await Promise.all(held.map((row) => this.toolCalls.listByMessage(row.id)));
    for (const call of lists.flat()) calls.set(call.id, call);
    const messages = toThreadMessages(rows, calls, new Date());
    return messages[messages.length - 1];
  }
}
