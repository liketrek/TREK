import type { AssistantThreadRow, AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type {
  AssistantToolCallRow,
  AssistantToolCallsRepository,
} from '../../db/repositories/AssistantToolCalls.repository';
import { withRequestContext } from '../database/request-context';
import { SettingsService } from '../settings/settings.service';
import { AssistantBookContext, bookTurnContext, emptyTripCard } from './assistant-book-context';
import { AssistantBookGate, openGate, type BookTurnGate } from './assistant-book-gate';
import { languageName, turnContext, type TripCard } from './assistant-context';
import { AssistantToolsService, type AssistantToolSession } from './assistant-tools.service';
import { tripCardFrom } from './assistant-trip-scope';
import { studioPrompt, systemPrompt } from './assistant.prompt';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import type { AssistantFocus, AssistantMention, AssistantScope } from '@trek/shared';

/**
 * What a conversation is about, a trip or a journey (`AssistantScope`), and
 * what follows from it: where its threads are kept, which tools a turn holds
 * (the tools that take a `tripId` or a `journeyId` run on the conversation's
 * own), and what the model reads beside the history. The agent loop, the
 * cards, the decisions and the undo are the same for both.
 */

/** The scope of a trip conversation. */
export function tripScope(tripId: number): AssistantScope {
  return { kind: 'trip', tripId };
}

/** The user's threads in one scope: every read and delete names the trip or journey next to the user. */
interface ScopedThreads {
  create(userId: number, title: string, at: string): Promise<number>;
  find(id: number, userId: number): Promise<AssistantThreadRow | null>;
  list(userId: number, limit: number): Promise<AssistantThreadRow[]>;
  remove(id: number, userId: number): Promise<boolean>;
}

export function scopedThreads(repo: AssistantThreadsRepository, scope: AssistantScope): ScopedThreads {
  if (scope.kind === 'trip') {
    const { tripId } = scope;
    return {
      create: (userId, title, at) => repo.createThread(userId, tripId, title, at),
      find: (id, userId) => repo.findOwned(id, userId, tripId),
      list: (userId, limit) => repo.listRecent(userId, tripId, limit),
      remove: (id, userId) => repo.deleteOwned(id, userId, tripId),
    };
  }
  const { journeyId } = scope;
  return {
    create: (userId, title, at) => repo.createJourneyThread(userId, journeyId, title, at),
    find: (id, userId) => repo.findOwnedOnJourney(id, userId, journeyId),
    list: (userId, limit) => repo.listRecentOnJourney(userId, journeyId, limit),
    remove: (id, userId) => repo.deleteOwnedOnJourney(id, userId, journeyId),
  };
}

/** A proposed change of one of the user's threads in this scope; null for anyone else's or another scope's. */
export function findScopedCall(
  repo: AssistantToolCallsRepository,
  scope: AssistantScope,
  id: string,
  userId: number,
): Promise<AssistantToolCallRow | null> {
  return scope.kind === 'trip'
    ? repo.findOwned(id, userId, scope.tripId)
    : repo.findOwnedOnJourney(id, userId, scope.journeyId);
}

/** What a turn knows about the user's request, whatever its scope. */
interface ScopeTurnInput {
  userId: number;
  locale: string;
  timeZone: string;
  focus: AssistantFocus | null;
  mentions: readonly AssistantMention[];
  now: Date;
}

/**
 * What a turn hands the model and the agent loop: the trip card the cards
 * read, the instructions, the context, and the gate its held calls pass
 * (a journey's checks book writes; a trip's lets every call through).
 */
interface ScopeTurn {
  card: TripCard;
  system: string;
  context: string;
  gate: BookTurnGate;
}

/** Opens a scope's tool sessions and writes what its turns read. */
@Injectable()
export class AssistantScopes {
  constructor(
    private readonly tools: AssistantToolsService,
    private readonly books: AssistantBookContext,
    private readonly bookGate: AssistantBookGate,
    private readonly settings: SettingsService,
    private readonly orm: MikroORM,
  ) {}

  /**
   * The tool session of a turn (or, with targets, of an undo). A journey's
   * offers the book's writes only to someone who may change the book.
   */
  async open(userId: number, scope: AssistantScope, undoTargets?: ReadonlySet<string>): Promise<AssistantToolSession> {
    if (scope.kind === 'trip') return this.tools.open(userId, scope.tripId, undoTargets);
    const canWrite = await withRequestContext(this.orm, () => this.books.canEdit(userId, scope.journeyId));
    return this.tools.openJourney(userId, scope.journeyId, canWrite, undoTargets);
  }

  /**
   * The card, instructions and context of one turn: for a trip the trip card
   * read through the turn's session and the user's units and trip notes; for a
   * journey the book card, the Studio's instructions and the check of its
   * book writes.
   */
  async turnOf(session: AssistantToolSession, scope: AssistantScope, turn: ScopeTurnInput): Promise<ScopeTurn> {
    const language = languageName(turn.locale);
    if (scope.kind === 'trip') {
      const card = await tripCardFrom(session, scope.tripId, turn.userId, turn.focus, turn.mentions);
      const prefs = await withRequestContext(this.orm, () => this.settings.getUserSettings(turn.userId));
      const context = turnContext(card, turn.timeZone, turn.now, prefs);
      return { card, system: systemPrompt(language), context, gate: openGate(session) };
    }
    const { journeyId } = scope;
    const book = await withRequestContext(this.orm, () => this.books.cardOf(turn.userId, journeyId, turn.focus));
    const context = bookTurnContext(book, turn.timeZone, turn.now);
    const gate = this.bookGate.forTurn(turn.userId, journeyId, session);
    const system = studioPrompt(language, book.role !== 'viewer');
    return { card: emptyTripCard(turn.userId), system, context, gate };
  }
}
