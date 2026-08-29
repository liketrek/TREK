import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { PlacePhotoCacheService } from './place-photo-cache.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Place-photo (Google/Wikimedia) cache cleanup: nightly — reclaim cached files
 * and meta rows no place references anymore (deleted places/trips, overwritten
 * image_url). Moved from src/scheduler.ts; injects the container singleton —
 * the in-flight dedup and known-on-disk set only work if the whole process
 * shares one.
 */
@Injectable()
export class PlacePhotoCacheJob implements OnApplicationBootstrap {
  constructor(
    private readonly cache: PlacePhotoCacheService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // Run once on startup to reclaim orphans left over from before this sweeper existed.
    void this.sweep();
    this.registrar.register('place-photo-cache', '30 3 * * *', () => {
      void this.sweep();
    });
  }

  async sweep(): Promise<void> {
    try {
      const removed = await this.cache.sweepOrphans();
      if (removed > 0) logInfo(`Place-photo cache cleanup: removed ${removed} orphaned file(s)/row(s)`);
    } catch (err: unknown) {
      logError(`Place-photo cache cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }
}
