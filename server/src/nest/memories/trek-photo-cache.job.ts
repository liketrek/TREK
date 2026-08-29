import { logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Trek photo cache cleanup: every 2 hours — evict disk files and DB rows past
 * their 1h TTL (moved from src/scheduler.ts, which used to construct its own
 * TrekPhotoCacheService per sweep; this injects the container singleton).
 * Runs in the server-local zone — the old cron passed no timezone.
 */
@Injectable()
export class TrekPhotoCacheJob implements OnApplicationBootstrap {
  constructor(
    private readonly cache: TrekPhotoCacheService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // Run once immediately on startup to evict any entries left over from a previous run
    void (async () => {
      try {
        await this.cache.sweepExpired();
      } catch {
        /* cache dir may not exist yet — harmless */
      }
    })();
    this.registrar.register(
      'trek-photo-cache',
      '0 */2 * * *',
      () => {
        void this.tick();
      },
      { timezone: 'none' },
    );
  }

  async tick(): Promise<void> {
    try {
      await this.cache.sweepExpired();
    } catch (err: unknown) {
      logError(`Trek photo cache cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }
}
