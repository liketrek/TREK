import type { AssistantToolCalls } from '../entities/AssistantToolCalls.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * One `assistant_tool_calls` row as stored. `args`, `preview` and `result` are
 * the JSON texts of ASSISTANT_TOOL_ARGS, ASSISTANT_TOOL_PREVIEW and
 * ASSISTANT_TOOL_RESULT.
 */
export interface AssistantToolCallRow {
  id: string;
  thread_id: number;
  message_id: number;
  provider_call_id: string;
  tool_name: string;
  args: string;
  preview: string;
  state: string;
  result: string | null;
  undo_until: string | null;
  created_at: string;
  decided_at: string | null;
}

const _assistantToolCallRowKeys: AssertRowKeys<AssistantToolCallRow, AssistantToolCalls> = true;

/** A proposed change as the loop records it, waiting for the user. */
interface AssistantToolCallInsert {
  id: string;
  threadId: number;
  messageId: number;
  providerCallId: string;
  toolName: string;
  args: string;
  preview: string;
  createdAt: string;
}

type ToolCallsKyselyDB = Pick<DB, 'assistant_tool_calls'>;

const COLUMNS = [
  'id',
  'thread_id',
  'message_id',
  'provider_call_id',
  'tool_name',
  'args',
  'preview',
  'state',
  'result',
  'undo_until',
  'created_at',
  'decided_at',
] as const;

/**
 * `assistant_tool_calls`: the changes the assistant proposed. Every state
 * change is one conditional UPDATE that only succeeds from the state it
 * expects, so two requests deciding or undoing the same call cannot both win.
 */
export class AssistantToolCallsRepository extends TrekRepository<AssistantToolCalls> {
  private db() {
    return this.kysely<ToolCallsKyselyDB>();
  }

  async insertProposals(calls: AssistantToolCallInsert[]): Promise<void> {
    if (calls.length === 0) return;
    await this.db()
      .insertInto('assistant_tool_calls')
      .values(
        calls.map((call) => ({
          id: call.id,
          thread_id: call.threadId,
          message_id: call.messageId,
          provider_call_id: call.providerCallId,
          tool_name: call.toolName,
          args: call.args,
          preview: call.preview,
          created_at: call.createdAt,
        })),
      )
      .execute();
  }

  async findInThread(id: string, threadId: number): Promise<AssistantToolCallRow | null> {
    const row = await this.db()
      .selectFrom('assistant_tool_calls')
      .select(COLUMNS)
      .where('id', '=', id)
      .where('thread_id', '=', threadId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** A call of one of the user's threads on that trip; null for anyone else's or another trip's. */
  async findOwned(id: string, userId: number, tripId: number): Promise<AssistantToolCallRow | null> {
    return this.findOwnedBy(id, userId, 'assistant_threads.trip_id', tripId);
  }

  /** A call of one of the user's threads on that journey; null for anyone else's or another journey's. */
  async findOwnedOnJourney(id: string, userId: number, journeyId: number): Promise<AssistantToolCallRow | null> {
    return this.findOwnedBy(id, userId, 'assistant_threads.journey_id', journeyId);
  }

  /** A call of one of the user's home threads; null for anyone else's or one on a trip or a journey. */
  async findOwnedAtHome(id: string, userId: number): Promise<AssistantToolCallRow | null> {
    const row = await this.kysely<Pick<DB, 'assistant_tool_calls' | 'assistant_threads'>>()
      .selectFrom('assistant_tool_calls')
      .innerJoin('assistant_threads', 'assistant_threads.id', 'assistant_tool_calls.thread_id')
      .selectAll('assistant_tool_calls')
      .where('assistant_tool_calls.id', '=', id)
      .where('assistant_threads.user_id', '=', userId)
      .where('assistant_threads.trip_id', 'is', null)
      .where('assistant_threads.journey_id', 'is', null)
      .executeTakeFirst();
    return row ?? null;
  }

  private async findOwnedBy(
    id: string,
    userId: number,
    owner: 'assistant_threads.trip_id' | 'assistant_threads.journey_id',
    ownerId: number,
  ): Promise<AssistantToolCallRow | null> {
    const row = await this.kysely<Pick<DB, 'assistant_tool_calls' | 'assistant_threads'>>()
      .selectFrom('assistant_tool_calls')
      .innerJoin('assistant_threads', 'assistant_threads.id', 'assistant_tool_calls.thread_id')
      .selectAll('assistant_tool_calls')
      .where('assistant_tool_calls.id', '=', id)
      .where('assistant_threads.user_id', '=', userId)
      .where(owner, '=', ownerId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** The calls one message proposed, in the order they were stored. */
  async listByMessage(messageId: number): Promise<AssistantToolCallRow[]> {
    return this.db()
      .selectFrom('assistant_tool_calls')
      .select(COLUMNS)
      .where('message_id', '=', messageId)
      .orderBy('created_at')
      .orderBy('id')
      .execute();
  }

  /**
   * The calls of a thread still waiting for a decision, proposed at or after
   * `notBefore`: an older one has expired, as the thread shows it and as
   * `claimDecision` refuses it, even before the nightly sweep marks it so.
   */
  async listOpen(threadId: number, notBefore: string): Promise<AssistantToolCallRow[]> {
    return this.db()
      .selectFrom('assistant_tool_calls')
      .select(COLUMNS)
      .where('thread_id', '=', threadId)
      .where('state', '=', 'approval_requested')
      .where('created_at', '>=', notBefore)
      .orderBy('created_at')
      .orderBy('id')
      .execute();
  }

  /**
   * Records a decision on a call that is still waiting and was proposed at or
   * after `notBefore`; false when it was decided already, expired or is not in
   * the thread.
   */
  async claimDecision(
    id: string,
    threadId: number,
    approved: boolean,
    notBefore: string,
    decidedAt: string,
  ): Promise<boolean> {
    const result = await this.db()
      .updateTable('assistant_tool_calls')
      .set({ state: approved ? 'approved' : 'rejected', decided_at: decidedAt })
      .where('id', '=', id)
      .where('thread_id', '=', threadId)
      .where('state', '=', 'approval_requested')
      .where('created_at', '>=', notBefore)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** What running an approved call came to: `executed` or `failed`, its result, and how long it may be undone. */
  async recordOutcome(id: string, state: string, result: string | null, undoUntil: string | null): Promise<void> {
    await this.nativeUpdate({ id }, { state, result, undo_until: undoUntil });
  }

  /**
   * Takes the undo of an executed call of one of the user's threads while its
   * window is open; true for exactly one caller.
   */
  async claimUndo(id: string, userId: number, now: string): Promise<boolean> {
    const result = await this.kysely<Pick<DB, 'assistant_tool_calls' | 'assistant_threads'>>()
      .updateTable('assistant_tool_calls')
      .set({ state: 'undone' })
      .where('id', '=', id)
      .where('state', '=', 'executed')
      .where('undo_until', '>', now)
      .where('thread_id', 'in', (eb) =>
        eb
          .selectFrom('assistant_threads')
          .select('assistant_threads.id')
          .where('assistant_threads.user_id', '=', userId),
      )
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  /** Sets the calls still waiting since before `cutoff` to `expired`; answers which, with their message. */
  async expireBefore(cutoff: string): Promise<Array<{ id: string; message_id: number }>> {
    return this.db()
      .updateTable('assistant_tool_calls')
      .set({ state: 'expired' })
      .where('state', '=', 'approval_requested')
      .where('created_at', '<', cutoff)
      .returning(['id', 'message_id'])
      .execute();
  }
}
