import { logInfo, logError } from '../audit/audit-log.logger';
import { DatabaseService } from '../database/database.service';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { purgeExpiredIdempotencyKeys } from './idempotency-cleanup';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Nightly 3 AM purge of expired idempotency keys (moved from src/scheduler.ts).
 * Registered as an AppModule provider beside the global IdempotencyInterceptor
 * that writes the keys — common/ has no module of its own.
 */
@Injectable()
export class IdempotencyCleanupJob implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('idempotency-cleanup', '0 3 * * *', () => this.tick());
  }

  tick(): void {
    try {
      const removed = purgeExpiredIdempotencyKeys(undefined, undefined, this.db);
      if (removed > 0) {
        logInfo(`Idempotency cleanup: removed ${removed} expired key(s)`);
      }
    } catch (err: unknown) {
      logError(`Idempotency cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }
}
