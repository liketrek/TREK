import { AssistantUsage } from '../../db/entities/AssistantUsage.entity';
import type { AssistantUsageRepository } from '../../db/repositories/AssistantUsage.repository';
import { logDebug } from '../audit/audit-log.logger';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { todayUtc, type AiConnectionScope } from '@trek/shared';

/**
 * What the assistant used, per user, UTC day and payer: the turns the daily
 * limit counts (only those the instance pays for) and the tokens behind them.
 * The day is the UTC calendar day, so a limit resets at midnight UTC.
 */
@Injectable()
export class AiUsageService {
  constructor(@InjectRepository(AssistantUsage) private readonly usage: AssistantUsageRepository) {}

  /**
   * Adds a turn's usage to today's row; the turn itself is counted once, when
   * it starts. How much of the input came from the provider's prompt cache is
   * only logged, to see what the cache saves.
   */
  async record(
    userId: number,
    paidBy: AiConnectionScope,
    delta: { turns?: number; inputTokens?: number; cachedInputTokens?: number; outputTokens?: number },
  ): Promise<void> {
    if (delta.inputTokens) {
      logDebug(
        `[assistant] turn of user ${userId}: ${delta.inputTokens} input tokens, ` +
          `${delta.cachedInputTokens ?? 0} of them from the prompt cache, ${delta.outputTokens ?? 0} output tokens`,
      );
    }
    await this.usage.add(userId, todayUtc(), paidBy, {
      turns: delta.turns ?? 0,
      inputTokens: delta.inputTokens ?? 0,
      outputTokens: delta.outputTokens ?? 0,
    });
  }

  /** The turns a user took today on the instance's connection. */
  async instanceTurnsToday(userId: number): Promise<number> {
    return this.usage.turnsOn(userId, todayUtc(), 'instance');
  }

  /** Retention: drops the days older than `days`; answers how many rows went. */
  async purgeOlderThan(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    return this.usage.deleteBefore(cutoff);
  }
}
