import type { AssistantUsage } from '../entities/AssistantUsage.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type AssistantUsageKyselyDB = Pick<DB, 'assistant_usage'>;

/** What one turn adds to a user's day. */
interface AssistantUsageDelta {
  turns: number;
  inputTokens: number;
  outputTokens: number;
}

/**
 * `assistant_usage`: turns and tokens per user, UTC day and payer
 * (`instance` or `user`). The day is always bound by the caller (`todayUtc()`),
 * as in `GoogleApiUsageRepository`; adding to a day is an additive upsert,
 * which `em.upsert`'s merge cannot express, hence Kysely.
 */
export class AssistantUsageRepository extends TrekRepository<AssistantUsage> {
  private db() {
    return this.kysely<AssistantUsageKyselyDB>();
  }

  async add(userId: number, day: string, paidBy: string, delta: AssistantUsageDelta): Promise<void> {
    await this.db()
      .insertInto('assistant_usage')
      .values({
        user_id: userId,
        day,
        paid_by: paidBy,
        turns: delta.turns,
        input_tokens: delta.inputTokens,
        output_tokens: delta.outputTokens,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'day', 'paid_by']).doUpdateSet({
          turns: (eb) => eb('assistant_usage.turns', '+', eb.ref('excluded.turns')),
          input_tokens: (eb) => eb('assistant_usage.input_tokens', '+', eb.ref('excluded.input_tokens')),
          output_tokens: (eb) => eb('assistant_usage.output_tokens', '+', eb.ref('excluded.output_tokens')),
        }),
      )
      .execute();
  }

  /** The turns a user took on `day` paid by `paidBy`, 0 without a row. */
  async turnsOn(userId: number, day: string, paidBy: string): Promise<number> {
    const row = await this.db()
      .selectFrom('assistant_usage')
      .select('turns')
      .where('user_id', '=', userId)
      .where('day', '=', day)
      .where('paid_by', '=', paidBy)
      .executeTakeFirst();
    return row?.turns ?? 0;
  }

  /** Drops the days before `day` (exclusive); answers how many rows went. */
  async deleteBefore(day: string): Promise<number> {
    const result = await this.db().deleteFrom('assistant_usage').where('day', '<', day).executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}
