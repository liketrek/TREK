import { AssistantThreads } from '../../db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../db/entities/AssistantToolCalls.entity';
import type { AssistantThreadsRepository } from '../../db/repositories/AssistantThreads.repository';
import type { AssistantToolCallsRepository } from '../../db/repositories/AssistantToolCalls.repository';
import { dbNow } from '../../db/types';
import { AiConnectionsService } from '../ai-connections/ai-connections.service';
import { AiUsageService } from '../ai-connections/ai-usage.service';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { decisionCutoff } from './assistant-tools.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/** How long the daily usage rows are kept: a year and a bit, for a year's comparison. */
export const ASSISTANT_USAGE_RETENTION_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Nightly sweep of the assistant's conversations: threads nobody wrote in
 * for longer than the admin's retention (none under "forever"), threads of
 * users who no longer belong to their trip or journey, changes that waited a day
 * without a decision (expired, so no card waits forever), and usage days
 * older than the usage retention.
 */
@Injectable()
export class AssistantRetentionJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(AssistantThreads) private readonly threads: AssistantThreadsRepository,
    @InjectRepository(AssistantToolCalls) private readonly toolCalls: AssistantToolCallsRepository,
    private readonly connections: AiConnectionsService,
    private readonly usage: AiUsageService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('assistant-retention', '45 3 * * *', () => this.tick());
  }

  /**
   * @txIndependent a retention sweep in passes, each complete on its own: a
   * pass that fails leaves the others' work standing.
   */
  async tick(now: Date = new Date()): Promise<void> {
    try {
      const { retention } = await this.connections.readSettings();
      const idle =
        retention.mode === 'days'
          ? await this.threads.deleteIdleBefore(dbNow(new Date(now.getTime() - retention.days * DAY_MS)))
          : 0;
      const orphaned = await this.threads.deleteWithoutAccess();
      if (idle + orphaned > 0) logInfo(`Assistant retention: removed ${idle + orphaned} conversation(s)`);
      const expired = await this.toolCalls.expireBefore(decisionCutoff(now));
      if (expired.length > 0) logInfo(`Assistant retention: ${expired.length} proposed change(s) expired`);
      await this.usage.purgeOlderThan(ASSISTANT_USAGE_RETENTION_DAYS);
    } catch (err: unknown) {
      logError(`Assistant retention: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
