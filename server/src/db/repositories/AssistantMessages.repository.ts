import type { AssistantMessages } from '../entities/AssistantMessages.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * One `assistant_messages` row as stored. `parts` and `provider_state` are the
 * JSON texts of ASSISTANT_MESSAGE_PARTS and ASSISTANT_PROVIDER_STATE.
 */
export interface AssistantMessageRow {
  id: number;
  thread_id: number;
  role: string;
  parts: string;
  provider_state: string | null;
  status: string;
  model: string | null;
  created_at: string;
}

const _assistantMessageRowKeys: AssertRowKeys<AssistantMessageRow, AssistantMessages> = true;

/** A message to append; the JSON columns arrive encoded (`encodeJson`). */
interface AssistantMessageInsert {
  threadId: number;
  role: string;
  parts: string;
  providerState: string | null;
  status: string;
  model: string | null;
  createdAt: string;
}

/** What a message may still change: its parts, its status and the provider's items. */
interface AssistantMessagePatch {
  parts?: string;
  status?: string;
  providerState?: string | null;
}

type MessagesKyselyDB = Pick<DB, 'assistant_messages'>;

const COLUMNS = ['id', 'thread_id', 'role', 'parts', 'provider_state', 'status', 'model', 'created_at'] as const;

/** `assistant_messages`: the messages of a thread in the order they were written (by id). */
export class AssistantMessagesRepository extends TrekRepository<AssistantMessages> {
  private db() {
    return this.kysely<MessagesKyselyDB>();
  }

  async append(message: AssistantMessageInsert): Promise<number> {
    const row = await this.db()
      .insertInto('assistant_messages')
      .values({
        thread_id: message.threadId,
        role: message.role,
        parts: message.parts,
        provider_state: message.providerState,
        status: message.status,
        model: message.model,
        created_at: message.createdAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  async findInThread(id: number, threadId: number): Promise<AssistantMessageRow | null> {
    const row = await this.db()
      .selectFrom('assistant_messages')
      .select(COLUMNS)
      .where('id', '=', id)
      .where('thread_id', '=', threadId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** The last `limit` messages of a thread, oldest first. */
  async listLatest(threadId: number, limit: number): Promise<AssistantMessageRow[]> {
    const rows = await this.db()
      .selectFrom('assistant_messages')
      .select(COLUMNS)
      .where('thread_id', '=', threadId)
      .orderBy('id', 'desc')
      .limit(limit)
      .execute();
    return rows.reverse();
  }

  async update(id: number, patch: AssistantMessagePatch): Promise<void> {
    const set = {
      ...(patch.parts !== undefined ? { parts: patch.parts } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.providerState !== undefined ? { provider_state: patch.providerState } : {}),
    };
    if (Object.keys(set).length === 0) return;
    await this.nativeUpdate({ id }, set);
  }
}
