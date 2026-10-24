import { IdempotencyKeys } from '../../db/entities/IdempotencyKeys.entity';
import type { IdempotencyKeysRepository } from '../../db/repositories/IdempotencyKeys.repository';
import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { purgeExpiredIdempotencyKeys } from './idempotency-cleanup';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Nightly 3 AM purge of expired idempotency keys (moved from src/scheduler.ts).
 * Registered as an AppModule provider beside the global IdempotencyInterceptor
 * that writes the keys — common/ has no module of its own.
 */
@Injectable()
export class IdempotencyCleanupJob implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(IdempotencyKeys) private readonly idempotencyKeys: IdempotencyKeysRepository,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // Plan 4 Task 1: `tick()` now reads/writes through `IdempotencyKeysRepository`
    // (see `purgeExpiredIdempotencyKeys`) rather than raw `DatabaseService.prepare`
    // — the tick itself already runs inside a request context —
    // CronRegistrarService.register wraps every job's onTick in one place, so
    // this needs no wrapper of its own even with a repository read/write.
    this.registrar.register('idempotency-cleanup', '0 3 * * *', () => this.tick());
  }

  async tick(): Promise<void> {
    try {
      const removed = await purgeExpiredIdempotencyKeys(undefined, undefined, this.idempotencyKeys);
      if (removed > 0) {
        logInfo(`Idempotency cleanup: removed ${removed} expired key(s)`);
      }
    } catch (err: unknown) {
      logError(`Idempotency cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }
}
