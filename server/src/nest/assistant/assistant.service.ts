import { AssistantMessages } from '../../db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../db/entities/AssistantToolCalls.entity';
import {
  ASSISTANT_MESSAGE_PARTS_WRITE,
  ASSISTANT_PROVIDER_STATE,
  ASSISTANT_TOOL_ARGS,
  ASSISTANT_TOOL_PREVIEW,
  ASSISTANT_TOOL_PREVIEW_WRITE,
  ASSISTANT_TOOL_RESULT,
} from '../../db/json-columns';
import type {
  AssistantMessageRow,
  AssistantMessagesRepository,
} from '../../db/repositories/AssistantMessages.repository';
import type { AssistantThreadRow, AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type {
  AssistantToolCallRow,
  AssistantToolCallsRepository,
} from '../../db/repositories/AssistantToolCalls.repository';
import { dbNow, utcSuffix } from '../../db/types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { AiChatClientService } from '../ai-connections/ai-chat-client.service';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { AiConnectionsService } from '../ai-connections/ai-connections.service';
import type { ResolvedAiConnection } from '../ai-connections/ai-connections.types';
import { AiUsageService } from '../ai-connections/ai-usage.service';
import { logError } from '../audit/audit-log.logger';
import { conflict, DomainError } from '../common/domain-error';
import { RateLimitService } from '../common/rate-limit.service';
import { armKeepalive, type SseStream } from '../common/sse-stream';
import { withRequestContext } from '../database/request-context';
import { UnitOfWork } from '../database/unit-of-work';
import { SettingsService } from '../settings/settings.service';
import { runAgentLoop, type AgentStore, type HeldCall, type StepRecord } from './assistant-agent';
import { AssistantBookingImportService } from './assistant-booking-import.service';
import { mentionItems } from './assistant-cards.helpers';
import { todayIn } from './assistant-context';
import { DISCARDED, NOT_RUN, type Outcome, withCancelled, withOutcomes } from './assistant-decisions.helpers';
import { messageIdOf, outputText, partsOf, toChatHistory, toThreadMessages } from './assistant-history';
import { rememberForTrip } from './assistant-memory';
import { toolOutputForProvider } from './assistant-output';
import { AssistantScopes, findScopedCall, scopedThreads, tripScope } from './assistant-scope';
import { AssistantStreamRegistry } from './assistant-stream.registry';
import { titleFrom } from './assistant-title';
import {
  APPROVAL_TTL_MS,
  ASSISTANT_SERVER_WRITE_TOOLS,
  foundPlaceArgs,
  IMPORT_BOOKING_TOOL,
  READ_BOOKING_FILE_TOOL,
  REMEMBER_TOOL,
  TURNS_PER_MINUTE,
  UNDO_WINDOW_MS,
  writeToolOf,
} from './assistant-tools.constants';
import { AssistantToolsService, type AssistantToolSession, type ToolRun } from './assistant-tools.service';
import { readTripCard } from './assistant-trip-scope';
import { unchangedSinceApplied, undoSnapshotOf, undoTargetsOf } from './assistant-undo.helpers';
import { AssistantVision } from './assistant-vision';
import { AssistantCardContext } from './cards/card-context';
import { ASSISTANT_UNDO_MAP } from './cards/registry';
import { appliedChange } from './tool-call-preview.helpers';
import { UiStreamWriter } from './ui-stream.writer';
import { MikroORM } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  AssistantAttachmentRequest,
  AssistantChatRequest,
  AssistantClientCtx,
  AssistantDecision,
  AssistantDecisionsRequest,
  AssistantFocus,
  AssistantMention,
  AssistantMessagePart,
  AssistantScope,
  AssistantThreadListResponse,
  AssistantThreadResponse,
  AssistantThreadSummary,
  BookingImportPreviewItem,
} from '@trek/shared';

import { randomUUID } from 'node:crypto';

/** Threads the history list shows. */
const THREADS_LISTED = 20;
/** Message rows a thread is shown with. */
const THREAD_ROWS = 50;
/** Message rows a turn sends the provider. */
const HISTORY_ROWS = 120;

/** What the read step of an attached file answers when the file could not be read. */
const FILE_UNREADABLE = 'The file could not be read.';

/** The longest file name a message keeps. */
const MAX_FILE_NAME_CHARS = 255;

/** Where one applied change reports to: the stream, and what its message records. */
interface AppliedSink {
  w: UiStreamWriter;
  unrun: Set<string>;
  outcomes: Map<string, Outcome>;
  receipts: AssistantMessagePart[];
  /** The trip the conversation is on, for the receipts; null in a Studio conversation. */
  tripId: number | null;
}

/**
 * Where a streamed turn goes: the stream, which the turn opens only once every
 * refusal is past (a refusal before it is a JSON answer), and the signal that
 * the client went away.
 */
export interface TurnChannel {
  open(): SseStream;
  signal: AbortSignal;
}

/** What a turn runs with, whichever request started it. */
interface TurnSpec {
  userId: number;
  scope: AssistantScope;
  threadId: number;
  connection: ResolvedAiConnection;
  locale: string;
  timeZone: string;
  focus: AssistantFocus | null;
  mentions: readonly AssistantMention[];
  quota: { used: number; limit: number } | null;
  /** The row the first step writes into, when the turn created it already (a chat turn). */
  firstRowId: number | null;
  /** The client draws Studio pages for this turn (assistant-vision.ts). */
  renders?: boolean;
}

function summaryOf(thread: AssistantThreadRow): AssistantThreadSummary {
  return {
    id: thread.id,
    title: thread.title,
    lastMessageAt: utcSuffix(thread.last_message_at) ?? thread.last_message_at,
  };
}

function encodeParts(parts: AssistantMessagePart[]): string {
  return encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, parts);
}

const threadNotFound = () => aiRefusal('not_found', 'Conversation not found');

/**
 * The assistant: a user's conversations about one trip or (in TREK Studio)
 * one journey, the turns that answer them, the decisions on the changes a
 * turn proposes and the undo of an applied one. What differs between the two
 * scopes (the threads, the tools, the context) is AssistantScopes'.
 *
 * A turn checks everything that can refuse it first (the rate limit, the
 * connection, the daily limit, one turn per user at a time), so a refusal is
 * a JSON answer with its code; only then does it open the stream. Every write
 * a change makes goes through the MCP tools with the user's own rights (see
 * AssistantToolsService), with the arguments the server stored, never ones
 * the client sends back.
 */
@Injectable()
export class AssistantService {
  constructor(
    @InjectRepository(AssistantThreads) private readonly threads: AssistantThreadsRepository,
    @InjectRepository(AssistantMessages) private readonly messages: AssistantMessagesRepository,
    @InjectRepository(AssistantToolCalls) private readonly toolCalls: AssistantToolCallsRepository,
    private readonly connections: AiConnectionsService,
    private readonly chatClients: AiChatClientService,
    private readonly usage: AiUsageService,
    private readonly tools: AssistantToolsService,
    private readonly bookings: AssistantBookingImportService,
    private readonly settings: SettingsService,
    private readonly rateLimit: RateLimitService,
    private readonly streams: AssistantStreamRegistry,
    private readonly uow: UnitOfWork,
    private readonly orm: MikroORM,
    private readonly cardContext: AssistantCardContext,
    private readonly scopes: AssistantScopes,
    private readonly vision: AssistantVision,
  ) {}

  async listThreads(userId: number, scope: AssistantScope): Promise<AssistantThreadListResponse> {
    return { threads: (await scopedThreads(this.threads, scope).list(userId, THREADS_LISTED)).map(summaryOf) };
  }

  async getThread(userId: number, scope: AssistantScope, threadId: number): Promise<AssistantThreadResponse> {
    const thread = await scopedThreads(this.threads, scope).find(threadId, userId);
    if (!thread) throw threadNotFound();
    const rows = await this.messages.listLatest(threadId, THREAD_ROWS);
    return { thread: summaryOf(thread), messages: toThreadMessages(rows, await this.callsOf(rows), new Date()) };
  }

  async deleteThread(userId: number, scope: AssistantScope, threadId: number): Promise<void> {
    if (!(await scopedThreads(this.threads, scope).remove(threadId, userId))) throw threadNotFound();
  }

  /** Stops the user's running turn, wherever it runs; nothing to stop is not an error. */
  async stop(userId: number): Promise<void> {
    await this.streams.abort(userId);
  }

  /**
   * A new message, in a thread of the user's on this trip or journey or
   * (threadId null) a new one, answered as a stream.
   *
   * @txIndependent a streamed turn writes as it goes: the opening rows in one
   * transaction, then each step on its own, with the provider's answer between.
   */
  async chat(userId: number, scope: AssistantScope, req: AssistantChatRequest, channel: TurnChannel): Promise<void> {
    await this.admit(userId);
    const connection = await this.connections.resolveForUser(userId);
    const dailyTurns = await this.withinDailyLimit(userId, connection);
    await this.claimed(userId, channel.signal, async (signal) => {
      // Days, places and bookings are named with "@" in a trip only.
      const tripId = scope.kind === 'trip' ? scope.tripId : null;
      const mentions = tripId !== null ? (req.mentions ?? []) : [];
      // The labels the message keeps come from the trip, never from the request.
      const card = mentions.length > 0 && tripId !== null ? await readTripCard(this.tools, userId, tripId) : null;
      const items = card ? mentionItems(card, mentions, req.locale) : [];
      const begun = await this.beginTurn(userId, scope, req.threadId, req.text, connection.model, [
        { type: 'text', text: req.text },
        ...(items.length > 0 ? [{ type: 'data-trek-mentions' as const, data: { items } }] : []),
      ]);
      const stream = channel.open();
      const w = new UiStreamWriter(stream);
      w.start(messageIdOf(begun.rowId));
      if (begun.created) w.thread(begun.threadId, begun.title);
      await this.usage.record(userId, connection.paidBy, { turns: 1 });
      const quota =
        connection.paidBy === 'instance'
          ? { used: await this.usage.instanceTurnsToday(userId), limit: dailyTurns }
          : null;
      const spec: TurnSpec = {
        userId,
        scope,
        threadId: begun.threadId,
        connection,
        locale: req.locale,
        timeZone: req.timeZone,
        focus: req.focus ?? null,
        mentions,
        quota,
        firstRowId: begun.rowId,
        renders: req.renders === true,
      };
      await this.converse(spec, stream, w, signal);
    });
  }

  /**
   * A file the user attached, in a thread of theirs on this trip or (no
   * threadId) a new one, answered as a stream: the file is read into bookings
   * and each is proposed as a change card, applied or discarded like any
   * other. No model is asked here; the decision on the cards starts the next
   * answer. Refused like a chat turn, and also when nothing here reads files.
   *
   * @txIndependent the opening rows are one transaction and the proposals
   * another, with the file being read between them.
   */
  async attach(
    userId: number,
    tripId: number,
    req: AssistantAttachmentRequest,
    file: Express.Multer.File,
    channel: TurnChannel,
  ): Promise<void> {
    await this.admit(userId);
    await this.bookings.ensureReadable(userId, file);
    const connection = await this.connections.resolveForUser(userId);
    await this.withinDailyLimit(userId, connection);
    await this.claimed(userId, channel.signal, async (signal) => {
      const name = file.originalname.slice(0, MAX_FILE_NAME_CHARS);
      const begun = await this.beginTurn(userId, tripScope(tripId), req.threadId ?? null, name, connection.model, [
        { type: 'attachment', name, mime: file.mimetype || 'application/octet-stream', size: file.size },
      ]);
      const stream = channel.open();
      const w = new UiStreamWriter(stream);
      w.start(messageIdOf(begun.rowId));
      if (begun.created) w.thread(begun.threadId, begun.title);
      const stopKeepalive = armKeepalive(stream);
      try {
        const { locale, timeZone } = req;
        const turn = { userId, tripId, threadId: begun.threadId, rowId: begun.rowId, locale, timeZone, name };
        await this.proposeBookings(turn, file, w, signal);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logError(`[assistant] attachment in thread ${begun.threadId} failed: ${reason}`);
        w.error('generic');
        w.finish('error');
      } finally {
        stopKeepalive();
        w.close();
      }
    });
  }

  /**
   * The user's decisions on the changes the last step proposed: every one of
   * them, applied or discarded. The applied ones run with their stored
   * arguments, then the turn goes on with their results.
   *
   * @txIndependent the decisions are taken in one transaction; what follows is
   * a streamed turn that writes each change and each step on its own.
   */
  async decide(
    userId: number,
    scope: AssistantScope,
    threadId: number,
    req: AssistantDecisionsRequest,
    channel: TurnChannel,
  ): Promise<void> {
    if (!(await scopedThreads(this.threads, scope).find(threadId, userId))) throw threadNotFound();
    await this.admit(userId);
    const open = await this.toolCalls.listOpen(threadId);
    if (open.length > 0 && open.every((call) => ASSISTANT_SERVER_WRITE_TOOLS[call.tool_name]?.quiet === true)) {
      await this.decideQuietly(userId, scope, threadId, req, channel);
      return;
    }
    const connection = await this.connections.resolveForUser(userId);
    const dailyTurns = await this.withinDailyLimit(userId, connection);
    await this.claimed(userId, channel.signal, async (signal) => {
      const decided = await this.claimDecisions(threadId, req.decisions);
      // Taken but not run yet: whatever ends the turn before a change ran records it as failed.
      const unrun = new Set(decided.filter(({ approved }) => approved).map(({ call }) => call.id));
      try {
        const stream = channel.open();
        const w = new UiStreamWriter(stream);
        w.start(messageIdOf(await this.answerStart(threadId, decided[0].call.message_id)));
        const quota =
          connection.paidBy === 'instance'
            ? { used: await this.usage.instanceTurnsToday(userId), limit: dailyTurns }
            : null;
        const spec: TurnSpec = {
          userId,
          scope,
          threadId,
          connection,
          locale: req.locale,
          timeZone: req.timeZone,
          focus: null,
          mentions: [],
          quota,
          firstRowId: null,
          renders: req.renders === true,
        };
        await this.converse(spec, stream, w, signal, (session) =>
          this.applyDecisions((name, args) => this.runChange(session, userId, scope, name, args), threadId, decided, {
            w,
            unrun,
            scope,
          }),
        );
      } finally {
        if (unrun.size > 0) await this.failUnrun(threadId, decided, unrun);
      }
    });
  }

  /**
   * Decisions on changes the user proposed themselves (a found place for a
   * day, a taken proposal): applied or discarded like any others, but no model turn follows, so
   * neither the connection nor the daily limit is asked.
   *
   * @txIndependent like `decide`: the decisions in one transaction, then each
   * change runs its tool, which commits on its own, before it is recorded.
   */
  private async decideQuietly(
    userId: number,
    scope: AssistantScope,
    threadId: number,
    req: AssistantDecisionsRequest,
    channel: TurnChannel,
  ): Promise<void> {
    await this.claimed(userId, channel.signal, async () => {
      const decided = await this.claimDecisions(threadId, req.decisions);
      const unrun = new Set(decided.filter(({ approved }) => approved).map(({ call }) => call.id));
      const w = new UiStreamWriter(channel.open());
      let opened: AssistantToolSession | null = null;
      try {
        w.start(messageIdOf(await this.answerStart(threadId, decided[0].call.message_id)));
        const session = await this.scopes.open(userId, scope);
        opened = session;
        const run = (name: string, args: Record<string, unknown>) => this.runChange(session, userId, scope, name, args);
        await this.applyDecisions(run, threadId, decided, { w, unrun, scope });
        w.finish('stop');
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logError(`[assistant] decision in thread ${threadId} failed: ${reason}`);
        w.error('generic');
        w.finish('error');
      } finally {
        await opened?.close();
        w.close();
        if (unrun.size > 0) await this.failUnrun(threadId, decided, unrun);
      }
    });
  }

  /**
   * Runs one applied change: a booking from a file through the booking import,
   * a found place or a taken proposal through the tool it names, anything else through its own tool.
   * A booking and a trip note belong to a trip; a journey's session holds neither.
   */
  private runChange(
    session: AssistantToolSession,
    userId: number,
    scope: AssistantScope,
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolRun> {
    const tripId = scope.kind === 'trip' ? scope.tripId : null;
    if (name === IMPORT_BOOKING_TOOL && tripId !== null) {
      return this.inContext(() => this.bookings.apply(userId, tripId, args));
    }
    if (writeToolOf(name, args) !== name) return session.call(writeToolOf(name, args), foundPlaceArgs(args));
    if (name === REMEMBER_TOOL && tripId !== null) {
      return this.inContext(() => rememberForTrip(this.settings, userId, tripId, args));
    }
    return session.call(name, args);
  }

  /**
   * Takes an applied change back, once, within its window, and only while what
   * it created is as it left it; otherwise 409 and the change stays.
   *
   * @txIndependent the undo tool commits on its own between the claim and the
   * claim's release on failure, so the two cannot share a transaction.
   */
  async undo(userId: number, scope: AssistantScope, toolCallId: string): Promise<void> {
    await this.admit(userId);
    const call = await findScopedCall(this.toolCalls, scope, toolCallId, userId);
    if (!call) throw aiRefusal('not_found', 'Change not found');
    const stale = () => conflict('This change cannot be undone any more', { code: 'stale' });
    const args = decodeJson(ASSISTANT_TOOL_ARGS, call.args, `tool call ${call.id}`);
    const tool = writeToolOf(call.tool_name, args);
    const undo = ASSISTANT_UNDO_MAP[tool];
    const result = decodeJson(ASSISTANT_TOOL_RESULT, call.result, `tool call ${call.id}`);
    const preview = decodeJson(ASSISTANT_TOOL_PREVIEW, call.preview, `tool call ${call.id}`);
    const undoArgs = undo && call.state === 'executed' ? undo.args(args, result, preview) : null;
    if (!undo || !undoArgs) throw stale();
    const onTrip = scope.kind === 'trip';
    const session = await this.scopes.open(userId, scope, undoTargetsOf(undo.tool, tool, args, result, onTrip));
    try {
      const snapshot = await undoSnapshotOf(session, tool, args, result, { tripReads: onTrip });
      if (!snapshot || !unchangedSinceApplied(tool, result, snapshot, { args, preview })) throw stale();
      if (!(await this.toolCalls.claimUndo(call.id, userId, dbNow()))) throw stale();
      const run = await session.call(undo.tool, undoArgs);
      if (!run.ok) {
        await this.toolCalls.recordOutcome(call.id, 'executed', call.result, call.undo_until);
        throw stale();
      }
    } finally {
      await session.close();
    }
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private async admit(userId: number): Promise<void> {
    if (!(await this.rateLimit.check('assistant', String(userId), TURNS_PER_MINUTE, 60_000, Date.now()))) {
      throw aiRefusal('too_many_requests', 'Too many requests, try again in a minute');
    }
  }

  /**
   * Refuses a turn on the instance's connection once the user's turns of the
   * day reached the admin's limit; answers that limit. A decision counts no
   * turn of its own, but runs the model again, so it is held to the limit too.
   */
  private async withinDailyLimit(userId: number, connection: ResolvedAiConnection): Promise<number> {
    const { dailyTurns } = await this.connections.readSettings();
    if (connection.paidBy === 'instance' && (await this.usage.instanceTurnsToday(userId)) >= dailyTurns) {
      throw aiRefusal('daily_limit', 'The daily limit of the assistant is reached');
    }
    return dailyTurns;
  }

  /** Runs `fn` as the user's one running turn, stoppable from the client and from a `stop`. */
  private async claimed(
    userId: number,
    client: AbortSignal,
    fn: (signal: AbortSignal) => Promise<void>,
  ): Promise<void> {
    const controller = new AbortController();
    if (!(await this.streams.claim(userId, controller))) {
      throw aiRefusal('busy', 'The assistant is already answering in another window');
    }
    try {
      await fn(AbortSignal.any([client, controller.signal]));
    } finally {
      await this.streams.release(userId, controller);
    }
  }

  /**
   * A turn's opening rows, in one transaction: the thread (found or, with
   * `threadId` null, created and titled from `titleText`), the user's message,
   * and the row the answer's first step writes into. Changes still waiting in
   * the thread are cancelled: the user moved on.
   */
  private async beginTurn(
    userId: number,
    scope: AssistantScope,
    threadId: number | null,
    titleText: string,
    model: string,
    userParts: AssistantMessagePart[],
  ) {
    const now = dbNow();
    const threads = scopedThreads(this.threads, scope);
    return this.uow.transactional(async () => {
      let id: number;
      let title: string;
      if (threadId === null) {
        title = titleFrom(titleText);
        id = await threads.create(userId, title, now);
      } else {
        const thread = await threads.find(threadId, userId);
        if (!thread) throw threadNotFound();
        id = thread.id;
        title = thread.title;
        await this.cancelOpen(id, now);
      }
      const base = { threadId: id, providerState: null, createdAt: now };
      await this.messages.append({
        ...base,
        role: 'user',
        parts: encodeParts(userParts),
        status: 'complete',
        model: null,
      });
      const rowId = await this.messages.append({ ...base, role: 'assistant', parts: '[]', status: 'aborted', model });
      await this.threads.touch(id, now);
      return { threadId: id, title, created: threadId === null, rowId };
    });
  }

  /**
   * Reads the attached file and proposes what it found, in the answer's first
   * row: the read step, then one held `import_booking` change per booking,
   * each with its card. A file without bookings ends the answer with
   * `no_bookings_found`; one that cannot be read, with `generic`.
   *
   * @txIndependent the row is written once the file was read, in a
   * transaction of its own.
   */
  private async proposeBookings(
    turn: { userId: number; tripId: number; threadId: number; rowId: number; name: string } & AssistantClientCtx,
    file: Express.Multer.File,
    w: UiStreamWriter,
    signal: AbortSignal,
  ): Promise<void> {
    const readId = randomUUID();
    const readArgs = { name: turn.name };
    const readPart = (result: unknown, isError = false): AssistantMessagePart => ({
      type: 'tool-call',
      toolCallId: readId,
      toolName: READ_BOOKING_FILE_TOOL,
      args: readArgs,
      result,
      ...(isError ? { isError: true } : {}),
    });
    const fieldsOf = (parts: AssistantMessagePart[]) => ({ parts: encodeParts(parts), providerState: null });
    w.startStep();
    w.toolInput(readId, READ_BOOKING_FILE_TOOL, readArgs);
    let items: BookingImportPreviewItem[];
    try {
      items = await this.inContext(() => this.bookings.read(turn.userId, file));
    } catch (err) {
      logError(`[assistant] reading ${turn.name} failed: ${err instanceof Error ? err.message : String(err)}`);
      await this.saveRow(turn.threadId, turn.rowId, fieldsOf([readPart(FILE_UNREADABLE, true)]), 'error');
      w.toolError(readId, FILE_UNREADABLE);
      w.error('generic');
      w.finish('error');
      return;
    }
    const found = { bookings: items.map((item) => item.title) };
    if (signal.aborted) {
      await this.saveRow(turn.threadId, turn.rowId, fieldsOf([readPart(found)]), 'aborted');
      w.abort();
      return;
    }
    w.toolOutput(readId, found);
    if (items.length === 0) {
      await this.saveRow(turn.threadId, turn.rowId, fieldsOf([readPart(found)]), 'error');
      w.finishStep();
      w.error('no_bookings_found');
      w.finish('error');
      return;
    }
    const card = await readTripCard(this.tools, turn.userId, turn.tripId);
    const ctx = this.cardContext.contextOf(card, new Map(), turn.locale, todayIn(turn.timeZone, new Date()));
    const proposed = items.map((item) => ({
      id: randomUUID(),
      toolName: IMPORT_BOOKING_TOOL,
      args: item as Record<string, unknown>,
    }));
    const described = await this.cardContext.describeProposed(turn.userId, turn.tripId, ctx, proposed);
    const held: HeldCall[] = described.map((change) => ({ ...change, providerCallId: `import_${change.id}` }));
    const parts: AssistantMessagePart[] = [
      readPart(found),
      ...held.map((change): AssistantMessagePart => ({
        type: 'tool-call',
        toolCallId: change.id,
        toolName: change.toolName,
        args: change.args,
        approval: { id: change.id },
      })),
      ...held.map((change): AssistantMessagePart => ({ type: 'data-trek-change', data: change.preview })),
    ];
    await this.holdChanges(turn.threadId, turn.rowId, fieldsOf(parts), held);
    for (const change of held) {
      w.toolInput(change.id, change.toolName, change.args);
      w.approvalRequest(change.id);
      w.change(change.preview);
    }
    w.finishStep();
    w.finish('tool-calls');
  }

  private async cancelOpen(threadId: number, now: string): Promise<void> {
    const open = await this.toolCalls.listOpen(threadId);
    const claimed = await Promise.all(
      open.map((call) => this.toolCalls.claimDecision(call.id, threadId, false, dbNow(new Date(0)), now)),
    );
    const cancelled = new Set(open.filter((_call, i) => claimed[i]).map((call) => call.id));
    await Promise.all(
      [...new Set(open.map((call) => call.message_id))].map((id) => this.markCancelled(id, threadId, cancelled)),
    );
  }

  /** Marks the cancelled changes of one message as such, and the message as done. */
  private async markCancelled(messageId: number, threadId: number, cancelled: ReadonlySet<string>): Promise<void> {
    const row = await this.messages.findInThread(messageId, threadId);
    if (!row) return;
    const parts = withCancelled(partsOf(row), cancelled);
    await this.messages.update(messageId, { parts: encodeParts(parts), status: 'complete' });
  }

  /**
   * Records the decisions, each only while its change still waits and is less
   * than a day old. The request must name every waiting change and nothing
   * else (422); when none could be taken any more, 409.
   */
  private async claimDecisions(
    threadId: number,
    decisions: AssistantDecision[],
  ): Promise<Array<{ call: AssistantToolCallRow; approved: boolean }>> {
    const open = await this.toolCalls.listOpen(threadId);
    if (open.length === 0) throw conflict('No change is waiting for a decision', { code: 'generic' });
    const wanted = new Map(decisions.map((decision) => [decision.toolCallId, decision.approved]));
    const complete =
      wanted.size === decisions.length && wanted.size === open.length && open.every((call) => wanted.has(call.id));
    if (!complete) {
      throw new DomainError(422, 'Decide on every change that is waiting', { details: { code: 'generic' } });
    }
    const now = new Date();
    const notBefore = dbNow(new Date(now.getTime() - APPROVAL_TTL_MS));
    // In the order the decisions name them, the order the chat shows the changes in: the changes of one step
    // share their time, and their ids sort at random, so only this order lets "undo all" walk them back.
    const position = new Map(decisions.map((decision, i) => [decision.toolCallId, i]));
    const ordered = [...open].sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0));
    const decided = await this.uow.transactional(async () => {
      const claims = ordered.map((call) => ({ call, approved: wanted.get(call.id) === true }));
      const taken = await Promise.all(
        claims.map(({ call, approved }) =>
          this.toolCalls.claimDecision(call.id, threadId, approved, notBefore, dbNow(now)),
        ),
      );
      return claims.filter((_claim, i) => taken[i]);
    });
    if (decided.length === 0) {
      throw conflict('These changes were decided already or have expired', { code: 'generic' });
    }
    return decided;
  }

  /**
   * Runs the applied changes (and only those) with their stored arguments,
   * streams each result and receipt, and writes the outcome into the message
   * that proposed them. `run` runs one change: through its tool, or, for a
   * booking from a file, through the booking import.
   *
   * @txIndependent every change runs its tool, which commits on its own,
   * before its outcome is recorded; a later failure must not take back an
   * earlier change's record.
   */
  private async applyDecisions(
    run: (name: string, args: Record<string, unknown>) => Promise<ToolRun>,
    threadId: number,
    decided: Array<{ call: AssistantToolCallRow; approved: boolean }>,
    { w, unrun, scope }: { w: UiStreamWriter; unrun: Set<string>; scope: AssistantScope },
  ): Promise<void> {
    const outcomes = new Map<string, Outcome>();
    const receipts: AssistantMessagePart[] = [];
    const tripId = scope.kind === 'trip' ? scope.tripId : null;
    // One after another: a change may build on the one before it.
    await decided.reduce<Promise<void>>(async (previous, { call, approved }) => {
      await previous;
      await this.applyOne(run, call, approved, { w, unrun, outcomes, receipts, tripId });
    }, Promise.resolve());
    await this.recordDecided(threadId, decided[0].call.message_id, outcomes, receipts);
  }

  /** Runs one decided change, or records it as discarded, and tells the client what became of it. */
  private async applyOne(
    run: (name: string, args: Record<string, unknown>) => Promise<ToolRun>,
    call: AssistantToolCallRow,
    approved: boolean,
    { w, unrun, outcomes, receipts, tripId }: AppliedSink,
  ): Promise<void> {
    if (!approved) {
      w.toolDenied(call.id);
      outcomes.set(call.id, { approved: false, result: DISCARDED, isError: false });
      return;
    }
    const args = decodeJson(ASSISTANT_TOOL_ARGS, call.args, `tool call ${call.id}`);
    const ran = await run(call.tool_name, args);
    const output = toolOutputForProvider(call.tool_name, ran.value);
    const preview = decodeJson(ASSISTANT_TOOL_PREVIEW, call.preview, `tool call ${call.id}`);
    const undoable = ran.ok && !!ASSISTANT_UNDO_MAP[writeToolOf(call.tool_name, args)]?.args(args, ran.value, preview);
    const undoUntil = undoable ? dbNow(new Date(Date.now() + UNDO_WINDOW_MS)) : null;
    await this.inContext(() =>
      this.toolCalls.recordOutcome(
        call.id,
        ran.ok ? 'executed' : 'failed',
        encodeJson(ASSISTANT_TOOL_RESULT, ran.value),
        undoUntil,
      ),
    );
    unrun.delete(call.id);
    outcomes.set(call.id, { approved: true, result: output, isError: !ran.ok });
    if (!ran.ok) {
      w.toolError(call.id, outputText(output));
      return;
    }
    w.toolOutput(call.id, output);
    const applied = appliedChange(
      call.tool_name,
      call.id,
      args,
      ran.value,
      preview?.dayId ?? null,
      utcSuffix(undoUntil),
      { preview, tripId },
    );
    if (applied) {
      w.applied(applied);
      receipts.push({ type: 'data-trek-applied', data: applied });
    }
    this.cardContext.receipt(w, receipts, call, args, ran.value, preview);
  }

  /**
   * The approved changes the turn ended before running (the tool session did
   * not open, the stream broke): recorded as failed, so the thread shows them
   * as not applied and nobody takes them for a change that ran.
   *
   * @txIndependent each outcome is written on its own, like the ones that ran.
   */
  private async failUnrun(
    threadId: number,
    decided: Array<{ call: AssistantToolCallRow; approved: boolean }>,
    unrun: ReadonlySet<string>,
  ): Promise<void> {
    const outcomes = new Map<string, Outcome>();
    for (const { call, approved } of decided) {
      if (!approved) outcomes.set(call.id, { approved: false, result: DISCARDED, isError: false });
      else if (unrun.has(call.id)) outcomes.set(call.id, { approved: true, result: NOT_RUN, isError: true });
    }
    const failed = decided.filter(({ call, approved }) => approved && unrun.has(call.id));
    await Promise.all(
      failed.map(({ call }) =>
        this.inContext(() =>
          this.toolCalls.recordOutcome(call.id, 'failed', encodeJson(ASSISTANT_TOOL_RESULT, NOT_RUN), null),
        ),
      ),
    );
    await this.recordDecided(threadId, decided[0].call.message_id, outcomes, []);
  }

  /** Writes what became of the decided changes into the message that proposed them. */
  private async recordDecided(
    threadId: number,
    messageId: number,
    outcomes: ReadonlyMap<string, Outcome>,
    receipts: AssistantMessagePart[],
  ): Promise<void> {
    await this.inContext(async () => {
      const row = await this.messages.findInThread(messageId, threadId);
      if (!row) return;
      const parts = withOutcomes(partsOf(row), outcomes);
      await this.messages.update(messageId, { parts: encodeParts([...parts, ...receipts]), status: 'complete' });
    });
  }

  /** The first row of the answer a step belongs to: the message id the client knows it under. */
  private async answerStart(threadId: number, rowId: number): Promise<number> {
    const rows = await this.messages.listLatest(threadId, HISTORY_ROWS);
    let index = rows.findIndex((row) => row.id === rowId);
    if (index < 0) return rowId;
    while (index > 0 && rows[index - 1].role === 'assistant') index--;
    return rows[index].id;
  }

  /** The tool call rows behind the held changes of these messages, by id. */
  private async callsOf(rows: readonly AssistantMessageRow[]): Promise<Map<string, AssistantToolCallRow>> {
    const held = rows.filter((row) => partsOf(row).some((part) => part.type === 'tool-call' && part.approval));
    const lists = await Promise.all(held.map((row) => this.toolCalls.listByMessage(row.id)));
    return new Map(lists.flat().map((call) => [call.id, call]));
  }

  /**
   * The turn itself, once the stream is open: the tool session, the trip or
   * book card, the history, then the agent loop. Whatever fails after this
   * point ends the stream with an error chunk instead of a JSON answer.
   *
   * @txIndependent each step is saved when it is complete, with the provider's
   * answer and the tool calls between two saves.
   */
  private async converse(
    spec: TurnSpec,
    stream: SseStream,
    w: UiStreamWriter,
    signal: AbortSignal,
    prelude?: (session: AssistantToolSession) => Promise<void>,
  ): Promise<void> {
    const stopKeepalive = armKeepalive(stream);
    let opened: AssistantToolSession | null = null;
    try {
      const session = await this.scopes.open(spec.userId, spec.scope);
      opened = session;
      if (prelude) await prelude(session);
      const { card, system, context, gate } = await this.scopes.turnOf(session, spec.scope, {
        ...spec,
        now: new Date(),
      });
      const rows = await this.inContext(() => this.messages.listLatest(spec.threadId, HISTORY_ROWS));
      const calls = await this.inContext(() => this.callsOf(rows));
      const providerIds = new Map([...calls.values()].map((call) => [call.id, call.provider_call_id]));
      const history = toChatHistory(rows, providerIds);
      const today = todayIn(spec.timeZone, new Date());
      const { userId, threadId, connection } = spec;
      const seen = { userId, threadId, connection, renders: spec.renders === true, w, signal };
      const seeing = await this.vision.turnTools(spec.scope, session, seen);
      const outcome = await runAgentLoop(
        {
          client: this.chatClients.create(spec.connection),
          tools: seeing.tools,
          store: this.stepStore(spec),
          describe: this.cardContext.forTurn(gate.reader, card, spec.locale, today).describe,
          refusalOf: gate.refusalOf,
          vision: seeing.vision,
          newId: randomUUID,
          quota: spec.quota,
          card,
          today,
        },
        {
          system,
          context,
          cacheKey: `trek-thread-${spec.threadId}`,
          history,
          usedCallIds: new Set(
            history.flatMap((message) =>
              message.role === 'assistant' ? message.toolCalls.map((call) => call.id) : [],
            ),
          ),
        },
        w,
        signal,
      );
      await this.inContext(async () => {
        if (outcome.end !== 'aborted') {
          await this.connections.noteOutcome(spec.connection, outcome.end === 'failed' ? outcome.code : null);
        }
        await this.usage.record(spec.userId, spec.connection.paidBy, {
          inputTokens: outcome.inputTokens,
          cachedInputTokens: outcome.cachedInputTokens,
          outputTokens: outcome.outputTokens,
        });
      });
    } catch (err) {
      logError(
        `[assistant] turn in thread ${spec.threadId} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      w.error('generic');
      w.finish('error');
    } finally {
      stopKeepalive();
      await opened?.close();
      w.close();
    }
  }

  /**
   * Where the loop keeps its steps: one row each, the chat turn's first one made already.
   * @txIndependent each step is opened and saved on its own, with a provider's answer between them.
   */
  private stepStore(spec: TurnSpec): AgentStore {
    let first = spec.firstRowId;
    const fields = (step: StepRecord) => ({
      parts: encodeParts(step.parts),
      providerState: step.providerState ? encodeJson(ASSISTANT_PROVIDER_STATE, step.providerState) : null,
    });
    return {
      openStep: async () => {
        if (first !== null) {
          const rowId = first;
          first = null;
          return rowId;
        }
        return this.inContext(() =>
          this.messages.append({
            threadId: spec.threadId,
            role: 'assistant',
            parts: '[]',
            providerState: null,
            status: 'aborted',
            model: spec.connection.model,
            createdAt: dbNow(),
          }),
        );
      },
      saveStep: (rowId, step, status) => this.saveRow(spec.threadId, rowId, fields(step), status),
      holdStep: (rowId, step, held) => this.holdChanges(spec.threadId, rowId, fields(step), held),
    };
  }

  /** Writes a finished step into its row. */
  private saveRow(
    threadId: number,
    rowId: number,
    fields: { parts: string; providerState: string | null },
    status: 'complete' | 'aborted' | 'error',
  ): Promise<void> {
    return this.inContext(() =>
      this.uow.transactional(async () => {
        await this.messages.update(rowId, { ...fields, status });
        await this.threads.touch(threadId, dbNow());
      }),
    );
  }

  /** Writes a step that ends waiting for the user, together with the changes it holds. */
  private holdChanges(
    threadId: number,
    rowId: number,
    fields: { parts: string; providerState: string | null },
    held: HeldCall[],
  ): Promise<void> {
    return this.inContext(() =>
      this.uow.transactional(async () => {
        const now = dbNow();
        await this.toolCalls.insertProposals(held.map((change) => this.proposalOf(threadId, rowId, change, now)));
        await this.messages.update(rowId, { ...fields, status: 'awaiting_approval' });
        await this.threads.touch(threadId, now);
      }),
    );
  }

  private proposalOf(threadId: number, messageId: number, change: HeldCall, createdAt: string) {
    return {
      id: change.id,
      threadId,
      messageId,
      providerCallId: change.providerCallId,
      toolName: change.toolName,
      args: encodeJson(ASSISTANT_TOOL_ARGS, change.args),
      preview: encodeJson(ASSISTANT_TOOL_PREVIEW_WRITE, change.preview),
      createdAt,
    };
  }

  /**
   * A database step of a streaming turn in a context of its own: the request's
   * would otherwise carry everything the turn touched for as long as it streams.
   */
  private inContext<T>(fn: () => Promise<T>): Promise<T> {
    return withRequestContext(this.orm, fn);
  }
}
