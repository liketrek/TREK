import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { logError, logInfo } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { RouteUsageService } from './route-usage.service';

/**
 * Nightly retention for the routing counters.
 *
 * Runs even when counting is switched off, on purpose: switching it off should also
 * let what it already counted age out, rather than freezing the rows in place until
 * somebody remembers to press the wipe button.
 *
 * 3:45 AM, just after the shadow log's own sweep and clear of the 3:00 idempotency
 * purge and the backup window.
 */
@Injectable()
export class RouteUsageRetentionJob implements OnApplicationBootstrap {
  constructor(
    private readonly usage: RouteUsageService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    this.registrar.register('route-usage-retention', '45 3 * * *', () => this.tick());
  }

  tick(): void {
    try {
      const removed = this.usage.purgeExpired();
      if (removed > 0) {
        logInfo(`Route usage retention: removed ${removed} expired row(s)`);
      }
    } catch (err: unknown) {
      logError(`Route usage retention: ${err instanceof Error ? err.message : err}`);
    }
  }
}
