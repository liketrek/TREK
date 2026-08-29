import { logInfo, logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { ThumbnailService } from './thumbnail.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

/**
 * Journey thumbnail cleanup: daily — reclaim journey/thumbs/ objects whose
 * photo row is gone (spec In-scope fix #2: delete sites only started removing
 * the derived thumb with this slice, so historical orphans need a sweeper).
 * The Journey addon gate lives inside sweepOrphanThumbs, so toggling the
 * addon takes effect without a restart.
 */
@Injectable()
export class JourneyThumbsJob implements OnApplicationBootstrap {
  constructor(
    private readonly thumbnails: ThumbnailService,
    private readonly registrar: CronRegistrarService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.registrar.isEnabled()) return;
    // Run once on startup to reclaim orphans left over from before this sweeper existed.
    void this.sweep();
    this.registrar.register('journey-thumbs', '0 4 * * *', () => {
      void this.sweep();
    });
  }

  async sweep(): Promise<void> {
    try {
      const removed = await this.thumbnails.sweepOrphanThumbs();
      if (removed > 0) logInfo(`Journey thumbnail cleanup: removed ${removed} orphaned thumbnail(s)`);
    } catch (err: unknown) {
      logError(`Journey thumbnail cleanup: ${err instanceof Error ? err.message : err}`);
    }
  }
}
